---
title: Detailed Explanation of ARP Protocol (Network Layer)
description: Explains the ARP address resolution mechanism and packet workflow, covering ARP cache tables, broadcast queries, unicast responses, and attack/defense concepts.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: ARP,Address Resolution,IP to MAC,Broadcast Query,Unicast Response,ARP Table,Spoofing
lang: en
sourceRef: zh-ref/cs-basics/network/arp.md
---

IP addresses are responsible for network layer addressing, but when data frames are actually forwarded across a local area network (LAN), the MAC address of the next-hop device is required.

ARP addresses this translation challenge: **given a target IP address, how to discover its corresponding MAC address**. While it appears straightforward, ARP bridges the network layer and data link layer, forming the cornerstone for understanding LAN communication, gateway forwarding, and ARP spoofing.

This article primarily addresses several questions:

1. Where does ARP reside within the protocol stack?
2. How does ARP accomplish address resolution through broadcast queries and unicast responses?
3. What is the role of the ARP table, and what impacts arise when cache entries expire?
4. How do common ARP attacks occur, and how can they be defended against?

## MAC Address

Before introducing the ARP protocol, it is essential to understand MAC addresses.

The full name of MAC address is **Media Access Control Address**. It is used to identify link-layer network interfaces and deliver data frames across local network segments. It belongs to a network interface rather than serving as a permanent identity for an entire device; a single physical machine can possess multiple network interfaces, each utilizing a distinct MAC address.

![The back of a router indicates its MAC address](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/router-back-will-indicate-mac-address-8fe99cd5.jpg)

A MAC address is also commonly termed a LAN address, physical address, or Ethernet address. Unlike IP addresses used for network-layer routing, MAC addresses operate primarily within the local link or broadcast domain.

> Another important fact to note is that not only do end-user network resources have IP addresses, but networking devices such as routers also have IP addresses. Structurally, network equipment like routers form a network, typically an internal network (intranet), so the IP addresses they employ are generally private IP addresses. When internal devices communicate with nodes outside the local network, the NAT protocol is required.

In Ethernet, common MAC addresses use the 6-byte (48-bit) EUI-48 standard. The IEEE assigns block allocations such as MA-L, MA-M, and MA-S to equipment manufacturers, who then assign globally managed unique addresses; locally administered addresses also exist and do not require global IEEE allocation. Operating systems can modify or randomize MAC addresses, so an address is not guaranteed to remain permanently immutable, and identical MAC addresses might appear across physically separate networks.

Finally, remember that the MAC address has a special address: `FF-FF-FF-FF-FF-FF` (all-1s address), which signifies the broadcast address.

## How the ARP Protocol Operates

A fundamental prerequisite for the operation of the ARP protocol is the **ARP table**.

Within a local area network, each network device maintains its own ARP table. The ARP table records IP-to-MAC address mappings for certain other network nodes, stored in the format of an `<IP, MAC, TTL>` 3-tuple. Here, `TTL` represents the lifespan (Time To Live) of that mapping entry, with a typical value around 20 minutes; once expired, the entry is invalidated and evicted.

The operational mechanism of ARP will be discussed across two scenarios:

1. **MAC addressing within the same local area network (LAN)**;
2. **Addressing network devices across different local area networks**.

### MAC Addressing Within the Same LAN

Suppose we have the following scenario: Host A with IP address `137.196.7.23` wishes to send an IP datagram to Host B with IP address `137.196.7.14`, located within the exact same LAN.

> To reiterate: when a host transmits an IP datagram (at the network layer), it only knows the destination IP address, but not the destination MAC address. The ARP protocol is precisely what resolves this missing piece.

To accomplish this goal, Host A must employ the ARP protocol to acquire Host B's MAC address, encapsulate the IP datagram into a link-layer frame, and transmit it to the next hop. Within this LAN, the following sequence of events unfolds chronologically:

1. Host A consults its internal ARP table and finds no entry corresponding to Host B's IP address; thus, it has no way of knowing Host B's MAC address.

2. Host A constructs an ARP query packet and broadcasts it across its local network.

   ARP query and response packets share an identical field structure, comprising the protocol addresses and hardware addresses of both sender and target. When Host A sends its request, the sender IP, sender MAC, and target IP within the ARP packet are known, while the target hardware address remains unknown and is typically filled with zeroes. It is the carrying **Ethernet frame** that sets its destination MAC to the broadcast address `FF-FF-FF-FF-FF-FF`, allowing all interfaces within the current broadcast domain to receive the request. Do not confuse the Ethernet frame destination MAC with the target hardware address field inside the ARP payload.

