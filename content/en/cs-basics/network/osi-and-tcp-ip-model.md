---
title: Detailed Explanation of the OSI 7-Layer Model and TCP/IP 4-Layer Model
description: In-depth analysis of the OSI and TCP/IP layered architectures and layer responsibilities, contrasting their differences and engineering tradeoffs through history and real-world practice.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: OSI 7-Layer,TCP/IP 4-Layer,Layered Model,Layer Responsibilities,Protocol Stack,Comparison
lang: en
sourceRef: zh-ref/cs-basics/network/osi-and-tcp-ip-model.md
---

Network layering is the very first roadmap when learning computer networking. Without this map, concepts like HTTP, TCP, IP, Ethernet, and DNS easily get jumbled together, making it difficult to discern who depends on whom and who handles what.

The two prevailing layered architectures are the OSI 7-layer reference model and the TCP/IP 4-layer model. The former is well suited for building a conceptual framework, whereas the latter reflects how the internet is actually implemented in practice.

This article primarily answers several questions:

1. What does each layer of the OSI 7-layer model do?
2. How do the TCP/IP 4-layer model and the OSI 7-layer model correspond to each other?
3. Why was the OSI model theoretically complete, yet failed to become the dominant implementation of the internet?
4. When studying a specific network protocol, why is it essential to know which layer it belongs to first?

## The OSI 7-Layer Model

The **OSI 7-layer model** (Open Systems Interconnection) is a conceptual networking framework proposed by the International Organization for Standardization (ISO). Its general architecture and the functions provided by each layer are illustrated below:

![OSI 7-Layer Model Functional Division by Layer](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-7-model-955bfdf5.png)

Each layer focuses on a specific set of responsibilities and relies on the services offered by the layer immediately below it. For instance, the transport layer relies on the routing and addressing capabilities of the network layer to determine where the data must be delivered.

**The OSI 7-layer architecture is conceptually clear and theoretically thorough; however, it is overly complex, impractical, and certain functions are redundantly repeated across multiple layers.**

While the diagram above may seem abstract, here is a more vivid visual found on an overseas website that illustrates the concept exceptionally well:

![OSI 7-layer model illustration 2](/media/jg/ext/oss.javaguide.cn/github/javaguide/osi2-8a5da370.png)

**Since the OSI 7-layer model was so sophisticated, why was it defeated by the TCP/IP 4-layer model?**

Indeed, the OSI model was heavily backed by major corporations and national governments at the time. Against such a formidable backdrop, why did it fail? The primary reasons can be summarized as follows:

1. The OSI committee experts lacked practical engineering experience and commercial incentives when drafting the standards.
2. The OSI protocol implementations were excessively convoluted and exhibited poor runtime performance.
3. The standardization lifecycle of OSI was far too protracted. As a result, hardware and equipment compliant with OSI standards could not reach the market in time. (By the early 1990s, when the complete suite of OSI standards was finally formalized, the TCP/IP-based Internet was already operating successfully across a substantial portion of the globe.)
4. The partitioning of layers in OSI was somewhat suboptimal, resulting in certain features being duplicated across several different layers.

Although the OSI 7-layer model did not succeed in commercial deployment, it laid an outstanding theoretical groundwork. To develop a robust understanding of network layering, studying the OSI model remains indispensable.

Finally, here is an insightful summary diagram showing the layer mapping of the OSI 7-layer model:

![Layer correspondence between OSI 7-layer model and TCP/IP 4-layer model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-model-detail-5ca90634.png)

## The TCP/IP 4-Layer Model

The **TCP/IP 4-layer model** is the networking suite widely adopted across modern networking. We can regard the TCP/IP model as a streamlined version of the OSI 7-layer model, consisting of the following four layers:

1. Application Layer
2. Transport Layer
3. Network Layer
4. Network Interface Layer

It should be noted that the TCP/IP 4-layer model and the OSI 7-layer model cannot be mapped onto one another with absolute mathematical precision, but their general correspondence is depicted below:

![TCP/IP 4-layer model layer responsibilities](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

### Application Layer

**The application layer sits directly above the transport layer. Its primary role is facilitating information exchange between user applications on communicating terminal devices, defining the syntax and semantics of the exchanged messages, which are then handed down to the transport layer.** The data unit exchanged at the application layer is referred to as a message.

![Collaboration across network layers during a single data transmission](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-five-layer-sample-diagram-7f0fb78b.png)

Application layer protocols define network communication rules, and distinct network applications demand distinct application protocols. Numerous application protocols exist on the internet, such as HTTP powering web applications and SMTP handling email delivery.

**Common Application Layer Protocols**:

![Common application layer protocols](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/application-layer-protocol-3c7d8468.png)

- **HTTP (Hypertext Transfer Protocol)**: Operates over TCP. It is designed for transmitting hypertext and rich multimedia content, primarily facilitating communication between web browsers and web servers. Whenever you navigate the web via a browser, pages are retrieved using HTTP requests.
- **SMTP (Simple Mail Transfer Protocol)**: Operates over TCP. It is used for dispatching electronic mail. Note ⚠️: SMTP handles outgoing email transmission only, not retrieval. Retrieving emails from a mail server requires POP3 or IMAP.
- **POP3 / IMAP (Mail Retrieval Protocols)**: Operate over TCP. Both protocols handle receiving emails. IMAP is newer, more robust, and more capable than POP3. IMAP provides advanced features such as server-side search, flagging, tagging, folder organization, and synchronizes mailbox status across multiple client devices. Virtually all modern email clients and servers support IMAP.
- **FTP (File Transfer Protocol)**: Operates over TCP. It transfers files between hosts regardless of operating systems or local filesystem storage specifics. Note ⚠️: FTP is inherently insecure because credentials and data are transferred in cleartext without encryption. Using secure alternatives such as SFTP is strongly advised when transmitting sensitive data.
- **Telnet (Remote Terminal Protocol)**: Operates over TCP. It enables users to establish terminal sessions on remote servers. A critical drawback of Telnet is that all traffic (including usernames and passwords) travels unencrypted in plaintext, posing severe security liabilities. Consequently, Telnet has been almost universally replaced by the secure SSH protocol.
- **SSH (Secure Shell Protocol)**: Operates over TCP. It employs strong encryption and cryptographic authentication to provide secure remote terminal sessions, command execution, and file transfers.
- **RTP (Real-time Transport Protocol)**: Typically runs over UDP, though it can also be carried over TCP. It delivers end-to-end transport functions for real-time streaming data, but does not handle resource reservation or ensure QoS guarantees (functions implemented by protocols like WebRTC).
- **DNS (Domain Name System)**: Typically runs over UDP (port 53) to resolve mappings between human-readable domain names and numerical IP addresses. When query responses exceed size limits or during zone transfers, it switches to TCP.

For an extensive walkthrough of these protocols, refer to [Common Application Layer Protocols Summary](./application-layer-protocol.md).

### Transport Layer

**The principal responsibility of the transport layer is to provide general-purpose end-to-end communication services between running application processes across two host devices.** Application processes leverage this service to exchange application-layer messages. "General-purpose" indicates that the transport layer is not tailored to a single specific application, but can support numerous diverse applications concurrently.

**Common Transport Layer Protocols**:

![Common transport layer protocols](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/transport-layer-protocol-77ea5f52.png)

- **TCP (Transmission Control Protocol)**: Delivers a **connection-oriented**, **reliable** byte-stream transport service.
- **UDP (User Datagram Protocol)**: Delivers a **connectionless**, **best-effort** packet delivery service (without guaranteeing packet arrival or ordering), characterized by minimal overhead and high efficiency.

### Network Layer

**The network layer is tasked with delivering communication services across hosts situated on packet-switching networks.** When transmitting data, the network layer encapsulates transport-layer segments or user datagrams into packets (often referred to as IP datagrams or simply datagrams in TCP/IP architecture) for transmission.

⚠️ Note: **Do not confuse transport-layer "UDP user datagrams" with network-layer "IP datagrams"**.

**Another vital responsibility of the network layer is routing—selecting appropriate paths so that packets passed down from the source host's transport layer navigate intermediate routers to successfully reach the destination host.**

It is worth emphasizing that the term "network" in "network layer" does not refer to a specific physical network, but designates the third layer in the computer networking architectural hierarchy.

The internet is formed by interconnecting a vast array of heterogeneous physical networks through routers. The network layer protocols governing the internet are the connectionless Internet Protocol (IP) alongside assorted routing protocols; hence, this layer is also frequently designated as the **Internet layer** or **IP layer**.

**Common Network Layer Protocols**:

![Common network layer protocols](/media/jg/local/cs-basics/network/images/network-model/nerwork-layer-protocol-753345.png)

- **IP (Internet Protocol)**: One of the central pillars of the TCP/IP suite. It defines packet structure, addressing schemes, and packet routing so that data traverses interconnected networks to its proper destination. Currently, two major IP versions are deployed: legacy IPv4 and modern IPv6. Both coexist today, with IPv6 engineered to eventually supersede IPv4.
- **ARP (Address Resolution Protocol)**: Bridges the translation between network layer logical addresses and link layer hardware addresses. When an IP datagram moves physically across a network hop, it must ascertain the physical address of the next hop. While IP addresses are logical, MAC addresses are physical; ARP resolves logical IP addresses into corresponding hardware MAC addresses.
- **ICMP (Internet Control Message Protocol)**: Transmits operational diagnostics, network status indicators, and error reporting. Frequently used for network troubleshooting; for instance, the Ping utility relies on ICMP to evaluate end-to-end network reachability.
- **NAT (Network Address Translation)**: Translates private internal IP addresses to public external IP addresses when traversing border routers. Inside a private local subnet (LAN), hosts share a private IP address pool. To reach the wider Internet across the WAN, a globally routable IP address is needed to represent that LAN.
- **OSPF (Open Shortest Path First)**: An Interior Gateway Protocol (IGP) and a prevalent dynamic routing protocol based on the link-state algorithm. It computes shortest paths by factoring in link metrics such as bandwidth and transmission delay.
- **RIP (Routing Information Protocol)**: An older Interior Gateway Protocol based on the distance-vector routing algorithm. It relies on simple hop counts as its metric, selecting the route with the fewest intermediate hops.
- **BGP (Border Gateway Protocol)**: An exterior routing protocol designed to exchange Network Layer Reachability Information (NLRI) across autonomous routing domains, offering exceptional scalability and policy routing flexibility.

### Network Interface Layer

The network interface layer can be viewed as the amalgamation of the OSI data link layer and physical layer.

1. The data link layer (often simply called the link layer): Since end-to-end packet transmission proceeds across a sequence of individual physical links, **the role of the data link layer is to encapsulate network-layer IP datagrams into frames and convey these frames across adjacent network nodes. Each frame incorporates the payload data along with essential framing control overhead (such as synchronization bits, physical addressing, and error detection checksums).**
2. **The physical layer's role is to ensure the transparent transmission of raw bit streams across interconnected network hardware, abstracting away the discrepancies of physical transmission media and hardware interfaces.**

The key capabilities and protocols of the network interface layer are outlined below:

![Network interface layer key capabilities and protocols](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-interface-layer-protocol-20c88ddb.png)

### Summary

Here is a concise overview of the protocols and key technologies comprising each layer:

![TCP/IP layer protocol overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-protocol-overview-09ff1718.png)

**Application Layer Protocols**:

- HTTP (Hypertext Transfer Protocol)
- SMTP (Simple Mail Transfer Protocol)
- POP3 / IMAP (Mail Retrieval Protocols)
- FTP (File Transfer Protocol)
- Telnet (Remote Terminal Protocol)
- SSH (Secure Shell Protocol)
- RTP (Real-time Transport Protocol)
- DNS (Domain Name System)
- ...

**Transport Layer Protocols**:

- TCP Protocol
  - Segment structure
  - Reliable data transfer
  - Flow control
  - Congestion control
- UDP Protocol
  - Datagram structure
  - RDT (Reliable Data Transfer)

**Network Layer Protocols**:

- IP (Internet Protocol)
- ARP (Address Resolution Protocol)
- ICMP Protocol (Control message protocol, used to send control messages)
- NAT (Network Address Translation)
- OSPF (Open Shortest Path First)
- RIP (Routing Information Protocol)
- BGP (Border Gateway Protocol)
- ...

**Network Interface Layer**:

- Error detection techniques
- Multiple access protocols (channel multiplexing techniques)
- CSMA/CD protocol
- MAC protocol
- Ethernet technology
- ...

## Why Network Layering Matters

To conclude this discussion, let us address the fundamental question: "Why do computer networks need a layered architecture?"

To understand layering, consider how we structure enterprise software applications. We typically divide our application code into distinct layers based on separation of concerns (more complex systems involve even finer layers):

1. Repository (Database operations)
2. Service (Business logic)
3. Controller (Client/server data interaction)

**Complex systems necessitate layering because each layer must concentrate exclusively on a single category of concerns. The rationale behind network layering is identical: each layer focuses on one cohesive responsibility.**

More specifically, network layering provides three core advantages:

1. **Layer Independence**: Layers remain independent of one another. A given layer does not need to know how other layers are implemented internally; it only needs to know how to invoke the capabilities provided by the layer beneath it (analogous to clean API invocations). **This matches the rationale behind architectural layering in software development.**
2. **Enhanced Architectural Flexibility**: Each layer can be implemented using the most suitable technologies, provided the functions it offers and the contracts of its exposed interfaces remain unchanged. **This directly reflects the principles of high cohesion and low coupling that guide modern software engineering.**
3. **Decomposing Grand Problems into Manageable Units**: Layering decomposes an overwhelmingly complex communication challenge into discrete, well-bounded, and simpler sub-problems. This makes designing, implementing, and standardizing complex networking systems significantly easier. **This parallels how software engineers break large business systems into modular components with well-defined boundaries and contracts.**

A renowned computer science adage famously captures this philosophy:

> All problems in computer science can be solved by another level of indirection, and the entire computer architecture hierarchy from top to bottom is engineered around strict layering.

## References

- TCP/IP model vs OSI model: <https://fiberbit.com.tw/tcpip-model-vs-osi-model/>
- Data Encapsulation and the TCP/IP Protocol Stack: <https://docs.oracle.com/cd/E19683-01/806-4075/ipov-32/index.html>
