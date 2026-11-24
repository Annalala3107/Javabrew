---
title: HTTP vs HTTPS: What's the Difference and Why HTTPS Is More Secure (Application Layer)
description: Compares the protocols and security mechanisms of HTTP and HTTPS, analyzes the working principles and handshake process of SSL/TLS, and clarifies the implementation details of application layer security.
category: Computer Basics
tag:
  - Computer Network
head:
  - - meta
    - name: keywords
      content: HTTP,HTTPS,SSL,TLS,encryption,authentication,port,security,handshake process
lang: en
sourceRef: zh-ref/cs-basics/network/http-vs-https.md
---

HTTP can transmit web page content, but it transmits in plaintext by default. If requests and responses are intercepted, tampered with, or spoofed in the network, HTTP itself lacks adequate protective capabilities.

HTTPS is not a completely new application layer protocol; instead, it uses TLS to protect HTTP communication. In HTTP/1.1 and common HTTP/2 scenarios, TLS typically runs over TCP; HTTP/3 maps HTTP semantics to UDP-based QUIC, integrating TLS 1.3 directly within QUIC.

This article primarily answers several questions:

1. What is the core difference between HTTP and HTTPS?
2. How does HTTPS prevent eavesdropping, tampering, and spoofing?
3. Roughly what does the SSL/TLS handshake accomplish?
4. Why do certificates, mixed content, and performance optimizations still require attention even after adopting HTTPS?

## HTTP Protocol

### Introduction to HTTP Protocol

HTTP protocol stands for Hypertext Transfer Protocol. As the name suggests, the HTTP protocol is designed to standardize the transmission of hypertext—hypertext referring to all kinds of network messages including text—specifically regulating the behavior between browsers and servers.

Furthermore, HTTP is a stateless protocol, meaning the server does not retain any past request messages from the client. This is essentially a deliberate simplicity: stateful protocols are much more complex, requiring state (historical information) maintenance, and if the client or server crashes, state inconsistencies arise, resolving which carries a much higher cost.

