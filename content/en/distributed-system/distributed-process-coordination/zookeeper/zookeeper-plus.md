---
title: "ZooKeeper Advanced Guide: ZAB Protocol, Leader Election, Cluster Deployment, and Session Mechanism"
category: Distributed Systems
description: "ZooKeeper advanced guide providing an in-depth explanation of the ZAB protocol, Leader election, cluster deployment strategies, the odd-node-count principle, session management, the Watcher mechanism, and comparisons with registries such as Eureka and Nacos."
tag:
  - ZooKeeper
head:
  - - meta
    - name: keywords
      content: ZooKeeper,ZooKeeper Advanced,ZAB Protocol,Leader Election,Cluster Deployment,Session Management,Watcher,Eureka Comparison,Nacos Comparison,Distributed Coordination,CP System
lang: en
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/zookeeper-plus.md
---

> Contributed by [FrancisQ](https://juejin.im/user/5c33853851882525ea106810).

## What Is ZooKeeper

`ZooKeeper` was originally developed by `Yahoo` and later donated to `Apache`, where it is now an `Apache` top-level project. `ZooKeeper` is an open-source distributed application coordination server that provides consistency services for distributed systems. Its consistency is achieved through the **ZAB (ZooKeeper Atomic Broadcast)** protocol designed specifically for ZooKeeper. Its primary capabilities include configuration maintenance, distributed synchronization, cluster management, and more.

Simply put, `ZooKeeper` is a **distributed coordination service framework**. Distributed? Coordination service? What does all that mean? 🤔🤔

In fact, when explaining the concept of "distributed," I find that some developers cannot clearly distinguish between **distributed systems and clusters**. Not long ago, a peer was discussing distributed architecture with me and said: "Isn't 'distributed' just adding more machines? When one machine can't handle the load, you just add another machine to share the traffic." Of course, adding machines isn't wrong per se—a distributed system inevitably involves multiple machines—but don't forget there is a closely related concept in computer science: **`Cluster`**. Doesn't clustering also add machines? Yet clusters and distributed systems are two completely different concepts.

For instance, suppose I have a flash-sale service whose concurrency is too high for a single machine to handle, so I add several more servers that **all run the exact same** flash-sale service. That is a **`Cluster`**.

![cluster](/media/jg/ext/oss.javaguide.cn/p3-juejin/60263e969b9e4a0f81724b1f4d5b3d58-tplv-k3u1fbpfcp-5f8bd139.jpg)

However, suppose I take a different approach: I **split** the flash-sale service **into multiple sub-services**—such as an order-creation service, a points-awarding service, a coupon-deduction service, and so on—**and deploy these sub-services on separate servers**. That is **`Distributed`**.

![distributed](/media/jg/ext/oss.javaguide.cn/p3-juejin/0d42e7b4249144b3a77a0c519216ae3d-tplv-k3u1fbpfcp-d25ad6f0.jpg)

And why did I push back on my peer saying "distributed just means adding machines"? Because I think "adding machines" fits building a cluster much better, since clustering truly is just adding machines. For a distributed system, by contrast, you first have to decompose the business domain and then add machines (it is far from merely adding servers)—and at the same time, you have to solve a whole range of problems introduced by distribution.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/e3662ca1a09c4444b07f15dbf85c6ba8-tplv-k3u1fbpfcp-ed3763e3.jpg)

For example: how do distributed components coordinate with one another, how do we reduce coupling between systems, how do we handle distributed transactions, how do we configure the entire distributed system, and so forth? `ZooKeeper` is built primarily to solve these problems.

## The Consistency Problem

Designing a distributed system inevitably runs into a core dilemma: **because partition tolerance must exist, we are forced to make a trade-off between system availability and data consistency**. This is the famous `CAP` theorem.

It is actually quite easy to grasp. Imagine a school class as the entire system, and each student as an independent subsystem. Suppose Xiaohong and Xiaoming are secretly dating, and the class gossip Xiaohua discovers it; thrilled, Xiaohua starts telling everyone around her, so news of Xiaohong and Xiaoming dating begins spreading across the class. While this message is still propagating, suppose you grab a student and ask what's going on: if they answer "I don't know," then the class system exhibits data inconsistency (because Xiaohua already knows). On the other hand, if they refuse to answer you at all because news is still propagating throughout the class (to ensure consistency, everyone must know before anyone can answer), then the system suffers an availability issue.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/38b9ff4b193e4487afe32c9710c6d644-tplv-k3u1fbpfcp-5e314f1c.jpg)

The first behavior corresponds to `Eureka`'s approach, which prioritizes AP (Availability); the second behavior corresponds to `ZooKeeper`'s approach, which we are discussing today and which prioritizes CP (Consistency).

