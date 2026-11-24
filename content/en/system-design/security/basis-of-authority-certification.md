---
title: Authentication & Authorization Fundamentals Explained
description: Detailed guide to authentication and authorization fundamentals, covering the difference between Authentication and Authorization, Session, Token, OAuth2, and related core concepts.
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: Authentication,Authorization,Session,Token,OAuth2,Access Control,Security Fundamentals
lang: en
sourceRef: zh-ref/system-design/security/basis-of-authority-certification.md
---

## What Is the Difference Between Authentication and Authorization?

This is a question that trips up the vast majority of people. First, start by paying attention to how these two terms are pronounced—many people mix up their pronunciation, so I recommend looking up how both words are pronounced and what their exact meanings are.

Put simply:

- **Authentication:** Who you are.
- **Authorization:** What you have permission to do.

Put a bit more formally (and wordily):

- **Authentication** verifies your identity credentials (such as username/user ID and password). Through these credentials, the system confirms that you are indeed who you claim to be—meaning your user account exists in the system. Therefore, Authentication is identity/user verification.
- **Authorization** happens after **Authentication**. Looking at the word itself makes its purpose clear: it governs permissions for accessing the system. For instance, certain specific resources can only be accessed by users with specific roles such as admin, and certain operations on system resources—like deleting, adding, or updating—are restricted to authorized users.

Authentication:

![Authentication Login](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/authentication-login-1a978b9a.png)

Authorization:

![No Permission](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/20210604161032412-3993c04a.png)

These two are generally used together in our systems with the goal of protecting system security.

## Do You Know the RBAC Model?

The most commonly used access control model for system permission management is the **RBAC model**.

**What is RBAC?** RBAC stands for Role-Based Access Control. It is an authorization approach that associates permissions with roles, and in turn associates roles with users.

Put simply: one user can hold multiple roles, and each role can be assigned multiple permissions, forming a "user–role–permission" authorization model. In this model, users and roles have a many-to-many relationship, and roles and permissions also have a many-to-many relationship.

![RBAC Permission Model Diagram](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/rbac-a304d5af.png)

In the RBAC permission model, permissions are associated with roles, and users obtain the permissions of those roles by becoming members assigned to specific roles—greatly simplifying permission management.

To implement the RBAC permission model, a common database table design looks like this (5 tables in total, with 2 junction tables establishing relationships between tables):

![](/media/jg/ext/oss.javaguide.cn/2020-11/.png-428a13df.png)

Through this permission model, we can create different roles and assign different permission scopes (menus) to each role.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/books-af3d2a88.png)

Generally speaking, if a system has relatively strict permission control requirements, it will almost always choose the RBAC model.

## What Is a Cookie? What Are the Uses of Cookies?

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/cookie-sessionId-592d0e39.png)

Both `Cookie` and `Session` are session-tracking mechanisms for identifying browser users, though their use cases differ.

Wikipedia defines `Cookie` as:

> `Cookies` are data (usually encrypted) stored on the user's local terminal by certain websites in order to identify the user.

Simply put: **`Cookie` is stored on the client side and is generally used to store user information.**

Here are some common use cases for `Cookie`:

1. Storing previously logged-in user information in a `Cookie` allows a website to automatically prefill basic login fields on your next visit. In addition, a `Cookie` can store user preferences, themes, and other settings.
2. Using a `Cookie` to store a `SessionId` or `Token`, so when sending requests to the backend, the `Cookie` is included and the backend can retrieve the `Session` or `Token`. Because the HTTP protocol is stateless, this allows tracking the user's current state.
3. A `Cookie` can also be used to track and analyze user behavior. For example, when shopping online—since HTTP is stateless—if the server wants to track which page you lingered on or which products you viewed, a common approach is storing this information in a `Cookie`.
4. ...

## How Do You Use Cookies in a Project?

Here I'll use a Spring Boot project as an example.

**1) Set a `Cookie` and return it to the client**

