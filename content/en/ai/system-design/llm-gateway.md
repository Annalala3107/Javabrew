---
title: "Deep Dive into LLM Gateways: Multi-Model Routing, Fallback, Rate Limiting, and Cost Control"
description: "A comprehensive guide to LLM Gateway boundaries, model routing, fallbacks, rate limiting & quotas, Token budgets, cost tracking, observability & auditing, caching strategies, Java backend implementation, and mainstream solution selection."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: LLM Gateway,Model Gateway,LLM Router,Model Routing,Multi-Model Routing,Fallback,Rate Limiting,Token Budget,AI Gateway,LiteLLM,Cloudflare AI Gateway,Kong AI Gateway
lang: en
sourceRef: zh-ref/ai/system-design/llm-gateway.md
---

A while ago, some readers asked me to discuss LLM Gateways: what problems they actually solve, when they are worth deploying independently, and how to choose among existing options.

So, I consolidated my hands-on experiences and reflections from real-world projects into this detailed guide. The material is dense—counting the minimal code snippets, it exceeds 30,000 words.

Bottom-line conclusion first: for most monolithic applications or single-team projects, building a lightweight in-app LLM gateway is more than enough. Centralize model calls scattered across various business modules into a unified entry point, and then add timeouts, retries, logging, and simple routing as needed. Usually, there is no need to introduce heavy third-party components like LiteLLM or Kong AI Gateway, and certainly no need to stand up a standalone gateway platform right from the start.

Calling the same flagship model for intent classification, title generation, JSON repairs, and complex report generation is undeniably convenient in early development. Once traffic increases, however, cost, latency, and provider rate limits will strike simultaneously: lightweight tasks consume quotas of expensive models, critical tasks lack fallback paths when outages hit, and monthly bills cannot be attributed to specific tenants or features.

These problems should not be solved piecemeal within individual business modules; otherwise, logic for model selection, retries, rate limits, and invocation tracking will quickly sprawl across business code. The purpose of an LLM Gateway is to establish a unified invocation portal between the application layer and model providers, centralizing the management of these common cross-cutting concerns.

## LLM Gateway Fundamentals

### What Exactly Is an LLM Gateway?

An LLM Gateway is best conceptualized as: **API Gateway capabilities + Model invocation control plane**.

A traditional API Gateway serves as a **unified entry point** positioned between clients and backend services. All client requests traverse the gateway before being routed to target services, primarily managing HTTP traffic: authentication, rate limiting, forwarding, logging, and circuit breaking.

![Traditional API Gateway Overview](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gateway-overview-ee8b371d.png)

An LLM Gateway faces large language model invocations. Beyond standard API challenges, it must address model-specific concerns: model selection, Token budgets, context lengths, provider idiosyncrasies, streaming outputs, tool calling, structured responses, cost tracking, Prompt versions, and output quality.

More precisely, **an LLM Gateway is a governance entry point sitting between the application layer and model providers**. It does not necessarily replace an enterprise's existing API gateway, but it consolidates routing, budgeting, auditing, and adapter logic related to model invocations.

![LLM Gateway Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-overview-cd018e58.png)

Business code does not concern itself directly with how to call OpenAI, Anthropic, Gemini, Qwen, DeepSeek, or private models individually. Instead, it dispatches a standardized request to the Gateway. The Gateway determines which model to invoke, which provider to route through, whether retries are warranted, whether to downgrade, and how to record logs based on scenario, budget, latency, model health, and business policies.

A v1 Gateway can be very lightweight, focusing purely on unified abstraction, timeouts, retries, and logging. In production, it typically expands to govern model routing, Token budgeting, rate limiting, cost attribution, caching, auditing, and security policies.

If all it does is "forward the request", it is merely a reverse proxy; only when it begins recording why a model was chosen, how budgets were deducted, and how failures were mitigated does it enter the domain of a true Gateway.

### Why Do We Need an LLM Gateway?

Many teams developing their first AI application invoke model APIs directly within business services:

```text
Controller -> Service -> OpenAI SDK -> Return answer
```

This call chain is short and provides a pleasant developer experience. But as soon as production scale picks up, issues surface in clusters.

| Typical Issues of Direct Model Invocations | Production Symptom | Corresponding Gateway Capability |
| --- | --- | --- |
| Hardcoded Model Names | Upgrading, deprecating, or swapping providers requires code edits everywhere | Model Registry + Configurable Routing |
| Scattered API Keys | Multiple services manage keys independently; rotation is grueling | Centralized Secret Management |
| Provider Rate Limits | Business services retry aggressively upon 429s, worsening the flood | Rate Limiting, Queuing, Fallbacks, Circuit Breaking |
| Invisible Costs | Only total monthly spend is known; cannot attribute costs to tenants, features, or Prompts | Usage Tracking + Cost Attribution |
| Uniform Model for All Requests | Simple tasks waste money, complex tasks deliver mediocre results | Task-based Model Routing |
| Missing Logs | Users complain "AI hallucinated", but prompt inputs and outputs cannot be found | Tracing, Prompt Versioning, Model Invocation Logs |
| Fragmented Provider SDKs | Every service writes its own streaming, error codes, retries, and structured parsing | Provider Adapter Abstraction |

Beyond access control, cost attribution and incident replay require dedicated design.

To clarify these two concepts:

- Cost attribution means answering "who, what feature, and which invocation incurred this model expense": breaking down Tokens and spend by tenant, user, business scenario, Prompt version, model, and provider.
- Incident replay means that when a user reports "the previous answer was incorrect", you can retrieve the exact Prompt version, retrieval context, routing decision, model version, tool calls, and error details via `request_id` to determine whether the failure arose from input, routing, model output, or downstream parsing.

When traditional API calls fail, you can usually diagnose the root cause via status codes, request parameters, or database states. Diagnosing an LLM failure is vastly more difficult: the Prompt version might have changed, the model might have been silently updated, retrieval context might have been noisy, output might have been truncated, or the router might have selected an inexpensive model that lacked sufficient reasoning capabilities.

Without a Gateway, all these diagnostic clues are scattered across disparate business systems.

When clues are scattered, governance becomes impossible.

### What Is the Difference Between an LLM Gateway and an LLM Router?

A Router has a narrow scope of responsibility: deciding which model should handle a given request. Its inputs are the user query, task type, budget, and context length; its output is a model identifier or a prioritized candidate set.

