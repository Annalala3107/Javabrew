---
title: Computer Network Common Interview Questions Summary (Part 1)
description: Summary of common computer network interview questions (Part 1), covering network layering models, HTTP versions, HTTPS, DNS, WebSocket, SSE, and PING.
category: Computer Science Fundamentals
tag:
  - Computer Networks
head:
  - - meta
    - name: keywords
      content: computer network interview questions, TCP/IP four-layer model, HTTP interview, HTTPS vs HTTP, HTTP/1.1 vs HTTP/2, HTTP/3 QUIC, TCP three-way handshake, UDP differences, DNS resolution, WebSocket vs SSE, GET vs POST, application layer protocol, network layering, head-of-line blocking, PING command, ARP protocol
lang: en
sourceRef: zh-ref/cs-basics/network/other-network-questions.md
---

<!-- markdownlint-disable MD033 -->

Computer networking is an essential and high-frequency topic in backend development and campus recruitment interviews. In particular, questions regarding **TCP/IP network layering, HTTP, HTTPS, DNS, WebSocket, and the TCP three-way handshake** span across real-world development scenarios such as "what happens from entering a URL to page display," "why is an API request slow," and "why did a connection fail."

This "Computer Network Common Interview Questions Summary (Part 1)" starts with network layering models and proceeds to organize core concepts around the application layer and HTTP. It is suitable for systematic review of computer network fundamentals as well as a quick pre-interview reference checklist for Java backend, backend development, and CS fundamentals interviews.

## Computer Network Fundamentals

### Network Layering Models

#### What is the OSI 7-Layer Model? What is the function of each layer?

The **OSI 7-Layer Model** is a conceptual network layering framework proposed by the International Organization for Standardization (ISO). Its general architecture and the functions provided by each layer are shown in the figure below:

![OSI 7-layer model functional breakdown](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-7-model-955bfdf5.png)

Each layer focuses on a specific task and relies on the services provided by the layer beneath it. For instance, the transport layer utilizes the routing and addressing functions provided by the network layer to determine where data should be routed.

**While the concept of the OSI 7-layer architecture is clear and its theory is comprehensive, it is relatively complex and impractical, with certain functions duplicated across multiple layers.**

The diagram above may be somewhat abstract. Here is a more vivid and intuitive illustration sourced from an international site that illustrates the concept exceptionally well:

![OSI 7-layer model intuitive diagram](/media/jg/ext/oss.javaguide.cn/github/javaguide/osi2-8a5da370.png)

#### ⭐️ What is the TCP/IP 4-Layer Model? What is the function of each layer?

The **TCP/IP 4-Layer Model** is the model widely adopted in practice today. We can view the TCP/IP model as a streamlined version of the OSI 7-layer model, consisting of the following 4 layers:

1. Application Layer
2. Transport Layer
3. Network Layer (Internet Layer)
4. Network Interface Layer (Link Layer)

Note that the TCP/IP 4-layer model and the OSI 7-layer model do not map to each other with 100% precision, but they can be conceptually correlated as shown below:

![Correspondence between TCP/IP 4-layer model and OSI model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

For a detailed explanation of each layer's responsibilities, please refer to [OSI and TCP/IP Network Layering Models Explained (Fundamentals)](https://javaguide.cn/cs-basics/network/osi-and-tcp-ip-model.html).

#### Why is Network Layering Necessary?

Speaking of layering, let us first look at how we typically develop a backend application using common frameworks. We often divide the system into three layers based on the principle of single responsibility per layer (complex systems may have more layers):

1. Repository (Database operations)
2. Service (Business logic)
3. Controller (Client-server data interaction)

**Complex systems require layering because each layer must focus on a specific category of responsibilities. The rationale behind network layering is identical: each layer focuses only on one class of tasks.**

Now, returning to the question: "Why do networks need layering?" There are primarily 3 reasons:

1. **Independence Between Layers**: Each layer is independent. A layer does not need to know how other layers are implemented; it only needs to know how to invoke the capabilities provided by the layer below (much like invoking an interface). **This shares the exact same design philosophy as layering in software development.**
2. **Improved Flexibility and Replaceability**: Each layer can be implemented using the most suitable technology, provided that the functionality offered and the exposed interfaces remain unchanged. Furthermore, any layer can be modified or replaced as needed without disrupting the overall network architecture. **This directly aligns with the high cohesion and low coupling principles in software engineering.**
3. **Decomposing Large Problems into Smaller Ones**: Layering breaks down a complex networking problem into smaller, well-bounded, and simpler sub-problems. This makes designing, implementing, and standardizing complex computer network systems much easier. **This corresponds to the way we break down system requirements in daily engineering into smaller, more comprehensible units with clearly defined boundaries (goals and interfaces).**

There is a very famous aphorism in computer science worth sharing here:

> "All problems in computer science can be solved by another level of indirection; the entire architecture of computing is designed according to a strict hierarchical structure from top to bottom."

### Common Network Protocols

#### ⭐️ What are the Common Application Layer Protocols?

![Common application layer protocols](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/application-layer-protocol-3c7d8468.png)

- **HTTP (Hypertext Transfer Protocol)**: An application layer protocol used to transmit hypertext and multimedia content, primarily designed for communication between web clients and servers. HTTP/1.x and HTTP/2 typically run over TCP, whereas HTTP/3 runs over QUIC based on UDP.
- **SMTP (Simple Mail Transfer Protocol)**: Runs over TCP and is used for sending emails. Note ⚠️: SMTP is only responsible for sending emails, not receiving them. To retrieve emails from a mail server, POP3 or IMAP must be used.
- **POP3 / IMAP (Mail Retrieval Protocols)**: Run over TCP; both are responsible for receiving emails. IMAP is newer than POP3 and offers superior functionality and performance. IMAP supports advanced features such as searching, tagging, classifying, and archiving emails, and syncs email state across multiple devices. Almost all modern email clients and servers support IMAP.
- **FTP (File Transfer Protocol)**: Runs over TCP and is used for transferring files between computers, abstracting away underlying operating systems and file storage mechanisms. Note ⚠️: FTP is an insecure protocol because it does not encrypt data during transmission. It is recommended to use secure protocols like SFTP when transmitting sensitive data.
- **Telnet (Remote Login Protocol)**: Runs over TCP and is used to log in to remote servers via a terminal. One of Telnet's biggest drawbacks is that all data (including usernames and passwords) is sent in cleartext, posing serious security risks. This is why Telnet is rarely used today and has been largely replaced by SSH, a highly secure network transport protocol.
- **SSH (Secure Shell Protocol)**: Runs over TCP, providing secure access and file transfer services through encryption and authentication mechanisms.
- **RTP (Real-time Transport Protocol)**: Typically runs over UDP, though it also supports TCP. It provides end-to-end real-time data delivery but does not handle resource reservation or guarantee quality of service (QoS); these capabilities are implemented by technologies like WebRTC.
- **DNS (Domain Name System)**: Typically runs over UDP (port 53) to resolve mappings between domain names and IP addresses. It switches to TCP when response payloads exceed standard limits or during zone transfers.

For a detailed walkthrough of these protocols, see [Summary of Common Application Layer Protocols (Application Layer)](./application-layer-protocol.md).

#### What are the Common Transport Layer Protocols?

![Common transport layer protocols](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/transport-layer-protocol-77ea5f52.png)

- **TCP (Transmission Control Protocol)**: Provides a **connection-oriented**, **reliable** data transmission service.
- **UDP (User Datagram Protocol)**: Provides a **connectionless**, **best-effort** data transmission service (does not guarantee reliability), emphasizing simplicity and efficiency.

#### What are the Common Network Layer Protocols?

![Common network layer protocols](/media/jg/local/cs-basics/network/images/network-model/nerwork-layer-protocol-753345.png)

- **IP (Internet Protocol)**: One of the core protocols in the TCP/IP suite, operating at the network layer. Its primary role is defining packet formats and handling routing and addressing so packets can traverse networks to reach their intended destination. Currently, two major IP versions exist: the legacy IPv4 and the newer IPv6. Both are in active use today, though IPv6 was designed to replace IPv4.
- **ARP (Address Resolution Protocol)**: ARP bridges the gap between network layer addresses and link layer addresses. When an IP datagram is physically transmitted, it needs to know the physical next hop destination. Since IP addresses are logical addresses while MAC addresses are physical addresses, ARP handles resolving IP addresses into MAC addresses.
- **ICMP (Internet Control Message Protocol)**: Used to transmit network status reports and error diagnostics, commonly utilized for troubleshooting and network testing. For example, the `ping` utility uses ICMP to verify network reachability.
- **NAT (Network Address Translation)**: As the name implies, NAT translates IP addresses between private internal networks and external public networks. Specifically, within a small subnet (Local Area Network, LAN), hosts share private LAN IP addresses. Outside this LAN, across a Wide Area Network (WAN), a unified public IP address is used to identify the LAN's location on the global Internet.
- **OSPF (Open Shortest Path First)**: An Interior Gateway Protocol (IGP) and a widely used dynamic routing protocol based on the link-state algorithm. It selects optimal paths by factoring in link bandwidth, delay, and other metrics.
- **RIP (Routing Information Protocol)**: An Interior Gateway Protocol (IGP) and dynamic routing protocol based on the distance-vector algorithm. It uses hop count as its metric and selects the path with the minimum hop count as optimal.
- **BGP (Border Gateway Protocol)**: A routing protocol used to exchange Network Layer Reachability Information (NLRI) between autonomous routing domains, offering high flexibility and scalability.

## HTTP

### ⭐️ What Happens From Entering a URL to Displaying the Page? (Very Important)

> Similar interview question: When opening a webpage, which protocols are involved throughout the entire process?

Let us first examine a diagram (from *Illustrated HTTP*):

<img src="/media/jg/ext/oss.javaguide.cn/github/javaguide/url-c7005987.jpg" alt="Complete process from entering a URL to displaying the webpage" style="zoom:50%" />

Note a typo in the original diagram: it should be OSPF, not OPSF. OSPF (Open Shortest Path First) is a routing protocol developed by the Internet Engineering Task Force (IETF).

In general, the process consists of the following steps:

1. The user enters the target webpage URL into the browser.
2. The browser obtains the IP address corresponding to the domain name via the DNS protocol.
3. Based on the resolved IP address and port number, the browser initiates a TCP connection request to the target server.
4. Over the established TCP connection, the browser sends an HTTP request message to the server requesting webpage content.
5. Upon receiving the HTTP request, the server processes it and returns an HTTP response message back to the browser.
6. The browser parses the HTML in the response body, renders the DOM tree and styles, and discovers URLs of additional resources referenced in the HTML (such as images, CSS, JS). It initiates further HTTP requests to fetch these assets until the page is fully loaded and displayed.
7. When the browser no longer needs to communicate with the server, it can actively close the TCP connection or wait for the server to initiate connection termination.

For a comprehensive walkthrough, see [The Entire Process of Accessing a Webpage (Connecting Knowledge Points)](https://javaguide.cn/cs-basics/network/the-whole-process-of-accessing-web-pages.html) (highly recommended).

### ⭐️ What are HTTP Status Codes?

HTTP status codes describe the outcome of an HTTP request. For instance, `2xx` indicates that the request was processed successfully.

![Common HTTP status codes](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-status-code-4a9382f4.png)

For a more detailed summary of HTTP status codes, see [Summary of Common HTTP Status Codes (Application Layer)](https://javaguide.cn/cs-basics/network/http-status-codes.html).

### What are the Common Fields in HTTP Headers?

| Request Header Field | Description | Example |
| :--- | :--- | :--- |
| Accept | Content types (Content-Types) acceptable in the response. | Accept: text/plain |
| Accept-Charset | Character sets acceptable in the response. | Accept-Charset: utf-8 |
| Accept-Datetime | Acceptable version of the resource expressed by date/time. | Accept-Datetime: Thu, 31 May 2007 20:35:00 GMT |
| Accept-Encoding | List of acceptable transfer encodings. Refer to HTTP compression. | Accept-Encoding: gzip, deflate |
| Accept-Language | List of acceptable natural languages for the response content. | Accept-Language: en-US |
| Authorization | Authentication credentials for HTTP authentication. | Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ== |
| Cache-Control | Directives that must be obeyed by all caching mechanisms along the request/response chain. | Cache-Control: no-cache |
| Connection | Connection options preferred by the client. | Connection: keep-alive |
| Content-Length | Length of the request body expressed in octets (8-bit bytes). | Content-Length: 348 |
| Content-MD5 | Base64-encoded binary MD5 checksum of the request body content. | Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ== |
| Content-Type | MIME type of the request body (used in POST and PUT requests). | Content-Type: application/x-www-form-urlencoded |
| Cookie | An HTTP Cookie previously sent by the server via `Set-Cookie`. | Cookie: $Version=1; Skin=new; |
| Date | Date and time at which the message was originated (RFC 7231 HTTP-date format). | Date: Tue, 15 Nov 1994 08:12:31 GMT |
| Expect | Indicates specific server behaviors required by the client. | Expect: 100-continue |
| From | Email address of the user who originated the request. | From: `user@example.com` |
| Host | Domain name of the server (for virtual hosting) and TCP port number the server is listening on. Can be omitted if the port is standard. | Host: en.wikipedia.org |
| If-Match | Performs the action only if the client-provided entity matches the current entity on the server. Commonly used with PUT to update a resource only if it hasn't changed since last fetched. | If-Match: "737060cd8c284d8af7ad3082f209582d" |
| If-Modified-Since | Allows the server to return `304 Not Modified` if the requested resource has not been modified since the specified date. | If-Modified-Since: Sat, 29 Oct 1994 19:43:31 GMT |
| If-None-Match | Allows the server to return `304 Not Modified` if the requested resource's ETag has not changed. | If-None-Match: "737060cd8c284d8af7ad3082f209582d" |
| If-Range | If the entity is unchanged, send the missing part(s); otherwise, send the entire new entity. | If-Range: "737060cd8c284d8af7ad3082f209582d" |
| If-Unmodified-Since | Sends a response only if the entity has not been modified since the specified date. | If-Unmodified-Since: Sat, 29 Oct 1994 19:43:31 GMT |
| Max-Forwards | Limits the number of times the message can be forwarded by proxies and gateways. | Max-Forwards: 10 |
| Origin | Initiates a Cross-Origin Resource Sharing (CORS) request. | `Origin: http://www.example-social-network.com` |
| Pragma | Implementation-specific fields that may produce various effects anywhere in the request/response chain. | Pragma: no-cache |
| Proxy-Authorization | Authentication credentials used to authenticate against a proxy. | Proxy-Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ== |
| Range | Requests only a specific byte range of an entity. Offsets are 0-indexed. See Byte Serving. | Range: bytes=500-999 |
| Referer | Indicates the address of the previous web page from which a link to the currently requested page was followed. | `Referer: http://en.wikipedia.org/wiki/Main_Page` |
| TE | Transfer encodings the client expects to accept; can use values from the response Transfer-Encoding header. | TE: trailers, deflate |
| Upgrade | Requests the server to upgrade to another protocol. | Upgrade: HTTP/2.0, SHTTP/1.3, IRC/6.9, RTA/x11 |
| User-Agent | Identification string of the client browser / user agent. | User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0 |
| Via | Informs the server of proxies through which the request was forwarded. | Via: 1.0 fred, 1.1 example.com (Apache/1.1) |
| Warning | General warning indicating potential issues with the entity body. | Warning: 199 Miscellaneous warning |

### ⭐️ What is the Difference Between HTTP and HTTPS? (Important)

![Comparison between HTTP and HTTPS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-vs-https-99f29ca0.png)

- **Port Number**: HTTP defaults to port 80; HTTPS defaults to port 443.
- **URL Prefix**: HTTP URLs start with `http://`; HTTPS URLs start with `https://`.
- **Security and Transmission Mode**: Plain HTTP without TLS provides no confidentiality, integrity, or peer authentication by default. HTTPS secures HTTP using TLS; HTTP/1.1 and HTTP/2 typically use TLS over TCP, while HTTP/3 uses QUIC with integrated TLS 1.3. The TLS handshake authenticates the peer and establishes traffic keys, after which payload data is protected by symmetric AEAD ciphers. Certificates are primarily used for identity authentication; stating generically that "the certificate encrypts the symmetric key" is inaccurate.
- **SEO (Search Engine Optimization)**: Search engines generally favor HTTPS-enabled websites because HTTPS provides higher security and user privacy protection. Sites using HTTPS may receive preferential ranking in search results, impacting SEO positively.

For a detailed comparative breakdown, see [HTTP vs HTTPS (Application Layer)](https://javaguide.cn/cs-basics/network/http-vs-https.html).

### In the HTTPS Handshake, What is the Real Difference Between RSA and ECDHE? (Application Layer)

The core distinction between RSA and ECDHE lies in whether the session key material is **"transmitted over the wire"** or **"negotiated mathematically."**

In a TLS 1.2 static RSA handshake, the client generates the `PreMasterSecret`, encrypts it using the server's RSA public key extracted from the certificate, and sends it to the server, which decrypts it using its private key. The vulnerability is that if an attacker captures and archives handshake traffic and the server's private key is later leaked, historical session keys can be decrypted retrospectively. Hence, static RSA lacks **Forward Secrecy**.

In contrast, ECDHE never transmits the shared secret directly. Both the client and server generate ephemeral key pairs, exchange their ephemeral public keys, and independently calculate the identical shared secret locally. The server's certificate private key is used only for signing parameters to prove they were not tampered with or substituted by a man-in-the-middle, rather than decrypting session keys.

Summary in one sentence: **RSA involves the client encrypting a secret and sending it across; ECDHE involves both parties negotiating a secret using ephemeral keys. ECDHE provides forward secrecy and has thus become the modern standard for HTTPS.**

Detailed overview: [In the HTTPS Handshake, What is the Real Difference Between RSA and ECDHE? (Application Layer)](./https-rsa-vs-ecdhe.md).

### ⭐️ With HTTP Already Available, Why Do We Still Need RPC?

HTTP and RPC are not in a mutually exclusive or replacement relationship, nor is one fundamentally "superior" to the other.

Both HTTP and RPC can invoke services. The genuine difference lies in whether you model the remote call as a **"resource access"** or as a **"local-like method invocation."**

For external-facing APIs (Web, Mobile Apps, third-party integrations), HTTP is usually more appropriate: it is universal, easy to debug, has low integration costs, and can be tested using standard tools like Postman or `curl`.  
For internal service-to-service communication—especially where numerous services, deep call chains, and high call frequencies require service discovery, timeouts, retries, load balancing, and distributed tracing—RPC is often far more convenient. RPC is not merely about raw speed; it seamlessly encapsulates many complex operational requirements inherent to internal service calls.

Therefore, do not simply memorize "HTTP is for external, RPC is for internal."

While that rule of thumb helps beginners, real engineering decisions must consider target callers, team infrastructure, debugging overhead, performance requirements, and long-term maintenance costs.

If your system is modest in scale and runs smoothly on HTTP, do not force RPC adoption just to look "more microservice-oriented."

If internal calls grow increasingly intricate and you find yourself constantly adding custom HTTP SDKs, API gateways, monitoring hooks, and retry logic, that is the right time to consider RPC seriously.

Bottom line: **HTTP is not that weak, and RPC is not magic. The choice comes down to which approach solves your current problems at lower overall cost.**

Detailed overview: [⭐️ With HTTP Already Available, Why Do We Still Need RPC?](./http-vs-rpc.md).

### What is the Difference Between HTTP/1.0 and HTTP/1.1?

![Comparison between HTTP/1.0 and HTTP/1.1](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http1.0-vs-http1.1-4e93892e.png)

- **Connection Handling**: HTTP/1.0 uses short-lived connections by default, while HTTP/1.1 supports persistent connections (`keep-alive`). Persistent and short connections in HTTP essentially map to persistent and short connections at the TCP layer.
- **Status Codes**: HTTP/1.1 introduced numerous status codes; error response codes alone increased by 24. Examples include `100 (Continue)`—allowing clients to verify if the server is willing to accept a large payload before sending the body; `206 (Partial Content)`—indicating a successful range request; `409 (Conflict)`—indicating a conflict with current resource state; and `410 (Gone)`—signifying that the resource is permanently unavailable with no known forwarding address.
- **Caching Mechanism**: HTTP/1.0 primarily relied on headers like `If-Modified-Since` and `Expires` for cache validation. HTTP/1.1 introduced richer cache control mechanisms, including `Entity tag` (ETag), `If-Unmodified-Since`, `If-Match`, and `If-None-Match`, offering much finer-grained caching strategies.
- **Bandwidth Utilization**: In HTTP/1.0, bandwidth waste occurred when a client only needed a slice of a resource but the server had to deliver the entire object, with no support for resuming interrupted downloads. HTTP/1.1 introduced the `Range` request header, allowing clients to request specific parts of a resource (returning `206 Partial Content`), maximizing bandwidth efficiency.
- **Host Header Support**: HTTP/1.1 introduced the `Host` header field, enabling multiple domain names to be hosted on a single IP address (virtual hosting). HTTP/1.0 lacked the `Host` header, making virtual hosting infeasible.

For a comprehensive comparison, see [HTTP/1.0 vs HTTP/1.1 (Application Layer)](https://javaguide.cn/cs-basics/network/http1.0-vs-http1.1.html).

### ⭐️ What is the Difference Between HTTP/1.1 and HTTP/2.0?

![Comparison between HTTP/1.1 and HTTP/2.0](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http1.1-vs-http2.0-c5f37e83.png)

- **Multiplexing**: HTTP/2.0 can transmit multiple requests and responses concurrently over a single TCP connection (an evolution of HTTP/1.1 persistent connections) without mutual interference. HTTP/1.1 processes requests serially, requiring independent connections; browsers constrain concurrency by limiting connections to 6–8 per domain. Multiplexing in HTTP/2.0 reduces network latency and drastically boosts throughput.
- **Binary Framing**: HTTP/2.0 transmits data using binary frames, unlike the plaintext message format used in HTTP/1.1. Binary frames are more compact and efficient, reducing data transfer overhead and bandwidth consumption.
- **Head-of-Line (HOL) Blocking**: HTTP/2 introduced multiplexing to interleave multiple requests and responses over one TCP connection, resolving **application-layer HOL blocking** seen in HTTP/1.1. However, HTTP/2 remains susceptible to **TCP-layer HOL blocking**.
- **Header Compression**: HTTP/1.1 only supports body compression, leaving headers uncompressed. HTTP/2.0 supports header compression via the HPACK algorithm, reducing network overhead significantly.
- **Server Push**: HTTP/2.0 supports server push, allowing the server to proactively send associated resources to the client when a primary resource is requested, thereby saving round-trips and reducing latency. HTTP/1.1 requires the client to explicitly request each resource.

HTTP/2.0 Multiplexing Illustration (Source: [HTTP/2 For Web Developers](https://blog.cloudflare.com/http-2-for-web-developers/)):

![HTTP/2 multiplexing multiple requests and responses over a single TCP connection](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http2.0-multiplexing-5b8a007d.png)

As shown, HTTP/2's multiplexing mechanism enables multiple requests and responses to share a single TCP connection, eliminating the need in HTTP/1.1 to spin up multiple parallel connections for concurrent assets, thereby saving connection establishment and maintenance overhead. In HTTP/1.1, despite persistent connection support, browsers had to open multiple parallel connections per host to mitigate head-of-line blocking.

### What is the Difference Between HTTP/2.0 and HTTP/3.0?

![Comparison between HTTP/2.0 and HTTP/3.0](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http2.0-vs-http3.0-6ad26f15.png)

- **Transport Protocol**: HTTP/2 is built on TCP, whereas HTTP/3 maps HTTP semantics onto QUIC. QUIC is built on top of UDP and implements reliable delivery, congestion control, flow control, and TLS 1.3 security at the transport layer.
- **Connection Establishment**: HTTPS over HTTP/2 requires completing a TCP handshake followed by a TLS handshake. HTTP/3 integrates transport parameter negotiation and the TLS 1.3 handshake into QUIC connection establishment. New QUIC connections typically achieve 1-RTT; 0-RTT applies only to connection resumption where the client retains prior session state (though early data carries replay risks). When comparing latencies, identical benchmarks such as "time to send first request" or "time to first byte" must be used.
- **Header Compression**: HTTP/2.0 uses HPACK, whereas HTTP/3.0 uses QPACK, a header compression algorithm designed to handle out-of-order stream delivery without blocking.
- **Head-of-Line Blocking**: Multiple streams in HTTP/2 share one TCP connection; any packet loss on TCP stalls all streams on that connection. QUIC provides independent reliable ordered delivery per stream; if a packet for one stream is lost, only that stream pauses for retransmission, while other streams continue unimpeded.
- **Connection Migration**: QUIC identifies connections using a Connection ID independent of the IP/port 4-tuple. The Connection ID is not fixed to 64 bits: QUIC v1 supports IDs from 0 to 20 bytes, and endpoints can issue and retire multiple Connection IDs. When network addresses change (e.g., switching from Wi-Fi to cellular data), endpoints validate the new path and sustain the same logical connection seamlessly.
- **Error Recovery**: HTTP/3.0 features superior error recovery mechanisms that recover and retransmit lost packets faster under packet loss and high-latency network conditions, whereas HTTP/2.0 relies on standard TCP recovery mechanisms.
- **Security**: HTTP/2 typically uses TLS to protect HTTP headers and payloads, but IP/TCP headers and external TLS record layer headers remain visible. QUIC protects payload data using TLS-derived keys and applies header protection to packet numbers and partial flags; however, IP/UDP headers and certain QUIC header fields remain visible in cleartext, and messages like Version Negotiation lack cryptographic protection. It is therefore inaccurate to state that QUIC encrypts all packet headers completely.

Protocol stack comparison among HTTP/1.0, HTTP/2.0, and HTTP/3.0:

![Protocol stack comparison among HTTP/1, HTTP/2, and HTTP/3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-3-implementation-ab73b085.png)

The diagram below provides a detailed structural comparison between HTTP/2.0 and HTTP/3.0:

![Detailed comparison between HTTP/2.0 and HTTP/3.0](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http2-and-http3-stacks-comparison-164f4e33.png)

From the comparison above:

- **HTTP/2.0**: Uses TCP as its transport protocol, utilizes HPACK for header compression, and relies on TLS for encryption.
- **HTTP/3.0**: Uses QUIC over UDP, utilizes QPACK for header compression, and integrates TLS directly within QUIC. QUIC provides connection migration, congestion control and avoidance, and flow control.

For an in-depth review of the evolution from HTTP/1.0 to HTTP/3.0, reading [Engineering Optimizations from HTTP/1 to HTTP/3](https://dbwu.tech/posts/http_evolution/) is recommended.

### What is the Difference in Head-of-Line Blocking Between HTTP/1.1 and HTTP/2.0?

In HTTP/1.1, head-of-line (HOL) blocking stems from the lack of multiplexing:

- Over a single TCP connection, requests and responses are handled sequentially. If a large resource (e.g., a large file) is being transferred, subsequent smaller resources (e.g., small CSS files) must wait until the preceding resource transfer finishes.
- When browsers need to load multiple resources concurrently, they typically open multiple parallel TCP connections (usually capped at 6 per domain). However, each connection is still constrained by sequential request-response semantics, resulting in **application-layer head-of-line blocking**.

Although HTTP/2.0 introduced multiplexing to interleave multiple requests and responses over a single TCP connection—solving **application-layer HOL blocking**—it remains subject to **TCP-layer head-of-line blocking**:

- HTTP/2.0 breaks resources into binary frames and assigns unique stream IDs to each resource, allowing data from multiple resources to interleave across a single TCP connection.
- TCP, as a transport layer protocol, guarantees strictly in-order byte stream delivery. If an underlying TCP segment is lost in transit, subsequent segments that have arrived cannot be delivered to the application layer until the lost segment is retransmitted and acknowledged. This strict ordering at the transport layer causes **TCP-layer head-of-line blocking**.
- For example, if a single TCP packet carrying data for multiple HTTP/2 streams (such as JS and CSS) is dropped, all streams on that TCP connection stall while waiting for the missing packet to be retransmitted.

Summary comparison table:

| Aspect | HTTP/1.1 Head-of-Line Blocking | HTTP/2.0 Head-of-Line Blocking |
| :--- | :--- | :--- |
| **Layer** | Application layer (limitation of HTTP protocol itself) | Transport layer (limitation of TCP protocol) |
| **Root Cause** | Inability to multiplex; requests and responses must transfer sequentially | TCP requires strictly in-order delivery; packet loss halts connection progress |
| **Blast Radius** | A single slow request/response blocks subsequent requests/responses | A single dropped TCP packet stalls all HTTP/2.0 streams sharing that TCP connection |
| **Mitigation** | Opening multiple parallel TCP connections | Minimizing packet loss or using QUIC based on UDP |
| **Typical Scenarios** | Occurs constantly, especially when large files block small files | Occurs frequently in networks with noticeable packet loss rates |

### ⭐️ HTTP is a Stateless Protocol. How Can User State Be Maintained?

The HTTP protocol itself is **stateless**. This means the server cannot inherently recognize whether two consecutive requests come from the same client, nor does it recall prior actions by that user. It behaves like a forgetful waiter who does not remember who you are or what you previously ordered each time you speak to them.

However, in real-world web applications (such as e-commerce shopping carts and user login sessions), tracking user state across requests is essential. The following mechanisms are commonly used to solve this:

**Approach 1: Session Combined with Cookie (Mainstream Classic Pattern):**

![Session and Cookie authentication process](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/session-cookie-authentication-process-bd689be9.png)

This is the most classic and widely used method. The basic workflow is:

1. The user submits their username, password, and captcha to log in.
2. Once verified, the server creates a dedicated Session object for the user (a server-side data structure holding state like cart items or login credentials) and assigns it a unique `SessionID`.
3. The server sends this `SessionID` to the browser via the `Set-Cookie` directive in the HTTP response header.
4. Upon receiving the `SessionID`, the browser stores it locally as a Cookie. For subsequent requests while logged in, the browser automatically includes this Cookie containing the `SessionID`.
5. Upon receiving the request, the server extracts the `SessionID` from the Cookie, locates the matching Session object, and restores the user's identity and state.

Considerations when using Sessions:

- **Client Cookie Support**: The core functionality relies on the browser having Cookies enabled.
- **Session Expiration Management**: Expiration windows must be balanced between security and user experience.
- **Session ID Security**: Setting the `HttpOnly` flag on the Cookie prevents client-side scripts (e.g., JavaScript) from reading it, guarding against XSS theft. Setting the `Secure` flag ensures the cookie is only transmitted over HTTPS connections.

Session state is stored server-side. Common storage options include:

- **Server Memory**: Simple and fast, but data is lost on restart and does not scale across load-balanced multi-server clusters. Suitable only for trivial or low-traffic services.
- **Relational Databases (MySQL, PostgreSQL)**: Durable, but read/write throughput is relatively low; rarely used for session storage in modern production.
- **Distributed Cache (Redis)**: High performance, horizontally scalable, and supports clustered environments. This is the mainstream standard for large-scale production applications.

**Approach 2: When Cookies are Disabled: URL Rewriting**

If the client disables Cookies or Cookies cannot be used, URL rewriting serves as a fallback. The `SessionID` is appended directly to the URL as a query parameter, such as `http://www.example.com/page?sessionid=xxxxxx`. The server parses `sessionid` from the URL to retrieve the corresponding session data.

This approach is rarely used in practice due to significant drawbacks:

- URLs become lengthy and unwieldy;
- The `SessionID` is exposed in plain sight within URLs, creating serious security vulnerabilities (easily copied, shared, bookmarked, or captured in access logs);
- Unfriendly to search engine optimization (SEO).

**Approach 3: Token-Based Authentication (e.g., JWT - JSON Web Tokens)**

This increasingly popular stateless authentication pattern is especially well-suited for decoupled frontend-backend architectures and microservices.

![JWT authentication process diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-authentication-process-c0784a69.png)

Taking JWT as an example, the simplified flow is:

1. The user sends login credentials (username, password, captcha) to the server.
2. After validating credentials, the server generates a cryptographically signed Token (the JWT) and returns it to the client.
3. The client receives and stores the Token (typically in browser `localStorage`).
4. For subsequent requests, the client includes this JWT in the HTTP `Authorization` header.
5. The server validates the signature and decodes user information directly from the JWT payload without querying server-side session stores.

For in-depth explanations of JWT, see:

- [JWT Basic Concepts Explained](https://javaguide.cn/system-design/security/jwt-intro.html)
- [Analysis of Advantages and Disadvantages of JWT Authentication](https://javaguide.cn/system-design/security/advantages-and-disadvantages-of-jwt.html)

In summary, although HTTP is inherently stateless, state can be effectively tracked using Cookie + Session, URL Rewriting, or Tokens. **Cookie + Session remains the most traditional and widespread approach, while Token-based authentication has become the modern standard in distributed and API-centric architectures.**

### What is the Difference Between URI and URL?

- **URI (Uniform Resource Identifier)**: Uniquely identifies a resource.
- **URL (Uniform Resource Locator)**: Provides the specific access path to locate the resource. A URL is a concrete type of URI; it not only identifies a resource but also specifies how to locate it.

A helpful analogy: a URI functions like an identification (ID) number, whereas a URL functions like a home street address. A URL is a specialized URI that uniquely identifies the resource while providing instructions on how to reach it.

### What is the Difference Between Cookie and Session?

Strictly speaking, this topic falls under authentication and authorization. You can find a comprehensive answer in [Detailed Explanation of Basic Concepts in Authentication and Authorization](https://javaguide.cn/system-design/security/basis-of-authority-certification.html).

### ⭐️ Differences Between GET and POST

This question has been extensively discussed in developer forums, such as Zhihu: <https://www.zhihu.com/question/28586791>.

GET and POST are the two most commonly used request methods in HTTP, tailored for different scenarios and intents. They differ across several key dimensions (the most critical being semantic distinction):

- **Semantics (Primary Difference)**: GET is intended for retrieving or querying resources, whereas POST is intended for creating or modifying resources.
- **Idempotence**: GET requests are idempotent; executing the same GET request multiple times does not change the state of the resource on the server. POST requests are non-idempotent; each execution may produce side effects or alter resource state.
- **Payload Format**: GET parameters are typically appended to the URL as a query string (`querystring`). POST parameters are generally passed in the request body (`body`), which supports diverse encodings such as `application/x-www-form-urlencoded`, `multipart/form-data`, and `application/json`. The length of a GET URL is constrained by browser and server limits, whereas POST request bodies have no theoretical protocol-level size cap. Note that while GET requests can technically include a body, doing so is discouraged due to interoperability and semantic inconsistencies across clients, proxies, and web servers.
- **Caching**: Because GET is idempotent, responses can be cached by browsers, CDNs, and intermediate proxies to enhance performance. POST requests are generally not cached because they induce side effects and expect real-time processing.
- **Security**: Neither GET nor POST is secure over plain HTTP because HTTP transmits data in cleartext; HTTPS encryption is required for both. Furthermore, GET requests leak sensitive parameters more easily because query strings appear in URLs, browser history, server access logs, and referrer headers.

Reminder: Focus on grasping the **semantic differences**. In real-world engineering, semantic appropriateness dictates whether to choose GET or POST. While some teams standardize on POST for all endpoints, that is an internal architectural convention rather than standard HTTP specification.

## WebSocket

### What is WebSocket?

WebSocket is a full-duplex communication protocol operating over a single TCP connection, allowing the client and server to send and receive data simultaneously.

Born in 2008 and standardized as an RFC international standard in 2011, WebSocket is supported by virtually all modern web browsers. Furthermore, WebSocket is not restricted to browser environments; numerous programming languages, application frameworks, and server runtimes provide first-class WebSocket support.

WebSocket is fundamentally an application layer protocol designed to overcome HTTP's limitations in persistent, bidirectional communication. After a single handshake, the client and server establish a long-lived connection enabling bidirectional, low-latency data streaming.

![WebSocket establishing persistent connection for bidirectional communication](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

Common use cases for WebSocket include:

- Video live comments (Danmaku)
- Real-time notification push (see [Detailed Explanation of Web Real-Time Message Push](https://javaguide.cn/system-design/web-real-time-message-push.html))
- Real-time multiplayer gaming
- Collaborative multi-user document editing
- Instant messaging and chat applications
- ...

### ⭐️ What is the Difference Between WebSocket and HTTP?

Both WebSocket and HTTP are application layer protocols running over TCP, and both transmit data across networks.

The primary differences are:

- WebSocket is a **bidirectional, real-time** communication protocol, whereas HTTP is a **unidirectional** request-response protocol. Under HTTP, communication must be initiated by the client; the server cannot proactively push data to the client.
- WebSocket uses `ws://` or `wss://` (the TLS-encrypted version, analogous to HTTP vs. HTTPS) as its URI scheme, whereas HTTP uses `http://` or `https://`.
- WebSocket supports protocol extensions, allowing developers to define custom subprotocols, compression schemes, or encryption layers.
- WebSocket message framing is lightweight: frame headers used for protocol control are minimal, introducing negligible network overhead. HTTP messages require full header sets on every exchange, resulting in heavier overhead (though HTTP/2 mitigates this with binary framing and HPACK header compression).

### How Does WebSocket Work?

The operational lifecycle of WebSocket consists of the following steps:

1. The client sends a standard HTTP request containing headers such as `Upgrade: websocket` and `Sec-WebSocket-Key`, indicating a request to upgrade the connection protocol to WebSocket.
2. The server processes the upgrade request. If it supports WebSocket, it responds with HTTP status code `101 Switching Protocols` accompanied by headers like `Connection: Upgrade` and `Sec-WebSocket-Accept: xxx`, signaling successful protocol upgrade.
3. A persistent WebSocket connection is established between client and server, allowing bidirectional data transmission. Data travels in the form of frames (`frames`); a message may be fragmented across multiple data frames (the smallest transmission unit). The sender splits messages into frames, and the receiver reassembles them into complete messages upon receipt.
4. Either the client or server can initiate connection termination by sending a Close frame. Upon receiving it, the other party acknowledges with a corresponding Close frame, and both sides terminate the underlying TCP connection.

Additionally, after establishing a WebSocket connection, a heartbeat ping/pong mechanism is employed to verify liveness and preserve connection stability through intermediate proxies and NAT gateways.

### ⭐️ Differences Between WebSocket, Short Polling, and Long Polling

All three techniques aim to solve the same problem: **how a client can retrieve updated data from a server in near real-time**. However, their implementations, resource efficiency, and latency profiles vary considerably.

**1. Short Polling**

- **Mechanism**: The client sends periodic HTTP requests at fixed intervals (e.g., every 5 seconds) asking the server for updates. The server responds immediately upon receiving each request.
- **Advantages**: Simple to implement, universally compatible, uses standard HTTP infrastructure.
- **Disadvantages**:
  - **Mediocre Timeliness**: Messages arriving between polling intervals must wait until the next request to be delivered.
  - **High Resource Waste**: Repeatedly establishing and tearing down connections when most requests return "no new data" places unnecessary load on servers and networks.

**2. Long Polling**

- **Mechanism**: The client initiates an HTTP request. If the server has no new data, it holds the connection open until new data becomes available or a timeout occurs before responding. Upon receiving the response, the client immediately issues the next request, achieving pseudo-real-time behavior.
- **Advantages**:
  - **Better Timeliness**: Data is pushed immediately when available without waiting for a fixed interval timer.
  - **Fewer Empty Responses**: Reduces futile empty poll responses, improving efficiency compared to short polling.
- **Disadvantages**:
  - **Server Resource Consumption**: Holding open numerous connections consumes server threads, file descriptors, and memory.
  - **Repetitive Connection Overhead**: Every message delivery completes an HTTP cycle requiring a new connection to be opened, remaining bound to HTTP's unidirectional request-response nature.

**3. WebSocket**

- **Mechanism**: After an initial HTTP Upgrade handshake, a persistent TCP connection is established. Both parties can then actively and asynchronously transmit messages at any moment, enabling genuine full-duplex, low-latency communication.
- **Advantages**:
  - **High Real-Time Performance**: Immediate bidirectional data exchange with minimal latency.
  - **Resource Efficient**: A single connection persists without repeated setup/teardown cycles, drastically reducing CPU and bandwidth overhead.
  - **Feature-Rich**: Supports proactive server push and client-initiated messaging symmetrically.
- **Disadvantages**:
  - **Compatibility Constraints**: Requires both client and server to support the WebSocket protocol. Requires connection management mechanisms (heartbeats, reconnect logic, state synchronization).
  - **Implementation Complexity**: More complex to implement, scale, and load balance than basic HTTP polling.

![Comparison of communication mechanisms among WebSocket, Short Polling, and Long Polling](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

### ⭐️ What is the Difference Between SSE and WebSocket?

SSE (Server-Sent Events) and WebSocket are both technologies that enable servers to push real-time updates to browsers, allowing web content to update dynamically without manual user refreshes. Despite sharing similar goals, they differ fundamentally in operational mechanics and target scenarios:

1. **Communication Directionality:**
   - **SSE:** **Unidirectional communication**. Only the server can push data to the client (browser). The client cannot send data back over the same connection (it must issue separate HTTP requests).
   - **WebSocket:** **Bidirectional communication (Full-Duplex)**. Both client and server can send messages to each other over the same connection at any time, supporting interactive real-time experiences.
2. **Underlying Protocol:**
   - **SSE:** Built on **standard HTTP/HTTPS protocols**. It is essentially an HTTP persistent connection where the server holds the response stream open and transmits event streams (`text/event-stream`). It requires no specialized protocol gateways and works seamlessly with existing HTTP infrastructure (reverse proxies, load balancers, CDNs).
   - **WebSocket:** Operates over the **dedicated `ws://` or `wss://` protocol**. It requires an HTTP "Upgrade" handshake to establish the connection, and servers must implement dedicated protocol handling for WebSocket connection frames and message lifecycle.
3. **Complexity and Development Cost:**
   - **SSE:** **Relatively straightforward to implement**, primarily requiring server-side streaming logic. Browsers provide the standard `EventSource` API, making frontend integration trivial with low maintenance overhead.
   - **WebSocket:** **Noticeably more complex**. Servers require dedicated WebSocket connection management, and clients must use WebSocket client APIs. Implementing edge cases like heartbeats, reconnect handling, and clustering involves higher engineering overhead.
4. **Automatic Reconnection:**
   - **SSE:** **Natively supported by browsers**. The browser `EventSource` API handles reconnection and message synchronization automatically when connections drop.
   - **WebSocket:** **Requires manual implementation**. Developers must write client-side logic to detect disconnects, calculate exponential backoffs, and trigger reconnect attempts.
5. **Data Types:**
   - **SSE:** **Designed primarily for text payloads** (UTF-8 encoded). Binary data must be encoded into text formats (such as Base64) before transmission.
   - **WebSocket:** **Natively supports both text and binary data** (e.g., ArrayBuffer, Blob) without supplementary encoding.

Given its simplicity, efficiency, and alignment with standard HTTP semantics, **Server-Sent Events (SSE) has become the industry standard choice for streaming responses in Large Language Model (LLM) APIs (e.g., OpenAI, DeepSeek)**.

Taking DeepSeek as an example, opening browser developer tools during a chat completion confirms this architecture:

![DeepSeek response headers](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/deepseek-sse-575a911b.png)

![DeepSeek SSE response using text/event-stream for continuous event streaming](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/deepseek-sse-eventstream-f35c5785.png)

As shown, the response headers contain `Content-Type: text/event-stream`, verifying that SSE is in use and data chunks stream continuously to the client.

## PING

### What is the Purpose of the PING Command?

The PING command is a fundamental network diagnostic utility used to test end-to-end host reachability and measure round-trip network latency.

Here is an example pinging Baidu:

```bash
# Send 4 PING request packets to www.baidu.com
❯ ping -c 4 www.baidu.com

PING www.a.shifen.com (14.119.104.189): 56 data bytes
64 bytes from 14.119.104.189: icmp_seq=0 ttl=54 time=27.867 ms
64 bytes from 14.119.104.189: icmp_seq=1 ttl=54 time=28.732 ms
64 bytes from 14.119.104.189: icmp_seq=2 ttl=54 time=27.571 ms
64 bytes from 14.119.104.189: icmp_seq=3 ttl=54 time=27.581 ms

--- www.a.shifen.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 27.571/27.938/28.732/0.474 ms
```

The output of the PING command typically provides the following information:

1. **ICMP Echo Request Information**: Sequence number (`icmp_seq`), Time to Live (`ttl`) value.
2. **Target Host Domain or IP Address**: Illustrated in the first line of output.
3. **Round-Trip Time (RTT)**: The total elapsed duration from dispatching an ICMP Echo Request to receiving the matching ICMP Echo Reply, measuring connection latency.
4. **Summary Statistics**: Number of ICMP packets transmitted, packets received, packet loss percentage, and min/avg/max/stddev RTT values.

If the target host fails to return responses, network connectivity between the two nodes is impaired (note that some network administrators or firewalls deliberately disable ICMP responses). If RTT is unusually elevated, excessive network latency exists along the path.

### How Does the PING Command Work?

PING operates at the network layer on top of **ICMP (Internet Control Message Protocol)**. Its core mechanism relies on dispatching and receiving ICMP datagrams across the network.

ICMP packets include a Type field identifying the message category. While many ICMP message types exist, they broadly divide into two categories:

- **Query Messages**: Sent to request information from a target host with the expectation of a reply.
- **Error Messages**: Dispatched to the source host to notify it of network routing, delivery, or parameter errors.

The ICMP Echo Request (Type 8) and ICMP Echo Reply (Type 0) utilized by PING are query messages.

- The PING command sends an ICMP Echo Request to the target host.
- If network reachability and host status are normal, the target host generates and returns an ICMP Echo Reply.

### ⭐️ If Ping Succeeds, is a TCP Connection Guaranteed to Succeed?

Short answer: **No**.

Ping uses ICMP (network layer), whereas TCP connections operate over TCP (transport layer). While both traverse the same physical network path, intermediate routing and security devices inspect traffic differently based on protocol type, destination port, connection state, and firewall policies. A successful Ping confirms only that the bidirectional ICMP Echo path works; it does not guarantee that the target TCP port is reachable.

![Differences between ICMP and TCP paths](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-ping-but-tcp-may-not-connect-icmp-and-tcp-pa-5e8a0530.png)

Common reasons for this discrepancy include:

- **Divergent Firewall Policies**: Many network devices permit ICMP (to facilitate operational monitoring) while strictly clamping down on TCP ports, opening only specific ports like `22`, `80`, or `443` and dropping all others.
- **Service Not Running or Port Not Listening**: The operating system responds to ICMP requests, but the target application (e.g., Nginx or MySQL) has crashed or is not bound to the queried port. Ping succeeds, but TCP connections fail.
- **Intermediate NAT / Load Balancers / Security Gateways**: The public IP might front an intermediate edge proxy rather than a physical backend server. The ICMP reply may originate from the edge device without reflecting backend application availability.
- **HTTPS Blocked at TLS SNI Stage**: The TCP three-way handshake may complete successfully, but the Server Name Indication (SNI) inside the `ClientHello` gets flagged and blocked by intermediate inspection firewalls, resetting or freezing the connection.

The converse also holds true: **A failed Ping does not mean TCP is unreachable**. Many enterprise servers and cloud security groups disable ICMP entirely for stealth and security, while business TCP ports operate perfectly.

Troubleshooting guideline: Start with DNS resolution (for domain names), use `ping` to evaluate ICMP reachability, test the target port using `nc` (netcat), and finally diagnose HTTPS / TLS handshakes using `curl` or `openssl s_client`. Never jump to definitive conclusions based on a single command.

![HTTPS connection troubleshooting hierarchy](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-ping-but-tcp-may-not-connect-https-connectio-3fcb5151.png)

Detailed overview: [If Ping Succeeds, is a TCP Connection Guaranteed to Succeed?](./can-ping-but-tcp-may-not-connect.md).

## DNS

### What is the Purpose of DNS?

The Domain Name System (DNS) is the critical first protocol invoked when a user accesses a website through a browser. The primary purpose of DNS is to resolve **mappings between human-readable domain names and machine-routable IP addresses**.

![Overview of DNS resolving domain names to IP addresses](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/dns-overview-4619e349.png)

On a client machine, DNS lookups first check browser caches, OS resolver caches, and local router caches. If no cached mapping is found, DNS resolution begins across the broader network hierarchy.

DNS is designed as a distributed, hierarchical database system. **DNS is an application layer protocol operating over UDP or TCP on port 53**.

### What Types of DNS Servers Exist? How Many Root Servers Are There?

DNS can be described from two perspectives. The authoritative hierarchy comprises Root, Top-Level Domain (TLD), and Authoritative servers for specific zones. The query-side architecture includes stub resolvers, recursive resolvers, and forwarders. A single software suite or physical machine can fulfill multiple roles; thus, these categories represent functional roles rather than mutually exclusive hardware silos.

- **Root DNS Servers**: Direct querying resolvers toward authoritative servers for Top-Level Domains (TLDs).
- **Top-Level Domain (TLD) Servers**: Return referral information pointing to authoritative servers for the specific domain zone.
- **Authoritative DNS Servers**: Hold official DNS records for one or more zones and deliver authoritative answers to queries regarding those zones.
- **Recursive Resolvers**: Receive queries from client devices, inspect local cache, and iteratively query root, TLD, and authoritative servers on behalf of the client. They reside on the query side and do not constitute an authoritative tier in the DNS naming hierarchy.

The root server system logically consists of 13 named root server identities, designated from `a.root-servers.net` to `m.root-servers.net`, managed by 12 independent operating organizations. Behind each logical identity, hundreds of physical server instances are deployed globally via Anycast routing. The number and locations of these physical instances change continually; consult [Root-Servers.org](https://root-servers.org/) for real-time deployment data. One must never misunderstand the 13 logical identities as meaning there are only 13 physical servers worldwide.

### ⭐️ What is the DNS Resolution Process?

Because the complete DNS lookup journey involves multiple steps, I have authored a dedicated comprehensive article: [DNS Domain Name System Explained (Application Layer)](https://javaguide.cn/cs-basics/network/dns.html).

### Do You Understand DNS Hijacking? How to Mitigate It?

DNS hijacking is a cyberattack where attackers tamper with DNS resolution results, causing requested domain names to resolve to incorrect IP addresses. As a result, users are prevented from reaching legitimate websites or redirected to malicious clone sites. DNS hijacking is also referred to as DNS redirection, DNS spoofing, or DNS cache poisoning.

## References

- *Illustrated HTTP*
- *Computer Networking: A Top-Down Approach* (7th Edition)
- Comprehensive Analysis of HTTP/2.0 and HTTPS: <https://juejin.cn/post/7034668672262242318>
- Complete HTTP Request Headers Dictionary: <https://www.flysnow.org/tools/table/http-request-headers/>
- HTTP1, HTTP2, and HTTP3: <https://juejin.cn/post/6855470356657307662>
- How to View HTTP/3? - Zhihu Answer: <https://www.zhihu.com/question/302412059/answer/533223530>