## Consistency Protocols and Algorithms

To solve the data consistency problem, scientists and engineers have explored endlessly and produced many consistency protocols and algorithms, such as 2PC (Two-Phase Commit), 3PC (Three-Phase Commit), the Paxos algorithm, and so on.

Now think about a question: if students pass notes to spread messages, an issue arises—how do I know whether my little note actually reached the person I intended to send it to? What if some mischievous classmate intercepted and tampered with it, right?

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/8c73e264d28b4a93878f4252e4e3e43c-tplv-k3u1fbpfcp-fcb5330b.jpg)

This leads to a classic concept—the **Byzantine Generals Problem**. It states that **trying to reach consensus via message passing over an unreliable channel is impossible**; therefore, a **prerequisite** for all consensus algorithms is a safe and reliable communication channel.

And why do we need to solve data consistency in the first place? Think about it: if a flash-sale system splits into an order service and a points service deployed on separate machines, what if the points system crashes while the message is in flight? You certainly can't let an order go through without awarding points, right? You have to guarantee that data on both sides stays consistent.

### 2PC (Two-Phase Commit)

Two-Phase Commit is a protocol for ensuring data consistency in distributed systems. Today, many databases use the Two-Phase Commit protocol to handle **distributed transactions**.

Before diving into 2PC, let's think about what problem distributed transactions actually face.

Let's stick with the order service and points service of our flash-sale system as an example (you're probably sick of it by now 🤮🤮🤮). After placing an order, we send a message to the points system telling it to add points. If we just send the message without waiting for a reply, how could the order system know whether the points system received it? If we add a reply step, what if the points system receives the message and returns a `Response` to the order system, but a network hiccup drops that reply? Wouldn't the order system assume the points system failed to receive the message and roll back its transaction? Meanwhile, the points system actually received the message, processes it, and adds points for the user—ending up with points added even though the order failed.

Therefore, what we need to solve is ensuring that across the entire call chain in a distributed system, data operations across all services either all succeed or all fail—that is, the **atomicity problem** across all services.

Two-Phase Commit involves two roles: the Coordinator and the Participants.

Phase 1: When a distributed transaction is to be executed, the transaction initiator first sends a transaction request to the Coordinator. The Coordinator then sends a `prepare` request (containing the transaction details) to all Participants, telling them: here is the transaction to execute—if you can execute what I sent, execute it without committing yet, and report back to me. Upon receiving the `prepare` message, Participants begin executing the transaction (without committing), write `Undo` and `Redo` records to their transaction logs, and then report back to the Coordinator whether they are ready.

Phase 2: In Phase 2, the Coordinator decides whether to commit or roll back the transaction based on the Participants' responses.

For example, if **all Participants** respond that they are ready, the transaction proceeds to commit: the Coordinator sends a **`Commit` request** to all Participants. When a Participant receives the `Commit` request, it **commits** the transaction executed in Phase 1 and sends a commit-success acknowledgment back to the Coordinator.

Conversely, if in Phase 1 not every Participant responded that it was ready, the Coordinator sends a **`rollback` request** to all Participants. Upon receiving it, Participants **roll back the transaction work performed in Phase 1** and report the outcome to the Coordinator; once the Coordinator receives the responses, it returns a failure result to the transaction initiator.

![2PC Flow](/media/jg/ext/oss.javaguide.cn/p3-juejin/1a7210167f1d4d4fb97afcec19902a59-tplv-k3u1fbpfcp-b434cd25.jpg)

Personally, I find 2PC rather underwhelming, because it essentially only solves transaction atomicity while introducing a host of new problems:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/cc534022c7184770b9b82b2d0008432a-tplv-k3u1fbpfcp-f519728e.jpg)

- **Single Point of Failure**: If the Coordinator crashes, the entire system becomes unavailable.
- **Blocking Issue**: When the Coordinator sends a `prepare` request, any Participant that can handle it executes the transaction without committing, holding onto locked resources the entire time. If the Coordinator crashes at that moment, those resources are never released, severely degrading performance.
- **Data Inconsistency**: For example, during Phase 2, if the Coordinator crashes after sending only part of the `commit` requests, the Participants that received the message will commit the transaction while those that did not receive it will not commit—resulting in data inconsistency.

### 3PC (Three-Phase Commit)

Because of 2PC's issues—such as single points of failure and weak fault tolerance—**3PC (Three-Phase Commit)** emerged. What are its three phases?

> Definitely don't mistake PC for "Personal Computer"—it stands for Phase-Commit!

