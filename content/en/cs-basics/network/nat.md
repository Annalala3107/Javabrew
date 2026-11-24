---
title: Detailed Explanation of NAT Protocol (Network Layer)
description: Analyzes the address translation and port mapping mechanisms of NAT, examining LAN/WAN communications, NAT translation tables, and practical details of home and enterprise networking.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: NAT,Address Translation,Port Mapping,LAN,WAN,Connection Tracking,DHCP
lang: en
sourceRef: zh-ref/cs-basics/network/nat.md
---

Many devices in home networks and corporate intranets use private IP addresses, such as `192.168.x.x` or `10.x.x.x`. These addresses cannot be directly routed across the public internet, yet internal devices can seamlessly access internet resources.

Behind this capability, NAT is usually at work. NAT translates between internal private addresses and external public addresses, enabling multiple intranet hosts to share a single or a small pool of public IP addresses for outward communication.

This article primarily addresses several questions:

1. What primary problem does NAT solve?
2. How does the NAT translation table record internal and external address/port mappings?
3. When an intranet host communicates with the public internet, what changes occur to its source IP and port?
4. What limitations does NAT introduce, such as why external hosts initiating connections to internal hosts is significantly more complex?

## Application Scenarios

The application scenario of the **NAT Protocol (Network Address Translation)** matches its name—network address translation—operating during address transitions between internal and external networks. Specifically, within a small subnet (Local Area Network, LAN), hosts utilize IP addresses belonging to the same private LAN address space. However, outside of this LAN, across the Wide Area Network (WAN), a unified public IP address is required to represent the LAN's location across the global Internet.

This scenario is easy to understand. With the proliferation of Small Office and Home Office (SOHO) setups, subnets were designed to manage these small networks. Consequently, the total number of connected hosts across the global Internet became immense. If every host required an "absolutely unique" routable IP address, the IPv4 address space ($2^{32}$) would have been exhausted almost immediately. Therefore, IP addresses within SOHO subnets are "relative" (private), which substantially relieved the allocation pressure on IPv4 addresses.

The "proxy" or public-facing gateway of a SOHO subnet is typically a router. The router's LAN interface manages the small private subnet, while its WAN interface actively participates in the wider Internet and possesses an "absolutely unique public address." When hosts within the LAN communicate with the outside world, the NAT protocol plays a pivotal role in translating addresses.

## Technical Details

![The process of NAT translating internal private addresses into public addresses](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/nat-demo-5ee39bba.png)

Suppose we have the scenario depicted above. In the center is a router, whose right side organizes a LAN with network prefix `10.0.0/24`. The LAN interface IP address is `10.0.0.4`, and there are at least three internal hosts: `10.0.0.1`, `10.0.0.2`, and `10.0.0.3`. The router's left side connects to the WAN, with a WAN interface IP address of `138.76.29.7`.

First, based on the above setup, several facts should be clarified:

1. The network address of the subnet on the right side of the router is `10.0.0.0/24` (24-bit network prefix, 8-bit host identifier). The addresses of the three hosts and the router's LAN interface are all assigned via DHCP. Furthermore, this DHCP service runs internally on the router itself (the router maintains an embedded DHCP server) to provide DHCP leasing for the subnet.
2. The router's WAN interface address is likewise assigned via DHCP, but this address is leased from the ISP (Internet Service Provider); that is, the corresponding DHCP service runs on the ISP's regional DHCP server.

Now, the router runs the NAT protocol internally to supply address translation between the LAN and WAN. To achieve this, a crucial data structure is the **NAT Translation Table**. To illustrate how NAT functions in detail, consider the following outbound request:

1. Host `10.0.0.1` sends an HTTP request (such as requesting a web page) to a web server at IP address `128.119.40.186` (port 80). Host `10.0.0.1` randomly assigns an ephemeral port, say `3345`, as the source port for this request, and sends the packet to the router (the destination IP is `128.119.40.186`, but it physically reaches the router's LAN interface `10.0.0.4` first).
2. The router's LAN interface `10.0.0.4` receives the request from `10.0.0.1`. The router allocates a new external source port for this request, say `5001`, and forwards the packet out through its WAN interface `138.76.29.7`. Concurrently, it records a translation entry in the NAT table: **138.76.29.7:5001 <-> 10.0.0.1:3345**.
3. The request packet traverses the WAN interface and travels onward across the Internet to the destination host `128.119.40.186`.

Subsequently, the following response flow takes place:

1. The destination host `128.119.40.186` receives the request, constructs an HTTP response packet, and transmits it back to the destination `138.76.29.7:5001`.
2. The response packet arrives at the router's WAN interface. The router inspects its NAT translation table, finds that an entry exists for `138.76.29.7:5001`, and rewrites the destination IP and port to `10.0.0.1:3345`, then hands the packet over to the LAN interface `10.0.0.4`.
3. The translated response packet exits the router's LAN interface and is forwarded onward to its final internal destination `10.0.0.1`.

![LAN-WAN communication with address translation](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/nat-demo2-d3a28ee1.png)

🐛 Correction (see: [issue#2009](https://github.com/Snailclimb/JavaGuide/issues/2009)): In step 4 of the diagram above, the Dest value should be `10.0.0.1:3345` rather than ~~`138.76.29.7:5001`~~; this was an erratum in the original graphic.

## Key Takeaways

Regarding the process detailed above, several essential points should be emphasized:

1. Although the transport port field is 16 bits, this does not imply that a NAT device can accommodate a maximum of only ~65,500 hosts behind it. The port space constrains the number of concurrent translation sessions that can be maintained for a specific external destination, transport protocol, mapping behavior, and session lifetime, rather than the total count of internal hosts. A single host can open multiple connections, and NAT gateways can also pool multiple public IP addresses.
2. From the perspective of the destination web server, it never knows "which internal host actually initiated the request"; it only knows that the request arrived from `138.76.29.7:5001` via the router. Thus, **the router acts as a shielding boundary between the WAN and LAN**. All packets sent outward by internal hosts appear under the same public IP (differentiated by distinct port numbers), and all inbound packets specify that single public destination IP (with different ports); only after NAT translation are external packets routed to the appropriate internal host.
3. Whether NAT reuses existing mappings does not depend solely on the internal IP. Mapping lookups evaluate at least the transport protocol, internal IP, and internal port; whether the remote destination IP and port are also factored in depends on the NAT implementation's specific mapping behavior. Only when incoming packets match an established mapping state can NAT reuse the external address and port tuple.

To summarize the key characteristics of the NAT protocol:

1. NAT effectively alleviates IPv4 address exhaustion by masking private LAN address spaces from the public WAN.
2. Internal IP address renumbering or changes within the LAN require no notification or updates to the WAN.
3. When the WAN ISP alters the router's external public IP address, internal hosts within the LAN require no reconfiguration.
4. NAT conceals internal topology and private addresses; the filtering behavior of many NAT devices makes it difficult for unsolicited external traffic without an existing mapping to reach internal hosts directly. However, it is the packet filtering policy that determines which inbound packets are admitted, not address translation per se. NAT cannot serve as a complete substitute for stateful firewalls, access control lists, or host-level security measures.

Nonetheless, NAT has spurred ongoing technical debates due to its architectural compromises. For example, as you may have observed, **outside the LAN, NAT identifies an internal host using its port number because all outbound IP addresses are identical**. Treating port numbers as host routing identifiers violates traditional layer separation. Furthermore, routers operate at the network layer, yet NAT modifies transport layer headers (rewriting source IPs and transport port numbers), which diverges from strict end-to-end layered architecture. In spite of these architectural compromises, NAT as a pragmatic product of the IPv4 era solved otherwise intractable address shortages and continues to be ubiquitously deployed today.
