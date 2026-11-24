---
title: "IDEA + Qoder Plugin Multi-Scenario Practice: API Optimization and Code Refactoring"
description: "Through two real-world practical cases, demonstrate the actual effectiveness of IDEA paired with the Qoder plugin in deep pagination optimization, legacy code refactoring, and share the workflow shift from executor to commander."
category: AI Coding Practice
head:
  - - meta
    - name: keywords
      content: Qoder,IDEA plugin,AI coding,AI assisted development,code refactoring,deep pagination optimization,JetBrains,smart coding
lang: en
sourceRef: zh-ref/ai-coding/cases/idea-qoder-plugin.md
---

Hello everyone, I'm Xiao G. If you are a heavy user of JetBrains IDEs, you've likely experienced this dilemma: you want to use AI-assisted programming, but mainstream tools—Cursor, Trae, Qoder—are mostly based on VS Code. Switch over? You'd hate to lose JetBrains' debugging and refactoring experience. Don't switch? You feel like you're missing out on AI's productivity dividends.

Some friends might say: Aren't terminal tools like Claude Code and Gemini CLI great? They certainly are, but frankly, CLI mode also has noticeable shortcomings: no native UI interaction, and reviewing code or diffs isn't intuitive enough. Although some open-source projects (such as vibe kanban, 1Code) can mitigate this, limitations still exist when tackling complex projects.

Currently, backend developers roughly fall into four camps:

| Camp | Tool Combination | Characteristics |
| --- | --- | --- |
| **CLI Camp** | Claude Code/Gemini CLI/Codex | Terminal operation, high efficiency but weak UI interaction |
| **VS Code Camp** | VS Code + Plugins | Lightweight and flexible, limited functionality |
| **Hybrid Camp** | Write with CLI/AI IDE (e.g., Cursor) → Verify in JetBrains | AI assistance + IDEA safety net |
| **Integrated Camp** | **JetBrains + Qoder Plugin** | **Focused flow state, everything in one window** |

I currently belong to the "Hybrid Camp": Claude Code combined with IDEA + Qoder plugin is my primary setup.

For many projects with complex logic, the sense of control provided by IDEA gives greater peace of mind.

In this article, I will use two real-world practical scenarios to examine the effectiveness of IDEA paired with Qoder in actual development, and share some practical tips.

## Qoder JetBrains Plugin Getting Started Guide

### Installation and Configuration

**Step 1**: Click **Settings \| Plugins**, search for **"qoder"**, select "Qoder - Agentic AI Coding Platform", and install it.

![Plugin installation interface](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/plugin-install-interface-b0a2e253.png)

**Step 2**: After installation completes, click "Sign In" to log in or register.

![Login interface](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/login-interface-10639ce9.png)

**Step 3 (Optional)**: The default interface is English. If preferred, click "Plugin Settings" in the upper right corner to set the Display Language.

![Language settings interface](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/language-settings-interface-5a1e02aa.png)

**Step 4 (Optional)**: Configure the database connection. Qoder supports `@database` context, allowing direct reference to database table schemas. It is recommended to configure the project's database in advance.

Taking MySQL as an example, open the Database tool window on the right side, click the **+** icon, and select **Data Source \| MySQL**:

![Add data source](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/add-data-source-ecfb4efa.png)

Fill in the connection information, and click OK after the connection test passes.

![Database configuration complete](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/database-config-complete-e38cddf5.png)

With that, preliminary preparation is complete.

### Task 1: Frequent Order Query Errors? Using Qoder to Troubleshoot Deep Pagination

#### Background

This is an e-commerce backend management system where the operations department generates monthly business analysis reports. Due to large data volume (order table with 10M+ rows) and tight development schedules, the code had multiple performance risks.

Operations reported that order queries frequently threw errors, pointing to the endpoint:

```bash
curl -X POST http://localhost:8080/api/report/orders \
  -H "Content-Type: application/json" \
  -d '{"page": 1000000, "size": 10}'
```

This is a typical deep pagination request. The API code logic is as follows:

