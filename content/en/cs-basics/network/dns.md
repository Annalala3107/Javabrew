---
title: Detailed Explanation of DNS Domain Name System (Application Layer)
description: Detailed explanation of DNS hierarchical architecture and resolution workflows, covering recursive/iterative queries, caching, authoritative servers, application layer port 53, and UDP/TCP dynamics.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: DNS,Domain Name Resolution,Recursive Query,Iterative Query,Caching,Authoritative DNS,Port 53,UDP
lang: en
sourceRef: zh-ref/cs-basics/network/dns.md
---

After entering a domain name in the browser address bar, and before actually initiating an HTTP request, the request typically must first go through DNS resolution.

DNS addresses the **mapping between domain names and IP addresses**. While it might appear as simple as "translating a domain name into an IP address," beneath the surface lies a comprehensive suite of mechanisms including local caching, recursive queries, iterative queries, authoritative servers, root servers, and UDP/TCP protocol switching.

This article primarily addresses several questions:

1. Why does DNS require a hierarchical distributed design?
2. What specific steps does a full domain name resolution process typically traverse?
3. What is the fundamental difference between recursive queries and iterative queries?
4. Why is DNS typically based on UDP, and under what circumstances does it switch to TCP?

![System Overview of DNS Resolving Domain Names to IP Addresses](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/dns-overview-4619e349.png)

In practical usage, there is a scenario where the browser does not need to invoke DNS at all to determine the mapping between a domain name and an IP address. The local operating system maintains a `hosts` file. Generally speaking, the system first checks whether the target domain name exists in the local `hosts` list; if present, it directly extracts the mapped IP address record. Only when no corresponding entry exists in the local `hosts` file does DNS take the stage.

Currently, DNS is designed using a distributed, hierarchical database structure. **DNS is an application layer protocol, typically operating over UDP on port 53**. When response data exceeds the UDP packet payload boundary (historically 512 bytes, extensible via EDNS0) or during Zone Transfers between DNS servers, it switches to TCP to ensure complete data integrity.

![Overview of TCP/IP Layer Protocols](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-protocol-overview-09ff1718.png)

## DNS Servers

DNS can be described from two dimensions: authoritative hierarchy and query-side roles. The authoritative hierarchy encompasses root servers, top-level domain (TLD) servers, and authoritative servers for specific zones; the query side includes stub resolvers, recursive resolvers, and forwarders. A single software suite or server host may take on multiple roles simultaneously, so these categories are functional roles rather than mutually exclusive "server hardware classes."

- **Root DNS Servers**: Root servers provide querying resolvers with referral information pointing to the relevant Top-Level Domain (TLD) servers.
- **Top-Level Domain (TLD) DNS Servers**: Top-level domains represent the suffixes of domain names, such as `.com`, `.org`, `.net`, and `.edu`, as well as country-code TLDs like `.uk`, `.fr`, and `.ca`. TLD servers typically return referral records pointing to the authoritative servers for the requested domain.
- **Authoritative DNS Servers**: Authoritative servers store the official DNS records for one or more DNS zones and deliver authoritative answers to queries matching those zones.
- **Recursive Resolvers**: Local network gateways, ISPs, or public DNS providers typically offer recursive resolvers. A recursive resolver accepts queries from client endpoints, consults its local cache first, and, when necessary, orchestrates sequential queries across root, TLD, and authoritative servers. Recursive resolvers represent a query-side consumer role rather than a tier in the authoritative publishing hierarchy.

**Are there really only 13 root servers in the world?** This is a long-standing technical misconception. If you search online, you will still encounter outdated articles claiming that "there are only 13 root servers globally, and all are controlled by the United States."

**This is entirely inaccurate.**

The root server system logically defines 13 named root server identities, labeled from `a.root-servers.net` to `m.root-servers.net`, managed by 12 independent operating entities. This count stems from the historical payload size constraints of DNS over UDP, but it must not be misconstrued as meaning there are only 13 physical server boxes worldwide.