```java
@GetMapping("/change-username")
public String setCookie(HttpServletResponse response) {
    // Create a cookie
    Cookie cookie = new Cookie("username", "Jovan");
    // Set cookie expiration time
    cookie.setMaxAge(7 * 24 * 60 * 60); // expires in 7 days
    // Add to response
    response.addCookie(cookie);

    return "Username is changed!";
}
```

**2) Use Spring's `@CookieValue` annotation to retrieve a specific cookie value**

```java
@GetMapping("/")
public String readCookie(@CookieValue(value = "username", defaultValue = "Atta") String username) {
    return "Hey! My username is " + username;
}
```

**3) Read all `Cookie` values**

```java
@GetMapping("/all-cookies")
public String readAllCookies(HttpServletRequest request) {

    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        return Arrays.stream(cookies)
                .map(c -> c.getName() + "=" + c.getValue()).collect(Collectors.joining(", "));
    }

    return "No cookies";
}
```

For more details on using `Cookie` in Spring Boot, check out this article: [How to use cookies in Spring Boot](https://attacomsian.com/blog/cookies-spring-boot).

## What Is the Difference Between Cookie and Session?

**The main purpose of `Session` is to record user state on the server side.** A classic scenario is a shopping cart: when you add an item to your cart, the system wouldn't know which user performed the action because HTTP is stateless. Once the server creates a dedicated `Session` for a specific user, it can identify and track that user.

`Cookie` data is stored on the client (browser) side, whereas `Session` data is stored on the server side. Comparatively, `Session` is more secure. If you use a `Cookie`, sensitive information should not be written into it—ideally, encrypt the `Cookie` data and decrypt it on the server when needed.

**So how is `Session` used for authentication?**

## How Does the Session-Cookie Authentication Flow Work?

Most of the time, we identify specific users via `SessionID`, and `SessionID` is typically stored in Redis. For example:

1. A user logs into the system successfully and receives a `Cookie` containing a `SessionID`.
2. When the user sends requests to the backend, the `SessionID` is included so the backend knows the user's identity state.

The detailed workflow of this authentication approach is as follows:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/session-cookie-authentication-process-bd689be9.png)

