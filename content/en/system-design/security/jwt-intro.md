---
title: "What Is JWT? JWT Structure, Parsing, and Login Authentication Explained"
description: What is JWT (JSON Web Token)? This article explains the three-part Header, Payload, and Signature structure, Base64Url decoding, signature verification, expiration claims, and the login authentication flow through examples, along with common security risks.
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: What is JWT,JWT Parsing,JWT Token,JWT Authentication,JSON Web Token,Token Authentication,Stateless,Header Payload Signature,Signing Algorithm,Login Authentication,CSRF
lang: en
sourceRef: zh-ref/system-design/security/jwt-intro.md
---


## What Is JWT?

JWT (JSON Web Token) is a compact, URL-safe claim representation format defined by [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519). After a successful login, the server can embed claims such as the user identifier, permission scope, and expiration time into a JWT; the client sends it along with subsequent requests, and the server verifies the signature and relevant claims before deciding whether to grant access.

Because a JWT can carry the claims required for authentication and authorization, the server does not necessarily have to store session state the way a traditional Session approach does. However, requirements such as token revocation, permission updates, and forced logout may still require server-side state—you cannot conclude a system is completely stateless simply because it "uses JWT."

The Header and Payload of a JWT are only Base64Url-encoded, so anyone who obtains the token can decode them; never put sensitive data such as passwords or national ID numbers into the Payload. The signature is used to verify that the contents have not been tampered with—it does not encrypt the contents.

If the client explicitly puts the JWT into the `Authorization` header as a Bearer Token, the browser will not attach it automatically the way it does with Cookies, reducing traditional CSRF risk. However, this depends on how the credential is transported and stored, not on the JWT format itself; if you store a JWT inside a Cookie, CSRF protection is still required.

[Pros and Cons of JWT Authentication](./advantages-and-disadvantages-of-jwt.md) examines the advantages and limitations of using JWT for authentication in detail.

Below is the definition of JWT from [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519):

> JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used as the payload of a JSON Web Signature (JWS) structure or as the plaintext of a JSON Web Encryption (JWE) structure, enabling the claims to be digitally signed or integrity protected with a Message Authentication Code (MAC) and/or encrypted. ——[JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)

## What Parts Make Up a JWT?

![JWT Composition](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-composition-3124d137.png)

A JWT typically consists of three Base64Url-encoded parts separated by dots (`.`):

- **Header:** Describes the metadata of the JWT, including the token type and signing algorithm. After Base64Url encoding, the Header becomes the first part of the JWT.
- **Payload:** Holds the claims to be transmitted, such as `sub` (subject) and `jti` (JWT ID). After Base64Url encoding, the Payload becomes the second part of the JWT.
- **Signature:** Computed from the encoded Header, Payload, signing algorithm, and signing key. HS256 uses a shared secret key, while asymmetric algorithms such as RS256 and ES256 sign with a private key and verify with a public key.

A JWT typically looks like this: `xxxxx.yyyyy.zzzzz`.

Example:

```plain
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

You can decode this sample JWT at [jwt.io](https://jwt.io/) to inspect its three parts: Header, Payload, and Signature. Real production tokens may contain user identifiers and permission info—do not paste them into third-party online tools.

Both Header and Payload are JSON data, while Signature is computed from the encoded Header, Payload, and the signing key.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt.io-6e99ab9c.png)

### What Is the Difference Between JWT Parsing and JWT Verification?

JWT parsing only performs Base64Url decoding on the Header and Payload and requires no key. Anyone holding the token can parse it, so the decoded output does not prove the token is trustworthy.

JWT verification checks the Signature using the specified algorithm and key, and should also validate claims such as `exp`, `nbf`, `iss`, and `aud`. Only when both the signature and all business-required claims pass validation can the server trust the identity and permission data inside the token.

### Header

The Header usually consists of two fields:

- `typ` (Type): The token type, namely JWT.
- `alg` (Algorithm): The signing algorithm, such as HS256.

Example:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

The JSON Header is Base64Url-encoded to become the first part of the JWT.

### Payload

The Payload is also JSON data containing Claims.

Claims fall into three categories:

- **Registered Claims:** Predefined standard claims that are recommended for use, though not mandatory.
- **Public Claims:** Custom claims defined by JWT issuers; to avoid collisions, they should be registered in the [IANA JSON Web Token Registry](https://www.iana.org/assignments/jwt/jwt.xhtml).
- **Private Claims:** Custom claims defined by a JWT issuer for specific project needs, fitting real-world application scenarios.

Below are some common Registered Claims:

- `iss` (issuer): The issuer of the JWT.
- `iat` (issued at time): The time at which the JWT was issued.
- `sub` (subject): The subject of the JWT.
- `aud` (audience): The intended recipient of the JWT.
- `exp` (expiration time): The expiration time of the JWT.
- `nbf` (not before time): The time before which the JWT must not be accepted for processing.
- `jti` (JWT ID): A unique identifier for the JWT.

Example:

```json
{
  "uid": "ff1212f5-d8d1-4496-bf41-d2dda73de19a",
  "sub": "1234567890",
  "name": "John Doe",
  "exp": 15323232,
  "iat": 1516239022,
  "scope": ["admin", "user"]
}
```

By default, the Payload is unencrypted—**never store private or sensitive information inside the Payload!!!**

The JSON Payload is Base64Url-encoded to become the second part of the JWT.

### Signature

The Signature is a cryptographic signature over the first two parts, serving to prevent the JWT (especially the payload) from being tampered with.

Generating this signature requires:

- Header + Payload.
- The signing key stored on the server. When using asymmetric algorithms, the signing private key must never be leaked.
- The signing algorithm.

The signature calculation formula is as follows:

```plain
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```

Once the signature is computed, concatenate the Header, Payload, and Signature into a single string separated by dots (`.`): that string is the JWT.

## How Does JWT-Based Authentication Work?

In an application using JWT for authentication, the server creates a JWT from the Payload, Header, and signing key and sends it to the client. The client stores the token securely based on its application architecture and threat model, and attaches this token to subsequent requests.

![JWT Authentication Flow Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-authentication-process-c0784a69.png)

The simplified steps are as follows:

1. The user sends their username, password, and verification code to the server to log in;
2. If the username, password, and verification code pass validation, the server returns a signed Token—that is, the JWT;
3. Upon receiving the Token, the client stores it securely; browser applications may use a BFF to keep tokens on the server side, or use protected Cookies depending on the scenario;
4. On every subsequent request to the backend, the user includes this JWT in the Header;
5. The server checks the JWT and extracts the user-related information from it.

Two recommendations:

1. Do not store JWTs in `localStorage` or `sessionStorage` by default. Any malicious script on the same origin can read Web Storage, so a single XSS vulnerability can leak the token. When using Cookies, set `HttpOnly`, `Secure`, and an appropriate `SameSite` attribute, and implement proper CSRF protection.
2. In non-Cookie setups, the standard way to carry a JWT is inside the HTTP `Authorization` header (`Authorization: Bearer Token`).

**[spring-security-jwt-guide](https://github.com/Snailclimb/spring-security-jwt-guide)** is a simple example project demonstrating JWT-based authentication—feel free to check it out if you're interested.

## How to Prevent JWT Tampering?

With a properly verified signature, even if a JWT is leaked or intercepted, an attacker cannot modify the Header or Payload and produce a valid signature without knowing the signing key. However, a signature does not provide confidentiality, nor does it prevent an attacker from replaying a stolen valid JWT directly.

Why? Because when the server receives a JWT, it parses out the Header, Payload, and Signature. The server recomputes a Signature using the Header, Payload, and its key, then compares the newly computed Signature with the Signature inside the JWT. If they match, it confirms that neither the Header nor the Payload has been altered.

However, if the server's signing key is also compromised, an attacker can modify the Header and Payload and regenerate a valid Signature.

Signing keys must be stored securely, with key rotation and revocation mechanisms established.

## How to Strengthen JWT Security?

1. Use mature, well-maintained open-source libraries; never implement JWT encryption, signing, or verification logic yourself.
2. Pin an allowlist of permitted algorithms on the server rather than blindly trusting the `alg` field in the JWT Header to pick the verification algorithm; HMAC keys must have sufficient randomness and length.
3. Validate all claims relevant to the current application, including `iss`, `aud`, `exp`, and `nbf`, and enforce an explicit upper bound on allowed clock skew.
4. Use explicit `typ` headers and mutually exclusive validation rules for JWTs with different purposes—such as ID Tokens vs. Access Tokens—to prevent one token type from being substituted into another context.
5. Never store sensitive data in an unencrypted Payload, and never treat unverified Claims from a received token as trusted input.
6. Choose a secure token storage strategy tailored to the client type, and restrict token lifetime, permission scopes, and intended audience; high-risk scenarios also call for revocation, replay detection, or sender-constrained tokens.
7. Protect signing keys carefully and support key rotation. For more comprehensive security requirements, refer to [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html).