A Gateway encompasses a much wider operational envelope. From the moment a request arrives until the response returns, authentication, rate limiting, routing, fallback, logging, and cost accounting all fall under its jurisdiction. The Router is merely one stage within the Gateway.

| Dimension | LLM Router | LLM Gateway |
| --- | --- | --- |
| Primary Responsibility | Model selection | Unified integration, routing, rate limiting, fallback, observability, cost governance |
| Decision Granularity | Per-request model selection | Full-lifecycle governance of the request |
| Typical Inputs | User query, task type, budget, context length | Request, user, tenant, scene, Prompt, model, provider, policy |
| Typical Outputs | Target model or candidate set | Full execution result, usage, logs, errors, costs, fallback trace |
| Applicable Stage | When multi-model usage grows complex | When AI applications move to production |

In short: **The Router chooses the model; the Gateway manages the entire model invocation lifecycle**.

You can have a Router without a Gateway for simple model dispatching—for instance, writing a function that returns a model identifier based on task type.

This solves part of the cost equation, but leaves key management, rate limiting, logging, auditing, standardized error handling, and provider failover unaddressed.

Conversely, an early-stage Gateway can operate without a complex Router. A v1 Gateway that focuses solely on unified integration, logging, and basic Fallback will already eliminate many production incidents.

Avoid binding routing policies to rigid model names; bind them instead to stable attributes such as capability tiers, cost brackets, context capacities, and risk tiers. Models evolve and names change, but these decision dimensions remain constant.

### What Is the Relationship Between an LLM Gateway and RAG, Agents, and MCP?

These concepts often appear together, but their operational boundaries differ:

| Concept | Primary Problem Solved | Relationship to Gateway |
| --- | --- | --- |
| RAG | Retrieves external knowledge and injects relevant context into model requests | Gateway can enforce Token budgets, track Prompt versions, and cache post-retrieval outputs, but is not responsible for retrieval quality itself |
| Agent | Decomposes tasks, invokes tools, executes multi-step plans | Gateway manages budgets, routing, and fallbacks for each individual model invocation step, without deciding the Agent's task planning logic |
| MCP | Allows models or Agents to access tools, resources, and contexts via a standardized protocol | Gateway can audit and govern model requests, and correlate with tool logs, but does not replace the MCP Server or Tool Registry |

Consequently, the Gateway aligns with "model invocation governance", whereas RAG, Agents, and MCP align with "application capability orchestration".

A complex Agent may invoke the Gateway across multiple steps, and the Gateway can independently record `scene`, `route_reason`, Token usage, and cost for each step.

### Does an LLM Gateway Introduce Additional Latency?

It introduces a slight overhead, but that overhead is rarely the dominant source of user-perceived waiting.

A Gateway executes routing, Token estimation, and logging within the same local network or data center in minimal time; model queuing, long-context inference, cross-region network hops, output Token generation, tool calls, and retries are what drive end-to-end latency.

The Gateway intervenes precisely in these high-latency areas. Intent classification can route directly to low-latency models; repetitive FAQ queries return cached answers; long contexts are compressed before dispatch; and for voice interactions or live customer support, TTFT is incorporated into candidate model health checks. When a provider experiences jitter, switching candidates or queuing according to policy is far more controllable than letting business interfaces hang until timeouts expire.

Routing itself carries cost. Calling a powerful model on every request just to "decide which model to use" often spends back all the saved Tokens and time. In the absence of massive traffic, robust evaluation datasets, and quality feedback, rule-based scenario routing or lightweight classifiers are far more practical.

### Do You Truly Need an LLM Gateway?

Examine where model invocations sit within your architecture. When an internal tool calls only a single model provider with modest daily traffic, deploying a standalone Gateway is generally unnecessary; wrapping an `LLMClient` within your business service to handle timeouts, retries, basic logging, and error mapping is sufficient.

Once model calls are shared across multiple services, teams, or tenants, the situation changes. Dispersed model configurations require touching code across multiple services whenever switching providers; when costs spike in a specific scenario, bills cannot be broken down by tenant, feature, or Prompt version. Multi-provider failover, quotas, fallbacks, auditing, and quality replays will be re-implemented repeatedly at every call site.

At that juncture, you do not necessarily need a heavy platform, but model invocations must have a single point of entry. You can start with a unified module that manages model names, keys, invocation logs, and error handling, and progressively add routing, budgets, and rate limiting. When multiple business units share models, require tenant billing, or need Prompt retention and sensitive content governance, evolve it into a full-fledged LLM Gateway.

