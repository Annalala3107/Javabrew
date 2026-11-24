---
title: HTTP 1.0 vs HTTP 1.1: Core Differences in Persistent Connections, Caching, Host Header, and More (Application Layer)
description: A detailed comparison of the protocol differences between HTTP/1.0 and HTTP/1.1, covering persistent connections, pipelining, caching, status code enhancements, and practical impact.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: HTTP/1.0,HTTP/1.1,persistent connection,pipelining,caching,status code,Host,bandwidth optimization
lang: en
sourceRef: zh-ref/cs-basics/network/http1.0-vs-http1.1.md
---

HTTP/1.0 and HTTP/1.1 differ by only a minor version in name, but they exhibit significant differences in connection reuse, caching, the Host header, status codes, and bandwidth optimization.

These differences are not merely pedantic protocol details; they directly influence how browsers send requests, how servers reuse connections, how caching takes effect, and how virtual hosts operate.

This article primarily answers several questions:

1. What common status codes did HTTP/1.1 introduce compared to HTTP/1.0?
2. What are the differences between the caching mechanisms of HTTP/1.0 and HTTP/1.1?
3. Why does HTTP/1.1 support persistent connections by default?
4. What problems do the Host header and bandwidth optimization address, respectively?

Before diving in, let's briefly review the HTTP protocol:

![HTTP: Hypertext Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

## Response Status Codes

HTTP/1.0 defined only 16 status codes. HTTP/1.1 introduced a large number of new status codes; error response codes alone added 24 new variants. For instance, `100 (Continue)` allows a client to verify whether the server is willing to accept a large request body before sending it; `206 (Partial Content)` serves as the identifier code for range requests; `409 (Conflict)` indicates that the request conflicts with current rules governing the resource; and `410 (Gone)` signifies that the target resource is permanently unavailable, with no forwarding address known to the server.

## Cache Handling

Caching technology saves substantial network bandwidth and reduces the latency of information retrieval for users by eliminating unnecessary round trips between users and the origin server.

### HTTP/1.0

The caching mechanism provided by HTTP/1.0 is relatively simple. The server uses the `Expires` header to tag (with a timestamp) a response body; any request within the `Expires` timeframe will retrieve this cached response body. In the response body initially returned to the client, the server includes a `Last-Modified` header, which marks the last time the requested resource was modified on the server. In request headers, the client uses `If-Modified-Since` with a timestamp to query the server: "Has the resource I am requesting been modified since this time?" Typically, the value of `If-Modified-Since` in the request header matches the `Last-Modified` value received in the response when the resource was previously fetched.

If the server receives the request headers and determines that the resource indeed has not been modified since the `If-Modified-Since` time, it returns a `304 Not Modified` response header to the client, meaning: "The cache is valid, grab it from your browser cache!"

If the server determines that the resource has been modified after the `If-Modified-Since` timestamp, it returns a `200 OK` response body with the brand-new resource content, meaning: "The resource you requested has been updated; here is the fresh copy."

![HTTP/1.0 uses Expires and Last-Modified for cache validation](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.0cache1-c276ac.png)

![HTTP/1.0 returns 304 Not Modified on cache hit](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.0cache2-f6c10b.png)

### HTTP/1.1

Building upon HTTP/1.0, HTTP/1.1's caching mechanism vastly improves flexibility and extensibility. The basic working principle remains consistent with HTTP/1.0, but adds more granular features. Among them, the most common request header directive is `Cache-Control`; for details, refer to MDN Web Docs on [Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control).

## Connection Management

**HTTP/1.0 uses short-lived connections by default.** That is, for every HTTP operation between client and server, a new connection is established and then torn down as soon as the task finishes. When a client browser visits an HTML or other web page containing secondary web resources (such as JavaScript files, image files, CSS files, etc.), the browser establishes a brand-new TCP connection for each such resource encountered. This leads to a massive amount of "handshake packets" and "teardown packets" consuming bandwidth.

**To solve the resource waste found in HTTP/1.0, HTTP/1.1 optimizes for persistent connections by default.** A request message adopting persistent connection mode notifies the server: "I am requesting a connection with you; once the connection is successfully established, please do not close it." Consequently, the TCP connection remains open to serve subsequent client-server data exchanges. In other words, with persistent connections, once a web page has finished loading, the TCP connection used to transfer HTTP data between client and server is not terminated; when the client accesses this server again, it continues using this already established connection.

If a TCP connection were kept alive indefinitely, it would also waste server resources. Therefore, some web server software (such as Apache) also supports a timeout option. If no new request arrives within the timeout period, the TCP connection is finally closed.

It is worth noting that HTTP/1.0 still offered an option for persistent connections by adding `Connection: Keep-Alive` in the request header. Similarly, in HTTP/1.1, if you do not want to use a persistent connection, you can add `Connection: close` in the request header, notifying the server: "I do not need a persistent connection; close it immediately after the response."

**Persistent connections and short-lived connections in the HTTP protocol are, in essence, persistent connections and short-lived connections at the TCP protocol layer.**

**Implementing persistent connections requires both the client and the server to support persistent connections.**

## Host Header Handling

The Domain Name System (DNS) allows multiple hostnames to be mapped to the same IP address, but HTTP/1.0 did not account for this. Suppose we have a resource URL `http://example1.org/home.html`; in an HTTP/1.0 request message, it would simply request `GET /home.html HTTP/1.0` without including any hostname. When such a message reaches the server, the server cannot know which actual website the client intended to request.

Therefore, HTTP/1.1 added the `Host` field to the request header. A message header containing the `Host` field looks like:

```plain
GET /home.html HTTP/1.1
Host: example1.org
```

This way, the server can determine the true website URL that the client intended to request.

## Bandwidth Optimization

### Range Requests

HTTP/1.1 introduced the range request mechanism to prevent wasted bandwidth. When a client only wants to request part of a file, or needs to resume downloading a file that was partially downloaded before being interrupted, HTTP/1.1 can include a `Range` header in the request to request a part of the data (and only byte-based data). The server can choose to ignore the `Range` header or return corresponding `Range` responses.

The primary purpose of the `206 (Partial Content)` status code is to ensure that clients and proxy servers properly recognize partial content responses, avoiding the mistake of treating them as full resources and caching them incorrectly. This is vital for the correct handling of range requests and cache management.

A typical HTTP/1.1 range request example:

```http
# Fetch the first 1024 bytes of a file
GET /z4d4kWk.jpg HTTP/1.1
Host: i.imgur.com
Range: bytes=0-1023
```

`206 Partial Content` response:

```http
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1023/146515
Content-Length: 1024
…
(Binary content)
```

A brief explanation of fields in HTTP range response headers:

- **`Content-Range` header**: Indicates the position of the returned data within the entire resource, including start and end bytes and the total length of the resource. For example, `Content-Range: bytes 0-1023/146515` indicates that the server returned bytes 0 through 1023 (1024 bytes in total), while the entire resource length is 146,515 bytes.
- **`Content-Length` header**: Indicates the actual number of bytes transmitted in this response. For example, `Content-Length: 1024` indicates that the server transmitted 1024 bytes of data.

The `Range` request header can not only request a single byte range, but also request multiple ranges at once. This approach is called "multiple range requests".

Client requests bytes 0 through 499 as well as bytes 1000 through 1499 of the resource:

```http
GET /path/to/resource HTTP/1.1
Host: example.com
Range: bytes=0-499,1000-1499
```

The server returns multiple byte ranges, with each range's content separated by a boundary delimiter:

```http
HTTP/1.1 206 Partial Content
Content-Type: multipart/byteranges; boundary=3d6b6a416f9b5

--3d6b6a416f9b5
Content-Type: application/octet-stream
Content-Range: bytes 0-499/2000

(Data block for bytes 0 to 499)

--3d6b6a416f9b5
Content-Type: application/octet-stream
Content-Range: bytes 1000-1499/2000

(Data block for bytes 1000 to 1499)

--3d6b6a416f9b5--
```

### Status Code 100

HTTP/1.1 added the `100` status code. When a client prepares to send a large request body, it can include `Expect: 100-continue` in the request header and send only the request headers first. If the server is willing to accept the request body, it responds with `100 Continue`, after which the client proceeds to send the body; the server can also immediately return a final response, sparing the client from having to transmit the request body. The process is illustrated below:

![HTTP/1.1 uses 100 Continue to pre-confirm whether a large request can be sent](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.1continue1-c11a1f.png)

![Client continues sending request body after receiving 100 Continue](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.1continue2-a11abf.png)

HTTP/1.0 does not have the `100 (Continue)` status code, nor does it have the pre-confirmation mechanism via `Expect: 100-continue`; an HTTP/1.0 server should ignore unrecognized `Expect` headers.

### Compression

Many data formats undergo pre-compression before transmission. Data compression significantly optimizes bandwidth utilization. However, HTTP/1.0 offered few options for data compression, did not support choosing compression details, and could not distinguish between end-to-end compression and hop-by-hop compression.

HTTP/1.1 distinguished between content codings (`content-codings`) and transfer codings (`transfer-codings`). Content codings are always end-to-end, whereas transfer codings are always hop-by-hop.

HTTP/1.0 included the `Content-Encoding` header for end-to-end encoding of messages. HTTP/1.1 introduced the `Transfer-Encoding` header, enabling hop-by-hop transfer encoding of messages. HTTP/1.1 also added the `Accept-Encoding` header, which clients use to indicate what kinds of content codings they can handle.

## Summary

1. **Connection mode**: HTTP/1.0 uses short-lived connections; HTTP/1.1 supports persistent connections.
2. **Response status codes**: HTTP/1.1 added a wealth of new status codes, with 24 new error response status codes alone. For example, `100 (Continue)` allows clients to confirm whether the server is willing to accept a large request body before transmission, `206 (Partial Content)` marks range responses, `409 (Conflict)` indicates the request conflicts with current rules governing the resource, and `410 (Gone)` denotes that the resource is permanently gone.
3. **Caching**: HTTP/1.0 primarily uses `If-Modified-Since` and `Expires` in headers as cache validation criteria; HTTP/1.1 introduced more cache control strategies, including headers such as `Entity Tag` (ETag), `If-Unmodified-Since`, `If-Match`, and `If-None-Match`.
4. **Bandwidth optimization and network connection utilization**: In HTTP/1.0, bandwidth was frequently wasted; for example, if a client only needed a portion of an object, the server still delivered the entire object, with no support for resumable downloads. HTTP/1.1 introduced the `Range` header in requests, allowing clients to request only a portion of a resource (returning status code `206 (Partial Content)`), making it convenient for developers to optimize bandwidth and connection usage.
5. **Host header handling**: HTTP/1.1 added the `Host` field to request headers.

## References

[Key differences between HTTP/1.0 and HTTP/1.1](http://www.ra.ethz.ch/cdstore/www8/data/2136/pdf/pd1.pdf)
