---
title: What Is the Difference Between TCP Keepalive and HTTP Keep-Alive?
description: Compares TCP Keepalive and HTTP Keep-Alive across protocol layers, core objectives, default behaviors, reclamation strategies, and typical use cases, clarifying the evolution of Keep-Alive mechanisms across HTTP/1.0, HTTP/1.1, HTTP/2, and HTTP/3.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: TCP Keepalive,HTTP Keep-Alive,Keep-Alive,Persistent Connection,Short Connection,TCP Probe,HTTP Persistent Connection,HTTP/1.0,HTTP/1.1,HTTP/2,HTTP/3,QUIC,UDP,SO_KEEPALIVE
lang: en
sourceRef: zh-ref/cs-basics/network/tcp-keepalive-vs-http-keepalive.md
---

Hello, I am Xiao G. The comparison between TCP Keepalive and HTTP Keep-Alive is a frequent interview question in technical interviews. Let us dissect it thoroughly in this article.

Simply put, while they share the "Keep-Alive" suffix in their names, they are fundamentally different mechanisms operating at completely separate layers:

- **HTTP Keep-Alive** operates at the application layer. It solves: whether a single TCP connection can be reused across multiple HTTP requests, avoiding repeated handshakes for every request.
- **TCP Keepalive** operates at the transport layer. It solves: when a TCP connection remains idle for an extended period with no traffic, how to determine whether the peer is still alive, and whether to reclaim the resources occupied by the dead connection.

