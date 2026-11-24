---
title: Common HTTP Status Codes Summary (Application Layer)
description: Summarizes common HTTP status code meanings and use cases, highlighting confusing points like 201/204 to improve API design and debugging efficiency.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: HTTP Status Codes,2xx,3xx,4xx,5xx,Redirection,Error Code,201 Created,204 No Content
lang: en
sourceRef: zh-ref/cs-basics/network/http-status-codes.md
---

An HTTP status code is a summary of the processing result returned by the server to the client. By seeing a status code, you can basically determine whether the request was successful, redirected, caused by a client-side error, or caused by a server-side error.

Status codes seem like just numbers, but many of them are easy to confuse: such as 301 and 302, 401 and 403, 500 and 502, 201 and 204.

This article primarily answers several questions:

1. What types of results do 1xx, 2xx, 3xx, 4xx, and 5xx represent respectively?
2. What are the differences between common success status codes like 200, 201, and 204?
3. How should common client error status codes like 400, 401, 403, and 404 be understood?
4. What do common server error status codes like 500, 502, 503, and 504 usually mean?

![Common HTTP Status Codes](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-status-code-4a9382f4.png)

### 1xx Informational (Informational Status Codes)

Compared to other categories of status codes, you are very unlikely to encounter 1xx in daily work, so we skip it directly here.

### 2xx Success (Success Status Codes)

- **200 OK**: The request was processed successfully. For example, sending an HTTP request querying user data to the server, and the server returns the user data correctly. This is the most common HTTP status code in our daily work.
- **201 Created**: The request was processed successfully and created ~~a new resource~~ on the server. For example, creating a new user via a POST request.
- **202 Accepted**: The server has received the request, but has not yet processed it. For example, sending a request that requires significant server processing time (such as report generation or Excel export); the server accepts the request but processing is not yet completed.
- **204 No Content**: The server has processed the request successfully, but does not return any content. For example, sending a request to delete a user; the server successfully processes the deletion operation but returns no body content.

🐛 Correction (see: [issue#2458](https://github.com/Snailclimb/JavaGuide/issues/2458)): More precisely, the 201 Created status code indicates the creation of one or more new resources; see: <https://httpwg.org/specs/rfc9110.html#status.201>.

![Definition of 201 Created status code in RFC 9110](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/rfc9110-201-created-f791ff9a.png)

Here, the 204 status code is worth highlighting specifically, as it is not seen very often during routine study or work.

The description of the 204 status code in [HTTP RFC 2616](https://tools.ietf.org/html/rfc2616#section-10.2.5) is as follows:

> The server has fulfilled the request but does not need to return an
> entity-body, and might want to return updated metainformation. The
> response MAY include new or updated metainformation in the form of
> entity-headers, which if present SHOULD be associated with the
> requested variant.
>
> If the client is a user agent, it SHOULD NOT change its document view
> from that which caused the request to be sent. This response is
> primarily intended to allow input for actions to take place without
> causing a change to the user agent's active document view, although
> any new or updated metainformation SHOULD be applied to the document
> currently in the user agent's active view.
>
> The 204 response MUST NOT include a message-body, and thus is always
> terminated by the first empty line after the header fields.

In simple terms, the 204 status code describes a scenario where, after sending an HTTP request to the server, we only care about whether the processing result succeeded or failed. In other words, all we need is a result: true/false.

For example: You are courting a girl and ask her, "May I pursue you?", and she answers, "Yes!". If we treat this girl as the server, it becomes very easy to understand the 204 status code.

### 3xx Redirection (Redirection Status Codes)

- **301 Moved Permanently**: The resource has been permanently redirected. For example, when your website's URL has changed.
- **302 Found**: The resource has been temporarily redirected. For example, when certain resources of your website are temporarily relocated to another URL.

### 4xx Client Error (Client Error Status Codes)

- **400 Bad Request**: There is a problem with the sent HTTP request. For example, invalid request parameters or an incorrect request method.
- **401 Unauthorized**: Requesting a resource that requires authentication without being authenticated.
- **403 Forbidden**: The HTTP request is directly rejected and not processed. It is generally used against unauthorized or illegal requests.
- **404 Not Found**: The requested resource was not found on the server. For example, when requesting information for a certain user, the server did not find the specified user.
- **409 Conflict**: Indicates that the request conflicts with the current state of the resource on the server, and the request cannot be processed.

### 5xx Server Error (Server Error Status Codes)

- **500 Internal Server Error**: Something went wrong on the server side (usually a server-side bug). For example, when an exception is thrown while the server processes a request, but the exception is not properly caught and handled.
- **502 Bad Gateway**: Our gateway forwards the request to the upstream server, but the upstream server returns an invalid response.

### References

- <https://www.restapitutorial.com/httpstatuscodes.html>
- <https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status>
- <https://en.wikipedia.org/wiki/List_of_HTTP_status_codes>
- <https://segmentfault.com/a/1190000018264501>
