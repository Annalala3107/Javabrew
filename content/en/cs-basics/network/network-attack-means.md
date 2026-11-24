---
title: Summary of Common Network Attack Methods (Security)
description: Summary of common TCP/IP attacks and defense strategies, covering DDoS, IP/ARP spoofing, Man-in-the-Middle, and emphasizing engineering defense practices.
category: Computer Science Basics
tag:
  - Computer Networks
head:
  - - meta
    - name: keywords
      content: Network Attacks, DDoS, IP Spoofing, ARP Spoofing, Man-in-the-Middle Attack, Scanning, Defense
lang: en
sourceRef: zh-ref/cs-basics/network/network-attack-means.md
---

> This article was reorganized and improved from [Common TCP/IP Attack Methods - Nuanlan Notes - 2021](https://mp.weixin.qq.com/s/AZwWrOlLxRSSi-ywBgZ0fA).

The TCP/IP protocol suite was designed for interconnection and intercommunication, but many mechanisms did not initially consider today's attack scale and adversarial intensity.

Attacks like IP spoofing, SYN Flood, DDoS, ARP spoofing, and DNS hijacking seem different on the surface, but in essence, they all exploit trust assumptions, resource consumption points, or resolution chains within network protocols.

This article mainly answers several questions:

1. What mechanisms do common TCP/IP attack methods exploit?
2. How do attacks such as IP spoofing, SYN Flood, and DDoS occur?
3. What impact do common network attacks cause?
4. What are the basic defense strategies when facing these attacks?

## IP Spoofing

### What Is IP?

In a network, all devices are assigned an address. This address is like someone's home address, such as "**Street Number, Room Number**": the "Street Number" is assigned to the entire subnet, while the "Room Number" corresponds to the specific computer within the subnet. This is the network address. The "Street Number" corresponds to the network number, and the "Room Number" corresponds to the host number; the entirety of this address is the **IP address**.

### What Can We Know from an IP Address?

Through an IP address, we can determine the location of the target server being accessed, thereby sending messages to that server. Generally, a message sent by a sender first passes through a subnet hub/switch, is forwarded to the nearest router, and then accesses subsequent router locations according to routing tables until reaching the final destination.

**IP Header Format**:

![IP Packet Header Field Format](/media/jg/ext/oss.javaguide.cn/p3-juejin/843fd07074874ee0b695eca659411b42-tplv-k3u1fbpfcp-f6cb91e7.png)

### What Is IP Spoofing Technology?

It is deception—fraud and trickery!

IP spoofing is a technique of forging the IP address of a host. By disguising the IP address, one host can impersonate another host, which often has specific privileges or is trusted by other hosts.

Suppose a legitimate user **(1.1.1.1)** has already established a TCP connection with a server. An attacker can attempt to send a forged RST segment with a source IP of **1.1.1.1** to abort the connection. However, forging only the source IP is not enough: the segment must also match the connection 4-tuple and pass the receiver's sequence number validation for RST packets. An on-path attacker can observe connection sequence numbers; an off-path attacker unable to inspect traffic must guess an acceptable sequence number. Furthermore, modern TCP implementations may mitigate blind RST attacks via Challenge ACKs.

If the forged RST passes validation, the server closes the corresponding connection. Data subsequently sent by the legitimate user can no longer reuse this connection and must re-establish it. Because the attacker must acquire or guess connection parameters, this type of attack does not necessarily succeed simply by forging a large number of source IPs and sending arbitrary RST packets.

![Attacker Forging Source IP to Send RST Segment Aborting Legitimate Connection](/media/jg/ext/oss.javaguide.cn/p3-juejin/7547a145adf9404aa3a05f01f5ca2e32-tplv-k3u1fbpfcp-d4b2a905.png)

### How to Mitigate IP Spoofing?

Although IP spoofing cannot be entirely prevented, measures can be taken to prevent forged packets from penetrating the network. **Ingress Filtering** is an extremely common defense against spoofing, as outlined in BCP 38 (Best Current Practice). Ingress filtering is a form of packet filtering typically implemented on [network edge](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/) devices. It inspects incoming IP packets and determines their source headers. If the source header does not match its origin or appears suspicious, the packet is rejected. Some networks also implement egress filtering to inspect outgoing IP packets, ensuring they have legitimate source headers to prevent internal network users from launching outbound attacks using IP spoofing.

## SYN Flood

### What Is a SYN Flood?

A SYN Flood is one of the earliest and most classic DDoS (Distributed Denial of Service) attacks on the Internet, designed to exhaust available server resources so that the server cannot process legitimate traffic.

SYN Flood exploits the TCP three-way handshake mechanism. Attackers typically use tools or control botnets to flood a server with massive TCP SYN packets with spoofed source IP addresses or randomized source ports. After the server responds to these packets, a large number of half-open connections are generated. Once system resources are exhausted, the server can no longer provide normal services.

Increasing server hardware performance or connection capacity is a drop in the ocean against the massive volume of SYN Flood packets. The key to defending against a SYN Flood lies in identifying which connection requests come from legitimate sources and blocking non-authentic requests to ensure legitimate business traffic is served.

![SYN Flood Attack Exhausting Server Resources with Massive Half-Open Connections](/media/jg/ext/oss.javaguide.cn/p3-juejin/2b3d2d4dc8f24890b5957df1c7d6feb8-tplv-k3u1fbpfcp-e00505c9.png)

### What Is the Mechanism of a TCP SYN Flood Attack?

A **TCP SYN Flood** attack exploits the TCP three-way handshake (**SYN -> SYN/ACK -> ACK**). Assume the connection initiator is A and the receiver is B, where B is listening on a specific port for connection requests from A, as illustrated below (A on the left, B on the right).

![Normal Flow of Establishing a Connection via TCP Three-Way Handshake](/media/jg/ext/oss.javaguide.cn/p3-juejin/a39355a1ea404323a11ca6644e009183-tplv-k3u1fbpfcp-3a232ac7.png)

A first sends a **SYN** (Synchronization) message to B, requesting B to prepare to receive data; upon receipt, B responds with a **SYN-ACK** (Synchronization-Acknowledgement) message to A. This message serves two purposes:

- Confirms to A that B is ready to receive data,
- Asks A to also prepare to receive data. At this point, B has confirmed its receiving state to A and awaits A's confirmation; the connection enters a **half-open state (Half-Open)**. Upon receiving this, A sends an **ACK** (Acknowledgement) message to B confirming readiness. At this point, the three-way handshake is complete and the connection is established.

Notice that the most critical point is whether both parties have entered a **state capable of receiving messages** according to each other's requirements. Confirming this state relies primarily on the **Sequence Number (SequenceNum)** both parties will use. To ensure messages arrive at the receiving upper-layer application in transmission order, TCP uses sequence numbers to track packet ordering.

TCP is a **duplex (Duplex)** connection supporting bidirectional communication simultaneously. The **SYN** and **SYN-ACK** messages open the unidirectional channel from A to B (B learns A's sequence number); the **SYN-ACK** and **ACK** messages open the unidirectional channel from B to A (A learns B's sequence number).

The discussion above assumes normal, honest communication between both parties.

However, in reality, network instability may cause packet loss so handshake messages fail to reach the other side, or the other party may deliberately violate rules by delaying or omitting handshake acknowledgments.

Assume B provides services on a TCP port. When B receives A's **SYN** message, B actively replies with a **SYN-ACK**, placing the connection into a **half-open state**. Because B cannot be certain whether its **SYN-ACK** or A's ACK was lost in transit, B sets a **Timer** for each pending half-open connection. If no ACK arrives before timeout, B retransmits the **SYN-ACK** to A, abandoning it only after exceeding a retry threshold.

![Massive Half-Open Connections Occupying Server Resources in SYN Flood](/media/jg/ext/oss.javaguide.cn/p3-juejin/7ff1daddcec44d61994f254e664987b4-tplv-k3u1fbpfcp-cf454bde.png)

To help A connect successfully, B must **allocate kernel resources** to maintain the half-open connection. When B faces massive requests like A (as shown above), a **SYN Flood** attack is formed. Attacker A can control botnet machines to send huge volumes of SYN messages to B without replying with ACKs, or forge the **Source IP** in SYN messages so B's **SYN-ACK** messages go nowhere. Consequently, B is overwhelmed by doomed half-open connections until resources are exhausted, ceasing to respond to legitimate requests.

### What Are the Common Forms of SYN Flood?

Malicious actors can launch SYN Flood attacks in three different ways:

1. **Direct Attack:** A SYN flood that does not forge IP addresses is called a direct attack. In this attack, attackers do not mask their IP addresses at all. Because the attack originates from single-source devices with real IP addresses, discovering and mitigating the attacker is straightforward. To keep target machines in a half-open state, attackers prevent their machines from responding to the server's SYN-ACK packets, usually by configuring firewall rules to drop all outgoing non-SYN packets or filtering incoming SYN-ACKs. In practice, this method is rarely used because it is trivial to mitigate by simply blocking the attacker's IP. Even when using botnets (such as the [Mirai botnet](https://www.cloudflare.com/learning/ddos/glossary/mirai-botnet/)), infected device IPs are usually not intentionally obscured.
2. **Spoofed Attack:** Attackers can also forge the IP address of each SYN packet they send to hinder mitigation and make tracing difficult. Although packets are disguised, they can still be traced back to their origin. Such detection is challenging but feasible, especially with ISP assistance.
3. **Distributed Attack (DDoS):** If a botnet is used, the likelihood of tracing the attack source is very low. With increasing obfuscation, attackers may command each distributed device to spoof the source IPs of packets sent. Even with botnets like Mirai, infected device IPs are often not masked.

### How to Mitigate SYN Flood?

#### Increasing Backlog Queue Size

Every operating system on target devices permits a certain number of half-open connections. One way to respond to high volumes of SYN packets is to increase the maximum allowed half-open connections. To expand the maximum backlog, the system must reserve additional memory to handle new requests. If the system lacks sufficient memory, increasing the backlog queue can negatively impact system performance, but it is still better than denial of service.

#### Recycling the Oldest Half-Open TCP Connections

Another mitigation strategy is to overwrite the oldest half-open connection once the backlog is filled. This strategy requires legitimate connections to complete faster than malicious SYN packets fill the backlog. When attack volume increases or the backlog size is insufficient, this defense becomes ineffective.

#### SYN Cookie

This strategy requires the server to generate a Cookie. To avoid dropping connections when the backlog is full, the server responds to each connection request with a SYN-ACK packet containing a cryptographic cookie as its initial sequence number, and then discards the SYN request from memory without allocating resources. The port remains open and ready. If the connection is legitimate and the final ACK packet is returned from the client, the server reconstructs the SYN backlog entry from the cookie (with some limitations). Although this mitigation loses some TCP connection state parameters, it prevents denial of service against legitimate users.

## UDP Flood

### What Is a UDP Flood?

A **UDP Flood** is a denial-of-service attack that sends large volumes of User Datagram Protocol (**UDP**) packets to a target server to overwhelm its processing and response capacity. Firewalls protecting the target server may also be exhausted by the UDP flood, resulting in denial of service to legitimate traffic.

### What Is the Mechanism of a UDP Flood Attack?

A **UDP Flood** primarily exploits the steps a server takes when responding to UDP packets sent to its ports. Under normal circumstances, when a server receives a UDP packet on a specific port, it goes through two steps:

- The server first checks if a program is listening for requests on the specified port.
- If no program is receiving packets on that port, the IPv4 protocol stack typically returns an **ICMP Destination Unreachable** message with Type 3 and Code 3 (**Port Unreachable**). (Note: This is not the ICMP Echo message used by Ping; in real networks, such ICMP errors may also be dropped by firewalls or rate-limited by the OS protocol stack).

Consider an analogy: suppose someone calls a hotel asking for a guest. The receptionist receives the call, checks the room directory to ensure the guest is present, and then transfers the call. If suddenly all incoming telephone lines ring simultaneously with calls asking for non-existent guests, the receptionists are quickly overwhelmed.

As the server receives each new UDP packet, it consumes resources processing and responding to it. In a DDoS attack of this type, attackers rarely use their real IP addresses; instead, they spoof the source IP of UDP packets, concealing their true location and potentially saturating return bandwidth.

Because the target consumes resources inspecting and replying to every received UDP packet, a flood of UDP packets quickly exhausts the target's resources, denying service to normal traffic.

![UDP Flood Consuming Server Resources via Massive UDP Packets](/media/jg/ext/oss.javaguide.cn/p3-juejin/23dbbc8243a84ed181e088e38bffb37a-tplv-k3u1fbpfcp-1d08ee4f.png)

### How to Mitigate UDP Flood?

Most operating systems rate-limit ICMP response packets to disrupt DDoS attacks requiring ICMP responses. One downside is that legitimate packets may also be filtered during an attack. If the volume of the UDP Flood is high enough to saturate the state tables of firewalls protecting the server, any mitigation at the server level will be insufficient against upstream bottlenecks.

## HTTP Flood

### What Is an HTTP Flood?

An HTTP Flood is a volumetric DDoS (Distributed Denial of Service) attack designed to overwhelm a target server using HTTP requests. Once the target is saturated with requests and cannot respond to normal traffic, denial of service occurs, turning away real users.

![HTTP Flood Overwhelming Target Server via Massive Application Layer Requests](/media/jg/ext/oss.javaguide.cn/p3-juejin/aa64869551d94c8d89fa80eaf4395bfa-tplv-k3u1fbpfcp-374ce8b2.png)

### What Is the Mechanism of an HTTP Flood Attack?

HTTP flood attacks are "Layer 7" DDoS attacks. Layer 7 is the application layer of the OSI model, referring to protocols such as HTTP. HTTP forms the foundation of browser-based web requests, commonly used to load web pages or transmit form data. Mitigating application layer attacks is particularly complex because malicious traffic is difficult to distinguish from legitimate traffic.

For maximum impact, malicious actors usually deploy botnets. By harnessing many devices infected with malware, attackers generate massive traffic volumes.

There are two primary forms of HTTP flood attacks:

- **HTTP GET Attack**: Multiple computers coordinate to send requests for images, files, or other heavy assets to the target server. When the target is flooded with incoming requests and outgoing responses, legitimate requests are dropped.
- **HTTP POST Attack**: When submitting a form on a website, the server must process the incoming request and push data to a persistence layer (usually a database). Compared to the bandwidth and processing power required to send a POST request, processing form data and executing database queries is far more resource-intensive. This attack exploits this asymmetric resource consumption by blasting numerous POST requests directly at the target until server capacity is exhausted.

### How to Protect Against HTTP Flood?

As noted, mitigating Layer 7 attacks is complex and requires multi-layered defenses. One approach is issuing challenges to requesting devices to verify whether they are bots, similar to CAPTCHA tests used during account registration. Enforcing JavaScript computational challenges can mitigate many automated attacks.

Other avenues to stop HTTP floods include using Web Application Firewalls (WAF), maintaining IP reputation databases to track and selectively block malicious traffic, and behavioral analysis. Cloudflare leverages its vast network scale to analyze traffic from diverse sources and eliminate application layer DDoS traffic through rapidly updated WAF rules and mitigation policies.

## DNS Flood

### What Is a DNS Flood?

Domain Name System (DNS) servers are the "phonebooks" of the Internet; Internet devices query these servers to find specific web servers to access content. A DNS Flood is a distributed denial-of-service attack where attackers overwhelm a domain's DNS servers with massive query traffic to disrupt DNS resolution. If users cannot access the phonebook, they cannot look up the IP addresses required to access resources. By interrupting DNS resolution, DNS Flood impairs a website, API, or web application's ability to serve legitimate traffic. It is difficult to distinguish DNS flood attacks from legitimate traffic spikes because queries often come from multiple unique addresses querying legitimate records for that domain.

### What Is the Mechanism of a DNS Flood Attack?

![DNS Flood Overwhelming DNS Server with Massive DNS Queries](/media/jg/ext/oss.javaguide.cn/p3-juejin/97ea11a212924900b10d159226783887-tplv-k3u1fbpfcp-3705dc3c.png)

The function of DNS is converting human-friendly names (e.g., `example.com`) into numerical server addresses (e.g., `192.168.0.1`), so successfully attacking DNS infrastructure prevents users from accessing the Internet. DNS Flood attacks proliferated with the rise of high-bandwidth [Internet of Things (IoT)](https://www.cloudflare.com/learning/ddos/glossary/internet-of-things-iot/) [botnets](https://www.cloudflare.com/learning/ddos/what-is-a-ddos-botnet/) (such as [Mirai](https://www.cloudflare.com/learning/ddos/glossary/mirai-botnet/)). DNS Flood attacks utilize high-bandwidth connections of IP cameras, DVR boxes, and other IoT devices to directly flood DNS servers of major providers, preventing legitimate users from resolving domains.

DNS Flood attacks differ from [DNS Amplification Attacks](https://www.cloudflare.com/zh-cn/learning/ddos/dns-amplification-ddos-attack/). DNS amplification attacks reflect and amplify traffic off insecure recursive DNS servers to hide the attack source and magnify traffic volume. They send small requests for large DNS records to open resolvers while spoofing the victim's source IP, magnifying the attack payload. In contrast, DNS floods hit the authoritative server directly with massive query volumes.

### How to Protect Against DNS Flood?

DNS Flood represents an evolution beyond traditional amplification attacks. With readily accessible high-bandwidth botnets, attackers can target large organizations directly. Unless compromised IoT devices are patched or replaced, the primary defense against such attacks is operating an ultra-large, highly distributed DNS infrastructure capable of monitoring, absorbing, and filtering attack traffic in real time.

## TCP Reset Attack

In a **TCP** Reset attack, an attacker sends forged RST packets to one or both communicating endpoints to trick the receiver into closing the connection prematurely. Whether TCP sends or accepts an RST depends on the current connection state as well as fields like sequence numbers and acknowledgment numbers. For an established connection, the receiver closes the connection only after the RST passes sequence number validation; out-of-window RSTs are dropped, and endpoints implementing RFC 5961 protections send a Challenge ACK for in-window RSTs that do not match the exact expected sequence number.

A **TCP** Reset attack exploits this mechanism by spoofing reset segments. If the forged reset segment looks completely authentic, the receiver considers it valid and closes the TCP connection, preventing further data exchange. The server can create a new TCP connection to restore communication, but it may be reset again. Fortunately, attackers need time to sniff and craft forged packets, so this attack is typically lethal only to long-lived connections. For short-lived connections, data exchange usually concludes before the attack can be executed.

Standard TCP provides no cryptographic authentication of TCP headers, so TLS cannot protect the TCP layer's RST. When low-layer packet validation is necessary, mechanisms like IPsec or TCP-AO can be employed, though they require support from both communicating endpoints and the network environment.

## Simulating the Attack

> The following experiment was conducted on macOS (`OSX`). Please adapt accordingly for other systems.

To forge a TCP reset packet, an attacker must:

- Sniff traffic exchanged between the two communicating parties.
- Intercept a segment with the `ACK` flag set to 1 and read its `ACK` number.
- Forge a TCP reset segment (`RST` flag set to 1) whose sequence number matches the intercepted `ACK` number. This is an idealized scenario assuming communication is not excessively rapid. In most real cases, sending multiple reset packets with varying sequence numbers increases success rates.
- Send the forged reset packet to one or both parties to abort the connection.

For simplicity, we can use `localhost` on a single machine to communicate with ourselves and launch a TCP reset attack against the local connection:

- Establish a TCP connection between two terminal windows.
- Write an attack program capable of sniffing traffic between the two terminals.
- Modify the attack program to forge and send reset packets.

Let's begin the experiment.

> Establishing a TCP Connection

We can use `netcat` to establish a TCP connection, which is pre-installed on many operating systems. Open the first terminal window and run:

```bash
nc -nvl 8000
```

This starts a TCP listener on port `8000`. Next, open a second terminal window and run:

```bash
nc 127.0.0.1 8000
```

This connects to the listener. Typing characters into either window transmits them across the TCP connection and prints them on the other.

![Establishing Local TCP Connection and Transferring Data Using nc](/media/jg/ext/oss.javaguide.cn/p3-juejin/df0508cbf26446708cf98f8ad514dbea-tplv-k3u1fbpfcp-25fb1b9c.gif)

> Sniffing Traffic

Write an attack script using the Python networking library `scapy` to capture data exchanged between the two terminals and print it. The core logic invokes `scapy`'s sniffing function:

![Code Using Scapy to Sniff Local TCP Packets](/media/jg/ext/oss.javaguide.cn/p3-juejin/27feb834aa9d4b629fd938611ac9972e-tplv-k3u1fbpfcp-1e00f3a6.png)

This code instructs `scapy` to sniff packets on interface `lo0` and log details of the TCP connection:

- **iface**: Instructs scapy to listen on the `lo0` (localhost) network interface.
- **lfilter**: A filter telling scapy to ignore packets not belonging to the specified TCP connection (both endpoints on `localhost`, port `8000`).
- **prn**: Callback function that scapy runs on all packets matching `lfilter`. The snippet prints packets to the terminal; later we modify this function to craft reset packets.
- **count**: The number of packets to sniff before the scapy function returns.

> Sending Forged Reset Packets

Modify the program to forge TCP reset packets. Update the `prn` callback to inspect packets, extract parameters, and craft and dispatch a TCP RST packet.

For example, suppose the script intercepts a segment sent from (`src_ip`, `src_port`) to (`dst_ip`, `dst_port`) with the ACK flag set and ACK number `100,000`. The attack script proceeds as follows:

- Because the forged packet is a response to the intercepted packet, swap the IPs and ports: the forged packet's source `IP/Port` is the intercepted packet's destination `IP/Port`, and vice versa.
- Set the `RST` flag to 1.
- Set the sequence number of the forged packet to the intercepted packet's ACK number, matching the next sequence number expected by the sender.
- Call `scapy`'s `send` method to dispatch the forged packet to the sender of the intercepted segment.

With the TCP connection established, run the attack program in a third terminal. Typing any string in one of the connected terminals immediately aborts the TCP connection!

> Further Experiments

1. Modify the attack script by incrementing or decrementing the forged packet's sequence number by 1 to verify whether exact sequence number matching is required.
2. Open `Wireshark`, monitor the `lo0` interface, and filter with `ip.src == 127.0.0.1 && ip.dst == 127.0.0.1 && tcp.port == 8000` to inspect every detail of the TCP exchange.
3. Transmit data rapidly over the connection to see how timing affects attack execution difficulty.

## Man-in-the-Middle Attack

Suppose Pigsy wants to confess his feelings to Lan and writes a letter, but an intruder intercepts the letter, alters its contents, and sabotages their relationship. The intruder is a man-in-the-middle, executing a Man-in-the-Middle attack.

### What Is a Man-in-the-Middle?

A Man-in-the-Middle Attack (abbreviated as "MITM attack") occurs when an attacker establishes independent connections with two communicating parties and relays messages between them, making them believe they are communicating privately and directly with each other, when in fact the entire session is controlled by the attacker.

![Man-in-the-Middle Intercepting and Tampering with Messages Between Communicating Parties](/media/jg/ext/oss.javaguide.cn/p3-juejin/d69b74e63981472b852797f2fa08976f-tplv-k3u1fbpfcp-90bed9bb.png)

As shown in this diagram, the middleman is the attacker. This principle has both malicious uses and defensive applications (such as security software warning that a website may contain malware).

### What Is the Principle of a Man-in-the-Middle Attack?

Consider an analogy: suppose I sign an employment contract with a company, one copy each. If someone alters the contract, how do we determine authenticity? We would have to hire an appraisal institution, costing money.

In security, there is a saying: **We cannot eradicate cybercrime; we can only raise the cost of cybercrime**.

To prevent either party from reneging, a trusted third party is introduced to hold an original copy. As long as this third party does not betray trust, the contract remains relatively secure.

**What if the third party has lax internal controls?**

To prevent internal tampering at the third-party institution, what measures can be taken?

A feasible approach is introducing a **Digest Algorithm (Hash)**. A hash function maps data of arbitrary length to a fixed-length digest. Hashing is not encryption and provides no reversible decryption; different inputs can potentially produce the same digest (collision), so digests are not absolutely unique. For secure cryptographic hash functions, changing the input alters the resulting digest.

#### What Are Common Digest Algorithms?

Common algorithms include message digest algorithms and Secure Hash Algorithms (**SHA**). **MD5** converts text of any length into a 128-bit hash value. However, in 2004, MD5 was proven vulnerable to collisions (two different texts producing identical digests).

Therefore, in most cases, **SHA algorithms** are preferred.

**What if there is an insider threat?**

If an employee has permissions to modify both the contract and the digest, tampering is only a matter of time. Could we store the contract and digest separately?

**How to ensure employees cannot alter the contract?**

We keep the contract in the hands of the two parties and store only the digest at the third-party institution, further raising tampering difficulty.

**What if an employee colludes with a user?**

Relying solely on third-party storage still carries risks. This led to the development of **Digital Signatures and Certificates**.

#### What Are Digital Certificates and Signatures Used For?

Take another example: Sum and Mike sign a contract. Sum generates a digital signature on the contract using a signing algorithm and his private key, and then hands the contract, signature, and his public key to Mike.

![Generating Digital Signature and Verifying with Public Key](/media/jg/ext/oss.javaguide.cn/p3-juejin/e4b7d6fca78b45c8840c12411b717f2f-tplv-k3u1fbpfcp-d0893ffa.png)

Upon receipt, Mike verifies the signature using Sum's public key. Successful verification confirms the signature matches both the public key and contract contents, detecting whether the contract was altered and confirming it was signed by the party holding Sum's private key.

If Mike modifies the contract, the original signature will fail verification; without Sum's private key, Mike cannot forge a valid signature for the modified contract. The private key must be kept secure by Sum, while the public key can be freely shared.

Digital signatures should be understood as "sign with private key, verify with public key", rather than generic "encrypt with private key, decrypt with public key". Mathematical processes in RSA, ECDSA, and EdDSA differ, and describing them as signing and verification is more accurate.

Now let us examine symmetric encryption and asymmetric cryptography.

#### What Is Symmetric Encryption?

In symmetric encryption, the encrypting and decrypting parties use the same key (secret key). Specifically, the sender uses an encryption algorithm and secret key to encrypt data; the receiver uses a decryption algorithm and the identical key to decrypt and read it.

![Symmetric Encryption Where Communicating Parties Use Same Key to Encrypt and Decrypt](/media/jg/ext/oss.javaguide.cn/p3-juejin/ef81cb5e2f0a4d3d9ac5a44ecf97e3cc-tplv-k3u1fbpfcp-8e718342.png)

#### What Are Common Symmetric Encryption Algorithms?

**DES**

DES superficially uses a 64-bit key, but only 56 bits are used by the algorithm; the remaining 8 bits are parity bits discarded during computation. Thus, **DES** has an effective key length of 56 bits. With 56 bits, a brute-force attack involves 2^56 possible keys. DES is no longer considered secure today primarily because its 56-bit key length is too short.

![DES Symmetric Encryption Algorithm Diagram](/media/jg/ext/oss.javaguide.cn/p3-juejin/9eb3a2bf6cf14132a890bc3447480eeb-tplv-k3u1fbpfcp-be13c035.jpg)

**IDEA**

International Data Encryption Algorithm with a 128-bit key length.

**AES**

After DES was cracked, the Advanced Encryption Standard (**AES**) was introduced, offering key lengths of 128, 192, and 256 bits. AES-128 is commonly chosen for balanced performance and security.

**SM1 and SM4**

China developed commercial cryptographic standards **SM1** and **SM4**. SM4 is a published national standard.

**Summary**:

![Comparison and Summary of Common Symmetric Encryption Algorithms](/media/jg/ext/oss.javaguide.cn/p3-juejin/578961e3175540e081e1432c409b075a-tplv-k3u1fbpfcp-fedd454d.png)

#### What Are Common Asymmetric Cryptography Algorithms?

In symmetric encryption, sender and receiver share the same key. In asymmetric cryptography, sender and receiver use different keys. Its primary achievement is solving the key distribution problem during key negotiation. In symmetric encryption, if a key is shared over an insecure channel, an eavesdropper can intercept it. In asymmetric cryptography, the public key can be broadcast openly; without the corresponding private key, intercepting the public key does not compromise security.

![Asymmetric Encryption Using Public and Private Keys for Encryption and Decryption](/media/jg/ext/oss.javaguide.cn/p3-juejin/153cf04a0ecc43c38003f3a1ab198cc0-tplv-k3u1fbpfcp-72b971e2.png)

Common asymmetric cryptography algorithms:

- **RSA**: Security is based on the computational difficulty of factoring large composite integers. Widely adopted with strong compatibility, though slower than symmetric ciphers. Longer keys (e.g., 2048/4096 bits) increase security at the cost of higher computational overhead.
- **ECC (Elliptic Curve Cryptography)**: Based on elliptic curve mathematics, offering high cryptographic strength with shorter keys.
- **SM2**: An elliptic curve public-key cryptography standard developed in China.

Summary:

![Comparison and Summary of Common Asymmetric Encryption Algorithms](/media/jg/ext/oss.javaguide.cn/p3-juejin/28b96fb797904d4b818ee237cdc7614c-tplv-k3u1fbpfcp-a82a06a7.png)

#### What Are Common Hash Algorithms?

Hash algorithms are used for integrity verification and content addressing, though different scenarios demand different security properties. Password hashes must not be treated as simple file digests: servers should generate unique salts for each password and use specialized password hashing algorithms with configurable work factors (cost parameters), storing salt, algorithm identifiers, and cost parameters together to allow future migration.

**MD5** (Not Recommended)

MD5 generates 128-bit digests but lacks reliable collision resistance. It should never be used for digital signatures, certificates, security integrity checks, or password storage.

**SHA**

Secure Hash Algorithm. The **SHA** family includes **SHA-1**, **SHA-2**, and **SHA-3**. It maps input data to fixed-length hash values (message digests). This process is irreversible, but hash values are not ciphertexts or message authentication codes. SHA-1 is no longer suitable for collision-sensitive security scenarios; new systems typically select SHA-2 (such as SHA-256) or SHA-3 algorithms.

**SM3**

Chinese commercial cryptographic hash algorithm **SM3**, with cryptographic strength comparable to SHA-256.

**Summary**:

![Comparison and Summary of Common Hash Algorithms](/media/jg/ext/oss.javaguide.cn/p3-juejin/79c3c2f72d2f44c7abf2d73a49024495-tplv-k3u1fbpfcp-11e99ce2.png)

Symmetric encryption, asymmetric cryptography, and hash algorithms solve distinct problems: symmetric encryption protects bulk data; asymmetric cryptography handles key exchange, encryption, and digital signatures; hash algorithms generate fixed digests.

#### What Are Third-Party Authorities and Certificate Mechanisms For?

A remaining problem: what if Sum denies having issued the public key and contract to Mike?

To establish trust, we need verifiable credibility, introducing **Third-Party Certificate Authorities (CAs) and Certificate Mechanisms**.

A certificate derives trust from the trustworthiness of its issuer. If Sum wants Mike to accept his public key, Sum does not give it directly to Mike; instead, Sum provides a certificate containing the public key issued by a trusted CA.

![Third-Party Authority Issuing Certificate and Completing Verification Process](/media/jg/ext/oss.javaguide.cn/p3-juejin/b1a3dbf87e3e41ff894f39512a10f66d-tplv-k3u1fbpfcp-71f33a71.png)

As shown above, Sum submits a certificate request to the CA. After verifying the applicant's identity, the CA signs the certificate data with its private key. Mike verifies the signature using the CA's public key. If verification succeeds, the certificate is unaltered and authentic.

Real PKI typically employs a hierarchical structure of Root CAs, Intermediate CAs, and End-Entity Certificates to isolate root private keys, delegate issuance authority, and constrain certificate usage.

![Certificate Chain of Trust from Root CA to End-Entity Certificate](/media/jg/ext/oss.javaguide.cn/p3-juejin/1481f0409da94ba6bb0fee69bf0996f8-tplv-k3u1fbpfcp-b4001a32.png)

In the diagram above, the most trusted Root CA issues root certificates and signs intermediate CA certificates, which in turn sign third-tier CAs, eventually signing Sum's certificate.

To verify Sum's certificate, the public key from the intermediate CA certificate is used. The intermediate CA is verified using the root CA's public key. The client also checks validity dates, domain names, key usage, and path constraints, anchoring trust to locally trusted root stores.

This forms a certificate chain of trust. If a trusted CA in the chain is compromised or misissues a certificate, fraudulent certificates can be produced within its scope.

### How to Avoid Man-in-the-Middle Attacks?

Understanding the mechanisms and risks of MITM attacks enables proper prevention. Most users have encountered browser security warnings:

![Browser Warning Prompting Untrusted Certificate](/media/jg/ext/oss.javaguide.cn/p3-juejin/0dde4b76be6240699312d822a3fe1ed3-tplv-k3u1fbpfcp-645eb908.png)

A browser certificate warning indicates certificate validation failure. Causes include expired certificates, mismatched domains, untrusted chains, incorrect local system clocks, server misconfiguration, or an ongoing MITM attack. Users should never bypass warnings.

Controlled apps can consider certificate or public key pinning under well-defined threat models, with robust rotation, backup keys, and fallback mechanisms. For standard web browsing, the correct practice relies on system trust stores to perform certificate chain, domain, and validity checks.

## DDoS

Many previously discussed attacks fall under the umbrella of DDoS attacks.

Major global Internet companies have all suffered severe **DDoS** attacks.

In 2018, GitHub was struck by an attack reaching 1.35 Tbps, one of the largest DDoS attacks recorded. A week later, attacks targeted Google, Amazon, and other services, with peak bandwidths exceeding 1 Tbps.

### What Exactly Is a DDoS Attack?

DDoS stands for **Distributed Denial of Service**. It refers to multiple attackers at disparate locations launching coordinated, large-scale attacks simultaneously against one or more targets. Unlike single-source DoS attacks, DDoS uses botnets and exploits flaws in network protocols or operating systems to flood servers with requests, consuming bandwidth or system resources until services crash.

> An Analogy

Suppose I open a Chongqing hotpot restaurant with 50 seats. Because of quality ingredients and fair prices, business is booming. A competing restaurant across the street gets no customers. To ruin my business, the competitor hires 50 people to occupy every seat in my restaurant without ordering food, preventing paying customers from dining.

This illustrates a classic DDoS attack: attackers use "bots" to launch massive request volumes in a short window, consuming target server resources. Online gaming and fintech are frequent targets.

Common attack types include **ICMP Flood**, **UDP Flood**, **NTP Flood**, **SYN Flood**, **CC Attacks (Challenge Collapsar)**, and **DNS Query Flood**.

### How to Mitigate DDoS Attacks?

#### Anti-DDoS High-Defense Servers

Continuing the hotpot analogy: high-defense servers are like hiring security guards who patrol the restaurant and protect it from harassers.

High-defense servers provide hardware defenses capable of mitigating attacks over 50 Gbps, filtering malicious traffic and scanning network nodes.

#### Blacklists

Facing troublemakers, the owner photographs them and bans them from entering. However, anyone resembling them might also be blocked. Setting blacklists adheres to an aggressive filtering philosophy, which can inadvertently block legitimate users and impact normal business.

#### DDoS Scrubbing

DDoS traffic scrubbing is like kicking out guests who have occupied tables for several minutes without placing an order.

Scrubbing monitors request data in real time, detecting DoS anomalies and cleaning out malicious traffic without disrupting legitimate requests.

#### CDN Acceleration

CDN acceleration can be understood as moving the hotpot restaurant online to an order-and-delivery model: troublemakers cannot find the physical kitchen and cannot crowd the dining room.

In reality, CDNs distribute traffic across edge nodes. This hides the origin server's real IP and disperses DDoS traffic across numerous points of presence, preventing the origin from collapsing.

## References

- HTTP Flood Attack - Cloudflare: <https://www.cloudflare.com/zh-cn/learning/ddos/http-flood-ddos-attack/>
- SYN Flood Attack: <https://www.cloudflare.com/zh-cn/learning/ddos/syn-flood-ddos-attack/>
- What Is IP Spoofing?: <https://www.cloudflare.com/zh-cn/learning/ddos/glossary/ip-spoofing/>
- What Is a DNS Flood? | DNS Flood DDoS Attack: <https://www.cloudflare.com/zh-cn/learning/ddos/dns-flood-ddos-attack/>
