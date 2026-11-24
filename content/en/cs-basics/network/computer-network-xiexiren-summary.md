---
title: Summary of "Computer Networks" (Xie Xiren)
description: Study notes based on the textbook "Computer Networks", summarizing core knowledge points such as terminology and layered models for final exams and interview preparation.
category: Computer Science Basics
tag:
  - Computer Networks
head:
  - - meta
    - name: keywords
      content: Computer Networks, Xie Xiren, terminology, layered models, link, host, textbook summary
lang: en
sourceRef: zh-ref/cs-basics/network/computer-network-xiexiren-summary.md
---

These notes come from my compilation while studying computer networks in my sophomore year. Most of the content references Professor Xie Xiren's [Computer Networks (7th Edition)](https://www.elias.ltd/usr/local/etc/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C%EF%BC%88%E7%AC%AC7%E7%89%88%EF%BC%89%E8%B0%A2%E5%B8%8C%E4%BB%81.pdf).

The content of computer network textbooks is quite dispersed: terminology, layering, links, routing, transport layer, and application layer all need to be connected together. To make revision smoother, I refactored the original notes and supplemented them with several explanatory diagrams.

This article mainly answers several questions:

1. What do the common basic terms in computer networks mean?
2. How should the OSI and TCP/IP layered models be understood?
3. What problems do the data link layer, network layer, transport layer, and application layer solve respectively?
4. When reviewing the book "Computer Networks", which concepts are most easily confused?

![Overview of Knowledge Points in "Computer Networks" Textbook](/media/jg/ext/oss.javaguide.cn/p3-juejin/fb5d8645cd55484ab0177f25a13e97db-tplv-k3u1fbpfcp-75ab03f4.png)