![HTTP: Hypertext Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

### HTTP Protocol Communication Process

HTTP is an application layer protocol. Taking TCP-based HTTP/1.1 as an example to illustrate the communication process, the default port for an `http` URL is 80:

1. The server listens for client requests on port 80.
2. The browser initiates a TCP connection to the server (creating a Socket).
3. The server accepts the incoming TCP connection from the browser.
4. The browser (HTTP client) and the Web server (HTTP server) exchange HTTP messages.
5. The TCP connection is closed.

### Advantages of HTTP Protocol

High extensibility, fast speed, and excellent cross-platform support.

## HTTPS Protocol

### Introduction to HTTPS Protocol

HTTPS (Hypertext Transfer Protocol Secure) uses TLS to provide confidentiality, integrity, and identity authentication for HTTP, with a default port of 443. HTTP/1.1 and HTTP/2 typically use TLS over TCP; HTTP/3 uses QUIC with integrated TLS 1.3, which is built on top of UDP.

In HTTPS, once the TLS handshake is completed, communication data is protected using symmetric AEAD algorithms such as AES-GCM or ChaCha20-Poly1305. The handshake can use (EC)DHE to negotiate a shared secret, or use PSK in scenarios such as session resumption; older TLS versions also supported RSA key transport. ECDH/ECDHE is a key exchange/negotiation algorithm, not public-key encryption of a pre-generated symmetric key.

### Advantages of HTTPS Protocol

Strong confidentiality and high trust.

## The Core of HTTPS — The SSL/TLS Protocol

The security capabilities of HTTPS come from TLS. TLS provides confidentiality and integrity protection for communication data, and authenticates communicating peers via mechanisms such as certificates. Next, we will focus on the working principle of TLS.

### Difference Between SSL and TLS?

**There is no fundamental difference between SSL and TLS.**

SSL stands for Secure Sockets Layer protocol, first published in 1996 (SSL 3.0). SSL 1.0 was never publicly released, and SSL 2.0 had major flaws (the DROWN flaw — Decrypting RSA with Obsolete and Weakened eNcryption). Soon, in 1999, SSL 3.0 was upgraded further, and **the new version was named TLS 1.0**. Therefore, TLS is built on top of SSL, but out of habit, the core encryption protocol in HTTPS is often referred to interchangeably as SSL/TLS. Today, SSL has been completely deprecated, and TLS 1.2 and TLS 1.3 are the de facto standards of modern HTTPS.

### Working Principle of SSL/TLS

#### Asymmetric Encryption

TLS uses asymmetric cryptographic mechanisms to accomplish identity authentication and/or key exchange, and then uses symmetric keys to protect application data. Asymmetric cryptography is not limited to the single use case of "encrypt with public key, decrypt with private key": digital signatures use private keys to sign and public keys to verify, while ECDHE negotiates a shared secret through temporary keys generated by both parties. The mailbox analogy below is only used to illustrate the basic concept of public-key encryption schemes such as RSA, and does not represent all TLS handshakes.

> In a self-service post office, every communication channel is a mailbox. Next to each mailbox, the owner puts up a sign hanging a key: This is my public key; senders please drop letters into my mailbox and lock it with the public key.
>
> However, the public key can only lock, not unlock. Unlocking can only be done by the mailbox owner — because only he holds the private key.
>
> In this way, communication information will not be intercepted by others, relying on the confidentiality of the private key.

![Process of public key encryption and private key decryption in asymmetric cryptography](/media/jg/local/cs-basics/network/images/http-vs-https/public-key-cryptography-fa491c.png)

The public key and private key of asymmetric encryption must be generated using a complex mathematical mechanism (cryptography holds that for high security, one should avoid inventing their own encryption schemes). The generation algorithm of public-private key pairs relies on one-way trapdoor functions.

> One-way function: Given a one-way function f and any input x, it is easy to compute output y = f(x); but given an output y, assuming f(x) = y exists, it is very difficult to compute x based on f.
>
> One-way trapdoor function: A weaker one-way function. Given a one-way trapdoor function f and trapdoor h, for any input x, it is easy to compute output y = f(x; h); given output y, assuming f(x; h) = y exists, it is very difficult to compute x based on f alone, but x can be deduced given both f and h.

![One-way function](/media/jg/local/cs-basics/network/images/http-vs-https/OWF-7dbc51.png)

The figure above is a one-way function (not a one-way trapdoor function). Suppose there is a secret manual where anyone who knows it can turn apple juice back into an apple; that secret manual would be the "trapdoor".

Here, the computation method of function f corresponds to the public key, and trapdoor h corresponds to the private key. Public key f is public, and anyone can encrypt any given input using f; however, to restore the original information from the encrypted data, the private key is strictly required.

#### Symmetric Encryption

TLS does not use asymmetric cryptography algorithms to directly encrypt large volumes of business data. Once identity authentication and key establishment are completed during the handshake phase, the record layer uses symmetric AEAD algorithms to protect HTTP requests and responses.

> Symmetric encryption: Both communicating parties share a single secret key k, the encryption and decryption algorithms are known, the encryptor encrypts using key k, and the decryptor decrypts using key k. Confidentiality depends on the secrecy of key k.

![Symmetric encryption where both parties use a shared secret key for encrypted communication](/media/jg/local/cs-basics/network/images/http-vs-https/symmetric-encryption-a4e0d4.png)

The communicating parties must establish traffic keys known only to each other over an insecure network. In TLS 1.2, static RSA key exchange had the client generate a `PreMasterSecret` and send it encrypted with the server's RSA public key; modern TLS more commonly uses ECDHE, allowing both sides to exchange ephemeral public keys and each compute the identical shared secret. TLS 1.3 has completely removed static RSA key exchange, permitting key establishment methods such as (EC)DHE, PSK, or PSK+(EC)DHE. Regardless of the method used, symmetric traffic keys are ultimately derived to protect subsequent data; no cryptographic scheme can ever be called "absolutely safe".

#### Reliability of Public Key Transmission

Now that SSL/TLS has been introduced to this point, friends familiar with information security will think of a security hazard. Consider the following scenario:

> Client C and Server S want to communicate using SSL/TLS. According to the above SSL/TLS communication principle, C must first know S's public key, and the only way to obtain S's public key is to transmit S's public key over the network channel. Note that communication over network channels entails several premises:
>
> 1. Anyone can capture communication packets.
> 2. The confidentiality of communication packets is designed by the sender.
> 3. The encryption algorithm design is presumed public by default, while the (decryption) key is presumed secure.
>
> Therefore, suppose S's public key is transmitted over the channel unencrypted. It is very likely that an attacker A sends a counterfeit packet to C, pretending to be S's public key when it is actually decoy server AS's public key. When C receives AS's public key (thinking it is S's public key), C will subsequently encrypt data with AS's public key and transmit it over the public channel. A will capture these encrypted packets, decrypt them with AS's private key, and intercept what C intended to send to S, while both C and S remain completely unaware.
>
> Similarly, even if S's public key were encrypted, this trust problem is hard to avoid: C has been misled by AS!

![Man-in-the-middle replacing the server public key leading client to trust the attacker's public key](/media/jg/local/cs-basics/network/images/http-vs-https/attack1-7043a4.png)

To solve the trust problem of public key transmission, third-party institutions came into being — Certificate Authorities (CA). CAs are trusted third parties by default. A CA issues certificates to various servers; the certificate is stored on the server and carries the CA's **digital signature** (see next section).

When the server authenticates using a certificate, the client obtains the certificate chain provided by the server and verifies whether the signature chain connects to a locally trusted root, while simultaneously checking information such as target hostname, validity period, key usage, and path constraints. Only when all these checks pass can the client bind the public key in the certificate to the target service's identity. Non-certificate authentication methods such as PSK belong to a different category of scenarios.

#### Digital Signature

Now we arrive at the concluding section of SSL/TLS. The previous section mentioned digital signatures; the problem that digital signatures solve is preventing certificates from being forged. The reason a third-party trusted institution like a CA can be trusted is **precisely due to digital signature technology**.

Digital signatures are used to detect whether certificate contents have been tampered with and prove that the signature was generated by the party holding the CA's private key. This process should be described as "private-key signing, public-key verification", rather than the generic "private-key encryption, public-key decryption". The specific process is as follows:

> After verifying the application information, the CA generates a digital signature on the portion of the certificate to be signed using its own private key, and attaches the signature to the certificate.
>
> The server sends the certificate chain to the client. The client verifies the current certificate's signature using the public key from the issuer certificate, verifying level by level up to a locally trusted root.
>
> Signature verification is only one part of certificate verification. The client must also check conditions including target hostname, validity period, intended usage, basic constraints, and name constraints; only after all pass does it accept the server's identity.

![CA proves certificate has not been tampered with via digital signature](/media/jg/local/cs-basics/network/images/http-vs-https/digital-signature-789204.png)

In summary, the public key transmission mechanism with certificates is as follows:

1. Given server S, client C, and trusted third-party CA.
2. CA verifies S's application information and generates a digital signature for the certificate containing S's public key and identity information.
3. S obtains the certificate issued by CA and delivers this certificate to C.
4. C receives S's certificate chain, verifies signatures using each issuer's public key, and confirms that the chain is ultimately anchored to a locally trusted root.
5. C continues checking domain name, validity period, usage, and certificate constraints. Only after all pass does C accept the binding between the public key in the certificate and the target service identity.

![HTTPS reliably transmits server public key via CA certificate](/media/jg/local/cs-basics/network/images/http-vs-https/public-key-transmission-4d8189.png)

Regarding digital signatures, my explanation here is relatively simple. If you are not yet clear on it, I strongly recommend watching the video [Principles of Digital Signatures and Digital Certificates](https://www.bilibili.com/video/BV18N411X7ty/), which is the clearest explanation I have seen.

![Screenshot of video explanation on principles of digital signatures and digital certificates](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220321121814946-259f2934.png)

## Summary

- **Port Number**: HTTP is 80 by default; HTTPS is 443 by default.
- **URL Prefix**: HTTP's URL prefix is `http://`; HTTPS's URL prefix is `https://`.
- **Security and Transmission Method**: HTTP without TLS does not provide confidentiality, integrity, or peer identity authentication by default. HTTPS protects HTTP using TLS; HTTP/1.1 and HTTP/2 typically use TLS over TCP, while HTTP/3 uses QUIC with integrated TLS 1.3. The TLS handshake is responsible for authenticating peers and establishing traffic keys, and subsequent data is protected by symmetric AEAD algorithms. Certificates are primarily used for identity authentication; one cannot sweepingly claim that "certificates encrypt symmetric keys".
