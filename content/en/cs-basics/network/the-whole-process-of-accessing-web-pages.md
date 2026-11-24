---
title: What Exactly Happens from Entering a URL to Page Display?
description: Traces the entire chain from typing a URL to page rendering, covering DNS, TCP, HTTP, TLS, ARP, data encapsulation, and browser rendering to aid interview and practical understanding.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: Web page access process,DNS,TCP connection,HTTP request,TLS handshake,ARP,resource loading,browser rendering,closing connection
lang: en
sourceRef: zh-ref/cs-basics/network/the-whole-process-of-accessing-web-pages.md
---

From typing a URL into the browser address bar to the page appearing on the screen, a series of stages are linked together behind the scenes: DNS, TCP, TLS, HTTP, ARP, data encapsulation, and browser rendering.

This question is frequently used in technical interviews to assess overall understanding of computer networking, as it weaves together key concepts across the application, transport, network, and data link layers. Memorizing individual protocols in isolation often leads to fragmented knowledge; walking through the complete journey of visiting a webpage makes everything much clearer.

This article primarily answers several questions:

1. What local processing does the browser perform first after entering a URL?
2. How does the DNS domain name resolution process work?
3. How is a TCP connection established? If HTTPS is used, what does the TLS handshake do?
4. What is the interaction flow between HTTP requests and responses?
5. Through which layers of encapsulation and forwarding do data packets travel from host to server?
6. Once the browser receives HTML, how does it load CSS, JS, images, and other sub-resources to render the page?
7. After the page finishes loading, how are connections reused or closed?

In general, the network communication model can be represented by the diagram below. Visiting a webpage is essentially a process where data is encapsulated layer-by-layer downward from the application layer, transmitted across physical networks to the remote peer, and then decapsulated layer-by-layer upward.

![Collaboration of the five-layer network model during web page access](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/five-layers-ccc5588a.png)

Before diving into details, let's briefly walk through the complete end-to-end flow:

1. **Browser parses URL and checks cache**: The browser parses the components of the URL and checks the HTTP cache (strong cache, negotiated cache) to see whether a valid cached copy of the resource already exists.
2. **DNS resolution**: The browser obtains the IP address corresponding to the domain name via the DNS protocol.
3. **Establish transport connection**: HTTP/1.1 and HTTP/2 typically establish a connection via the TCP three-way handshake; HTTP/3 establishes a UDP-based QUIC connection.
4. **Establish secure channel (HTTPS)**: For HTTP/1.1 and HTTP/2, a TLS handshake is performed over TCP; HTTP/3 integrates TLS 1.3 within the QUIC connection establishment to negotiate keys and authenticate server identity.
5. **Send HTTP request**: The browser sends an HTTP request message over the connection to request the webpage content.
6. **Server processes request and returns response**: The server receives the request, processes it, and returns an HTTP response message.
7. **Browser parsing and rendering**: The browser parses HTML and CSS, executes JavaScript, and loads referenced sub-resources (images, fonts, etc.).
8. **Connection management**: After the page finishes loading, the connection is reused or closed according to keep-alive policies.

Let's examine each step in detail below.

## Step 1: Parsing URL and Checking Cache

You open the browser, type the URL into the address bar, and hit Enter. The first thing the browser does is not send a network request, but parse the URL and check whether local cache can be used directly.

### What Is a URL

A URL (Uniform Resource Locator) is the unique address of a resource on the Internet. Every accessible resource on the network corresponds to a URL; theoretically, files and URLs map one-to-one. In practice, there are exceptions, such as in redirection or CDN scenarios where multiple URLs may point to the same underlying resource.

### Structure of a URL

![Structure of a URL](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/URL-parts-74094b20.png)

A complete URL consists of the following components:

1. **Scheme / Protocol**: The prefix of the URL indicating the protocol used; the most common are `http` and `https`, alongside file transfer protocols like `ftp:`.
2. **Host / Domain Name**: The common name of the access target, or a raw IP address directly. A domain name is essentially a human-readable alias for an IP address.
3. **Port**: Follows immediately after the domain name, separated by a colon. HTTP defaults to 80 and HTTPS defaults to 443; if using default ports, it can be omitted.
4. **Path**: Starts from the first `/`, representing the resource location on the server. In early designs, paths mapped to physical files on the server; today, they are usually virtual paths routed by backend frameworks.
5. **Query Parameters**: The section following `?`, formatted as `key=value` pairs separated by `&`. The server parses and extracts these parameters when processing the request.
6. **Fragment / Anchor**: The portion following `#`, used to scroll to a specific location within the page. Fragments are **never** sent to the server as part of the HTTP request; they are processed purely locally by the browser.

### Browser Cache Check

After parsing the URL, the browser first inspects the HTTP cache to see if a valid copy of the resource already exists:

1. **Strong Cache**: Checks headers like `Cache-Control` (such as `max-age`) or `Expires` to determine whether the cache is still valid. If valid, the cached copy is used directly, bypassing all subsequent network requests.
2. **Negotiated Cache**: When strong cache misses or expires, the browser sends a validation request to the server (carrying `If-Modified-Since` or `If-None-Match`). The server determines whether the resource has changed. If unchanged, it returns `304 Not Modified`, and the browser continues using the local cache; if changed, it returns `200 OK` along with the new resource.

When an HTTP cache hits, the access process terminates right here, with no need to initiate further network requests.

### Preparation for Domain Resolution

If the HTTP cache misses, the browser must initiate a network request to the server, which requires obtaining the IP address corresponding to the domain name. Before officially launching a DNS query, the browser checks the following in sequence:

1. **Browser DNS Cache**: The browser maintains its own internal DNS cache; it first checks whether an unexpired record exists for the domain.
2. **Operating System DNS Cache**: If the browser cache misses, it queries the OS-level DNS cache.
3. **Hosts File**: The operating system checks the local `hosts` file to see if there is a direct mapping from the domain name to an IP address. If so, it uses that IP address immediately, skipping network DNS resolution.

If none of the above hits, the browser proceeds to launch a full DNS query.

## Step 2: DNS Resolution

DNS (Domain Name System) solves the problem of **mapping domain names to IP addresses**. Domain names exist merely for human memorability; actual network routing requires IP addresses.

### DNS Resolution Flow

After the browser obtains the domain name, DNS resolution typically follows these steps:

1. **Browser DNS Cache**: The browser checks its internal DNS cache for an unexpired record.
2. **Operating System DNS Cache**: If the browser cache misses, a DNS query request is made to the OS, which checks its own cache.
3. **Local DNS Server**: The local DNS server configured in the OS (usually provided by the ISP, or using public DNS like `8.8.8.8` or `114.114.114.114`). If the local DNS server holds an unexpired cached record, it returns it immediately.
4. **Recursive / Iterative Query**: If the local DNS server misses its cache, it performs iterative queries on behalf of the client—first asking the Root DNS server, then the Top-Level Domain (TLD) DNS server (e.g., `.com`), and finally the authoritative DNS server, resolving the target IP step by step.
5. **Return Result and Cache**: Once the local DNS server gets the final answer, it returns it to the client and caches a copy locally for future queries.

The diagram below shows a typical DNS iterative resolution process:

![DNS resolution flow](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-process-f2f3a36e.png)

In real-world scenarios, local DNS servers usually have already cached numerous TLD server addresses, so most queries do not start at the root servers; skipping root servers to query TLDs directly is very common.

