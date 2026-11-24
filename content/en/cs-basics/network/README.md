---
title: "Computer Network Topic: Layered Models, HTTP, HTTPS, DNS, TCP, UDP, ARP, and NAT"
description: "Computer network interview and learning roadmap, covering OSI/TCP-IP layered models, HTTP, HTTPS, DNS, TCP, UDP, ARP, NAT, network security, and common interview questions."
category: Computer Basics
tag:
  - Computer Network
  - TCP/IP
  - HTTP
sidebar: false
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Computer Network,Computer Network Interview Questions,OSI 7-Layer Model,TCP/IP,HTTP,HTTPS,DNS,TCP,UDP,ARP,NAT,Backend Interview
lang: en
sourceRef: zh-ref/cs-basics/network/README.md
---

This **Computer Network Topic** is oriented toward backend learning and interview preparation, organizing the site's network-related articles in the order of "Layered Models -> Application Layer -> Transport Layer -> Network Layer -> Security".

## Target Audience

- Backend developers systematically learning computer networking.
- Candidates preparing for campus recruitment, experienced hiring, and mid-to-large tech company network interview questions.
- Readers who can only recite knowledge points like HTTP, HTTPS, TCP, DNS, and Socket piecemeal.
- Engineers who want to connect networking knowledge with RPC, API gateways, load balancing, and system design.

## Key Learning Focus

- The core value of network layering is breaking down complex communication problems, with each layer only handling its own responsibilities.
- HTTP, HTTPS, and DNS are the most commonly used application layer concepts in backend development.
- High-frequency interview topics for TCP focus on connection management, reliable transmission, congestion control, TIME_WAIT, and Keepalive.
- Network layer knowledge such as ARP and NAT helps in understanding local area network (LAN) communication, internal/external network access, and troubleshooting.
- In interviews, you should be able to tie together protocols, connections, encryption, resolution, and transmission around a single end-to-end request.

## Recommended Reading Order

1. [Common Computer Network Interview Questions Summary (Part 1)](./other-network-questions.md) and [Common Computer Network Interview Questions Summary (Part 2)](./other-network-questions2.md): Build a list of high-frequency questions first.
2. [Detailed Explanation of OSI 7-Layer Model and TCP/IP 4-Layer Model](./osi-and-tcp-ip-model.md): Understand network layering and the responsibilities of each layer.
3. [What Exactly Happens from Entering a URL to Page Display?](./the-whole-process-of-accessing-web-pages.md): Connect DNS, TCP, HTTP, and browser processing through a complete end-to-end request link.
4. [HTTP vs HTTPS](./http-vs-https.md), [RSA and ECDHE in HTTPS Handshake](./https-rsa-vs-ecdhe.md), [Common HTTP Status Codes Summary](./http-status-codes.md): Complement high-frequency application layer questions.
5. [TCP Three-Way Handshake and Four-Way Wave](./tcp-connection-and-disconnection.md), [TCP Transmission Reliability Guarantee](./tcp-reliability-guarantee.md), [Detailed Explanation of TCP TIME_WAIT](./tcp-time-wait.md): Focus on conquering TCP.

## Core Articles

### Overview and Fundamentals

- [Common Computer Network Interview Questions Summary (Part 1)](./other-network-questions.md): Covers basic questions such as network models, HTTP, HTTPS, and DNS.
- [Common Computer Network Interview Questions Summary (Part 2)](./other-network-questions2.md): Continues with high-frequency questions regarding TCP, UDP, Socket, network security, etc.
- [Detailed Explanation of OSI 7-Layer Model and TCP/IP 4-Layer Model](./osi-and-tcp-ip-model.md): Understand network models, protocol layering, and the data encapsulation process.
- [What Exactly Happens from Entering a URL to Page Display?](./the-whole-process-of-accessing-web-pages.md): Connects common networking knowledge points through a single request.

### Application Layer

- [Common Application Layer Protocols Summary](./application-layer-protocol.md): Organizes protocols like HTTP, WebSocket, SMTP, FTP, SSH, DNS, etc.
- [HTTP vs HTTPS](./http-vs-https.md): Understand HTTPS encryption, certificates, authentication, and integrity protection.
- [RSA and ECDHE in HTTPS Handshake](./https-rsa-vs-ecdhe.md): Distinguish between different key exchange mechanisms and forward secrecy.
- [HTTP 1.0 vs HTTP 1.1](./http1.0-vs-http1.1.md): Understand differences such as persistent connections, caching, Host header, etc.
- [Common HTTP Status Codes Summary](./http-status-codes.md): Master the semantics and use cases of status codes from 1xx to 5xx.
- [Detailed Explanation of DNS (Domain Name System)](./dns.md): Understand domain name resolution, recursive queries, iterative queries, and caching.
- [Why Do We Still Need RPC When We Already Have HTTP?](./http-vs-rpc.md): Clarify the hierarchical relationship between HTTP and RPC.

### Transport Layer, Network Layer, and Security

- [TCP Three-Way Handshake and Four-Way Wave](./tcp-connection-and-disconnection.md): Master connection establishment, termination, and key states.
- [TCP Transmission Reliability Guarantee](./tcp-reliability-guarantee.md): Understand sequence numbers, acknowledgments, retransmission, flow control, and congestion control.
- [Detailed Explanation of TCP TIME_WAIT](./tcp-time-wait.md): Understand the role, impact, and optimization boundaries of TIME_WAIT.
- [What Is the Difference Between TCP Keepalive and HTTP Keep-Alive?](./tcp-keepalive-vs-http-keepalive.md): Distinguish between transport layer keepalive and application layer persistent connections.
- [Why Is TCP Byte-Stream Oriented While UDP Is Datagram Oriented?](./tcp-byte-stream-udp-datagram.md): Understand the differences in data boundaries between TCP and UDP.
- [Detailed Explanation of ARP Protocol](./arp.md), [Detailed Explanation of NAT Protocol](./nat.md), [Summary of Common Network Attack Techniques](./network-attack-means.md): Complement network layer and security fundamentals.

## High-Frequency Questions

- What is the difference between the OSI 7-layer model and the TCP/IP 4-layer model?
- What happens in the network layer from entering a URL to the page being displayed?
- What is the difference between HTTP and HTTPS? What is the HTTPS handshake process?
- What are the core differences between HTTP 1.0, 1.1, and 2.0?
- What do common HTTP status codes indicate?
- Why can't the TCP three-way handshake and four-way wave be simplified?
- How does TCP ensure reliable transmission? What is the difference between congestion control and flow control?
- Why does TIME_WAIT exist? How do you troubleshoot a large number of TIME_WAIT sockets?
- What is the difference between TCP Keepalive and HTTP Keep-Alive?
- What problems do DNS, ARP, and NAT solve respectively?

## Related Topics

- [Computer Basics Knowledge System](../)
- [Operating System Topic](../operating-system/)
- [Distributed System Knowledge System](../../distributed-system/)
- [RPC Topic](../../distributed-system/rpc/)
- [High-Performance System Knowledge System](../../high-performance/)
