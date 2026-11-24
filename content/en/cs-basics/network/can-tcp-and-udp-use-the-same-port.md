---
title: Can TCP and UDP Use the Same Port Number?
description: Explains whether TCP and UDP can use the same port number, covering port namespaces, socket binding rules, and real-world examples.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: TCP,UDP,Port,Socket,bind,DNS 53,HTTP3,QUIC,UDP 443
lang: en
sourceRef: zh-ref/cs-basics/network/can-tcp-and-udp-use-the-same-port.md
---

A question that frequently surfaces in technical interviews: On a single machine, if TCP is already listening on port `8080`, can UDP also listen on port `8080`?

Bottom line: **Yes. The port binding namespaces for TCP and UDP are demarcated by their respective transport layer protocols; the same numerical port does not conflict across different protocols.** One process can listen on `TCP/8080` while another process listens on `UDP/8080`; the OS kernel dispatches incoming packets based on their protocol stack.

## Who Actually Governs Port Numbers?

A port number is a numerical identifier used at the transport layer to differentiate application processes. The IP address identifies the host, while the port number identifies the specific application running on that host.

Both TCP and UDP packet headers contain 16-bit Source Port and Destination Port fields, yielding a port range of `0~65535`. Note that port `0` carries special semantics in socket APIs (typically instructing the OS to allocate an ephemeral port automatically) and is not used as a conventional listening port for server applications.

**Sharing the same numerical range does not mean binding to the same object.** In service registration, socket listening, packet captures, firewalls, and cloud security groups, transport protocols and ports must always be evaluated in tandem: for instance, `TCP/53`, `UDP/53`, `TCP/443`, and `UDP/443`.

`TCP/443` and `UDP/443` simply share the same number; their protocol stack processing paths are entirely separate. Upon receiving an IP packet, the kernel first inspects the protocol identifier in the IP header: the Protocol field in IPv4, or Next Header in IPv6. TCP's protocol number is `6`, while UDP's is `17`. Long before reaching port-level dispatching, the kernel has already routed the packet to the corresponding TCP or UDP subsystem.

![Kernel Protocol Dispatching Flow](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-kernel-protoco-09d025cf.png)

Although TCP and UDP both reside at the transport layer, their characteristics diverge sharply. The table below compares them across 8 dimensions for a comprehensive overview:

| Characteristic | TCP | UDP |
| --- | --- | --- |
| **Connection Mode** | Connection-oriented (3-way handshake to connect, 4-way wave to teardown) | Connectionless, transmits directly |
| **Reliability** | Reliable (Sequence numbers, ACKs, retransmissions, flow/congestion control) | Unreliable, best-effort delivery |
| **State Tracking** | Stateful, maintains connection state machine | Stateless, forgets immediately after sending |
| **Transmission Efficiency** | Lower (substantial overhead from handshakes, acknowledgments, retransmissions) | Higher (simple structure, minimal overhead) |
| **Data Framing** | Byte-stream oriented, does not preserve message boundaries | Datagram oriented, naturally preserves message boundaries |
| **Header Overhead** | 20~60 bytes | Fixed 8 bytes |
| **Communication Mode** | Point-to-point (Unicast) | Unicast, Multicast, Broadcast supported |
| **Typical Applications** | HTTP/HTTPS, FTP, SMTP, SSH | DNS, DHCP, SNMP, TFTP, VoIP, Live Video Streaming |

Because TCP and UDP are two completely independent transport protocols, the kernel segregates them prior to port demultiplexing.

## Why Does Socket Binding Not Conflict?

Server programs typically create a socket and then bind it to a local IP and port via `bind()`. A TCP socket binding to `8080` and a UDP socket binding to `8080` can coexist simultaneously without conflict. When assessing conflicts, the kernel evaluates not just the port number, but the protocol and local address tuple.

For TCP, an established connection is uniquely identified by a 4-tuple: Source IP, Source Port, Destination IP, Destination Port. In firewalls, NAT devices, packet captures, and network troubleshooting, the transport protocol is incorporated to form the 5-tuple:

```text
Protocol, Source IP, Source Port, Destination IP, Destination Port
```

Two separate communication flows can both target destination port `8080`. As long as their protocols differ, the kernel will never conflate them. While UDP lacks TCP's complex connection state machine, incoming and outgoing UDP packets similarly carry Source IP, Source Port, Destination IP, and Destination Port.

## Hands-On Verification

You can easily verify this using `nc` (netcat). Note that `nc` implementations vary across operating systems, and syntax for `-l`, `-u`, and port parameters may differ. The following shows standard OpenBSD netcat usage; check `nc -h` on your machine if syntax errors occur.

First, start a TCP listener:

```bash
nc -l 8000
```

Then, start a UDP listener:

```bash
nc -u -l 8000
```

Both commands run concurrently without issue. On Linux, inspect the listeners:

```bash
ss -tulnp | grep 8000
```