> For more details on DNS (DNS server hierarchy, difference between recursive and iterative queries, DNS record types, why UDP is typically used, etc.), refer to [Detailed Explanation of DNS Domain Name System (Application Layer)](https://javaguide.cn/cs-basics/network/dns.html).

## Step 3: Establishing Transport Connection

Having acquired the target server's IP address, the browser must establish a transport connection with the server. Below, we first introduce the TCP connection commonly used by HTTP/1.1 and HTTP/2; if HTTP/3 is negotiated, a QUIC connection is established instead, which is built on top of UDP.

### TCP Three-Way Handshake

The purpose of the TCP three-way handshake is to **synchronize initial sequence numbers** of both parties and **confirm that two-way transmission paths are functional**.

![TCP three-way handshake diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-shakes-hands-three-times-0d566cee.png)

1. **First Handshake (SYN)**: The client sends a SYN segment carrying its initial sequence number `seq=x`, entering the `SYN_SENT` state.
2. **Second Handshake (SYN+ACK)**: The server responds with SYN+ACK, carrying its own initial sequence number `seq=y` and acknowledgement number `ack=x+1`, entering the `SYN_RCVD` state.
3. **Third Handshake (ACK)**: The client replies with ACK, acknowledgement number `ack=y+1`. Both parties enter the `ESTABLISHED` state, completing connection setup.

The three-way handshake is not designed to "waste an extra round", but to ensure both parties can confirm: the peer can receive their data, and they can receive the peer's data. A two-way handshake cannot achieve this—after the second handshake, the server does not know whether the client received its SYN+ACK.

> For in-depth analysis of the three-way handshake, SYN queues, accept queues, SYN Flood protection, etc., refer to [TCP Three-Way Handshake and Four-Way Wave (Transport Layer)](https://javaguide.cn/cs-basics/network/tcp-connection-and-disconnection.html).

### If HTTPS: TLS Handshake

If using TCP-based HTTPS, a TLS handshake must take place after TCP connection establishment. HTTP/3 integrates TLS 1.3 directly into the QUIC handshake. TLS has three core goals: **encryption** (prevent eavesdropping), **authentication** (prevent impersonation), and **integrity verification** (prevent tampering).

Rough TLS handshake flow (taking TLS 1.2 RSA key exchange as an example):

1. **Client Hello**: The client sends supported TLS versions, a list of cipher suites, and a client random number.
2. **Server Hello**: The server selects a cipher suite, returning its certificate and another random number.
3. **Key Exchange**: The client validates the server certificate's authenticity (via CA digital signature verification), generates a Pre-Master Secret, encrypts it with the server's public key, and sends it to the server. Both parties calculate symmetric session keys based on the Pre-Master Secret and the two exchanged random numbers.
4. **Completion**: Both sides encrypt subsequent communication using the session keys; the handshake concludes.

Note that the above flow describes RSA-based key exchange in TLS 1.2. Modern HTTPS overwhelmingly adopts ECDHE key exchange, and TLS 1.3 can also use PSK or PSK+(EC)DHE in session resumption scenarios. In ECDHE, the shared secret is negotiated through ephemeral keys and is never transmitted directly over the network; compromising the server certificate private key alone cannot decrypt historical sessions that used ephemeral negotiation. TLS 1.3 further streamlines the handshake, typically collapsing full handshakes to 1-RTT and removing static RSA key exchange.

Once the TLS handshake finishes, subsequent HTTP requests and responses are encrypted using the negotiated symmetric keys. The security of HTTPS comes from the TLS layer, rather than changes to the HTTP protocol itself.

> For detailed analysis of TLS encryption principles (asymmetric encryption, symmetric encryption, digital signatures, CA certificates), refer to [HTTP vs HTTPS (Application Layer)](https://javaguide.cn/cs-basics/network/http-vs-https.html). For differences between RSA and ECDHE key exchange, refer to [HTTPS RSA vs ECDHE Handshake Process](https://javaguide.cn/cs-basics/network/https-rsa-vs-ecdhe.html).

## Step 4: Sending HTTP Request

Once the TCP connection (and potential TLS channel) is established, the browser can send an HTTP request.

### HTTP Request Message Structure

A typical HTTP/1.1 request message looks like this:

```http
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Accept: text/html,application/xhtml+xml
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Connection: keep-alive
Cookie: session_id=abc123
```

Explanation of components:

- **Request Line**: `GET /index.html HTTP/1.1` — Request method (`GET`), resource path (`/index.html`), and protocol version (`HTTP/1.1`).
- **Host Header**: Specifies the target hostname. This is mandatory in HTTP/1.1, because a single server (a single IP) may host multiple websites via virtual hosting.
- **Other Request Headers**: `User-Agent` (client information), `Accept` (acceptable response types), `Accept-Encoding` (supported compression methods), `Cookie` (state information carried), etc.

### Server Processing the Request

Upon receiving the request, the server executes a series of steps to formulate a response:

1. **Receive Request**: The web server (e.g., Nginx, Tomcat) receives and parses the HTTP request message.
2. **Route Dispatching**: Based on the URL path, it routes the request to the corresponding backend processing handler (Controller, Servlet, etc.).
3. **Business Processing**: Executes specific business logic, which may involve database queries, cache reads, or calling other microservices.
4. **Construct Response**: Packages the processing result into an HTTP response message.

### HTTP Response Message Structure

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Encoding: gzip
Content-Length: 1256
Cache-Control: max-age=3600
Set-Cookie: session_id=xyz789; Path=/

<!DOCTYPE html>
<html>
...
</html>
```

Explanation of components:

- **Status Line**: `HTTP/1.1 200 OK` — Protocol version, status code (`200`), and status description.
- **Response Headers**: `Content-Type` (response body MIME type), `Content-Encoding` (compression format), `Cache-Control` (caching directive), `Set-Cookie` (sets client cookie), etc.
- **Response Body**: The actual content requested, such as an HTML document, JSON payload, or binary image data.

Common status codes:

| Status Code | Category | Common Examples |
| --- | --- | --- |
| 2xx | Success | 200 OK, 206 Partial Content |
| 3xx | Redirection | 301 Moved Permanently, 302 Found, 304 Not Modified |
| 4xx | Client Error | 400 Bad Request, 403 Forbidden, 404 Not Found |
| 5xx | Server Error | 500 Internal Server Error, 502 Bad Gateway |

> For a detailed summary of common HTTP status codes, refer to [Common HTTP Status Codes Summary (Application Layer)](https://javaguide.cn/cs-basics/network/http-status-codes.html).

## Step 5: Packet Encapsulation and Forwarding

After the HTTP request leaves the browser, data does not simply "teleport" to the server. It must undergo layer-by-layer encapsulation through the protocol stack and be forwarded hop-by-hop across the physical network to reach its destination.

### Data Encapsulation Process

Application-layer HTTP messages are encapsulated layer by layer through the transport, network, and data link layers, ultimately turning into a bitstream that can travel across physical media:

![Overview of protocols across TCP/IP layers](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-protocol-overview-09ff1718.png)

Each layer is only concerned with adding its own header information and relies on services provided by the layer below to transport data:

- **Transport Layer (TCP)**: Adds source port and destination port, utilizing sequence numbers and acknowledgment numbers to guarantee reliable delivery.
- **Network Layer (IP)**: Adds source IP and destination IP, responsible for addressing and routing, deciding the path packets traverse from source to destination.
- **Link Layer**: Adds source MAC and destination MAC addresses, responsible for transmitting data frames between adjacent nodes on the same physical link.

### Network Layer Routing and Forwarding

To travel from the source host to the destination host, packets typically pass through multiple routers. The core functions of the network layer are **routing and forwarding**:

- **Routing**: Determining the optimal path packets should follow from source to destination (computed by routing protocols such as OSPF, BGP, etc.).
- **Forwarding**: Transferring packets from a router's incoming interface to the appropriate outgoing interface.

Each router maintains a routing table, looking up the destination IP to determine the next hop. A packet in the network behaves like a postal parcel: each transit station only looks at "where to send next", without needing to know the complete end-to-end path upfront.

### ARP Protocol: Mapping IP Addresses to MAC Addresses

When data frames are transmitted at the link layer, the MAC address of the next-hop device is required, rather than just an IP address. ARP (Address Resolution Protocol) solves the exact problem of "given an IP address, how to obtain the corresponding MAC address".

ARP operates on a **broadcast query, unicast response** model:

1. The host first checks its local ARP cache table to see if a MAC address for the target IP already exists.
2. If the cache misses, it broadcasts an ARP request across the local network: "Who has IP xxx.xxx.xxx.xxx? Please tell me your MAC address."
3. The target device (or router interface) receives the broadcast and replies with its MAC address via unicast.
4. The requester receives the response, stores the IP-MAC mapping in its ARP cache, and uses it directly for subsequent communications.

If the target host is not on the same subnet, the host does not need to know the final destination's MAC address; it only needs to know the **MAC address of the local gateway (router)**. The packet is first delivered to the gateway, which forwards it hop-by-hop toward the target network.

> For detailed principles of ARP (same subnet vs cross-subnet addressing, ARP table, common attacks), refer to [Detailed Explanation of ARP Protocol (Network Layer)](https://javaguide.cn/cs-basics/network/arp.html).

### Network Address Translation (NAT)

In most residential and enterprise networks, internal hosts use private IP addresses (such as `192.168.x.x`), which cannot be routed directly on the public Internet. The NAT (Network Address Translation) protocol translates IP addresses between internal and public networks.

When an internal host sends a packet to the public Internet, the NAT device (usually a router) replaces the source private IP address with a public IP address and records the port mapping relationship. When response packets return, NAT translates the destination address back to the internal host's private IP based on the mapping table.

## Step 6: Browser Parsing and Rendering

Once the server returns an HTML response, the browser's work truly kicks off. The browser must parse the HTML, construct the DOM tree, load sub-resources, compute styles, calculate layout, and finally paint pixels to the screen.

### HTML Parsing and DOM Construction

Upon receiving the HTML document, the browser parses it line by line from top to bottom:

1. **Construct DOM Tree**: Parses HTML tags to generate the Document Object Model (DOM) tree representing the page's hierarchical structure.
2. **Construct CSSOM Tree**: When encountering CSS files referenced by `<link>` or `<style>` tags, it downloads and parses the CSS to generate the CSS Object Model (CSSOM) tree, representing styling rules.
3. **Construct Render Tree**: Merges the DOM tree and CSSOM tree into a render tree. The render tree contains only the nodes required for visual display along with their computed styles (elements with `display: none` are omitted).
4. **Layout (Reflow)**: Computes the exact geometric position and size of every node in the render tree.
5. **Paint**: Converts the laid-out render tree nodes into actual pixels on the screen.
6. **Composite**: Combines different render layers into the final composite image displayed on screen.

### Sub-resource Loading

HTML documents typically reference numerous external resources:

- **CSS Files** (`<link rel="stylesheet">`): Standard render-blocking stylesheets block rendering. The browser generally waits for CSS to load and parse before layout and painting, because CSS can alter element dimensions and positioning. This behavior can be tuned via `media` attributes, dynamic loading, or `preload`.
- **JavaScript Files** (`<script>`): By default, JS execution blocks HTML parsing because JavaScript can modify the DOM. Loading behavior can be modified using `async` or `defer` attributes.
- **Images, Fonts, etc.**: Do not block HTML parsing, but can only be rendered after loading completes.

Loading these sub-resources triggers additional HTTP requests. Under HTTP/1.1, browsers typically maintain up to 6 concurrent TCP connections per domain to download assets in parallel. HTTP/2's multiplexing mechanism allows multiple resources to stream concurrently across a single TCP connection.

### JavaScript Execution

Executing JavaScript blocks HTML parsing. When the browser encounters a `<script>` tag, it pauses DOM construction, downloading and executing the script first. If the script performs DOM manipulations, it may trigger DOM restructuring, layout reflow, or repainting.

Common optimization strategies in modern frontend engineering include:

- Placing `<script>` tags at the bottom of the `<body>` or using the `defer` attribute to prevent blocking initial DOM parsing.
- Using the `async` attribute to load non-DOM-dependent scripts asynchronously.
- Accelerating static asset delivery through CDNs.
- Utilizing browser caching to eliminate redundant requests.

## Step 7: Connection Management

Once the page and assets have loaded, connections are typically not severed immediately. How connections are managed depends on the HTTP version and configuration. The discussion below for HTTP/1.0, HTTP/1.1, and HTTP/2 primarily pertains to TCP connections; HTTP/3 manages QUIC connections and streams.

### HTTP/1.0 Short-lived Connections

HTTP/1.0 used short-lived connections by default: every request-response round trip closed the underlying TCP connection. If a page referenced 10 external resources, the browser had to open 10 independent TCP connections, each enduring a three-way handshake and four-way teardown, wasting substantial time on connection overhead.

### HTTP/1.1 Persistent Connections (Keep-Alive)

HTTP/1.1 defaults to persistent connections (`Connection: keep-alive`). Once a TCP connection is established, it can send multiple requests and receive multiple responses continuously without reconnecting each time. Thus, sub-resources like CSS, JS, and images can reuse the same TCP connection.

Persistent connections are not permanent. Servers typically configure an idle timeout (such as Apache's `KeepAliveTimeout`); if no new request arrives within that window, the server actively terminates the connection.

### HTTP/2 Multiplexing

HTTP/2 introduced multiplexing on top of persistent connections. Multiple requests and responses can be interleaved simultaneously over a single TCP connection, with data divided into smaller frames differentiated by Stream IDs. This resolved application-layer head-of-line (HOL) blocking in HTTP/1.1—a slow request no longer holds up subsequent requests behind it. Note that HTTP/2 is still based on TCP; when packet loss occurs at the TCP layer, all streams on that connection stall (TCP-layer HOL blocking). HTTP/3, built on QUIC (UDP), further mitigates this issue.

### Connection Teardown

When a connection must be closed (initiated by the active closer):

1. The active closer sends a FIN packet, signaling it has no more data to send.
2. The passive closer replies with ACK and enters the `CLOSE_WAIT` state, though it may continue transmitting its remaining data.
3. Once the passive closer finishes sending its data, it also sends a FIN.
4. The active closer replies with a final ACK and enters the `TIME_WAIT` state, waiting 2MSL before completely closing.

The `TIME_WAIT` state ensures the final ACK safely reaches the peer, while allowing residual packets in the network to expire and dissipate, preventing them from interfering with subsequent new connections.

> For details on the TCP four-way wave, the impact of TIME_WAIT, and diagnosing CLOSE_WAIT accumulation, refer to [TCP Three-Way Handshake and Four-Way Wave (Transport Layer)](https://javaguide.cn/cs-basics/network/tcp-connection-and-disconnection.html).

## Summary of the Complete Journey

Connecting all the above steps together, the full page access workflow is summarized as:

1. **Enter URL** → The browser parses URL components and checks the HTTP cache; if a network request is needed, it checks the local hosts file.
2. **DNS Resolution** → Queries the browser cache, OS cache, and local DNS server in sequence, iteratively querying Root → TLD → Authoritative servers when necessary to obtain the target IP address.
3. **Establish Transport Connection** → HTTP/1.1 and HTTP/2 establish a TCP connection; HTTP/3 establishes a QUIC connection.
4. **Establish Secure Channel (HTTPS)** → TCP-based HTTPS performs a TLS handshake; HTTP/3 integrates TLS 1.3 during QUIC connection establishment.
5. **HTTP Request and Response** → The browser sends the request; the server processes it and returns an HTML response.
6. **Data Encapsulation and Forwarding** → The request message is encapsulated through TCP → IP → Link layer, forwarded hop-by-hop via routers and switches to the server; the response traverses back along the reverse path.
7. **Browser Rendering** → Parses HTML to construct the DOM tree, loads CSS/JS/image sub-resources, builds the render tree, calculates layout, and paints the page.
8. **Connection Management** → Reuses or tears down the connection according to HTTP version and configuration.

Visiting a webpage appears simple on the surface, but in reality it ties together nearly every core protocol in computer networking. Understanding it through this workflow ensures that DNS, TCP, TLS, HTTP, IP, and ARP cease to be isolated trivia, but become harmonious stages along a unified journey.

## References

1. Computer Networking (7th Edition)
2. Illustrated HTTP
3. [What really happens when you navigate to a URL](https://stackoverflow.com/questions/2092527/what-really-happens-when-you-navigate-to-a-url)
4. [How browsers work](https://web.dev/howbrowserswork/)
