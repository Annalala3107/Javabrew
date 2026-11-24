---
title: J2EE Fundamentals
description: Detailed guide to J2EE fundamentals covering the Servlet lifecycle, request forwarding vs. redirection, Session and Cookie mechanisms, and core Java Web concepts.
category: System Design
head:
  - - meta
    - name: keywords
      content: J2EE,Java Web,Servlet,JSP,HTTP Request and Response,Servlet Lifecycle,Session,Cookie
lang: en
sourceRef: zh-ref/system-design/J2EE基础知识.md
---

## Servlet Summary

> Note: J2EE is a historical name that was later renamed Java EE, and the current specification name is Jakarta EE. This article mainly introduces the traditional Servlet/JSP programming model.

In Java Web applications, a **Servlet** is primarily responsible for receiving user requests (`HttpServletRequest`), processing them in methods such as `doGet()` and `doPost()`, and returning responses via `HttpServletResponse`. Initialization parameters can be configured on a Servlet for internal use. In a non-distributed environment, a Servlet container typically uses one instance **per Servlet declaration**; if the same Servlet class has multiple declarations, multiple instances can still exist. The container calls `init()` during initialization and calls `destroy()` when the instance is taken out of service. A Servlet can be declared via `@WebServlet`, `web.xml`, or programmatic APIs, and a single Servlet declaration can also be mapped to multiple URLs. Because the container may allow multiple threads to execute the `service()` method of the same instance concurrently, do not store per-request mutable state in instance fields.

## Explain the Differences Between Servlet and CGI

### Shortcomings of CGI

1. It must start a separate OS process running the CGI program for each request. When requests are frequent, this incurs heavy overhead.

2. It must load and execute a CGI program for each request, which also brings substantial overhead.

3. It requires repeatedly writing code for handling network protocols and encoding, which is very time-consuming.

### Advantages of Servlet

1. It only needs to start one OS process and load one JVM, greatly reducing system overhead.

2. When multiple requests require the same processing, only a single class needs to be loaded, which also greatly reduces overhead.

3. All dynamically loaded classes can share network protocol handling and request decoding, greatly reducing the workload.

4. A Servlet can interact directly with the Web server, whereas an ordinary CGI program cannot. Servlets can also share data across components, making features like database connection pools easy to implement.

Supplement: Sun Microsystems released Servlet technology in 1996 to compete with CGI. A Servlet is a special Java program, and a Java-based Web application usually contains one or more Servlet classes. A Servlet cannot instantiate and run itself; it runs inside a Servlet container, which passes user requests to the Servlet program and sends the Servlet's response back to the user. Typically, a Servlet is associated with one or more JSP pages. In the past, CGI was often criticized for performance overhead, though FastCGI long ago solved CGI's efficiency issues—so in interviews there is no need to disparage CGI carelessly; in fact, many well-known websites still use CGI technology.

Reference: *Java Web Integrated Development: Return of the King*, p. 7

## Methods in the Servlet Interface and the Servlet Lifecycle

The `Servlet` interface defines 5 methods, **the first three of which are related to the Servlet lifecycle**:

- `void init(ServletConfig config) throws ServletException`
- `void service(ServletRequest req, ServletResponse resp) throws ServletException, java.io.IOException`
- `void destroy()`
- `java.lang.String getServletInfo()`
- `ServletConfig getServletConfig()`

**Lifecycle:** **After the Web container loads and instantiates the Servlet, the Servlet lifecycle begins.** The container runs its **`init()` method** to initialize the Servlet; when a request arrives, it calls the Servlet's **`service()` method**, which delegates as needed to methods corresponding to the request such as **`doGet` or `doPost`**; when the server shuts down or the project is undeployed, the server destroys the Servlet instance by calling its **`destroy()` method**. **The `init` and `destroy` methods execute only once, whereas `service` executes every time a client sends a request to the Servlet.** Because a Servlet sometimes uses resources that require initialization and cleanup, resource initialization code can be placed in `init` and resource cleanup code in `destroy`, avoiding the need to initialize and destroy resources on every client request.