![HTTP and TCP Layers in the TCP/IP Four-Layer Model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

One governs "connection reuse", while the other governs "connection liveness". They exist at different protocol layers with distinct objectives, merely sharing similar naming.

Let us explore each in detail.

## What Is HTTP Keep-Alive?

Let us start with the problem it addresses. The default behavior in HTTP/1.0 was: each TCP connection served exactly one HTTP request-response cycle. Once the server finished transmitting the response, it immediately initiated connection closure; the client followed suit, and the TCP connection was torn down in both directions.

![HTTP: HyperText Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

When loading a modern webpage, dozens of resources—HTML, CSS, JS, images—must be fetched. If each resource required an independent TCP connection to be established and destroyed, the overhead of repeated three-way handshakes and four-way waves would be immense, resulting in abysmal TCP connection utilization.

The question was obvious: **Why cannot a single TCP connection serve multiple HTTP requests?**

To solve this, HTTP introduced the `Connection` header. In HTTP/1.0, the client could explicitly include in its request headers:

```
Connection: Keep-Alive
```

If the server agreed by confirming this header in its response, both sides established that the underlying TCP connection was a **persistent connection (long-lived connection)**: after the current request/response cycle completed, the connection remained open, allowing subsequent HTTP requests to reuse it until an idle timeout occurred, a maximum request limit was reached, or either party actively initiated closure.

**Default Keep-Alive behaviors differ across HTTP versions:**

![Default Keep-Alive Behaviors Vary Across HTTP Versions](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/different-http-versions-have-different-default-k-f743d0f1.png)

- **HTTP/1.0**: Defaults to short-lived connections. Persistent connections require an explicit `Connection: Keep-Alive` in the request header, which takes effect only if the server also echoes this header in its response.
- **HTTP/1.1**: Defaults to persistent connections without needing explicit declaration. If a client wishes to terminate the connection after a request, it must explicitly specify `Connection: close`. This is why HTTP/1.1 drastically reduces TCP handshake and teardown overhead compared to HTTP/1.0.
- **HTTP/2**: Moves away from HTTP/1.x's sequential processing on a connection and introduces multiplexing (Multiplexing). Multiple concurrent streams can interleave requests and responses over a single TCP connection without blocking one another, eliminating application-layer Head-of-Line (HoL) blocking. However, because HTTP/2 still runs on a single underlying TCP connection, a lost packet causes subsequent data to wait for retransmission, leaving it susceptible to TCP-layer HoL blocking. The HTTP/1.x style connection control headers become meaningless in HTTP/2. More strictly, connection-specific headers such as `Connection`, `Keep-Alive`, and `Transfer-Encoding` are prohibited in HTTP/2, and messages containing them are treated as malformed.
- **HTTP/3**: Built on QUIC and operating over UDP, HTTP/3 no longer relies on TCP connections or HTTP/1.x `Connection: Keep-Alive` semantics. QUIC natively manages connections, liveness probing, and multiplexing, mitigating transport-layer HoL blocking.

In summary: HTTP/1.0 requires explicit Keep-Alive; HTTP/1.1 enables persistent connections by default; HTTP/2 evolves from "connection reuse" to "single-connection multiplexing"; and HTTP/3 replaces TCP connection management entirely with QUIC.

## How Are HTTP Persistent Connections Closed and Reclaimed?

While persistent connections improve TCP utilization, they introduce a new problem: a client loads a web page, the TCP connection is established, and the user simply leaves the browser tab open indefinitely. The connection sits idle; the server cannot wait forever, nor can it rely entirely on the client to politely close it.

If idle connections accumulate, the server's Transmission Control Block (TCB) resources will be wasted.

HTTP addresses this by specifying parameters within the `Keep-Alive` header:

```
Keep-Alive: timeout=5, max=10
```

- **timeout=5**: If the connection remains idle for more than 5 seconds, the server may terminate it.
- **max=10**: The connection can serve a maximum of 10 HTTP requests, after which it is forcibly closed.

An easily overlooked detail: **once the timeout or max threshold is reached, the server can terminate the connection regardless of whether the client is online.** If a client happens to reuse this stale connection for a new request right as it is closing, the request may fail, necessitating a retry.

Thus, idle connection reclamation in HTTP Keep-Alive is primarily dictated by server configuration. While clients can actively close connections, the server does not wait indefinitely for the client's decision.

In production web servers, these values are configurable. For example, Nginx defaults `keepalive_timeout` to 75 seconds, and `keepalive_requests` to 1000 (prior to Nginx 1.19.10, the default was 100).

## What Is TCP Keepalive?

TCP Keepalive solves an entirely different problem: it does not care whether HTTP traffic flows over the connection; it cares about—**whether the remote peer is still physically alive**.

Consider this scenario: A TCP connection is established between a client and a server. Suddenly, the client loses power, the network cable is unplugged, or the OS crashes. The server has no inherent way of knowing the peer has vanished, because unlike a traditional telephone line, TCP has no "busy tone" or dial tone. The connection becomes a "half-open" zombie connection, squandering memory and TCB resources on the server.

TCP Keepalive exists to detect such conditions. Its workflow is as follows:

![TCP Keepalive Working Principle](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-wo-7f50afab.png)

1. If a TCP connection experiences no data activity for a configured duration (by default **7200 seconds, or 2 hours**), the kernel automatically sends a **probe segment** to the peer.
2. If the peer is online and operating normally, it replies with an ACK; the timer resets, and the kernel waits another 2 hours.
3. If the peer does not reply, the kernel resends a probe every **75 seconds**, retrying up to **9 times**.
4. If all 9 probes fail to elicit a response, the kernel deems the connection dead, issues an RST, tears down the socket, and frees resources.

In Linux, these three parameters correspond to the following sysctl settings:

| Parameter | Meaning | Linux Default Value |
| --- | --- | --- |
| `tcp_keepalive_time` | Idle time before sending the first probe | 7200 seconds (2 hours) |
| `tcp_keepalive_intvl` | Interval between successive probes | 75 seconds |
| `tcp_keepalive_probes` | Maximum number of probe attempts | 9 times |

macOS, following the BSD networking stack heritage, uses `net.inet.tcp.*` rather than `net.ipv4.*`.

![Checking TCP Keepalive Parameters on macOS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-parameters-bc09fa23.jpg)

Based on default Linux values, from the moment a connection falls idle until it is officially declared dead takes **7200 + 75 × 9 = 7875 seconds**, or roughly 2 hours and 11 minutes.

These values can be inspected and tuned via `sysctl`:

```bash
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_intvl
sysctl net.ipv4.tcp_keepalive_probes
```

An important pitfall: **TCP Keepalive is disabled by default.** Applications must explicitly enable it when creating a socket via the `SO_KEEPALIVE` socket option; otherwise, the kernel will never transmit probe packets. RFC 1122 explicitly mandates that Keepalive is an optional feature and must default to off.

Understanding its mechanism highlights the nature of TCP Keepalive—it is a **"gentle" resource reclamation mechanism**. It can only reclaim resources after verifying that the peer is unreachable. As long as the peer remains online and capable of acknowledging ACKs, the connection is kept alive, the timer resets, and another 2-hour wait begins. While the peer is online, the server cannot tear down the connection using TCP Keepalive alone.

This stands in stark contrast to HTTP Keep-Alive, which forcibly terminates connections upon reaching thresholds regardless of client presence.

## What Scenarios Can Occur During TCP Keepalive Probing?

After the kernel dispatches a probe segment, different outcomes occur based on the peer's actual state:

![TCP Keepalive Probing Mechanism](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-de-306c79b5.png)

**1. Peer is online and healthy**

The peer receives the probe, and its TCP stack replies with an ACK. The sender receives the ACK, resets the idle timer back to `tcp_keepalive_time`, and resumes waiting. The connection remains alive.

**2. Peer crashed and rebooted**

The peer machine is online, but having rebooted, its kernel holds no memory or context of the pre-existing connection. Upon receiving the probe, the peer TCP stack responds with an RST (because it does not recognize the connection). The sender receives the RST and immediately terminates the connection.

**3. Peer crashed and unrecovered, or network is unreachable**

The probe segments elicit no response whatsoever. The sender retries every `tcp_keepalive_intvl` seconds for `tcp_keepalive_probes` times. Receiving no reply, it concludes the connection is dead; the kernel tears down the connection and reclaims resources.

Scenario 3 also encompasses issues caused by intermediate network devices. For instance, stateful NAT firewalls enforce idle session timeouts: if a connection transmits no traffic, the NAT table entry expires and is purged. Subsequent probes cannot reach the peer, yielding the same outcome as a peer crash—no response, culminating in a timeout disconnection.

## What Are the Limitations of TCP Keepalive?

Here, TCP Keepalive refers strictly to transport-layer keep-alive probes, not HTTP Keep-Alive connection reuse. While it detects dead sockets, relying solely on TCP Keepalive in production systems is often insufficient for several reasons:

**Default probing is excessively slow.** In Linux, probes begin only after 7200 seconds of inactivity; Windows similarly defaults to 2 hours. This timeframe is far too sluggish for modern interactive services. Linux `net.ipv4.tcp_keepalive_*` values serve as system-wide defaults for unconfigured sockets; applications requiring fine-grained control on supported platforms can tune `TCP_KEEPIDLE`, `TCP_KEEPINTVL`, and `TCP_KEEPCNT` per socket. However, such options are not universally portable across operating systems or language runtimes.

**It only detects connection liveness, not application health.** TCP Keepalive probes are generated by the kernel, and the peer's TCP stack responds with ACKs directly without involving user-space applications. Thus, a successful probe proves only that the peer's kernel can process packets and return ACKs; it reveals nothing about whether the application thread pool is exhausted, the event loop is blocked, the database connection pool is frozen, or backend dependencies have failed. This is its most significant blind spot.

**Intermediate layers can mask real endpoints.** When clients and servers are separated by NAT gateways, Layer-4 load balancers, or reverse proxies, one must verify whether the TCP connection is terminated at the intermediary. If the intermediate device performs pure NAT/connection tracking, Keepalive intervals must be shorter than the intermediary's idle timeout to avoid NAT table eviction; if the proxy terminates the TCP connection, the backend's keepalive only monitors the segment between backend and proxy, not whether the end client is alive.

**Implementations and defaults vary across operating systems.** Linux defaults to 7200s idle, 75s interval, and 9 probes; Windows defaults to a 2-hour idle and a 1s interval, with a fixed 10-probe count in Windows Vista and later; macOS follows BSD conventions under `net.inet.tcp.*` without Linux sysctl names. Relying on TCP Keepalive for cross-platform health checking makes uniform behavior difficult to guarantee.

**It does not apply to HTTP/3/QUIC.** Native HTTP/3/QUIC connections do not utilize TCP Keepalive because they run on UDP. (If a client falls back to HTTP/1.1 or HTTP/2 due to blocked UDP, the fallback TCP connection is governed by TCP Keepalive). HTTP/3 connection liveness is handled directly by QUIC via idle timeouts and optional PING frames, while HTTP/3 graceful shutdown uses GOAWAY frames.

Consequently, in real-world engineering, TCP Keepalive serves primarily as a safety net of last resort to clean up undeniably dead sockets. When rapid, granular, and application-aware health checking is required, applications must implement their own heartbeats—such as WebSocket Ping/Pong, gRPC keepalive pings, or custom application heartbeat frames.

Application heartbeats should not be overly aggressive either. Excessively short intervals inflate packet volume, server timer overhead, and false-positive disconnects on unstable cellular networks; excessively long intervals delay failure detection. Configuration should be calibrated against connection scale, NAT/LB idle timeouts, and acceptable business recovery windows.

## Summary Comparison: TCP Keepalive vs. HTTP Keep-Alive

| Comparison Dimension | HTTP Keep-Alive | TCP Keepalive |
| --- | --- | --- |
| **Protocol Layer** | Application Layer (HTTP Protocol) | Transport Layer (TCP Protocol) |
| **Core Problem Solved** | Reuses TCP connections, reducing repeated handshakes, teardowns, and slow-start overhead | Probes prolonged idle TCP connections, reclaiming dead sockets when peer is unreachable |
| **Default Behavior** | HTTP/1.0 defaults to short connections; HTTP/1.1 defaults to persistent connections | Disabled by default; applications must explicitly enable `SO_KEEPALIVE` |
| **Control Granularity** | Controlled by HTTP clients, web servers, or proxies per connection policy | Controlled by OS kernel, configurable per socket on select platforms |
| **Common Parameters** | `Connection`, `Keep-Alive: timeout/max`, server timeout directives | `tcp_keepalive_time/intvl/probes` or OS platform equivalents |
| **Closure Trigger** | Reaching idle timeout, max request count, or explicit close by either party | Sent probes go unanswered multiple times or return RST |
| **When Peer Is Online** | Server can still actively terminate idle connection per configuration | As long as peer kernel returns ACKs, connection is maintained |
| **Can Replace Heartbeats** | Cannot assess business health; only manages HTTP connection reuse | Cannot assess worker thread pools, event loops, or business dependencies |
| **Intermediary Impact** | Proxies and gateways independently manage client-facing and upstream connections | NAT/LB/reverse proxies may cause probes to only monitor a local network hop |
| **Relation to HTTP/2/3** | HTTP/2 bans connection-specific headers; HTTP/3/QUIC does not use this mechanism | Operates only on TCP; native HTTP/3/QUIC connections are unaffected |

From the perspective of "who decides to close the connection", the two mechanisms take opposite philosophies:

HTTP Keep-Alive is "proactive reclamation"—once the server hits its configured timeout or request ceiling, it closes the connection on its own terms without needing to verify peer liveness.

TCP Keepalive is "passive reclamation"—it must first probe the peer with "are you still there?". As long as the peer responds with an ACK, the server has no choice but to maintain the connection and refresh timers. Only after confirming the peer has vanished does it free resources.

In production environments, both mechanisms commonly operate side by side. HTTP Keep-Alive dictates "how long a connection may be reused and how many requests it may serve", while TCP Keepalive watches "whether the remote endpoint has silently disappeared during prolonged inactivity". They operate independently and cannot replace one another.
