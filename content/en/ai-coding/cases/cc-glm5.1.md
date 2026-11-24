---
title: "Claude Code with Third-Party Models in Practice: JVM Intelligent Diagnostics and Slow Query Governance"
description: "Connecting GLM-5.1 via Claude Code to complete two real-world tasks: building an intelligent JVM diagnostic agent from scratch and governing slow queries on million-scale datasets, sharing AI-assisted coding methodologies and lessons learned."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: Claude Code,AI Coding,GLM-5.1,JVM Diagnostics,Slow Query Optimization,AI-Assisted Development,Arthas,Agent,Spring AI
lang: en
sourceRef: zh-ref/ai-coding/cases/cc-glm5.1.md
---

Hello everyone, I'm Xiao G. Previously, I shared [Practical Guide: IDEA with the Qoder Plugin](./idea-qoder-plugin.md) and [Practical Guide: Trae Connected to LLMs](./trae-m2.7.md), covering AI-assisted coding within the JetBrains and VS Code ecosystems, respectively. In this article, let's look at things from a different angle and explore **connecting Claude Code to third-party models** in real-world scenarios.

Claude Code is officially Anthropic's CLI coding tool. Several providers offer access to third-party models via Anthropic-compatible endpoints and environment variables; however, compatibility levels, available capabilities, and data-handling practices are determined by each provider and cannot be assumed to be identical to native Claude models. This article documents the hands-on process using GLM-5.1 at that time.

Currently, GLM-5.2 has also been released, and newer models will continue to roll out. Nevertheless, the integration workflow and practical coding methodologies remain consistent regardless of model version.

I selected two representative, complex scenarios for verification:

- **Scenario 1**: Building an Arthas-based intelligent JVM diagnostic Agent from scratch, covering technical selection, architectural design, and full implementation.
- **Scenario 2**: Pinpointing and governing slow queries in an existing order management system with million-scale data, testing the AI's codebase comprehension and incremental refactoring abilities.

One represents greenfield engineering delivery from zero to one; the other represents performance governance on a legacy system. Together, they cover two quintessential modes of AI-assisted development.

## Environment Setup: Connecting Claude Code to Third-Party Models

Before getting started, we need to bridge Claude Code with the third-party model. The configuration involves three steps:

**Step 1**: Install Claude Code

```bash
npm i -g @anthropic-ai/claude-code@latest
```

