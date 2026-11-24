---
title: Common Computer Network Interview Questions Summary (Part 2)
description: Summary of common computer network interview questions (Part 2), covering TCP/UDP, connection management, reliable transmission, HTTP/3, IP, IPv6, NAT, and ARP fundamentals.
category: Computer Science Basics
tag:
  - Computer Networks
head:
  - - meta
    - name: keywords
      content: Computer Network Interview Questions, TCP vs UDP, TCP Three-Way Handshake, HTTP/3 QUIC, IPv4 vs IPv6, TCP Reliability, IP Address, NAT Protocol, ARP Protocol, Transport Layer Interview, Network Layer High-Frequency Questions, TCP-based Protocols, UDP-based Protocols, Head-of-Line Blocking, Four-Way Handshake
lang: en
sourceRef: zh-ref/cs-basics/network/other-network-questions2.md
---

In computer network interview questions, the parts that interviewers probe into granular detail usually center on transport and network layer topics such as **TCP, UDP, IP, ARP, NAT, and IPv4/IPv6**. For example: Why is TCP reliable? Why are three-way handshakes and four-way handshakes necessary? Why did HTTP/3 switch to UDP-based QUIC? These questions test not only conceptual knowledge but also your deep understanding of network communication processes.

This article, "Common Computer Network Interview Questions Summary (Part 2)", focuses on high-frequency backend interview topics including TCP vs. UDP, TCP connection management, reliable transmission, IP addressing, ARP, and NAT, helping you connect the core test points across the transport and network layers.

## TCP and UDP

### ⭐️ Differences Between TCP and UDP (Important)

1. **Connection-Oriented vs. Connectionless**:
   - TCP is connection-oriented. Before transmitting data, a connection must be established via a "three-way handshake"; after data transmission is complete, the connection must be released via a "four-way handshake". This ensures both parties are prepared for communication.
   - UDP is connectionless. It requires no connection prior to sending data, simply transmitting datagrams directly.
2. **Reliable vs. Unreliable Delivery**:
   - TCP provides reliable data transfer service. Through mechanisms like sequence numbers, acknowledgments (ACK), timeout retransmission, flow control, and congestion control, it ensures data arrives error-free, without loss, without duplication, and in proper order.
   - UDP provides unreliable delivery. It employs best-effort delivery, offering no guarantee of arrival, order, or automatic retransmission. The receiver also does not actively send acknowledgments upon receiving datagrams.
3. **Stateful vs. Stateless**:
   - TCP is stateful. To guarantee reliability, TCP maintains connection state on both endpoints, including sequence numbers, window sizes, what data has been transmitted, and what has been acknowledged.
   - UDP is stateless. It maintains no connection state. Once sent, the sender no longer cares if or how it arrives, incurring minimal overhead.
4. **Transmission Efficiency**:
   - Because TCP requires connection establishment, acknowledgments, retransmissions, and flow/congestion control, its overhead is higher and its transmission efficiency is relatively lower.
   - UDP has a simple structure without complex control mechanisms, offering low overhead, higher transmission efficiency, and faster speeds.
5. **Transmission Format**:
   - TCP is byte-stream oriented (Byte Stream). It treats data delivered by applications as an unstructured stream of bytes, potentially splitting or coalescing data chunks.
   - UDP is message-oriented (Message Oriented). Whatever size data block the application hands to UDP, UDP sends as-is, neither splitting nor combining, preserving application message boundaries.
6. **Header Overhead**:
   - A TCP header requires at least 20 bytes, and up to 60 bytes if options are present.
   - A UDP header is extremely lightweight, fixed at only 8 bytes.
7. **Broadcast or Multicast Support**:
   - TCP supports only point-to-point (unicast) communication.
   - UDP supports one-to-one (unicast), one-to-many (multicast), and one-to-all (broadcast) communication.
8. ……

For a clearer visual comparison, see the table below:

| Feature | TCP | UDP |
| --- | --- | --- |
| **Connectivity** | Connection-oriented | Connectionless |
| **Reliability** | Reliable | Unreliable (best-effort) |
| **State Maintenance** | Stateful | Stateless |
| **Transmission Efficiency** | Lower | Higher |
| **Transmission Format** | Byte-stream oriented | Datagram/Message-oriented |
| **Header Overhead** | 20 - 60 bytes | 8 bytes |
| **Communication Mode** | Point-to-point (unicast) | Unicast, Multicast, Broadcast |
| **Common Applications** | HTTP/HTTPS, FTP, SMTP, SSH | DNS, DHCP, SNMP, TFTP, VoIP, Video Streaming |

### ⭐️ When to Choose TCP vs. UDP?

Choosing between TCP and UDP depends primarily on **how high your application's reliability requirements are, and how critical real-time latency and efficiency are**.

When **data accuracy and integrity are critical and errors cannot be tolerated**, TCP is typically chosen. TCP provides a comprehensive set of mechanisms (three-way handshake, acknowledgments, retransmission, flow control, etc.) to ensure reliable, in-order delivery. Typical use cases include:

- **Web Browsing (HTTP/HTTPS):** Web page contents, images, and scripts must load completely to render properly.
- **File Transfer (FTP, SCP):** File content cannot permit any lost or out-of-order bytes.
- **Email Transmission (SMTP, POP3, IMAP):** Email contents must be delivered completely and intact.
- **Remote Login (SSH, Telnet):** Commands and terminal output require accurate transmission.
- ……

When **real-time performance, speed, and efficiency take priority, and the application can tolerate minor packet loss or reordering**, UDP is typically chosen. UDP incurs minimal overhead and transmits quickly without connection setup or complex reliability machinery. Typical use cases include:

- **Real-Time Audio/Video (VoIP, Video Conferencing, Live Streaming):** Dropping a packet occasionally (causing brief audio/video glitching) is far more acceptable than enduring long latency pauses caused by TCP retransmissions. The application layer may implement its own compensation logic.
- **Online Gaming:** Player positions and states must be transmitted rapidly. Freshness is paramount; old data quickly becomes obsolete, so minor packet loss has minimal impact.
- **DHCP (Dynamic Host Configuration Protocol):** Clients requesting an IP address do not yet have one, making TCP connection establishment impossible. Moreover, DHCP requires broadcast, has simple query-response patterns, and provides its own application-level retry mechanism.
- **IoT Data Reporting:** Sensors periodically reporting telemetry can often drop occasional data points without affecting aggregate trend analysis.
- ……

### Is HTTP Based on TCP or UDP?

~~**HTTP is based on TCP**, so before sending HTTP requests, a TCP connection must first be established via a 3-way handshake.~~

