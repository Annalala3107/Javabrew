---
title: "Common Application Layer Protocols Summary: HTTP, WebSocket, SMTP, FTP, SSH, DNS, and More"
description: "Summarizes core concepts and typical scenarios of common application layer protocols, focusing on contrasting the communication models and capability boundaries of HTTP and WebSocket."
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: Application Layer Protocols,HTTP,WebSocket,DNS,SMTP,FTP,Features,Scenarios
lang: en
sourceRef: zh-ref/cs-basics/network/application-layer-protocol.md
---

There are many application layer protocols—HTTP, WebSocket, SMTP, POP3/IMAP, FTP, Telnet, SSH, RTP, and DNS frequently appear together.

You do not need to memorize every implementation detail for each of these protocols, but if you merely memorize protocol names, it is easy to conflate their purposes, underlying transport protocols, and typical application scenarios.

This article primarily addresses several questions:

1. What problems do protocols such as HTTP, WebSocket, SMTP, FTP, SSH, and DNS solve respectively?
2. Are these protocols typically based on TCP or UDP, and what are their common ports and usage scenarios?
3. Which protocols are most easily confused, and how should they be distinguished in interviews and practical engineering?

## HTTP: Hypertext Transfer Protocol

The **Hypertext Transfer Protocol (HTTP)** is an application layer protocol used for transferring hypertext and multimedia content. Its most common use case is communication between web browsers and web servers.