Reference: *Java Web Integrated Development: Return of the King*, p. 81

## Differences Between GET and POST

This topic has been widely discussed on Zhihu at <https://www.zhihu.com/question/28586791>.

![](/media/jg/ext/static001.geekbang.org/infoq/04/0454a5fff1437c32754f1dfcc3881148-de486259.webp)

GET and POST are two commonly used HTTP request methods, each with distinct characteristics and usage across different scenarios and purposes. Generally, they can be distinguished in the following ways:

- Semantic difference: GET is used to retrieve a representation of the target resource and is both safe and idempotent. POST is used to request that the target resource process the request content according to its own semantics—commonly for creating resources, submitting data, or triggering actions—and is not idempotent by default.
- Format difference: Query parameters for a GET request are usually placed in the URL's query string, whereas POST typically sends data in the request body using media types such as `application/x-www-form-urlencoded`, `multipart/form-data`, or `application/json`. The HTTP specification does not impose a universal fixed upper limit on URL or POST body length; actual limits are determined by browsers, servers, gateways, and other intermediaries.
- Caching difference: GET responses are cacheable by default, though still constrained by response headers such as `Cache-Control`. POST responses are not strictly uncacheable, but require the server to explicitly provide caching metadata, which is rarely done in practice.
- Security difference: Neither GET nor POST is inherently secure, because HTTP itself transmits data in plaintext—URLs, headers, and bodies can all be eavesdropped or tampered with. To ensure security, HTTPS must be used to encrypt data in transit. However, in certain scenarios, GET requests are more likely to leak sensitive data than POST requests because GET parameters appear in the URL, which can be recorded in browser history, server logs, proxy logs, and similar places. Therefore, confidential data should generally be transmitted using POST with a request body.

The key is to choose GET or POST based on standard HTTP method semantics. Designing all requests as POST is technically feasible, but loses GET's advantages in caching, safe retries, and intermediary semantics; it should not be chosen solely because "the team agreed on it."

## When Are `doGet()` and `doPost()` Called?

When the `method` attribute of a `<form>` tag is `get`, `doGet()` is called; when it is `post`, `doPost()` is called.

## Differences Between Forward and Redirect

**Forwarding is a server-side action, whereas redirection is a client-side action.**

**Forward**
Implemented via the `forward(HttpServletRequest request, HttpServletResponse response)` method of the `RequestDispatcher` object. A `RequestDispatcher` can be obtained through `HttpServletRequest`'s `getRequestDispatcher()` method. For example, the following code forwards to the `login_success.jsp` page:

```java
     request.getRequestDispatcher("login_success.jsp").forward(request, response);
```

**Redirect** works by having the server return a 3xx status code and a `Location` response header, after which the client initiates a new request to the new address. In Servlets, `HttpServletResponse#sendRedirect()` is usually used, or the status code and `Location` header can be set manually. Historically, 301, 302, and 303 implementations may change a subsequent POST request into GET; when the original HTTP method must be explicitly preserved, 307 or 308 should be used depending on the scenario.

1. **Address bar display**

   With `forward`, the server requests the resource directly by accessing the target URL, reads the response content from that URL, and sends that content to the browser. The browser has no idea where the server fetched the content from, so its address bar still shows the original URL.
   With `redirect`, the server sends a status code based on application logic, telling the browser to request that new address again. Therefore, the address bar displays the new URL.

2. **Data sharing**

   `forward`: The forwarding page and the target page can share data inside `request`.
   `redirect`: They cannot share `request` data.

3. **Typical use cases**

   `forward`: Commonly used when a user logs in, forwarding to the corresponding module based on role.
   `redirect`: Commonly used when a user logs out to return to the home page, or when jumping to another website.

4. **Efficiency**

   `forward`: Higher.
   `redirect`: Lower.

## Auto Refresh

Some browsers support the non-standard `Refresh` response header to achieve delayed refresh or redirection. In a Servlet, it can be set through `HttpServletResponse`:

```java
response.setHeader("Refresh", "5; url=http://localhost:8080/servlet/example.htm");
```

Here, `5` is in seconds. Because `Refresh` is not a standard HTTP response header, it should not be used to replace standard 3xx redirects; page refreshes can also be implemented on the frontend depending on requirements.

## Servlets and Thread Safety

**Servlets are not thread-safe; concurrent reads and writes by multiple threads can cause data synchronization issues.** The solution is to avoid defining instance fields like `name` on the Servlet and instead declare variables separately inside `doGet()` and `doPost()`. Although a `synchronized(name){}` block can solve the issue, it causes threads to wait and is not a good design approach.
Note: Concurrent reads and writes to Servlet instance fields cause data inconsistency, whereas concurrent reads without writes do not. Therefore, read-only fields in a Servlet are best declared as `final`.

Reference: *Java Web Integrated Development: Return of the King*, p. 92

## What Is the Relationship Between JSP and Servlet?

As explained above, a Servlet is a special Java program running in the server's JVM that relies on server support to provide display content to the browser. JSP is essentially a simplified form of Servlet; a JSP is processed by the server into a Java program similar to a Servlet to simplify generating page content. The primary difference between Servlet and JSP is that a Servlet's application logic resides in Java files and is completely separated from the presentation-layer HTML, whereas a JSP allows Java and HTML to be combined in a `.jsp` file. Some say that a Servlet is writing HTML inside Java while a JSP is writing Java code inside HTML—of course, that description is one-sided and imprecise. JSP focuses on the view, while Servlet focuses more on control logic. In the MVC architectural pattern, JSP is suited to act as the View, and Servlet is suited to act as the Controller.

## How JSP Works

A JSP page is translated by the JSP container into a Servlet implementation class and compiled. For HTTP, the generated implementation class must implement the `HttpJspPage` interface, which extends `JspPage`. In common on-demand compilation setups, translation and compilation occur upon the first request; however, a container may also precompile JSPs, so this does not strictly have to happen on the first request. The generated Java source and `.class` files are typically stored in the container's working directory. Below is an example illustrating on-demand compilation.
Suppose a project `JspLoginDemo` contains a JSP file named `login.jsp`. After deploying the project to the server for the first time and accessing this JSP file, we find two new files in that directory:
the `.class` file is the Servlet corresponding to the JSP. Once compiled, the `.class` file is executed to respond to the client request. When clients access `login.jsp` in the future, Tomcat will no longer recompile the JSP file and will directly invoke the `.class` file to handle client requests.

![How JSP Works](/media/jg/ext/oss.javaguide.cn/github/javaguide/1-d179fb5f.jpg)

In on-demand compilation mode, the first request must complete translation and compilation, so it is usually slower than subsequent requests. If the generated `.class` file is deleted, the container will recompile the JSP when the page is needed again.

During Web application development, JSPs often need to be modified. Tomcat can automatically detect changes to JSP files. If it detects that the JSP source code has changed, Tomcat will recompile the JSP on the next client request without requiring a Tomcat restart. This auto-detection feature is enabled by default; checking for changes consumes a small amount of time and can be disabled in `web.xml` when deploying a Web application.

Reference: *Java Web Integrated Development: Return of the King*, p. 97

## What Are JSP's Built-in Objects and Their Roles?

