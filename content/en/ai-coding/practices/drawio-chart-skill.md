---
title: "JavaGuide's Exclusive draw.io Diagramming Skill Open-Sourced: Generating Editable draw.io Technical Diagrams with Agents"
description: "Sharing the design concepts, installation methods, and workflows of the drawio-chart Skill, explaining why preserving editable .drawio source files is essential for technical writing diagrams, and how to guide Agents to generate maintainable flowcharts, architecture diagrams, and module relationship maps."
category: AI Coding in Practice
tag:
  - AI Coding
  - Skills
  - draw.io
  - Codex
  - Technical Writing
lang: en
sourceRef: zh-ref/ai-coding/practices/drawio-chart-skill.md
head:
  - - meta
    - name: keywords
      content: draw.io,drawio-chart,Agent Skills,AI coding,technical writing diagrams,Codex,diagrams.net
---

Hello, I'm Xiao G. Often, the profound impact of the AI era hits me not through grand proclamations, but through everyday details.

In the past, drafting a technical article took me at least a week, and sometimes even a whole month. Roughly a third of that time was consumed by the tedious chore of drawing diagrams.

Readers familiar with my work know that many diagrams across [JavaGuide](https://mp.weixin.qq.com/s/MP8_Td9h72jAhTntVV4DxQ) were manually drawn using draw.io. Almost every article includes extensive visual illustrations to aid conceptual understanding.

![Common Java Basics Interview Questions](/media/jg/ext/oss.javaguide.cn/github/javaguide/intro/java-basic-questions-01-overview-7d19e02d.png)

![MySQL Common Interview Questions Summary](/media/jg/ext/oss.javaguide.cn/github/javaguide/intro/mysql-questions-01-962b5402.png)

However, entering the AI era changed everything completely—especially when it comes to creating draw.io diagrams.

Last year, before Skills became popular, I had AI generate raw XML directly, and then manually imported that into draw.io.

Today, thanks to the emergence of Skills, generating draw.io illustrations has become significantly more automated.

This article shares the custom draw.io diagramming Skill I routinely use: [`drawio-chart`](https://github.com/Snailclimb/AIGuide/tree/main/skills/drawio-chart), and touches upon why I haven't transitioned entirely to diffusion-based image generation models, opting instead to preserve editable `.drawio` source files.

## Why Choose draw.io?

Evaluating a diagram cannot stop at whether it looks pretty when generated; whether it can be edited later is equally vital.

After a technical article is published, titles, nodes, arrows, and terminology frequently require fine-tuning. If you only hold a static PNG, your only options are regenerating from scratch or awkwardly editing pixel data, with no guarantee that the updated style will match the original aesthetic.

That is why I prefer keeping an editable source file.

On my local machine, I retain these `.drawio` source files inside dedicated asset directories. Whenever a specific illustration needs adjusting, I simply open that file directly.

![Locally preserved draw.io illustration source files](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/local-drawio-source-files-ceadfec7.png)

This is the beauty of `draw.io`: `.drawio` files can be continuously edited in diagrams.net or draw.io desktop apps, and exporting to PNG, SVG, or PDF is effortless. For technical diagrams like flowcharts, architecture diagrams, and state machines, source files are typically lightweight, posing zero burden when tracked in git repositories or local assets folders.

Exporting requires no convoluted acrobatics—the file menu directly provides PNG, JPEG, WebP, SVG, and PDF options.

![draw.io export format options](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/drawio-export-format-options-6dc45b61.png)

When Skills first arrived, I formalized this workflow into a dedicated Skill: [`drawio-chart`](https://github.com/Snailclimb/AIGuide/tree/main/skills/drawio-chart).

Many of the diagrams you currently see across [javaguide.cn](https://javaguide.cn/) regarding AI coding, Spec Coding, and Claude Code were produced using this exact approach:

- Have the Agent extract structure, arrange nodes, and generate `.drawio` files first, then export images as required by the article;
- When heightened visual polish is needed, pair with GPT-IMG2 for downstream refinement.

## Why Not Rely Solely on Image Generation?

I previously explored several alternatives.

[`tt-a1i/archify`](https://github.com/tt-a1i/archify) resembles generating self-contained HTML technical diagrams using natural language, supporting theme switching, multi-format export, and validation rendering pipelines.

[`coleam00/excalidraw-diagram-skill`](https://github.com/coleam00/excalidraw-diagram-skill) leans into the Excalidraw aesthetic—well-suited for whiteboard brainstorming and opinion pieces—using Playwright to catch text overlaps, misaligned arrows, and spacing imbalances.

[`DayuanJiang/next-ai-draw-io`](https://github.com/DayuanJiang/next-ai-draw-io) behaves more like an independent AI drawing product, integrating AI into draw.io with support for web demos, desktop apps, Docker, local installs, MCP servers, and multi-model routing. In my testing, it felt somewhat laggy and drawing efficiency wasn't ideal. However, that project is actively updated, and since I haven't benchmarked it recently, I won't pass judgment on its current performance.

Each project has its niche: Archify produces polished HTML deliverables, Excalidraw fits whiteboard ideation, and next-ai-draw-io acts as a standalone product.

However, in the context of JavaGuide technical articles, my recurring requirements look like this:

- Diagrams contain numerous Chinese technical terms requiring frequent subsequent tweaks.
- Color palettes, fonts, and node styles across a series of articles must remain uniform.
- Diagrams must easily embed into Markdown, WeChat Official Accounts, websites, and repository documentation.
- When an article updates, only modifying a couple of nodes is far preferable to regenerating the entire diagram.

Under these constraints, `.drawio` source files are vastly superior.

Spinning up a heavyweight external drawing application feels excessive for article illustrations. Coding Agents already inspect articles, edit files, execute commands, and organize assets; having them invoke a Skill to generate `.drawio` files and batch export images keeps the workflow far leaner.

Image generation models excel at enhancing visual atmosphere, but fall short for long-term maintenance. If you tweak a single term today and add a branch tomorrow, getting a diffusion model to precisely alter that small segment without distorting the rest of the diagram is nearly impossible.

draw.io doesn't produce "cinematic posters" out of the box, but nodes, connectors, containers, and labels can all be continually edited. For technical illustrations, that adaptability is invaluable.

## My Current Diagramming Workflow

My typical routine looks roughly like this:

1. Draft the article first, or at least structure the main storyline, process flows, and conceptual relationships.
2. Have the Agent identify which sections in the article warrant diagrams.
3. Use `$drawio-chart` to generate `.drawio` source files.
4. Export PNG / SVG / PDF upon publishing.
5. If a diagram requires greater visual presence, process it further with GPT-IMG2.

What matters most to me is decoupling structure from presentation.

`drawio-chart` handles structured diagrams: how processes flow, how modules connect, how states transition, and which nodes belong to a logical group. GPT-IMG2 excels at bitmap-level enhancements, making an illustration look more visually cohesive and polished.

The underlying structure remains safely preserved within `.drawio`, ready for future revisions at any time.

Below is an actual run generating a `.drawio` file. After reading the requirements, the Agent writes the source file directly, returning the file path and structural explanation.

![Codex generating draw.io source file using drawio-chart](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/codex-generate-drawio-source-0663cad4.png)

Once opened, it is a standard draw.io document. Nodes, connectors, and text can all be adjusted manually without being locked into a static bitmap.

![Opening generated SKILL.md structure diagram in draw.io](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/drawio-open-generated-source-80ae3910.png)

This is the raw diagram immediately after generation without manual tweaks. You can observe minor edge adjustments that benefit from quick manual polish—which is completely normal.

Here are a few illustrations created using this Skill.

This `CLAUDE.md` maintenance decision flowchart exemplifies a procedural decision diagram:

![CLAUDE.md maintenance decision process](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-maintenance-flow-f46367ef.png)

Multi-Agent collaboration can easily look like an undifferentiated soup of role names if described in pure text. Visualized as a pipeline, each Agent's responsibility and information handoffs become immediately intuitive.

![Multi-Agent 3-Agent Collaboration Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-multi-agent-pipeline-f6ec4d47.png)

Spec Coding articles follow the same logic. It discusses a workflow rather than an isolated concept. Linking requirements, Specs, implementation, and verification visually allows readers to grasp the macro picture before zooming into text details.

![Spec Coding Specification-Driven Programming Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

Similarly, diagrams like Spec Management Strategies can be convoluted to explain in text alone. Concepts like layered filtering, precise retrieval, and context control are far easier to absorb when presented on a single canvas.

![Spec Management Strategy: Layered Filtering + Precise Retrieval](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-spec-management-strategy-4ded0946.png)

Not every diagram needs to be completed 100% by AI in one pass. The vast majority of time savings occurs in the initial phase: the Agent lays out the structure, and human hands polish nuances to match the article's voice.

If technical diagrams drift out of sync with article text, trouble ensues. If nodes, headings, and connectors fail to align with the narrative, no amount of visual polish can save them.

## What Does the `drawio-chart` Skill Do?

As I described in [What Are Agent Skills? How Do They Differ from Prompts and MCP?](https://javaguide.cn/ai/agent/skills.html), a Skill behaves like an on-demand task directive.

It is not an invention of a new tool, nor is it equivalent to Function Calling or MCP. It addresses: how to execute a specific class of tasks, when to execute them, which steps cannot be skipped, and which reference materials to consult.

`drawio-chart` codifies the workflow of "diagramming draw.io illustrations for technical articles" into a reusable Skill.

Its primary file is [`SKILL.md`](https://github.com/Snailclimb/AIGuide/blob/main/skills/drawio-chart/SKILL.md), which contains several core pieces of guidance:

- When it should be triggered: draw.io, diagrams.net, flowcharts, architecture diagrams, sequence diagrams, ER diagrams, state machines, mind maps.
- When it should NOT be triggered: when the user explicitly requests Mermaid code, bitmap illustrations, marketing posters, or whiteboard doodles.
- Information to gather before diagramming: topic, chart type, core nodes, node relationships, export requirements.
- Execution sequence for generating `.drawio`: title, containers, core nodes, connectors, labels.
- Pre-delivery verification checklist: completeness of nodes, accuracy of relationships, conciseness of edge labels, standard file naming.

Finer implementation details are not shoved into `SKILL.md`.

Instead, they are segregated into multiple `references/` documents:

| File | Content |
| --- | --- |
| `style-spec.md` | Palettes, typography, node semantics, connector styles |
| `xml-and-layout.md` | draw.io XML structure, node templates, connector templates, layout suggestions |
| `export-and-files.md` | PNG / SVG / PDF export CLI commands, file naming, delivery rules |
| `use-cases.md` | Common prompts, multi-diagram article patterns, page naming advice |

This modular decomposition aligns with the design principles of Skills.

The primary file should not become an unwieldy README. The Agent learns what the Skill handles upfront; once a task triggers it, it loads corresponding reference files on demand based on current needs.

For instance, when merely generating a flowchart, there is no need to ingest the complete export specification. If the user explicitly requests PNG export, the Agent loads `export-and-files.md`. When fine-tuning visual styles, it references `style-spec.md`.

This prevents the context window from being cluttered with irrelevant details, resulting in more stable execution.

## What Constraints Did I Add?

Diagramming easily spins out of control.

When Agents generate diagrams without strict guardrails, several recurring problems appear: excessively wordy node labels, connector labels colliding with arrowheads, chaotic color palettes resembling random splashing, every connector carrying lengthy explanations, and raw HTML tags injected into XML that later cause rendering or editing errors.

Therefore, `drawio-chart` enforces explicit, concrete constraints.

For styling, the Agent never picks colors randomly on the fly. Colors are mapped semantically: entry points, business services, infrastructure, clients, external dependencies, databases, caches, message queues, and error states all possess defined hex codes. When readers review multiple diagrams in a series, they don't need to re-learn color meanings for each image.

For typography, it mandates that `mxCell.value` defaults to plain text. When line breaks are necessary, use XML newline entities rather than polluting node values with `<br>` or `<b>` HTML tags.

Connector labels must remain concise. Do not attach long explanations to short connector lines; place context inside node labels or adjacent annotations instead. Much of the visual clutter in technical diagrams originates from "trying to explain everything on every line."

For exporting, it defaults to retaining the `.drawio` source file first, exporting derivative images as requested. Even if image export fails, the source file must never be deleted.

## Installation and Usage

I have open-sourced this Skill in the [AIGuide: AI Application Development, AI Coding in Practice, and Interview Guide](https://github.com/Snailclimb/AIGuide) repository:

- Repository: **<https://github.com/Snailclimb/AIGuide/tree/main/skills>**
- Skill Directory: **<https://github.com/Snailclimb/AIGuide/tree/main/skills/drawio-chart>**

If you use the `npx skills` ecosystem, install via:

```bash
npx skills add Snailclimb/AIGuide/skills/drawio-chart
```

If installing strictly for Codex, specify the agent directly:

```bash
npx -y skills add Snailclimb/AIGuide/skills/drawio-chart --agent codex --yes
```

If you primarily work inside Codex, you can also install directly from GitHub:

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo Snailclimb/AIGuide \
  --path skills/drawio-chart
```

Note: In versions like `skills@1.5.15`, running `npx skills add Snailclimb/AIGuide --path skills/drawio-chart` might still scan all Skills in the repository first. A more reliable syntax is writing `skills/drawio-chart` directly into the source identifier, as shown above: `Snailclimb/AIGuide/skills/drawio-chart`.

During installation, you will see it identify the repository source, locate `drawio-chart`, and prompt you to select the target agent and installation scope.

![Installing drawio-chart using Skills CLI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/skills-cli-install-drawio-chart-6eff3497.png)

Codex sometimes doesn't rescan newly installed Skills immediately; I usually restart it once before using.

When starting out, don't leave the Agent guessing. Explicitly invoke `$drawio-chart` to ensure it enters the correct workflow. For example, to draw a login flowchart:

```text
Use $drawio-chart to draw a user login flowchart containing:
Enter credentials -> Validate credentials -> Success redirects to home -> Failure prompts error and allows retry.
Require exporting to PNG.
```

When diagramming an entire article, I rarely mandate "draw exactly N diagrams" upfront. A smoother approach is passing the article file path and having it identify truly valuable structures first, followed by format constraints:

```text
Use $drawio-chart to inspect this article and generate appropriate technical diagrams.
Place all diagrams within a single draw.io file, with each sub-diagram as a diagram page.
Keep the main file name identical to the article file name, and name pages using lowercase-kebab-case.
Follow drawio-chart unified styling conventions.
```

Never just toss out "help me draw an architecture diagram." For a microservices architecture, clarify which services, data stores, and external dependencies exist, where traffic enters, which calls are synchronous, and which flows traverse asynchronous messaging queues.

When you provide explicit diagram requirements, the output will land much closer to a publish-ready asset. Giving an ambiguous title almost guarantees manual rework later.

## Which Diagrams Suit draw.io Best?

I primarily delegate three categories of diagrams to `drawio-chart`.

First are process and flow diagrams within articles: Spec Coding, `CLAUDE.md` maintenance policies, and multi-agent pipelines. These diagrams feature distinct sequential steps and branches where draw.io shines for manual fine-tuning.

Second are architecture maps and module relationship diagrams. The biggest headache here is inconsistent styling: maintaining consistent colors for services, databases, and third-party integrations across an entire article makes reading vastly more effortless.

Third are living diagrams subject to iterative edits. After publication, titles, node labels, arrow directions, and export dimensions frequently shift. As long as the `.drawio` source is available, updates are painless.

I rarely use it for cover banners, promotional posters, or atmospheric product visuals—those are far better suited for GPT-IMG2. For hand-drawn whiteboard aesthetics, Excalidraw is more appropriate; for theme-switching, self-contained HTML with web interactivity, Archify is well worth exploring.