1. **CanCommit Phase**: The Coordinator sends a `CanCommit` request to all Participants. Each Participant inspects its own state to check whether it can execute the transaction; if yes, it replies `YES` and enters a ready state, otherwise it replies `NO`.
2. **PreCommit Phase**: Based on the Participants' replies, the Coordinator decides whether to proceed with `PreCommit`. If all Participants replied `YES`, the Coordinator sends a `PreCommit` request to all Participants. **Upon receiving the `PreCommit` request, Participants execute the transaction and write `Undo` and `Redo` records into their transaction logs**, returning a success response if execution succeeds. If in Phase 1 the Coordinator received **any `NO`** response, or **did not receive responses from all Participants within a timeout**, it aborts the transaction by sending an `abort` request to all Participants; upon receiving an abort request (or timing out waiting for the Coordinator), a Participant immediately aborts the transaction.
3. **DoCommit Phase**: This phase is similar to Phase 2 of `2PC`. If the Coordinator received `YES` from all Participants in the `PreCommit` phase, it sends a `DoCommit` request to all Participants. **Upon receiving `DoCommit`, Participants commit the transaction** and send an acknowledgment back; once all acknowledgments are received, the transaction completes. If during `PreCommit` the Coordinator **received any `NO` or failed to receive all responses within the timeout**, it sends an abort request; Participants then **use the undo logs recorded earlier** to roll back the transaction and report the rollback status to the Coordinator, which aborts the transaction upon receiving the replies.

![3PC Flow](/media/jg/ext/oss.javaguide.cn/p3-juejin/80854635d48c42d896dbaa066abf5c26-tplv-k3u1fbpfcp-5e7b4fe7.jpg)

> Above is the flowchart for `3PC` in the success case. Notice that `3PC` introduces timeout-based abort handling in multiple places—for example, if the Coordinator fails to receive all confirmations within a specified period, it aborts the transaction, which **reduces synchronous blocking time**. Also note that **in `3PC`'s `DoCommit` phase, if a Participant does not receive the commit request from the Coordinator within a certain timeout, it goes ahead and commits the transaction**. Why? Because by entering Phase 3, we have already **guaranteed that every Participant responded in Phase 1 that it could execute the transaction**, so we have good reason to **believe all other nodes can execute and commit the transaction**—therefore, **regardless** of whether the Coordinator manages to send the message, Participants reaching Phase 3 will commit.

In summary, `3PC` effectively alleviates blocking through timeout mechanisms, yet it still does not fundamentally solve the core consistency problem. For example, in the `DoCommit` phase, if one Participant receives the commit request while the other Participants and the Coordinator crash or encounter a network partition, the Participant that received the request commits while others might not—still leading to data inconsistency.

Thus, solving consistency reliably requires turning to the `Paxos` algorithm ⭐️ ⭐️ ⭐️.

### The `Paxos` Algorithm

The `Paxos` algorithm is a **message-passing-based consensus algorithm with strong fault tolerance**. It is widely recognized as one of the most effective algorithms for solving distributed consensus—**addressing how a distributed system reaches agreement on a single value (decision)**.

`Paxos` defines three main roles: `Proposer`, `Acceptor`, and `Learner`. Like `2PC`, `Paxos` operates in two phases: the `Prepare` phase and the `Accept` phase.

#### Prepare Phase

- `Proposer`: Responsible for submitting a `proposal`. Before proposing, each Proposer acquires a **globally unique, monotonically increasing proposal number `N`** (unique across the entire cluster), assigns `N` to its proposal, and **in Phase 1 sends only the proposal number to all Acceptors**.
- `Acceptor`: After accepting a proposal, each Acceptor records that proposal number `N` locally. Thus, among all proposals accepted by an Acceptor so far, there is a **highest-numbered proposal**, say with number `maxN`. Each Acceptor only accepts proposals with a number greater than its local `maxN`, and when responding to a prepare request, the Acceptor returns the highest-numbered proposal it has previously accepted (if any) back to the `Proposer`.

> Below is the flowchart for the `prepare` phase for your reference.

![Paxos Phase 1](/media/jg/ext/oss.javaguide.cn/p3-juejin/cd1e5f78875b4ad6b54013738f570943-tplv-k3u1fbpfcp-78086759.jpg)

#### Accept Phase

Once a proposal is initiated by a `Proposer`, if the `Proposer` receives promises/approvals from more than half of the `Acceptors` (including the `Proposer` itself if applicable), the `Proposer` sends the actual proposal to all `Acceptors` (you can think of Phase 1 as probing), this time sending both the proposal value and the proposal number.

Upon receiving the accept request, each Acceptor checks its highest promised/accepted proposal number against the incoming proposal number. If the incoming proposal number is **greater than or equal to** the highest proposal number it has already accepted/promised, it `accepts` the proposal (executing the proposal content without committing yet) and reports back to the `Proposer`. Otherwise, it either ignores the request or replies `NO`.

