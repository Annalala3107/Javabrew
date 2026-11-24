---
title: LLM Fundamentals Interview Questions Summary
description: Systematically compiling high-frequency LLM interview questions, covering Tokens, context windows, sampling parameters, API invocations, streaming outputs, structured outputs, Function Calling, MCP, AI application evaluation, and linking to reference articles.
category: AI
tag:
  - LLM Interview
  - Large Model Interview
  - AI Interview
head:
  - - meta
    - name: keywords
      content: LLM interview questions, LLM interview, Token interview questions, context window interview questions, Function Calling interview questions, structured output interview questions, AI application evaluation interview questions
lang: en
sourceRef: zh-ref/ai/interview-questions/llm-interview-questions.md
---

A single LLM invocation begins with tokenization, proceeds through context assembly and sampling generation, and is subsequently handled by the backend for streaming responses, rate limiting, retries, structured parsing, and logging. Fundamentals interview questions follow this exact invocation pipeline to probe deeper into cost, latency, stability, and security concerns.

The questions below are organized by chapter matching the JavaGuide LLM Fundamentals topic. Detailed principles and engineering code samples reside in their respective articles. Key knowledge points and questions are compiled here for concentrated review.

## LLM Runtime Mechanisms

Related article: [LLM Runtime Mechanisms: How Tokens, Context Windows, and Sampling Parameters Shape Outputs](../llm-basis/llm-operation-mechanism.md)

Tokens, context windows, and sampling parameters collectively determine how much information can be ingested in a single call, how many resources are consumed, and how much variance the output will exhibit. This cluster of questions frequently leads to follow-up inquiries regarding long conversations, RAG evidence, and structured output.

Common Interview Questions:

- What is a Token? Why do Chinese, English, and code consume different amounts of Tokens?
- What is a context window? Does a larger context window always guarantee better results?
- What is the "Lost in the Middle" problem? How can it be mitigated in long-context scenarios?
- What do Temperature, Top-P, and Top-K control respectively? How should they be configured in production for optimal stability?
- Why might model output still exhibit non-determinism even when Temperature is set to 0?
- Why do large language models hallucinate? What are the common mitigation strategies?
- How do you estimate a Token budget? How do you balance trade-offs among user inputs, outputs, conversation history, and RAG evidence?
- Will large context windows eventually replace RAG? What scenarios are each best suited for?

![Tokenization Process Example](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-token-process-f3c248b4.png)

## API Invocation Engineering

Related article: [LLM API Invocation Engineering: Streaming Output, Retries, Rate Limiting, and Structured Responses](../llm-basis/llm-api-engineering.md)

Model APIs differ significantly from traditional business endpoints in their response latency, billing models, and error modes. Interviews typically examine streaming, retries, idempotency, rate limiting, and model gateways within a unified invocation chain.

Common Interview Questions:

- What is the complete end-to-end pipeline of an LLM API invocation?
- Why does streaming output improve user experience? Does it reduce total end-to-end latency or Token cost?
- How do you choose between SSE, WebSocket, and HTTP Chunked transfer in streaming scenarios?
- Which LLM API errors can be safely retried, and which cannot?
- Why is idempotency mandatory for LLM invocations?
- Why can't LLM rate limiting rely solely on QPS (Queries Per Second)?
- What core capabilities should an AI model gateway provide?
- What essential fields must be recorded in an AI application's invocation logs?

## Structured Output and Tool Calling

Related article: [LLM Structured Output: From JSON Contracts to Production Function Calling](../llm-basis/structured-output-function-calling.md)

Whenever model output enters a business backend system, it requires schema validation, field constraints, and execution permission enforcement. Candidates frequently confuse JSON Mode, Structured Outputs, Function Calling, MCP Tools, and standard HTTP APIs.

Common Interview Questions:

- Why is simply prompting "Please return JSON" unreliable in production?
- What is the difference between JSON Mode and Structured Outputs?
- What problem does JSON Schema solve in LLM applications?
- What is the complete workflow of Function Calling?
- What is the difference between Function Calling and MCP (Model Context Protocol)?
- How does an MCP Tool relate to a standard HTTP API?
- Are Agent Skills and Function Calling the same thing?
- How should the system handle structured output parsing failures?
- Why is security governance mandatory for tool calling?
- How would you summarize structured output in a single sentence during an interview?

## AI Application Evaluation

Related article: [AI Application Evaluation Architecture: From Golden Set Construction to Production Canary Loops](../llm-basis/llm-evaluation.md)

Evaluation questions focus on how to empirically prove that a model, prompt, or architectural change actually delivered tangible improvements. Golden Sets, LLM-as-a-Judge, trace replay, and production canary rollouts cover different testing stages—relying solely on public benchmarks or a handful of demo test cases is insufficient.

Common Interview Questions:

- Why can't public benchmarks alone evaluate the quality of a specific enterprise AI application?
- How should a Golden Set be constructed? What should you do during cold start when production logs are unavailable?
- What are the primary biases of LLM-as-a-Judge? How can they be mitigated?
- Why must RAG evaluation be strictly separated into retrieval and generation phases?
- Why is evaluating AI Agents significantly more complex than standard Q&A or RAG?
- What distinct problems do offline evaluation, trace replay, and production canary deployments solve?
- How can CI-based AI evaluation strike the right balance between execution speed and test coverage?
- How should you handle discrepancies when LLM-as-a-Judge evaluations conflict with human review results?

## Comprehensive Scenario-Based Questions

- When a customer service bot's conversation history grows continuously, how do you allocate the Token budget while preserving critical business state?
- If a streaming response disconnects midway through generation, how should the backend server handle retries, resumption, and preventing duplicate billing?
- When an upstream model provider triggers RPM or TPM rate limits, how should the model gateway handle queuing, degradation, or model failover switching?
- After a model outputs tool calling arguments for an operation like processing a refund, what business validations must the application backend execute before calling the payment gateway?
- When switching model providers or modifying prompts, how do you use offline evaluation, trace replay, and production canary releases to rigorously verify performance?
