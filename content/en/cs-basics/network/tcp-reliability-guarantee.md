---
title: How Does TCP Ensure Reliable Transmission? Deep Dive into Retransmission, Sliding Window, and Congestion Control
description: Systematically reviews TCP's reliability guarantee mechanisms, covering retransmission/SACK, flow control, and congestion control to clarify the key points of end-to-end reliable transmission.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: TCP,Reliability,Retransmission,SACK,D-SACK,Flow Control,Congestion Control,Sliding Window,Checksum,CUBIC,BBR
lang: en
sourceRef: zh-ref/cs-basics/network/tcp-reliability-guarantee.md
---

TCP is often referred to as a reliable transport protocol, but "reliability" is not an abstract promise; it is the collective result of several concrete mechanisms working in concert.

Lost packets must be retransmitted, out-of-order data must be reassembled, flow control must throttle the sender when the receiver is overwhelmed, and transmission rates must be reduced when the network congests. Connecting these mechanisms together is the only way to truly understand how TCP provides reliable data transfer on top of an unreliable IP network.

This article primarily addresses the following questions:

1. Through which mechanisms does TCP guarantee reliable data delivery?
2. What distinct problems do Retransmission TimeOut (RTO), Fast Retransmit, SACK, and D-SACK solve?
3. How does TCP implement flow control via the sliding window?
4. How should Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery in congestion control be understood?

First, let us clarify a common misconception: what TCP delivers reliably is a **byte stream**, not individual application-layer "messages". TCP does not preserve message boundaries defined by HTTP, RPC, or custom business protocols. What it does is assign sequence numbers to bytes in the stream and deliver them to the application layer in-order and without duplication to the best of its ability. As for "where a request begins and where it ends", that relies on upper-layer protocols to define their own framing via length fields, delimiters, HTTP packet formats, and similar mechanisms.

![Why TCP Packet Sticking / Fragmentation Occurs](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-sticky-split-causes-3dc840f6.png)

## How Does TCP Guarantee Transmission Reliability?

1. **Segment-Based Transmission**: Application data is broken into data chunks that TCP deems most appropriate for transmission before passing them to the network layer. These chunks are known as segments.
2. **Reordering and Deduplication of Out-of-Order Data**: TCP cannot prevent packet loss in the network. What it can do is assign sequence numbers to the byte stream, using ACKs, retransmissions, reordering, and deduplication so that the application layer perceives an ordered, duplicate-free data stream. TCP sequence numbers are essentially byte offsets rather than sequential packet numbers. Each TCP segment carries a range of contiguous bytes, and the receiver performs reordering and deduplication based on these sequence ranges.
3. **Checksum**: TCP calculates a checksum over the TCP header, TCP payload, and an IP pseudo-header. This is an end-to-end checksum designed to detect transmission errors. If a received segment fails checksum verification, TCP discards it without acknowledging receipt. However, the TCP checksum is merely a 16-bit one's complement sum primarily intended to detect common transmission bit flips; it is not a strong integrity check and cannot guard against malicious tampering. Practical data integrity in production systems usually depends on link-layer CRC, TLS AEAD, or application-layer hashes.
4. **Retransmission Mechanism**: In scenarios where TCP segments are lost or delayed, data is re-sent until an acknowledgment (ACK) is received from the peer. TCP retransmission mechanisms primarily include: timer-based retransmission (Timeout Retransmission / RTO), Fast Retransmit (triggered by receiver feedback), SACK (Selective Acknowledgment, which carries ranges of out-of-order received blocks in TCP options so the sender knows which blocks arrived), and D-SACK (Duplicate SACK, which additionally informs the sender about blocks received redundantly). The value of D-SACK lies in helping the sender identify whether a retransmission might have been "spurious": for example, the original data may have actually reached the receiver, but lost ACKs, network reordering, or an overly aggressive retransmission timer tricked the sender into assuming loss. When the receiver informs the sender via D-SACK that "I received this block redundantly", the sender can infer that the retransmission was likely a false alarm rather than genuine network congestion. However, D-SACK merely provides clues and cannot uniquely prove a single cause on its own.
5. **Flow Control**: Each endpoint of a TCP connection maintains a finite buffer space. The receiver advertises how much data it can currently accept via the Receive Window (`rwnd`). The sender throttles its transmission rate accordingly to prevent overflowing the receiver's buffers and causing packet drops.
6. **Congestion Control**: When the network is congested, TCP reduces the rate of data injected into the network. When sending data, TCP must account for two factors: first, the receiver's current available buffer capacity; second, the congestion state of the network. The receiver's processing capacity is reflected by the Receive Window (`rwnd`), while network congestion is reflected by the Congestion Window (`cwnd`). The amount of unacknowledged data the sender is permitted to keep in flight is constrained by `min(rwnd, cwnd)`, ensuring it neither exceeds receiver capacity nor injects excessive traffic into the network.