Related question: [How to evaluate Xie Xiren's Computer Networks (7th Edition)? - Zhihu](https://www.zhihu.com/question/327872966).

## 1. Overview of Computer Networks

### 1.1. Basic Terminology

1. **Node**: A node in a network can be a computer, hub, switch, router, etc.
2. **Link**: A physical segment of line from one node to another, without any other intersections in between.
3. **Host**: A computer connected to the Internet.
4. **ISP (Internet Service Provider)**: The provider that offers access to the Internet.

   ![ISP (Internet Service Provider) Definition](/media/jg/ext/oss.javaguide.cn/p3-juejin/e77e26123d404d438d0c5943e3c65893-tplv-k3u1fbpfcp-b0fbf976.png)

5. **IXP (Internet eXchange Point)**: The primary purpose of an IXP is to allow two networks to connect directly and exchange packets without having to forward packets through a third network.

   ![IXP Traffic Levels During the Stratos Skydive — RIPE Labs](/media/jg/ext/oss.javaguide.cn/p3-juejin/7f9a6ddaa09441ceac11cb77f7a69d8f-tplv-k3u1fbpfcp-cdd57d5c.png)

   <p style="text-align:center;font-size:13px;color:gray">https://labs.ripe.net/Members/fergalc/ixp-traffic-during-stratos-skydive</p>

6. **RFC (Request For Comments)**: Meaning "request for comments", containing almost all important textual documentation regarding the Internet.
7. **WAN (Wide Area Network)**: Its task is to deliver data sent by hosts over long distances.
8. **MAN (Metropolitan Area Network)**: Used to interconnect multiple local area networks.
9. **LAN (Local Area Network)**: Schools or enterprises mostly possess multiple interconnected local area networks.

   ![MAN & WMAN | Red de área metropolitana, Redes informaticas, Par trenzado](/media/jg/ext/oss.javaguide.cn/p3-juejin/eb48d21b2e984a63a26250010d7adac4-tplv-k3u1fbpfcp-fbea2861.png)

   <p style="text-align:center;font-size:13px;color:gray">http://conexionesmanwman.blogspot.com/</p>

10. **PAN (Personal Area Network)**: A network that connects electronic devices belonging to an individual within a personal workspace using wireless technologies.

    ![Advantages and disadvantages of personal area network (PAN) - IT Release](/media/jg/ext/oss.javaguide.cn/p3-juejin/54bd7b420388494fbe917e3c9c13f1a7-tplv-k3u1fbpfcp-4a6942eb.png)

    <p style="text-align:center;font-size:13px;color:gray">https://www.itrelease.com/2018/07/advantages-and-disadvantages-of-personal-area-network-pan/</p>

11. **Packet**: The unit of data transmitted across the Internet. It consists of a header and a data segment. A packet is also known as a datagram/pack, and the header is called the packet header.
12. **Store and Forward**: A router receives a packet, first checks whether the packet is correct, and filters out collision errors. After confirming the packet is correct, it retrieves the destination address, looks up the desired output port address in the routing table, and then forwards the packet out.

    ![Router Store-and-Forward Packet Process](/media/jg/ext/oss.javaguide.cn/p3-juejin/addb6b2211444a4da9e0ffc129dd444f-tplv-k3u1fbpfcp-a64c3516.gif)

13. **Bandwidth**: In computer networks, it represents the "highest data rate" that can pass from one point to another in the network per unit of time. It is commonly used to express the data transmission capability of a network communication line. The unit is "bits per second", denoted as b/s.
14. **Throughput**: The amount of data passing through a network (or channel, interface) per unit of time. Throughput is more often used for real-world network measurements to know how much data actually passes through the network. Throughput is constrained by network bandwidth or the rated network speed.

### 1.2. Summary of Key Knowledge Points

1. **A computer network connects many computers together, while the Internet connects many networks together; it is a network of networks.**
2. The lowercase `internet` is a general noun referring broadly to a network formed by interconnecting multiple computer networks. The communication protocols (rules) among these networks can be arbitrary. The capitalized `Internet` is a proper noun referring to the world's largest, open, specific network interconnected from numerous networks, adopting the TCP/IP protocol suite as its communication rules, with ARPANET as its predecessor.
3. Routers are key components for packet switching; their task is to forward received packets, which is the most important function of the network core. Packet switching uses store-and-forward technology, meaning a message (the entire block of data to be sent) is divided into multiple packets before transmission. Before sending, a longer message is partitioned into smaller, equal-length data segments. Attaching a header composed of necessary control information in front of each data segment forms a packet. The packet header contains critical control information such as destination and source addresses, allowing each packet to independently select a transmission path through the Internet and be delivered correctly to its destination.
4. Structurally, the Internet can be divided into an edge part and a core part. Hosts reside at the edge of the network, functioning for information processing. The core part consists of numerous networks and routers connecting them, functioning to provide connectivity and switching.
5. Computer communication is communication between processes (running programs) on computers. Communication modes adopted by computer networks are the client-server model (C/S model) and the peer-to-peer model (P2P model).
6. Both client and server refer to application processes involved in communication. The client is the service requester, and the server is the service provider.
7. According to scope, computer networks are divided into WAN (Wide Area Network), MAN (Metropolitan Area Network), LAN (Local Area Network), and PAN (Personal Area Network).
8. **The most commonly used performance metrics in computer networks are: rate, bandwidth, throughput, delay (transmission delay, propagation delay, processing delay, queuing delay), delay-bandwidth product, round-trip time (RTT), and channel utilization.**
9. A network protocol (or simply protocol) is a set of rules established for data exchange in a network. The layers of a computer network and their protocol collection are called the network architecture.
10. **The five-layer architecture consists of the application layer, transport layer, network layer (internet layer), data link layer, and physical layer. The most important protocols of the transport layer are TCP and UDP, and the most important protocol of the network layer is IP.**

![Overview of Five-Layer Computer Network Architecture](/media/jg/ext/oss.javaguide.cn/p3-juejin/acec0fa44041449b8088872dcd7c0b3a-tplv-k3u1fbpfcp-fb3c59d8.gif)

The following sections will introduce the five-layer architecture of computer networks: **Physical Layer + Data Link Layer + Network Layer (Internet Layer) + Transport Layer + Application Layer**.

## 2. Physical Layer

![Physical Layer](/media/jg/ext/oss.javaguide.cn/p3-juejin/cf1bfdd36e5f4bde94aea44bbe7a6f8a-tplv-k3u1fbpfcp-60b1e566.png)

### 2.1. Basic Terminology

1. **Data**: The entity carrying messages.
2. **Signal**: The electrical or electromagnetic representation of data. In other words, signals are objects suitable for transmission over media.
3. **Symbol / Code Element (code)**: Basic waveforms representing different discrete values when digital signals are represented by time-domain waveforms.
4. **Simplex**: Communication in only one direction with no reverse interaction.
5. **Half Duplex**: Both communicating parties can send messages, but cannot send simultaneously (and thus cannot receive simultaneously either).
6. **Full Duplex**: Both communicating parties can send and receive information simultaneously.

   ![Comparison of Simplex, Half-Duplex, and Full-Duplex Communication](/media/jg/ext/oss.javaguide.cn/p3-juejin/b1f02095b7c34eafb3c255ee81f58c2a-tplv-k3u1fbpfcp-e7591485.png)

7. **Distortion**: Loss of signal fidelity, primarily meaning that the received signal differs from the transmitted signal due to attenuation and degradation. Factors influencing distortion: (1) symbol transmission rate, (2) signal transmission distance, (3) noise interference, (4) transmission medium quality.

   ![Signal Transmission Distortion Diagram](/media/jg/ext/oss.javaguide.cn/p3-juejin/f939342f543046459ffabdc476f7bca4-tplv-k3u1fbpfcp-d0467d64.png)

8. **Nyquist Criterion**: In any channel, the symbol transmission rate has an upper limit. If the transmission rate exceeds this limit, severe intersymbol interference (ISI) occurs, making it impossible for the receiver to identify code elements.
9. **Shannon's Theorem**: In a bandwidth-limited channel with noise, the maximum data rate without errors has an upper bound.
10. **Baseband Signal**: The signal originating from the source, referring to unmodulated digital or analog signals.
11. **Bandpass Signal**: A signal obtained by modulating a baseband signal with a carrier wave to shift its frequency range to a higher frequency band suitable for transmission over a channel (i.e., only a certain frequency range can pass through the channel).
12. **Modulation**: The process of processing information from a signal source and applying it to a carrier wave to make it suitable for transmission over a channel.
13. **Signal-to-Noise Ratio (SNR)**: The ratio of average signal power to average noise power, denoted as S/N. SNR (dB) = 10 * log10(S/N).
14. **Channel Multiplexing**: Multiple users sharing the same channel (not necessarily simultaneously).

    ![Channel Multiplexing Technologies](/media/jg/ext/oss.javaguide.cn/p3-juejin/5d9bf7b3db324ae7a88fcedcbace45d8-tplv-k3u1fbpfcp-4a782d37.png)

15. **Bit Rate**: Number of bits transmitted per unit of time (per second).
16. **Baud Rate**: Number of times the carrier modulation state changes per unit of time. It targets the modulation rate of the carrier by the data signal.
17. **Multiplexing**: Methods for sharing a communication channel.
18. **ADSL (Asymmetric Digital Subscriber Line)**: Asymmetric digital subscriber line technology.
19. **HFC (Hybrid Fiber-Coaxial Network)**: A residential broadband access network developed on the basis of widespread cable television networks.

### 2.2. Summary of Key Knowledge Points

1. **The main task of the physical layer is to determine characteristics related to the transmission medium interface, such as mechanical, electrical, functional, and procedural characteristics.**
2. A data communication system can be divided into three parts: source system, transmission system, and destination system. The source system includes the source (source station) and transmitter; the destination system includes the receiver and terminal.
3. **The purpose of communication is to transmit messages. Voice, text, and images are messages; data is the entity carrying messages; signals are the electrical or electromagnetic representations of data.**
4. Based on the way parameters representing messages take values, signals are divided into analog signals (continuous signals) and digital signals (discrete signals). Basic waveforms representing different discrete values in the time domain are called symbols (code elements).
5. Based on interaction modes, communication is divided into unidirectional communication (simplex), two-way alternating communication (half-duplex), and two-way simultaneous communication (full-duplex).
6. Signals from the source are called baseband signals. To transmit over channels, signals must be modulated. Modulation includes baseband modulation and bandpass modulation. Basic bandpass modulation methods include AM (amplitude modulation), FM (frequency modulation), and PM (phase modulation), as well as complex methods like QAM (quadrature amplitude modulation).
7. To increase data transmission rates over a channel, better transmission media or advanced modulation techniques can be used, but the rate cannot be increased arbitrarily.
8. Transmission media are categorized into guided media (twisted pair, coaxial cable, optical fiber) and unguided media (wireless, infrared, atmospheric laser).
9. To utilize fiber resources effectively, Passive Optical Networks (PON) are widely used between fiber trunks and users. PON requires no power equipment, leading to low long-term operational and maintenance costs. The most popular PON types are EPON (Ethernet PON) and GPON (Gigabit PON).

### 2.3. Supplementary Notes

#### 2.3.1. What Does the Physical Layer Mainly Do?

The physical layer mainly focuses on **transparently transmitting bitstreams**. Its primary task can also be described as defining characteristics of interfaces with transmission media: mechanical characteristics (physical properties like connector shape and size), electrical characteristics (voltage ranges on lines), functional characteristics (meaning of voltage levels on lines), and procedural characteristics (sequence of occurrences of events for different functions).

**The physical layer considers how to transmit data bitstreams over media connecting computers, rather than referring to the concrete transmission media themselves.** There are numerous hardware devices and transmission media in modern computer networks with various communication methods. The physical layer masks these differences so the data link layer above does not feel them, allowing the data link layer to focus on its own protocols and services.

#### 2.3.2. Common Channel Multiplexing Techniques

1. **Frequency Division Multiplexing (FDM)**: All users occupy different frequency bandwidth resources at the same time.
2. **Time Division Multiplexing (TDM)**: All users occupy the same frequency bandwidth at different time slots.
3. **Statistical Time Division Multiplexing (STDM)**: An improved TDM that significantly improves channel utilization.
4. **Code Division Multiplexing (CDM)**: Users use specially chosen orthogonal codes, preventing mutual interference. The signals have strong anti-jamming capabilities, and their spectrum resembles white noise, making them difficult to detect.
5. **Wavelength Division Multiplexing (WDM)**: Frequency division multiplexing for optical channels.

#### 2.3.3. Common Broadband Access Technologies (Mainly ADSL and FTTx)

Broadband access methods for users include ADSL (using digital technology to upgrade existing analog telephone lines without rewiring; its high-speed version is VDSL), HFC (Hybrid Fiber-Coaxial network based on cable TV infrastructure), and FTTx (Fiber To The ...).

## 3. Data Link Layer

![Data Link Layer](/media/jg/ext/oss.javaguide.cn/p3-juejin/83ec6dafc8c14ca185bafb656d86f0b2-tplv-k3u1fbpfcp-6e2933c8.png)

### 3.1. Basic Terminology

1. **Link**: A physical segment of line connecting one node to an adjacent node.
2. **Data Link**: Formed when hardware and software implementing data transmission control protocols are added to a physical link.
3. **CRC (Cyclic Redundancy Check)**: A widely used error detection technique in the data link layer to guarantee transmission reliability.
4. **Frame**: The protocol data unit (PDU) of the data link layer, composed of a data link layer header and the encapsulated payload packet.
5. **MTU (Maximum Transmission Unit)**: The maximum length limit for the data payload part of a frame.
6. **BER (Bit Error Rate)**: The ratio of incorrectly transmitted bits to the total number of transmitted bits over a period of time.
7. **PPP (Point-to-Point Protocol)**: A data link layer protocol used when user computers communicate with an ISP. Below is a diagram of a PPP frame:
   ![PPP Point-to-Point Protocol Frame Format](/media/jg/ext/oss.javaguide.cn/p3-juejin/6b0310d3103c4149a725a28aaf001899-tplv-k3u1fbpfcp-30e5ed59.jpg)
8. **MAC Address (Media Access Control Address)**: Also known as physical address or hardware address, used to define the position of network devices. In the OSI model, Layer 3 (Network Layer) handles IP addresses, while Layer 2 (Data Link Layer) handles MAC addresses. Thus, a host has a MAC address, while each network location has a dedicated IP address. An address is an important identifier: "Names tell what we seek; addresses tell where it is; routes tell how to get there."

   ![ARP (Address Resolution Protocol) explained](/media/jg/ext/oss.javaguide.cn/p3-juejin/057b83e7ec5b4c149e56255a3be89141-tplv-k3u1fbpfcp-f47c6d8a.png)

9. **Bridge**: A network interconnection device operating at the data link layer to relay and connect two or more local area networks.
10. **Switch**: Broadly speaking, a device in communication systems for exchanging information. The switch operating at the data link layer refers to a switching hub, which is essentially a multi-port bridge.

### 3.2. Summary of Key Knowledge Points

1. A link is a physical path from one node to an adjacent node; a data link adds necessary hardware (such as network adapters) and software (protocol implementations) on top of the link.
2. The data link layer mainly uses **point-to-point channels** and **broadcast channels**.
3. The protocol data unit transmitted by the data link layer is a frame. The three basic problems of the data link layer are: **framing (encapsulation)**, **transparent transmission**, and **error detection**.
4. **CRC (Cyclic Redundancy Check)** is an error-detecting method, while the Frame Check Sequence (FCS) is the redundant code appended to the data.
5. **PPP (Point-to-Point Protocol)** is the most widely used protocol in the data link layer. Its characteristics are: simple, only detects errors without correcting them, does not use sequence numbers, provides no flow control, and supports multiple network layer protocols simultaneously.
6. PPPoE is a link-layer protocol used by broadband Internet access hosts.
7. **Advantages of LANs: broadcast capability allows easy access across the entire network from one station; facilitates system expansion and gradual evolution; improves system reliability, availability, and survivability.**
8. Computers communicate with external LANs via network adapters (also known as Network Interface Cards or NICs). **The hardware address of the computer is stored in the adapter's ROM**.
9. Ethernet uses connectionless operation; it does not sequence transmitted data frames and does not require acknowledgments. A destination drops corrupted frames without taking other actions.
10. Ethernet adopts the **CSMA/CD (Carrier Sense Multiple Access with Collision Detection)** protocol. Its features are: **listen before transmit, listen while transmitting, immediately halt transmission upon detecting collision on the bus, and retransmit after waiting a random period according to the backoff algorithm.** Therefore, each station faces a collision risk within a short period after sending data. Stations contend for the Ethernet channel equally.
11. Ethernet adapters have filtering capabilities; they only receive unicast, broadcast, and multicast frames.
12. Hubs can extend Ethernet at the physical layer (the extended Ethernet remains a single network).

### 3.3. Supplementary Notes

1. Characteristics of point-to-point channels and broadcast channels in the data link layer, and the protocols used by them (PPP protocol and CSMA/CD protocol).
2. The three basic problems of the data link layer: **framing**, **transparent transmission**, and **error detection**.
3. Ethernet MAC layer hardware addresses.
4. Roles and applicable scenarios of adapters, repeaters, hubs, bridges, and Ethernet switches.

## 4. Network Layer

![Network Layer](/media/jg/ext/oss.javaguide.cn/p3-juejin/775dc8136bec486aad4f1182c68f24cd-tplv-k3u1fbpfcp-a39e3384.png)

### 4.1. Basic Terminology

1. **Virtual Circuit**: A bidirectional transparent transmission channel established between logical or physical ports of two terminal devices. A virtual circuit indicates only a logical connection along which packets are transmitted via store-and-forward, rather than a real dedicated physical connection.
2. **IP (Internet Protocol)**: IP is one of the two core protocols in the TCP/IP suite, forming the heart of the TCP/IP network layer. Accompanying protocols include ARP, RARP, ICMP, and IGMP.
3. **ARP (Address Resolution Protocol)**: Resolves IP addresses into hardware (MAC) addresses.
4. **ICMP (Internet Control Message Protocol)**: Allows hosts or routers to report errors and provide reports on abnormal conditions.
5. **Subnet Mask**: A bitmask used to indicate which bits of an IP address identify the subnet where the host resides and which bits identify the host. A subnet mask cannot exist alone; it must be paired with an IP address.
6. **CIDR (Classless Inter-Domain Routing)**: Eliminates traditional Class A, B, and C address classifications and subnetting concepts, using variable-length "network prefixes" instead of network IDs and subnet IDs.
7. **Default Route**: The route selected by a router when no matching route to the destination address can be found in the routing table. Default routing also reduces routing table size and search time.
8. **Routing Algorithm**: The core part of routing protocols. The Internet adopts adaptive, hierarchical routing protocols.

### 4.2. Summary of Key Knowledge Points

1. **The network layer in TCP/IP provides only a simple, flexible, connectionless, best-effort datagram service to the upper layer. It provides no QoS guarantees or packet delivery deadlines; transmitted packets may encounter errors, loss, duplication, and reordering. End-to-end communication reliability is the responsibility of the transport layer.**
2. Delivery in the Internet is of two types: direct delivery within the same network without passing through a router, and indirect delivery to other networks passing through at least one router, where the final hop is always direct delivery.
3. Classful IP addresses consist of a network field (identifying the network) and a host field (identifying the host). The leading bits of the network field identify the IP address class. IP addressing is hierarchical. Address allocation authorities only assign network numbers; organizations owning the network number assign host numbers. Routers forward packets based on destination network numbers. A router connects to at least two networks, so it must have at least two distinct IP addresses.
4. IP datagrams consist of a header and a data payload. The first portion of the header is fixed-length (20 bytes), which all IP datagrams must possess (containing source address, destination address, total length, etc.). Variable-length optional fields follow the fixed header. The Time To Live (TTL) in the IP header specifies the maximum number of router hops an IP datagram can traverse, preventing datagrams from circulating endlessly.
5. **ARP resolves IP addresses into hardware addresses. The ARP cache significantly reduces network traffic because a host communicating with the same destination can retrieve the required hardware address directly from the cache without broadcasting ARP requests again.**
6. CIDR is an effective solution to IP address exhaustion. CIDR notation adds a slash `/` after the IP address followed by the prefix length. The prefix identifies the network, and the remainder identifies the host. CIDR groups contiguous IP addresses with identical prefixes into "CIDR blocks", which serve as units of address allocation.
7. ICMP is a network-layer protocol. ICMP messages are encapsulated within IP datagrams. ICMP is not designed for reliable transmission; it allows hosts or routers to report errors and abnormal conditions. ICMP messages are categorized into ICMP error reporting messages and ICMP query messages.
8. **The fundamental solution to IP address exhaustion is adopting IPv6 with a vastly larger address space.** Key changes in IPv6 include: (1) larger address space (128-bit addresses), (2) flexible header formats, (3) improved options, (4) plug-and-play support, (5) resource pre-allocation support, and (6) 8-byte aligned headers.
9. **A Virtual Private Network (VPN) uses the public Internet as a communication carrier between private institutional networks. Private IP addresses are used internally. A VPN requires at least one router with a legal global IP address to communicate across the Internet with another site of the organization. All data transmitted across the Internet must be encrypted.**
10. Features of MPLS include: (1) connection-oriented QoS support, (2) traffic engineering support to balance network load, (3) effective VPN support. MPLS labels each incoming IP datagram with a fixed-length label at ingress nodes and performs hardware-based forwarding at Layer 2 based on labels, drastically increasing forwarding speeds.

## 5. Transport Layer

![Transport Layer](/media/jg/ext/oss.javaguide.cn/p3-juejin/9fe85e137e7f4f03a580512200a59609-tplv-k3u1fbpfcp-7ce3257f.png)

### 5.1. Basic Terminology

1. **Process**: An instance of a program running on a computer.
2. **Inter-process Communication Across Applications**: The process where a process on one host exchanges data with a process on another host (note that true endpoints of communication are processes, not hosts; end-to-end communication is inter-process communication).
3. **Transport Layer Multiplexing and Demultiplexing**: Multiplexing allows different sending processes to transmit data via the same transport layer protocol. Demultiplexing allows the receiving transport layer to correctly deliver data to the destination application process after stripping the header.
4. **TCP (Transmission Control Protocol)**: A connection-oriented, reliable transport protocol.
5. **UDP (User Datagram Protocol)**: A connectionless, best-effort transport protocol.

   ![TCP and UDP](/media/jg/ext/oss.javaguide.cn/p3-juejin/b136e69e0b9b426782f77623dcf098bd-tplv-k3u1fbpfcp-2b0825a3.png)

6. **Port**: Identifies which process on the destination machine is interacting. For example, MSN and QQ use different ports; without ports, traffic between QQ and MSN processes could become mixed up. Ports are also called protocol port numbers.
7. **Stop-and-Wait Protocol**: The sender stops after sending one packet and waits for acknowledgment before sending the next packet.
8. **Flow Control**: Limiting the sender's transmission rate so the receiver has enough processing capability without overflowing and network congestion is prevented.
9. **Congestion Control**: Preventing too much data from being injected into the network so routers or links do not become overloaded. It assumes the network can sustain current network loads.

### 5.2. Summary of Key Knowledge Points

1. **The transport layer provides logical communication between application processes; communication does not actually occur directly between transport layers. It shields network details (such as topology and routing protocols) from the application layer, making it appear as if an end-to-end logical channel connects application processes.**
2. **The network layer provides logical communication between hosts, while the transport layer provides end-to-end logical communication between application processes.**
3. Two important transport protocols are UDP and TCP. In OSI terminology, data units exchanged between peer transport entities are called Transport Protocol Data Units (TPDU). In TCP/IP, they are called TCP segments or UDP datagrams depending on the protocol used.
4. **UDP does not establish a connection before sending data, and the remote host gives no acknowledgment upon receipt. Although UDP is unreliable, it is the most efficient working mode in certain scenarios. TCP provides connection-oriented service; connections must be established before transmission and released afterward. TCP does not support broadcast or multicast. Providing reliable, connection-oriented service introduces significant overhead (acknowledgments, flow control, timers, connection management), increasing header sizes and consuming processor resources.**
5. Hardware ports are interfaces where hardware devices interact, while software ports are addresses used by application protocols to interact with transport entities across layers. UDP and TCP headers contain source and destination ports. When the transport layer receives a packet from the IP layer, it delivers the payload to the appropriate application process based on the destination port.
6. A 16-bit port number identifies a port. Port numbers have only local significance, acting as layer interfaces for application processes. Across different machines, identical port numbers have no correlation. Port numbers are divided into server-side ports (0–1023 well-known ports, 1024–49151 registered ports) and client ephemeral ports (49152–65535).
7. **Key features of UDP: (1) connectionless, (2) best-effort delivery, (3) message-oriented, (4) no congestion control, (5) supports 1-to-1, 1-to-many, many-to-1, and many-to-many communication, (6) low header overhead (only four fields: source port, destination port, length, checksum).**
8. **Key features of TCP: (1) connection-oriented, (2) point-to-point (one-to-one only), (3) reliable delivery, (4) full-duplex communication, (5) byte-stream oriented.**
9. **TCP uses a host's IP address combined with a port number as the endpoint of a connection, known as a socket. A socket is represented as `(IP address: port number)`. Every TCP connection is uniquely identified by its two endpoints.**
10. The stop-and-wait protocol achieves reliable transmission by sending one packet, waiting for acknowledgment, and only then sending the next.
11. To improve efficiency, senders use pipelined transmission instead of stop-and-wait. Pipelining allows sending multiple packets consecutively without waiting for individual acknowledgments, keeping data flowing through the channel and greatly improving channel utilization.
12. Timeout retransmission in stop-and-wait retransmits previously sent packets if no acknowledgment arrives within a timeout period (assuming the packet was lost). A retransmission timer is set for each packet, longer than the average RTT. This mechanism is called Automatic Repeat reQuest (ARQ). Duplicate packets received are discarded while acknowledgments are resent. Go-Back-N (continuous ARQ) maintains a send window; packets within the window can be sent without waiting. Receivers generally use cumulative acknowledgments, acknowledging the last in-order received packet.
13. The TCP header has 20 fixed bytes, followed by up to 40 bytes of optional fields. If optional fields do not make the header a multiple of 4 bytes, padding zeros are appended. Thus, TCP header lengths range from 20 to 60 bytes (20 + 4n bytes).
14. **TCP uses a sliding window mechanism. Sequence numbers in the send window indicate permitted data. Behind the send window trailing edge are bytes sent and acknowledged; ahead of the leading edge are bytes not yet permitted to be sent. Flow control throttles the sender's transmission rate so the receiver is not overwhelmed.**
15. When demand for network resources exceeds available capacity, performance degrades, resulting in congestion. Congestion control prevents excessive data from overloading routers and links. Congestion control is a global process involving all hosts and routers, whereas flow control is point-to-point end-to-end traffic pacing.
16. **For congestion control, a TCP sender maintains a congestion window (`cwnd`) state variable. The congestion window size depends on network congestion and varies dynamically. The sender sets its send window to the minimum of `cwnd` and the receiver's advertised window (`rwnd`).**
17. **TCP congestion control employs four algorithms: slow start, congestion avoidance, fast retransmit, and fast recovery. At the network layer, routers can use queue management policies (such as AQM) to reduce congestion.**
18. Transport connections go through three phases: connection establishment, data transfer, and connection release.
19. **The process actively initiating a TCP connection is the client; the process passively waiting is the server. TCP connection establishment uses a three-way handshake: the server acknowledges the client's request, and the client acknowledges the server's acknowledgment.**
20. TCP connection release uses a four-way handshake. Either party can initiate release when done transmitting, entering a half-closed state upon acknowledgment. When the other side has no more data to send, it sends a release notice, and upon acknowledgment, the TCP connection is completely closed.

### 5.3. Supplementary Notes (Important)

Pay close attention to these key topics:

1. Significance of ports and sockets
2. Differences between UDP and TCP and their respective application scenarios
3. Working principles of achieving reliable transmission over unreliable networks: Stop-and-Wait and ARQ protocols
4. TCP sliding window, flow control, congestion control, and connection management
5. TCP three-way handshake and four-way handshake mechanisms

## 6. Application Layer

![Application Layer](/media/jg/ext/oss.javaguide.cn/p3-juejin/0f13f0ee13b24af7bdddf56162eb6602-tplv-k3u1fbpfcp-c797e298.png)

### 6.1. Basic Terminology

1. **DNS (Domain Name System)**: DNS converts human-readable domain names (e.g., `www.baidu.com`) into machine-readable IP addresses (e.g., `220.181.38.148`). It functions essentially as the phonebook of the Internet.

   ![DNS Resolving Domain Names to IP Addresses Process](/media/jg/ext/oss.javaguide.cn/p3-juejin/e7da4b07947f4c0094d46dc96a067df0-tplv-k3u1fbpfcp-b3e44fed.png)

   <p style="text-align:right;font-size:12px">https://www.seobility.net/en/wiki/HTTP_headers</p>

2. **FTP (File Transfer Protocol)**: Used to control bidirectional file transfers across the Internet. It is also an application program. Different operating systems offer various FTP client programs that all comply with this protocol. Two common concepts are "Download" (copying files from a remote host to one's own computer) and "Upload" (copying files from one's computer to a remote host).

   ![FTP Working Process](/media/jg/ext/oss.javaguide.cn/p3-juejin/f3f2caaa361045a38fb89bb9fee15bd3-tplv-k3u1fbpfcp-4a96e799.png)

3. **TFTP (Trivial File Transfer Protocol)**: A lightweight protocol in the TCP/IP suite for simple file transfers between client and server with low overhead. It uses port number 69.
4. **TELNET (Remote Terminal Protocol)**: A standard protocol and method in TCP/IP for remote login services across the Internet. It provides users the ability to perform work on remote hosts from local computers. Commands entered into the telnet program run on the remote server console, controlling the server locally. Starting a Telnet session requires entering a username and password.
5. **WWW (World Wide Web)**: Often abbreviated as Web or W3, consisting of Web clients and Web servers. The Web allows clients (typically browsers) to browse pages hosted on servers. It is a system of interconnected hypertext documents accessed via the Internet. Each resource is identified by a Uniform Resource Identifier (URI) and delivered via Hypertext Transfer Protocol (HTTP). The W3C (World Wide Web Consortium) was founded in October 1994 at MIT by Tim Berners-Lee. The World Wide Web is not synonymous with the Internet; it is one of the many services running on top of the Internet.
6. **General Workflow of the World Wide Web**:

   ![General Workflow of the World Wide Web](/media/jg/ext/oss.javaguide.cn/p3-juejin/ba628fd37fdc4ba59c1a74eae32e03b1-tplv-k3u1fbpfcp-164a1a86.jpg)

7. **URL (Uniform Resource Locator)**: A compact string representation of the location and access method of resources available on the Internet. Each file on the Internet has a unique URL indicating its location and how browsers should handle it.
8. **HTTP (HyperText Transfer Protocol)**: The most widely used network protocol on the Internet. All Web documents must follow this standard. Designed initially to publish and receive HTML pages. In 1960, Ted Nelson conceived a method of handling text via computers called hypertext, which laid the foundation for the HTTP protocol architecture.

   In essence, HTTP is an agreed communication format between browsers and servers. Its operating principle is shown below:

   ![HTTP Client and Server Request-Response Process](/media/jg/ext/oss.javaguide.cn/p3-juejin/8e3efca026654874bde8be88c96e1783-tplv-k3u1fbpfcp-17ed6806.jpg)

9. **Proxy Server**: A network entity also known as a Web cache. A proxy server caches recent requests and responses on local disks. When a new request arrives, if the proxy finds it matches a cached request, it returns the cached response directly without accessing the origin server across the Internet. Proxy servers can operate on the client side, server side, or intermediate systems.
10. **SMTP (Simple Mail Transfer Protocol)**: A set of rules for transferring mail from a source address to a destination address, controlling relay methods. It helps computers find the next destination when sending or forwarding mail, delivering emails to recipient mail servers in minutes. SMTP servers follow the SMTP protocol to send and relay emails.

    ![Process of an Email Being Sent](/media/jg/ext/oss.javaguide.cn/p3-juejin/2bdccb760474435aae52559f2ef9652f-tplv-k3u1fbpfcp-6e77bf6d.png)

    <p style="text-align:right;font-size:12px">https://www.campaignmonitor.com/resources/knowledge-base/what-is-the-code-that-makes-bcc-or-cc-operate-in-an-email/</p>

11. **Search Engine**: A system that gathers information from the Internet according to specific strategies using computer programs, organizes and processes the data, and provides retrieval services to users. Types include full-text indexing, directory indexing, meta search engines, vertical search engines, and portal search engines.
12. **Vertical Search Engine**: A specialized search engine focusing on a specific industry or niche. It extracts and structures specialized information to return targeted data to users. Compared to general search engines, vertical search engines are characterized by being "specialized, refined, and deep".
13. **Full-Text Indexing**: A core technique in modern search engines. Searching a term in a 1 MB file may take seconds, but in a 100 MB file, it may take tens of seconds, which becomes unfeasible at scale. Full-text indexing (often using inverted index techniques) addresses this problem.
14. **Directory Index**: Categorizes websites into hierarchical directories, allowing users to query by keyword or browse through categories step by step.

### 6.2. Summary of Key Knowledge Points

1. File Transfer Protocol (FTP) uses reliable TCP transport services and operates in a client-server model. An FTP server process can serve multiple users concurrently. For file transfer, FTP establishes two parallel TCP connections: a control connection and a data connection. Actual file data travels over the data connection.
2. The protocol used for interaction between Web clients and servers is HTTP. HTTP relies on TCP connections for reliable transmission, but HTTP itself is connectionless and stateless. HTTP/1.1 introduced persistent connections (non-pipelined and pipelined).
3. Email delivers messages to the recipient's mail server into the user's mailbox, where the recipient can read them at any time.
4. An email system has three key components: User Agents (UA), mail servers, and mail protocols (mail transfer protocols like SMTP, and mail retrieval protocols like POP3 and IMAP). Both user agents and mail servers run these protocols.

### 6.3. Supplementary Notes (Important)

Pay close attention to these key topics:

1. Common application layer protocols (with special focus on HTTP)
2. Domain Name System (DNS) — resolving IP addresses from domain names
3. General process of accessing a website
4. Concepts of system calls and Application Programming Interfaces (APIs)