You will typically observe one `tcp` and one `udp` listener sharing port 8000 under different protocol headers.

If you wish to avoid shell CLI variances, verify programmatically: in Java, `new ServerSocket(8000)` and `new DatagramSocket(8000)` can be instantiated in the same application; in Go, `net.Listen("tcp", ":8000")` and `net.ListenPacket("udp", ":8000")` coexist happily. Attempting to bind a second listener under the same protocol will immediately trigger an "Address already in use" exception.

## When Do Conflicts Actually Occur?

![Under What Circumstances Port Conflicts Occur](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/when-does-tcp-conflict-occur-c7dfbac0.png)

The lack of conflict between TCP and UDP does not imply that ports can be bound arbitrarily.

Port conflicts occur within the **same protocol**. For example, if a process binds to `0.0.0.0:8080`, it covers port `8080` on all local IPv4 interfaces; attempting to bind another process to `TCP/8080` on a specific IPv4 address will generally produce a collision. Actual behavior depends on binding order, socket options like `SO_REUSEADDR` / `SO_REUSEPORT`, and kernel implementation.

If two processes bind to distinct local IP addresses, identical ports within the same protocol can coexist—for example, binding to `192.168.1.10:8080` and `192.168.1.11:8080` concurrently over TCP.

Another easily overlooked detail involves IPv6 wildcard bindings: `[::]:8080` may simultaneously accept IPv6 and IPv4-mapped addresses depending on `IPV6_V6ONLY`, potentially colliding with an IPv4 socket. When troubleshooting, inspect both `0.0.0.0:port` and `[::]:port` via `ss -tulnp`.

Socket options `SO_REUSEADDR` and `SO_REUSEPORT` modify binding rules and are widely used for zero-downtime restarts, multi-process listening, and load distribution. Remember:

**TCP and UDP can listen on the same numerical port simultaneously because they are different protocols, without needing `SO_REUSEPORT`. `SO_REUSEADDR` and `SO_REUSEPORT` govern port reuse within the same protocol for rapid restarts and multi-process load sharing; support and traffic distribution rules depend on the OS and socket type.**

## Two Real-World Examples

### Why Does DNS Use Both TCP and UDP on Port 53?

![Real-World Case of DNS and HTTP/3 Using TCP and UDP Ports Concurrently](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-practical-appl-ab70afb0.png)

DNS is the classic textbook example. In the IANA registry, the `domain` service is registered on both `TCP/53` and `UDP/53`, and production DNS servers routinely listen on both.

Routine domain name queries travel over UDP: query and response packets are compact, and UDP incurs no connection handshake latency. However, DNS shifts to TCP in specific cases: when a UDP response is truncated (the `TC` bit is set in the DNS header, typically when responses exceed UDP size limits), during Zone Transfers between DNS servers (requiring reliable transport to preserve data integrity), or when handling large DNSSEC responses. This is not a case of "`UDP/53` being occupied, preventing `TCP/53` from being used"; rather, DNS is architected to utilize port 53 across both protocols simultaneously.

### The Same Principle Applies to HTTPS and HTTP/3 on Port 443

Traditional HTTPS runs HTTP/1.1 or HTTP/2 over TLS over TCP, defaulting to `TCP/443`. HTTP/3 runs over QUIC, which is built on UDP. Modern web browsers learn that a server supports HTTP/3 via `Alt-Svc` headers or `HTTPS` DNS resource records and then initiate a QUIC connection; standard modern deployments expose both `TCP/443` and `UDP/443`.

![HTTP/3 Protocol Stack Implementation](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-3-implementation-ab73b085.png)

This introduces zero conflict with existing `TCP/443` traffic. A web server seamlessly hosts:

```text
HTTPS (HTTP/1.1, HTTP/2) -> TCP/443
HTTP/3                   -> UDP/443
```

From an external vantage point, both use port `443`; from the kernel's protocol stack perspective, they are two completely independent paths.

In production environments, pay attention: if firewalls only permit `TCP/443`, HTTP/1.1 and HTTP/2 will operate normally, but HTTP/3 will silently fail. Ensure cloud security groups, load balancers, reverse proxies, and host firewalls allow both `TCP/443` and `UDP/443`, and verify HTTP/3 negotiation using `curl --http3` or browser developer tools.

## How to Answer in an Interview?

TCP and UDP can use the same numerical port because they belong to completely separate transport layer protocols. The kernel demultiplexes packets by IP protocol number first (directing traffic to the TCP stack or UDP stack) before looking up sockets by local IP and port; thus, `TCP/8080` and `UDP/8080` coexist harmoniously.

True binding conflicts arise within the same protocol—for example, two TCP services cannot bind to the same local IP and port without socket reuse flags like `SO_REUSEADDR` or `SO_REUSEPORT`. Two classic real-world examples are DNS (using both `UDP/53` and `TCP/53`) and HTTP/3 deployments (running over `UDP/443` alongside traditional HTTPS on `TCP/443`).
