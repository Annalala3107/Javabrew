---
title: Summary of Common Encryption Algorithms
description: "Detailed guide to common cryptographic algorithms, covering the principles and use cases of symmetric and asymmetric encryption algorithms such as AES and RSA, as well as hash algorithms such as MD5 and SHA."
category: System Design
tag:
  - Security
  - Hash Algorithms
head:
  - - meta
    - name: keywords
      content: Encryption Algorithms,AES,RSA,Hash Algorithms,Digest Algorithms,HTTPS,Symmetric Encryption,Asymmetric Encryption,BCrypt
lang: en
sourceRef: zh-ref/system-design/security/encryption-algorithms.md
---

Cryptographic algorithms are techniques that transform data using mathematical methods in order to protect data security and prevent unauthorized reading or modification. They are generally grouped into three major categories: symmetric encryption algorithms, asymmetric encryption algorithms, and hash algorithms (also known as digest algorithms).

Common scenarios in daily development that require cryptographic algorithms include:

1. Passwords stored in a database must be salted and processed with a password hashing algorithm (such as BCrypt).
2. Sensitive data stored in a database—such as bank card numbers and national ID numbers—must be stored using a symmetric encryption algorithm (such as AES).
3. Sensitive data transmitted over the network—such as bank card numbers and national ID numbers—must use HTTPS combined with asymmetric cryptography (such as RSA) to ensure transmission security.
4. ...

P.S.: Strictly speaking, hash algorithms are not encryption algorithms, though they are used in certain security scenarios (such as password hashing); the two can be viewed as parallel categories. Encryption algorithms typically refer to algorithms that convert plaintext into ciphertext and can later restore the ciphertext back into plaintext via a mechanism such as a key. By contrast, a hash algorithm is a one-way process: it converts input information into a fixed-length, seemingly random hash value, and this process is irreversible—meaning the original information cannot be recovered from the hash value.

## Hash Algorithms

A hash algorithm, also called a hash function or digest algorithm, generates a fixed-length unique identifier for data of arbitrary length, known as a hash value, digest value, or message digest (referred to simply as a hash value hereafter).

![Hash Algorithm Effect Demonstration](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/hash-function-effect-demonstration-1a79d632.png)

Hash algorithms are irreversible: you cannot recover the original value from its hashed output.

Hash values can be used to verify data integrity and consistency.

Here are two practical examples:

- When storing passwords in a database using a hash algorithm, you can verify whether a password is correct by comparing the hash of the user-entered password against the hash stored in the database.
- When downloading a file, you can check whether the file has been tampered with or corrupted by comparing the file's hash value with the official hash value provided by the publisher.

The defining property of this type of algorithm is irreversibility:

- The original data cannot be reconstructed from the hash value.
- Any change to the original data results in a drastic change in the hash value.

Hash algorithms can be broadly divided into two categories:

1. **Cryptographic Hash Algorithms:** Higher-security hash algorithms that provide data integrity protection and tamper resistance, capable of withstanding specific cryptographic attacks. They offer relatively high security at lower throughput and are suitable for security-sensitive scenarios, such as SHA-2, SHA-3, SM3, RIPEMD-160, BLAKE2, etc.
2. **Non-Cryptographic Hash Algorithms:** Lower-security hash algorithms that are vulnerable to brute-force or collision attacks, but offer very high performance and are suitable for business scenarios without security requirements, such as CRC32, MurMurHash3, etc.

In addition to these two categories, there are specialized hash algorithms such as even more secure **slow hash algorithms**.

Common hash algorithms include:

