---
title: "Raft Algorithm Explained: Leader Election, Log Replication, Safety, and Membership Changes"
category: Distributed Systems
description: "A detailed explanation of the Raft algorithm, covering Leader election, log replication, Leader append-only semantics, log consistency, safety constraints, membership changes, and a comparison with Paxos to help understand distributed consensus protocols."
tag:
  - Distributed Protocols & Algorithms
  - Consensus Algorithms
head:
  - - meta
    - name: keywords
      content: Raft,Raft algorithm,Leader election,log replication,membership changes,consensus algorithm,distributed consistency,Paxos comparison,distributed protocol
lang: en
sourceRef: zh-ref/distributed-system/protocol/raft-algorithm.md
---

> This article was co-authored by [SnailClimb](https://github.com/Snailclimb) and [Xieqijun](https://github.com/jun0315).

## 1. Background

In modern internet architectures, systems often scale horizontally by adding more machines to handle massive traffic. With more machines, crashes and network outages become everyday occurrences. How do we keep a fleet of servers that could drop offline at any moment in lockstep, without serving inconsistent data? That is where **distributed consensus algorithms** enter the picture.

In 2014, Diego Ongaro et al. published the Raft algorithm. Its creation had a very clear mission: **to rescue programmers tormented by Paxos**. Focused squarely on "understandability," Raft decomposes the complex consensus problem into several independent modules:

- **Leader Election**: Uses randomized election timeouts (commonly `150–300ms` or wider in practice, depending on network and failure models).
- **Log Replication**: The Leader broadcasts log entries via `AppendEntries` RPCs.
- **Safety**: Includes election restrictions and log matching guarantees.

Raft has seen widespread production adoption; Raft-based implementations such as `etcd` and `Consul` have become cornerstones of distributed infrastructure. Over time, academia and industry have introduced several extensions and optimizations to Raft, including:

- **Pre-Vote** (2014): Prevents network-partitioned nodes from disrupting elections in a healthy, stable cluster.
- **Read Index** (2014): Optimizes read performance while preserving linearizable reads during a Leader's term.
- **Lease Read**: A lease-based approach for linearizable reads.
- **Joint Consensus**: A joint-agreement mechanism for cluster membership changes (using a transitional configuration: `Old Configuration → Joint Configuration → New Configuration`).

Consequently, a system must handle servers going offline and coming back online during normal operations. It needs to react to failures and adapt automatically within seconds—noticeable downtime is generally unacceptable to clients.

Fortunately, distributed consensus helps tackle these challenges.

### 1.1 A "Leader Election" Analogy Under Non-Byzantine Conditions

Raft relies on a foundational assumption: **Crash Fault Tolerance (CFT, non-Byzantine)**. Simply put, nodes may crash or lose network connectivity, but there will never be a traitor deliberately sending falsified messages.

We can roughly understand this process using a "generals electing a commander" analogy: Suppose three generals—A, B, and C—currently have no leader. Each general keeps a private random countdown (the election timeout). Whoever's countdown hits zero first steps forward and shouts: "I want to be the commander—vote for me!" If the other generals have not yet started campaigning and haven't given their vote to anyone else, they gladly agree. Once that general secures a **majority** of votes, they become the Leader. From then on, whether to march or hold position is entirely up to them. If messengers die along the way and nobody hears back, everyone resets their countdown and runs another round.

### 1.2 What Is a Consensus Algorithm?

The core goal of a consensus algorithm is **to make a cluster of machines behave like a single machine**. As long as more than half of the machines in the cluster remain alive, the system can continue serving requests normally.

This is typically achieved through a **Replicated State Machine (RSM)**: every node receives an identical ledger (log). As long as everyone executes the commands in that ledger in the exact same order, the final resulting state will naturally be identical. Therefore, a consensus algorithm fundamentally does one thing—**ensuring that every node's ledger stays completely consistent**. Consensus is a fundamental problem in fault-tolerant systems: even in the face of failures, servers can agree on shared state.

![Consensus Algorithm Architecture](/media/jg/ext/oss.javaguide.cn/github/javaguide/paxos-rsm-architecture-fdf50738.png)

## 2. Fundamental Concepts

Before diving deep into Raft, we first need to understand its three core roles, the term mechanism, and the log structure.

### 2.1 Node Types

A Raft cluster consists of several servers—take a typical 5-server cluster as an example. At any given time, every server is in one of three states:

- **Leader**: The boss. Solely responsible for handling client requests, writing to the ledger, and synchronizing the ledger to subordinates. To prevent anyone from staging a coup, it must continuously send heartbeats to everyone declaring, "I am still alive."
- **Follower**: Law-abiding subordinates. Under normal conditions they never initiate requests on their own; they passively accept heartbeats and log synchronization from the Leader.
- **Candidate**: A temporary state. If a Follower waits too long without hearing a heartbeat from the Leader, it decides it is ready to step up, transitions to Candidate, and starts campaigning for votes.

Under normal operation, exactly one server is the Leader and the rest are Followers. Followers are passive: they issue no requests of their own and simply respond to RPCs from Leaders and Candidates.

![Raft Server State Transitions](/media/jg/ext/oss.javaguide.cn/github/javaguide/paxos-server-state-1b632d32.png)

### 2.2 Terms

![Term Illustration](/media/jg/ext/oss.javaguide.cn/github/javaguide/paxos-term-a8e53feb.png)

Raft divides time into **terms** of arbitrary length, numbered with consecutive integers representing the current `term`. Every term begins with an election in which one or more Candidates attempt to become Leader. If a Candidate wins the election, it serves as Leader for the remainder of that term. If no Leader is elected (for example, due to a split vote), that term ends without a Leader; once a new election timeout expires, the cluster enters the next term and starts a new election. As long as a majority of nodes are available and the network eventually becomes reachable, the system can usually elect a Leader within a few rounds.

Every node stores its current `term` number and exchanges it whenever servers communicate. If a server discovers its own `term` is smaller than another's, it updates its `term` to the larger value. If a Candidate or Leader discovers its `term` is stale, it immediately reverts to Follower. If a server receives a request carrying a stale `term`, it rejects the request.

The hand-drawn diagram below makes this progression even easier to grasp:

![Raft Term Progression](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/raft-term-progression-43b14d05.png)

### 2.3 Logs

Only the Leader is allowed to append records (`Entry`) to the ledger. Each log entry contains three core fields: `<current term, index, command>`.

There are two critical progress pointers:

- **`commitIndex`**: The highest log index known to be safely persisted across the cluster (replicated to a majority of nodes).
- **`lastApplied`**: The highest log index that this specific machine has actually executed against its local state machine.

## 3. Leader Election

![Raft Leader Election Flow](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/raft-election-b5e23d8b.png)

Raft uses a heartbeat mechanism to trigger Leader election.

If a server continuously receives valid `AppendEntries` RPCs (heartbeats or log replication) from a Leader, it remains in the Follower state and resets its election timer.

The Leader periodically sends heartbeats to all Followers to maintain its leadership. If a Follower receives no heartbeat within a certain period—called an **election timeout**—it assumes there is currently no viable Leader and starts an election to choose a new one.

To begin a new election, a Follower increments its `term` and transitions to the Candidate state. It then sends `RequestVote` RPCs to all other nodes. A Candidate stays in this state until one of three things happens:

- It wins the election.
- Another node wins the election.
- A round of voting finishes with no winner.

The condition for winning an election is receiving votes from a **majority** of servers in the cluster (`N/2 + 1`) within the same term.

While waiting for votes, a Candidate may receive a heartbeat from another node claiming to be Leader, leading to two cases:

- If that Leader's `term` is greater than or equal to the Candidate's own `term`, the peer is recognized as a legitimate Leader, and the Candidate steps down to Follower.
- If that Leader's `term` is smaller than the Candidate's `term`, the Candidate rejects the RPC, prompting the sender to update its term.

Because multiple Candidates can appear at the same time and split the vote so that no Candidate achieves a majority, elections could repeat forever if nothing broke the tie.

Raft solves this using **randomized election timeouts**. Whenever a Candidate starts an election (or resets its timer), it picks a new randomized timeout. This spreads servers out so that in most cases one server times out first and wins the election before any other server even times out.

## 4. Log Replication

Once a Leader is elected, it begins serving client requests. Each client request contains a command to be executed by the **Replicated State Machine**.

Upon receiving a client request, the Leader creates an entry `<index, term, cmd>`, appends it to its own local log, and broadcasts the entry to all other nodes via `AppendEntries` RPCs asking them to replicate it.

If a Follower accepts the entry, it appends it to its own log and replies with acknowledgment to the Leader.

Once the Leader receives successful replication responses from a majority of Followers for that entry, the Leader advances its `commitIndex`, sequentially applies all newly committed entries to its local state machine, and then returns the execution result to the client.

Note one crucial constraint: a Leader may only advance `commitIndex` based on **an entry created in its current term having been replicated to a majority**. For leftover entries from previous terms, even if they have already been replicated to a majority of nodes, the Leader must not commit them directly by counting replicas alone; instead, it commits an entry from its current term (commonly by appending and committing a `no-op` entry upon election), which indirectly commits all preceding historical entries.

Followers do not decide commit points on their own; they learn the highest committable index from `leaderCommit` carried in `AppendEntries` RPCs from the Leader, update their local `commitIndex` to `min(leaderCommit, lastLogIndex)`, and apply entries to their state machine in order.

### 4.1 Log Matching Property

Raft guarantees that logs never diverge through the **Log Matching Property**, one of the cornerstones of Raft's safety. It consists of two core guarantees:

- **Guarantee 1**: If two entries in different logs have the same `index` and `term`, they store the exact same `cmd`.
- **Guarantee 2**: If two entries in different logs have the same `index` and `term`, all preceding entries in both logs are identical.

#### Proof by Induction

The Log Matching Property is maintained by induction:

1. **Base Case**: When logs are empty, the property holds trivially.
2. **Inductive Step**: Assuming logs match up to index `N`, when the Leader attempts to append entry `N+1`, the **consistency check in the `AppendEntries` RPC** ensures alignment:

```
AppendEntries RPC parameters:
- prevLogIndex: index of the immediately preceding log entry (where the Leader believes the Follower aligns)
- prevLogTerm: term of that preceding log entry
- entries[]: new log entries to append
```

**Consistency Check Logic**:

- When a Follower receives an `AppendEntries` request, it inspects the entry at `index = prevLogIndex` in its local log.
- If that entry exists and `entry.term == prevLogTerm`, the Leader and Follower match completely up through `prevLogIndex`, so the check passes.
- If no entry exists there or the `term` does not match, the Follower rejects the append and returns failure.

**Key Insight**: By verifying the `(prevLogIndex, prevLogTerm)` pair, the Leader and Follower **mathematically prove** agreement over their entire shared log history. New entries are appended only when the "last known point of agreement" matches. This forms an inductive chain:

```
entry[0] matches → entry[1] matches → entry[2] matches → ... → entry[N] matches
    ↑_____________recursively verified via prevLogIndex/prevLogTerm_____________↑
```

Therefore, two different commands can never be committed at the same `index`—logs never fork.

#### Engineering Implementation Optimizations

Production implementations (such as `etcd 3.5.x`) include several engineering optimizations beyond the basic consistency check:

- **Fast Backup**: When an `AppendEntries` consistency check fails, the Follower returns the conflicting entry's `term` along with the boundary indices of that term (the first and last index belonging to that `term`). The Leader uses this to skip an entire conflicting term in a single jump rather than decrementing `nextIndex` one entry at a time.
- **Retry Storm Protection**: Under high load, large numbers of `AppendEntries` failures and retries can occur; implementations commonly include:
  - **Jitter Backoff**: Adds random jitter to retry intervals so multiple Followers do not retry in lockstep.
  - **Backpressure**: Throttles the retry rate for an individual Follower to avoid saturating network bandwidth.

These optimizations preserve the theoretical correctness of the Log Matching Property while dramatically improving recovery efficiency during anomalies.

### 4.2 Recovering from Log Inconsistencies

During normal operation, the Leader's ledger and the Followers' ledgers stay cleanly synchronized. However, when an old Leader crashes abruptly, leadership transitions often leave behind unaligned, dirty entries across the cluster.

When the new Leader starts sending `AppendEntries` requests, those mismatches trigger consistency check failures. Raft's conflict-resolution rule is uncompromising: **the current Leader's log is the single source of truth**, and any conflicting entries on a Follower must be ruthlessly truncated and overwritten.

How does this work in detail? Like zipping up a jacket, the Leader walks backward step by step to locate the last point in history where both logs match. Once that divergence point is found, the Follower discards everything after that point and faithfully copies the authoritative entries sent by the Leader.

In code, the Leader maintains a per-Follower pointer in memory called `nextIndex` (the index of the next log entry the Leader expects to send to that Follower). Upon taking office, a newly elected Leader optimistically initializes every Follower's `nextIndex` to `lastLogIndex + 1` (just past the end of its own log). If a Follower is lagging behind or has conflicting entries, the very first `AppendEntries` RPC will fail the consistency check. At that point, there are two ways to find the divergence point:

- **Traditional Naive Approach (One-by-One Backtracking)**: Take a step back whenever hitting a wall. The Leader decrements `nextIndex` by 1 and sends another RPC. If that still fails, it decrements by 1 again, crawling backward entry by entry until it finally finds the matching index.
- **Industrial Acceleration (Fast Backup)**: In real production systems, decrementing one entry at a time is a performance disaster. Industry implementations introduced Fast Backup: when a Follower rejects a replication request, instead of merely shaking its head, it reveals the full context—"these conflicting entries belong to historical term `X`, and here are the start and end boundaries of that term." Armed with that intelligence, the Leader leaps straight across the entire conflicting term in one shot, drastically reducing redundant network round-trips.

After this back-and-forth, `nextIndex` locks accurately onto the shared consensus point. At that moment, `AppendEntries` finally succeeds: the Follower wipes its conflicting tail and fills in the missing authoritative entries seamlessly. Once past this hurdle, both ledgers remain tightly synchronized for the rest of the term.

## 5. Safety

### 5.1 Election Restriction

A Leader must guarantee that its local log already contains all committed entries. This ensures entries only flow in one direction—from Leader to Follower—and a Leader never overwrites existing committed entries.

Whenever a Candidate sends a `RequestVote` RPC, it includes information about its last log entry (`lastLogIndex` and `lastLogTerm`). Every voter compares that entry against its own log; if the voter's own log is more up-to-date, it refuses to grant its vote to that Candidate.

How log freshness is compared: if the two logs end with different `term` values, the one with the higher `term` is more up-to-date; if they end with the same `term`, the longer log (larger `index`) is more up-to-date.

### 5.2 Commit Rule (Committing Only Current-Term Logs)

A Leader may advance `commitIndex` only when **an entry created in its current term has been replicated to a majority**. For entries left over from earlier terms, even if they are present on a majority of servers, the Leader must not commit them directly based on majority count alone; instead, they are committed indirectly once an entry from the current term (typically a `no-op`) is committed. This rule prevents safety violations in which committed entries could be overwritten during rapid Leader transitions.

### 5.3 Node Crashes and Network Partitions

If a Follower or Candidate crashes, recovery is straightforward. Subsequent `RequestVote` and `AppendEntries` RPCs sent to it simply fail. Because Raft RPCs are idempotent, the Leader keeps retrying indefinitely; once the crashed node recovers, it receives the RPCs again and either appends or rejects the entries cleanly.

If the Leader crashes, nodes fail to receive heartbeats within `electionTimeout` and trigger a new election; until a new Leader is elected, the system cannot serve linearizable writes (or linearizable reads), resulting in a brief unavailability window.

**Quantitative Analysis**: In a 5-node cluster, the unavailability window after a Leader crash is typically under 1 second (`P99 < 500ms` election timeout + one election round). This reflects the **PACELC theorem**: when a partition (`P`) occurs, the system chooses consistency (`C`) over availability (`A`). Idempotent retries ensure recovering nodes catch up safely.

#### Single-Node Isolation and Term Inflation

In standard Raft, **single-node network isolation** can cause **Term Inflation**, leading to a "bad money drives out good" scenario in which a partitioned minority node disrupts a healthy cluster upon reconnecting.

**Scenario Walkthrough**:

Consider a 5-node cluster with Leader `A` and Followers `B`, `C`, `D`, `E`. Suppose node `E` suffers a network partition and becomes completely isolated:

```
Healthy partition:  {A, B, C, D}    (Leader A + majority, serves requests normally)
Isolated partition: {E}             (Single isolated node, receives no heartbeats)
```

| Timeline | Healthy Partition `{A, B, C, D}`                           | Isolated Partition `{E}`                                      |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `T0`     | Leader `A` serves normally, `Term = 5`                     | `E` receives no heartbeats, election timeout fires            |
| `T1`     | Cluster continues operating normally                       | `E` increments `Term` and starts election (`Term 6`), no replies |
| `T2`     | ...                                                        | `E` keeps incrementing (`Term 7, 8, ...`), reaching `Term 99` |
| `T3`     | Network heals; `E` rejoins with `Term 99`                  | `E` broadcasts `RequestVote (Term 99)` to `{A, B, C, D}`      |
| `T4`     | `A` sees `Term 99 > Term 5` and **is forced to step down** | `E`'s inflated `Term` disrupts the healthy cluster            |

**Root Cause Analysis**:

- `{A, B, C, D}` forms a **valid majority** (`4/5`), so the cluster should continue operating uninterrupted.
- Node `E` is a **minority** (`1/5`); its isolation should have zero impact on the rest of the cluster.
- **Core Issue**: `E`'s inflated `Term` forces the healthy Leader `A` to step down.
- **Consequence**: The entire cluster is forced into an unnecessary re-election, causing avoidable write downtime.

This is a well-known edge case in standard Raft: frantic election attempts by minority nodes can disrupt a healthy majority.

#### Pre-Vote Mechanism

To eliminate this issue, the **Pre-Vote** extension was introduced for Raft. Pre-Vote requires a node to run a "pre-election check" before actually starting an election:

1. **Pre-Vote Phase**: The Candidate sends a `PreVoteRequest` containing its log metadata to peers without incrementing its `term`.
2. **Granting Pre-Vote Conditions**:
   - The Candidate's log is at least as up-to-date as the receiver's (standard election restriction).
   - **The receiver confirms it has lost contact with the current Leader** (no heartbeat received for at least `electionTimeout`).
3. **Formal Election**: Only after collecting `PreVote` approvals from a majority of nodes does the Candidate actually increment its `term` and send `RequestVote`.

**How Pre-Vote Prevents Term Inflation**:

- In the single-node isolation scenario above, when `E` tries to initiate Pre-Vote (or even after reconnecting), **the other nodes are still receiving heartbeats from Leader `A`**.
- Therefore, peers **reject `E`'s `PreVote` request** because their connection to the Leader is healthy.
- Unable to secure a majority of `PreVote` responses, `E` **never actually increments its `Term`**.
- When the network heals, `E`'s `Term` remains low and does not disrupt the healthy Leader `A`.

**Core Idea**: A node only increments its `Term` once it confirms the cluster majority agrees leadership is lost. This effectively prevents minority nodes' term inflation from destabilizing the majority.

Pre-Vote is widely adopted in production Raft implementations such as `etcd`, `TiKV`, and `Consul`.

### 5.4 Timing and Availability

One of Raft's design requirements is that safety must not depend on timing: the system must never produce incorrect results merely because some event happens faster or slower than expected. However, for availability (liveness), the following timing inequality should hold:

`broadcastTime << electionTimeout << MTBF`

- `broadcastTime`: The average time it takes a server to send RPCs in parallel to every server in the cluster and receive their responses.
- `electionTimeout`: The election timeout duration.
- `MTBF (Mean Time Between Failures)`: The average time between failures for a single server.

`broadcastTime` should be an order of magnitude smaller than `electionTimeout` so that the Leader can reliably send heartbeats to prevent Followers from starting elections.

`electionTimeout` should in turn be several orders of magnitude smaller than `MTBF` so the system makes steady progress. When a Leader crashes, the cluster is unavailable for roughly the duration of `electionTimeout`; we want this downtime to represent only a tiny fraction of overall operating time.

Because `broadcastTime` and `MTBF` are inherent properties of the underlying infrastructure, `electionTimeout` must be tuned accordingly.

In practice, `broadcastTime` is typically `0.5–20ms`, `electionTimeout` can be configured around `10–500ms` (commonly `150–300ms` in production systems), and `MTBF` is typically one to several months.

## 6. References

- <https://tanxinyu.work/raft/>
- <https://github.com/OneSizeFitsQuorum/raft-thesis-zh_cn/blob/master/raft-thesis-zh_cn.md>
- <https://github.com/ongardie/dissertation/blob/master/stanford.pdf>
- <https://knowledge-sharing.gitbooks.io/raft/content/chapter5.html>