![Paxos Phase 2 Part 1](/media/jg/ext/oss.javaguide.cn/p3-juejin/dad7f51d58b24a72b249278502ec04bd-tplv-k3u1fbpfcp-beee9e7a.jpg)

When the `Proposer` receives `accept` confirmations from more than half of the Acceptors, it sends a commit request for the proposal to all `Acceptors`. Note that since only a majority of Acceptors approved and executed that proposal content while the rest did not, the Proposer must **send both the proposal content and the proposal number to the Acceptors that did not approve it so they unconditionally execute and commit it**, whereas for Acceptors that already approved the proposal, **it only needs to send the proposal number** so they can commit it.

![Paxos Phase 2 Part 2](/media/jg/ext/oss.javaguide.cn/p3-juejin/9359bbabb511472e8de04d0826967996-tplv-k3u1fbpfcp-2f9191ff.jpg)

If the `Proposer` does not receive `accept` confirmations from more than half of the Acceptors, it **increments** the `Proposal` number and **re-enters the `Prepare` phase**.

> As for how `Learners` learn the proposal value approved by the `Acceptors`, there are several approaches; readers can explore those on their own, as we will not elaborate further here.

#### The Livelock Problem in Paxos

This is somewhat like two people arguing: Xiaoming says "I'm right!" and Xiaohong says "No, I'm right!"—neither backing down 🤬🤬.

Suppose Proposer P1 proposes M1 and finishes the `Prepare` phase, and the `Acceptors` promise M1. At the same time, Proposer P2 proposes M2 and also finishes the `Prepare` phase. Now P1's proposal can no longer be accepted in Phase 2 (because Acceptors have already promised M2 > M1), so P1 increments its proposal to M3 and restarts `Prepare`; Acceptors promise the newer M3, so they can no longer accept M2, causing M2 to increment and restart `Prepare`...

They could keep proposing back and forth forever—this is the livelock (infinite loop) problem of the `Paxos` algorithm.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/bc3d45941abf4fca903f7f4b69405abf-tplv-k3u1fbpfcp-c722c37c.jpg)

How do we solve it? Simple: too many cooks spoil the broth—**allow only one node to propose**.

## Introducing ZAB

### ZooKeeper Architecture

As an efficient and reliable distributed coordination framework, `ZooKeeper` does not use `Paxos` directly to solve distributed data consistency; instead, it uses a custom consensus protocol called **`ZAB` (ZooKeeper Atomic Broadcast)**, which provides strong support for **crash recovery**.

![ZooKeeper Architecture](/media/jg/ext/oss.javaguide.cn/p3-juejin/07bf6c1e10f84fc58a2453766ca6bd18-tplv-k3u1fbpfcp-25fab086.png)

### Three Roles in ZAB

Just as with `Paxos`, before diving into the `ZAB` protocol, let's review the three primary roles in `ZAB`: `Leader`, `Follower`, and `Observer`.

- `Leader`: **The sole handler of write requests** in the cluster, capable of initiating votes (which are likewise used to process write requests).
- `Follower`: Receives client requests—if it is a read request, it handles it directly; **if it is a write request, it forwards it to the `Leader`**. Participates in voting during Leader election, holding **both voting rights and eligibility to be elected**.
- `Observer`: Effectively a `Follower` without voting rights or eligibility to be elected.

In the `ZAB` protocol, `zkServer` (the collective term for all three roles above) also operates in two modes: **Message Broadcast** and **Crash Recovery**.

### Message Broadcast Mode

Put plainly, this describes how the `ZAB` protocol processes write requests. Earlier we noted that only the `Leader` can process write requests, right? So don't `Followers` and `Observers` also need to **synchronize and update their data**? Otherwise data would only be updated on the `Leader` while other roles remain stale!

Isn't the goal simply **maintaining data consistency across the entire cluster**? If you were designing it, how would you do it?

Obviously, the first step is for the `Leader` to **broadcast** the write request to ask `Followers` whether they agree to the update; if more than half agree, then `Followers` and `Observers` commit the update (just like `Paxos`). That sounds a bit abstract in words—let's illustrate it with a diagram.

![Message Broadcast](/media/jg/ext/oss.javaguide.cn/p3-juejin/b64c7f25a5d24766889da14260005e31-tplv-k3u1fbpfcp-91a51055.jpg)

Hmm... looks straightforward, seems clear enough 🤥🤥🤥. Wait—where did those two `Queues` come from? The answer is that **`ZAB` must guarantee ordering for `Followers` and `Observers`**. What does ordering mean? Suppose I have a write request A, and the `Leader` broadcasts request A. Because only a majority agreement is required, suppose a `Follower` F1 misses A momentarily due to network issues, and the `Leader` then broadcasts request B. Due to network anomalies, F1 happens to receive request B before receiving request A—processing requests in a different order would yield different state, thereby **causing data inconsistency**.

