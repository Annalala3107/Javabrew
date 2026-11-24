---
title: Why Is TCP Byte-Stream Oriented While UDP Is Datagram Oriented? (Transport Layer)
description: Clarifies the fundamental differences between TCP byte streams and UDP datagrams, analyzes the causes and solutions for packet sticking/splitting (framing), and covers common interview topics like Nagle's algorithm and Delayed ACK.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: TCP,UDP,Byte Stream,Datagram,Packet Sticking,Packet Splitting,Message Boundaries,Framing,Nagle,Delayed ACK,TCP_NODELAY
lang: en
sourceRef: zh-ref/cs-basics/network/tcp-byte-stream-udp-datagram.md
---

It is commonly stated that TCP is byte-stream oriented while UDP is datagram oriented. While this might sound like a simple textbook definition, many practical issues surrounding packet sticking (sticky packets) and packet splitting (framing) trace their origins right here.

Bottom line: **TCP only guarantees that bytes arrive reliably and in order, without preserving application-layer message boundaries; UDP preserves the boundaries of the datagrams handed to it by the application layer.**

This article primarily addresses the following questions:

1. Why is TCP considered byte-stream oriented while UDP is datagram oriented?
2. How do TCP packet sticking and packet splitting actually arise?
3. How should the application layer define message boundaries?
4. Why do Nagle's algorithm and Delayed ACK sometimes introduce latency for small packets?

Consider an example where the application layer sends two consecutive messages:

```
Message 1: hello
Message 2: world
```

If sent via UDP, this typically corresponds to two discrete UDP datagrams. When the receiver calls `recvfrom()`, it reads data datagram by datagram: each call retrieves exactly one UDP datagram without merging two separate transmissions into a continuous stream. In the UDP receive queue, each entry is an individual datagram, naturally preserving message boundaries.

However, there is an important nuance: UDP preserves transport-layer datagram boundaries, but that does not mean it is suitable for arbitrarily massive messages. If a datagram is too large, the underlying IP layer will fragment it; if the receiver's buffer is too small, truncation may occur. Therefore, UDP being "datagram oriented" does not mean "send any size with impunity"; it means UDP does not abstract application data into a continuous byte stream the way TCP does. RFC 768 defines UDP in datagram mode and notes that it provides minimal protocol mechanisms without guarantees of reliable delivery or deduplication.

If sent via TCP, the behavior is completely different. Calling `send()` twice at the application layer simply writes two sequences of bytes into the kernel send buffer. When those bytes are actually transmitted, how many TCP segments they are partitioned into, and how many bytes the peer reads in a single `recv()` call are not directly determined by those two `send()` invocations.

For example, the receiver might read both in a single call (packet sticking / concatenation):

```
helloworld
```

Or read them across multiple fragmented calls (packet splitting / fragmentation):

```
hel
lowor
ld
```

This is not a bug or error in TCP; it is precisely how TCP is designed to work. TCP deals with an uninterrupted byte stream. It only cares about delivering those bytes reliably and in order, remaining agnostic to where the application layer's "N-th message" begins or ends. RFC 9293 explicitly notes that TCP segments and application-layer `send()` / socket write boundaries do not have a 1:1 mapping, and TCP provides no guarantees that application buffer boundaries correspond to network segment boundaries.

![TCP vs. UDP Message Boundaries](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-udp-message-boundary-ff2c1ad3.png)

Therefore, the term "TCP packet sticking / splitting" is a phenomenon viewed through the lens of the application layer. Strictly speaking, TCP has no concept of application "packets"; it transports a continuous byte stream. The real problem to solve is: **how does the application-layer protocol define its message boundaries?**

#### Why Do Packet Sticking and Packet Splitting Occur?

Common causes include:

**1. TCP is a byte-stream protocol with no concept of application message boundaries.**

TCP is responsible for delivering bytes to the peer reliably and in order, but it maintains no metadata indicating "these 20 bytes belong to message 1, and those 30 bytes belong to message 2".

**2. A single `send()` does not equal a single network transmission.**

A successful `send()` typically only signifies that data was copied from user-space memory into the kernel send buffer. When the data is physically transmitted over the wire and into how many TCP segments it is partitioned depends on MSS, the send window, the congestion window, Nagle's algorithm, and network interface card (NIC) queues.

**3. A single `recv()` does not equal reading a single complete message.**

The receiver merely extracts available bytes from the TCP receive buffer. The buffer might currently hold multiple accumulated messages, or only half a message. `recv()` simply copies whatever bytes are currently available to user space, without parsing or delineating business messages for you.

**4. Small packet optimizations alter transmission timing.**

Nagle's algorithm, Delayed ACK, and Linux automated small-write coalescing can all delay or aggregate small packets. For instance, Linux introduced `tcp_autocorking` in version 3.14, where the kernel attempts to coalesce consecutive small writes to reduce packet count; applications can also use `TCP_CORK` to explicitly dictate when to "uncork" and transmit.

This explains why protocol encoding and decoding are vital in Netty, Dubbo, custom RPC frameworks, IM gateways, and game servers. As long as TCP is the underlying transport, message boundaries must be explicitly handled at the application layer.

![Why TCP Packet Sticking / Fragmentation Occurs](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-sticky-split-causes-3dc840f6.png)

#### How Do You Resolve TCP Packet Sticking and Splitting?

There is only one core objective: **enable the receiver to know where each message ends.**

![How Does the Application Layer Define Message Boundaries?](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-message-boundary-solutio-86186610.png)

There are three common approaches:

**1. Fixed Length**

