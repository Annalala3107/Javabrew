---
title: Single Sign-On (SSO) Explained
description: "Detailed explanation of Single Sign-On (SSO) principles, covering unified authentication center design, CAS protocol, cross-domain login implementation, and login state synchronization mechanisms."
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: SSO,Single Sign-On,Unified Authentication,Login State,Ticket,TGT,ST,CAS Protocol,Cross-Domain Login
lang: en
sourceRef: zh-ref/system-design/security/sso-intro.md
---

> This article is reposted with permission from: <https://ken.io/note/sso-design-implement> Author: ken.io

## Introduction to SSO

### What Is SSO?

SSO stands for **Single Sign-On**. In an environment with multiple application systems, SSO allows a user to log in just once and access all mutually trusted application systems without logging in again.

For example, after logging into the NetEase Account Center (<https://reg.163.com/>), you are automatically logged in when visiting any of the following sites:

- NetEase Live [https://v.163.com](https://v.163.com/)
- NetEase Blog [https://blog.163.com](https://blog.163.com/)
- NetEase Huatian [https://love.163.com](https://love.163.com/)
- NetEase Kaola [https://www.kaola.com](https://www.kaola.com/)
- NetEase Lofter [http://www.lofter.com](http://www.lofter.com/)

### What Are the Benefits of SSO?

1. **From the user's perspective:** Users only need to log in once to access multiple systems, without having to remember multiple sets of usernames and passwords—convenient and hassle-free.
2. **From the system administrator's perspective:** Administrators only need to maintain a single unified account center, making management straightforward.
3. **From a new system development perspective:** When developing a new system, developers only need to integrate directly with the unified account center, simplifying the development process and saving time.

## SSO Design and Implementation

This article primarily explores how to design and implement an SSO system.

The following are the core features that need to be implemented:

- Single Sign-On (SSO)
- Single Sign-Out (SLO)
- Support for cross-domain Single Sign-On
- Support for cross-domain Single Sign-Out

### Core Applications and Dependencies

![Single Sign-On (SSO) Design](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-system.png-kblb-a9f16729.png)

| Application / Module / Object | Description |
| ----------------------------- | ----------- |
| Frontend Site | A site that requires user login |
| SSO Site - Login | Provides the login page |
| SSO Site - Logout | Provides the entry point for logging out |
| SSO Service - Login | Provides the backend login service |
| SSO Service - Login State | Provides services for verifying login state and querying login information |
| SSO Service - Logout | Provides the backend user logout service |
| Database | Stores user account information |
| Cache | Stores user login state information, typically using Redis |

### Storage and Verification of User Login State

Common web frameworks implement sessions by generating a `SessionId` stored in a browser cookie, while keeping the actual session data in server-side memory—something [ken.io](https://ken.io/) also covered earlier in [How Sessions Work](https://ken.io/note/session-principle-skill). The overall approach here follows a similar idea.

After a user logs in successfully, the SSO site establishes its own login session. The session identifier in the browser should be stored in a cookie configured with `Secure`, `HttpOnly`, and an appropriate `SameSite` attribute; the cookie should be scoped to the current host only rather than expanded directly to the entire parent domain just to share login state. Mobile apps should use the system browser to complete a standard authorization flow and store necessary credentials in secure storage such as Keychain or Keystore. This article focuses mainly on web-based SSO.

When a user browses a page that requires login, the client submits the `AuthToken` to the SSO service to verify the login state and/or retrieve user login information.

For storing login state information, Redis is recommended. Using a Redis cluster guarantees both high availability and linear horizontal scalability, while also enabling the SSO service to meet load-balancing and scalability requirements.

| Object | Description |
| ------ | ----------- |
| AuthToken | A high-entropy, unpredictable identifier generated using a cryptographically secure random number generator, with expiration, rotation, and revocation mechanisms configured. Do not use predictable UUID versions, and do not encrypt `UserName` + timestamp yourself as a session token. |
| Login Info | Typically caches fields such as `UserId` and `UserName`. |

### User Login and Login Verification

**Login Sequence Diagram**

![SSO System Design - Login Sequence Diagram](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-login-sequence.png-kbrb-0e97c0c7.png)

The diagram above illustrates the approach of sharing an `AuthToken` across multiple subdomains via a parent-domain cookie. For new systems, it is **not** recommended to set the authentication cookie's `Domain` attribute to `.test.com`: doing so sends the same credential to every matching subdomain, so any weak, abandoned, or compromised subdomain can expand the attack surface.

A safer approach is to let the SSO site and each business site maintain their own host-only sessions separately. When a business site requires login, it redirects the user to the SSO site. The SSO site checks its own cookie to determine whether the user is already logged in, then returns the authentication result to the business site via a one-time, short-lived authorization code. The business site's backend exchanges that code for user information and establishes a local session.

**Fetching Login Info / Verifying Login State**

![SSO System Design - Fetching Login Info / Verifying Login State](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-logincheck-sequence.png-kbrb-be6352e2.png)

### User Logout

SSO logout is not merely deleting a single cookie:

1. The SSO server revokes the central login session and associated refresh grants.
2. The SSO site clears its own session cookie.
3. Depending on the protocol and business risk, the SSO service notifies each business site via front-channel or back-channel notifications to clear their local sessions, and handles notification failures, offline sites, and similar edge cases.

**Logout Sequence Diagram**

![SSO System Design - User Logout](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-logout-sequence.png-kbrb-9268a188.png)

### Cross-Domain Login and Logout

Cross-domain SSO should not attempt to solve cross-domain cookie reading/writing issues directly; instead, it should establish each site's own session through standard browser redirects and backend token exchanges. A common choice is the **OpenID Connect Authorization Code Flow**.

The core ideas for handling cross-domain SSO are:

- After login completes, the SSO service returns a one-time, short-lived authorization code only to a pre-registered and strictly matched redirect URI (`callback` URL). The business site's backend exchanges this authorization code for the authentication result and establishes its own local session, rather than copying the same long-lived Bearer Token across multiple domains.
- Authorization requests must validate `state`; when using OpenID Connect, the client must also validate the Issuer, Audience, and signature, and verify `nonce` when used. Public clients using the Authorization Code Flow should also use PKCE.
- Cross-site logout uses protocol-defined front-channel or back-channel notifications, and allows business sites to converge state through session expiration, token revocation, and revalidation if a logout notification fails.

**Cross-Domain Login (Primary Domain Already Logged In)**

![SSO System Design - Cross-Domain Login (Primary Domain Already Logged In)](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-crossdomain-login-loggedin-sequence.png-kbrb-2fa846cf.png)

**Cross-Domain Login (Primary Domain Not Logged In)**

![SSO System Design - Cross-Domain Login (Primary Domain Not Logged In)](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-crossdomain-login-unlogin-sequence.png-kbrb-c62b0a77.png)

**Cross-Domain Logout**

![SSO System Design - Cross-Domain Logout](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-crossdomain-logout-sequence.png-kbrb-3d8b358c.png)

The sequence diagrams above come from the original reposted design and are primarily intended to help illustrate login redirects and notification relationships. Implementation details such as passing `AuthToken` directly or sharing parent-domain cookies should **not** be used as a basis for new systems. New systems should follow the current security specifications of the chosen OpenID Connect / OAuth protocol.

## Notes

- **Regarding the design:** This design proposal mainly serves to illustrate the architectural concepts. Mobile app user login should not rely merely on adding a custom "APP signature" as a security solution; instead, it is recommended to use the system browser to complete the OpenID Connect / OAuth Authorization Code Flow with PKCE. A mobile app cannot be treated as a trusted environment capable of permanently keeping a client secret confidential.
- **Regarding the sequence diagrams:** The sequence diagrams do not cover every possible scenario—only the core/primary flows are shown, and minor messages that do not affect understanding of the flow have been omitted where appropriate.

## References

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-18.html)
- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)