My [AI Interview Platform](https://javaguide.cn/zhuanlan/interview-guide.html) followed this exact path. The project did not deploy a standalone gateway nor introduce specialized gateway components. Instead, it used an in-app `LlmProviderRegistry` to centrally manage provider configurations, default models, API keys, `ChatClient`, and Embedding models, while using a `StructuredOutputInvoker` to consolidate validation, repair, retries, and metrics for structured outputs. This provided the core shape of a lightweight LLM gateway, satisfying the project's current needs.

However, it was not yet the comprehensive production gateway discussed later: cross-provider automatic Fallbacks, Token budgets, per-call cost attribution, multi-dimensional rate limiting, and intelligent routing remain to be added when business demands genuinely require them. This boundary underscores a fundamental truth: an LLM Gateway is first and foremost a set of centralized governance responsibilities, not necessarily an independent microservice or third-party binary.

![LLM Gateway Evolution Path](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-evolution-path-b608e924.webp)

Whether to consolidate depends on how many services are impacted by a single model policy change, and how many call chains must be inspected during an outage. When calls are centralized in one module, adding models, swapping providers, or adding audit rules requires modifying only one place. Once calls are scattered across services, establish a unified entry point even if traffic volume is still modest.

## Why Shouldn't All Requests Use the Most Powerful Model?

### The Most Expensive Model Is Not Necessarily the Best Fit

Defaulting to the most powerful model avoids upfront selection decisions, but it cannot replace task tiering. Intent classification, title generation, JSON repair, and lightweight summarization prioritize response speed, structured outputs, and failure fallbacks; having them monopolize flagship models simply inflates costs and queuing times. Nor do complex tasks automatically yield better results with expensive models—retrieval context, tool return values, and output constraints equally dictate final quality.

Names like `tier-fast` and `tier-pro` represent capability tiers; their concrete mappings to provider, model version, context window, and pricing should be maintained by the Model Registry. When a provider upgrades a model or adjusts pricing, role-based business rules remain untouched.

Consequently, routing logs should record not only the final model name, but also the scenario, model tier, candidate set, routing rationale, and actual usage. This allows teams to review why a fast model was chosen for a given invocation, when a backup model was triggered, and how that decision influenced latency and cost.

### Which Tasks Suit Small Models? Which Require Flagship Models?

Model selection should begin with the task itself rather than model leaderboards. Deterministic rule filtering, keyword matching, permission checks, and template substitution belong in code; asking a model whether "input is empty" or "file extension is PDF" incurs unnecessary cost and introduces non-deterministic risk.

Intent classification, title generation, concise summarization, simple rewrites, and low-risk information extraction are ideal for low-cost models. What matters here are enum constraints, structured output validation, and explicit failure paths, not massive parameter counts. If parsing fails or confidence is low, escalate to a stronger model according to policy.

Multi-document synthesis, software architecture design, complex Agent planning, and strict fact verification demand deep reasoning capabilities; domains with high failure costs—such as finance, legal, and healthcare—require additional human review or business guardrails. Flagship models should be reserved for these high-stakes requests rather than serving as the default highway for all traffic.

In my multi-agent stock analysis project, technical indicator compilation and news pre-screening prioritize low-latency models, whereas research document synthesis and conflict resolution across multiple agent conclusions require deeper reasoning.

### How Does an LLM Router Select Models?

The mission of an LLM Router is to select the appropriate model for each incoming request.

"Appropriate" accounts not only for generation quality, but also cost, latency, context capacity, provider availability, and risk policies.

Intelligent routing projects like [LLMRouter](https://github.com/ulab-uiuc/LLMRouter) dynamically choose models per query to balance quality, cost, and latency. They explore single-turn, multi-turn, personalized, and Agentic routing, offering strategies based on KNN, SVM, MLP, Matrix Factorization, Elo Rating, and Graph-based routing.

While these algorithms are valuable for research and experimentation, production systems must first ensure explainability and replayability. A safer roadmap is: **Start model routing with simple deterministic rules, and gradually evolve into a trainable, evaluable, and iterative system based on real-world requirements**.

Common routing strategies include:

| Routing Strategy | Implementation | Best Suited For | Risks |
| --- | --- | --- | --- |
| Static Rule Routing | Selects models based on business scenario, endpoint, or tenant tier | v1 Gateway; sufficient for most business needs | Rules maintained manually; prone to lag |
| Cost-First / Cascading | Defaults to cheap models, escalating on failure or low confidence | Classification, summarization, customer FAQ | Cheap model errors cascade downstream |
| Semantic / Classification | Selects models based on query semantics, complexity, or risk | Stable query types, moderate-to-high traffic | Thresholds and classifiers need continuous tuning |
| Learned Routing | Trains a router based on historical quality, cost, and latency data | Multi-model, multi-task, high-traffic setups | Heavily dependent on evaluation data and feedback loops |
| Personalized Routing | Incorporates user preferences and interaction history | Consumer assistants, education, content platforms | Higher privacy and consistency overhead |
| Agentic Routing | Dynamically switches models and tools during multi-turn tasks | Complex Agents, long execution chains | High debugging and cost control complexity |

A v1 Gateway usually starts with static rules: translation, code generation, and standard chat each bind to a model tier; higher subscription plans or risk levels override defaults. Rules will grow as business expands, but they remain configurable, auditable, and instantaneously reversible.

Cascading routing places low-cost models first, escalating only when structured parsing fails, confidence scores fall below thresholds, or business validation rejects the output. It introduces an extra inference or evaluation step, making it well-suited for summaries, classification, and customer FAQs that tolerate extra latency; real-time voice and collaborative editing should rarely place it on the critical path.

Semantic/classification routing utilizes embeddings compared against task prototypes, model profiles, or lightweight classifiers to tag complexity and risk. Model capabilities, user phrasing, and query distributions shift over time, requiring continuous monitoring of thresholds, misrouting rates, and evaluation samples. Learned, personalized, and Agentic routing depend even more heavily on clean datasets: the former two must manage privacy and explainability, while the latter must control multi-turn cost ceilings and debugging challenges.

Multi-agent scenarios add another layer of role selection: check the agent role configuration first, inherit the strategy default if absent, and fall back to the system default as a last resort. When technical analysis, sentiment analysis, and final reporting are handled by different roles, this is much more stable than routing purely by endpoint name. If the configured provider is healthy, use it directly; only when it is unregistered or fails health checks should an alternative candidate be selected based on capability, latency, cost, and success rate.

Prior to starting an Agent execution, lock the selected model, provider, model name, and whether a pre-call fallback occurred into a single routing decision record. If health states fluctuate during streaming, do not re-route and re-attribute usage after completion, otherwise expenses incurred by Provider A might be billed to Provider B. Pre-call fallback is not equivalent to post-failure cross-provider replay: the latter requires defining which exceptions are replayable, whether ReAct tool results can be reused, and how already-streamed text should be handled.

## What Capabilities Must an LLM Gateway Possess?

![LLM Gateway Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-overview-cd018e58.png)

### Unified Multi-Model Integration

The last thing that should be scattered across business code is provider SDK invocations.

Today Service A calls OpenAI, tomorrow Service B calls DeepSeek, and the next day a cron job integrates Gemini. While everything runs in the short term, duplicated logic quickly accumulates: API keys, timeouts, retries, streaming parsers, error codes, usage, log formats, and model name mappings are re-implemented everywhere.

A sound approach defines unified requests and responses upfront:

```java
public record LLMRequest(
        String requestId,
        String idempotencyKey,
        String tenantId,
        String userId,
        String scene,
        List<ChatMessage> messages,
        Map<String, Object> responseSchema,
        LLMOptions options
) {
}

public record LLMResponse(
        String requestId,
        String model,
        String provider,
        String content,
        TokenUsage usage,
        String finishReason,
        boolean fallbackUsed
) {
}

public interface ProviderClient {

    String providerName();

    boolean supports(String model);

    LLMResponse chat(LLMRequest request, RenderedPrompt prompt, ModelRoute route);

    Flux<LLMChunk> streamChat(LLMRequest request, RenderedPrompt prompt, ModelRoute route);
}

public interface LLMGateway {

    LLMResponse chat(LLMRequest request);
}
```

These interfaces resolve several concrete problems:

- The business layer depends strictly on `LLMGateway`, not on vendor SDKs.
- Model names, providers, and fallback policies become fully configurable.
- Usage, costs, errors, and latencies are recorded consistently.
- Integrating a new model provider requires only implementing a new Provider Adapter.

In engineering practice, exposing an OpenAI Chat Completions compatible interface is standard. Solutions like LiteLLM, DeepSeek, and Qwen adopt this entry style, and Kong AI Gateway uses OpenAI format as a common entry format for its AI plugins.

The benefit of exposing an OpenAI-compatible interface is clear: clients switch from direct provider calls to the gateway simply by modifying their `base_url` or gateway endpoint, without major SDK changes.

However, unifying the entry shape does not mean upstream exits are identical.

Managed gateways like Cloudflare AI Gateway require integrating via Provider Native, REST, or Worker Bindings per their documentation, rather than assuming all providers can be passthrough via identical OpenAI protocols. The OpenAI protocol also cannot express proprietary vendor capabilities, such as Anthropic's extended thinking or Gemini's grounding metadata. Such capabilities must be carried in `extra_body`, `metadata`, or internal extension fields, which the Provider Adapter translates into target provider formats.

A Provider Adapter's job extends beyond endpoints and authorization headers: tool calling, streaming events, system instructions, structured outputs, usage, and error codes must all be translated accurately:

| Dimension | OpenAI Chat Completions | Anthropic Messages API | Gemini generateContent |
| --- | --- | --- | --- |
| Tool Call Fields | `tool_calls` | `tool_use` content block | `functionCall` part |
| Tool Result Return | `role=tool` message | `role=user` + `tool_result` content block | `functionResponse` part |
| Tool Schema | JSON Schema | JSON Schema subset | OpenAPI subset |
| System Prompt Location | system/developer in `messages` | Top-level `system` field | `systemInstruction` |
| Multi-Tool Calls | Natively supported | Natively supported | Verify behavior per model & SDK |
| Proprietary Extensions | `metadata` / custom parameters | thinking, cache_control, etc. | grounding, cachedContent, etc. |

An OpenAI-compatible interface simplifies client integration, but cannot erase protocol differences. Support for Claude, Gemini, or private models depends on whether the Provider Adapter correctly translates requests and events; marketing claims of "supporting a provider" do not guarantee lossless mapping of every proprietary feature.

Centralizing invocations first before progressively adding routing, rate limiting, and auditing is far easier to validate than attempting full proprietary feature parity from day one.

### Model Routing

Model routing delivers immediate ROI, especially in systems with clear task hierarchies.

A v1 implementation can be completely configuration-driven without training models:

```yaml
routes:
  - scene: intent_classification
    primary: tier-fast
    fallback:
      - tier-nano
      - tier-balanced
    max_output_tokens: 256
    risk_level: low

  - scene: complex_reasoning
    primary: tier-flagship
    fallback:
      - tier-pro
      - tier-balanced
    max_output_tokens: 4096
    risk_level: medium

  - scene: legal_review
    primary: tier-flagship
    fallback:
      - tier-compliance
    require_human_review: true
    risk_level: high

default:
  primary: tier-balanced
  fallback:
    - tier-fast
```

Here, `tier-*` represents internal gateway model tiers, not vendor model IDs. In production, a `Model Registry` maps `tier-fast`, `tier-balanced`, and `tier-flagship` to active concrete models, logging both the "model tier" and the "real model ID". Upgrading a model requires updating only the registry and canary configs, leaving business routing rules untouched.

When evaluating routing decisions, the Gateway evaluates at least these factors:

| Factor | Role |
| --- | --- |
| `scene` | Business scenario; dictates default tier and risk level |
| Input Tokens | Determines whether context limits or budgets are exceeded |
| Output Length | Controls cost and generation latency |
| User Tier | Free vs. enterprise tiers route to different model capabilities |
| Risk Level | High-risk tasks mandate compliance models or human review |
| Model Health | Routes away upon vendor outages, 429s, or P95 latency spikes |
| Historical Quality | Reduces weights when a model repeatedly fails on a task type |

A simple router can be structured as:

```java
public class RuleBasedModelRouter {

    private final RouteConfigRepository routeConfigRepository;
    private final ModelHealthService modelHealthService;

    public ModelRoute route(LLMRequest request, TokenBudget budget) {
        RoutePolicy policy = routeConfigRepository.findByScene(request.scene())
                .orElseGet(routeConfigRepository::defaultPolicy);

        for (String model : policy.candidates()) {
            if (!budget.fits(model)) {
                continue;
            }
            if (!modelHealthService.isAvailable(model)) {
                continue;
            }
            return ModelRoute.of(model, policy.providerOf(model), policy);
        }

        throw new NoAvailableModelException(request.scene());
    }
}
```

This code is straightforward; its value lies in clear separation of concerns: the router selects models without invoking them; health checks supply status without embedding business rules; budget evaluation is isolated for easy refinement.

![LLM Gateway Model Routing Decision Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-routing-decision-ba168a45.webp)

### Graceful Degradation (Fallback)

Fallback is not as simple as blindly retrying with another model upon failure.

You must first categorize the error type:

| Error Type | Suitable for Fallback? | Handling Strategy |
| --- | --- | --- |
| Transient Network Glitch | Yes | Short retry, then switch to backup model |
| Provider 5xx | Yes | Retry + Circuit break + Failover provider |
| 429 Rate Limit | Yes, with caution | Parse `Retry-After`; queue or switch models |
| Context Window Exceeded | No direct retry | Compress context, prune chunks, or switch to long-context model |
| Parameter Validation Error | No | Fix request; do not hammer providers |
| Content Moderation Refusal | Usually No | Route to refusal response or human review |
| Structured Output Parsing Failure | Limited repair | Retry under same Schema, repair format, or fail explicitly |

"Switching to a backup model" means the Gateway initializes a new call attempt, rather than letting a generic retry interceptor swap clients arbitrarily. When a request has already executed write operations, tool calls, or billing deductions, confirm whether the step is safe to replay; once streaming text has reached the user, you cannot splice output from two different models together.

Streaming invocations must handle user cancellations, TTFT timeouts, disconnections, and client reconnections independently. The Gateway must track streaming states, chunk sequences, and termination causes to avoid misclassifying aborted streams as successful, while preventing duplicated chunk delivery upon reconnection.

![Streaming Call Exception Handling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-api-engineering-streaming-exceptions-dd357375.webp)

A Fallback chain typically flows as follows:

```text
Primary model available -> Normal execution
Primary model returns 429 -> Parse rate limit info -> Switch to peer backup model
Peer backup also unavailable -> Switch to lightweight model with reduced output tokens
Still unavailable -> Queue, return degraded response, or escalate to human agent
```

For requests with side effects—such as persisting reports, executing tools, or debiting accounts—Fallback must be co-designed with idempotency. While pure text generation does not alter business state, duplicate calls incur added costs and yield differing outputs; every attempt must be recorded, and result reuse determined by scenario.

Degraded semantic states must remain visible. If high-risk tasks like legal review downgrade from flagship to low-cost models, they must be flagged for auditing. If no candidate meets quality constraints, returning "System busy, please try again later" is far safer than silently returning an inferior conclusion.

Idempotency records cannot consist of a simple "processed" boolean. For scenarios reusing results, store the final `LLMResponse`, binding keys and values to request semantics—such as `tenant_id + scene + idempotency_key + request_fingerprint`—alongside Prompt/routing versions and TTLs. If the request fingerprint mismatches for an identical idempotency key, reject reuse to avoid returning another request's historical output.

Concurrent requests require atomic claiming: use database unique constraints, conditional updates, or Redis `SET NX` to create `running` records, allowing only the winning request to call the model; others wait, receive conflict errors, or await the `completed` result. Define explicit handling for `failed` states, timed-out `running` states, and lease takeovers—never implement idempotency with naive "check-then-act" queries. Logs and caches must adhere to tenant isolation, sensitive data policies, and retention limits.

![Model Call Retry and Idempotency Process Flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-api-engineering-retry-idempotency-329ec34c.webp)

### Rate Limiting and Quotas

LLM APIs can still be rate-limited by QPS, RPM, and concurrency, but tracking request counts alone is insufficient.

Two requests may both count as 1 invocation, but their costs can diverge by orders of magnitude:

- Request A: 500 input Tokens, 100 output Tokens.
- Request B: 80K input Tokens, 8K output Tokens.

From a pure request-count view, B equals A. But regarding provider quotas, billing, and latency, they exist in entirely different universes.

An LLM Gateway manages rate limits across multiple dimensions:

| Rate Limit Dimension | Target | Problem Solved |
| --- | --- | --- |
| User Tier | Individual user requests | Prevents abuse and script scraping |
| Tenant Tier | Team/Tenant budgets | Cost control and subscription plan isolation |
| Model Tier | Specific model capacity | Protects popular models from saturation |
| Provider Tier | OpenAI / Anthropic / DeepSeek etc. | Prevents external outages from crashing the system |
| Token Tier | Input and output Tokens | Controls real costs and quota pressures |

The soundest approach: reserve budgets before dispatching requests to providers.

```java
public record TokenBudget(
        int estimatedInputTokens,
        int reservedOutputTokens,
        int totalReservedTokens
) {
}

public interface LLMRateLimiter {

    RateLimitPermit acquire(String tenantId, String userId, String model, TokenBudget budget);

    void reconcile(RateLimitPermit permit, TokenUsage actualUsage);

    void release(RateLimitPermit permit);
}
```

Upon entering the Gateway, estimate `input_tokens + reserved_output_tokens`. If the user bucket, tenant bucket, model bucket, and provider bucket all permit deduction, the request proceeds. If any bucket cannot accommodate the reservation, the request is queued, degraded, or rejected.

Budgets must be reserved and reconciled per attempt. If a primary model times out or drops a stream, Tokens may have already been consumed upstream, so the reservation cannot be released entirely; when switching to a backup model, reserve afresh based on the backup provider's pricing tier. Call `reconcile` once the provider returns usage; if usage is temporarily unavailable, book conservatively and correct via billing logs or asynchronous reconciliation.

Token estimation is never 100% exact, but a coarse estimate is vastly superior to none. Especially in RAG, long contexts, and Agent tool calling, lacking budgets quickly leads to runaway expenses.

Follow a four-step lifecycle: **estimate -> reserve -> actual usage -> reconcile**. First hold budget using estimates, then true up with the vendor's actual returned `usage`. Because tokenizers and usage schemas differ across providers and models, production systems typically deduct budgets using a unified estimator and reconcile later with actual `input_tokens` and `output_tokens`. Persisting unadjusted estimates into financial databases will compound statistical deviations over time.

![Token Budget Lifecycle: Reservation and Reconciliation Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-token-budget-lifecycle-a2546f71.webp)

### Cost Accounting

Many teams claim they want to "reduce LLM costs", yet cannot pinpoint where their money is actually being spent.

That is not optimization; that is guessing.

An LLM Gateway must track cost attribution fields for every single invocation:

| Field | Description |
| --- | --- |
| `request_id` | Unique ID of the business request |
| `attempt_id` | Unique ID of a model call attempt; fallbacks and retries generate multiples |
| `tenant_id` | Tenant or team identifier |
| `user_id` | User identifier |
| `scene` | Business scenario (e.g., support, summary, code gen) |
| `prompt_version` | Prompt template version |
| `provider` | Model provider |
| `model_tier` | Internal model tier selected by routing |
| `model` | Concrete model invoked |
| `input_tokens` | Input Tokens |
| `output_tokens` | Output Tokens |
| `cached_tokens` | Tokens hitting Prompt cache or provider cache |
| `cost` | Calculated cost based on price snapshots |
| `price_version` | Pricing schedule version used for calculation |
| `latency_ms` | Total latency in milliseconds |
| `ttft_ms` | Time to first token in milliseconds |
| `fallback_used` | Whether a fallback was triggered |
| `error_code` | Error category code |

Cost is calculated via pricing snapshots: `input_tokens × input_rate + output_tokens × output_rate`, supplemented by cache writes, cache reads, or provider surcharges. Consequently, `cached_tokens` cannot be treated simply as standard input Tokens; they must be interpreted alongside models and pricing versions to reconstruct true costs.

These fields anchor billing back to concrete engineering decisions: when tenant or feature costs spike, inspect Tokens, Prompt versions, and model tiers; when Fallbacks cluster, examine providers, candidate sets, and error codes; after model upgrades, evaluate quality, latency, and cost across identical scenarios.

Price tables, cache discounts, and billing rules change, so cost logs cannot record only the final `cost`. Store `usage` breakdowns, pricing versions, and calculation timestamps alongside every call, ensuring calculations can be audited and recalculated against historical rules. Future routing adjustments should be guided by these records and failure samples.

### Observability and Auditing

When traditional systems fail, engineers inspect logs, Traces, and metrics. AI systems are no different, except they require capturing additional model-specific attributes.

Products like Cloudflare AI Gateway, LiteLLM, and Kong AI Gateway place logs, Tokens, costs, errors, latency, caching, and rate limiting prominently. If an AI application logs only final answers when errors occur, troubleshooting is virtually impossible.

A model invocation Trace should resemble:

```json
{
  "request_id": "req_202605210001",
  "attempt_id": "att_01",
  "tenant_id": "team_java",
  "user_id": "u_1024",
  "scene": "knowledge_qa",
  "prompt_version": "rag_qa_v7",
  "provider": "openai",
  "model_tier": "tier-balanced",
  "model": "provider-model-id",
  "route_reason": "scene=knowledge_qa,cost_priority=true",
  "input_tokens": 4210,
  "output_tokens": 612,
  "cost": 0.0059,
  "ttft_ms": 680,
  "latency_ms": 4120,
  "fallback_used": false,
  "finish_reason": "stop"
}
```

The `request_id`, model, routing rationale, and usage are sufficient for most aggregated troubleshooting; full Prompts and responses may contain PII, enterprise documents, source code, or contract terms. Storing full text should never be a blanket default; it must be determined by data classification, processing purpose, contracts, applicable regulations, and debugging needs. Products like Cloudflare AI Gateway make request/response body collection configurable, and custom in-house systems should similarly manage collection via policies rather than hardcoding.

Metadata also requires defined retention limits, as `usage`, models, latency, costs, `route_reason`, and error codes can link back to individuals or tenants. When sampling Prompts or responses for debugging, control sample ratios and retention periods based on data classification, tenant consent, and minimum necessity; mask phone numbers, identification numbers, credit cards, emails, and physical addresses at the entry layer before ingestion into logging pipelines. Supplement retention toggles with access controls, encryption, export, deletion, and legal hold mechanisms, logging processing purposes and deletion outcomes for each data category.

### Caching and Semantic Caching

Caching delivers cost savings only when answers are reusable. Whenever requests involve permissions, real-time states, private contexts, or specialized professional judgment, caching must be bypassed or partitioned with strictly isolated keys.

| Cache Type | Mechanism | Best Suited For | Risks |
| --- | --- | --- | --- |
| Exact Cache | Returns cached output when requests match identically | FAQs, static guides, repetitive automated testing | Prone to errors in personalized or permissioned contexts |
| OpenAI Prompt Caching | Automatically caches stable long prefixes | Long system prompts, static Tool Schemas | Supported models, thresholds, and discounts depend on official pricing docs |
| Anthropic Prompt Caching | Marks cacheable blocks explicitly via `cache_control` | Long system prompts, large documents, multi-turn Agents | Write and read pricing must be audited against current rate cards |
| Gemini Context Caching | Reuses long contexts via cached content objects | Large documents, video, codebases, multi-turn Q&A | Requires managing cache objects, TTLs, storage costs, and invalidation |
| Semantic Cache | Reuses past answers for semantically similar queries | Support FAQs, product guides, low-risk Q&A | Similarity does not equal equivalence; prone to drifting answers |
| Fragment Cache | Caches intermediate summaries, retrieval hits, tool outputs | Long document summarization, batch processing | Invalidation and version management are complex |

Support FAQs are ideal candidates for caching: "how to change passwords", "where to download invoices", "how to process membership refunds". These answers are stable, rarely personalized, and yield high cache ROI.

Conversely, queries involving user permissions, real-time states, financial/medical/legal advice, private multi-turn dialogues, or dependencies on current timestamps, orders, or inventory levels must never reuse generic cached outputs.

Semantic cache keys must isolate tenant, permission scope, data version, scenario, and Prompt version at minimum; vector similarity serves only as a candidate matching criterion, never replacing boundary checks. "Why hasn't my order shipped?" and "Can my order be refunded?" may be close in vector space, but one requires explaining logistics while the other involves refund policies; false matches lead users into wrong workflows. Measure hit rates alongside business validation, complaint rates, and human escalation rates.

Prompt caching is not an automatic windfall either. Explicit caching distinguishes between cache write and read costs; automatic caching depends on supported models, minimum prefix lengths, and pricing updates. If your system prompts, Tool Schemas, or contexts introduce timestamps, random IDs, or volatile user states, the prefix will continuously change, tanking cache hit rates and destroying ROI. Placing stable content first and dynamic content last is the cardinal structural rule when leveraging provider prompt caching.

## Designing a Production-Grade LLM Gateway

### What Does a Production LLM Gateway Look Like?

When architecting an LLM Gateway, break it down into these components:

| Component | Responsibility |
| --- | --- |
| API Adapter | Exposes unified APIs, compatible with OpenAI-style or internal standard requests |
| Auth / Tenant | Authentication, tenant identification, plan quotas, and permission validation |
| Prompt Renderer | Renders Prompt templates and tags Prompt versions |
| Token Budget Estimator | Estimates input/output Tokens to evaluate budget compliance |
| Model Registry | Maintains model capabilities, pricing, context windows, providers, and health |
| Router | Selects models based on scenario, budget, latency, and risk |
| Provider Adapter | Adapts provider protocol differences via `ProviderClient` (tools, streams, usage, errors) |
| Retry / Fallback | Manages retries, downgrades, and circuit breaking per error category |
| Rate Limiter | Enforces multi-dimensional rate limits across user, tenant, model, provider, and Token |
| Cost Tracker | Records usage, calculates costs, attributes spend by tenant and scenario |
| Observability | Outputs metrics, logs, Traces, and alerts |
| Audit Log | Audits sensitive requests, supporting masking, retention, and replay |

A v1 release should prioritize the unified API, Provider Adapter, and basic logs for usage, cost, errors, and latency. Once invocation logs are stable, introduce rule-based routing, Fallbacks, Token budgeting, and tenant quotas; quality replays, auditing, and classification routing build upon this foundation. This approach verifies that model invocations are properly consolidated before committing to maintain advanced routing complexity.

### How Does a Request Flow Through the Gateway?

When a request enters the Gateway, it undergoes authentication and tenant identification, resolving authorized features, subscription tiers, and budget ceilings. Next, request parameters or a lightweight classifier identify the `scene`, rendering the corresponding Prompt version, context, and Tool Schemas.

Token estimation and routing occur immediately thereafter. The gateway reserves input and maximum output Tokens for candidate models, requesting quotas across user, tenant, model, and provider dimensions. Once the routing decision is locked, the Provider Adapter initiates a synchronous or streaming invocation. Response text, structured JSON, tool calls, usage, and finish reasons are attributed to this specific attempt.

Upon network failures, 429s, or parsing errors, error classification determines whether to retry, failover to candidates, queue, or abort. Every new attempt reserves budget anew; upon completion, accounts reconcile against actual usage, recording model, provider, Prompt version, routing rationale, latency, and error details before returning the unified result to the caller.

![LLM Gateway Request Lifecycle](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-request-lifecycle-b332e067.webp)

### How Routing Strategies Evolve from Simple to Intelligent

Do not attempt full routing sophistication in a single leap. The earlier discussed static rules, cascading routing, semantic/classification routing, learned routing, personalized routing, and Agentic routing represent an evolutionary roadmap, not a v1 punch list.

A measured progression: first make the system controllable, then make it cost-efficient, and only then make it intelligent.

| Phase | Strategy | Key Capabilities | Signal to Advance |
| --- | --- | --- | --- |
| Phase 1 | Fixed Model + Manual Config | Centralize model calls; eliminate scattered SDKs | Multiple scenarios share models; cost/latency gaps emerge |
| Phase 2 | Static Rule Routing | Select models by scene, tenant, and risk | Rule proliferation makes manual upkeep painful |
| Phase 3 | Cost-First / Cascading | Try small models first; escalate on failure or low confidence | Stable validation checks and acceptable added latency |
| Phase 4 | Semantic / Classification | Route based on query type, complexity, and risk | Sufficient request samples to evaluate classifier drift |
| Phase 5 | Quality Feedback + Cost Regression | Replay model quality and cost ROI using Traces | Established benchmark datasets, human sampling, or feedback loops |
| Phase 6 | Learned / Personalized / Agentic | Dynamically select or switch models mid-step | High traffic, diverse tasks, multi-model, continuous evaluation |

Before advancing to the next phase, use the signals in the table to confirm the added complexity yields demonstrable returns, while retaining static rules as rollback pathways. Classification routing requires monitoring misrouting rates and threshold drift; learned or Agentic routing requires stable evaluation datasets, production Traces, cost ceilings, and privacy controls.

### What to Do When Routing Fails

Routing misjudgments are inevitable.

Every routing strategy will produce errors; production systems must provide mechanisms for discovery, fallback, and replay.

Common fallback approaches include:

| Issue | Fallback Mechanism |
| --- | --- |
| Low Classifier Confidence | Route to default mid-to-high tier model, or request user clarification |
| Low-Quality Output from Small Model | Automatically escalate to flagship model for retry |
| High-Risk Task Routed to Low-Risk Path | Risk rules take strict precedence over cost rules |
| Quality Drift After New Model Launch | Canary releases, A/B testing, regression against fixed evaluation sets |
| User Complaints of Erroneous Answers | Replay Prompt, model, context, and routing reason via `request_id` |
| P95 Latency Spike on Specific Model | Health checks downweight the model or trip circuit breaker |

"Automatic escalation to a flagship model on failure" is safe only for idempotent, side-effect-free requests. For Agents with tool calling, persist current-turn tool outputs or explicitly abort the run; otherwise, an escalated model may re-invoke tools, causing state and financial inconsistencies.

Routing logs must record `route_reason` alongside model names, or the rationale behind decisions will be lost.

For example:

```json
{
  "scene": "intent_classification",
  "selected_model_tier": "tier-fast",
  "selected_model": "provider-model-id",
  "route_reason": "scene_rule:low_risk,cost_priority,estimated_tokens=320",
  "confidence": 0.91,
  "fallback_candidates": ["tier-nano", "tier-balanced"]
}
```

Without `route_reason`, debugging and tuning the routing system later becomes an exercise in frustration.

## Evaluating Mainstream Gateway Solutions

### Choosing Between In-House, LiteLLM, Cloudflare AI Gateway, Kong AI Gateway, and Inworld Router

Numerous LLM Gateway and Router solutions exist today; avoid choosing purely on "number of models supported". Evaluate along core constraints: your engineering tech stack, compliance mandates, traffic scale, self-hosting requirements, existing API gateway infrastructure, and observability depth.

| Solution | Key Strengths | Best Suited For | Less Suited For |
| --- | --- | --- | --- |
| In-House Lightweight Gateway | Controllable, tailored to domain; deep integration with internal auth, billing, auditing | Strong backend capabilities, clear requirements, evolving from rules | Needing rapid integration with dozens of providers; lacking maintenance capacity |
| LiteLLM | Multi-provider support, OpenAI compatibility, mature Proxy/SDK ecosystem | Platform teams, rapid integration, multi-model experimentation, unified entry | Strict compliance or deep enterprise governance needing extensive forks; mind supply chain security and version pinning |
| Cloudflare AI Gateway | Managed entry, log analytics, caching, rate limiting, retries, dynamic routing, DLP, BYOK | Already on Cloudflare; wanting turnkey observability, caching, and unified access | Strict self-hosting, on-premise deployments, complex internal enterprise governance |
| Kong AI Gateway | Strong enterprise API governance, mature plugin ecosystem, unified auth, rate limiting, DLP, cost control | Existing Kong infrastructure, or incorporating AI traffic into enterprise API gateways | Small teams, early-stage MVPs, or teams wishing to avoid full API gateway overhead |
| Inworld Router | Conditional routing, traffic splitting, experimentation, sticky user assignment | Real-time voice, conversational AI, coding assistants, user tiering, A/B testing | Scenarios requiring open-source audited code, on-premise hosting, or strict enterprise SLAs require verification |
| Research Projects (LLMRouter / RouteLLM) | Rich routing algorithms; ideal for complexity routing and cost-quality trade-off studies | Research, experimentation, offline evaluation, validating routing strategies | Direct production gateway use; lacks enterprise auth, billing, auditing, rate limiting, high availability |

LiteLLM primarily addresses the pain of integrating multiple vendor SDKs. Business applications use a standard OpenAI-compatible interface, while the Proxy bridges providers, centrally managing keys, budgets, permissions, logs, and routing. It is ideal for teams wanting fast multi-provider access without building a custom translation layer.

Note that the Proxy stores provider credentials and handles all model traffic. Production deployments must pin dependencies and container image versions, implement upgrade testing, scan vulnerabilities, and rotate keys, avoiding `latest` tags.

Cloudflare AI Gateway is well-suited for teams already on Cloudflare. Without major code overhauls, you gain logging, caching, rate limiting, retries, fallbacks, dynamic routing, BYOK, and DLP scanning.

Model selection logic must still be determined by business applications. If data sovereignty, networking, and auditing require total control, verify whether Cloudflare's managed model aligns with compliance requirements.

Kong AI Gateway fits teams already running Kong or standardizing enterprise API gateways. Existing authentication, rate limiting, auditing, security, and monitoring capabilities can be reused, with AI plugins handling model translation, routing, and load balancing.

For small teams, Kong can introduce significant operational overhead. Some advanced AI plugins require enterprise licensing; factor licensing, deployment, and operational maintenance into your selection.

Inworld Router focuses on real-time routing and A/B experimentation. It can route models based on price, speed, capability, or user segments, comparing quality, retention, and cost across models and Prompts.

It suits real-time dialogue, voice agents, and AI developer tools. However, it is a managed service; on-premise needs, data restrictions, SLAs, and procurement budgets should be verified against current official terms.

LLMRouter is tailored for researching and evaluating routing algorithms, supporting KNN, SVM, MLP, Elo, Graph, personalized, multi-turn, and Agentic routing.

It cannot be deployed directly as a production gateway. Permissions, quotas, billing, auditing, rate limiting, and operations must be built from scratch. Without stable evaluation sets and production Traces, demonstrating that complex algorithms outperform simple rules is difficult.

### Selection Recommendations

If your business is in its early stages, build a lightweight in-house gateway. Avoid heavy enterprise platforms upfront; first centralize model calls, implementing logs, usage, Token budgeting, and Fallbacks.

If you must connect numerous models and providers rapidly, prioritize mature abstraction layers like LiteLLM to transition teams quickly from "SDKs everywhere" to a "unified entry point".

If your enterprise already relies on Kong, evaluate Kong AI Gateway to incorporate AI traffic directly into your existing API governance framework.

If you already leverage Cloudflare extensively, adopt Cloudflare AI Gateway to gain observability, caching, rate limiting, and unified routing immediately.

If you intend to implement intelligent routing, prepare evaluation datasets and production Traces first before exploring learned strategies like LLMRouter. Without baseline data, more complex routing algorithms merely become harder to explain.

Do not invert the sequence: **Solve engineering governance first; pursue intelligent routing second**.

## How to Measure the Success of an LLM Gateway

Evaluating an LLM Gateway goes far beyond "how many models are supported". Supporting many models merely proves an extensive adapter layer was written, not that production pipelines are resilient.

Routing accuracy, quality pass rates, Fallback rates, costs, and latencies must be measured independently across scenarios, model tiers, and providers:

| Metric | Definition |
| --- | --- |
| Route Hit Rate | Percentage of requests reaching the expected model or tier |
| Quality Pass Rate | Output passing automated evaluation, sampling, or business validation |
| Fallback Rate | Primary path stability; frequency of backup path activations |
| Average Cost | Cost per request or per business scenario |
| P95 Latency | User experience indicator, especially for interactive and voice apps |
| TTFT | Time-to-first-token; dictates perceived streaming responsiveness |
| 429 Rate | Provider rate limit pressure indicator |
| Cache Hit Rate | Percentage of requests and Tokens saved via caching |
| Structured Parsing Failure Rate | Stability of Schemas, Prompts, and model adapters |
| Route Drift | Invalidation of routing rules following model updates or traffic shifts |

Among these, "route drift" is most frequently overlooked.

Model capabilities are dynamic. A low-cost model inadequate for complex summarization today may become fully capable after an update three months later. Conversely, an established model upgrade may degrade formatting reliability on structured tasks.

Routing rules cannot be written once and forgotten. Like Prompts, they must be versioned; like code, they must undergo continuous regression testing.

## Summary

An LLM Gateway decouples business services from provider protocols, model routing, rate limiting, caching, Token budgets, and audit mechanics, leaving behind a clean, unified invocation interface.

Yet for most projects, this interface can simply be a lightweight in-app module without introducing external components solely to say you "have an LLM Gateway". My [AI Interview Platform](https://javaguide.cn/zhuanlan/interview-guide.html) operates on this exact principle: solving immediate challenges via a centralized Provider Registry and wrapper, letting genuine traffic and governance demands dictate when to introduce routing, budgets, Fallbacks, cost attribution, or standalone services.

A v1 implementation should validate three core outcomes: requests are correctly adapted, invocations can be replayed against real models and usage, and failures fall back as designed. Quotas, cost governance, and caching should be driven by actual traffic; classification or learned routing should wait until stable evaluation sets, production Traces, and rollback mechanisms are established.

Whenever model versions and pricing fluctuate, existing routing rules must be re-evaluated across quality, latency, and cost.

## References

- [LiteLLM Docs](https://docs.litellm.ai/docs/)
- [LiteLLM Security Update: Suspected Supply Chain Incident](https://docs.litellm.ai/blog/security-update-march-2026)
- [Cloudflare AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [Cloudflare AI Gateway Request Handling](https://developers.cloudflare.com/ai-gateway/configuration/request-handling/)
- [Cloudflare AI Gateway Fallbacks](https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/)
- [Cloudflare AI Gateway DLP](https://developers.cloudflare.com/ai-gateway/features/dlp/set-up-dlp/)
- [Cloudflare AI Gateway BYOK](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/)
- [Kong AI Gateway Docs](https://developer.konghq.com/ai-gateway/)
- [Inworld Router Docs](https://docs.inworld.ai/router/introduction)
- [LLMRouter GitHub Repository](https://github.com/ulab-uiuc/LLMRouter)
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)