```java
@Transactional(readOnly = true)
public OrderListResponse getOrderList(OrderListRequest request) {
    int pageNum = request.getPage() == null ? 1 : request.getPage();
    int pageSize = request.getSize() == null ? 10 : request.getSize();

    // Core problem: deep pagination query
    Page<Order> pageParam = new Page<>(pageNum, pageSize);

    LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
    if (request.getStatus() != null && !request.getStatus().isEmpty()) {
        wrapper.eq(Order::getStatus, request.getStatus());
    }
    if (request.getShopId() != null) {
        wrapper.eq(Order::getShopId, request.getShopId());
    }

    // Sort field may lack an index, triggering a full table scan
    wrapper.orderByDesc(Order::getCreatedAt);

    // Deep pagination: LIMIT 9999990, 10
    IPage<Order> orderPage = orderMapper.selectPage(pageParam, wrapper);

    // Join query for user, store information...
}
```

When `page=1000000`, MySQL executes `LIMIT 9999990, 10`, requiring it to scan the first 10 million rows before discarding them, causing performance to plummet.

#### The Dilemma of Traditional Approaches

Following the traditional workflow, API tuning requires:

1. Reading and clarifying code logic
2. Analyzing optimization opportunities in code
3. Combining logs to analyze SQL execution plans
4. Proposing and implementing solutions
5. Regression testing and production deployment

If troubleshooting all the way from code and SQL execution plans to regression and deployment, this type of issue is rarely solved by modifying a single line of SQL. The exact time spent depends on project familiarity, data scale, and verification requirements.

#### The Qoder Solution: From Executor to Commander

With Qoder, I spend more time on task breakdown, plan review, and result acceptance.

Simply organize your thoughts and state clear goals:

```bash
Regarding the "java.net.SocketTimeoutException: Read timed out" issue occurring on the order list query interface, please analyze the interface code logic and database level, and provide solutions.

Interface info: POST http://localhost:8080/api/report/orders
Request params: {"page": 1000000, "size": 10}

Please provide solutions covering the following aspects:
1. Analyze factors in the interface code logic that may cause timeouts
2. Inspect database-level issues (indexes, query performance, data volume)
3. Propose specific optimization measures
```

To help Qoder accomplish the task better, add database context:

1. Click the **+Add Context** button
2. Select **@database**, and choose the corresponding database schema

![Add database context](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/add-database-context-1-8556dd7c.png)

#### Problem Analysis and Solution Output

**Locating the code entry point and candidate causes**

Qoder quickly located the code entry point and listed candidate causes such as deep pagination and sorting index issues. The conclusions here still need to be verified with slow query logs and `EXPLAIN ANALYZE`:

![Code analysis result](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/code-analysis-result-ddf06889.png)

**Unique strength: Joint diagnosis of code and database**

Combining the database schema, Qoder delivered a comprehensive analysis report. `@database` is Qoder's current database context capability, suitable for supplementing table schemas and index information, but it cannot replace online execution plans and real data distributions:

![Comprehensive analysis report](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/comprehensive-analysis-report-9fbdaae0.png)

**Code-level optimization**

Qoder provided three solutions, including deferred join queries (subquery returns only IDs, utilizing covering index for rapid positioning):

![Code optimization solution](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/code-optimization-solution-8552af32.png)

**A notable proposal**

For calculating total records in paginated queries, Qoder also offered an estimation proposal: estimating the total through primary key index page count and average rows per page. This is only suitable for scenarios where approximate results are acceptable; error margins are influenced by page holes, fill factors, and data distribution. Financial, billing, or settlement domains requiring exact counts cannot adopt this directly:

![Database optimization suggestions](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/database-optimization-suggestion-8d91ce2f.png)

#### Solution Implementation and Acceptance

After review and evaluation, the deferred join + index optimization approach was chosen:

```bash
Based on the review and evaluation results, execute the following optimizations:
1. Implement deferred join query strategy, refactoring deep pagination query logic
2. Create optimized index structures based on index recommendations
3. Write unit tests covering core functionality points and establishing performance baselines
```

After Qoder completed the implementation, the refactored `getOrderList` method:

- Incorporated production incident insights, configuring maximum page number limits and logic constraints
- Implemented pagination counting and list querying according to different strategies

From the screenshots, the refactored naming and method splitting are noticeably cleaner. Whether it fully complies with team conventions still requires validation through the project's own static analysis and Code Review:

![Refactored code](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/refactored-code-5dcf4955.png)

Index scripts can be executed directly inside the IDE without switching windows throughout the workflow:

![Index execution](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/index-execution-0961d885.png)

**Regression testing**: Qoder sorted through code branches and generated unit tests for different scenarios:

![Unit test](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/unit-test-1-bac4cc5d.png)