3. The query packet constructed by Host A is broadcast across the LAN. In theory, every connected device receives this packet and checks whether the target IP address matches its own IP. If it matches, the packet has reached Host B; otherwise, the query is irrelevant to the device and is quietly discarded.

4. After receiving the query packet, Host B verifies that the inquiry is directed at itself, and constructs an ARP response packet with a single destination—Host A—and sends it to Host A. Concurrently, Host B extracts the IP address and MAC address of Host A from the query packet and creates an IP-to-MAC mapping entry for Host A in its own ARP table.

   The ARP response packet shares the same structural layout as the query packet, except that the source and destination IP addresses are swapped, the source MAC is set to Host B's own MAC, and the destination MAC is set to that of the query sender. That is, the ARP response packet has a single unicast destination rather than being broadcast.

5. Host A ultimately receives Host B's response packet, extracts the IP and MAC addresses from the packet, forms the mapping tuple, and inserts it into its local ARP table.

![Acquiring target host MAC address via ARP within the same LAN](/media/jg/local/cs-basics/network/images/arp/arp_same_lan-db1595.png)

Throughout this entire process, several complementary points warrant highlighting:

1. When Host A wants to send an IP datagram to Host B, if Host B's IP-MAC mapping already exists in Host A's ARP table, Host A does not need to broadcast; it simply retrieves the MAC address and builds the link-layer frame directly.
2. The mapping entries in the ARP table have an expiration lifespan, typically 20 minutes.
3. Upon receiving the query packet from the requesting host, the target host immediately caches the requesting host's IP-MAC mapping in its own ARP table; this allows it to learn the target MAC address required to deliver its unicast response packet smoothly.

In summary, the ARP protocol is a **broadcast query, unicast response** protocol.

### MAC Addressing Across Different LANs

A more complex scenario arises when the sending Host A and receiving Host B reside in different subnets. Consider a typical topology where the two host subnets are interconnected by a router. Note that when we say a network device has an IP address and a MAC address, more rigorously speaking, this applies to each individual network interface. As an internetworking device, a router features multiple network interfaces, and each interface possesses its own non-overlapping IP address and MAC address. Therefore, when discussing ARP tables, each interface of a router maintains its own independent ARP table, rather than the entire router maintaining a single global table.

An Ethernet broadcast frame is received by all interfaces within the current broadcast domain, regardless of whether the target IP in the ARP message belongs to the sender's subnet; however, only the node that owns the target IP will respond. Before actually transmitting an IP datagram, a host consults its local routing table. If the destination address does not fall within its directly connected prefix, the host does not attempt to resolve the remote host's MAC; instead, it uses ARP to resolve the MAC address of the next-hop router interface. The chronological sequence of events proceeds as follows:

1. Host A checks its ARP table, seeking to find the MAC address of the local subnet interface on the target router.

   The target router refers to the gateway router capable of analyzing Host B's destination subnet from its IP address and forwarding the packet onward toward Host B.

2. If Host A cannot locate the MAC address of the target router's local subnet interface, it uses ARP to query that MAC address. Because the router interface and Host A reside within the same subnet, this step is identical to MAC addressing within the same LAN.

3. Once Host A acquires the router interface's MAC address, it constructs an IP datagram where the source IP is Host A and the destination IP is Host B. It then encapsulates it into a link-layer frame where the source MAC is Host A's MAC and the destination MAC is the **MAC address of the router interface connected to the local subnet**. Host A transmits this link-layer frame via unicast to the router interface.

4. The router interface receives the link-layer frame from Host A, decapsulates it, inspects the destination IP address, checks its forwarding table, and directs the IP datagram to the egress interface connected to Host B's subnet.

   At this stage, the datagram has transitioned from Host A's subnet into Host B's subnet.

5. The egress router interface consults its ARP table, seeking the MAC address of Host B.

6. If the router interface does not find Host B's MAC address, it employs ARP—broadcasting a query and receiving a unicast response—to obtain Host B's MAC address.

7. The router interface re-encapsulates the IP datagram into a link-layer frame with Host B's MAC address as the destination MAC, and unicasts it until it reaches its final destination.

![Router acquiring next-hop MAC address via ARP during cross-LAN communication](/media/jg/local/cs-basics/network/images/arp/arp_different_lan-addaef.png)
