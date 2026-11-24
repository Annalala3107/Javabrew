---
title: "State Machines and Workflow Orchestration: Selection, Parallel Tasks, and Reliable Execution"
description: Distinguish the responsibilities of state machines and workflow orchestration, and understand conditional transitions, parallel joins, workflow versioning, task idempotency, retry and compensation, and the cost of building a custom engine.
category: System Design
tag:
  - System Design
  - State Machine
  - Workflow
head:
  - - meta
    - name: keywords
      content: State Machine,FSM,Workflow Orchestration,Workflow,Parallel Gateway,Task Idempotency,Workflow Versioning,Failure Compensation
lang: en
sourceRef: zh-ref/system-design/state-machine-and-workflow.md
---

Businesses such as order payment, after-sales review, and product inspection all need to answer two questions: what state is it currently in, and what is allowed next? When a business process also involves multiple tasks, conditional branches, and asynchronous waits, it also needs to know which tasks have already completed and which tasks can proceed.

**State machines are well suited for expressing state transition rules, whereas workflow orchestration focuses on organizing tasks and their dependencies.** The two can be used together: a workflow engine schedules tasks, while each task internally uses a state machine to constrain transitions among states such as "pending, running, succeeded, failed."

## What Problems Does a State Machine Solve?

A typical business state machine includes the following elements:

| Element | Purpose | After-Sales Request Example |
| --- | --- | --- |
| State | Describes the current business stage | Pending Review, Pending Refund, Refunded, Rejected |
| Event | Triggers a state change | Review Approved, Review Rejected, Refund Succeeded |
| Transition | Defines allowed paths between states | Pending Review enters Pending Refund upon receiving Review Approved |
| Guard | Determines whether a transition is currently allowed | Review record is complete and refund amount is valid |
| Action | Operations executed during the transition | Save review result, create refund task |

This consolidates state checks scattered across multiple APIs into unified rules. For example, a request that has already been refunded cannot create a second refund if it receives "Review Approved" again.

However, **having a state diagram does not equal having concurrency control**. Two requests may read "Pending Review" at the same time and respectively try to approve and reject it. When persisting changes, you still need mechanisms such as conditional updates, version numbers, or transactional locks to compete for the same transition, and check the update result. Event deduplication records must also be reliably tied to business state changes.