**Stress testing phase**: Qoder generated stress testing code and included JIT warmup. Warmup only mitigates interference from cold starts and JIT compilation; it does not mean the test already mirrors production. Determining whether an optimization is effective still requires recording hardware specs, JDK and GC configurations, data distribution, cache state, concurrency model, sample size, as well as p95/p99 latencies:

![Stress testing](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/stress-test-924dd692.png)

Finally, Qoder output a complete work summary, including technical solutions and communication briefing suggestions:

![Work summary](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/work-summary-31c6da91.png)

Clicking Qoder in the code commit window can generate commit messages based on the current diff. In this demonstration, it took about 10 minutes from entering context to generating candidate changes; execution plan re-verification, stress testing, Code Review, and deployment verification are not included in this duration.

![Commit message](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/commit-message-1fe907a5.png)

### Task 2: Clarifying and Refactoring Legacy Refund Code

#### Background: A Chunk of Untouchable "Legacy Code"

In the refund module, the `applyRefund` method spanned **150+ lines of code, with no comments, magic values everywhere, and redundant duplicate logic**. A new requirement arrived: add a risk control rule—**prohibit refund applications for users with uncompleted orders in the past 72 hours**.

**The dilemma of traditional approaches**:

- Complex code logic that nobody dares touch lightly
- Adding new rules requires full regression testing
- Supplementing characterization tests, refactoring, and regression requires effort that must be assessed based on real project conditions

#### Logic Clarification: Letting the Agent Decipher Legacy Code for You

Leveraging the context reasoning capability of Qoder's underlying model and the Agent's task planning and execution abilities, we can instruct it to read and refactor business functionality:

```bash
Please combine a simple data flow to introduce the complete business process of refund applications in detail, and add corresponding comments in the code.
```

To reduce the Agent's guessing of table schemas, submit existing schemas as context to Qoder. Schemas can only supply database structure; they cannot guarantee that its understanding of business rules is 100% correct:

![Add database context](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/add-database-context-2-cda4d3e6.png)

Upon receiving the task, Qoder executed it by starting with an overall overview, then systematically annotating comments branch by branch:

![Logic analysis process](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/logic-analysis-process-c1cdf270.png)

The annotated code became significantly easier to read, though comments and data flows still needed item-by-item verification against original implementations, tests, and product specifications:

![Commented code example](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/commented-code-example-a82e5f85.png)

Once the task completed, Qoder clearly summarized the API logic and special rule corner cases:

![Summary conclusion](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/summary-conclusion-8048fc78.png)

#### Code Refactoring: Establishing a Regression Baseline First

After completing logic clarification, issue the second directive to perform functional refactoring and regression:

```bash
Please follow the team coding standards and refer to the refactoring methods in "Refactoring: Improving the Design of Existing Code" to systematically refactor the refund application functional module. Before refactoring, supplement characterization tests for existing behavior; after refactoring, execute unit tests, integration tests, and critical functional tests covering identified business branches and boundary conditions. Output uncovered branches and behaviors requiring manual confirmation; do not substitute code coverage for equivalence verification between new and old implementations.
```

During this process, Qoder sequentially completed:

1. Target file inspection: Locating the refactoring code section
2. Code issue analysis: Identifying magic values, duplicate code, overly long methods, etc.
3. System refactoring: Successively creating constants, extracting duplicate code, designing domain models, and separating responsibilities
4. Writing test code to complete logic regression

The final generated code is shown below. Qoder did not directly modify the original `RefundService`; instead, it created a new `RefundServiceRefactored`. This leaves room for side-by-side comparison between old and new implementations, but creating a new class does not automatically equate to "safe refactoring": one still needs explicit routing, canary/feature flags, comparing old and new outputs using identical inputs, and an agreed retirement schedule for the legacy implementation, otherwise the two code paths will easily drift apart over time.