Specify that every message has a fixed length, such as 64 bytes. Whenever the receiver reads 64 bytes, it treats it as exactly one complete message.

This method is simple to implement but lacks flexibility. Short messages require padding, wasting bandwidth; long messages must be artificially split. It suits scenarios with highly rigid message structures but is ill-suited for general business protocols.

**2. Delimiters**

Insert special delimiters between messages, such as newlines (`\n`, `\r\n`) or custom boundary tokens.

```
hello\n
world\n
```

The receiver continuously reads bytes from the buffer, slicing out a complete message whenever it encounters the delimiter. Many text-based protocols adopt this pattern.

While intuitive, two issues require attention: first, if the delimiter naturally occurs inside the message body, escaping is required; second, the delimiter itself might be split across two separate `recv()` calls, so the parsing logic cannot assume a single read contains the entire delimiter.

**3. Length Field (Header Framing)**

This is the most common approach in production software engineering. A fixed-length header field specifies the exact payload size in bytes.

```
| 4-byte length | message payload |
```

The receiver first reads the fixed-size protocol header, decodes the payload length, and then reads that exact number of bytes. If fewer bytes are available, it waits; if excess bytes are read, they remain in the buffer as the beginning of the next message.

Many binary protocols and RPC frameworks employ this framing technique. In real-world designs, protocol headers usually include not just length, but also magic numbers, versioning, message types, sequence IDs, and serialization identifiers.

Length-field framing also has nuances: the length field must agree on endianness (typically Network Byte Order / Big-Endian); and an explicit maximum packet size ceiling must be enforced to prevent a corrupted or malicious length value from exhausting system memory. Robust production decoders must handle partial packets, invalid lengths, midway connection drops, and malformed requests gracefully.

#### Why Do Nagle's Algorithm and Delayed ACK Make Small Packets Slower?

When discussing packet sticking, interviewers often ask about Nagle's algorithm.

The objective of Nagle's algorithm is to curtail the proliferation of small packets. In the early days of networking with constrained bandwidth, if an application wrote 1 byte at a time, each packet incurred dozens of bytes of TCP/IP header overhead, flooding links with tiny packets and drastically impairing efficiency. RFC 896 addressed this "small-packet problem", proposing that if unacknowledged data remains in flight, new small writes should be held in the buffer until an ACK returns.

Delayed ACK is an optimization on the receiver side. When data arrives, the receiver delays sending an ACK briefly, hoping to piggyback it on outgoing application response data or aggregate ACKs across multiple received segments, reducing pure ACK packet volume. RFC 9293 categorizes this policy of "sending fewer ACKs than segments received" as delayed ACK.

While each mechanism is sensible on its own, combining them can substantially amplify latency. A typical anti-pattern is:

```
Client writes small data A
Client immediately writes small data B
Client waits for Server response
```

![Why Nagle + Delayed ACK May Slow Down Small Packets](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-nagle-delayed-ack-latency-b4ac9d98.png)

Small data A is transmitted immediately. Small data B is held in the client's send buffer by Nagle's algorithm, awaiting the ACK for A. The server receives A, but having no immediate response data ready, its Delayed ACK timer waits before dispatching an ACK. Consequently, the sender waits for the ACK while the receiver waits for more data or a timer expiration — artificially inflating latency by tens of milliseconds.

This friction is acutely felt in micro-RPCs, interactive protocols, real-time gaming synchronization, and remote shells.

The resolution is not "blindly disabling Nagle everywhere". A sound engineering approach is:

- Coalesce small writes in user-space into a single buffer before calling `write()` once.
- In request-response patterns, avoid consecutive small `write()` calls followed immediately by blocking on a response.
- For latency-sensitive connections exchanging small payloads, evaluate enabling `TCP_NODELAY` to flush small writes promptly.
- For throughput-heavy scenarios wishing to aggregate data, evaluate `TCP_CORK` on Linux (noting its non-portable nature).
- Always verify with packet captures (tcpdump/Wireshark) before adjusting socket options; do not tweak socket flags purely on assumptions.

In Java, networking frameworks expose `TCP_NODELAY` configuration, such as Netty's `ChannelOption.TCP_NODELAY`. Enabling it reduces latency for small messages at the cost of increasing packet count. For high-QPS systems, this trade-off should be evaluated holistically across message sizing, RTT, throughput, CPU overhead, and NIC packet rates. Linux `tcp(7)` notes that `TCP_NODELAY` disables Nagle, whereas `TCP_CORK` explicitly prevents partial frames from being transmitted until uncorked.

#### How to Answer in an Interview?

Here is a concise and structured answer:

TCP is byte-stream oriented. Data written by the application layer enters kernel buffers; TCP guarantees that these bytes reach the peer reliably and in order, but does not guarantee a 1:1 mapping between `send()` and `recv()`, nor does it retain application-level message boundaries. Consequently, a receiver may read multiple messages in a single read or only a partial message, giving rise to the concepts of packet sticking and packet splitting.

UDP is datagram oriented. Each write passed to UDP is transmitted as a discrete UDP datagram, and the receiver reads it datagram by datagram, naturally preserving message boundaries. However, UDP provides neither reliability guarantees nor ordering.

Resolving TCP packet sticking and splitting requires the application layer to define its own message framing. Common solutions are fixed-length framing, delimiter-based framing, and length-header framing. Production systems overwhelmingly prefer length-header framing for its flexibility with binary protocols and variable-length payloads, though implementations must guard against endianness issues, enforce maximum payload caps, buffer partial frames, and handle unexpected disconnections cleanly.
