---
title: "AI Application Development Knowledge System: LLMs, Agents, RAG, MCP, Prompt Engineering, and System Design"
description: "AI application development interview and learning roadmap, organizing LLM API calls, Agents, RAG, Skills, MCP, Prompt engineering, vector databases, evaluation, and system design for backend developers."
category: AI
tag:
  - AI
  - LLM
  - AI Application Development
  - Backend Interview
icon: mdi:robot-outline
sitemap:
  changefreq: weekly
  priority: 1
head:
  - - meta
    - name: keywords
      content: AI Application Development, AI Application Development Interview, AI Engineer Interview, LLM, LLM Interview, Agent, Agent Interview, RAG, RAG Interview, MCP, Prompt Engineering, Vector Database, AI System Design, AI Coding Interview
  - - meta
    - property: og:title
      content: "AI Application Development Knowledge System: LLMs, Agents, RAG, MCP, Prompt Engineering, and System Design"
  - - meta
    - property: og:description
      content: "From LLM calls, Agents, RAG, MCP, and Prompt engineering to evaluation and system design, outlining the essential knowledge backend developers need to transition into AI application development."
lang: en
sourceRef: zh-ref/ai/README.md
---

Building AI applications is not just about stuffing a Prompt into an API endpoint. Once you get into real-world projects, you will immediately run into challenges such as context window length, structured outputs, RAG retrieval recall, tool permissions, evaluation regressions, cost, and stability.

These issues cannot be solved in isolation. LLM fundamentals, Agents, RAG, tool calling, and system design must be understood holistically—if you only know how to invoke APIs, you will get stuck during architecture reviews; if you are only familiar with RAG papers, you still won't know how to handle incremental updates and version deduplication when maintaining a production knowledge base.

If your time is limited, start with the [AI Application Development Interview Guide](./interview-questions/ai-interview-guide.md) to review the most frequently asked questions across LLMs, Agents, RAG, Skills, MCP, and AI system design; if you want to build a solid foundation, proceed with the suggested reading order below.

The contents of this column are organized around LLM Fundamentals, Agents, RAG, and System Design, interconnected through reading sequence and cross-links:

![AIGuide Content Overview with Detailed Diagrams](/media/jg/ext/oss.javaguide.cn/github/aiguide/aiguide-overview-b9f49b36.png)

This column's content is simultaneously published in the open-source AIGuide project:

- **Project Repository**: [https://github.com/Snailclimb/AIGuide](https://github.com/Snailclimb/AIGuide)
- **Online Reading**: [https://javaguide.cn/ai/](https://javaguide.cn/ai/)

Articles are continuously updated as APIs, frameworks, and model capabilities evolve. Please consult the corresponding official documentation for specific versions, pricing, and product capabilities.

## Who Is This For?

- Engineers transitioning from backend development to AI application development who want to master the main tracks: LLMs, Agents, RAG, and system design.
- Candidates preparing for AI Engineer, AI Application Development, or Backend-to-AI transition interviews.
- Developers who have built Prompt demos but are not yet familiar with LLM invocation pipelines, structured outputs, RAG retrieval optimization, and evaluation loops.
- Readers who want to understand concepts like MCP, Function Calling, Tool Calling, vector databases, and model gateways in real-world production projects.
- Team members whose projects have already integrated LLMs but are beginning to face stability, cost, security governance, and quality regression issues.

## Common Pitfalls to Avoid

An LLM cannot be treated simply as a black-box API. Truncated tokens, drifting outputs caused by changing sampling parameters, or broken JSON responses despite instructions cannot be fully resolved by Prompts alone. Adding "Please output strictly in JSON" to your prompt is only a first-layer constraint; going into production requires format validation, retries, fallbacks, and exception handling throughout the invocation pipeline.

An Agent is also far more than just automatically invoking tools. The real challenges lie in Memory and Context Engineering. Without proper context management, an Agent easily drifts off topic after several turns—forgetting what was previously said, losing track of the current task step, or misusing outdated tool results. This is even more pronounced in long-running tasks: sometimes the model isn't incapable, but rather gets caught in a loop, running until tokens are nearly exhausted before stopping.

When RAG answers inappropriately or irrelevantly, do not rush to blame the model. Most issues originate in the retrieval phase: chunks are split too coarsely, queries lack rewriting, keyword search is not combined with vector search, or reranking is missing. Systematically debugging the retrieval pipeline is often far more effective than swapping in a more expensive model.

MCP, Function Calling, and Tool Calling solve the problem of how tools are integrated. Standardizing protocols makes integration straightforward, but in production, the real complexities appear downstream: who is authorized to invoke this tool, what data can be accessed or modified, how invocation logs are audited, and how rollbacks are handled upon failure. If these are not properly designed, no standard protocol will be sufficient.

Once an AI application goes live, issues like stability, observability, cost control, and quality regressions immediately surface. You rarely notice them in the demo stage because call volumes are small and scenarios are clean. But once hooked up to real business traffic, any team building production-grade AI applications for the first time will inevitably learn these lessons the hard way.

## Suggested Reading Order

1. [AI Core Concepts Overview](./ai-core-concepts.md): First align LLM, Token, Agent, RAG, MCP, Skills, and ReAct along the same conceptual pipeline.
2. [AI Application Development Interview Guide](./interview-questions/ai-interview-guide.md): Build a checklist of high-frequency questions to understand what interviewers and post-mortems probe most often.
3. [LLM Operation Mechanism](./llm-basis/llm-operation-mechanism.md), [LLM API Invocation Engineering Practice](./llm-basis/llm-api-engineering.md): Understand the invocation pipeline, context, and structured responses.
4. [AI Agent Core Concepts](./agent/agent-basis.md), [Prompt Engineering for LLMs](./agent/prompt-engineering.md), [Context Engineering](./agent/context-engineering.md): Establish foundational knowledge of Agents, Prompts, and Context.
5. [Multi-Agent Collaboration System Design](./agent/multi-agent.md): Proceed to learn task decomposition, state sharing, conflict resolution, and failure recovery.

   For the complete sequence covering Memory, MCP, Skills, Harness, Workflow, and Loop, refer to the [Agent Topic README](./agent/README.md).

6. [RAG Fundamentals](./rag/rag-basis.md), [RAG Document Processing & Chunking Strategies](./rag/rag-document-processing.md), [RAG Retrieval Optimization](./rag/rag-optimization.md): Complete the core path for enterprise knowledge base Q&A.
7. [AI Application System Design](./system-design/ai-application-architecture.md), [LLM/Agent Security in Practice](./system-design/llm-security.md), [Deep Dive into LLM Gateways](./system-design/llm-gateway.md), [AI Application Evaluation Framework](./llm-basis/llm-evaluation.md): Transition the demo into a real backend system by adding permissions, security, gateways, evaluation, and governance.

## Core Articles

### Interview & Review Roadmap

- [AI Core Concepts Overview](./ai-core-concepts.md): Connects core concepts like LLM, Token, MCP, Skills, ReAct, Embedding, and GraphRAG across LLM fundamentals, Agents, and RAG tracks.
- [AI Application Development Interview Questions Series](./interview-questions/): Organizes the review roadmap by LLM fundamentals, AI Agents, RAG, and AI system design.
- [AI Application Development Interview Guide](./interview-questions/ai-interview-guide.md): Consolidates common AI application development interview follow-ups into a unified review path; ideal starting point.
- [LLM Fundamentals Interview Questions Summary](./interview-questions/llm-interview-questions.md): Covers Tokens, context windows, sampling parameters, API invocations, structured outputs, and evaluation frameworks.
- [AI Agent Interview Questions Summary](./interview-questions/agent-interview-questions.md): Covers Agent Loop, Memory, Prompts, Context, MCP, Skills, Harness Engineering, and workflows.
- [How to Present an Agent Project in an Interview](./interview-questions/agent-project-interview-guide.md): From system architecture and technical selection to evidence of efficacy and badcase post-mortems, helping you structure real projects into comprehensive interview answers.
- [RAG Interview Questions Summary](./interview-questions/rag-interview-questions.md): Covers RAG fundamentals, vector databases, document processing, retrieval optimization, GraphRAG, knowledge base updates, and evaluation.
- [AI System Design Interview Questions Summary](./interview-questions/ai-system-design-interview-questions.md): Covers production-grade AI application architecture, model gateways, observability, evaluation, security governance, and real-time voice Agents.

### LLM Fundamentals

- [LLM Fundamentals Series](./llm-basis/): From model execution mechanisms, API invocations, and structured outputs to AI application evaluation—mastering the invocation pipeline first.
- [LLM Operation Mechanism: How Tokens, Context Windows, and Sampling Parameters Affect Output](./llm-basis/llm-operation-mechanism.md): Translates concepts like Tokens, context windows, and Temperature into clear, controllable engineering parameters.
- [LLM API Invocation Engineering Practice](./llm-basis/llm-api-engineering.md): Deconstructs Prompt assembly, model gateways, streaming responses, retry rate-limiting, and structured returns.
- [Deep Dive into LLM Structured Outputs](./llm-basis/structured-output-function-calling.md): Explains the underlying pipeline of JSON Schema, Function Calling, Tool Calling, and MCP.
- [AI Application Evaluation Framework](./llm-basis/llm-evaluation.md): Covers Golden Sets, LLM-as-Judge, RAG/Agent metrics, Trace replay, and online canary rollouts.

### AI Agent

- [AI Agent Series](./agent/): From Agent fundamentals, Memory, Prompts, and Context to MCP, Skills, and Harness Engineering.
- [AI Agent Core Concepts](./agent/agent-basis.md): Understand the differences between Agents, traditional programming, and Workflows, as well as core concepts like Agent Loop and Tools registration.
- [AI Agent Memory Systems](./agent/agent-memory.md): Deep dive into short-term memory, long-term memory, memory lifecycle, and production optimization strategies.
- [Multi-Agent Collaboration System Design](./agent/multi-agent.md): Clarifies when Multi-Agent systems are needed, and how to implement task decomposition, state sharing, conflict resolution, and failure recovery.
- [Prompt Engineering for LLMs](./agent/prompt-engineering.md): Master the four key elements of Prompts, common techniques, and Prompt injection defenses.
- [Context Engineering](./agent/context-engineering.md): Understand static rule orchestration, dynamic information mounting, token budget degradation, and context persistence.
- [Comprehensive Guide to the MCP Protocol](./agent/mcp.md): Understand MCP's layered architecture, core capabilities, and production practices for MCP Servers.
- [Comprehensive Guide to Agent Skills](./agent/skills.md): Understand the essential differences between Skills, Prompts, MCP, and Function Calling.
- [Harness Engineering: Six-Layer Inspection Framework, Context Management, and Engineering Practice](./agent/harness-engineering.md): Deconstructs the Model + Harness engineering architecture and team best practices.
- [Workflows, Graphs, and Loops in AI Workflows](./agent/workflow-graph-loop.md): Understand nodes, edges, states, security boundaries, and implementation patterns in AI workflows.
- [What Is Loop Engineering? Why Is It "Old Wine in New Bottles"?](./agent/loop-engineering.md): Explains triggers, context, verification, state, and stopping conditions in outer loops for coding Agents.

### RAG (Retrieval-Augmented Generation)

- [RAG Series](./rag/): Centered on enterprise knowledge base Q&A, organizing document processing, vector databases, GraphRAG, retrieval optimization, and knowledge base updates.
- [RAG Fundamentals](./rag/rag-basis.md): Understand what RAG is, why it is needed, its core advantages, and its limitations.
- [RAG Document Processing & Chunking Strategies](./rag/rag-document-processing.md): Covers document parsing, cleaning, structuring, Chunking, and multimodal content processing.
- [RAG Vector Indexing Algorithms and Vector Databases](./rag/rag-vector-store.md): Master indexing algorithms like HNSW, IVFFLAT, and vector database selection.
- [RAG Retrieval Optimization](./rag/rag-optimization.md): Covers Chunking strategies, Hybrid Search, Query Rewrite, Rerank, and context compression.
- [GraphRAG](./rag/graphrag.md): Understand entities, relationships, community detection, global retrieval, and local retrieval.
- [RAG Knowledge Base Document Update Strategies](./rag/rag-knowledge-update.md): Master incremental updates, version control, deduplication, and full rebuilds.

### AI System Design

- [AI System Design Series](./system-design/): Placing Prompt demos into real backend systems, focusing on architecture, model gateways, voice pipelines, observability, evaluation, and security governance.
- [AI Application System Design](./system-design/ai-application-architecture.md): Moving Prompt demos into production pipelines, covering Prompt management, model gateways, RAG, Memory, Tool calling, observability, evaluation, and security compliance.
- [LLM/Agent Security in Practice](./system-design/llm-security.md): Covers direct and indirect Prompt Injection, tool privilege escalation, MCP authorization, sensitive data handling, code sandboxes, supply chain security, and security regressions.
- [Deep Dive into LLM Gateways](./system-design/llm-gateway.md): Understand multi-model routing, fallbacks, rate limiting, quotas, cost attribution, observability, auditing, and caching strategies in LLM Gateways.
- [AI Voice Technology Explained](./system-design/ai-voice.md): Deconstructs VAD, ASR, LLM, TTS, streaming playback, interruption handling, and edge-cloud hybrid architectural choices.

## High-Frequency Questions

- How do LLM Tokens, context windows, Temperature, and Top P affect output behavior?
- Why can't structured output rely solely on Prompts? What specific problems do JSON Schema, Function Calling, and server-side validation solve?
- What is the difference between an Agent and a Workflow? How do observe, plan, act, and reflect collaborate in an Agent Loop?
- What is the difference between Prompt Engineering and Context Engineering?
- What problem does MCP solve? What is its relationship with Function Calling and Tool Calling?
- Why does RAG produce irrelevant or incorrect answers? Should debugging start from retrieval, ranking, context compression, or generation?
- How do you select a vector database? What scenarios are indexing algorithms like HNSW and IVFFLAT suitable for?
- How should AI applications be evaluated? How do Golden Sets, LLM-as-Judge, online canary releases, and Trace replays tie together?
- Why do production-grade AI applications require a model gateway? How do you implement rate limiting, fallbacks, cost control, and auditing?

## Related Topics

- [AI Coding Practical Guide](../ai-coding/)
- [System Design](../system-design/)
- [High Availability Knowledge System](../high-availability/)
- [High Performance Knowledge System](../high-performance/)
- [Distributed Systems Knowledge System](../distributed-system/)