- **MD (Message Digest):** MD2, MD4, MD5, etc. These are no longer recommended.
- **SHA (Secure Hash Algorithm):** The SHA-1 family has low security, whereas SHA-2 and SHA-3 families provide strong security.
- **Chinese National Cryptographic Algorithms (ShangMi):** Such as SM2, SM3, and SM4, where SM2 is an asymmetric encryption algorithm, SM4 is a symmetric encryption algorithm, and SM3 is a hash algorithm (comparable in security and efficiency to SHA-256, and widely adopted for domestic compliance environments in China).
- **Bcrypt (Password Hashing Algorithm):** A password hashing algorithm based on the Blowfish cipher, designed specifically for password storage; it offers high security and belongs to slow hash algorithms.
- **MAC (Message Authentication Code):** HMAC is a hash-based MAC that can be combined with any secure hash algorithm, such as SHA-256.
- **CRC (Cyclic Redundancy Check):** CRC32 is a CRC algorithm that produces a 32-bit checksum, commonly used for data integrity checks, file verification, and similar scenarios.
- **SipHash:** Unlike traditional unkeyed cryptographic hash functions (such as SHA-256), SipHash is a keyed PRF (Pseudo-Random Function). It must be paired with a random key to truly resist collision attacks. It is designed to strike a balance between speed and security and is used to defend against [hash-flooding DoS attacks](https://aumasson.jp/siphash/siphashdos_29c3_slides.pdf). Rust uses SipHash as its default hash algorithm (currently SipHash-1-3), and starting from Redis 4.0, Redis switched its dictionary (`dict`) hash algorithm from MurmurHash2 to SipHash (currently SipHash-1-2).
- **MurMurHash:** A classic fast non-cryptographic hash algorithm; the latest version is MurMurHash3, which can generate 32-bit or 128-bit hash values.
- ...

Hash algorithms generally do not require a key, though certain specialized hash algorithms do. For example, MAC and SipHash are keyed hash algorithms that incorporate a secret key on top of hashing so that only someone possessing the key can verify data integrity and origin.

### MD

The MD family has multiple versions, including MD2, MD4, and MD5, among which MD5 is the most widely known and generates a 128-bit (16-byte) hash value. In terms of security: MD5 > MD4 > MD2. Beyond these, there are algorithms improved from MD4 or MD5, such as RIPEMD and HAVAL.

Even the strongest MD variant, MD5, is vulnerable to being broken: attackers can use brute-force attacks or rainbow table attacks to find inputs matching a target hash value and crack the data.

To increase the difficulty of cracking, salting is commonly used. In cryptography, a **Salt** refers to inserting a specific string into the password (or combining it with the password) so that the resulting hash differs from the hash of the raw password alone—a process called "salting".

Does salting alone make it completely secure? Not necessarily—it only increases cracking difficulty, not impossibility. Moreover, the MD5 algorithm itself suffers from collision weaknesses, where multiple distinct inputs produce the same MD5 hash.

Therefore, MD algorithms are no longer recommended; safer hash algorithms such as SHA-2 or Bcrypt should be used instead.

Java provides built-in support for the MD family, including MD2 and MD5.

MD5 code example (unsalted):

```java
String originalString = "Java学习 + 面试指南：javaguide.cn";
// Create MD5 digest object
MessageDigest messageDigest = MessageDigest.getInstance("MD5");
messageDigest.update(originalString.getBytes(StandardCharsets.UTF_8));
// Compute hash value
byte[] result = messageDigest.digest();
// Convert hash value to hexadecimal string
String hexString = new HexBinaryAdapter().marshal(result);
System.out.println("Original String: " + originalString);
System.out.println("MD5 Hash: " + hexString.toLowerCase());
```

Output:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
MD5 Hash: fb246796f5b1b60d4d0268c817c608fa
```

### SHA

The SHA (Secure Hash Algorithm) family is a group of cryptographic hash algorithms designed to map data of arbitrary length to a fixed-length hash value. Designed by the U.S. National Security Agency (NSA) in 1993, the SHA family currently includes three major versions: SHA-1, SHA-2, and SHA-3.

The SHA-1 algorithm maps data of arbitrary length to a 160-bit hash value. However, SHA-1 has serious flaws such as low security and vulnerability to collision attacks and length-extension attacks. Consequently, SHA-1 is no longer recommended. The SHA-2 family (such as SHA-256, SHA-384, SHA-512) and the SHA-3 family serve as replacements for SHA-1, both offering higher security and longer hash outputs.

The SHA-2 family was built upon improvements to SHA-1, adopting more complex operations and more rounds so attackers find it far harder to discover collisions through precomputation or coincidence.

To find an even safer and more advanced cryptographic hash algorithm, the U.S. National Institute of Standards and Technology (NIST) opened a public competition in 2007 for SHA-3 candidates. NIST received 64 algorithm submissions in total, and after multiple rounds of evaluation and selection, announced in 2012 that the Keccak algorithm won and became the SHA-3 standard (SHA-3 is not directly derived from SHA-2). Keccak adopts a design completely different from MD and SHA-1/2—namely the **Sponge Construction**—making traditional attack techniques inapplicable to SHA-3 (allowing it to resist all currently known attack vectors including collision attacks, length-extension attacks, differential attacks, etc.).

Because no major security vulnerabilities have been found in SHA-2 and it runs faster in software, most developers still prefer using SHA-2 algorithms.

Compared with MD5, SHA-2 is stronger mainly for two reasons:

- **Longer hash length:** For example, SHA-256 produces a 256-bit hash whereas MD5 produces a 128-bit hash, increasing the difficulty of brute-force and rainbow table attacks.
- **Stronger collision resistance:** SHA uses more complex mathematical operations and more rounds, making it vastly harder for attackers to find collisions via precomputation or chance. To date, no two distinct inputs have been found to share the same SHA-256 hash.

Of course, SHA-2 is not unconditionally invincible—raw hashes are still vulnerable to brute-force or rainbow table attacks, so salting remains essential in real-world password applications (and dedicated slow password hashing algorithms are preferred).

Java provides support for the SHA family, including SHA-1, SHA-256, SHA-384, and SHA-512.

SHA-256 code example (unsalted):

```java
String originalString = "Java学习 + 面试指南：javaguide.cn";
// Create SHA-256 digest object
MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
messageDigest.update(originalString.getBytes());
// Compute hash value
byte[] result = messageDigest.digest();
// Convert hash value to hexadecimal string
String hexString = new HexBinaryAdapter().marshal(result);
System.out.println("Original String: " + originalString);
System.out.println("SHA-256 Hash: " + hexString.toLowerCase());
```

Output:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
SHA-256 Hash: 184eb7e1d7fb002444098c9bde3403c6f6722c93ecfac242c0e35cd9ed3b41cd
```

### Bcrypt

Bcrypt is a password hashing algorithm based on the Blowfish cipher, specifically designed for password hashing with high security.

Because Bcrypt incorporates both **salt** and **cost** mechanisms, it effectively protects against rainbow table attacks and brute-force attacks, safeguarding password security. `salt` is a randomly generated string mixed with the password to increase password complexity and uniqueness. `cost` is a numeric parameter controlling the iteration count of Bcrypt, increasing the computation time and resource consumption required to compute the hash.

Bcrypt allows adjusting encryption complexity according to real-world conditions by configuring different `cost` and `salt` values to meet varying security requirements, offering great flexibility.

Spring Security, the security framework for Java applications, supports multiple password encoders, among which `BCryptPasswordEncoder` is officially recommended; it uses the BCrypt algorithm to hash and store user passwords.

```java
@Bean
public PasswordEncoder passwordEncoder(){
    return new BCryptPasswordEncoder();
}
```

## Symmetric Encryption

Symmetric encryption algorithms use the exact same key for both encryption and decryption; they are also called shared-key encryption algorithms.

![Symmetric Encryption](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/symmetric-encryption-df895fe5.png)

Common symmetric encryption algorithms include DES, 3DES, AES, etc.

### DES and 3DES

DES (Data Encryption Standard) uses a 64-bit key (with an effective key length of 56 bits and 8 parity check bits) and 64-bit plaintext blocks for encryption.

Although DES only encrypts 64 bits at a time, by splitting plaintext into 64-bit blocks we can encrypt plaintext of arbitrary length. If the plaintext length is not a multiple of 64 bits, padding must be applied; common padding modes include `PKCS5Padding`, `PKCS7Padding`, and `NOPADDING`.

The basic idea of DES is to split each 64-bit plaintext block into two halves, apply multiple rounds of transformations to each half, and then merge them back into a 64-bit ciphertext block. These transformations include permutations, XOR operations, substitutions/selections, shifts, and so on. Each round uses a subkey derived from the same 56-bit master key. DES performs 16 rounds of transformations in total, followed by a final inverse permutation to yield the final ciphertext.

![DES (Data Encryption Standard)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/des-steps-e5333574.jpg)

Although classic, DES has a glaring flaw: its 56-bit effective key provides insufficient security and has long been proven crackable in a short amount of time.

To improve the security of DES, variants and alternatives were proposed, such as **3DES (Triple DES)**.

3DES (Triple DES) is a transitional encryption algorithm bridging DES to AES; it applies DES encryption three times using 2 or 3 56-bit keys. 3DES is essentially a symmetric encryption algorithm that applies DES three times to each data block.

To remain backward-compatible with standard DES, 3DES does not simply perform `Encrypt -> Encrypt -> Encrypt`; instead, it adopts `Encrypt -> Decrypt -> Encrypt`. When all three keys are identical, the first two steps cancel each other out, effectively performing a single encryption—thus maintaining compatibility with standard DES. 3DES is more secure than DES, though its processing speed is relatively slow.

### AES

AES (Advanced Encryption Standard) is a more advanced symmetric-key encryption algorithm that uses 128-bit, 192-bit, or 256-bit keys to encrypt and decrypt data; the longer the key, the higher the security.

AES is also a block cipher, with a fixed block size of 128 bits—meaning each block is 16 bytes. AES supports multiple modes of operation, such as ECB, CBC, OFB, CFB, CTR, XTS, OCB, and GCM (currently the most widely used mode). Different modes have different parameters and encryption workflows, though the underlying core remains the AES cipher.

Like DES, several AES modes require padding if the plaintext is not a multiple of 128 bits. However, **GCM** is an Authenticated Encryption with Associated Data (AEAD) mode built on top of a block cipher and can handle plaintext of arbitrary length; therefore, in Java, `AES/GCM/NoPadding` is typically used. GCM provides confidentiality while also verifying ciphertext integrity, but requires that the IV (Nonce) never be reused under the same key.

AES is both faster and more secure than 3DES.

![AES (Advanced Encryption Standard)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/aes-steps-5ddaa529.jpg)

A simple comparison between DES and AES (image source: [RSA vs. AES Encryption: Key Differences Explained](https://cheapsslweb.com/blog/rsa-vs-aes-encryption)):

![Comparison of DES and AES](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/des-vs-aes-68672629.png)

Here is a Java code example implementing AES-GCM. The example encodes a freshly randomized IV together with the ciphertext on each encryption; in production, AES keys should be generated and stored by a KMS, HSM, or KeyStore, and must never be hardcoded in source code:

```java
private static final String AES_TRANSFORMATION = "AES/GCM/NoPadding";
private static final int GCM_IV_LENGTH = 12;
private static final int GCM_TAG_LENGTH = 128;
private static final SecureRandom SECURE_RANDOM = new SecureRandom();

/**
 * Encrypt
 */
public static String encrypt(String data, SecretKey secretKey) throws GeneralSecurityException {
    byte[] iv = new byte[GCM_IV_LENGTH];
    SECURE_RANDOM.nextBytes(iv);

    Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
    cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
    byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

    // The IV does not need to be secret, but the same IV must be used for decryption, so store it alongside the ciphertext.
    ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedBytes.length);
    byteBuffer.put(iv);
    byteBuffer.put(encryptedBytes);
    return Base64.getEncoder().encodeToString(byteBuffer.array());
}

/**
 * Decrypt
 */
public static String decrypt(String encryptedData, SecretKey secretKey) throws GeneralSecurityException {
    byte[] input = Base64.getDecoder().decode(encryptedData);
    int tagLengthInBytes = GCM_TAG_LENGTH / Byte.SIZE;
    if (input.length < GCM_IV_LENGTH + tagLengthInBytes) {
        throw new IllegalArgumentException("Invalid encrypted data");
    }

    ByteBuffer byteBuffer = ByteBuffer.wrap(input);
    byte[] iv = new byte[GCM_IV_LENGTH];
    byteBuffer.get(iv);
    byte[] encryptedBytes = new byte[byteBuffer.remaining()];
    byteBuffer.get(encryptedBytes);

    Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
    cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
    byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
    return new String(decryptedBytes, StandardCharsets.UTF_8);
}

public static void main(String[] args) throws Exception {
    // For demonstration only. In production, retrieve keys from a KMS, HSM, or KeyStore.
    KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
    keyGenerator.init(256);
    SecretKey secretKey = keyGenerator.generateKey();

    String originalString = "Java学习 + 面试指南：javaguide.cn";
    String encryptedData = encrypt(originalString, secretKey);
    String decryptedData = decrypt(encryptedData, secretKey);
    System.out.println("Original String: " + originalString);
    System.out.println("AES Encrypted Data : " + encryptedData);
    System.out.println("AES Decrypted Data : " + decryptedData);
}
```

Output:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
AES Encrypted Data : <A different Base64 string on each run>
AES Decrypted Data : Java学习 + 面试指南：javaguide.cn
```

## Asymmetric Encryption

Asymmetric encryption algorithms use different keys for encryption and decryption; they are also known as public-key cryptography. These two keys are distinct—one is called the **public key** and the other is called the **private key**. The public key can be shared openly with anyone, while the private key must be kept strictly secret.

Data encrypted with a public key can only be decrypted with the corresponding private key. Digital signatures are a distinct operation: the sender generates a signature using their private key, and the recipient verifies that signature using the sender's public key. Do not oversimplify digital signatures as "encrypting with the private key and decrypting with the public key"—real-world projects should use separate encryption APIs and signature APIs.

![Asymmetric Encryption](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/asymmetric-encryption-06d2eb93.png)

Common public-key cryptographic algorithms include RSA and elliptic-curve-based algorithms. Their specific capabilities differ: RSA can be used for both encryption and signing; DSA can only be used for signing; and ECC is an umbrella term covering distinct schemes used for signing or key agreement.

### RSA

RSA (Rivest–Shamir–Adleman algorithm) is an asymmetric encryption algorithm based on the computational hardness of integer factorization. It requires choosing two large prime numbers as part of the private key and computing their product as part of the public key (finding two large prime numbers is relatively easy, whereas factoring their product back into primes is extraordinarily difficult). For a detailed walkthrough of RSA's mathematical principles, refer to: [Do You Truly Understand the RSA Encryption Algorithm? - Xiaofuge](https://www.cnblogs.com/xiaofuge/p/16954187.html).

The security of RSA relies on the difficulty of factoring large numbers. Since 512-bit and 768-bit RSA public keys have already been successfully factored, a key length of **2048 bits or higher** is recommended.

RSA's advantage is its ease of use and support for both data encryption and digital signatures; its disadvantage is slow computation speed, making it unsuitable for encrypting large volumes of data.

RSA is currently one of the most widely used asymmetric encryption algorithms, employed in protocols such as SSL/TLS and SSH.

![SHA-256 with RSA Encryption in HTTPS Certificate Signature Algorithm](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/https-rsa-sha-256-416a3f76.png)

Because RSA is computationally slow and has a strict limit on the data size it can process directly, real-world projects typically use **hybrid encryption**: randomly generate a symmetric key, encrypt the business data with AES-GCM, and then encrypt the symmetric key with RSA-OAEP. The example below demonstrates only how to encrypt relatively short data using RSA-OAEP:

```java
private static final String RSA_ALGORITHM = "RSA";
private static final String RSA_TRANSFORMATION = "RSA/ECB/OAEPPadding";
private static final OAEPParameterSpec OAEP_SHA_256 = new OAEPParameterSpec(
        "SHA-256",
        "MGF1",
        MGF1ParameterSpec.SHA256,
        PSource.PSpecified.DEFAULT
);

/**
 * Generate RSA key pair
 */
public static KeyPair generateKeyPair() throws NoSuchAlgorithmException {
    KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA_ALGORITHM);
    // Key size is 2048 bits
    keyPairGenerator.initialize(2048);
    return keyPairGenerator.generateKeyPair();
}

/**
 * Encrypt data using public key
 */
public static String encrypt(String data, PublicKey publicKey) throws Exception {
    Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
    cipher.init(Cipher.ENCRYPT_MODE, publicKey, OAEP_SHA_256);
    byte[] encryptedData = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(encryptedData);
}

/**
 * Decrypt data using private key
 */
public static String decrypt(String encryptedData, PrivateKey privateKey) throws Exception {
    byte[] decodedData = Base64.getDecoder().decode(encryptedData);
    Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
    cipher.init(Cipher.DECRYPT_MODE, privateKey, OAEP_SHA_256);
    byte[] decryptedData = cipher.doFinal(decodedData);
    return new String(decryptedData, StandardCharsets.UTF_8);
}

public static void main(String[] args) throws Exception {
    KeyPair keyPair = generateKeyPair();
    PublicKey publicKey = keyPair.getPublic();
    PrivateKey privateKey = keyPair.getPrivate();
    String originalString = "Java学习 + 面试指南：javaguide.cn";
    String encryptedData = encrypt(originalString, publicKey);
    String decryptedData = decrypt(encryptedData, privateKey);
    System.out.println("Original String: " + originalString);
    System.out.println("RSA Encrypted Data : " + encryptedData);
    System.out.println("RSA Decrypted Data : " + decryptedData);
}
```

Output:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
RSA Encrypted Data : <A different Base64 string on each run>
RSA Decrypted Data : Java学习 + 面试指南：javaguide.cn
```

### DSA

DSA (Digital Signature Algorithm) is a digital signature algorithm whose security is based on the discrete logarithm problem. It can only be used to generate and verify digital signatures, **not** for data encryption. Moreover, digital signing is not "encrypting a digest with the private key and decrypting it with the public key": the sender generates a signature using the private key and the signing algorithm, and the recipient determines whether the signature is valid using the public key and the verification algorithm.

DSA is mainly used for compatibility with legacy systems. **NIST FIPS 186-5** no longer approves DSA for generating new digital signatures, permitting it only for verifying legacy signatures generated prior to the standard's implementation. New systems should generally choose **RSA-PSS**, **ECDSA**, or **EdDSA** based on protocol and compatibility requirements, and use the `Signature` API provided by mature cryptographic libraries.

## Summary

This article introduced three categories of cryptographic algorithms: hash algorithms, symmetric encryption algorithms, and asymmetric encryption algorithms.

- **Hash algorithms** mathematically map data to a fixed-length unique identifier and are used to verify data integrity and consistency. Common hash algorithms include MD, SHA, MAC, etc.
- **Symmetric encryption algorithms** use the same key for both encryption and decryption and are used to protect data security and confidentiality. Common symmetric encryption algorithms include DES, 3DES, AES, etc.
- **Public-key cryptography** uses paired public and private keys to support encryption, digital signatures, or key agreement, depending on the specific algorithm. For example, RSA can be used for both encryption and signing, whereas DSA can only be used for signing.

## References

- NIST SP 800-38D - Recommendation for Block Cipher Modes of Operation: GCM and GMAC: <https://csrc.nist.gov/pubs/sp/800/38/d/final>
- NIST FIPS 186-5 - Digital Signature Standard: <https://csrc.nist.gov/pubs/fips/186-5/final>
- Java `Cipher` API: <https://docs.oracle.com/en/java/javase/11/docs/api/java.base/javax/crypto/Cipher.html>
- Deep Dive into Perfect Hashing - Tencent Tech Engineering: <https://mp.weixin.qq.com/s/M8Wcj8sZ7UF1CMr887Puog>
- Practical Cryptography for Developers (Part 2) — Hash Functions: <https://thiscute.world/posts/practical-cryptography-basics-2-hash/>
- A Magical Security Journey into the DSA Algorithm: <https://zhuanlan.zhihu.com/p/347025157>
- Introduction to AES-GCM Encryption: <https://juejin.cn/post/6844904122676690951>
- Java AES 256 GCM Encryption and Decryption Example | JCE Unlimited Strength: <https://www.javainterviewpoint.com/java-aes-256-gcm-encryption-and-decryption/>