**Step 2**: Install cc-switch for convenient model switching (macOS users can install via Homebrew; refer to the cc-switch documentation for details: <https://github.com/farion1231/cc-switch/blob/main/README_ZH.md>)

**Step 3**: Configure the mapping between Claude Code internal model environment variables and the target model according to provider instructions. For GLM-5.1, refer to: <https://docs.bigmodel.cn/cn/coding-plan/tool/claude>

Configuration screenshots:

Click the plus icon to add a model:

![Click to add model](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/add-model-entry-f2d25853.png)

Select the corresponding model:

![Select model](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/select-model-f702b9b5.png)

Configure parameters:

![Configure parameters](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/config-params-9cbb3b6a.png)

JSON configuration mapping Claude Code internal environment variables to target models:

![Claude Code internal model environment variable mapping JSON configuration](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/model-env-json-config-dd263e83.png)

If you prefer a GUI workflow, VSCode + Claude Code for VS Code is recommended for interaction and code inspection. Once the extension is installed, you can chat with the model and review code directly within the IDE, which offers a more visual experience compared to the CLI:

![VSCode + Claude Code for VS Code](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/vscode-claude-code-2348c312.png)

## Scenario 1: Building a JVM Intelligent Diagnostic Agent from Scratch

### Why Do We Need an Intelligent JVM Diagnostic Assistant?

Online JVM troubleshooting has always been one of the trickiest challenges for Java developers. In traditional workflows, when encountering performance bottlenecks or production outages, engineers typically follow a set investigation path:

1. Check Grafana dashboards to identify anomaly directions.
2. Log into production servers to inspect CPU, memory, GC, and thread metrics.
3. Once an application-layer issue is confirmed, launch Arthas and run a sequence of diagnostic commands to narrow down the problem scope.
4. Locate the exact code segment, analyze root causes, and devise a remediation plan.

Prior to AI, this workflow was tedious but effective. However, as systems grow increasingly complex and incident response timeframes tighten, the drawbacks of the traditional approach become glaring:

- **Metrics can be overly subjective**: Faced with CPU spikes, memory leaks, or OOM crashes, dashboard metrics are overwhelming; engineers often rely on intuition and subjective deduction without a structured methodology.
- **Diagnostic chains are too lengthy**: Moving from Grafana to servers to Arthas involves tool switching and context handoffs, which is slow and inefficient when trying to mitigate critical production outages.
- **Heavy reliance on engineer experience**: Arthas is a powerful JVM diagnostic tool capable of bytecode instrumentation for runtime inspection. The downside is that engineers must be thoroughly versed in command flags and diagnostic reasoning paths to pinpoint issues accurately.

As Agent and Skill capabilities mature, an engineering concept emerged: codify diagnostic expertise into auditable workflows, allowing an AI to execute read-only diagnostic pipelines based on reported symptoms, gather evidence, and propose candidate root causes. Connecting to production instances, executing commands, and confirming root causes still require explicit permissions and human oversight—they cannot simply be driven by "service name + symptom description".

### Requirements Delivery and Architectural Design

With the concept in mind, the next step was technology selection and solution formulation. The complete requirements prompt was submitted to the AI:

```bash
Develop an intelligent diagnostic tool based on Arthas with the following core capabilities:
1. When a user inputs a production service name and specific failure symptoms, the system autonomously locates the target server and performs real-time monitoring and deep analysis on the service.
2. Integrate Arthas decompilation capabilities to pinpoint the exact code segment causing the failure.
3. Based on analysis findings, generate a complete remediation proposal including root causes, code fix suggestions, and implementation steps.

Please provide a technology stack proposal, including but not limited to programming language (Java preferred), core frameworks, database table schemas, and deployment architecture. Design a detailed implementation plan covering functional modules, data flows, key technical challenges, and proposed solutions.
```

Upon receiving the requirements, the AI did not jump straight into code. Instead, starting from an empty project, it drafted a phased technical proposal. This serves as a great starting path for review, though safety and compatibility with existing infrastructure must be confirmed by operations and engineering teams.

![AI autonomously completes technical proposal planning](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/ai-tech-plan-fd042326.png)

The AI synthesized the requirements and researched technology selections and Arthas integration patterns. Judging by its search queries, it prioritized mature and stable industry solutions:

![AI researches Agent technology selection and Arthas integration patterns](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/agent-arthas-integration-research-c953cebc.png)

After referencing the official Arthas documentation, the AI generated the system architecture diagram below. From top to bottom, it consists of three layers: the User Layer takes service names and symptoms; the Agent Layer coordinates the Skill engine, Arthas HTTP Client, and AI analysis engine; and the bottom layer integrates target service instances via the Arthas HTTP API. This diagram covers primary business modules, though production control planes—such as authentication, approvals, command policies, and auditing—need to be added separately:

![System architecture design diagram generated by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/system-architecture-design-5cf615f6.png)

Beyond the architecture diagram, the AI broken down the responsibilities of 6 core components—from workflow orchestration in the AI Agent Server, to session management in the Arthas HTTP Client, diagnostic step chains in the Skill engine, and report generation in the AI analysis engine. Boundaries and collaborations were articulated clearly:

![Core component responsibility matrix generated by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/core-component-roles-4487cf00.png)

Looking at data flow design, the AI illustrated a typical response time (RT) timeout scenario, tracing from Skill matching and diagnostic step execution to report generation. The session lifecycle of `init_session → async_exec → pull_results → interrupt_job → close_session` aligns with the asynchronous job model in the [Arthas HTTP API](https://arthas.aliyun.com/doc/http-api.html), managing long-running streaming commands cleanly. Commands such as `watch` and `trace` instrument bytecode in target classes; they cannot be treated as benign read-only queries simply because they don't mutate business tables. Architecture reviews must examine command tiering, session cleanup, timeouts, and safety boundaries:

![Data flow design generated by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/data-flow-design-84afdb46.png)

The Arthas HTTP API accepts diagnostic commands directly, and official docs provide [Authentication Configuration](https://arthas.aliyun.com/doc/auth.html). Consequently, before entering production, this Agent requires at least the following guardrails:

1. **Identity and Network Boundaries**: Enable Arthas authentication and isolate diagnostic ports inside private subnets; the Agent must use a dedicated service identity with least-privilege credentials and never pass credentials to the model.
2. **Target Instance Whitelisting**: Service names must resolve only to registered, sanctioned instances; arbitrary IPs, ports, and URLs from users or models must be forbidden; production and test environments must enforce separate credentials and policies.
3. **Command Whitelisting**: By default, only pre-reviewed, read-only diagnostic templates without bytecode instrumentation should be permitted. Dynamic parameters like class and method names must be strictly validated against length and type constraints; executing raw model-generated strings as Arthas commands must be prohibited.
4. **High-Risk Operation Approvals**: Bytecode enhancement commands (`watch`, `trace`, `tt`) should be disabled by default. If required, use audited templates with manual human sign-off, enforcing caps on execution count, maximum runtime, sampling rates, and output volume; OGNL expressions must generate strictly from whitelisted templates, with post-execution verification that enhancements are undone. Other actions capable of altering runtime state, introducing high overhead, or exposing sensitive data require ephemeral authorization and dual-person sign-off.
5. **Resource Protection**: Configure timeouts, concurrency limits, rate limits, and circuit breakers per instance; streaming commands must enforce a maximum execution duration and ensure `interrupt_job` and `close_session` are invoked even on error paths.
6. **Audit Logging and Redaction**: Log the requester, target instance, template, evaluated arguments, start/end timestamps, and result summaries; logs, decompiled source code, and reports must be scrubbed of secrets, PII, and sensitive business data before reaching the model.

Future extensions should obey these identical constraints. For example, "Alert Integration" can automatically generate diagnostic tasks but must never bypass approvals to run arbitrary commands; "Automated Patching" should only produce candidate diffs for review rather than hot-swapping classes in production.

![Follow-up extension suggestions provided by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/extension-suggestions-9d109fe9.png)

### Coding Delivery and Project Structure

Once the technical plan was validated, the development command was issued:

```bash
The overall plan looks great, please proceed with full implementation.
```

Upon receiving the command, the AI began coding autonomously. Following the architectural design, it progressed module by module—from the parent POM and Maven multi-module skeleton, to common utilities, data models, DAL, Arthas client wrapper, Skill engine, AI analysis engine, service layer, web controllers, bootstrap module, and deployment configs—completing all 11 sub-steps:

![Autonomous coding execution by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/ai-coding-process-56802163.png)

Moments later, the AI produced a candidate implementation consisting of 9 modules and 46 files, spanning common utilities, 7 diagnostic Skills, the Arthas HTTP API client, and Spring AI Alibaba analyzers. File count indicates delivery scope, not correctness or security:

![Delivery checklist generated by AI upon code completion](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/delivery-checklist-c3d4b63a.png)

Examining the project structure, the AI followed standard Maven multi-module conventions, strictly observing dependency hierarchy from common → model → dal → client → skill → ai → service → web → bootstrap with unified naming conventions.

The `agent-skill` module is particularly noteworthy: the AI abstracted the Skill engine interface and implemented 7 built-in diagnostic skills covering common JVM failure scenarios (CPU spikes, OOM, deadlocks, slow endpoints, abnormal GC, thread leaks, ClassNotFoundException), each defining a complete step chain. This "framework + built-in implementations" pattern offers solid extensibility:

```bash
jvm-ai-agent/
├── jvm-ai-agent-server/                 # Agent Server (Core)
│   ├── agent-common/                    # Common: Utilities, Constants, DTOs
│   ├── agent-model/                     # Data Models: Entities, Mappings
│   ├── agent-dal/                       # Data Access Layer: Mappers, Repositories
│   ├── agent-arthas-client/             # Arthas HTTP API Client Wrapper
│   ├── agent-skill/                     # Skill Engine (Diagnostic Methodologies)
│   ├── agent-ai/                        # AI Analysis Engine
│   ├── agent-service/                   # Service Layer (incl. Instance Discovery)
│   ├── agent-web/                       # Web Layer: REST API, WebSocket
│   └── agent-server-bootstrap/          # Bootstrap Module
│
└── pom.xml                              # Parent POM
```

Looking at core diagnostic logic, `executeDiagnosis` coordinates Skill matching, instance resolution, diagnostic chain execution, result analysis, and report generation. The raw implementation originally extracted variables from Arthas output to interpolate into downstream commands; production systems must restrict commands to audited templates and permit only validated variable replacements. Similarly, "continue on non-critical failure" must be clearly defined; authentication failures, unwhitelisted targets, timeouts, and audit errors must never fail silently:

1. **Skill Matching**: `DefaultSkillMatcher` matches the best diagnostic skill based on symptom keywords.
2. **Instance Resolution**: `ServiceInstanceLocator` resolves target instance IP and Arthas port based on service name.
3. **Diagnostic Chain Execution**: Iterates over approved read-only diagnostic templates, executing Arthas commands and collecting output.
4. **Constrained Parameter Replacement**: Extracts class/method names from outputs, validating format, length, and whitelists before interpolating into subsequent templates.
5. **AI Diagnostic Report**: Passes diagnostic data to the AI analysis engine to produce structured reports with root causes, remediation advice, and severity ratings.

```java
private void executeDiagnosis(DiagnosisRecord record, DiagnosisRequest request) {
    try {
        // 1. Match Skill
        Optional<SkillDefinition> skillOpt = skillMatcher.findBestMatch(request.getSymptom());
        if (skillOpt.isEmpty()) {
            failDiagnosis(record, "Unable to match a suitable diagnostic skill");
            return;
        }
        SkillDefinition skill = skillOpt.get();
        // ......

        // 2. Resolve Target Instance
        ServiceRegistry instance = instanceLocator.resolveInstance(
                request.getServiceName(), request.getInstanceIp());
        // ......

        // 3. Execute Diagnostic Chain
        List<DiagnosticStep> chain = skill.getDiagnosticChain();
        StringBuilder allDiagnosticData = new StringBuilder();
        String decompiledCode = "";
        Map<String, String> contextVars = new HashMap<>();

        for (int i = 0; i < chain.size(); i++) {
            DiagnosticStep step = chain.get(i);
            // ...... Initialize step entity

            try {
                // Only resolve pre-audited command templates; variables must undergo type and whitelist checks
                String command = resolveCommand(step, contextVars);
                // ......

                // Execute Arthas command and record execution duration
                String result = executeStep(host, port, step, command);

                // If output is from jad, record as decompiled code
                if ("jad".equals(step.getResultType())) {
                    decompiledCode = result;
                }

                // Extract context variables from result for downstream steps
                extractContextVars(result, contextVars);
            } catch (Exception e) {
                // Only allow continuing if the step is explicitly marked as non-critical and read-only
                // ......
            }
        }

        // 4. AI Analysis
        String report = diagnosisAnalyzer.analyze(
                request.getSymptom(), allDiagnosticData.toString(), decompiledCode, skill);

        // 5. Save Report (extract root cause, severity, etc. from Markdown report)
        // ......

        // 6. Update Diagnostic Record Status
        record.setStatus(DiagnosisStatus.COMPLETED.getCode());
        // ......
    } catch (Exception e) {
        failDiagnosis(record, e.getMessage());
    }
}
```

### Agent Interactive UI Integration

During the coding process, I reviewed Spring AI Alibaba's official documentation and noticed it provided an out-of-the-box Agent Chat UI. Rather than generating a frontend from scratch, integrating this component to provide SSE streaming output was much faster. A concise prompt was provided:

```bash
Based on the Spring AI Alibaba official documentation (reference: https://java2ai.com/docs/frameworks/studio/quick-start/), implement the Agent interaction UI frontend.
```

With just a documentation link and one sentence, the AI digested the docs, understood the integration steps, and completed the UI setup. This highlights a practical tip for AI-assisted coding: when integrating an existing component or framework, providing direct doc links is far more efficient than writing long descriptions.

![AI integrates the Agent Chat UI frontend](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/agent-chat-ui-integration-28980a7f.png)

At this point, the primary pipeline needed for a local demo was assembled. It is not yet a production-grade diagnostic platform—beyond functional testing, security controls, fault injection tests, and load protections must be instituted. To test the basic workflow, a CPU-intensive test endpoint was created locally:

```java
@Slf4j
@RestController
public class TestController {
    @RequestMapping("cpu-100")
    public void cpu() {
        while (true) {
        }
    }
}
```

Start the Agent service, access `http://localhost:{port}/chatui/index.html`, and submit in the chatbox: `order-service CPU is spiking to 100%, please assist in troubleshooting`. In this controlled local run, the Agent first gathered an overview via Dashboard, inspected thread stacks to pinpoint the culprit method, used `jad` to decompile the class, and synthesized a diagnostic report. Reports are candidate hypotheses requiring human review, not definitive truths to trigger automated production changes:

![Agent diagnostic demonstration](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/agent-diagnosis-demo-4ae073b0.png)

## Scenario 2: Slow Query Governance on Million-Scale Datasets

While Scenario 1 evaluated AI's "greenfield planning and delivery capabilities from 0 to 1", Scenario 2 tests another dimension: **Can AI accurately comprehend an existing, non-trivial codebase, locate bottlenecks, and execute incremental optimizations?**

### Problem Identification: Search Endpoint Taking 18 Seconds

The target is an order query service based on Spring Boot + MyBatis (`glm-testing-service`), focusing on order retrieval and analytics across four primary endpoints:

| Endpoint | Path | Description |
| --- | --- | --- |
| User Order Query | `POST /api/orders/user` | Query orders by user ID, supporting status filtering |
| Order Search | `POST /api/orders/search` | Search orders by date range + amount + product keyword |
| Category Stats | `GET /api/orders/category-stats` | Aggregate sales summary by category and order status |
| Multi-filter Search | `POST /api/orders/filter` | Combined search by user + multiple statuses + categories |

The database was populated with 1,000,000 mock rows with the following schema:

```sql
CREATE TABLE `orders` (
    `id`           BIGINT PRIMARY KEY AUTO_INCREMENT,
    `order_no`     VARCHAR(64)  NOT NULL,
    `user_id`      BIGINT       NOT NULL,
    `status`       TINYINT      NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `product_name` VARCHAR(256) NOT NULL,
    `category`     VARCHAR(64)  NOT NULL,
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_category` (`category`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

The application tracks endpoint durations via an AOP aspect to detect performance issues:

```java
@Around("controllerPointcut()")
public Object printExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long startTime = System.currentTimeMillis();
    Object result = joinPoint.proceed();
    long costTime = System.currentTimeMillis() - startTime;
    log.info("[{}] {}.{} elapsed: {}ms", Thread.currentThread().getName(), className, methodName, costTime);
    return result;
}
```

Under load testing with a million records, calling the search endpoint (fuzzy keyword matching + date range + amount filter):

```bash
curl -X POST http://localhost:8080/api/orders/search \
  -H "Content-Type: application/json" \
  -d '{"startTime": "2025-01-01", "endTime": "2026-12-31", "minAmount": 500, "productName": "蓝牙", "pageNum": 1, "pageSize": 10}'
```

The system log emitted an alarming slow query alert:

```bash
[http-nio-8080-exec-1] OrderController.searchOrders elapsed: 18375ms
```

A full table scan caused by `LIKE '%蓝牙%'` pushed execution time to over 18 seconds, failing production performance requirements by a wide margin:

![Search endpoint taking 18 seconds test output](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/search-api-18s-result-452a7fbb.png)

### Analysis and Optimization Strategy Design

I fed the slow query log directly to the AI, asking it to analyze the existing code and design an optimization strategy:

```bash
Regarding the slow query issue logged as "[http-nio-8080-exec-1] OrderController.searchOrders elapsed: 18375ms", perform a comprehensive analysis of the order service and provide optimization recommendations.
```

The AI identified the business code, examined the SQL queries and table schemas, and proposed a systematic index optimization strategy:

![Slow query solution provided by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/slow-query-solution-c9b97ca8.png)

It also provided phased optimization steps and projected performance gains:

![Phased optimization recommendations provided by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/phased-optimization-suggestions-6ece73cd.png)

With the plan verified, the implementation command was given:

```bash
Please systematically optimize the slow query module in accordance with the project's existing technology stack.
```

The AI audited the business logic and queries across all endpoints, applying a bottom-up refactor from the database layer up to the application layer:

**Database Layer**—5 candidate indexes suggested by AI:

- Fulltext index `ft_product_name` (ngram parser supporting CJK tokenization) replacing the `LIKE '%xxx%'` full table scan.
- Composite index `idx_create_time_amount` to support time, amount filtering, and sorting.
- Candidate covering index `idx_search_covering` to reduce table lookups for COUNT queries.
- Composite index `idx_user_status_category` optimizing multi-condition queries.
- Covering index `idx_status_category_amount` optimizing category aggregations.

```sql
ALTER TABLE `orders` ADD FULLTEXT INDEX `ft_product_name` (`product_name`) WITH PARSER ngram;
ALTER TABLE `orders` ADD INDEX `idx_create_time_amount` (`create_time` DESC, `total_amount`);
ALTER TABLE `orders` ADD INDEX `idx_search_covering` (`create_time`, `total_amount`, `product_name`);
ALTER TABLE `orders` ADD INDEX `idx_user_status_category` (`user_id`, `status`, `category`);
ALTER TABLE `orders` ADD INDEX `idx_status_category_amount` (`status`, `category`, `total_amount`);
```

**Application Layer**—Synchronous optimization across SQL and Service layers:

- Migrated `LIKE '%xxx%'` search semantics to `MATCH ... AGAINST` fulltext search.
- Added automatic Deferred Joins for deep pagination, utilizing covering index subqueries to resolve primary keys before joining.
- On-demand COUNT queries: default to skipping total count, executing only when the client explicitly requests `needTotal=true`.

Below is the index optimization script generated by the AI. Whether composite indexes are effective depends on leftmost prefix rules, filtering selectivity, sorting order, and optimizer decisions; fulltext indexes also add write and storage overhead. Before running DDL in production, evaluate queries using `EXPLAIN ANALYZE` on real data distributions and prune redundant indexes. Refer to [MySQL Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html) and [ngram Full-Text Parser](https://dev.mysql.com/doc/refman/8.4/en/fulltext-search-ngram.html):

![Index optimization SQL script output by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/index-optimization-sql-798e9b30.png)

The code diff shows the AI replacing `LIKE` fuzzy queries with fulltext search. This is not a drop-in replacement: tokenization, stopwords, short words, substring matches, and default relevance ranking may all shift. Validate tokenization, short queries, and special characters against real search query samples before production rollout:

![Incremental code optimization applied by AI in existing codebase](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/incremental-code-optimization-a90be17d.png)

For deep pagination, the AI proposed a concrete threshold based on the 1M dataset: when `offset` exceeds 1,000, automatically switch to Deferred Join; shallow pagination uses standard queries, while deep pagination first locates primary keys via a covering index subquery:

```java
/** Deep pagination threshold: switch to deferred join when offset exceeds this value */
private static final int DEEP_PAGE_THRESHOLD = 1000;

// Deep pagination (offset > 1000) uses deferred join; shallow pagination uses regular query
boolean isDeepPage = offset > DEEP_PAGE_THRESHOLD;
List<Order> orders;
if (isDeepPage) {
    orders = orderMapper.searchOrdersDeepPage(...);
} else {
    orders = orderMapper.searchOrders(...);
}
```

The value `1000` is merely an initial threshold, not a universal silver bullet for all 1M-row tables. Row width, filtering selectivity, index coverage, sorting requirements, and SLOs all influence the inflection point; run benchmark tests across varied offsets and inspect scanned rows and p95/p99 latency before deciding on deferred joins. Where product design permits, cursor-based pagination on stable keys is usually preferable.

![AI implementation of threshold-based dynamic query strategy for deep pagination](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/deep-pagination-threshold-code-6f1de103.png)

Upon completion, the AI produced an optimization summary comparing performance before and after:

![Optimization summary generated by AI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/optimization-summary-01b9a324.png)

### Optimization Verification

Calling the endpoint after refactoring, this screenshot captures a warmed-up execution time below 300ms—roughly 60x faster than the initial 18,375ms. Note that a single screenshot does not guarantee "consistently below 300ms": solid benchmarking requires documenting hardware, MySQL version and configuration, data distributions, cache warmth, concurrency, and sample sizes, reporting p50/p95/p99 latency alongside error rates.

![Optimized endpoint response time under 300ms](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/optimized-api-300ms-db7d266b.png)

## Practical Takeaways

Reflecting on these two practical scenarios, here are observations and takeaways on using Claude Code + third-party models.

### What AI-Assisted Coding Excels At

| Capability Dimension | Performance in Scenarios | Description |
| --- | --- | --- |
| Requirements to Architecture Planning | Scenario 1: Given requirements, AI completed stack selection and architectural design | Great for rapid concept validation, though architecture requires human review |
| End-to-End Coding Delivery | Scenario 1: Autonomously delivered 46 files across 9 modules | From multi-module scaffolding to business logic, reducing boilerplate effort |
| Incremental Codebase Optimization | Scenario 2: Located and optimized slow queries in a 1M-record codebase | Synthesized table schemas and SQL to propose phased optimization plans |
| Candidate Parameter Generation | Scenario 2: Proposed an initial threshold for deep pagination | Thresholds still require benchmarking and execution plan validation |

### Pitfalls and Caveats

**What worked well**:

- **Fast synthesis of review material**: In Scenario 1, the model quickly produced technical plans and architecture drafts, serving as an effective starting point for review.
- **Multi-layered solution proposals**: In Scenario 2, database-level index adjustments and application-level SQL refactoring were addressed simultaneously.
- **Actionable test parameters**: Scenario 2 generated an initial deep pagination threshold, enabling structured benchmark design.

**Things to watch out for**:

- **Production safety requires explicit design**: Arthas HTTP API flows follow official patterns, but human engineers must institute authentication, instance/command whitelists, approvals, rate limiting, and audit logging.
- **Occasional context lapses across long chains**: During complex, continuous coding tasks, AI can forget earlier design constraints midway through. Break complex tasks into distinct phases and review each independently.
- **Code style and engineering conventions**: While generated architecture is generally sound, alignment with personal or team conventions requires calibration; some naming and structure in Scenario 1 required manual refinement.
- **Trade-off evaluation**: AI proposes multiple approaches but will not weigh trade-offs for your specific context. For example, Fulltext Indexing vs. Elasticsearch, or Deferred Joins vs. Keyset Pagination require human business judgment.

### Recommendations for Claude Code + Third-Party Models

1. **Be specific in requirements prompts**: In Scenario 1, the detailed prompt directly determined the quality of the architecture; vague requirements yield vague outputs.
2. **Review in distinct phases**: Avoid asking AI to generate complex systems from start to finish in one turn. Break the workflow into tech selection → architecture design → coding implementation, reviewing each milestone.
3. **Keep critical decisions under human control**: Architectural choices (caching strategies, pagination approaches) must be judged against business realities that AI cannot foresee.
4. **Leverage documentation links**: When integrating established libraries (e.g., Spring AI Alibaba in Scenario 1), providing direct doc URLs is far more effective than verbose natural language explanations.

## Final Thoughts

Connecting Claude Code to third-party models forms a coherent workflow across context comprehension, task decomposition, and code generation in Agent mode. Across both scenarios, AI-assisted coding substantially compressed the turnaround time from "concept to implementation".

Yet tools remain tools. Looking back at both scenarios:

- **The JVM Diagnostic Agent in Scenario 1** demands an understanding of the Arthas session lifecycle and JVM diagnostic principles, but more crucially, rigorous production permission boundaries. The model should only generate candidate diagnostic steps; it must never be granted unvetted execution rights over arbitrary targets and commands.
- **The slow query governance in Scenario 2** requires a solid grasp of MySQL indexing, fulltext search, and deep pagination mechanics to assess whether AI recommendations fit production—e.g., fulltext indexing introduces overhead in write-heavy environments, and deferred join thresholds must be calibrated against actual data distributions.

AI coding tools are transforming developers from "code writers" into "code reviewers". To make the most of AI, you must understand what you are doing even better than the AI does.

## References

- GLM Coding Plan Model Switching Guide: <https://docs.bigmodel.cn/cn/coding-plan/using5-1>
- Claude Code Installation Guide: <https://docs.anthropic.com/en/docs/claude-code>
- cc-switch Model Switcher: <https://github.com/farion1231/cc-switch>
- Spring AI Alibaba Agent Chat UI Documentation: <https://java2ai.com/docs/frameworks/studio/quick-start/>
- Arthas Official Documentation: <https://arthas.aliyun.com/doc/>
- Arthas HTTP API: <https://arthas.aliyun.com/doc/http-api.html>
- Arthas Authentication Configuration: <https://arthas.aliyun.com/doc/auth.html>
