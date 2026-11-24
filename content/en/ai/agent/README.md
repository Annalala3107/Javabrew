---
title: "AI Agent Topic: Agent Loop, Memory, Prompt, Context, MCP, and Skills"
description: "AI Agent interview and study roadmap, covering Agent Loop, Memory, Prompt Engineering, Context Engineering, MCP, Agent Skills, Harness Engineering, and AI Workflows."
category: AI
tag:
  - AI Agent
  - LLM
  - AI Application Development
sidebar: false
lang: en
sourceRef: zh-ref/ai/agent/README.md
---

An Agent is not merely a "chatbot that can call tools." Once tasks become long-running, it must handle state, memory, permissions, failure retries, context trimming, and execution boundaries.

This **AI Agent Topic** is designed for developers who want to understand and implement Agent applications, placing Agent Loop, Memory, Prompt, Context, Tools, MCP, Skills, Harness Engineering, and Workflows onto a single engineering storyline.

## Who Is This For

- Developers looking to understand the principles of AI Agents and how to implement them in engineering practice.
- Engineers building AI applications involving tool calling, automated tasks, multi-turn reasoning, and long-task execution.
- Candidates preparing for interview questions on Agents, MCP, Prompt, Context, Skills, and Workflows.

## Key Learning Points

- The difference between an Agent and a Workflow lies not in whether an LLM is called, but in whether there is an observation, planning, action, and feedback closed loop.
- Memory solves the problem of retaining information across conversation turns and tasks, but its lifecycle, storage boundaries, and privacy governance must be carefully designed.
- Prompt Engineering focuses more on instruction expression, whereas Context Engineering focuses more on placing the right information into the context window at the right time.
- MCP, Skills, and Harness Engineering determine whether an Agent can stably, securely, and scalably integrate with real-world tools and environments.

## Recommended Reading Order

1. [AI Agent Core Concepts](./agent-basis.md): Establish an overall understanding of Agents first.
2. [LLM Prompt Engineering](./prompt-engineering.md), [Context Engineering](./context-engineering.md): Understand how instructions and context collectively shape model outputs.
3. [AI Agent Memory System](./agent-memory.md): Flesh out short-term memory, long-term memory, and the memory lifecycle.
4. [Comprehensive Breakdown of the MCP Protocol](./mcp.md), [In-Depth Guide to Agent Skills](./skills.md): Understand tool integration and capability extension.
5. [Multi-Agent Collaboration System Design](./multi-agent.md): Understand task decomposition, state sharing, concurrency conflicts, and failure recovery.
6. [Harness Engineering: Six-Layer Inspection Framework, Context Management, and Engineering Practices](./harness-engineering.md), [Workflow, Graph, and Loop in AI Workflows](./workflow-graph-loop.md), [What Is Loop Engineering?](./loop-engineering.md): Move into production-grade Agent engineering.

When reading, take care to distinguish between the three levels of loops:

| Level | Responsibility | Corresponding Article |
| --- | --- | --- |
| Inner Agent Loop | Repeatedly reasons, calls tools, and reads results within a single task until completion or a stopping condition is triggered. | [AI Agent Core Concepts](./agent-basis.md#什么是-agent-loop) |
| Return Edges on Workflow Graphs | Returns to preceding nodes based on state and conditions, allowing local processes to continue iterating. | [Workflow, Graph, and Loop](./workflow-graph-loop.md#loop-graph-上的回溯) |
| Outer Loop Engineering | Connects existing loops to CI, scheduled tasks, and stopping conditions, determining when to launch the next round of tasks. | [Loop Engineering](./loop-engineering.md) |

## Core Articles

- [AI Agent Core Concepts](./agent-basis.md): Outlines the evolutionary journey of AI Agents, clarifying foundational concepts such as Agent Loop, Context Engineering, and Tools registration.
- [AI Agent Memory System](./agent-memory.md): Deep-dives into short-term and long-term memory design, covering memory storage formats, lifecycle operations, and production-grade engineering optimization strategies.
- [Multi-Agent Collaboration System Design](./multi-agent.md): Explores everything from task contracts, shared state, and conflict resolution to checkpoints, handoffs, compensation, and human-in-the-loop intervention.
- [LLM Prompt Engineering](./prompt-engineering.md): Covers the four elements of Prompts, common techniques, and enterprise-level security practices.
- [Context Engineering](./context-engineering.md): Master key techniques including static rule orchestration, dynamic information mounting, and Token budget degradation.
- [In-Depth Guide to Agent Skills](./skills.md): Understand the design philosophy of Skills, as well as the fundamental differences between Skills and Prompts, MCP, and Function Calling.
- [Comprehensive Breakdown of the MCP Protocol](./mcp.md): Understand core concepts, architectural design, and production-level best practices of the MCP protocol.
- [Harness Engineering: Six-Layer Inspection Framework, Context Management, and Engineering Practices](./harness-engineering.md): Dissects engineering approaches adopted by teams like OpenAI, Anthropic, and Stripe in Agent engineering.
- [Workflow, Graph, and Loop in AI Workflows](./workflow-graph-loop.md): Contrasts traditional workflows with AI workflows, covering implementations in Spring AI Alibaba and LangGraph.
- [What Is Loop Engineering? Why Is It Old Wine in New Bottles?](./loop-engineering.md): Places Loop Engineering back into the context of Agent Loop, Context, Harness, Skills, MCP, and verification closed loops to understand what is truly new.

Comprehensive content on tool calling and evaluation is available in existing articles:

- [Structured Output and Function Calling](../llm-basis/structured-output-function-calling.md): Covers the end-to-end tool calling pipeline, permissions, secondary confirmation, idempotency, auditing, timeouts, and Java code examples.
- [How to Evaluate Agent Applications](../llm-basis/llm-evaluation.md#agent-应用怎么评测): Covers metrics such as task completion rate, tool calls, execution trajectories, error recovery, and consistency across multiple runs.

## Frequently Asked Questions

- What are the differences between an Agent and a Workflow, a Chatbot, or standard tool calling?
- What are the respective roles of observation, planning, action, and reflection in the Agent Loop?
- What should Memory store and what should it omit? How do we prevent contamination and privacy risks?
- Why must Prompt Engineering and Context Engineering not be conflated?
- Where are the respective boundaries of MCP, Skills, and Function Calling?
- How do long-running task Agents control context, permissions, failure retries, and observability?

## Related Topics

- [AI Application Development Knowledge System](../)
- [LLM Fundamentals Topic](../llm-basis/)
- [RAG Topic](../rag/)
- [AI Application Development Interview Questions Topic](../interview-questions/)
- [How to Present Agent Projects in an Interview](../interview-questions/agent-project-interview-guide.md)

## Summary

The engineering challenges of Agents emerge progressively as tasks become longer: the model must make decisions in a loop based on state, historical information must be stored and retrieved, external tools require explicit access, permission, and audit rules, and failures must be replayable and manageable.

When reading, begin by clarifying the distinct responsibilities of Agents, Workflows, and ordinary tool calling, then fill in the implementation details along the pipeline of Prompt, Context, Memory, MCP, Skills, and Harness. When working on specific projects, start with the smallest verifiable closed loop, adding mechanisms as concrete issues arise with context, cost, permissions, or stability.
