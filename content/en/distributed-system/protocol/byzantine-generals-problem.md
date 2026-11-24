---
title: "The Byzantine Generals Problem Explained: Distributed Consensus, 3m+1 Nodes, and BFT Fault Tolerance"
description: "An in-depth guide to the Byzantine Generals Problem covering Byzantine faults, distributed consensus, safety and liveness, Oral Messages OM(m), Signed Messages, the 3m+1 node requirement, differences between CFT and BFT, and applications in blockchain."
category: Distributed Systems
tag:
  - Distributed Protocols & Algorithms
  - Consensus Algorithms
  - BFT
head:
  - - meta
    - name: keywords
      content: Byzantine Generals Problem,Byzantine Fault Tolerance,BFT,PBFT,distributed consensus,consensus algorithm,3m+1,OM(m),Signed Messages,CFT,blockchain consensus,distributed systems
lang: en
sourceRef: zh-ref/distributed-system/protocol/byzantine-generals-problem.md
---

Several service nodes all claim they are right—who should the client trust?

In everyday backend systems, this problem is rarely that extreme. Redis primary-replica setups, ZooKeeper, etcd, Nacos, and database replication mostly encounter machine crashes, network jitter, disk failures, and process restarts. Nodes generally do not deliberately lie to you; they simply stop responding, respond slowly, or become temporarily disconnected from the cluster.

The Byzantine Generals Problem addresses a much trickier category of scenarios: **there are nodes in the system that behave unpredictably and may even send contradictory information to different recipients**.

That is where its value lies in distributed systems. The ancient military story is only a vehicle for expression; what it is really about is "reaching agreement among unreliable members."

If you are studying common coordination systems like Raft, ZAB, ZooKeeper, and etcd, you first need to distinguish between two fault models: they typically handle crash faults and network partitions without assuming nodes maliciously lie, whereas the Byzantine problem examines a stronger fault model. To explore consensus in non-Byzantine scenarios, you can continue reading [Raft Algorithm Explained](./raft-algorithm.md) and [ZAB Protocol Explained](./zab.md).

## What Is the Byzantine Generals Problem?