State machines are not limited to linear execution either. Conditional transitions can express branching; hierarchical state machines can express nested states; and some frameworks also provide multiple parallel regions, forks, and joins. For example, [Spring Statemachine](https://docs.spring.io/spring-statemachine/docs/current/reference/) provides capabilities such as Guards, Regions, Forks, and Joins. What really needs to be evaluated is the expressive power and maintenance cost of the chosen implementation, rather than mistaking the limitations of a simple implementation for limitations of state machines in general.

## When Is Workflow Orchestration Needed?

Suppose a product must complete both "functional inspection" and "appearance photography" before entering storage, and must go into rework if the inspection fails. If you cram all combinations into a single status field, you end up with composite states like "inspection completed but photo not taken" and "photo taken but inspection not completed." As the business continues adding tasks, this representation becomes increasingly difficult to maintain.

You can separate the product's overall status from task execution progress—recording the inspection, photography, and rework tasks separately—and let an orchestrator decide when subsequent tasks are ready to run.

| Business Characteristics | Approaches to Prioritize | Capabilities Requiring Extra Verification |
| --- | --- | --- |
| Few states, stable transition rules | State machine or centrally maintained transition table | Concurrent updates, event deduplication, state persistence |
| Fixed processing steps within a single request | Plain code, Chain of Responsibility, or pipeline | Exception propagation, timeouts, step dependencies |
| Long-running tasks across requests and services | Persistence-backed workflow orchestration | Execution recovery, asynchronous waits, retries, and compensation |
| Manual approvals, timeout escalation, visual configuration | Workflow engine with matching capabilities | Task assignment, permissions, history records, version migration |

The name "workflow orchestration" itself does not guarantee reliable execution. Some components only manage in-process invocation order and do not persist progress. During technology selection, validate restart recovery, parallel branches, failure retries, and manual intervention using actual workflows, rather than simply comparing how many node types are supported.

## Separate Process Definitions from Execution Instances

A configurable workflow must distinguish at least the following categories of information, which do not necessarily map one-to-one to database tables:

- **Node template**: Describes the execution capability, inputs, and outputs of a certain type of task—for example, image validation.
- **Process definition**: Describes nodes, dependencies, branching rules, timeouts, and retry policies, with an explicit version.
- **Process instance**: Represents a single workflow execution for a business document, bound to the definition version selected at startup.
- **Node instance or task instance**: Records the concrete task, inputs, outputs, status, and attempt count in this execution. When the same node executes in a loop, different rounds must be distinguishable.
- **Events and execution logs**: Record the trigger source, processing result, and exceptions to support deduplication, recovery, and troubleshooting.

Published process definitions should remain immutable; publish a new version after modifications. Existing instances can continue running on the old version; if migration is required, current node mappings, variable transformations, and business side effects that have already occurred must be clearly defined. Simply changing the version number on an instance can send an in-flight task to a nonexistent or incompatible node.

## How Should Parallel Branches Join Correctly?

Taking the requirement that both inspection and photography must finish before warehousing as an example, the orchestrator cannot simply "proceed upon receiving two completion messages," because the two messages could be duplicate notifications for the same task.

You can design the join with the following steps:

1. When creating the parallel branches for the current round, record the inspection task ID and photography task ID that need to be awaited.
2. Upon receiving a completion event, update the corresponding task idempotently so duplicate events do not increment the completed count.
3. Serialize checking and advancing the current round's join condition—for example, locking the same join record inside a transaction before reading completion status; once all required tasks succeed, use a unique constraint to ensure the warehousing task is generated only once. When using optimistic locking, the side that loses the race must retry the check rather than discarding the event.
4. Define clear handling rules for failure, cancellation, timeout, and rework to avoid infinite waiting and to prevent results from a previous inspection round from being counted toward the current round.

A unique constraint alone can prevent creating duplicate downstream tasks, but it cannot guarantee that the workflow will definitely advance: if two concurrent transactions cannot see the task the other just completed, both may judge that "the condition is not yet met." Therefore, unified concurrency control at the join is also needed, along with the ability to re-check via event redelivery or recovery scanning after process interruption.

Conditional branches and parallel branches must also be distinguished. An exclusive branch follows only the selected path and cannot wait at the end for unselected branches; a parallel branch requires waiting for all designated paths to finish. Exact gateway semantics depend on the engine implementation; you can refer to [Camunda's Workflow Patterns documentation](https://docs.camunda.io/docs/components/concepts/workflow-patterns/).

## Why Do Task Retries Still Require Idempotency?

When a remote call times out, there are two possibilities: the counterparty did not process it, or it already succeeded and only the response failed to arrive. Therefore, when the orchestrator redelivers a task, the executor still needs to ensure that repeated invocations do not cause duplicate deductions, shipments, or business records.

For example, [Camunda's Job Workers documentation](https://docs.camunda.io/docs/components/concepts/job-workers/) explicitly notes that task timeouts can cause multiple workers to process the same task, so task code must support idempotency.

When designing for reliable execution, take these situations into account:

- **Use a stable idempotency key for the same business operation**: Retries should reuse the business operation ID; a new legitimate round of operation should be assigned a new ID rather than deduplicating simply by node name.
- **Reliably bridge completion status and subsequent scheduling**: If you save "completed" first and then send an MQ message, the process may exit before sending the message. You can place the task status and pending outbound event in the same local transaction and deliver asynchronously later; consumers deduplicate by event ID.
- **Distinguish business rejections from transient failures**: Invalid parameters or failed approvals should generally take a business branch; network failures can be retried a limited number of times with backoff, and after exceeding a threshold enter a queryable, actionable exception state.
- **Design compensation at the business level**: External operations that have already completed cannot necessarily be undone by a database rollback. Compensation actions such as refunds, releasing reservations, and canceling bookings can also fail, and therefore require idempotency, retries, and a manual intervention entry point.

A workflow engine manages execution progress; it cannot automatically combine multiple business systems into a single atomic transaction. For cross-service consistency, continue reading [Distributed Transactions](../distributed-system/distributed-transaction.md).

## What Costs Should Be Evaluated Before Building a Custom Engine?

Separating workflow configuration, scheduling, and node execution makes it easier to adjust business rules and task implementations independently. However, a production-ready workflow engine also needs to handle execution progress, fault recovery, and version compatibility—capabilities that are often harder to maintain than the call relationships between nodes.

Before building your own engine, in addition to node scheduling, evaluate whether there is sustained ownership to maintain the following:

- Pre-publish validation of configurations for unreachable nodes, missing outgoing transitions, branch conflicts, non-terminating loops, and invalid inputs/outputs.
- Persisting progress, recovering interrupted tasks, limiting concurrency, and handling backlogs.
- Managing compatibility among workflow versions, executor versions, and in-flight instances.
- Restricting the capabilities and execution resources of configuration expressions, and retaining publish, rollback, and audit logs.
- Surfacing which step an instance is stuck on, why it failed, whether it can be retried, and who performed manual handling.

If the complexity mainly stems from minor business variations, you can first extract rule and task interfaces and add orchestration capabilities incrementally. Whether to adopt a mature engine or build in-house should be decided jointly by workflow requirements, migration costs, fault recovery capabilities, and load-testing results under comparable conditions.