Behind each of the 13 logical root server identities, numerous physical server instances are deployed globally using **IP Anycast**. BGP routing dynamically steers DNS queries to the most suitable instance along the network topology path, which is not necessarily the physically closest instance. The total number and locations of active instances continuously evolve; authoritative real-time metrics should be referenced directly at **[Root-Servers.org](https://root-servers.org/)**.

![Root-Servers.org Global Root Server Instance Distribution](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/root-servers-org-104d0b1d.png)

## DNS Resolution Workflow

Using the illustration below as an example, let us examine the DNS query and resolution process. DNS query resolution operates in two primary modes:

- **Iterative**
- **Recursive**

The diagram below depicts the hybrid approach commonly deployed in practice: the query from the requesting client host to the local DNS server is recursive, whereas the subsequent queries performed by the local DNS server are iterative.

![DNS Resolution Workflow Combining Recursive and Iterative Queries](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-process-f2f3a36e.png)

Suppose host `cis.poly.edu` wants to resolve the IP address of `gaia.cs.umass.edu`. Assume the local DNS server for `cis.poly.edu` is `dns.poly.edu`, and the authoritative DNS server for `gaia.cs.umass.edu` is `dns.cs.umass.edu`.

1. First, host `cis.poly.edu` sends a DNS query to its local DNS server `dns.poly.edu`, containing the target domain name `gaia.cs.umass.edu`.
2. The local DNS server `dns.poly.edu` inspects its local cache. Finding no cached record, and not knowing where the IP for `gaia.cs.umass.edu` resides, it forwards a query to a root server.
3. The root server observes that the query contains the `edu` top-level domain, and therefore instructs the local DNS server to query the `edu` TLD DNS server, providing its referral address.
4. Having acquired the address of the `edu` TLD DNS server, the local DNS server sends a request to it asking for `gaia.cs.umass.edu`.
5. The `edu` TLD DNS server does not have the final IP address either, but noticing the `umass.edu` domain label, it returns a referral informing the local DNS server that the authoritative DNS server for `umass.edu` holds the record.
6. This time, the local DNS server directs its query directly to the authoritative DNS server `dns.cs.umass.edu`.
7. Because `gaia.cs.umass.edu` is officially registered with this authoritative server, the record is present, and `dns.cs.umass.edu` successfully returns the mapped IP address to the local DNS server.
8. Finally, the local DNS server receives the resolved IP address and delivers it back to the requesting host.

In addition to iterative queries, a purely recursive query flow can also be implemented as shown below, where each server queries the next on behalf of the requester, though the overall sequence of delegation remains conceptually similar.

![DNS Pure Recursive Query Resolution Flow](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-process2-ff949d9c.png)

Recursive resolvers cache referrals and resource records acquired from earlier queries; consequently, many lookups avoid traversing all the way from the root servers. As long as the cached records remain within their valid TTL window, the resolver can directly contact known TLD or authoritative servers, substantially shortening query latency and mitigating load on upstream infrastructure.

## DNS Packet Format

The structure of a DNS message is shown in the figure below:

![DNS Query and Response Packet Field Structure](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-packet-ea94a1c1.png)

DNS messages are divided into query messages and response messages, both sharing an identical overall structural format.

- **Identification (Transaction ID)**: 16 bits, identifying the specific query. This identifier is copied into the corresponding response message so the client can correlate outbound requests with incoming replies.
- **Flags**: A 1-bit QR (Query/Response) flag (`0` for query, `1` for response); a 1-bit AA (Authoritative Answer) flag (indicating the responding server is an authoritative server for the queried name); a 1-bit RD (Recursion Desired) flag explicitly requesting recursive resolution; and a 1-bit RA (Recursion Available) flag set in response messages indicating the server supports recursive queries.
- **Question Count, Answer RR Count, Authority RR Count, Additional RR Count**: Indicate the number of resource records appearing in each of the four subsequent data sections.
- **Question Section**: Contains the domain name being queried along with the query type (e.g., A, AAAA, MX).
- **Answer Section**: Contains the Resource Records answering the original query. **The answer section can contain multiple RRs, allowing a single domain name to resolve to multiple IP addresses.**
- **Authority Section**: Contains records pointing to other authoritative servers.
- **Additional Section**: Contains other helpful contextual records (such as glue records resolving authoritative server names to IP addresses).

## DNS Resource Records

When answering queries, DNS servers look up their zone databases. Each entry stored in the database is known as a **Resource Record (RR)**. An RR provides a specific mapping from a name to data. An RR is formally represented as a 4-tuple: `(Name, Value, Type, TTL)`.

![DNS Resource Record 4-Tuple Fields](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/20210506174303797-6b425e8a.png)

`TTL` (Time To Live) is the lifespan of the record, dictating when the resource record must be evicted from intermediate caches.

The semantic meaning of the `Name` and `Value` fields depends on the record `Type`:

![Meaning of Name and Value Across Different DNS Record Types](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/20210506170307897-b39e793c.png)

- If `Type=A`, `Name` is the hostname and `Value` is the corresponding IPv4 address. Such an RR maps a host name directly to an IPv4 address.
- If `Type=AAAA`, it operates analogously to an `A` record, with the distinction that `A` uses IPv4 while `AAAA` maps to an IPv6 address.
- If `Type=CNAME` (Canonical Name Record), `Value` is the canonical (true) hostname for the alias specified in `Name`. `CNAME` records map an alias hostname to another canonical hostname, allowing aliases for existing `A` records. An example is provided below.
- If `Type=NS`, `Name` represents a domain zone, and `Value` is the hostname of an authoritative DNS server capable of resolving hosts within that zone. Such records are typically published by TLD servers.
- If `Type=MX`, `Value` is the canonical hostname of the mail server associated with the alias name in `Name`. Because `MX` records exist, mail servers can share an alias name with other web servers. To retrieve the mail server canonical name, an `MX` query is performed; to retrieve general canonical hostnames, a `CNAME` query is issued.

A `CNAME` record always points to another domain name rather than directly to an IP address. Consider the following DNS zone configuration:

```plain
NAME                    TYPE   VALUE
--------------------------------------------------
bar.example.com.        CNAME  foo.example.com.
foo.example.com.        A      192.0.2.23
```

When a client queries `bar.example.com`, the DNS server resolves through the alias chain and ultimately returns the IP address corresponding to `foo.example.com`.

## References

- DNS Server Types: <https://www.cloudflare.com/zh-cn/learning/dns/dns-server-types/>
- DNS Message Resource Record Field Formats: <http://www.tcpipguide.com/free/t_DNSMessageResourceRecordFieldFormats-2.htm>
- Understanding Different Types of Record in DNS Server: <https://www.mustbegeek.com/understanding-different-types-of-record-in-dns-server/>