The Byzantine Generals Problem was introduced by Leslie Lamport, Robert Shostak, and Marshall Pease in their 1982 paper [The Byzantine Generals Problem](https://www.microsoft.com/en-us/research/publication/byzantine-generals-problem/), published in ACM Transactions on Programming Languages and Systems in July 1982.

Lamport is an unavoidable figure in distributed systems. He received the 2013 ACM A.M. Turing Award for his foundational contributions to distributed and concurrent systems, and he was also the original creator of the LaTeX document preparation system.

The story version of the problem goes roughly like this:

Several Byzantine generals each lead an army surrounding an enemy city. The armies are stationed at separate locations, so the generals cannot meet face-to-face and can only communicate via messengers. They must decide whether to attack or retreat tomorrow. Attacking alone will fail; only when enough armies act together can they succeed.

The catch is that there may be traitors among the generals.

A traitor does not merely "fail to execute an order." He can tell General A to attack while telling General B to retreat, or fabricate messages he claims to have heard to mislead loyal generals into making conflicting decisions. In computer systems, similar behavior does not necessarily stem from malicious intent—it can also arise from software bugs, state corruption, memory or disk errors, or compromised nodes acting abnormally. Ultimately, if some loyal generals attack while other loyal generals retreat, the entire battle plan fails.

Translated into distributed systems, the generals are nodes, the messengers are network messages, and attack/retreat is some value on which consensus must be reached, such as:

- Which node becomes the Leader?
- Should a particular log entry be committed?
- Is a specific transaction valid?
- What command should a state machine execute next?

Therefore, the problem can be phrased in engineering terms:

> When some nodes may fail, lie, forge information, or send contradictory messages, how can all healthy nodes agree on the same outcome?

![Overview of the Byzantine Generals Problem scenario](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-problem-overview-6ec36198.png)

There is one detail to clarify upfront. Many articles bundle messenger interception, message loss, and message tampering into the story to help illustrate "unreliable communication." However, the "Oral Messages" model in Lamport's paper actually assumes, for formal proof purposes, that the messaging system satisfies several conditions: every message sent is delivered correctly, the receiver knows who sent the message, and the absence of a message can be detected.

Thus, the core challenge the paper truly tackles goes a step beyond "the network might drop packets": **the sender of a message may behave maliciously**.

## What Must Reaching Consensus Satisfy?

In the Byzantine Generals Problem, there is one commanding general and several lieutenant generals. The commander wants to send an order to attack or retreat to the lieutenants, and the system aims to satisfy two conditions:

- **Agreement**: All loyal lieutenants obey the same order.
- **Validity**: If the commanding general is loyal, then every loyal lieutenant obeys the order he sends.

The first condition prevents the loyal nodes from splitting. The second condition ensures that defenses against traitors do not end up discarding a loyal commander's valid order.

Strictly speaking, the commander–lieutenant model in Lamport's paper is closer to **Byzantine Broadcast** or **Interactive Consistency**. It is closely related to general consensus, though the interface differs slightly: general consensus typically allows every node to propose an initial value and requires healthy nodes to decide on the same value, whereas the commander–lieutenant model has one commander issuing an order and lieutenants determining what to execute.

In more general distributed consensus problems, termination is also important—meaning healthy nodes must eventually reach a decision rather than waiting forever. Some definitions also include Integrity: a node can decide at most once. In engineering systems, mechanisms such as timeouts, retries, election rounds, and view changes often serve this goal.

![Illustration of loyal node majority decision](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-honest-majority-ead9b7c7.png)

Let us narrow the problem back to the generals story. Suppose there are only 3 generals—A, B, and C—where A is the commander and B and C are lieutenants. Even with just 1 traitor, things get stuck.

From the local perspective of loyal lieutenant B, the following two executions look completely identical:

- A is a traitor: A tells B "Attack" and tells C "Retreat"; C loyally relays "Retreat" to B.
- C is a traitor: A is a loyal commander and tells both B and C "Attack"; C lies to B, claiming that A said "Retreat."

In both scenarios, what B observes is: A directly told B "Attack," while C relayed that A said "Retreat." Looking solely at the messages B received, B cannot tell whether A is deceiving him or C is lying.

This is the difficulty with 3 generals and 1 traitor. Loyal nodes do not lack a voting rule; what they lack is the information needed to tell "who is lying." Constructing a symmetric scenario for the other loyal lieutenant drives the two loyal lieutenants toward different decisions, ultimately violating Agreement. Lamport's paper warned that it is very easy to be misled by intuitive proofs in such problems; the paper ultimately proved via reduction that with only oral messages, tolerating `m` traitors requires at least `3m + 1` generals. In other words, loyal generals must exceed `2/3` of the total.

![Three generals cannot tolerate one traitor](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-three-general-impossi-fcb399f6.png)

To tolerate 1 traitor, you need at least 4 generals; to tolerate 2 traitors, you need at least 7 generals.

## Agreement Does Not Guarantee Continuous Progress

When studying consensus protocols, two properties must be viewed separately:

- **Safety**: Two conflicting outcomes can never be decided.
- **Liveness**: The system can eventually continue making progress and reach a decision.

Many protocols prioritize protecting Safety during anomalies. For example, when a Raft cluster cannot reach a majority, it stops committing new log entries rather than letting two network partitions each commit conflicting batches of logs. Halting progress affects availability, but at least it will not corrupt state.

In a completely asynchronous system, message delays have no upper bound. Relying on timeouts alone cannot rigorously distinguish whether a node has truly crashed or is merely responding slowly. The FLP impossibility result further demonstrates that in a completely asynchronous model, even if only a single process may crash, any deterministic consensus protocol has executions that fail to terminate.

Consequently, real-world systems typically introduce additional assumptions or mechanisms to restore liveness—such as eventual synchrony, randomization, failure detectors, retries, and view changes. Later, when we say PBFT can operate over asynchronous networks like the Internet, it should be understood in the same way: Safety and Liveness are not the same guarantee.

![Safety and liveness in consensus protocols](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-safety-liveness-83535db0.png)

## Oral Messages: Why Is 3m + 1 Required?

Lamport's paper first examines **Oral Messages**.

The Oral Messages model has 3 assumptions:

1. Every message that is sent is delivered correctly.
2. The receiver of a message knows who sent it.
3. The absence of a message can be detected.

These assumptions are already much stronger than real-world networks. In real systems, messages can be lost, delays are unpredictable, and detecting whether a node is truly dead or just slow usually relies on approximate timeouts.

Even under these relatively strong assumptions, as long as messages are unsigned, a traitor can still say different things to different recipients. To counter this, the protocol requires lieutenants to relay the orders they heard to one another and expose contradictions across multiple rounds of messages.

The Oral Messages algorithm is typically denoted as `OM(m)`, where `m` represents the maximum number of traitors.

When `m = 0`, the flow is simple: the commander sends the order to every lieutenant, and each lieutenant acts accordingly.

When `m > 0`, the process unfolds recursively:

1. The commander sends the order to all lieutenants.
2. Each lieutenant forwards the order it received to the other lieutenants.
3. If more traitors need to be tolerated, nodes receiving relayed messages continue forwarding them outward.
4. Finally, each loyal lieutenant applies the same deterministic `majority` function to the set of values it received; if no majority exists, a default value can be used—in the paper, the default is Retreat. The paper also notes that if the value domain is ordered, the median can be taken instead. The key is that all loyal lieutenants use the exact same deterministic rule.

![Multi-round relaying in the Oral Messages model OM(m)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-oral-messages-cd73f1c7.png)

We can use `m = 1` to see why this algorithm requires 4 generals.

Suppose A is the commander, B, C, and D are lieutenants, and the system has at most 1 traitor. If A is the traitor, he might send Attack to B and Retreat to C and D. Next, B, C, and D relay to one another the orders they received from A:

- B tells C and D: A told me to Attack.
- C tells B and D: A told me to Retreat.
- D tells B and C: A told me to Retreat.

From B's perspective, B sees "Attack, Retreat, Retreat"—the majority is Retreat. C and D observe the exact same majority result. Thus, even if commander A acts maliciously, the loyal lieutenants can still reach agreement.

The key here is not simply "majority rules." If the commander is loyal, the loyal lieutenants receive and forward the same value, forming a majority among loyal nodes and thereby ensuring Validity. If the commander is a traitor, the protocol's more crucial role is ensuring all loyal lieutenants obtain the exact same vector of values and then apply the same `majority` function to it, thereby ensuring Agreement.

When there are too few nodes, the local information seen by loyal nodes cannot distinguish between different failure scenarios, no matter how clever the voting rule is.

However, `OM(m)` is more of a theoretical algorithm to help understand the result and is not suitable for direct use in production business systems. It requires knowing the upper bound `m` of traitors in advance, relies on multiple recursive forwarding rounds, and its message volume explodes rapidly as the node count and fault tolerance threshold grow. Real systems generally switch to more practical engineering protocols.

## Signed Messages: Does Adding Signatures Make the Problem Simpler?

The paper goes on to examine **Signed Messages**.

Signed messages add two capabilities on top of oral messages:

- A loyal general's signature cannot be forged, and any alteration to the contents of a signed message can be detected.
- Anyone can verify the authenticity of a general's signature.

With signatures, a traitor can still lie, but he can no longer easily lie on behalf of loyal nodes. If B receives a message saying "C says A told everyone to Retreat," B can check whether the message bears C's signature and whether the relayed command from A inside it bears A's signature.

This curbs the traitor's trickiest capability: fabricating different versions to different people while leaving no way for others to trace the source.

Signatures solve origin authentication and message integrity, not honesty of the signer. A traitorous commander can still personally sign two conflicting orders; the difference is that both orders leave verifiable evidence that other nodes can continue forwarding, ensuring all loyal lieutenants eventually observe the same set of conflicting information.

Under the signed messages model, Lamport presented the `SM(m)` algorithm. It satisfies IC1 and IC2 with at most `m` traitors without requiring the `3m + 1` nodes needed in the oral messages model. The original paper also notes that if the total number of nodes is less than `m + 2`, the problem becomes trivial, because the system might not even have 2 loyal generals, making consensus among loyal nodes meaningless. Therefore, `n >= m + 2` is better understood as "ensuring at least two loyal nodes exist so the problem is meaningful," rather than treating it as the same kind of fault-tolerance lower bound as `3m + 1`.

`SM(m)` does not end with a simple majority vote either. Each loyal lieutenant maintains a set `V` of received orders and then executes a pre-agreed deterministic `choice(V)` function. If a traitorous commander signs both "Attack" and "Retreat," all loyal lieutenants eventually collect the same set and apply the same `choice` function to it, naturally producing an identical result.

![Information propagation in the Signed Messages model SM(m)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-signed-messages-fc1feabe.png)

This does not mean real-world BFT systems always need only `m + 2` nodes. What we just discussed is a single-shot Interactive Consistency problem under the specific model of Lamport's paper. Practical systems also have to deal with asynchronous networks, performance, client requests, state machine replication, view changes, malicious clients, and replay attacks. The original paper also mentioned that running `SM(m)` repeatedly requires attaching sequence numbers to values to prevent old signed messages from being replayed. Practical protocols like PBFT still typically use `3f + 1` replicas to tolerate `f` Byzantine faulty nodes.

This point is easy to confuse: signatures make "who said what" verifiable, but they do not eliminate quorum intersection requirements, unbounded message delays, or state machine replication challenges.

## How Do Byzantine Faults Differ from Ordinary Faults?

In backend engineering, we talk about faults constantly, but faults fall into different levels.

| Fault Type                             | Typical Manifestation                                                | Notes                                                       |
| -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| Crash Fault                            | Process stops, machine crashes                                       | The node stops executing further                            |
| Omission/Timing Fault                  | Message loss, delay, network partition, overly slow response         | The node may still be alive, but communication fails as expected |
| Byzantine Fault                        | Sending conflicting messages, wrong computations, state corruption, malicious behavior | Behavior can deviate arbitrarily from the protocol          |

![Crash faults, omission/timing faults, and Byzantine faults](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-fault-models-1b828256.png)

Paxos, Raft, and ZAB generally belong to the CFT (Crash Fault Tolerance) category. They assume nodes will not deliberately act maliciously—at worst they stop responding, respond slowly, lose network connectivity, or crash. Taking Raft as an example, Raft's official introduction gives the classic statement: a cluster of 5 servers can continue operating even if 2 servers fail; if more fail, the system stops making progress rather than returning incorrect results.

BFT (Byzantine Fault Tolerance) deals with a stronger fault model. A node may still be alive and communicating normally, yet the content it sends cannot be trusted. PBFT is a classic practical Byzantine fault-tolerant state machine replication protocol. In their 1999 OSDI paper [Practical Byzantine Fault Tolerance](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance), Castro and Liskov implemented a Byzantine fault-tolerant NFS service that was only 3% slower than standard unreplicated NFS under normal conditions.

PBFT allows network messages to be lost, delayed, duplicated, and reordered, and allows faulty nodes to deviate arbitrarily from the protocol. Its safety does not depend on synchrony assumptions: even if the network remains unstable for a long time, healthy replicas will not commit conflicting operations. However, its liveness relies on a weak eventual synchrony condition—healthy nodes and messages cannot be delayed indefinitely.

Under the standard model, PBFT uses `3f + 1` replicas to tolerate up to `f` Byzantine faults. Signatures and MACs authenticate messages and prevent forgery and replay, while `3f + 1` guarantees sufficient overlap of healthy nodes between quorums. The two solve different problems.

Common models can be roughly compared as follows:

| Model                        | Tolerated Faults      | Typical Minimum Replicas | Key Reason                                                        |
| ---------------------------- | --------------------- | ------------------------ | ----------------------------------------------------------------- |
| CFT                          | `f` crash faults      | `2f + 1`                 | Remaining nodes must still form a majority                        |
| Classic BFT State Machine Replication | `f` Byzantine faults  | `3f + 1`                 | Any two `2f + 1` quorums intersect in at least `f + 1` healthy nodes |
| Lamport Signed Messages Model | `m` traitors          | No longer requires `3m + 1` | Signatures make conflicting messages verifiable and propagatable   |

![Comparison of CFT, BFT, and Signed Messages models](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-cft-vs-bft-939329f6.png)

This table summarizes common models rather than universal laws followed unconditionally by all protocols. Trusted hardware, hybrid fault models, different network assumptions, and different security goals can all alter replica count requirements.

Ordinary Java backend systems rarely need BFT because service nodes typically belong to the same organization, share the same permission system, and run under the same operations infrastructure—nodes trust one another by default. The main problems you need to solve are high availability, primary-replica failover, log consistency, and split-brain avoidance, rather than preventing your own nodes from actively lying to other nodes.

However, in the following scenarios, Byzantine faults cannot be lightly ignored:

- Public blockchains, consortium blockchains, and cross-organization clearing and settlement systems.
- Multi-party shared ledgers or states where participants do not fully trust one another.
- Systems that must tolerate compromised nodes continuing to send syntactically valid but erroneous messages.
- Replicated state machine systems with very high security requirements.

Some systems claim they use "consensus," yet the fault assumptions behind consensus algorithms vary hugely. Saying "we use Raft" does not mean it defends against malicious nodes; saying "we use signatures" does not mean it fully implements Byzantine fault tolerance.

## How Does the Byzantine Generals Problem Relate to Blockchain?

Many people first encounter the Byzantine Generals Problem in blockchain articles.

That connection is valid, though the two should not be equated. The Byzantine Generals Problem is a more fundamental distributed consensus problem, and blockchain is simply one application domain. Nodes in a public blockchain network come from different entities—nodes may act maliciously and network delays can be huge—so it naturally has to confront Byzantine faults.

However, protocols like PoW, PoS, and BFT in blockchain are not on the exact same layer as Lamport's Oral Messages and Signed Messages:

- Lamport's paper provides the formal problem statement and early solutions, focusing on how loyal nodes reach agreement when traitors exist.
- Protocols like PBFT, HotStuff, and Tendermint are closer to engineering implementations, focusing on replica replication, voting phases, view changes, and commit rules.
- PoW and PoS also introduce designs around economic cost, stake, probabilistic confirmation, longest chain rules, or finality.

Thresholds in blockchain are not necessarily measured by node count either. PoW typically cares about the proportion of hash power controlled by an attacker; PoS and Tendermint-style protocols typically care about the stake or voting weight controlled by malicious validators. Even if an attacker controls only a small number of nodes, controlling enough weight can still exceed the protocol's safety threshold.

![Thresholds in blockchain](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-blockchain-weight-thr-64943ed6.png)

Moreover, PoW and PoS function more like Sybil-resistance, leader-selection, and weight-allocation mechanisms. A complete system also requires block proposal, fork choice, and voting or finality rules—you cannot equate them alone to a complete consensus protocol.

Therefore, in your learning roadmap, the Byzantine Generals Problem fits best as prerequisite knowledge for consensus algorithms. Understand it first, and concepts across Paxos, Raft, ZAB, PBFT, and blockchain consensus will fall into place much more smoothly.

## How to Answer This in an Interview?

If an interviewer asks "What is the Byzantine Generals Problem?", you can answer in this order:

1. State the problem first: in a distributed system, some nodes may fail or act maliciously, yet healthy nodes still need to agree on a certain value.
2. Explain the difficulty: Byzantine nodes can send contradictory messages to different nodes, making it hard for healthy nodes to tell who is lying.
3. Add the key conclusion: under the Oral Messages model alone, tolerating `m` traitors requires at least `3m + 1` nodes; 3 nodes cannot tolerate 1 traitor.
4. Explain solution directions: Lamport's paper gave two classes of solutions—Oral Messages and Signed Messages; in real systems, common CFT algorithms include Paxos, Raft, and ZAB, while common BFT algorithms include PBFT, HotStuff, and Tendermint.
5. Land on engineering judgment: ordinary backend systems mostly adopt CFT because nodes are trusted by default; cross-organization, blockchain, and security-sensitive scenarios are where BFT is truly needed.

A well-rounded answer could sound like this:

> The Byzantine Generals Problem describes how a distributed system reaches consensus in the presence of malicious or faulty nodes. It is harder than ordinary crash faults because Byzantine nodes can send different messages to different nodes, undermining agreement among healthy nodes. Lamport's paper proved that under the Oral Messages model, tolerating `m` traitors requires at least `3m + 1` nodes; the Signed Messages model no longer requires `3m + 1` because conflicting orders can be verified and propagated. Paxos, Raft, and ZAB primarily handle crash faults and assume nodes do not maliciously lie; algorithms like PBFT handle Byzantine faults, fit scenarios where nodes do not fully trust one another, and typically require `3f + 1` replicas to tolerate `f` Byzantine faults.

That is already enough for most backend interviews. Unless the role explicitly involves blockchain, distributed database internals, or consensus protocol implementation, there is no need to derive the full recursive proof of `OM(m)` on the spot.

## References

- [The Byzantine Generals Problem - Microsoft Research](https://www.microsoft.com/en-us/research/publication/byzantine-generals-problem/)
- [The Byzantine Generals Problem Paper PDF](https://lamport.azurewebsites.net/pubs/byz.pdf)
- [Leslie Barry Lamport - A.M. Turing Award Laureate](https://amturing.acm.org/award_winners/lamport_1205376.cfm)
- [Raft Consensus Algorithm Official Introduction](https://raft.github.io/)
- [Practical Byzantine Fault Tolerance - USENIX](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance)
- [Impossibility of Distributed Consensus with One Faulty Process](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf)
- [HotStuff: BFT Consensus in the Lens of Blockchain](https://arxiv.org/abs/1803.05069)
- [What is Tendermint](https://docs.tendermint.com/master/introduction/what-is-tendermint.html)
- [On the Byzantine Generals Problem (in Chinese)](https://justinzhangonline.wordpress.com/2010/01/13/%E6%9C%89%E5%85%B3%E6%8B%9C%E5%8D%A0%E5%BA%AD%E5%B0%86%E5%86%9B%E9%97%AE%E9%A2%98/)
- [Illustrated Guide to the Byzantine Generals Problem: OM Version (in Chinese)](https://marslenjoy.medium.com/%E5%9B%BE%E7%A0%81%E5%B9%B6%E8%8C%82%E4%B8%80%E6%96%87%E7%9C%8B%E6%87%82%E6%8B%9C%E5%8D%A0%E5%BA%AD%E5%B0%86%E5%86%9B%E9%97%AE%E9%A2%98om%E7%89%88-49e2dcbb629c)
- [The Byzantine Generals Problem - TheByte (in Chinese)](https://www.thebyte.com.cn/consensus/The-Byzantine-General-Problem.html)