[JSP Built-in Objects - CSDN Blog](http://blog.csdn.net/qq_34337272/article/details/64310849)

JSP has 9 built-in (implicit) objects:

- `request`: Encapsulates the client request, including parameters from GET or POST requests;
- `response`: Encapsulates the server's response to the client;
- `pageContext`: Used to access other implicit objects and page attributes;
- `session`: Encapsulates a user session;
- `application`: Encapsulates the server runtime context (`ServletContext`);
- `out`: Output stream object used to write the server response;
- `config`: Configuration object for the Web application/Servlet (`ServletConfig`);
- `page`: The JSP page instance itself (equivalent to `this` in a Java program);
- `exception`: Encapsulates an exception thrown by a page.

## Main Methods of the Request Object

- `setAttribute(String name,Object)`: Sets the value of the request attribute named `name`
- `getAttribute(String name)`: Returns the attribute value specified by `name`
- `getAttributeNames()`: Returns a collection of all attribute names on the request object as an `Enumeration` instance
- `getCookies()`: Returns all `Cookie` objects from the client as a `Cookie[]` array
- `getCharacterEncoding()`: Returns the character encoding used in the request
- `getContentLength()`: Returns the byte length of the request body, or `-1` if unknown or exceeding the `int` range; for large requests, use `getContentLengthLong()`
- `getHeader(String name)`: Gets the HTTP header value defined by `name`
- `getHeaders(String name)`: Returns all values of the request header with the specified name as an `Enumeration` instance
- `getHeaderNames()`: Returns the names of all request headers as an `Enumeration` instance
- `getInputStream()`: Returns the request input stream for reading raw data in the request body
- `getMethod()`: Gets the HTTP method used by the client to send data to the server
- `getParameter(String name)`: Gets the parameter value named `name` sent by the client to the server
- `getParameterNames()`: Gets the names of all parameters sent by the client to the server as an `Enumeration` instance
- `getParameterValues(String name)`: Gets all values of the parameter specified by `name`
- `getProtocol()`: Gets the name and version of the protocol used by the client to send data to the server
- `getQueryString()`: Gets the query string
- `getRequestURI()`: Gets the URI path portion of the request line between the protocol name and the query string
- `getRemoteAddr()`: Gets the IP address of the client
- `getRemoteHost()`: Gets the hostname of the client
- `getSession()`: Returns the `Session` associated with the request, creating one if it does not exist
- `getSession(boolean create)`: Returns the `Session` associated with the request; returns `null` when `create` is `false` and no `Session` exists
- `getServerName()`: Gets the server name
- `getServletPath()`: Gets the path of the script/servlet requested by the client
- `getServerPort()`: Gets the server port number
- `removeAttribute(String name)`: Removes an attribute from the request

## Differences Between `request.getAttribute()` and `request.getParameter()`

`getParameter()` reads parameters submitted by the client with the request, such as URL query strings or parsed form fields. It returns a `String`, and `getParameterValues()` can be used when a parameter name has multiple values.

`getAttribute()` reads an object bound to the current request by server-side code via `setAttribute()`, returning an `Object`. During server-side request forwarding such as `forward`, each component still processes the exact same request object, so request attributes can be shared; client-side redirection creates a new request and does not retain attributes from the original request. This process is not the container copying a block of memory between pages.

## Differences Between the `include` Directive and the `include` Action

**`include` directive:** A JSP can include another file using the `include` directive. The included file can be a JSP file, an HTML file, or a text file. The included file behaves as part of the JSP file and is compiled and executed together with it. The syntax is:
`<%@ include file="relative-file-url" %>`

**`include` action:** The `<jsp:include>` action element is used to include static or dynamic resources, inserting the output of the specified file into the page being generated. The syntax is:
`<jsp:include page="relative-url" flush="true" />`

## JSP's Nine Built-in Objects, Seven Actions, and Three Directives

[Summary of JSP's Nine Built-in Objects, Seven Actions, and Three Directives](http://blog.csdn.net/qq_34337272/article/details/64310849)

## Explain the Four Scopes in JSP

The four scopes in JSP are `page`, `request`, `session`, and `application`. Specifically:

- **`page`** represents objects and attributes associated with a single JSP page.
- **`request`** represents objects and attributes associated with a single request sent by a Web client. One request may span multiple pages and involve multiple Web components; temporary data that needs to be displayed across those pages can be placed in this scope.
- **`session`** represents objects and attributes associated with a session established between a specific user and the server. Data specific to a particular user should be stored in that user's `session`.
- **`application`** represents objects and attributes associated with the entire Web application; it is effectively a global scope spanning the whole Web application across multiple pages, requests, and sessions.

## How Should Concurrent Requests in Servlets Be Handled?

Historically, JSP provided `<%@ page isThreadSafe="false" %>`, and Servlet provided the `SingleThreadModel` marker interface. `SingleThreadModel` has been deprecated since Servlet 2.4 and was removed in Jakarta Servlet 6.0; moreover, it cannot guarantee thread safety for `Session` or static state, so it should not be used as a modern solution.

The proper approach is to keep Servlets stateless whenever possible by placing per-request mutable data in local method variables rather than Servlet instance fields. When state must be shared, use appropriate concurrency control or thread-safe data structures, and keep critical sections as small as possible.

## Techniques for Implementing Session Tracking

1. **Using Cookies**

   Sending a Cookie to the client:

   ```java
   Cookie c =new Cookie("name","value"); // Create Cookie
   c.setMaxAge(60*60*24); // Set max age; here it is set to one day
   response.addCookie(c); // Add the Cookie to the HTTP response
   ```

   Reading Cookies from the client:

   ```java
   String name ="name";
   Cookie[]cookies =request.getCookies();
   if(cookies !=null){
      for(int i= 0;i<cookies.length;i++){
       Cookie cookie =cookies[i];
       if(name.equals(cookie.getName())) {
         // something is here.
         // you can get the value
         cookie.getValue();
       }

      }
    }

   ```

   **Pros:** Data can be persisted without using server resources; simple, text-based key-value pairs.

   **Cons:** Size is limited, users can disable Cookies, and storing data locally introduces certain security risks.

2. **URL Rewriting**

   Appending user session information to the URL as query parameters, or adding a unique session ID at the end of the URL to identify a session.

   **Pros:** Still works when Cookies are disabled.

   **Cons:** Every URL on the site must be encoded, and all pages must be dynamically generated—pre-recorded static URLs cannot be used.

3. **Hidden Form Fields**

   ```html
   <input type="hidden" name="session" value="..." />
   ```

   **Pros:** Works when Cookies are disabled.

   **Cons:** Every page must be the result of a form submission.

4. **`HttpSession`**

   An `HttpSession` is not necessarily created automatically simply because a user visits a website for the first time. The container creates one (if none exists) only when code calls `HttpServletRequest#getSession()` or when a framework/JSP feature requests a `Session` for the current request. Session attributes can be stored and retrieved via `setAttribute()` and `getAttribute()`. `HttpSession` data is managed on the server side—in memory, distributed storage, or persistent media—so avoid storing overly large objects in it. In distributed deployments or when session persistence is needed, attributes generally must also be serializable, depending on the container and session storage mechanism.

## Differences Between Cookie and Session

Both Cookie and Session are session mechanisms used to track browser user identity, but their usage scenarios differ.

**Cookies are generally used to store user information.** For example: (1) saving previously logged-in user details in a Cookie so the next time you visit the site, the page can automatically pre-fill basic login fields; (2) keeping users logged in so you don't have to log in again on your next visit—when the user logs in, a Token can be stored in a Cookie, and on the next visit the server looks up the user by that Token (for security, the Token is typically refreshed upon re-login); (3) navigating other pages after logging in once without needing to log in again. **The primary role of Session is to record user state on the server side.** A classic scenario is a shopping cart: when you add an item to the cart, the system wouldn't otherwise know which user performed the action because HTTP is stateless. Once the server creates a dedicated Session for a specific user, it can identify and track that user.

Cookie data is stored on the client side (browser), whereas Session data is stored on the server side.

Although Cookies are stored on the client and Session state is usually managed on the server, using Session is not inherently secure by default. Typical Sessions still rely on a Cookie to transmit the session identifier, which can be replayed if stolen. Session Cookies should use high-entropy random identifiers with no business meaning, be transmitted over HTTPS, and have attributes such as `Secure`, `HttpOnly`, `SameSite`, `Path`, and `Domain` configured as appropriate. Sensitive business data such as passwords or bank card numbers must not be written directly into Cookies; encryption is also not a substitute for integrity protection, expiration, revocation, and server-side authorization checks.