![HTTP: Hypertext Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

When we access a web page in a browser, the browser sends an HTTP request to the server, and the server processes it and returns an HTTP response. Resources on the page such as HTML, CSS, JavaScript, images, and videos are largely loaded via HTTP.

HTTP uses a client-server model: the client sends an HTTP Request, and the server returns an HTTP Response, as illustrated below.

![HTTP Protocol](/media/jg/ext/oss.javaguide.cn/github/javaguide/450px-HTTP-Header-7b3440ab.png)

It should be noted that HTTP is an application layer protocol and is not itself directly responsible for reliable transport. The underlying transport dependencies differ across HTTP versions:

- **HTTP/1.1**: Based on TCP.
- **HTTP/2**: Typically also based on TCP, but introduces multiplexing, header compression, and other capabilities.
- **HTTP/3**: Based on QUIC, while QUIC operates over UDP, primarily aimed at reducing connection establishment overhead and alleviating head-of-line (HoL) blocking issues inherent in TCP.

In HTTP/1.1, Keep-Alive is enabled by default—namely persistent connections. This allows a single TCP connection to be reused across multiple HTTP requests, avoiding reconnecting a TCP session for every single request and thus saving the overhead of the three-way handshake.

From the perspective of connection reuse, HTTP/1.1 Keep-Alive addresses the challenge of "reusing a single TCP connection for multiple requests," but request processing on that same connection can still suffer from head-of-line blocking.

HTTP/2 introduces multiplexing over a single TCP connection, allowing multiple requests and responses to be transmitted concurrently in parallel, reducing head-of-line blocking at the HTTP level. However, because the underlying transport remains TCP, if a single TCP packet is dropped, all streams on that entire connection are still impacted.

HTTP/3 is built on QUIC, which implements multiplexing and reliable delivery directly on top of UDP. Because individual streams are completely independent, it alleviates transport-layer head-of-line blocking.

Additionally, HTTP is a **stateless protocol**. The server does not inherently remember "who sent the previous request or what state it was in." Therefore, in practical web development, mechanisms such as Cookies, Sessions, and Tokens (including JWTs) are typically employed to maintain user authentication and session states.

## WebSocket: Full-Duplex Communication Protocol

**WebSocket** is a full-duplex communication protocol running over a TCP connection, where both client and server can send and receive data concurrently over the same connection.

![WebSocket: Full-Duplex Communication Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/websocket-overview-464543a7.png)

Its hallmark characteristic is: **once the connection is established, the server can also proactively push messages to the client**. This elegantly compensates for the shortcomings of the traditional HTTP request-response model in real-time communication scenarios.

The WebSocket protocol emerged in 2008 and became an international standard in 2011; modern mainstream browsers support it natively. WebSocket is not limited to browser environments; numerous programming languages, frameworks, and backend servers offer first-class support.

WebSocket remains essentially an application layer protocol. It typically initiates via an HTTP request performing a protocol upgrade handshake. Once the upgrade succeeds, a persistent connection is established between client and server, enabling subsequent bidirectional data transfers.

![WebSocket Schematic](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

Common use cases for WebSocket include:

- Live video bullet comments (danmaku)
- Real-time message push (for details, see [Detailed Explanation of Web Real-time Message Push](https://javaguide.cn/system-design/web-real-time-message-push.html))
- Real-time multiplayer online games
- Collaborative document editing
- Online customer support / instant messaging chat
- Real-time ticker updates for financial markets, sports scores, etc.

The operational workflow of WebSocket can be summarized in the following steps:

1. The client sends an HTTP request to the server containing headers such as `Upgrade: websocket`, `Connection: Upgrade`, and `Sec-WebSocket-Key`, indicating a desire to upgrade the current connection to WebSocket.
2. Upon receiving the request, if the server supports WebSocket, it returns HTTP status code `101 Switching Protocols` along with response headers including `Upgrade: websocket`, `Connection: Upgrade`, and `Sec-WebSocket-Accept`, signifying a successful protocol upgrade.
3. Once upgraded, a WebSocket connection is established between client and server, allowing bidirectional communication.
4. WebSocket data is transmitted in units called Frames. A complete message may be split across multiple frames during transmission, and the receiving end reassembles them into the original message.
5. Either the client or the server can initiate a close frame; upon receipt, the peer responds with its own close frame, and both sides subsequently close the TCP connection.

Furthermore, WebSocket connections typically incorporate a **heartbeat mechanism**. For example, periodically sending Ping/Pong frames or dispatching application-level heartbeat packets helps verify that the connection remains alive and prevents silent connection drops or half-open deadlocks.

## SMTP: Simple Mail Transfer Protocol

The **Simple Mail Transfer Protocol (SMTP)** is a TCP-based application layer protocol primarily utilized for **sending and relaying electronic mail**.

![SMTP: Simple Mail Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/smtp-overview-7ea98c2a.png)

A critical point of confusion should be clarified here:

**SMTP handles sending emails and relaying them between mail servers; POP3/IMAP handles users retrieving emails from their mailbox server.**

In other words, the journey from your mail server to the recipient's mail server is typically carried out via SMTP; meanwhile, users checking inbox messages via an email client rely on POP3 or IMAP.

![SMTP Protocol](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/what-is-smtp-e50cec39.png)

Common SMTP ports include 25, 465, and 587, each serving distinct roles:

| Port | Common Purpose | Description |
| ---- | -------------- | ----------- |
| 25 | Relaying mail between mail servers | Primarily for MTA-to-MTA delivery. Many cloud providers and ISPs block outbound port 25 to curb spam |
| 587 | Client mail submission | The standard Message Submission port, typically coupled with STARTTLS and user authentication |
| 465 | Mail submission over implicit TLS | Establishes a TLS-encrypted channel immediately upon connection; still widely supported by mail providers |

### Email Transmission Process

Suppose my email is `<dabai@cszhinan.com>`, and I want to send an email to `<xiaoma@qq.com>`. The overall process can be understood as follows:

1. I compose the email using an email client or webmail interface.
2. The mail client submits the email to the mail server associated with `cszhinan.com` via SMTP.
3. The sender's mail server queries the MX records for the recipient domain `qq.com` to locate the destination mail server.
4. The sender's mail server delivers the email to QQ Mail servers using SMTP.
5. The QQ Mail server receives and stores the email.
6. The user `<xiaoma@qq.com>` reads the email from the QQ Mail server using POP3 or IMAP.

### How to Check Whether an Email Address Truly Exists?

In certain scenarios, you may want to verify whether a particular email address actually exists. A common technique involves probing via SMTP:

1. Query the MX records for the target email domain to identify the mail server.
2. Attempt to open a connection to the target mail server.
3. Use SMTP command sequences to simulate the delivery workflow.
4. Infer whether the mailbox likely exists based on server responses.

However, this method is not always dependable.

To guard against spam, credential stuffing, and directory harvesting attacks, many mail service providers disable email existence probing or intentionally return ambiguous responses. Consequently, SMTP probing can only serve as a heuristic reference rather than definitive proof of an email's existence.

Here are several recommended online tools for email validity verification:

1. <https://verify-email.org/>
2. <http://tool.chacuo.net/mailverify>
3. <https://www.emailcamel.com/>

## POP3 / IMAP: Mail Retrieval Protocols

**Both POP3 and IMAP are protocols designed for receiving email**, and both are TCP-based application layer protocols.

![POP3/IMAP: Mail Retrieval Protocols Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/pop3-imap-overview-5174d5ab.png)

Note once again: **SMTP primarily manages mail sending and relaying, whereas POP3/IMAP enables users to retrieve mail from the mailbox server.**

POP3 is architecturally simple; its typical workflow involves downloading emails from the server to local storage. It is suitable for single-device access, but synchronizing across multiple devices is cumbersome.

IMAP is a more modern and widely adopted mail retrieval protocol. It manages emails directly on the server, synchronizing state flags such as read/unread, deleted, flagged, and folder structures. Consequently, if you inspect the same inbox across phone, laptop, and webmail, IMAP delivers a vastly superior experience.

Here is a quick comparison:

| Protocol | Primary Purpose | Key Features |
| -------- | --------------- | ------------ |
| POP3 | Receiving mail | Geared towards local downloads; weak multi-device synchronization |
| IMAP | Receiving and managing mail | Supports multi-device sync, server search, flags, and folders |
| SMTP | Sending and relaying mail | Responsible for the mail delivery and relay pipeline |

## FTP: File Transfer Protocol

**FTP (File Transfer Protocol)** is a TCP-based application layer protocol designed to transfer files between clients and servers.

![FTP: File Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ftp-overview-6012bf6e.png)

FTP follows a client-server model. A distinctive characteristic of FTP is that it typically maintains two separate TCP connections:

> Unlike many application protocols, FTP uses two connections between client and server:
>
> 1. **Control Connection**: Used for passing commands and responses, such as logging in, switching directories, and deleting files.
> 2. **Data Connection**: Used for the actual transfer of file content or directory listings.

This separation of control commands from data payloads prevents commands and bulky file data from interfering with each other.

![FTP Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ftp-d1445b2d.png)

FTP supports two distinct data connection modes—Active Mode (PORT) and Passive Mode (PASV):

- **Active Mode**: The client informs the server over the control connection of which port it is listening on, and the server actively connects to this client port to establish the data connection. Because the server initiates the connection to the client, if the client sits behind a NAT device or firewall, the connection often fails.
- **Passive Mode**: The client requests that the server open a listening data port, and the client actively initiates the connection to that server port. Because the connection direction flows from client to server, it traverses NATs and firewalls much more cleanly, making passive mode the preferred choice in production environments.

Note: Plain FTP is inherently insecure. It does not encrypt transmission by default; usernames, passwords, and file contents can be eavesdropped on or altered in transit.

Therefore, when handling sensitive files, avoid plain FTP and choose:

- **SFTP**: Secure File Transfer Protocol built on SSH.
- **FTPS**: FTP secured with TLS/SSL encryption.

While SFTP and FTPS have similar-sounding acronyms, they are completely different protocols: SFTP runs on SSH, while FTPS is FTP over TLS.

## Telnet: Remote Login Protocol

**Telnet** is a TCP-based remote terminal protocol running by default on port 23. It enables users to log in to remote hosts through a terminal interface and execute shell commands.

The most fatal vulnerability of Telnet is **plaintext transmission**.

![Telnet: Remote Login Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/telnet-overview-be34f822.png)

Usernames, passwords, executed commands, and returned output are transmitted without encryption. Any attacker capable of sniffing network traffic can effortlessly harvest sensitive information.

![Telnet Eavesdropping Vulnerability](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/Telnet_is_vulnerable_to_eavesdropping-2-40e71d55.png)

Consequently, Telnet is virtually never deployed for real-world server administration today. Modern production environments have replaced Telnet with SSH.

## SSH: Secure Shell Protocol

**SSH (Secure Shell)** is a secure networking protocol running over TCP with default port 22. Through encryption and cryptographic authentication mechanisms, it delivers security guarantees for remote logins, command execution, and file transfers.

![SSH: Secure Network Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ssh-overview-77dd12b2.png)

The quintessential usage of SSH is logging into a remote server:

```bash
ssh user@server_ip
```

Beyond remote terminal login, SSH also powers:

- Remote command execution
- Port forwarding (tunneling)
- SOCKS proxying
- X11 forwarding
- Secure file transfer via SFTP or SCP

SSH operates under a client-server architecture. The SSH server listens for client connections, while the SSH client initiates them. Both parties negotiate cryptographic cipher suites and establish symmetric session keys via key exchange. All subsequent communication is thoroughly encrypted.

![SSH Client-Server Model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ssh-client-server-f6cd4a79.png)

Crucially, SSH security stems not only from encrypted channels, but also from its authentication mechanisms. Common authentication methods include:

- Password authentication
- Public key authentication
- Multi-factor authentication (MFA)

In production environments, public key authentication is strongly recommended, accompanied by disabling password authentication.

## RTP: Real-Time Transport Protocol

**RTP (Real-time Transport Protocol)** is designed for carrying audio, video, and other real-time media streams. It typically runs on top of UDP. In the TCP/IP architectural hierarchy, the layer directly above UDP is the application layer; thus, RTP is formally categorized as an application layer protocol. However, its responsibilities (sequence numbering, timestamps, media synchronization, quality feedback) are conceptually closer to transport-layer facilities, and RFC 3550 notes that it is "typically integrated into application processing rather than implemented as an isolated layer."

![RTP: Real-Time Transport Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/rtp-overview-87c6004f.png)

RTP is predominantly employed in voice calling, video conferencing, live streaming, and interactive media. It does not natively guarantee reliable packet delivery or on-time arrival; instead, it uses sequence numbers and timestamps to help the receiver perform reordering, packet loss detection, jitter buffering, and playback synchronization. While RTP over TCP encapsulation exists (e.g., RFC 4571), it is primarily used for firewall traversal or legacy compatibility; UDP remains the primary foundation for real-time audio and video.

RTP typically works in tandem with RTCP:

- **RTP**: Carries real-time multimedia payload data.
- **RTCP (RTP Control Protocol)**: Carries control metadata and statistical feedback, including packet loss rate, round-trip delay, and jitter.

In WebRTC, RTP/RTCP serves as the foundational substrate for real-time audio/video delivery. WebRTC further integrates SRTP encryption, congestion control, jitter buffers, NACK (Negative Acknowledgment), and FEC (Forward Error Correction) to elevate transmission quality and security.

Note that RTP itself does not handle resource reservation or guarantee QoS. It supplies core mechanisms for real-time streaming, while actual quality guarantees require cooperation with upper-layer application logic.

## DNS: Domain Name System

The **Domain Name System (DNS)** resolves mappings between human-readable domain names and numerical IP addresses.

![DNS: Domain Name System Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/dns-overview-4619e349.png)

When we access a website, we typically enter a domain name, such as:

```text
www.javaguide.cn
```

However, network routing fundamentally operates on IP addresses. The responsibility of DNS is translating this domain name into its corresponding IP address.

DNS typically uses UDP with default port 53. UDP is preferred because the vast majority of DNS queries and responses are small, eliminating TCP handshake round-trips and ensuring rapid lookup.

In early DNS specifications, UDP DNS messages were restricted to 512 bytes (excluding IP and UDP headers). If a response exceeded this boundary, the server flagged the response as truncated (TC bit set), prompting the client to retry over TCP.

Later, EDNS0 extended the payload size limit for DNS over UDP, enabling larger responses such as DNSSEC records. However, if the response exceeds the negotiated UDP buffer size, or during zone transfers (synchronizing entire zones between DNS servers, which normal queries virtually never invoke), TCP is still used.

Modern networking has introduced enhanced security options, notably:

- **DoH (DNS over HTTPS)**
- **DoT (DNS over TLS)**

Both aim to mitigate eavesdropping and tampering stemming from legacy plaintext DNS queries.

## Summary of Common Application Layer Protocol Ports

| Protocol | Default Port | Transport Layer Protocol | Primary Purpose |
| -------- | -----------: | ------------------------ | --------------- |
| HTTP | 80 | TCP | Web page access |
| HTTPS | 443 | TCP / QUIC | Encrypted web access |
| WebSocket | 80 / 443 | TCP | Bidirectional real-time communication |
| SMTP | 25 / 465 / 587 | TCP | Mail sending and relaying |
| POP3 | 110 / 995 | TCP | Mail retrieval |
| IMAP | 143 / 993 | TCP | Mail retrieval and synchronization |
| FTP | 20 / 21 | TCP | File transfer |
| SSH | 22 | TCP | Secure remote login and file transfer |
| Telnet | 23 | TCP | Plaintext remote login |
| DNS | 53 | UDP / TCP | Domain name resolution |
| RTP | Dynamic (even port); RTCP uses adjacent odd port | Primarily UDP | Real-time audio/video streaming |

HTTPS is listed here with TCP / QUIC because traditional HTTPS uses TLS over TCP, while HTTP/3 operates over QUIC.

## Summary

This article provides a fast-paced survey of common application layer protocols without delving deeply into packet formats or niche implementation mechanics.

When reviewing, remember these frequently confused points:

- HTTP is an application layer protocol; HTTP/1.1 and HTTP/2 generally run over TCP, whereas HTTP/3 runs over QUIC.
- HTTP/1.1 reuses TCP connections via Keep-Alive; HTTP/2 multiplexes streams over a single TCP connection; HTTP/3 leverages QUIC to alleviate TCP head-of-line blocking.
- WebSocket upgrades an initial HTTP connection to establish full-duplex communication.
- SMTP is responsible for sending mail and relaying between servers; POP3/IMAP is responsible for client email retrieval.
- Common SMTP ports include 25, 587, and 465, corresponding to server relay, client submission, and implicit TLS submission respectively.
- FTP features Active and Passive modes; Passive mode is more prevalent in production environments.
- FTP, SFTP, and FTPS are distinct: FTP transmits in cleartext, SFTP runs over SSH, and FTPS runs over TLS.
- Telnet uses cleartext and is unsuitable for production administration; SSH is the modern standard.
- DNS primarily relies on UDP, but switches to TCP when responses are truncated or during zone transfers.
- RTP operates on UDP, categorized under the application layer yet behaving like a transport facility; RTP uses even ports while companion RTCP uses adjacent odd ports.

## References

- *Computer Networking: A Top-Down Approach* (7th Edition)
- Introduction to RTP Protocol: <https://mthli.xyz/rtp-introduction/>
- RFC 6455: The WebSocket Protocol
- RFC 9110: HTTP Semantics
- RFC 8446: TLS 1.3
- RFC 9000: QUIC
- RFC 3550: RTP: A Transport Protocol for Real-Time Applications
- RFC 4571: Framing Real-time Transport Protocol (RTP) and RTP Control Protocol (RTCP) Packets over Connection-Oriented Transport
- RFC 6891: Extension Mechanisms for DNS (EDNS(0))