1. The user sends their username, password, and verification code to the server to log in.
2. After validating the credentials, the server creates a dedicated Session object for the user (think of it as a block of server memory holding that user's state data, such as shopping cart, login info, etc.), stores it, and assigns a unique `SessionID` to that Session.
3. The server sends this `SessionID` to the user's browser via the `Set-Cookie` directive in the HTTP response header.
4. Upon receiving the `SessionID`, the browser stores it locally as a Cookie. While the user stays logged in, every subsequent request sent to that server automatically includes the Cookie containing the `SessionID`.
5. When the server receives a request, it extracts the `SessionID` from the Cookie, looks up the previously saved Session object, and thereby knows which user this is and what their prior state was.

Keep the following points in mind when using Session:

- **Client Cookie support:** Core features relying on Session require that the user's browser has Cookies enabled.
- **Session expiration management:** Configure an appropriate Session expiration time to balance security and user experience.
- **Session ID security:** Setting the `HttpOnly` flag on the Cookie containing `SessionID` prevents client-side scripts (like JavaScript) from stealing it, and setting the `Secure` flag ensures `SessionID` is only transmitted over HTTPS connections, improving security.

Additionally, Spring Session provides a mechanism for managing user session information across multiple applications or instances. To learn more, check out these great articles:

- [Getting Started with Spring Session](https://codeboje.de/spring-Session-tutorial/)
- [Guide to Spring Session](https://www.baeldung.com/spring-Session)
- [Sticky Sessions with Spring Session & Redis](https://medium.com/@gvnix/sticky-Sessions-with-spring-Session-redis-bdc6f7438cc3)

## How to Handle Session-Cookie Authentication Across Multiple Server Nodes?

The Session-Cookie approach works very well in a monolithic single-node environment. However, when servers are scaled horizontally to multiple nodes, the Session-Cookie approach faces challenges.

For example: suppose we deploy two identical service instances, A and B. When a user logs in for the first time, Nginx load-balances the request to server A, so the user's Session information is saved on server A. Then, on the user's second visit, Nginx routes the request to server B. Because server B does not have the user's Session information, the user is forced to log in again.

**How should we avoid this situation?**

Here are several approaches for your reference:

1. Route all requests from a given user to the same server via a specific hashing strategy. Each server then holds a portion of users' Session data. However, if a server goes down, all Session data stored on it is completely lost.
2. Synchronize Session data across every server so that each server holds the full set of Session data. Whenever Session data changes on one server, synchronize it to all other servers. This approach is too costly, and the synchronization overhead grows as the number of nodes increases.
3. Use a dedicated shared data node accessible to all servers (such as a cache) to store Session data. To ensure high availability, avoid making this data node a single point of failure.
4. Spring Session is a project designed for managing sessions across multiple servers. It integrates with various backend stores (such as Redis, MongoDB, etc.) to enable distributed session management. Through Spring Session, session data is stored in a shared external store to achieve cross-server session synchronization and sharing.

## Can Session Still Work Without Cookies?

This is a classic interview question!

Normally, `Cookie` is used to store `SessionID`. If your implementation relies on storing `SessionID` in a `Cookie` and the client disables `Cookie`, then `Session` will stop working properly.

However, server-side Session does not strictly require using Cookies. Non-browser clients can carry session credentials via an explicitly agreed request header. Still, never put `SessionID` into the URL: even if encrypted, it remains a directly usable authentication credential and can leak into browser history, access logs, monitoring systems, and the `Referer` header. URL rewriting is only suitable for legacy compatibility scenarios you cannot avoid and should never be used as the login mechanism for new systems.

## Why Does Cookie-Based Authentication Require Extra Attention to CSRF?

**CSRF (Cross-Site Request Forgery)** is an attack where someone uses your identity to send unauthorized, harmful requests on your behalf. Let's look at a simple example:

Xiao Zhuang logs into an online banking site and visits its discussion forum. Under a post, he sees a link reading "Scientific Wealth Management, Earn Over 10,000 Annually." Out of curiosity, Xiao Zhuang clicks the link—and discovers 10,000 yuan missing from his account. What happened? A hacker hid a malicious request inside that link, directly exploiting Xiao Zhuang's identity to send a money transfer request to the bank—in other words, sending a request to the bank using your Cookie.

```html
<a href="http://www.mybank.com/Transfer?bankId=11&money=10000"
  >Scientific Wealth Management, Earn Over 10,000 Annually</a
>
```

As mentioned earlier, with `Session` authentication we typically use a `Cookie` to store `SessionId`. After logging in, the browser automatically attaches that Cookie on requests matching the Cookie's scope, and the server identifies the user by `SessionId`. If an attacker steals the `SessionId` directly, that results in session hijacking; by contrast, CSRF usually does not require the attacker to read the Cookie—it exploits the browser's behavior of automatically sending Cookies.

In `Session` authentication, the `SessionId` inside the `Cookie` is sent by the browser to the server. Leveraging this behavior, an attacker can trick the user into clicking a malicious link to execute the attack.

If a client explicitly sends a Token as a Bearer Token in the `Authorization` header, the browser will not automatically attach it to cross-site requests the way it does with Cookies, thereby reducing traditional CSRF risk. What provides this protection is the credential transport mechanism, not the Token or JWT format itself.

Do not take this as a reason to store Tokens in `localStorage` or `sessionStorage` by default. Malicious scripts running on the same origin can read Web Storage, so a single XSS vulnerability can directly leak the Token. Depending on the scenario, browser applications can choose a Backend For Frontend (BFF) pattern or use Cookies configured with `HttpOnly`, `Secure`, and an appropriate `SameSite` attribute; when using Cookies, also pair them with mechanisms like CSRF Tokens and `Origin`/`Referer` validation.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/20210615161108272-89a6db5a.png)

Note that neither `Cookie` nor `Token` authentication mechanisms alone can prevent **Cross-Site Scripting (XSS)**. While `HttpOnly` reduces the risk of scripts directly reading Cookies, XSS can still issue requests on behalf of the user, so defense-in-depth is required—including proper output encoding, HTML sanitization when necessary, and Content Security Policy (CSP).

> Cross-Site Scripting would abbreviate to CSS, which collides with Cascading Style Sheets (CSS). Therefore, Cross-Site Scripting is abbreviated as XSS.

In an XSS attack, attackers inject malicious code into pages viewed by other users in various ways, enabling scripts to steal sensitive information such as `Cookie`.

Recommended reading: [How to Prevent CSRF Attacks? — Meituan Tech Team](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)

For security best practices, also refer to:

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## What Is JWT? What Parts Make Up a JWT?

[JWT Fundamentals Explained](./jwt-intro.md)

## How Does JWT-Based Authentication Work? How to Prevent JWT Tampering?

[JWT Fundamentals Explained](./jwt-intro.md)

## What Is SSO?

SSO (Single Sign-On) means that when a user logs into one of several related subsystems, they automatically gain access to the other associated systems. For example, once we log into JD Finance, we are simultaneously logged into JD's other subsystems such as JD Supermarket, JD Worldwide, and JD Fresh.

![SSO Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sso-33288e6d.png)

## What Are the Benefits of SSO?

- **User perspective:** Users log in once and use multiple applications without needing to remember multiple sets of usernames and passwords—convenient and hassle-free.
- **System administrator perspective:** Administrators only need to maintain one unified account center—easy to manage.
- **New system development perspective:** When developing a new system, it simply integrates directly with the unified account center, simplifying development and saving time.

## How to Design and Implement an SSO System?

[SSO Single Sign-On Explained](./sso-intro.md)

## What Is OAuth 2.0?

OAuth is an industry-standard authorization protocol primarily used to grant third-party applications limited permissions. OAuth 2.0 is a complete redesign of OAuth 1.0—faster and easier to implement—and OAuth 1.0 has been deprecated. See [rfc6749](https://tools.ietf.org/html/rfc6749) for details.

In essence, it is an authorization mechanism whose ultimate purpose is to issue a time-limited Token to a third-party application so that the third-party application can access relevant resources using that token.

A very common use case for OAuth 2.0 is third-party login: whenever your website integrates third-party sign-in, it generally uses the OAuth 2.0 protocol.

Additionally, OAuth 2.0 is also widely seen in payment scenarios (WeChat Pay, Alipay) and open platforms (WeChat Open Platform, Alibaba Open Platform, etc.).

Below is a diagram of [Slack OAuth 2.0 third-party login](https://api.slack.com/legacy/oauth):

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/20210615151716340-0b7cb7f7.png)

**Recommended reading:**

- [A Simple Explanation of OAuth 2.0](http://www.ruanyifeng.com/blog/2019/04/oauth_design.html)
- [Understand the OAuth 2.0 Protocol in 10 Minutes](https://deepzz.com/post/what-is-oauth2-protocol.html)
- [The Four Grant Types of OAuth 2.0](http://www.ruanyifeng.com/blog/2019/04/oauth-grant-types.html)
- [GitHub OAuth Third-Party Login Example Tutorial](http://www.ruanyifeng.com/blog/2019/04/github-oauth.html)

## References

- Stop Using JWT for Sessions (Part 1): A Complete Guide to Token, JWT, OAuth, SAML, and SSO: <https://zhuanlan.zhihu.com/p/38942172>
- Introduction to JSON Web Tokens: <https://jwt.io/introduction>
- JSON Web Token Claims: <https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims>