## Understanding TCP Retransmission Through ARQ

Among the mechanisms above, retransmission is the clearest embodiment of "reliable transmission". To ensure concepts like timeout retransmission, fast retransmit, and SACK do not appear out of thin air, let us first examine the abstract ARQ model.

**Automatic Repeat-reQuest (ARQ)** is an error-control protocol operating at the data link and transport layers of the OSI model. It achieves reliable information transmission over unreliable underlying services using acknowledgments and timeouts. If the sender does not receive an acknowledgment (ACK) within a certain duration after sending, it typically re-sends the data until an ACK arrives or a maximum retry limit is reached.

TCP can be understood through the lens of ARQ philosophy, but it is not identical to any single textbook ARQ variant. Modern TCP integrates cumulative ACKs, RTO, Fast Retransmit, SACK, congestion control, and flow control; retransmission behavior is shaped by all these mechanisms together.

- Standard ACKs are **cumulative**: an ACK means "all data prior to this sequence number has been received successfully."
- When SACK is enabled, the receiver can additionally report "which non-contiguous ranges I have received out of order", enabling the sender to retransmit only the missing blocks.

Thus, Stop-and-Wait ARQ and Go-Back-N are helpful for grasping foundational reliability concepts, while modern TCP with SACK is closer in behavior to Selective Repeat.

![Relationship Between ARQ and TCP Retransmission Mechanisms](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-arq-retransmission-mod-72c60d52.png)

ARQ encompasses Stop-and-Wait ARQ and Continuous ARQ.

### Stop-and-Wait ARQ Protocol

The Stop-and-Wait protocol is designed for reliable transmission. Its basic principle is to halt transmission after sending each packet and wait for the peer's acknowledgment (ACK). If no ACK arrives after a certain timeout period, the transmission is deemed unsuccessful and must be re-sent until an ACK is received before moving on to the next packet.

In Stop-and-Wait, if the receiver receives a duplicate packet, it discards the packet while still sending back an acknowledgment.

**1) Error-Free Case:**

The sender transmits a packet, the receiver receives it within the expected timeframe and replies with an ACK. The sender then transmits the next packet.

**2) Error Case (Timeout Retransmission):**

In Stop-and-Wait, timeout retransmission means that if no ACK is received after a specific duration, the previously sent packet is retransmitted (assuming the packet was lost). Therefore, a retransmission timer must be set whenever a packet is sent, and its timeout duration should be slightly longer than the average round-trip time of packet transmission. This automatic retransmission mode is termed **Automatic Repeat-reQuest (ARQ)**. Furthermore, if a duplicate packet is received, the receiver discards it while still returning an ACK.

**3) Lost Acknowledgment and Delayed Acknowledgment**

