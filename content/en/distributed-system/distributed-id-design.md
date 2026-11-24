---
title: "Distributed ID Design in Practice: Order Numbers, Coupons, Unified QR Payment, and Business ID Generation Strategies"
category: Distributed Systems
description: "Practical guide to distributed ID design covering order numbers, payment codes, coupons, unified QR payment, and other business scenarios—explaining globally unique ID design principles, business semantics, capacity planning, readability, and generation strategies."
tag:
  - Distributed ID
head:
  - - meta
    - name: keywords
      content: Distributed ID,Distributed ID Design,Order Number Generation,Coupon ID,Unified QR Payment,Business ID,Globally Unique ID,ID Generation Strategy,Distributed System Design
lang: en
sourceRef: zh-ref/distributed-system/distributed-id-design.md
---

::: tip

I came across a great article from Baidu Geek Talk discussing distributed ID design alongside concrete business scenarios, so I organized parts of its content here. Link to the original article: [Technical Principles and Project Practice of Distributed ID Generation Services](https://mp.weixin.qq.com/s/bFDLb6U6EgI-DvCdLTq_QA).

:::

The vast majority of articles on distributed ID generation services focus on dissecting technical principles, while very few discuss how to select and design an ID generation service based on specific business scenarios.

This article explores concrete business requirements for IDs across several real-world use cases.

If you have not yet reviewed the principles and trade-offs behind UUID, segment mode, Snowflake, Leaf, and Tinyid, read [Distributed ID Generation Solutions Explained](./distributed-id.md) first. This article leans more toward business design: even though they are all IDs, order numbers focus more on queryability and security, TraceIds focus on propagation across call chains, and short URLs focus on length and readability.

## Scenario 1: Order System

When shopping in stores or online, we frequently encounter unified payment QR codes ("pay with one code"), order numbers generated at checkout, coupon codes, and bundled product redemption codes. Why are some numbers so long while others are only a few digits? Why do some numbers immediately reveal year, month, and day information while others appear completely meaningless? Below, we analyze the concrete ID service implementations across different scenarios in an order system.

### 1. Unified QR Payment ("One-Code Payment")

A unified QR payment code allows a single QR code to be scanned and paid using either Alipay or WeChat Pay.

At its core, a QR code is simply a string, and an aggregated payment code is simply a URL. Users can scan a single code directly with Alipay or WeChat without worrying about scanning a WeChat QR code with Alipay or vice versa, greatly reducing checkout time.

Behind the scenes, after a user scans the code inside an app, the backend detects the scanning environment (WeChat, Alipay, QQ Wallet, JD Pay, UnionPay QuickPass, etc.).

It identifies the scanning environment from the HTTP headers sent by the in-app browser when opening the link. Whenever any browser opens an HTTP URL, its request headers include the `User-Agent` (UA) string.

The UA is a special header string from which the server can identify the user's operating system and version, CPU architecture, browser and version, rendering engine, browser language, plugins, and more.

Different payment channels use different payment product names—always read each payment product's API documentation carefully:

1. WeChat Pay: JSAPI Payment
2. Alipay: Mobile Web Payment (WAP Pay)
3. QQ Wallet: Official Account Payment

Essentially, all of them implement HTML5 payments inside the app's built-in browser.

![Wenku membership payment example](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-pay-one-card-27bd61a0.png)

Engineers on Baidu Wenku iterated on and optimized this approach. They dynamically generate a unified QR code pre-bound to the user's selected product information and price, updating dynamically as the selection changes. This not only supports launching payment across multiple platforms from one QR code, but also lets the user complete payment seamlessly without manually selecting items or entering amounts. Only after the user actually scans the code does the server retrieve the user's UID via the frontend, combine it with the product info bound to the QR code, create the real order, send payment details to the third-party provider (QQ, WeChat, Alipay), and let the third-party provider generate the payment order and push it to the user's device to invoke checkout.

Unlike static unified QR codes, Wenku uses dynamic QR codes. A QR code is essentially a short URL, and the ID service supplies the unique identifier parameter for that short URL. The ID mapped by the unique short URL binds the product's order information—tightly integrating technology with business logic to shorten the payment flow and enhance the user's checkout experience.

### 2. Order Numbers

In real business workflows, an order number serves as the unique identifier of an order, typically supporting scenarios such as:

1. Users contacting customer service for assistance when an order runs into issues;
2. Order operations such as offline payment collection and order verification/redemption;
3. Internal order lifecycle processing and tracking, including placing, modifying, completing, refunding, and after-sales handling.

When searching for order details, the order ID is almost always used as the unique identifier, determined by the uniqueness guarantee of the order number generation rules. From a technical standpoint, beyond the foundational properties required of an ID service, order number design needs to reflect several characteristics:

**(1) Information Security**

The numbering scheme must not leak company operational metrics—such as daily order volume or internal sequence volume—nor expose business intelligence or user privacy data such as phone numbers or national ID numbers. Moreover, it must not exhibit an obvious global sequential pattern (partial/local patterns are fine); allowing someone to query another order simply by altering a single digit is strictly unacceptable.

By analogy to examinee registration numbers in the Chinese college entrance exam (Gaokao), numbers must never be strictly consecutive—otherwise anyone could iterate sequentially to inspect other candidates' scores, which is completely unacceptable.

**(2) Partial Readability**

The digit length must be practical to handle, so order numbers should have a moderate length with localized structure. This makes lookups convenient for customer service when handling order anomalies or returns.

Overly long or hard-to-read order numbers make manual entry difficult and error-prone for support agents, hurting after-sales user experience. Therefore, in real-world scenarios, order numbers commonly embed harmless, helpful metadata—such as date, day of the week, or business type—depending on the specific usage context.

Furthermore, monotonically advancing components like date or day of the week help prevent order number collisions over long periods of accumulated business traffic.

**(3) Query Efficiency**

Order numbers on major e-commerce platforms are mostly composed purely of digits: besides being readable, integer types offer better query efficiency than `varchar` types and are friendlier to online transactional workloads.

### 3. Coupons and Redemption Vouchers

Coupons and redemption vouchers are among the most common promotional tools used by operations teams; used effectively, they deliver savings to buyers while boosting merchant sales. Common scenarios include:

1. Purchasing a bundled product like "Wenku VIP + QQ Music Annual Membership" on Wenku and receiving a QQ Music redemption code upon successful payment to redeem in the QQ Music app;
2. Consumption vouchers distributed by local governments during the pandemic;
3. Bottle-cap promo codes on bottled beverages that users enter to claim prizes.

![Redeeming prizes with a promo code](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-coupon-21426ab7.png)

From a technical perspective, some scenarios suit on-demand ID generation—for example, claiming coupons while shopping on an e-commerce platform, where coupon records can simply be assigned when the user claims them. Other online-to-offline scenarios—such as government stimulus vouchers, bottle-cap sweepstakes, JD gift cards, or supermarket gift cards—require pre-generation. Pre-generated voucher codes exhibit the following characteristics:

1. Pre-generated and supplied ahead of the campaign launch for promotional warm-up;

2. Huge volume, measured in tens of thousands—typically 100,000+ codes;

3. Uncrackable and impossible to forge;

4. Support one-time verification/redemption upon use;

5. Coupons and vouchers follow a wide-net distribution strategy with low redemption rates, making them poorly suited for pre-storing every code in a database **(wastes storage while holding very little active data)**.

In terms of design strategy, we need a voucher code generation scheme that supports pre-generation, supports validation, remains concise, and ensures every generated code is unique. Such a strategy is essentially a specialized encoding/decoding scheme built around agreed rules to satisfy all requirements above.

Since it is an encoding/decoding scheme, we first define the encoding alphabet (the characters visible to users in a redemption code), consisting of `a-z`, `A-Z`, and digits `0-9`. To improve legibility, uppercase `O` and `I` are excluded, leaving 60 usable characters:

abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXZY0123456789

As noted earlier, redemption codes should be as concise as possible, so we must plan the character length carefully. Assuming a maximum length of 12 characters with an alphabet size of 60, the representable space is 60^12=130606940160000000000000 (meaning a 12-character redemption code provides an astronomical keyspace—more than enough for the operations team to spend), which converts to binary as:

1001000100000000101110011001101101110011000000000000000000000 (61 bits)

**Component Breakdown of a Redemption Code**

Redemption codes can be pre-generated without requiring extra database space to store every unused entry. Each promotional campaign has its own independent set of redemption codes (meaning codes from different campaigns run by operations cannot be mixed—e.g., Double 11 codes cannot be used in a Double 12 campaign). Every redemption code has its own serial number to prevent duplication, and data validation is needed to verify code authenticity. The data layout of the redemption code is structured as follows:

Campaign Plan ID + Redemption Code Sequence Number `i` + Checksum

**Encoding Scheme**

1. **Redemption code sequence number `i`**: Represents the `i`-th redemption code within the current campaign. Its bit width determines how many codes a promotional campaign can issue. Using 30 bits yields a range of 1,073,741,824 (over 1 billion voucher codes).
2. **Campaign plan ID**: Represents the ID of the promotional campaign. Its bit width determines how many campaigns can be organized. Using 15 bits yields a range of 32,768 (given campaign frequency and an initial ID offset of 10,000, 15 bits is plenty—even running a campaign every single day of the year, 365 days/year, it lasts 54 years).
3. **Checksum**: Validates whether a redemption code is genuine, enabling fast verification of code integrity while also acting as padding to enhance data dispersion. It uses 13 bits split into two parts: the first 6 bits and the last 7 bits.

At a deeper business level, systems also distinguish between universal promo codes and individual single-use codes, each with distinct traits requiring tailored technical designs:

1. **Universal codes**: Multiple users can enter the same code to redeem, governed by total issuance caps and expiration limits.
2. **Individual codes**: Operations staff configure reward items, expiration dates, and quantities in the admin console; the backend generates a list of unique codes, each invalidated immediately upon redemption.

## Scenario 2: Tracing

### 1. Log Tracing

In a distributed service architecture, a web request entering through the API gateway may invoke multiple downstream services to process the request and return the final result. Communication between these services involves separate network calls; any service along the path failing or responding slowly degrades the frontend experience.

When a single web request fans out across many services, the standard way to quickly pinpoint which service encountered an issue is to introduce distributed tracing across the entire system.

![In distributed tracing](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-tracing-5d3a4ae4.png)

Distributed tracing has two core concepts: **Trace** and **Span**. A `Trace` represents the end-to-end call-chain view of a request across the distributed system, while a `Span` represents the view inside individual service hops along the chain; combining all spans reconstructs the entire trace view.

Throughout the call chain, the request carries the `TraceId` downstream to every service, while each service also generates its own `SpanId` to capture its internal call view and propagates it together with the `TraceId` to downstream services.

### 2. TraceId Generation Rules

In this scenario, generated IDs must not only be unique, but also offer extremely high generation efficiency and throughput. Ingress server instances must be able to generate `TraceId`s autonomously: if every trace needed to call a shared ID service to obtain an ID, it would purely waste network bandwidth, block user requests before forwarding downstream, increase response latency, and introduce unnecessary risk. Therefore, server instances should compute `TraceId` and `SpanId` locally without depending on external services.

Generation rule: `Server IP + ID Generation Timestamp + Auto-Increment Sequence + Current Process ID`, for example:

0ad1348f1403169275002100356696

The first 8 characters `0ad1348f` represent the IP of the machine that generated the `TraceId`, encoded in hexadecimal where every two hex digits correspond to one IP octet. Converting every two digits to decimal gives the familiar IPv4 address `10.209.52.143`, allowing you to locate the first server the request hit based on this pattern.

The next 13 digits `1403169275002` represent the timestamp when the `TraceId` was generated. The following 4 digits `1003` are an auto-incrementing sequence cycling from `1000` up to `9000`, wrapping back to `1000` once it reaches `9000`. The final 5 digits `56696` represent the current process ID (PID); appending the PID prevents `TraceId` collisions when multiple processes run on the same host.

### 3. SpanId Generation Rules

A `Span` denotes a level or hop—for example, the first instance is level 1, and when a request is proxied or routed to the next instance for processing, that becomes level 2, and so on. Through hierarchy levels, `SpanId` represents the position of the current call within the entire call-chain tree.

Suppose server instance A receives a user request and acts as the root node of the entire call. Non-RPC log records produced by layer A for this request all have `SpanId = 0`. If layer A makes sequential RPC calls to three server instances B, C, and D, then in A's logs the `SpanId`s are `0.1`, `0.2`, and `0.3`, and inside B, C, and D the `SpanId`s are likewise `0.1`, `0.2`, and `0.3`. If system C further calls two server instances E and F while handling the request, the `SpanId`s logged in system C are `0.2.1` and `0.2.2`, and the logs in E and F are also `0.2.1` and `0.2.2`.

As shown above, collecting all `SpanId`s across a single request reconstructs a complete call-chain tree.

**The essence of `SpanId` generation is propagating across layers while incrementing hierarchical major/minor version numbers.**

## Scenario 3: Short URLs

A short URL service primarily provides two core capabilities: URL shortening and URL restoration (redirection). Compared with long URLs, short URLs are far easier to share in emails, social networks, Weibo, and SMS/mobile apps—turning a very long URL into a compact short URL avoids line wrapping and character-limit truncation.

![Role of short URLs](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-short-url-78ae2b0c.png)

Common ID generation services such as MySQL auto-increment IDs, Redis key increments, and segment mode all produce numeric IDs. When a short URL service converts a customer's long URL into a short URL, it appends the newly generated numeric ID after the `dwz.cn` domain. Using the raw decimal numeric ID directly can still result in a fairly long URL, so the service can compress its length by converting the numeric ID into a higher-radix base (such as Base62). This base-conversion compression algorithm is increasingly widespread in short URL implementations because it shrinks URL length significantly and has broad practical applications. For example:

- Customer's long URL: <https://wenku.baidu.com/ndbusiness/browse/wenkuvipcashier?cashier_code=PCoperatebanner>
- Short URL mapped directly by numeric ID: <https://dwz.cn/2047601319t66> (for demonstration only; may not open properly)
- Short URL after base conversion: <https://dwz.cn/2ezwDJ0> (for demonstration only; may not open properly)
