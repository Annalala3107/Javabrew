---
title: A Concise Guide to RESTful APIs
description: A detailed guide to RESTful API design conventions covering REST architectural principles, resource path design, HTTP method usage, and status code standards.
category: Code Quality
head:
  - - meta
    - name: keywords
      content: RESTful API,REST,API Design,Resource Path,HTTP Methods,Status Codes,Idempotency,API Conventions
lang: en
sourceRef: zh-ref/system-design/basis/RESTfulAPI.md
---

This article briefly covers the essential knowledge about RESTful APIs that every backend developer needs to know.

Before diving into RESTful APIs, we first need to clarify: **What is an API?**

## What Is an API?

**API (Application Programming Interface)** stands for Application Programming Interface.

In backend development, our primary job is to provide APIs for the frontend or other backend services—such as an API for querying user data.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/20210507130629538-201dc50b.png)

However, an API does not only refer to endpoints exposed by a backend system; methods provided by a framework also fall under the category of APIs.

To make this easier to grasp, here are a few examples:

1. When you search for a product on an e-commerce website, the website's frontend invokes a product-search API provided by the backend.
2. When you develop a Java program using the JDK and want to read user input, you need to use the I/O-related APIs provided by the JDK.
3. ......

You can think of an API as a bridge for communication between one program and another; at its core, it is essentially just a function. Furthermore, using an API is not arbitrary—its rules (such as the input and output data formats) are defined by the API provider.

## What Is a RESTful API?

A **RESTful API**, often called a **REST API**, is an API built on top of REST. We will unpack what REST actually is shortly, as it involves quite a few concepts.

Articles about RESTful APIs often feel dense and hard to follow, mainly because some of the underlying concepts of REST are abstract. In practice, however, the RESTful API knowledge we use in day-to-day development is very straightforward and easy to summarize!

For instance, if I show you the two APIs below, you can tell right away what they do! That is the power of RESTful APIs.

```plain
GET    /classes: List all classes
POST   /classes: Create a new class
```

**A RESTful API lets you know what a URL does just by looking at the URL + HTTP method, and tells you how the request turned out just by looking at the HTTP status code.**

When designing APIs during development, we should at least meet the basic requirements of a RESTful API (such as using nouns in endpoint paths wherever possible, using `POST` requests to create resources, `DELETE` requests to delete resources, and so on—for example, `GET /notes/{id}` retrieves the details of a note with a specific ID).

## Understanding REST

**REST** is short for `REpresentational State Transfer`.

That literal phrasing can sound cryptic; put plainly, REST describes how a client transitions from one application state to another through the "representations" of resources. If that still feels unclear, read on—the breakdown below should make it completely clear what REST really means.

Let's examine each concept involved to deepen our understanding. In fact, you don't even have to master these theoretical terms to follow the practical guidelines in the next section—but to hold your own in technical discussions about "RESTful APIs," it's well worth understanding them!

- **Resource**: We can treat real data objects as resources. A resource can be either a collection or a single item. For example, `classes` represents a collection resource, while a specific `class` represents an individual resource. Every resource corresponds to a unique URI (Uniform Resource Identifier); to access that resource, you simply access its URI—for example, retrieving a specific class via `/classes/12`. In addition, a resource can contain sub-resources, such as `/classes/{classId}/teachers`, which lists all teachers in a specified class.
- **Representation**: A "resource" is an information entity that can have multiple external representations. The concrete format in which a resource is presented—such as `json`, `xml`, `image`, `txt`, etc.—is called its "representation."
- **State Transfer**: Seeing this phrase for the first time, you might feel completely bewildered and think to yourself: *"What on earth is that supposed to mean?"* In plain English, the client transitions from one application state to another via resource representations and control information such as embedded links. Performing CRUD operations through HTTP methods can also trigger state changes on server-side resources. *Note:* HTTP is a stateless protocol, meaning the server does not need to store the client's session state between two requests.

Putting the explanations above together, we can summarize what a RESTful architecture is:

1. Every URI represents a resource;
2. The client and server exchange a specific representation of that resource, such as `json`, `xml`, `image`, `txt`, etc.;
3. The client operates on server-side resources using specific HTTP verbs, achieving "Representational State Transfer."

## RESTful API Specifications

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/20210507154007779-b08d4a13.png)

### HTTP Methods (Actions)