```java
/**
 * Refund application (refactored)
 */
@Transactional(rollbackFor = Exception.class)
public RefundResponse applyRefund(RefundApplyRequest request) {
    log.info("[Refund Application] Processing started: orderId={}, userId={}, amount={}",
            request.getOrderId(), request.getUserId(), request.getRefundAmount());

    // 1. Query and validate order
    Order order = getAndValidateOrder(request.getOrderId(), request.getUserId());

    // 2. Determine refund type and process
    if (request.getOrderItemId() != null) {
        return processPartialRefund(request, order);   // Partial refund
    } else {
        return processFullRefund(request, order);      // Full refund
    }
}

/**
 * Handle partial refund
 */
private RefundResponse processPartialRefund(RefundApplyRequest request, Order order) {
    log.info("[Refund Application] Processing partial refund: orderItemId={}", request.getOrderItemId());

    // Query and validate order item
    OrderItem orderItem = orderItemMapper.selectById(request.getOrderItemId());
    refundValidator.validateOrderItemBelongsToOrder(orderItem, order.getId());

    // Validate refund quantity and amount
    Integer refundQuantity = getRefundQuantity(request.getQuantity());
    refundValidator.validateRefundQuantity(refundQuantity, orderItem.getRefundableQuantity());
    BigDecimal itemRefundableAmount = refundCalculator.calculateItemRefundableAmount(orderItem, refundQuantity);
    refundValidator.validateRefundAmount(request.getRefundAmount(), itemRefundableAmount);

    // Perform risk control check + create refund record
    performRiskCheck(order, request.getRefundAmount(), request.getUserId());
    Refund refund = createRefundRecord(request, order, refundQuantity);

    log.info("[Refund Application] Partial refund successful: refundId={}", refund.getId());
    return RefundResponse.success(refund.getId());
}
```

**Refactoring Highlights**:

| Highlight | Description |
| --- | --- |
| **Method Decomposition** | Main method is only 15 lines; partial refund / full refund logics are separated |
| **Separation of Concerns** | `refundValidator` and `refundCalculator` independently handle validation and calculation |
| **Clear Comments** | Each step has corresponding explanations |
| **Standardized Logging** | Uses clear brackets `[...]` to mark key nodes for easy tracing |
| **Exception Handling** | Configures transaction rollback strategies for checked exceptions |

Here, the unit test report showed branch coverage of approximately 80%. This demonstrates that certain paths were executed, but it does not prove that behavior before and after refactoring is completely identical. Critical paths such as amounts, state transitions, concurrent requests, and external dependency failures still require characterization tests, integration tests, or old-vs-new result differential testing:

![Unit test verification](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/unit-test-verification-463ad5cd.png)

#### Feature Iteration: One Directive to Roll Out Rules

After completing structural adjustments and regression baselines, we can locate the risk control logic `validateRiskMaxAmount` and issue the final directive to Qoder:

```bash
Add a new refund restriction rule in the risk control system: When a user has any uncompleted order records within the last 72 hours (3 days), the system should automatically reject refund applications submitted by that user.
```

The corresponding implementation code is shown below. As seen, after clarifying existing logic, the single-responsibility validation framework and supporting unit tests were already in place, making subsequent incremental iterations easy to handle and regress:

![Feature iteration implementation](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/feature-iteration-implementation-6b76516e.png)

#### Memory Retention: The More You Use It, the Better It Understands Your Habits

Upon task completion, Qoder formed project-specific memories. Memory is a current official capability, but whether it takes effect in subsequent tasks still depends on whether memories are correctly saved, recalled, and whether they conflict with the current state:

- **Project Characteristic Memory**: Deferred join queries are preferred over cursor pagination; API optimizations require accompanying performance tests
- **Coding Standard Memory**: Follows the *Alibaba Java Development Manual*; uses `compareTo` for `BigDecimal` comparisons
- **Business Rule Memory**: Refund risk control rules (blocking on 72-hour uncompleted orders, single-transaction amount caps, etc.)

In this demonstration, refund rules and coding conventions were written into the memory list. In subsequent usage, one must still review recalled content and promptly purge outdated rules:

![Memory accumulation](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/memory-accumulation-efa8edb5.png)

## Capability Breakdown: What Qoder Did in This Example

Through the two practical cases above, let's break down what roles Qoder played in the actual development workflow.

### 1. Project Awareness and Context Understanding

Qoder's comprehension capabilities for large-scale engineering projects:

- **Database Schema Awareness**: In Task 1, Qoder analyzed the order table structure and existing indexes using `@database` context, proposing candidate indexing strategies. Whether to adopt them still depends on full SQL statements, selectivity, and execution plans.

- **Code Logic Tracing**: In Task 2, facing uncommented, lengthy refund code, Qoder clarified the business process via static analysis: Order validation → Amount calculation → Risk check → Data persistence, pinpointing code smells such as duplicate code and magic values.

- **Cross-File Correlation**: Qoder automatically senses related files required for tasks, such as automatically tracking from `RefundService` to dependent components like `OrderMapper` and `RefundValidator`, without needing manual context additions.

### 2. End-to-End Task Execution Capability

Qoder does not merely perform code completion; in this example, it participated in analysis, modifications, and test generation:

| Capability Dimension | Observed Performance in This Article | Areas Still Requiring Manual Verification |
| --- | --- | --- |
| **Project Awareness** | Analyzes database schemas and code dependency graphs | SQL execution plans, data distributions, and business rules |
| **Task Execution** | Participates in analysis, design, coding, and test generation | Test effectiveness, code review, and production verification |
| **Refactoring Assistance** | Preserves original implementation while generating new one | Route switching, old-vs-new comparison, and retiring old code |
| **Project Memory** | Saves project conventions and select business rules | Whether memory recall is accurate and content remains valid |

### 3. Progressive Refactoring and Incremental Iteration

Task 2 preserved the original implementation while generating a new one, which can serve as a starting point for progressive migration.

- **Incremental Refactoring**: Qoder did not directly overwrite the existing `RefundService`; it created a new `RefundServiceRefactored` class. Only after supplementing a migration plan does this approach yield the following values:

  - Preserves the original implementation for behavioral comparison
  - Enables gradual switching via feature toggles or canary routing
  - Deletes legacy code once verification passes, preventing dual logic from coexisting indefinitely

- **Separation of Concerns**: Following the Single Responsibility Principle (SRP), Qoder extracted validation logic, amount calculation, and tracking number generation—which were previously intertwined—into independent components:

  - `RefundValidator`: Unified business validation
  - `RefundCalculator`: Amount calculation logic
  - `RefundNoGenerator`: Refund tracking number generation

- **Transaction Boundaries**: `rollbackFor = Exception.class` only takes effect when methods are invoked via Spring proxies, exceptions continue to propagate, and resources participate in the same transaction. Self-invocation, catching and swallowing exceptions, or cross-service operations require separate handling.

### 4. Memory Awareness and Continuous Learning

These memories can be recalled in subsequent interactions. When dealing with business rules, it is recommended to keep formal rules in reviewable, version-controlled project documentation, using Memory merely as auxiliary context.

## Summary

The Qoder JetBrains plugin provides backend developers with a new way of working: **maintaining JetBrains IDE usage habits while harnessing the reasoning, analysis, and coding delivery capabilities of AI Agents**.

Looking back at these two cases:

| Dimension | Help Qoder Can Provide | Engineering Steps That Cannot Be Skipped |
| --- | --- | --- |
| **Analysis** | Code search, schema correlation | Log verification, execution plans, and business rule auditing |
| **Changes** | Generating candidate implementations and tests | Code Review, old-vs-new behavioral comparison |
| **Experience** | Completing most interactions inside IDEA | Real environment stress testing, canary rollout, and production monitoring |
| **Retention** | Saving select project memories | Rule version management and cleanup of expired content |

## Closing Thoughts

The current technical landscape is much like constructing a skyscraper. AI and modern frameworks help you erect scaffolding at blazing speed, and plugins like Qoder let you accomplish all of this inside your familiar IDE environment without switching windows and breaking your focus flow. However, if you lack foundational knowledge of underlying principles and software architecture design thinking, even if AI helps you land functionality, you won't be able to govern the delivery quality of the system.

Reflecting on the two cases in this article:

- **The deferred join query in Task 1** requires understanding database indexing principles to judge whether the solution proposed by Qoder is sound.

- **The code refactoring in Task 2** requires familiarity with SRP, DRY, and other principles from *Refactoring: Improving the Design of Existing Code* and the *Alibaba Java Development Manual* to accurately evaluate the quality of Qoder's refactoring.

- **JIT warmup in performance benchmarking** only resolves part of the interference in benchmarks; without understanding the JVM, data, and load models, results can still be skewed.

- **Solution selection and trade-offs** require grasping business scenarios and technical boundaries. For example, choosing deferred join queries over cursor-based pagination is because the latter degrades user experience—this kind of judgment cannot be made for you by AI.

When using Qoder for such tasks, here are three recommendations:

1. **Keep learning underlying principles**: Database indexing, JVM memory models, concurrent programming fundamentals—this "foundational" knowledge will never depreciate because of AI.

2. **Read classic books**: *Refactoring*, *Design Patterns*, *High Performance MySQL*, *Understanding the JVM*—these classics help you establish the "yardstick" for judging AI output quality.

3. **Cultivate architectural thinking**: Invest the time saved into pondering system architecture and the essence of business requirements.

If you primarily use JetBrains IDEs, the Qoder plugin is a viable candidate solution. It reduces editor switching, but final delivery quality still hinges on execution plans, testing, review, and production verification.