🐛 Correction (see [issue#1915](https://github.com/Snailclimb/JavaGuide/issues/1915)):

Prior to HTTP/3.0, HTTP was based on TCP. However, HTTP/3.0 deprecates TCP in favor of **QUIC, which is built on top of UDP**:

- **HTTP/1.x and HTTP/2.0**: Both versions run explicitly on top of TCP. TCP provides reliable, connection-oriented transport, ensuring in-order and error-free data delivery, which is vital for correctly rendering web pages. Prior to sending HTTP requests, a TCP three-way handshake must establish the connection.
- **HTTP/3.0**: This marks a major paradigm shift. HTTP/3 abandons TCP in favor of QUIC, which runs over UDP.

![HTTP/1, HTTP/2, and HTTP/3 Protocol Stack Comparison](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-3-implementation-ab73b085.png)

**Why did HTTP/3 make this change? Primarily for two reasons:**

1. Resolving Head-of-Line (HOL) blocking.
2. Reducing connection establishment latency.

Let us explore these two optimizations in detail:

In HTTP/2, multiple request/response streams can be multiplexed concurrently over a single TCP connection. However, because TCP strictly enforces in-order delivery, if a single TCP packet belonging to one stream is dropped or delayed, the entire TCP connection is blocked while waiting for retransmission. This stalls all HTTP/2 streams sharing that connection, even if their data packets have already arrived. **QUIC (running over UDP) solves this issue**. QUIC implements stream multiplexing and flow control natively within its own layer. Individual HTTP streams in QUIC are truly independent. If a packet from one stream is dropped, only that stream is paused, while other streams on the same QUIC connection continue unimpeded, dramatically improving concurrency efficiency.

In addition to eliminating HOL blocking, HTTP/3 reduces handshake latency. In HTTP/2, establishing a secure HTTPS connection requires both a TCP three-way handshake and a TLS handshake:

RTT refers to the round-trip time for a packet to travel from one endpoint to the peer and back, not one-way latency. Measuring TCP handshake latency requires clarifying the endpoint: the client receives a SYN-ACK approximately 1 RTT after sending a SYN, and can then send the final ACK along with application requests; the server requires an additional half RTT to receive that request. When comparing HTTP/2 and HTTP/3, consistent metrics should be used, such as "when the client can send its first request" or "time to first byte (TTFB)".

An HTTP/2 HTTPS connection requires establishing a TCP connection first, followed by TLS negotiation. HTTP/3 combines transport parameter negotiation and TLS 1.3 key exchange directly into the QUIC handshake. New QUIC connections typically establish in 1-RTT. 0-RTT resumption applies only when the client holds previous connection state, allowing early data in the initial packet; however, 0-RTT carries replay risks and is only suitable for idempotent requests.

For detailed citations, refer to:

- <https://en.wikipedia.org/wiki/HTTP/3>
- <https://datatracker.ietf.org/doc/rfc9114/>

### Why Is TCP Byte-Stream Oriented While UDP Is Message-Oriented?

![TCP and UDP Message Boundaries](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-udp-message-boundary-ff2c1ad3.png)

TCP is byte-stream oriented. Data written by the application layer enters kernel buffers; TCP guarantees only that these bytes arrive at the remote endpoint reliably and in order. It does not guarantee that one `send()` corresponds to one `recv()`, nor does it retain application layer message boundaries. Consequently, a receiver may read multiple messages in a single read call or only half a message—commonly referred to as packet sticking (coalescing) and packet fragmentation (splitting).

![Why Does TCP Packet Sticking and Fragmentation Occur?](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-sticky-split-causes-3dc840f6.png)

UDP is message-oriented. Each chunk of data passed by the application to UDP is transmitted as an independent UDP datagram. The receiving side reads datagram by datagram, naturally preserving message boundaries. However, UDP guarantees neither reliable delivery nor packet ordering.

Solving TCP packet sticking/splitting fundamentally requires application layer protocols to define their own message boundaries. Common approaches include fixed-length messages, delimiters, and length-prefixed headers. In production engineering, length-prefixed headers are preferred due to their flexibility with binary protocols and variable-length payloads, though developers must manage endianness, maximum length limits, partial packet buffering, and abrupt connection closures.

![How the Application Layer Defines Message Boundaries](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-message-boundary-solutio-86186610.png)

Detailed article: [Why Is TCP Byte-Stream Oriented While UDP Is Message-Oriented?](./tcp-byte-stream-udp-datagram.md)

### What Protocols Are Built on TCP and UDP?

TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are the two core protocols of the transport layer, providing fundamental communication services for diverse application layer protocols:

**Protocols Running on TCP (Prioritizing Reliable, Ordered Delivery):**

| Chinese Name (Abbr.) | Full English Name | Primary Purpose | Notes & Characteristics |
| --- | --- | --- | --- |
| Hypertext Transfer Protocol (HTTP) | HyperText Transfer Protocol | Transmitting web pages, hypertext, multimedia | **HTTP/1.x and HTTP/2 run over TCP**. Unencrypted in early forms, serving as the foundation of web communication. |
| Secure Hypertext Transfer Protocol (HTTPS) | HyperText Transfer Protocol Secure | Encrypted web transmission | Uses TLS to secure HTTP. HTTP/1.1 and HTTP/2 typically use TLS over TCP, while HTTP/3 uses QUIC with integrated TLS 1.3. |
| File Transfer Protocol (FTP) | File Transfer Protocol | File transfer | Traditional FTP transmits in **plaintext** and is insecure. Prefer secure alternatives like **SFTP (SSH File Transfer Protocol)** or **FTPS (FTP over SSL/TLS)**. |
| Simple Mail Transfer Protocol (SMTP) | Simple Mail Transfer Protocol | **Sending** email | Transmits email from clients to servers or relays between mail servers. Can be upgraded to encrypted channels via **STARTTLS**. |
| Post Office Protocol version 3 (POP3) | Post Office Protocol version 3 | **Receiving** email | Typically downloads email from server to **local storage and deletes server copies** (retention configurable). **POP3S** is its SSL/TLS encrypted version. |
| Internet Message Access Protocol (IMAP) | Internet Message Access Protocol | **Receiving and managing** email | Retains emails on the server, supporting multi-device sync, folder management, and remote searching. **IMAPS** is its encrypted version. Preferred modern standard. |
| Remote Terminal Protocol (Telnet) | Teletype Network | Remote terminal login | Transmits all data (including passwords) in **plaintext**; highly insecure and virtually replaced by SSH. |
| Secure Shell (SSH) | Secure Shell | Secure remote administration, encrypted data transfer | Provides encrypted remote terminal login, command execution, and secure file transfer (SFTP). A secure replacement for Telnet. |

**Protocols Running on UDP (Prioritizing Speed and Low Overhead):**

| Chinese Name (Abbr.) | Full English Name | Primary Purpose | Notes & Characteristics |
| --- | --- | --- | --- |
| Hypertext Transfer Protocol version 3 (HTTP/3) | HyperText Transfer Protocol version 3 | Next-generation web transmission | Based on **QUIC** (which runs over UDP), designed to minimize latency and eliminate TCP HOL blocking; supports 0-RTT early data for session resumption. |
| Dynamic Host Configuration Protocol (DHCP) | Dynamic Host Configuration Protocol | Dynamically assigning IP addresses and network configs | Clients automatically obtain IP addresses, subnet masks, gateways, and DNS servers from DHCP servers. |
| Domain Name System (DNS) | Domain Name System | Resolving domain names to IP addresses | **Typically uses UDP** for fast queries. Switches to **TCP** when response payloads exceed limits or during zone transfers (AXFR) to guarantee integrity. |
| Real-time Transport Protocol (RTP) | Real-time Transport Protocol | Streaming real-time audio/video data | Widely used in VoIP, video conferencing, and live streaming. Prioritizes low latency over zero packet loss. Typically paired with RTCP. |
| RTP Control Protocol (RTCP) | RTP Control Protocol | Monitoring QoS and control metrics for RTP streams | Works alongside RTP, providing statistics on packet loss, jitter, and delay to assist flow and congestion management. |
| Trivial File Transfer Protocol (TFTP) | Trivial File Transfer Protocol | Simplified file transfer | Lightweight and basic; commonly used for diskless workstation booting in LANs and network device firmware upgrades. |
| Simple Network Management Protocol (SNMP) | Simple Network Management Protocol | Monitoring and managing network devices | Enables network administrators to monitor and modify network device status. |
| Network Time Protocol (NTP) | Network Time Protocol | Synchronizing computer system clocks | Synchronizes clocks across networked computers to ensure time consistency. |

**Summary:**

- **TCP** is best suited for applications requiring high **reliability, integrity, and ordering**, such as web browsing (HTTP/HTTPS), file transfers (FTP/SFTP), and email (SMTP/POP3/IMAP).
- **UDP** is best suited for applications prioritizing **low latency and able to tolerate minor loss**, such as domain resolution (DNS), real-time audio/video (RTP), online gaming, and network telemetry (SNMP).

### ⭐️ Differences Between TCP Keepalive and HTTP Keep-Alive

| Dimension | HTTP Keep-Alive | TCP Keepalive |
| --- | --- | --- |
| **Layer** | Application layer (HTTP protocol) | Transport layer (TCP protocol) |
| **Problem Solved** | Reuses TCP connections, reducing repeated handshakes, teardowns, and slow-start penalties | Probes long-idle TCP connections, releasing socket resources if the remote peer becomes unreachable |
| **Default Behavior** | HTTP/1.0 defaults to short-lived; HTTP/1.1 defaults to persistent connections | Disabled by default; applications must explicitly enable `SO_KEEPALIVE` |
| **Granularity** | Controlled per connection policy by HTTP clients, web servers, or reverse proxies | Controlled by OS kernel, with per-socket tuning available on some platforms |
| **Common Parameters** | `Connection`, `Keep-Alive: timeout/max`, server timeout configurations | `tcp_keepalive_time/intvl/probes` or OS platform equivalents |
| **Closure Triggers** | Idle timeout reached, request count threshold exceeded, or explicit close by either party | Probes sent after idle threshold; closes after repeated unanswered probes or receiving RST |
| **When Peer Is Online** | Server may still actively close idle connections per configured policy | As long as the remote kernel responds with ACK, the connection remains open |
| **Replaces Heartbeats?** | Cannot evaluate application health; only manages HTTP connection reuse | Cannot detect application thread pool exhaustion, event loop lockups, or backend dependency failures |
| **Intermediary Impact** | Proxies and gateways independently manage client-side and upstream HTTP/TCP connections | NAT gateways, LBs, and reverse proxies may limit probing to only one leg of the TCP path |
| **HTTP/2 and HTTP/3 Relation** | HTTP/2 forbids connection-level headers; HTTP/3/QUIC does not use this mechanism | Applies only to TCP; genuine HTTP/3/QUIC connections are unaffected |

**Default Keep-Alive behaviors vary across HTTP versions**:

![Default Keep-Alive Behaviors Vary Across HTTP Versions](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/different-http-versions-have-different-default-k-f743d0f1.png)

Looking at "who decides to close the connection", the philosophies are opposite:

HTTP Keep-Alive uses "proactive reclamation": once a timeout or request limit is reached, the server closes the connection per its own configuration without needing to probe if the client is still alive.

TCP Keepalive uses "passive reclamation": it must first transmit probe packets asking "Are you still there?". As long as the remote endpoint's OS responds with ACKs, the server continues maintaining the connection and resets timers. It only releases resources after confirming the peer has vanished.

![TCP Keepalive Working Principle](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-wo-7f50afab.png)

![TCP Keepalive Probing Mechanism](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-de-306c79b5.png)

In production systems, both frequently run simultaneously to address different concerns: HTTP Keep-Alive governs connection reuse limits (how long or for how many requests a connection persists), while TCP Keepalive detects whether a silent remote endpoint has disappeared. They do not conflict and cannot substitute for one another.

Detailed article: [What Is the Difference Between TCP Keepalive and HTTP Keep-Alive?](./tcp-keepalive-vs-http-keepalive.md)

### ⭐️ TCP Three-Way Handshake and Four-Way Handshake (Crucial)

**Related Interview Questions**:

- Why is a three-way handshake required?
- In the 2nd handshake, an ACK is returned; why must a SYN also be returned?
- Why is a four-way handshake required to terminate a connection?
- Why cannot the server's ACK and FIN be combined into a three-way handshake during termination?
- What happens if the server's ACK in the second handshake step does not reach the client?
- Why must the client wait for 2*MSL (Maximum Segment Lifetime) in the `TIME_WAIT` state during the fourth step before transitioning to `CLOSED`?

**Reference**: [TCP Three-Way Handshake and Four-Way Handshake (Transport Layer)](https://javaguide.cn/cs-basics/network/tcp-connection-and-disconnection.html).

### What Is TCP TIME_WAIT Waiting For? Why Wait?

**Related Interview Questions**:

1. What exactly is `TIME_WAIT` waiting for?
2. Does a massive accumulation of `TIME_WAIT` connections cause real problems?
3. Can `tcp_tw_reuse` be enabled casually?
4. How do you distinguish between `TIME_WAIT` and `CLOSE_WAIT`?

**Reference**: [TCP TIME_WAIT Explained: Why Wait, Potential Issues, and Can It Be Reused?](./tcp-time-wait.md).

### ⭐️ How Does TCP Guarantee Transmission Reliability? (Important)

**Reference**: [TCP Transmission Reliability Guarantees (Transport Layer)](https://javaguide.cn/cs-basics/network/tcp-reliability-guarantee.html).

### Can TCP and UDP Use the Same Port?

Conclusion: **Yes**. TCP and UDP port namespaces are separated by transport layer protocols. The same numerical port does not conflict across different protocols.

When the OS kernel receives an IP packet, it checks the IP protocol field (TCP protocol number is `6`, UDP is `17`). Based on this protocol number, it dispatches the packet to the appropriate TCP or UDP protocol stack, which then routes the packet based on IP and port. Thus, `TCP/8080` and `UDP/8080` coexist seamlessly without interference.

![Kernel Protocol Dispatch Flow](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-kernel-protoco-09d025cf.png)

What actually conflicts is duplicate binding under the **same protocol** (e.g., two TCP services attempting to bind to the same local IP and port), where socket options like `SO_REUSEADDR` or `SO_REUSEPORT` come into play.

Classic examples: DNS uses both `UDP/53` (standard queries) and `TCP/53` (oversized responses, zone transfers); HTTP/3 commonly binds `UDP/443` (QUIC) alongside standard HTTPS on `TCP/443`.

![Practical Examples of DNS and HTTP/3 Using Both TCP and UDP Ports](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-practical-appl-ab70afb0.png)

Detailed article: [Can TCP and UDP Use the Same Port?](./can-tcp-and-udp-use-the-same-port.md)

### ⭐️ Can a Single Host Maintain More Than 65,535 TCP Connections?

Conclusion: **Yes**. `65535` is the maximum 16-bit port number, not the connection limit.

A TCP connection is uniquely identified by a 4-tuple: `(Source IP, Source Port, Destination IP, Destination Port)`. As long as any element in the 4-tuple differs, the kernel treats it as a distinct connection. When a server listens on a single port, as long as client IPs or client ports differ, connections can scale far beyond 65,535.

![TCP Connections Differentiated by 4-Tuples and Real Resource Constraints](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/maximum-number-of-tcp-connections-per-host-tcp-f-4d337232.png)

Real factors limiting connection scale:

- **Server Side**: Bound primarily by file descriptors, RAM, CPU, network interfaces, and application concurrency handling, rather than port count.
- **Client Side**: When connecting to a single target endpoint, source IP, destination IP, and destination port are fixed, leaving only the ephemeral source port variable. Clients can easily hit the ephemeral port limit (~28,000 ports by default on Linux). Excessive `TIME_WAIT` sockets exacerbate this issue.
- **NAT Gateways**: When numerous internal hosts share a single public IP to access a common external service, the NAT gateway's public source ports become a bottleneck.

In production, the most frequent pitfall is not port scarcity, but **misconfigured connection pooling that leads to rapid connection churn (creation and teardown)**, exhausting ephemeral ports. When troubleshooting, prioritize verifying connection pooling and keep-alive before tuning kernel parameters.

Detailed article: [Can a Single Host Maintain More Than 65,535 TCP Connections?](./maximum-number-of-tcp-connections-per-host.md)

## IP

### What Is the Purpose of the IP Protocol?

The **IP (Internet Protocol)** is one of the foundational protocols in the TCP/IP suite, operating at the network layer. Its primary role is defining packet formats and providing routing and addressing so packets can traverse networks to reach their intended destinations.

Currently, IP primarily exists in two versions: IPv4 and the newer IPv6. Both are in active use today, with IPv6 designed to succeed IPv4.

### What Is an IP Address? How Does IP Addressing Work?

An IP address is assigned to a network interface to identify communication endpoints within a specific scope and routing context. An interface may possess multiple addresses, addresses can change dynamically, private addresses may be reused across disparate networks, and Anycast addresses can be shared across multiple interfaces. Example IPv4: `192.168.1.1`; example IPv6: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`.

When a network device dispatches an IP packet, the packet contains a **Source IP Address** and a **Destination IP Address**. These identify the source interface and destination interface used for this specific communication, rather than an immutable device identity.

Network devices inspect the destination IP address to determine the packet's destination network or subnet, forwarding it accordingly.

This IP-based addressing forms the bedrock of Internet communication. Address uniqueness and routability depend on address type and scope; an IP address should not be broadly characterized as an immutable global ID for a physical device.

![IP Addresses Enable Packets to Reach Their Destinations](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/internet_protocol_ip_address_diagram-ec6271a2.png)

### What Is IP Address Filtering?

**IP Address Filtering** restricts or blocks traffic from specific IP addresses or IP ranges. For example, if an image service comes under attack from a specific IP address, that address can be blacklisted.

IP address filtering is a basic security mechanism. In production, it is typically combined with authentication, authorization, and encryption; relying solely on IP filtering does not guarantee complete security.

### ⭐️ Differences Between IPv4 and IPv6

**IPv4 (Internet Protocol version 4)** is the widely adopted IP standard using dot-decimal notation (four numbers separated by periods, e.g., `123.89.46.72`). IPv4 uses 32-bit addresses, yielding approximately 4.29 billion (2^32) addresses.

![IPv4 Address Format with Dotted-Decimal Notation Representing 32-Bit Address](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/Figure-1-IPv4Addressformatwithdotteddecimalnotat-233c4843.png)

This address pool is insufficient for global demand. The fundamental solution is **IPv6 (Internet Protocol version 6)**. IPv6 uses hexadecimal notation separated by colons (e.g., `2001:0db8:85a3:0000:0000:8a2e:0370:7334`). IPv6 uses 128-bit addresses, offering 2^128 (a 39-digit number) addresses.

![IPv6 Address Format with Hexadecimal Notation Representing 128-Bit Address](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/Figure-2-IPv6Addressformatwithhexadecimalnotatio-78d646ff.png)

Beyond an astronomical address space, IPv6 brings significant advantages:

- **Stateless Address Autoconfiguration (SLAAC)**: Hosts generate IPv6 addresses automatically based on router advertisements and interface identifiers without requiring DHCPv6. Duplicate Address Detection (DAD) checks for collisions on the local link before address usage, though it does not provide an absolute global uniqueness guarantee.
- **NAT Becomes Optional**: Abundant addresses allow assigning globally routable addresses directly to devices.
- **Simplified Base Header**: Streamlines packet processing on standard forwarding paths, though real-world performance still depends on hardware, extension headers, and network policy.
- **Extension Headers**: Enables modular extension headers for specific options and features.
- **ICMPv6**: Upgrades ICMP with Neighbor Discovery (NDP) and Path MTU Discovery, improving network reliability and performance.
- ……

### How to Retrieve the Client's Real IP?

Techniques to retrieve a client's real IP span the application, transport, and network layers:

**Application Layer**:

`X-Forwarded-For` is a de facto standard HTTP header used across reverse proxies; the IETF standardized equivalent is the `Forwarded` header. Both are HTTP-specific and cannot be applied to protocols like SMTP. Backend applications must never trust incoming `X-Forwarded-For` headers unconditionally: trusted reverse proxies must overwrite or sanitize external values, and servers should only parse values appended by verified internal proxies.

**Transport Layer**:

Using TCP Options to carry the client's source IP. This method works for any TCP-based protocol regardless of application layers. However, this is not standard TCP behavior and requires modifications on both endpoints: the sender must insert the IP into TCP Options, and the receiver must extract it.

Alternatively, the **Proxy Protocol** prepends a small header with client IP/Port information before establishing the application stream. Supported by reverse proxies like Nginx and HAProxy, it allows downstream application servers to parse the client IP cleanly.

**Network Layer**:

Tunneling + Direct Server Return (DSR). This works across all protocols but involves complex infrastructure setup and operational overhead, making it rare outside specialized high-throughput architectures.

### What Is the Purpose of NAT?

**NAT (Network Address Translation)** translates IP addresses between different network realms. It maps private IP addresses (used within LANs) to public IP addresses (used on the public Internet), enabling multiple LAN devices to share a single public IP.

Besides mitigating IPv4 address exhaustion, NAT conceals internal addresses and topologies. Many NAT devices filter unsolicited inbound traffic that lacks existing translation mappings. However, security derives from filtering policies rather than translation itself; NAT cannot substitute for stateful firewalls, access controls, or host hardening.

![NAT Implementing IP Address Translation](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-address-translation-f95898ff.jpg)

Related reading: [Detailed Explanation of NAT Protocol (Network Layer)](https://javaguide.cn/cs-basics/network/nat.html).

## ARP

### What Is a MAC Address?

A MAC address (**Media Access Control Address**) identifies a link-layer interface and facilitates frame delivery within a local network segment. It belongs to a network interface rather than acting as an immutable device identifier; a device can possess multiple interfaces, each with its own MAC address.

![Back of Router Showing MAC Address](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/router-back-will-indicate-mac-address-8fe99cd5.jpg)

MAC addresses are also referred to as LAN addresses, physical addresses, or hardware addresses. Unlike IP addresses used for network layer routing, MAC addresses operate primarily within the local link or broadcast domain.

> Note: Network equipment like routers also possess IP addresses. Structurally, routers connect networks (often local subnets), so their internal interfaces hold private IP addresses and utilize NAT when communicating externally.

Standard Ethernet MAC addresses use the 6-byte (48-bit) EUI-48 format. The IEEE allocates blocks (MA-L, MA-M, MA-S) to manufacturers to assign globally unique addresses. Locally administered addresses also exist and require no IEEE allocation. Furthermore, modern operating systems frequently randomize MAC addresses for privacy, meaning MAC addresses are not permanently fixed.

Lastly, `FF-FF-FF-FF-FF-FF` (all 1s) represents the Ethernet broadcast address.

### ⭐️ What Problem Does ARP Solve?

The ARP protocol (**Address Resolution Protocol**) resolves the mapping between network layer addresses (IP) and link layer addresses (MAC). When an IP packet traverses physical hops, the sender must determine the physical MAC address of the next hop. While IP addresses are logical addresses, MAC addresses are physical addresses; ARP resolves IP addresses into physical MAC addresses.

### How Does ARP Work?

[Detailed Explanation of ARP Protocol (Network Layer)](https://javaguide.cn/cs-basics/network/arp.html)

## Revision Recommendations

"Illustrated HTTP" (*Illustrated HTTP*) is highly recommended. It is concise yet thorough, valuable both for systematic understanding and interview review. During sophomore year, our course used Xie Xiren's *Computer Networks (7th Edition)*; it is quite dense and theoretical. *Computer Networking: A Top-Down Approach* is another excellent comprehensive reference.

## References

- *Illustrated HTTP*
- *Computer Networking: A Top-Down Approach (7th Edition)*
- What Is the Internet Protocol (IP)?: <https://www.cloudflare.com/zh-cn/learning/network-layer/internet-protocol/>
- Various Methods for Passing Real Source IP - Geek Time: <https://time.geekbang.org/column/article/497864>
- What Is NAT and What Are the Benefits of NAT Firewalls?: <https://community.fs.com/blog/what-is-nat-and-what-are-the-benefits-of-nat-firewalls.html>