Therefore, on the `Leader` side, it maintains a dedicated **queue** for every other `zkServer` and sends messages in FIFO order. Because the protocol communicates **over `TCP`**, both sending order and receiving order are guaranteed.

In addition, `ZAB` defines a **globally monotonically increasing transaction ID `ZXID`**, a 64-bit `long` where the upper 32 bits represent the `epoch` and the lower 32 bits represent the transaction counter. The `epoch` changes whenever the `Leader` changes—when a `Leader` crashes and a new `Leader` takes over, the `epoch` increments. The lower 32 bits can simply be understood as an incrementing transaction ID.

This `ZXID` is also defined to preserve ordering: every `proposal` generated by the `Leader` is **ordered by its `ZXID`** before processing.

### Crash Recovery Mode

When talking about crash recovery, we must start with `ZAB`'s `Leader` election algorithm. In a system crash, the single biggest impact comes from a `Leader` crash, because there is only one `Leader`—so whenever something happens to the `Leader`, a new `Leader` must be elected.

`Leader` election occurs in two situations: first, re-election when the `Leader` crashes; second, initial `Leader` election when `ZooKeeper` starts up. Let's first examine how `ZAB` performs initial election.

Suppose our cluster has 3 machines, meaning we need agreement from at least 2 machines (strict majority). Suppose we start `server1` first: it begins by **voting for itself**, with vote content consisting of the server's `myid` and `ZXID`. Because this is startup, `ZXID` is `0`, so `server1`'s vote is `(1, 0)`. With only 1 vote, `server1` cannot yet become `Leader`, so the cluster remains in the **`Looking`** state.

Next, `server2` starts up. It also votes for itself `(2, 0)` and broadcasts its vote (`server1` did too, though there were no other servers online at the time). When `server1` receives `server2`'s vote, it compares that vote against its own. **First, it compares `ZXID`—the larger `ZXID` wins priority as `Leader`; if `ZXID`s are equal, it compares `myid`—the larger `myid` wins priority as `Leader`**. Seeing that `server2` is a better candidate for `Leader`, `server1` changes its own vote to `(2, 0)` and broadcasts it again. When `server2` receives this vote, it sees the vote matches its own (no change needed) and now has **more than half of the votes**, so **`server2` is elected `Leader`**, while `server1` transitions itself to `Following` and becomes a `Follower`. The servers transition from `Looking` to normal operating state.

When `server3` starts up and sees that the cluster is no longer in the `Looking` state, it joins the cluster directly as a `Follower`.

Using the same 3-server example, what happens if `server2` crashes while the cluster is running? How does the cluster re-elect a `Leader`? It works almost identically to initial election.

