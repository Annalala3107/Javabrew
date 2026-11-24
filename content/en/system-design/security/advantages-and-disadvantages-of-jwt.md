---
title: Pros and Cons of JWT Authentication
description: In-depth analysis of the pros and cons of JWT authentication, explaining issues such as JWT's inability to be proactively invalidated and token renewal, along with corresponding solutions.
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: JWT,Token Authentication,Stateless Authentication,JWT Disadvantages,Refresh Token,Logout Invalidation,Security Risks,Alternative Solutions
lang: en
sourceRef: zh-ref/system-design/security/advantages-and-disadvantages-of-jwt.md
---

In campus recruiting interviews, most candidates I meet use JWT for login authentication. When asked conceptual questions about JWT and why they chose it, nearly everyone can give some answers—yet when asked about JWT's drawbacks and how to address them, only a small fraction of candidates answer well.

JWT is no silver bullet; it has many flaws and is often not the optimal choice. In this article, let's examine the pros and cons of JWT authentication along with solutions to common problems, and see why many people no longer recommend using JWT.

For a basic introduction to JWT concepts, please read my earlier article: [JWT Fundamentals Explained](https://javaguide.cn/system-design/security/jwt-intro.html).

## Advantages of JWT

Compared with Session-based authentication, using JWT for authentication offers the following 4 main advantages.

### Stateless

A JWT itself contains all the information needed for authentication, so our servers do not need to store JWT state. This naturally increases system availability and scalability while greatly reducing server-side pressure.

However, it is precisely JWT's statelessness that creates its biggest drawback: **lack of control!**

For instance, if we want to revoke a JWT before it expires or change its permissions, the change will not take effect immediately and typically has to wait until the token expires. Similarly, when a user logs out, the JWT remains valid—unless we add extra backend logic, such as storing invalidated JWTs and checking validity on the backend before processing requests. We will cover specific solutions in detail later; this is just a brief mention here.

### Using the Authorization Header Reduces Traditional CSRF Risk

**CSRF (Cross-Site Request Forgery)** falls within the domain of web security attacks. Compared with SQL injection and XSS, CSRF is less famous, yet it is definitely a security risk we must account for when building systems. Even an industry benchmark like Google suffered a CSRF vulnerability in Gmail back in 2007, causing significant losses to Gmail users.

**So what exactly is Cross-Site Request Forgery?** Put simply, it means using your identity to do bad things (sending harmful requests on your behalf, such as unauthorized bank transfers).

Let's look at a simple example: Xiao Zhuang logs into an online banking site and visits its discussion forum. Under a post, he sees a link reading "Scientific Wealth Management, Earn Over 10,000 Annually." Out of curiosity, Xiao Zhuang clicks the link—and discovers 10,000 yuan missing from his account. What happened? A hacker hid a malicious request inside that link, directly exploiting Xiao Zhuang's identity to send a money transfer request to the bank—in other words, sending a request to the bank using your Cookie.

```html
<a href="http://www.mybank.com/Transfer?bankId=11&money=10000"
  >Scientific Wealth Management, Earn Over 10,000 Annually</a
>
```

Traditional CSRF attacks exploit the browser's behavior of automatically attaching authentication credentials—most commonly a `SessionID` stored in a Cookie. Even if an attacker cannot read the `SessionID`, they can still trick the browser into sending it along with a request to the target site.

Moreover, clicking a link isn't even always required for an attack to succeed—often, simply opening a page is enough for a CSRF attack to fire.

```html
<img src="http://www.mybank.com/Transfer?bankId=11&money=10000" />
```

**Then why is JWT often said to have lower CSRF risk?**

If a client explicitly places the JWT as a Bearer Token in the HTTP `Authorization` header, the browser does not automatically attach it to cross-site requests the way it does with Cookies, thereby reducing this kind of traditional CSRF risk. What takes effect here is how the credential is transported, not the JWT data format itself.

However, you must not therefore store JWTs in `localStorage` by default. Any malicious script on a same-origin page can read Web Storage, so a single XSS vulnerability could directly leak both the access token and the refresh token. Browser applications should choose an approach based on their threat model—for example, Cookies configured with `HttpOnly`, `Secure`, and an appropriate `SameSite` attribute, or a Backend For Frontend (BFF) architecture that keeps tokens on the server side.

If Cookies are used to store login credentials, proper CSRF defenses must also be in place—such as CSRF Tokens, `Origin`/`Referer` validation, and `SameSite` Cookies. `SameSite` should generally serve as defense-in-depth and cannot replace CSRF Tokens across all deployments on its own.

Preventing XSS cannot rely on a generic "suspicious string filter." A more reliable approach is context-aware output encoding tailored to HTML, attributes, JavaScript, CSS, URLs, and other contexts; when user-submitted HTML is genuinely permitted, use a continuously maintained, mature HTML sanitization library; and add defense-in-depth through mechanisms such as CSP.

### Well Suited for Mobile Applications

Using Session for authentication requires storing session data on the server side and relies on Cookies (to hold the `SessionId`), making it poorly suited for mobile apps.

By contrast, JWT authentication does not suffer from this limitation—as long as the client can store the JWT, it works seamlessly, and JWT works naturally across programming languages.

> Why is Session-based authentication poorly suited for mobile applications?
>
> 1. State management: Session relies on server-side state management, whereas mobile apps are typically stateless. Mobile connections can be unstable or interrupted, making long-lived server session state harder to maintain. Using Session authentication forces mobile apps to frequently maintain sessions with the server, increasing network overhead and complexity.
> 2. Compatibility: Mobile apps typically target multiple platforms such as iOS, Android, and Web. Each platform may handle Session management and storage differently, introducing cross-platform compatibility issues.
> 3. Security: Mobile devices often operate in untrusted network environments with risks of data leakage and attack. Storing sensitive session artifacts on mobile devices increases potential exposure to attacks.

### SSO-Friendly

With Session-based authentication, implementing Single Sign-On (SSO) requires storing users' Session data in a centralized place and runs into common cross-domain Cookie issues. With JWT authentication, however, the JWT is stored on the client side, avoiding these problems.

## Common Issues with JWT Authentication and Solutions

### JWT Remains Valid After Logout and Similar Events

Specific related scenarios include:

- Logging out;
- Changing passwords;
- Modifying a user's permissions or roles on the server;
- Banning or deleting a user's account;
- Forcefully logging a user out from the server;
- Kicking a user offline;
- ...

This issue does not exist in Session-based authentication, because in Session authentication the server simply deletes the corresponding Session record. With JWT authentication, however, it is harder to handle. As noted earlier, once a JWT is issued, unless the backend adds extra logic, it stays valid until it expires.

So how can we solve this problem? After researching numerous references, I have summarized 4 common approaches below:

**1. Store JWTs in a database**

Store active JWTs in a database—an in-memory database like Redis is strongly recommended. Whenever a specific JWT needs to be invalidated, simply delete it from Redis. However, this requires querying Redis on every request to verify whether the JWT still exists, which violates JWT's stateless principle.

**2. Blacklist mechanism**

Similar to the first approach, maintain a blacklist using an in-memory database like Redis; whenever a JWT needs to be revoked, add it to the **blacklist**. Then, on every request using a JWT, check whether that JWT is present in the blacklist.

Both of the first two approaches revolve around storing active JWTs or placing specific JWTs into a blacklist.

Although both approaches break JWT's statelessness principle, real-world production projects typically still adopt one of these two approaches.

**3. Rotate/Change the signing secret (`Secret`)**

Create a dedicated secret key for each user; whenever you want to invalidate a user's JWTs, simply update that user's secret key. However, compared with introducing an in-memory database in the first two solutions, this introduces even bigger drawbacks:

- If the service is distributed, the secret must be synchronized across multiple machines every time a new JWT is issued. Doing so requires storing the secret in a database or another external service, making it little different from Session authentication.
- If a user has the system open in two browsers simultaneously, or on both desktop and mobile, logging out from one device forces all other sessions to re-login—which is undesirable.

**4. Keep token lifetimes short and rotate frequently**

A very simple approach. However, it prevents persistent login sessions and forces users to log in repeatedly.

Additionally, handling the issue of JWTs remaining valid after a password change is relatively straightforward. One clean approach is: **sign the JWT using the hash of the user's password. That way, if the password changes, any previously issued tokens automatically fail verification.**

### JWT Renewal Issue

JWT lifetimes are generally recommended to be kept fairly short. So how should authentication work after a JWT expires, and how can we dynamically refresh JWTs so users don't have to log in repeatedly?

First, let's look at the standard approach in Session authentication: **If a Session has a 30-minute lifetime and the user makes a request within those 30 minutes, the Session expiration is extended by another 30 minutes.**

With JWT authentication, how should we handle token renewal? After reviewing various sources, I've summarized 4 approaches below:

**1. Similar to Session authentication (Not Recommended)**

This approach works for most scenarios. Suppose the server issues a JWT with a 30-minute lifetime; during each validation check, if the server finds the JWT is about to expire, it generates a new JWT and returns it to the client. On every response, the client compares the returned JWT against its local one and updates the local JWT if they differ. The drawback is that the JWT is only refreshed when a request happens right before expiration, which is not very client-friendly.

**2. Return a new JWT on every request (Not Recommended)**

The idea is simple, but the overhead is relatively high—especially if the server also stores and manages JWTs.

**3. Set JWT expiration to midnight (Not Recommended)**

This is a compromise solution ensuring most users stay logged in smoothly during the day, suitable only for systems with low security requirements.

**4. Use a short-lived Access Token and a long-lived Refresh Token (Recommended)**

The first is a short-lived access token—for example, expiring after 30 minutes; the second is a longer-lived refresh token used solely to obtain new access tokens. Neither token necessarily has to use the JWT format. Because a refresh token holds high privilege and a long lifetime, it is a prime target for attackers—never assume it is "unlikely to leak" just because it is used infrequently.

After the client logs in, it sends the access token with every request. Once the access token expires, the client exchanges the protected refresh token for a new access token. Browser applications should not store refresh tokens in `localStorage` by default; using a BFF or protected Cookies reduces the risk of scripts directly reading tokens.

The drawbacks of this approach are:

- It requires client-side cooperation;
- When a user logs out, changes their password, or experiences another security event, the corresponding refresh grant must be revoked;
- During the brief window of requesting a new JWT, the token may be momentarily unavailable (this can be mitigated by setting a timer on the client to proactively exchange the `refreshJWT` for a new `accessJWT` shortly before the `accessJWT` expires);
- For public clients, the authorization server needs to use refresh token rotation and detect replay of old tokens, or use sender-constrained refresh tokens. Refresh tokens should also be bound to the client, authorized scope, and resource server, and configured with an idle expiration timeout.

### Excessive JWT Size

JWT has a complex structure (Header, Payload, and Signature), carries extra metadata, and undergoes Base64Url encoding—making JWTs relatively large and increasing network transmission overhead.

JWT composition:

![JWT Composition](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-composition-3124d137.png)

JWT example:

```plain
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Solutions:

- Minimize the data stored in the JWT Payload, keeping only essential user and permission information.
- Compress the JWT using a compression algorithm (such as GZIP) prior to transmission to reduce size.
- In some cases, using a traditional opaque Token is more appropriate. A traditional Token is usually just a unique identifier, with its associated information (such as user ID, token expiration time, and permissions) stored on the server—typically via Redis.

## Summary

One of JWT's major advantages is statelessness, yet in reality, using JWT properly for login authentication in real-world projects almost always still requires storing JWT state on the server.

JWT is not a silver bullet and comes with many drawbacks; deciding between JWT and Session depends on the specific needs of your project. You must never blindly hype JWT while looking down on other authentication schemes.

Moreover, skipping JWT altogether and simply using an ordinary opaque Token (a randomly generated ID containing no embedded payload) backed by Redis for authentication works perfectly well too.

## References

- RFC 9700 - Best Current Practice for OAuth 2.0 Security: <https://www.rfc-editor.org/rfc/rfc9700.html>
- OWASP Session Management Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
- OWASP Cross Site Scripting Prevention Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>
- Super Detailed JWT Analysis: <https://learnku.com/articles/17883>
- How to log out when using JWT: <https://medium.com/devgorilla/how-to-log-out-when-using-jwt-a8c7823e8a6>
- CSRF protection with JSON Web JWTs: <https://medium.com/@agungsantoso/csrf-protection-with-json-web-JWTs-83e0f2fcbcc>
- Invalidating JSON Web JWTs: <https://stackoverflow.com/questions/21978658/invalidating-json-web-JWTs>
