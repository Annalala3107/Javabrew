---
title: Why Can You Only Reset a Forgotten Password Instead of Retrieving the Original One?
description: "Detailed explanation of why websites only let you reset a forgotten password instead of telling you your original password. The core reason is that servers store passwords using irreversible hash algorithms, making it impossible to recover the original password from the hash. Also covers password storage security, salting, Bcrypt, and password transport security."
category:
  - System Design
tag:
  - Data Security
  - Password Security
  - Hash Algorithms
  - Interview Questions
head:
  - - meta
    - name: keywords
      content: Password Reset,Password Recovery,Hash Algorithms,Password Storage,Bcrypt,Salting,Password Security,Interview Questions
lang: en
sourceRef: zh-ref/system-design/security/why-password-reset-instead-of-retrieval.md
---

This is quite an interesting question that many companies ask in technical interviews. It is fairly straightforward—have you ever wondered about this while resetting a password?

![Reset Account Password](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/reset-password-page-727107cf.png)

The answer boils down to a single sentence: **because the server itself does not know what your original password is.** Any developer who stored plaintext passwords has already been fired 🤣.

If a server knows your original password, that represents a severe security vulnerability.

Let's break this down step by step.

This article will not go too deep into cryptographic algorithm theory; if you are interested, feel free to check out this article: [Summary of Common Encryption Algorithms](https://javaguide.cn/system-design/security/encryption-algorithms.html).

![](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/javaguide-security-encryption-algorithms-ab4a8508.png)

## Why Doesn't the Server Know Your Original Password?

Anyone who has done backend development knows that when saving passwords to a database, **the server must never store them in plaintext**.

Storing plaintext passwords carries massive risks:

1. Risk of database leaks or theft.
2. Insiders with database access could maliciously exploit user credentials.
3. If hackers breach the system, they immediately obtain all user passwords.

Therefore, passwords must be processed before storage—and that processing uses **hash algorithms**.

## Introduction to Hash Algorithms

A hash algorithm, also known as a hash function or digest algorithm, produces a fixed-length unique identifier—called a hash value, digest value, or message digest (referred to simply as a hash value hereafter)—for data of arbitrary length.

![Hash Algorithm Effect Demonstration](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/hash-function-effect-demonstration-1a79d632.png)

Hash algorithms have two critical properties:

1. **Irreversibility:** You cannot reconstruct the original value from its hashed output. This is the core reason!
2. **Determinism:** The exact same input always produces the exact same output.

There is a vivid analogy for this: **your stored password is like shredded potatoes—you cannot turn shredded potatoes back into a whole potato. Instead, when the website checks whether your password is correct, it takes the password you just entered as a fresh potato, shreds it the exact same way, and checks whether the two plates of shredded potatoes match.**

These two properties make hash algorithms ideal for password storage: the server stores only the password's hash, and during verification it only needs to compare whether the hashes match.

### Classification of Hash Algorithms

Hash algorithms can be broadly divided into two categories:

1. **Cryptographic Hash Algorithms:** Higher-security hash algorithms that offer data integrity protection and tamper resistance, capable of withstanding cryptographic attacks. They provide relatively high security at lower throughput and are suitable for security-critical scenarios—for example, SHA-2, SHA-3, SM3, RIPEMD-160, BLAKE2, etc.
2. **Non-Cryptographic Hash Algorithms:** Lower-security hash algorithms vulnerable to brute-force and collision attacks, but with very high throughput, suitable for non-security scenarios—for example, CRC32, MurMurHash3, etc.

Beyond these two categories, there are specialized hash algorithms such as even stronger **slow hash algorithms**.

### Why Is MD5 Not Recommended?

In the early days, MD5 was commonly used to hash passwords, but it is **no longer recommended** for the following reasons:

1. **Poor collision resistance:** Suffers from collision weaknesses where multiple different inputs can produce the exact same MD5 digest.
2. **Short hash length:** A 128-bit hash is easily targeted by rainbow table attacks.
3. **Too fast to compute:** Makes offline brute-force cracking dangerously fast and cheap.

For a deeper explanation, see this article: [Stop Putting "MD5 Password Encryption" on Your Resume!](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247542780&idx=1&sn=fb2fe3fb53fe596cc5b22e30766e0098&scene=21#wechat_redirect)

### Why Is Salting Necessary?

Simply storing unsalted hashes still leaves passwords vulnerable to **rainbow table attacks**. A rainbow table is a precomputed lookup table mapping common inputs to hash values, enabling attackers to crack passwords rapidly by looking up hashes.

A **Salt** is a random value generated independently for each password and fed into the password hashing algorithm alongside the password. The salt does not need to be kept secret, but it must be random and never reused across all users.

**Benefits of salting:**

1. Increases password complexity and uniqueness.
2. Renders precomputed rainbow tables ineffective (each user has a distinct salt).
3. Even if two users choose the exact same password, their stored hash values are completely different.

## Recommended Password Storage Schemes

Passwords should be hashed using dedicated, cost-tunable algorithms built specifically for password storage, rather than fast general-purpose hashes like MD5, SHA-256, or SHA-3. Even if a fast hash is salted, an attacker who obtains the database can still test massive numbers of candidate passwords at extremely high speed.

New systems should prioritize **Argon2id**. If Argon2id is unavailable, `scrypt` can be chosen based on the runtime environment; for compatibility with legacy systems, properly configured `Bcrypt` can be used; and where FIPS compliance is required, `PBKDF2` can be used. Specific cost parameters should be periodically evaluated and upgraded in line with server performance.

### Bcrypt Example

**Bcrypt** is a slow hash algorithm specifically designed for password storage. It includes both built-in `salt` generation and a `cost` parameter:

- **salt:** A randomly generated value mixed with the password to guarantee uniqueness.
- **cost:** Controls the iteration count, increasing computation time and resource usage per hash.

Bcrypt's random salt prevents precomputation and rainbow table attacks, while its `cost` parameter raises the expense of offline guessing—though it still cannot make weak passwords uncrackable. Note also that most Bcrypt implementations process only the first 72 bytes of a password, so systems must never silently truncate passwords without warning the user.

Spring Security provides `BCryptPasswordEncoder`. Below is an example showing how to explicitly configure the `cost` factor; for new systems, you should still evaluate `Argon2id` first:

```java
@Bean
public PasswordEncoder passwordEncoder(){
    // Cost should be determined via performance benchmarking and adjusted periodically as hardware improves.
    return new BCryptPasswordEncoder(12);
}
```

## Login Verification Flow

When you enter your password to log in, verification proceeds as follows:

1. The server looks up the user's stored encoded password hash from the database by username. This encoded string typically already contains the algorithm identifier, parameters, and random salt.
2. The server invokes the password hashing library's verification method—such as Spring Security's `PasswordEncoder#matches`. Never concatenate the salt manually or compare strings directly.
3. The password library extracts the salt and parameters from the encoded string, runs the exact same computation on the user's input, and compares the results in a constant-time / secure manner.
4. If verification passes, the password is correct; otherwise, it is incorrect. Upon successful verification, the system can also re-hash and upgrade the stored password hash if its parameters are outdated.

## How Does Password Reset Detect That the New Password Matches the Old Password?

Attentive users may have noticed that some websites tell you *"New password cannot be the same as the old password"* during a password reset. How does the website know the new password equals the old one?

The principle is identical to verifying password correctness at login:

1. The user enters the new password.
2. The server calls the password hashing library's verification method to check the new password against the old password hash stored in the database—for example, `passwordEncoder.matches(newPassword, oldPasswordHash)`.
3. If verification passes, the new password matches the old password, so the change is rejected.
4. If they do not match, a fresh random salt and new password hash are generated for the new password—never reuse the old hash or hardcode a fixed salt.

Thus, the website still has no idea what your old password actually was; it merely checks whether the two plates of "shredded potatoes" turn out identical.

## Password Transport Security

So far we have discussed password storage security on the server—but is the password safe while in transit?

Here is a common interview question: **If an employee knows the encryption method, couldn't they intercept packets privately or after leaving the company and simulate the encryption to steal passwords?**

The answer is: **storage and transport security are handled separately.**

A complete password security architecture must protect both storage and transport.

### Using HTTPS

The HTTPS protocol is the foundation of transport security. HTTP runs directly over TCP—all transmitted data is plaintext, and neither client nor server can authenticate the other party's identity. HTTPS is HTTP running over SSL/TLS, where all transmitted traffic is encrypted.

For a detailed comparison between HTTP and HTTPS, see: [HTTP vs HTTPS (Application Layer)](https://javaguide.cn/cs-basics/network/http-vs-https.html).

For standard web applications, properly configured HTTPS is the baseline solution for password transport security. Servers should default to TLS 1.3 and support TLS 1.2 where compatibility requires; enforce HTTPS site-wide, enable HSTS, verify certificates properly, and disable obsolete protocols and weak cipher suites.

Adding an extra layer of custom RSA encryption inside the browser generally fails to stop malicious clients, compromised frontend scripts, or password leakage at the server decryption boundary—while introducing additional risks around key distribution, padding choices, and ciphertext replay. Therefore, do not treat "client-side RSA + HTTPS" as a universal requirement for every system.

Certain systems with explicit compliance mandates or specialized threat models may add application-layer protection on top of TLS, but they should use peer-reviewed, mature protocols incorporating random challenges, freshness/timestamp validation, and anti-replay mechanisms—never just naive one-shot public-key encryption.

In addition to transport encryption, systems should rate-limit login attempts, avoid logging passwords, enable multi-factor authentication (MFA), and defend against credential stuffing attacks.

## What Else Should Be Considered in the Forgot-Password Flow?

This article focuses on explaining why servers cannot retrieve your original password. When actually implementing a forgot-password flow, the following security requirements must also be met:

- Return a consistent response message regardless of whether the account exists, and keep response times as uniform as possible to prevent user enumeration.
- Generate reset tokens using a cryptographically secure random number generator (CSPRNG) with sufficient entropy; tokens must be single-use and expire after a short period.
- Apply rate limiting to reset requests and token verification; ensure reset links only use trusted domains over HTTPS and avoid leaking tokens via the `Referer` header.
- Send a security notification after a password change succeeds, and invalidate existing sessions according to risk—or at minimum allow users to sign out of all other sessions with one click.

## Summary

Returning to the original question: why can you only reset a forgotten password rather than being told your original password?

Because the server stores a hashed version of your password, and **hash algorithms are irreversible**—it is mathematically infeasible to recover the original password from its hash. This is a fundamental principle of password security.

If a website can directly tell you your original password, it means the server stored your password in **plaintext or a reversible format** rather than a dedicated password hash. That is a critical security red flag: you should change your password immediately and check whether you reused that same password on any other websites.

**Even more importantly:** if you use the same password across every website, one untrustworthy site leaking your password puts all of your accounts at risk. Therefore, **never reuse the same password across different websites!**

## References

- OWASP Password Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- OWASP Forgot Password Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html>
- OWASP Transport Layer Security Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html>