- **Lost ACK**: The ACK message is lost during transit. Suppose host A sends message M1, and host B receives it and sends back an ACK for M1, but the ACK is lost in transit. Host A has no knowledge of this and, once its retransmission timer expires, retransmits M1. Upon receiving M1 again, host B takes two actions: 1. Discards the duplicate M1 without delivering it to upper layers. 2. Sends an ACK back to A (it does not skip sending just because it sent one before; the fact that A retransmitted proves B's ACK was lost).
- **Delayed ACK (Late ACK)**: The ACK message is delayed in transit. Host A sends M1, host B receives it and sends an ACK. Because the ACK does not arrive before A's timeout expires, A retransmits M1. B receives it and sends another ACK (B has now received two copies of M1). At this point, A receives B's second ACK and proceeds to send subsequent data. Sometime later, A receives B's first (delayed) ACK for M1 (A has now received two ACKs). The handling is: 1. When A receives the duplicate ACK, it simply discards it. 2. When B receives duplicate M1 packets, it simply discards the duplicate M1.

### Continuous ARQ Protocol

Continuous ARQ represents a family of sliding-window-based retransmission philosophies, with classic forms including Go-Back-N (GBN) and Selective Repeat (SR). It significantly improves channel utilization: the sender maintains a send window, and any packets within this window can be sent continuously without waiting for individual peer acknowledgments. The receiver generally employs cumulative acknowledgments, acknowledging the last in-order packet received, indicating that all packets up to that point have been received correctly.

- **Advantages**: High channel utilization, straightforward implementation; even if an ACK is lost, retransmission may not be needed if a subsequent cumulative ACK arrives.
- **Disadvantages**: When using Go-Back-N, the receiver cannot inform the sender about all packets received correctly out of order. For example, if the sender transmits 5 packets and packet 3 is lost: under Go-Back-N, even if packets 4 and 5 arrive, the receiver discards them because they are out of order, repeatedly acknowledging only packet 2. The sender ultimately must roll back and retransmit everything starting from packet 3. The exact role of SACK in TCP is to allow the receiver to report these non-contiguous but successfully received blocks, preventing massive, unnecessary rollback retransmissions.

With this ARQ foundation established, examining TCP's concrete retransmission mechanisms becomes intuitive.

## TCP Retransmission Mechanism Quick Reference

TCP retransmission does not rely on a single trigger. The most fundamental is **Timeout Retransmission (RTO)**: when the sender waits for an ACK for too long, it concludes the segment was lost and retransmits it. Later came **Fast Retransmit**: when the receiver repeatedly ACKs the same old sequence number, it indicates an intermediate segment is missing, sparing the sender from waiting for a full timeout. SACK and D-SACK enrich ACKs with detailed range metadata, informing the sender about "which segments have arrived and which retransmissions were spurious".

The following table serves as a conceptual map: bringing together these retransmission mechanisms before diving into the foundational safety net — **RTO Timeout Retransmission**.

| Mechanism | Trigger Condition | Problem Solved |
| --- | --- | --- |
| Timeout Retransmission (RTO) | No ACK received after RTO expires | Foundational safety net for packet loss |
| Fast Retransmit | 3 duplicate ACKs received (repeatedly acknowledging the same cumulative ACK number) | Retransmits suspect lost segments quickly without waiting for RTO |
| SACK | ACK carries metadata of received data blocks | Informs sender of received blocks so only truly missing parts are retransmitted |
| D-SACK | SACK reports duplicate received blocks | Helps identify spurious retransmissions, lost ACKs, or network reordering |

## How Is Timeout Retransmission Implemented? How Is RTO Determined?

Let us examine the first row: **Timeout Retransmission (RTO)**. It is the bedrock of TCP's retransmission architecture. Regardless of whether SACK is enabled or Fast Retransmit triggers, whenever transmitted data fails to elicit an ACK after an extended period, TCP ultimately falls back on RTO to decide: "We cannot wait any longer; retransmit now."

When the sender transmits data, it starts a timer and awaits the destination's acknowledgment. The receiver replies with an ACK for successfully received TCP segments. If the sender fails to receive an acknowledgment within a reasonable round-trip duration, the corresponding segment is assumed lost and retransmitted.

- **RTT (Round Trip Time)**: The time elapsed from sending a TCP segment to receiving its corresponding ACK.
- **RTO (Retransmission TimeOut)**: The timeout duration before a retransmission is triggered, calculated from the moment data is sent.

![RTO Calculation Flowchart](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-rto-calculation-flow-05ccedcc.png)

Determining RTO is critical because it directly dictates TCP performance and efficiency. If RTO is too small, unnecessary retransmissions occur, loading the network; if RTO is too large, data transfer stalls, degrading throughput. Therefore, RTO must dynamically adapt to prevailing network conditions.

Because RTT fluctuates with network conditions, TCP cannot simply use an isolated RTT sample as the RTO. Modern TCP RTO calculation follows RFC 6298: it maintains a Smoothed RTT (SRTT) and an RTT Variation (RTTVAR) based on RTT samples to compute RTO, applying exponential backoff when timeouts occur.

The core insight of Karn's algorithm is: ACKs for retransmitted segments are excluded from RTT sampling, eliminating the ambiguity of whether an ACK corresponds to the original transmission or the retransmission.

Simply put: RTO is not RTT; it is "Smoothed RTT + Jitter Safety Margin". If a connection's RTT averages ~100 ms with high variance, RTO must maintain a larger safety buffer; if timeouts persist, subsequent RTO values double exponentially (backoff), preventing retransmissions from exacerbating congestion.

## How Does Fast Retransmit Work?

Timeout retransmission is reliable but slow because the sender must wait for RTO expiration. Fast Retransmit addresses this latency: it does not rely on timers, but instead leverages consecutive duplicate ACKs from the receiver to detect suspected packet loss much earlier.

TCP uses cumulative acknowledgments. Suppose the receiver has received bytes `[0, 1000)` in order and expects byte 1000 next. If it receives `[2000, 3000)` first, the intermediate range `[1000, 2000)` is missing. The receiver does not advance its ACK to 3000; instead, it replies with ACK = 1000, meaning "I am still waiting for byte 1000 and beyond." Segments that repeatedly acknowledge the same old ACK number are duplicate ACKs.

If the sender receives 3 consecutive duplicate ACKs, it assumes the data segment indicated by that ACK is highly likely lost. It immediately retransmits the missing segment without waiting for RTO. The reason it does not retransmit upon 1 duplicate ACK is that brief packet reordering can occur in the network: a later packet arriving first does not prove the earlier packet was dropped. Three duplicate ACKs represent a pragmatic compromise between "fast recovery" and "avoiding false alarms due to reordering".

Fast Retransmit can only quickly identify the "first hole". If multiple segments are lost within a single window, cumulative ACKs alone struggle to convey which subsequent blocks arrived and which are missing — which is where SACK comes in.

## How Does SACK Improve Retransmission Efficiency?

SACK (Selective Acknowledgment) fills the information void left by cumulative ACKs. A standard ACK can only express "all data prior to sequence X has been received", but cannot convey "subsequent blocks Y through Z have also arrived out of order". SACK carries non-contiguous byte blocks in TCP options within the ACK, helping the sender retransmit only the truly missing portions.

SACK must be negotiated during the three-way handshake via the SACK-Permitted option. Once enabled, the ACK number itself still adheres to cumulative ACK semantics, while the SACK option carries one or more SACK blocks. Each SACK block consists of a Left Edge and a Right Edge, representing the byte range `[Left Edge, Right Edge)` successfully received out of order.

For example: Suppose the sender transmits `[0, 1000)`, `[1000, 2000)`, `[2000, 3000)`, and `[3000, 4000)`. The segment `[1000, 2000)` is lost, but the latter two arrive. The receiver's cumulative ACK must remain at ACK = 1000, but it can report in the SACK option that it has received `[2000, 4000)`. The sender then knows that only `[1000, 2000)` requires retransmission, while `[2000, 4000)` does not need to be resent.

TCP option space is limited. The SACK option itself requires 2 bytes, and each SACK block requires 8 bytes; thus, a single TCP segment can hold at most 4 SACK blocks. If timestamps or other options are present, the available space is even smaller. That is, SACK cannot track an infinite number of out-of-order blocks, but it is more than sufficient to eliminate redundant retransmissions in multi-packet loss scenarios.

## What Is the Role of D-SACK?

D-SACK (Duplicate SACK), defined in RFC 2883, is an extension to SACK. While SACK informs the sender "which out-of-order blocks have arrived", D-SACK further informs the sender "which blocks have been received redundantly".

D-SACK introduces no new TCP options; it repurposes standard SACK blocks. It establishes the convention: if the first SACK block describes a data range already covered by the cumulative ACK, or describes a range already present in subsequent SACK blocks, that block is reporting duplicate data.

Why is duplicate data valuable? Because a retransmission does not necessarily mean the original segment was lost. Common scenarios include:

- The original segment reached the receiver, but the ACK was lost on the return path; the sender waited until RTO expired, assumed loss, and retransmitted.
- The original segment experienced severe network delay or reordering; the sender triggered Fast Retransmit, after which both the original and retransmitted segments arrived at the receiver.

Upon receiving a D-SACK, the sender can infer that the retransmission was spurious, and deduce whether the network suffers from lost ACKs, severe reordering, or an undersized RTO. While it cannot uniquely prove one specific cause on its own, it provides invaluable diagnostic evidence for congestion control and retransmission anomaly analysis.

## How Does TCP Implement Flow Control?

**TCP implements flow control using sliding windows. Flow control controls the sender's transmission rate to ensure the receiver has sufficient buffer capacity to receive incoming data.** The sliding window is a core mechanism in TCP, serving both to track "which data has been sent but not yet ACKed" and to enforce flow control. The receiver advertises its available buffer space via the Receive Window (`rwnd`) field in ACK packets, and the sender adjusts its send window accordingly. Setting `rwnd = 0` indicates the receiver has no available buffer space, preventing the sender from transmitting new data.

The window field in the TCP header is 16 bits wide, allowing a maximum value of 65,535 bytes. To accommodate larger receive windows, TCP relies on the TCP Window Scale option. During troubleshooting, you can verify whether Window Scale was negotiated in the SYN and SYN-ACK packets of the three-way handshake.

**How Does Zero Window Recover?** When the receiver advertises `rwnd = 0`, the sender halts transmission of new data. However, if the receiver later frees buffer space and sends an ACK advertising a non-zero window, and that ACK is lost in the network, both endpoints can become deadlocked: the sender waits for the window to open, while the receiver waits for new data.

![TCP Zero Window Probe Mechanism](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-zero-window-probe-37bd95a1.png)

To resolve this deadlock, TCP introduces **Zero Window Probing**. When the window is zero, the sender uses a persist timer to periodically send tiny probe segments (1 byte), forcing the receiver to reply with its current window size. Thus, even if the window update ACK was lost, the sender discovers the reopening of the window.

Zero window probes only break the deadlock caused by lost window update ACKs; they are not application-level health checks. If the receiving application stops reading from the socket for extended periods, the connection can linger in a zero-window state indefinitely, consuming resources on both ends. Real-world systems require application-layer read/write timeouts and idle connection reclamation as safety nets.

**Why Is Flow Control Necessary?** When two endpoints communicate, their processing speeds are rarely identical. If the sender transmits faster than the receiver can process, data accumulates in the **receive buffer** (out-of-order segments are also stored here). Under normal circumstances, the receiver shrinks `rwnd` or advertises a zero window to halt incoming data. Only when window control is overwhelmed, peer implementations misbehave, buffers are exhausted, or network queues overflow will packets be dropped. Flow control maintains dynamic equilibrium between sender and receiver.

Common misconceptions to avoid:

- Sender does not equal Client
- Receiver does not equal Server

TCP is full-duplex (FDX). Both sides can transmit and receive simultaneously. Both client and server maintain their own send buffer, receive buffer, send window, and receive window. Receive window size is bounded by application consumption rate, OS socket buffer limits, and hardware capabilities. Both sides manage windows symmetrically.

**TCP Send Window Structure**:

1. Segments sent and acknowledged;
2. Segments sent but not yet acknowledged;
3. Segments not yet sent, but receiver is ready to receive (can send);
4. Segments not yet sent, and receiver cannot accept (cannot send).

![TCP Send Window Structure](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-send-window-349faf71.png)

- **SND.WND**: Send Window size.
- **SND.UNA**: Send Unacknowledged, pointing to the oldest unacknowledged sequence number (left edge of the send window).
- **SND.NXT**: Send Next pointer, pointing to the first byte of available send window.

Considering only receive window constraints, the **usable send window size** is approximately `SND.UNA + SND.WND - SND.NXT`. Actual transmission is further constrained by `cwnd`, MSS, and send buffer space.

**TCP Receive Window Structure**:

1. Segments received and acknowledged;
2. Segments awaiting receipt and allowed to be sent by sender (can receive, not acknowledged);
3. Segments not allowed to be received (cannot receive).

![TCP Receive Window Structure](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-receive-window-d439d80a.png)

**Receive window size is dynamically adjusted.** It is influenced by application read speed, buffer consumption, system socket buffer configuration, and kernel autotuning.

The window diagrams above are conceptual; real-world window sizes are typically orders of magnitude larger.

**Silly Window Syndrome (SWS)** occurs when the sender transmits tiny chunks of data or the receiver advertises tiny window increments, flooding the network with packets containing large headers and minuscule payloads, causing severe efficiency degradation.

![Relationship Between SWS, Nagle's Algorithm, and Delayed ACK](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-sws-nagle-delayed-ack-df5d78bb.png)

Common mitigations include:

- **Receiver-Side SWS Avoidance**: Do not advertise small window increments immediately as individual bytes are freed; wait until available buffer space reaches a substantial threshold before updating the window.
- **Sender-Side Nagle's Algorithm**: If unacknowledged small packets remain in flight, buffer new outgoing small data until an ACK arrives or enough data accumulates to form an MSS segment.
- **Delayed ACK**: The receiver delays sending ACKs briefly, hoping to piggyback the ACK on outbound application data or combine ACKs across multiple received segments. While designed as an ACK generation policy rather than an SWS fix, it interacts closely with small-packet transmission strategies.

Note that Nagle's algorithm and Delayed ACK can interact adversely in interactive request-response patterns, introducing artificial delays of tens of milliseconds. Latency-sensitive interactive applications commonly disable Nagle via `TCP_NODELAY`. The trade-off is an increase in small packets, header overhead, and interrupt pressure. Batch responses or file transfers benefit from aggregated writes; on Linux, socket options like `TCP_CORK` can explicitly control packet coalescing.

## How Does TCP Implement Congestion Control?

When total demand for network resources along a path exceeds available capacity, performance degrades, manifesting as queue buildup, increased latency, and packet loss. This condition is congestion. Congestion control prevents excessive data from being injected into the network, keeping intermediate routers and links from becoming overloaded. Congestion control operates under the premise that the network can sustain its current load. It is a global mechanism involving all hosts, routers, and intermediate network elements. In contrast, flow control is an end-to-end concern between two communicating peers, throttling the sender to match receiver processing capacity.

![TCP Congestion Control](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-congestion-control-f6535a98.png)

To implement congestion control, the TCP sender maintains a state variable: the **Congestion Window (`cwnd`)**. The size of `cwnd` depends on network congestion and adjusts dynamically. The sender sets its effective transmission limit to the minimum of the congestion window and the receiver's advertised window: `min(cwnd, rwnd)`.

Under the foundational framework of RFC 5681 (TCP Reno), congestion control is broken down into four core mechanisms: **Slow Start**, **Congestion Avoidance**, **Fast Retransmit**, and **Fast Recovery**. Modern algorithms like CUBIC, BBR, and DCTCP build on or diverge from this foundation with different state machines. At the network layer, routers can also apply Active Queue Management (AQM) to drop or mark packets early, mitigating congestion.

- **Slow Start**: When a host begins transmission, injecting large volumes of data immediately can cause severe congestion because the path capacity is unknown. Slow Start probes capacity by starting with a small `cwnd` and scaling up rapidly. Slow start does not mean starting with just 1 MSS. RFC 6928 proposed and experimentally validated increasing the initial window (IW) from 2–4 segments to 10 segments (IW10), which many modern operating systems adopt by default. With an MSS of 1460 bytes, 10 MSS allows approximately 14 KB of data in the first RTT — crucial for HTTP short connections and web page initial load performance. During Slow Start, `cwnd` doubles approximately every RTT based on received ACKs (exponential growth).
- **Congestion Avoidance**: When `cwnd` reaches the Slow Start Threshold (`ssthresh`), TCP transitions into Congestion Avoidance to grow `cwnd` linearly rather than exponentially. Conceptually, `cwnd` increases by approximately 1 MSS per RTT. In implementation, this is achieved by incrementing `cwnd` by a fractional amount for each received ACK. `ssthresh` is initialized to a high value, and its first meaningful adjustment occurs upon detecting packet loss.
- **Fast Retransmit**: When the sender receives 3 duplicate ACKs (3 consecutive ACKs acknowledging the same old sequence number), it assumes an intermediate segment was lost and retransmits it immediately without waiting for RTO.
- **Fast Recovery**: In classic Reno, receiving 3 duplicate ACKs sets `ssthresh` to half of the current `cwnd`. The lost segment is retransmitted, and `cwnd` is set to `ssthresh + 3 × MSS`. For each additional duplicate ACK received, `cwnd` is incremented by 1 MSS. When a new ACK arrives confirming the retransmitted data, `cwnd` is reset to `ssthresh`, and TCP re-enters Congestion Avoidance. Fast Recovery avoids collapsing `cwnd` back to Slow Start because the duplicate ACKs prove subsequent packets are still traversing the network successfully. Modern TCP implementations with SACK, NewReno, CUBIC, or RACK/TLP employ more sophisticated loss recovery algorithms, but Reno remains the conceptual foundation.

Fast Retransmit handles single packet drops efficiently, but when multiple packets within a window are lost, duplicate ACKs alone cannot convey all the missing ranges. This motivated SACK, where the receiver explicitly enumerates received blocks so the sender only retransmits missing segments.

While Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery form the classical baseline, modern operating systems deploy more advanced congestion control algorithms:

- **CUBIC**: Standardized by RFC 9438 as the standards-track congestion control algorithm, superseding earlier specifications. CUBIC uses a cubic function to scale the congestion window, performing far better than Reno's linear growth on high-bandwidth, high-latency (BDP) links. It is the default congestion control algorithm in Linux, Windows, and Apple platforms.
- **BBR**: A model-based congestion control algorithm developed by Google that regulates transmission rate by estimating bottleneck bandwidth and minimum RTT. Its goal is high throughput with minimal queue delay, performing exceptionally well on bufferbloated links. However, BBR's real-world behavior depends on version, queue management, competing flow types, RTT fairness, and deployment topology; it is not a blanket drop-in replacement for CUBIC in every scenario.
- **DCTCP**: Designed specifically for controlled datacenter networks, relying on Explicit Congestion Notification (ECN) markings to estimate congestion and maintain near-zero queuing delay across shallow-buffer switches. It is not intended for general public Internet deployment.

Nonetheless, Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery remain the prerequisite foundation for understanding these modern protocols.

An important engineering distinction: packet loss does not always signify congestion. Classical Reno/CUBIC treat packet loss primarily as a congestion indicator, but wireless link noise, path migration, or transient buffer spikes can also cause loss; conversely, ECN signals congestion without dropping packets. When comparing congestion control algorithms, do not focus solely on average throughput; evaluate P95/P99 latency, loss rate, retransmission rate, queue depth, coexistence dynamics with CUBIC/Reno, and specific kernel tuning.

## Summary

TCP reliability does not mean "guaranteeing the network never drops packets"; rather, it means utilizing a coordinated suite of mechanisms over an unreliable IP network so the application layer receives an **in-order, duplicate-free, and complete byte stream**. Its core architecture rests on four pillars:

1. **Tracking Data State with Sequence Numbers and ACKs**: TCP assigns sequential byte offsets to the stream. Receivers use ACKs to report what has been received, enabling senders to discern what is in flight and what remains pending.
2. **Repairing Loss with Retransmissions**: RTO timeout retransmission provides the ultimate safety net, Fast Retransmit accelerates recovery for isolated losses, and SACK/D-SACK provide granular insight into received blocks and spurious retransmissions.
3. **Throttling Senders with Sliding Window Flow Control**: Receivers advertise `rwnd` to declare available buffer space, bounding the sender's in-flight data volume and preventing receiver buffer overruns.
4. **Shielding the Network with Congestion Control**: Senders estimate network path capacity via `cwnd`, utilizing Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery, and modern algorithms like CUBIC and BBR to avoid injecting excessive traffic into the network.

In summary: TCP does not make the underlying network inherently reliable; it constructs a reliable byte-stream channel for applications through **sequence numbering, acknowledgments, retransmissions, reordering/deduplication, flow control, and congestion control**.

## References

1. Computer Networking (7th Edition)
2. Illustrated HTTP
3. TCP and UDP Tutorial: <https://www.9tut.com/tcp-and-udp-tutorial>
4. Computer Network: <https://github.com/wolverinn/Waking-Up/blob/master/Computer%20Network.md>
5. TCP Flow Control: <https://www.brianstorti.com/tcp-flow-control/>
6. TCP Flow Control: <https://notfalse.net/24/tcp-flow-control>
7. Principles of TCP Sliding Window: <https://cloud.tencent.com/developer/article/1857363>
8. RFC 9293 - Transmission Control Protocol: <https://www.rfc-editor.org/rfc/rfc9293>
9. RFC 6928 - Increasing TCP's Initial Window: <https://www.rfc-editor.org/rfc/rfc6928>
10. RFC 5681 - TCP Congestion Control: <https://datatracker.ietf.org/doc/html/rfc5681>
11. RFC 2018 - TCP Selective Acknowledgment Options: <https://www.rfc-editor.org/rfc/rfc2018>
12. RFC 2883 - An Extension to the Selective Acknowledgement (SACK) Option for TCP: <https://www.rfc-editor.org/rfc/rfc2883>
13. RFC 9438 - CUBIC for Fast and Long-Distance Networks: <https://www.rfc-editor.org/rfc/rfc9438>
14. RFC 8257 - Data Center TCP (DCTCP): <https://www.rfc-editor.org/rfc/rfc8257>
15. BBR: Congestion-Based Congestion Control, ACM Queue, 2016: <https://queue.acm.org/detail.cfm?id=3022184>
16. RFC 1122 - Requirements for Internet Hosts - Communication Layers: <https://datatracker.ietf.org/doc/html/rfc1122>
17. RFC 6298 - Computing TCP's Retransmission Timer: <https://www.rfc-editor.org/rfc/rfc6298>
18. RFC 7323 - TCP Extensions for High Performance: <https://datatracker.ietf.org/doc/rfc7323/>