- `GET`: Requests a specific resource from the server. Example: `GET /classes` (retrieve all classes).
- `POST`: Asks the target resource to process the request payload according to its own semantics; commonly used to create resources. Example: `POST /classes` (create a class).
- `PUT`: Creates or replaces the current state of the target resource (the client typically supplies the complete updated resource). Example: `PUT /classes/12` (update class #12).
- `DELETE`: Removes the association between the target URI and its current functionality/resource. Example: `DELETE /classes/12` (delete class #12).
- `PATCH`: Updates a resource on the server (the client supplies only the modified attributes, acting as a partial update). It is used less frequently, so we will omit an example here.

Among these, `GET` is safe and idempotent, `PUT` and `DELETE` are idempotent, and `PATCH` is not guaranteed to be idempotent by default.

### Paths (Endpoint Naming)

A path, also called an "endpoint," represents the concrete URL path of an API. Common conventions in real-world development include:

1. **Resource-oriented HTTP API URLs generally use nouns, and those nouns are typically plural.** This is a common URI naming convention rather than a strict constraint of REST itself. If an API call cannot easily be modeled as a resource (such as calculation or translation operations), verbs can be used as well—for example: `GET /calculate?param1=11&param2=33`.
2. **Avoid uppercase letters, and use hyphens `-` instead of underscores `_`.** For example, write `invitation-code` rather than ~~`invitation_code`~~.
3. **Make good use of API versioning.** When our API undergoes major breaking changes that are incompatible with earlier versions, we can version it via the URL, such as `http://api.example.com/v1` or `http://apiv1.example.com`. Versions do not strictly have to be numbers—numbers are simply the most common; dates or seasons can also serve as version identifiers as long as the project team agrees on a convention.
4. **Prefer nouns and avoid verbs in endpoint paths.** A RESTful API operates (via the HTTP Method) on resources (nouns) rather than actions (verbs).

Talk is cheap! Let's illustrate this with a concrete example. Suppose we have an API that serves information about classes, along with the students and teachers in each class—its paths should be designed like this:

```plain
GET    /classes: List all classes
POST   /classes: Create a new class
GET    /classes/{classId}: Retrieve information about a specific class
PUT    /classes/{classId}: Update information for a specific class (generally implies full replacement)
PATCH  /classes/{classId}: Update information for a specific class (generally implies partial update)
DELETE /classes/{classId}: Delete a specific class
GET    /classes/{classId}/teachers: List all teachers in a specific class
GET    /classes/{classId}/students: List all students in a specific class
DELETE /classes/{classId}/teachers/{ID}: Remove a specific teacher from a specific class
```

Bad examples:

```plain
/getAllclasses
/createNewclass
/deleteAllActiveclasses
```

Clarify the hierarchy of your resources. For example, if the business scope centers on schools, then schools are the top-level resource (`/schools`), while teachers (`/schools/{schoolId}/teachers`) and students (`/schools/{schoolId}/students`) are second-level sub-resources.

### Filtering

If we need to add specific criteria to a query, it is recommended to use URL query parameters. For example, to query classes whose `state` is `active` and whose `name` is `guidegege`:

```plain
GET    /classes?state=active&name=guidegege
```

Or if we want to implement paginated queries:

```plain
GET    /classes?page=1&size=10 // Specify page 1, 10 items per page
```

### Status Codes

**Status code categories:**

| 2xx: Success | 3xx: Redirection      | 4xx: Client Error        | 5xx: Server Error         |
| ------------ | --------------------- | ------------------------ | ------------------------- |
| 200 OK       | 301 Moved Permanently | 400 Bad Request          | 500 Internal Server Error |
| 201 Created  | 304 Not Modified      | 401 Unauthorized         | 502 Bad Gateway           |
|              |                       | 403 Forbidden            | 504 Gateway Timeout       |
|              |                       | 404 Not Found            |                           |
|              |                       | 405 Method Not Allowed   |                           |

## HATEOAS in REST

> **In Fielding's original definition of REST, HATEOAS is part of the uniform interface constraint. However, in practice, many HTTP/JSON APIs referred to as REST APIs do not implement it.**

Everything covered above represents the fundamentals of RESTful APIs and the parts we most commonly apply in daily development. HATEOAS requires driving application state through hypermedia—that is, returning links and other control metadata in the response so that consumers know what they can do next without having to look up documentation.

For example, when a client sends a request to the root of `api.example.com`, it receives a response like this:

```javascript
{"link": {
  "rel":   "collection",
  "href":  "https://api.example.com/classes",
  "title": "List of classes",
  "type":  "application/vnd.yourformat+json"
}}
```

In the snippet above, the document contains a `link` attribute; by reading this attribute, the user immediately knows which API to call next. `rel` indicates the relationship between the target resource and the current context, `href` is the target resource's URL, `title` is the link's title, and `type` is a media-type hint for the target resource's representation. This style of hypermedia API design is known as [HATEOAS](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven).

In Spring, there is an API library called Spring HATEOAS that makes it easier to build APIs compliant with HATEOAS design. Related articles:

- [Using HATEOAS in Spring Boot](https://blog.aisensiy.me/2017/06/04/spring-boot-and-hateoas/)
- [Building REST services with Spring](https://spring.io/guides/tutorials/rest/) (Spring Official Site)
- [An Intro to Spring HATEOAS](https://www.baeldung.com/spring-hateoas-tutorial)
- [spring-hateoas-examples](https://github.com/spring-projects/spring-hateoas-examples/tree/master/hypermedia)
- [Spring HATEOAS](https://spring.io/projects/spring-hateoas#learn) (Spring Official Site)

## References

- [Fielding Dissertation: Representational State Transfer](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)

- [RFC 5789: PATCH Method for HTTP](https://www.rfc-editor.org/rfc/rfc5789.html)

- [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)

- <https://RESTfulapi.net/>

- <https://www.ruanyifeng.com/blog/2014/05/restful_api.html>

- <https://juejin.im/entry/59e460c951882542f578f2f0>

- <https://phauer.com/2016/testing-RESTful-services-java-best-practices/>

- <https://www.seobility.net/en/wiki/REST_API>

- <https://dev.to/duomly/rest-api-vs-graphql-comparison-3j6g>