First, the remaining two `Followers` immediately transition their state **from `Following` to `Looking`**, and each `server` votes for itself just like during initial election (except now `zxid` is no longer `0`—let's pick arbitrary numbers for convenience).

Suppose `server1` votes for itself `(1, 99)` and broadcasts to the other servers, while `server3` votes for itself `(3, 95)` and broadcasts as well. `server1` and `server3` receive each other's votes and compare them just like before (larger `zxid` first, then larger `myid` on ties). Seeing `server3`'s vote is inferior to its own, `server1` keeps its vote unchanged; seeing `server1`'s vote is better, `server3` updates its vote to `(1, 99)` and broadcasts it. Finally, `server1` sees its vote count exceeds half of the cluster, sets itself as `Leader`, and `server3` becomes a `Follower`.

> Notice why `ZooKeeper` recommends an odd number of nodes! With 3 nodes, if 1 crashes, the cluster keeps working; if 2 crash, it stops working (fewer than half remain, so voting and quorum writes cannot proceed). If we had 4 nodes, 1 crash still works, **but 2 crashes still stop the cluster**—giving the exact same fault tolerance as 3 nodes, while 3 nodes require one fewer machine. That's why `ZooKeeper` recommends an odd number of `servers`.

Now that we've covered `ZAB`'s `Leader` election, what exactly is **Crash Recovery**?

Essentially, it answers: **when machines in the cluster crash, how does the entire cluster guarantee data consistency?**

If only `Followers` crash—and fewer than half crash—because the `Leader` maintains per-server queues as described earlier, we don't need to worry about missed updates causing data inconsistency.

If the `Leader` crashes, things are trickier: we must pause service, enter the `Looking` state, and elect a new `Leader` (as shown above). Beyond that, crash recovery must handle two specific scenarios: **ensuring proposals already committed by the Leader are eventually committed by all Followers**, and **skipping/discarding uncommitted proposals that must be dropped**.

What does "ensuring proposals already committed by the Leader are eventually committed by all Followers" mean?

Suppose `Leader (server2)` sends a `commit` request (see Message Broadcast Mode above); it delivers the commit to `server3`, and right before sending it to `server1`, `server2` crashes. If `server1` were chosen as the new `Leader`, data inconsistency would occur—because `server3` will commit the proposal from `server2`, whereas `server1` never received it and would omit it.

![Crash Recovery](/media/jg/ext/oss.javaguide.cn/p3-juejin/4b8365e80bdf441ea237847fb91236b7-tplv-k3u1fbpfcp-df5dff6f.jpg)

How is this prevented?

Astute readers will point out immediately: **at this point `server1` can never become `Leader`, because when `server1` and `server3` exchange election votes they compare `ZXID`, and `server3`'s `ZXID` is guaranteed to be greater than `server1`'s**. (If that's unclear, revisit the election algorithm above.)

Now, what does "skipping proposals that have been discarded" mean?

Suppose `Leader (server2)` approves proposal `N1`, commits the transaction locally, and is about to send `commit` messages to all `Followers`—when it crashes before sending them. The cluster re-elects a `Leader`, say `server1` (which doesn't matter). Later, the **crashed `Leader` recovers** and rejoins the cluster as a `Follower`. Notice that `server2` had already locally committed proposal `N1`, yet none of the other `servers` received its `commit` message, so the rest of the cluster cannot commit `N1`. To avoid data inconsistency, **proposal `N1` must ultimately be discarded**.

![Crash Recovery](/media/jg/ext/oss.javaguide.cn/p3-juejin/99cdca39ad6340ae8b77e8befe94e36e-tplv-k3u1fbpfcp-e04d28c8.jpg)

## Theoretical Concepts of ZooKeeper

Understanding `ZAB` alone isn't enough—that is merely how `ZooKeeper` works internally. How do we use `ZooKeeper` to build real-world applications like cluster management, distributed locks, `Master` election, and so on?

That brings us to how to use `ZooKeeper`. Before using it, we need to master a few core concepts: `ZooKeeper`'s **data model**, **session mechanism**, **ACL**, **Watcher mechanism**, and more.

### Data Model

`ZooKeeper`'s data storage structure closely resembles a standard `Unix` file system, with many child nodes attached beneath a root node in a tree structure. However, instead of directories and files, `ZooKeeper` **uses `znode` as its data node**. A `znode` is the smallest unit of data in `ZooKeeper`; each `znode` can store data and also host child nodes, forming a hierarchical namespace.

![zk Data Model](/media/jg/ext/oss.javaguide.cn/p3-juejin/663240470d524dd4ac6e68bde0b666eb-tplv-k3u1fbpfcp-be2a9b21.jpg)

Every `znode` has its own **node type** and **node status (`Stat`)**.

Node types fall into four categories: **Persistent nodes**, **Persistent sequential nodes**, **Ephemeral nodes**, and **Ephemeral sequential nodes**.

- Persistent node: Once created, it remains until explicitly deleted.
- Persistent sequential node: A parent node can **maintain a creation order** for its child nodes, reflected in the **node name** by automatically appending a 10-digit sequence number starting from 0.
- Ephemeral node: The lifecycle of an ephemeral node is bound to the **client session**; **when the session ends, the node disappears**. Ephemeral nodes **can only be leaf nodes** and cannot have child nodes.
- Ephemeral sequential node: A parent node can create an ephemeral node that preserves sequential ordering (just like persistent sequential nodes above).

A node's status contains many attributes such as `czxid` and `mzxid`, maintained by the `Stat` class in `ZooKeeper`. Below is an explanation of these attributes:

- `czxid`: `Created ZXID`—the transaction ID when the data node was **created**.
- `mzxid`: `Modified ZXID`—the transaction ID when the node was **last updated**.
- `ctime`: `Created Time`—the timestamp when the node was created.
- `mtime`: `Modified Time`—the timestamp when the node was last modified.
- `version`: Data version number of the node.
- `cversion`: Version number of the **child nodes**.
- `aversion`: `ACL` version number of the node.
- `ephemeralOwner`: The `sessionID` of the session that created the node; `0` if the node is persistent.
- `dataLength`: Byte length of the node's data payload.
- `numChildre`: Number of child nodes under this node (`0` for ephemeral nodes).
- `pzxid`: The transaction ID when the node's child list was last modified—note that this tracks the child **list**, not child data contents.

### Session

This should be familiar to every backend developer—isn't it just a `session`? Here, the `zk` client and server maintain their session over a **persistent `TCP` connection**; essentially, you can think of a session as **maintaining an active connection state**.

In `ZooKeeper`, sessions also emit corresponding events such as `CONNECTION_LOSS`, `SESSION_MOVED`, and `SESSION_EXPIRED`.

### ACL

`ACL` stands for `Access Control Lists`, a permission control mechanism. `ZooKeeper` defines 5 permissions:

- `CREATE`: Permission to create child nodes.
- `READ`: Permission to read node data and list child nodes.
- `WRITE`: Permission to update node data.
- `DELETE`: Permission to delete child nodes.
- `ADMIN`: Permission to configure node ACLs.

### Watcher Mechanism

`Watcher` is an event listener and a crucial feature of `zk` on which many capabilities rely. It works much like a publish/subscribe pattern: a client **registers** a specific `watcher` with the server; when the server triggers an event matching that `watcher`, it **sends an event notification to the client**, and upon receiving the notification, the client looks up its registered `Watcher` and **executes the corresponding callback method**.

![Watcher Mechanism](/media/jg/ext/oss.javaguide.cn/p3-juejin/ac87b7cff7b44c63997ff0f6a7b6d2eb-tplv-k3u1fbpfcp-78bb2667.jpg)

## Typical Application Scenarios of ZooKeeper

After all that theory, you might feel a bit dizzy: what is all this actually useful for? What can it build? Don't rush—let's walk through it step by step.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/dbc1a52b0c304bb093ef08fb1d4c704c-tplv-k3u1fbpfcp-c5a5572a.jpg)

### Master Election

Remember ephemeral nodes from earlier? Because of `ZooKeeper`'s strong consistency, it guarantees **global uniqueness of node creation even under high concurrency** (meaning the exact same node cannot be created twice).

Using this property, we can **have multiple clients attempt to create a designated node**—whichever client succeeds becomes the `master`.

Wait—what if this `master` crashes???

Think about why we used an ephemeral node! Remember the lifecycle of an ephemeral node? When the `master` crashes, doesn't its session break? When its session breaks, doesn't that ephemeral node disappear? And remember `watcher`? We can **have the non-`master` nodes watch the node's state**—for example, watching the parent of the ephemeral node so that when its child count changes (indicating the `master` crashed), **a callback fires to trigger re-election**, or watching the node directly so that disconnection events detect whether the `master` is down, and so forth.

![Master Election](/media/jg/ext/oss.javaguide.cn/p3-juejin/00468757fb8f4f51875f645fbb7b25a2-tplv-k3u1fbpfcp-6b9944c2.jpg)

Overall, we can implement **master election entirely using ephemeral nodes, node state, and `watchers`**: ephemeral nodes handle the election itself, while node state and `watchers` track `master` liveness and drive re-election.

### Data Publish/Subscribe

Remember ZooKeeper's `Watcher` mechanism? ZooKeeper uses this hybrid push-pull model for client-server interaction: clients register watches on znodes with the server, and whenever a watched node's data changes, the server sends a `Watcher` event notification to the watching clients; upon receiving the notification, the clients **actively** fetch the latest data from the server. Through this pattern, ZooKeeper implements **data publish/subscribe**.

A classic use case is **centralized management of global configuration information**. On startup, clients proactively fetch configuration from the ZooKeeper server and **register a `Watcher` listener on the target node**. Whenever configuration changes, the server notifies all subscribed clients to pull the updated configuration, enabling real-time configuration updates.

The global configuration mentioned above typically includes machine lists, runtime feature flags, database settings, and the like. Note that such global configuration data generally has the following characteristics:

- Small data size
- Data content changes dynamically at runtime
- Shared consistent configuration across machines in a cluster

### Load Balancing

Load balancing can be achieved using ZooKeeper's **ephemeral nodes**. Recall the property of ephemeral nodes: when a client disconnects from the server—that is, when the client session ends—its ephemeral nodes are automatically deleted. Therefore, we can use ephemeral nodes to maintain a live list of server addresses, ensuring requests are never routed to dead servers.

Specifically, each Server in the cluster connects to the ZooKeeper server as a ZooKeeper client and creates an ephemeral node under a designated directory containing **its own address information**. When a client needs to invoke the cluster service, it first queries ZooKeeper for the child nodes under that directory (i.e., all available Servers), and then routes requests to a specific Server according to a load-balancing strategy.

### Distributed Locks

There are many ways to implement distributed locks—such as `Redis`, databases, `ZooKeeper`, and more. In my opinion, implementing distributed locks with `ZooKeeper` is remarkably straightforward.

Earlier we mentioned that **zk guarantees global uniqueness of node creation under high concurrency**—you can immediately see what that enables: building a mutual exclusion lock! And because it operates in a distributed setting, it gives us a distributed lock.

How does it work? It's almost identical to master election—we can also build it using ephemeral node creation.

First, to acquire the lock: because node creation is unique, multiple clients try to create the same ephemeral node simultaneously, and **the one that succeeds acquires the lock**. Clients that fail to acquire the lock attach a `watcher` to monitor the node's state (just like standby nodes in master election); once the lock is released (either because the lock holder crashed or explicitly released the lock), the callback triggers so waiting clients can compete for the lock again.

> Unlike `Redis`, in `zk` you don't have to worry about a lock never getting released—because if the client crashes, its ephemeral node disappears and the lock is released automatically. Isn't that simple?

Can `ZooKeeper` also implement **both shared locks and exclusive locks**? Yes, though it is slightly more involved.

Remember **sequential nodes**?

Suppose we require all created lock nodes to be sequential. When a client issues a read request (seeking a shared lock), if **there are no smaller nodes ahead of it, or all smaller nodes are also read requests**, it acquires the read lock and can proceed to read. **If there is any write request among the smaller nodes**, the client cannot acquire the read lock yet and must wait for preceding write requests to finish.

If a client issues a write request (seeking an exclusive lock), and **there are no smaller nodes ahead of it**, the client immediately acquires the write lock to modify data. If **any smaller node exists—whether read or write—the client cannot acquire the write lock** and must wait for all preceding operations to complete.

This neatly implements both shared and exclusive locks. There is also a key optimization: if releasing a lock notifies *all* waiting clients at once, it causes a **herd effect** (`thundering herd`). You can avoid this by having each waiting node watch only the node directly preceding it.

How? Quite simple: make **each read request watch only the last write-request node smaller than itself, and each write request watch only the single node immediately smaller than itself**. Interested readers can explore this further on their own.

### Naming Service

When assigning an ID to an object, most people immediately think of `UUID`—but `UUID`'s biggest drawback is that it's too long... (longer isn't always better, heh heh). Where conditions permit, could we use `ZooKeeper` instead?

Earlier we noted that `ZooKeeper` stores data nodes in a **tree structure**, which means the **full path** of every node is guaranteed to be unique—so we can use a node's full path as a naming scheme. Better yet, we can define the paths ourselves, giving semantic objects meaningful, easy-to-understand IDs.

### Cluster Management and Service Registry

Seeing all this, doesn't `ZooKeeper` feel insanely powerful—capable of handling so much?

Wait—there's more! Suppose we need to know how many machines are currently active in a cluster, collect runtime metrics from each machine, or handle nodes coming online and going offline.

`ZooKeeper`'s native `watcher` and ephemeral nodes handle these requirements effortlessly. We can create an ephemeral node for each machine and watch their parent node: whenever the child list changes (because ephemeral nodes were created or deleted), the `watcher` bound to the parent node receives notifications and triggers callbacks for monitoring.

![Cluster Management](/media/jg/ext/oss.javaguide.cn/p3-juejin/f3d70709f10f4fa6b09125a56a976fda-tplv-k3u1fbpfcp-2454a604.jpg)

Building a service registry works just as simply: **service providers** create an ephemeral node in `ZooKeeper` storing their `ip`, `port`, and invocation protocol/method. When **service consumers** need to make a call, they **look up the list of service addresses (IP, port, etc.) from the registry** and cache it locally for future calls; when invoking the service, the consumer doesn't hit the registry again on every call, instead selecting a provider from its cached list via a load-balancing algorithm.

When a provider server crashes or goes offline, its address is removed from the provider list, and the registry pushes the updated address list to service consumers so they refresh their local cache (of course, consumers watch the node—I recall `Eureka` tries calling first and updates on failure).

![Service Registry](/media/jg/ext/oss.javaguide.cn/p3-juejin/469cebf9670740d1a6711fe54db70e05-tplv-k3u1fbpfcp-61c02245.jpg)

## Summary

You are truly patient to have made it this far 👍👍👍—though I wonder whether you still remember everything I covered 😒.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/912c1aa6b7794d4aac8ebe6a14832cae-tplv-k3u1fbpfcp-25896957.jpg)

In this article, I walked you through `ZooKeeper`, a powerful distributed coordination framework. Let's briefly recap the entire article:

- Differences between distributed systems and clusters.

- Principles and workflows of consistency protocols and algorithms including `2PC`, `3PC`, and `Paxos`.

- `ZooKeeper`'s dedicated consensus protocol, `ZAB` (ZooKeeper Atomic Broadcast), covering `Leader` election, crash recovery, and message broadcast.

- Fundamental concepts in `ZooKeeper`, such as `ACL`, data nodes (`znode`), sessions, and the `watcher` mechanism.

- Typical `ZooKeeper` application scenarios, including master election, service registries, and more.

  If you've forgotten anything, feel free to scroll back and review it again. Questions and suggestions are always welcome 🤝🤝🤝.
