---
title: Data Desensitization Solutions Summary
description: Detailed guide to data desensitization solutions, covering masking rules for sensitive data such as phone numbers, ID cards, and bank cards, along with Hutool implementation methods.
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: Data Desensitization,Privacy Protection,Phone Number Masking,ID Card Masking,Masking Rules,Sensitive Data,Test Data,Compliance
lang: en
sourceRef: zh-ref/system-design/security/data-desensitization.md
---


> This article is adapted and expanded from [Hutool: Data Desensitization in One Line of Code - JD Cloud Developer](https://mp.weixin.qq.com/s/1qFWczesU50ndPPLtABHFg).

## What Is Data Desensitization

### Definition of Data Desensitization

Baidu Baike defines data desensitization as follows:

> Data desensitization refers to transforming certain sensitive information according to desensitization rules to achieve reliable protection of sensitive and private data. This allows desensitized real datasets to be safely used in development, testing, other non-production environments, and outsourcing environments. When dealing with customer security data or commercially sensitive data, real data is transformed without violating system rules and provided for testing—personal information such as ID card numbers, mobile phone numbers, card numbers, and customer numbers all require data desensitization. It is one of the key database security technologies.

In short, data desensitization is the transformation of certain sensitive information through desensitization rules to reliably protect sensitive private data.

During data desensitization, different algorithms and techniques are typically applied depending on specific requirements and scenarios. For example, for ID card numbers, a masking algorithm can preserve the first few digits while replacing the remaining characters with `"X"` or `"\*"`; for personal names, a pseudonymization algorithm can replace real names with randomly generated pseudonyms.

### Common Desensitization Rules

Common desensitization rules exist to protect the security of sensitive data by transforming or modifying it during processing and storage.

Below are several common desensitization rules:

- **Substitution (commonly used)**: Replaces specific characters or character sequences in sensitive data with other characters. For example, replacing the middle digits of a credit card number with asterisks (`\*`) or other characters.
- **Deletion**: Randomly removes part of the content in sensitive data. For example, deleting 3 random digits from a phone number.
- **Shuffling**: Scrambles the order of certain characters or fields in the original data. For example, swapping random digit positions in an ID card number.
- **Noise Addition**: Injects slight errors or noise into the data to achieve desensitization. For example, adding randomly generated characters into sensitive data.
- **Encryption or Tokenization (commonly used)**: When the original plaintext needs to be recovered, use an encryption algorithm with integrity protection; when plaintext recovery is not needed, choose truncation, tokenization, or HMAC with an independent secret key depending on the use case. Hash functions such as MD5 and SHA-256 are not encryption algorithms, and applying unsalted/unkeyed hashing directly to structured data like bank card numbers can still be vulnerable to enumeration attacks. For a summary of common encryption algorithms, refer to this article: <https://javaguide.cn/system-design/security/encryption-algorithms.html>.
- ...

## Common Desensitization Tools

### Hutool

Hutool is a Java utility library that wraps JDK methods for files, streams, encryption/decryption, encoding conversion, regular expressions, threads, XML, and more into various `Util` classes, while providing the following modules:

|       Module       |                                                  Description                                                   |
| :----------------: | :------------------------------------------------------------------------------------------------------------: |
|     hutool-aop     |                 JDK dynamic proxy wrapper providing AOP support without an IoC container                       |
| hutool-bloomFilter |                 Bloom filtering, providing Bloom filter implementations with various hash algorithms          |
|    hutool-cache    |                                           Simple cache implementation                                          |
|    hutool-core     |                          Core module, including Bean operations, dates, various Utils, etc.                    |
|    hutool-cron     |                      Scheduled task module, providing Crontab-like scheduled tasks                             |
|   hutool-crypto    |      Encryption and decryption module, wrapping symmetric, asymmetric, and digest algorithms                   |
|     hutool-db      |                     JDBC-wrapped data operations based on the ActiveRecord pattern                             |
|     hutool-dfa     |                         Multi-keyword search based on the DFA model                                            |
|    hutool-extra    | Extension module wrapping third-party tools (template engines, email, Servlet, QR codes, Emoji, FTP, tokenization, etc.) |
|    hutool-http     |                           HTTP client wrapper based on `HttpUrlConnection`                                     |
|     hutool-log     |                          Logging facade that automatically detects logging implementations                     |
|   hutool-script    |                             Script execution wrapper, such as JavaScript                                       |
|   hutool-setting   |                     Enhanced `Setting` configuration file and `Properties` wrapper                             |
|   hutool-system    |                         System parameter invocation wrapper (JVM info, etc.)                                   |
|    hutool-json     |                                             JSON implementation                                                |
|   hutool-captcha   |                                         Image CAPTCHA implementation                                           |
|     hutool-poi     |                              Wrapper for Excel and Word in Apache POI                                          |
|   hutool-socket    |                           Socket wrapper based on Java NIO and AIO                                             |
|     hutool-jwt     |                                 JSON Web Token (JWT) wrapper implementation                                    |

You can import individual modules as needed, or import all modules via `hutool-all`. The data desensitization utility used in this article resides in the `hutool.core` module.

Currently, the latest version of Hutool supports the following desensitized data types, covering most common sensitive information:

1. User ID
2. Chinese name
3. ID card number
4. Landline phone number
5. Mobile phone number
6. Address
7. Email
8. Password
9. Mainland China license plate, including regular vehicles and new-energy vehicles
10. Bank card

#### One-Line Desensitization

The desensitization methods provided by Hutool are shown in the figure below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/2023-08-01-10-2119fnVCIDozqHgRGx-5cdbf751.png)

Note: Hutool performs desensitization by replacing sensitive information with `*`, implemented specifically in the `StrUtil.hide` method. If you want to customize the masking symbol, you can copy Hutool's source code and re-implement it accordingly.

Taking mobile phone numbers, bank card numbers, ID card numbers, and passwords as examples, below is the corresponding test code:

```java
import cn.hutool.core.util.DesensitizedUtil;
import org.junit.Test;
import org.springframework.boot.test.context.Spring BootTest;

/**
 *
 * @description: Data desensitization implemented with Hutool
 */
@Spring BootTest
public class HuToolDesensitizationTest {

    @Test
    public void testPhoneDesensitization(){
        String phone="13723231234";
        System.out.println(DesensitizedUtil.mobilePhone(phone)); // Output: 137****1234
    }
    @Test
    public void testBankCardDesensitization(){
        String bankCard="6217000130008255666";
        System.out.println(DesensitizedUtil.bankCard(bankCard)); // Output: 6217 **** **** *** 5666
    }

    @Test
    public void testIdCardNumDesensitization(){
        String idCardNum="411021199901102321";
        // Show only the first 4 and last 2 digits
        System.out.println(DesensitizedUtil.idCardNum(idCardNum,4,2)); // Output: 4110************21
    }
    @Test
    public void testPasswordDesensitization(){
        String password="www.jd.com_35711";
        System.out.println(DesensitizedUtil.password(password)); // Output: ****************
    }
}
```

That is how data desensitization is implemented using Hutool's built-in utility class.

Special note: Passwords do not belong to ordinary fields that "can still be displayed or stored after desensitization." Passwords should be processed as early as possible at the server entry point using a dedicated password hashing algorithm, and must never be stored, returned, or logged in plaintext. `password()` here simply replaces every character of a string with `*` and cannot replace password hashing.

#### Annotation-Based Desensitization with Jackson

Now that we have a data desensitization utility class, if there are many places where the frontend needs to display data, calling the utility class everywhere would make the code overly redundant. How can we accomplish data desensitization elegantly using annotations?

If the project is a Spring Boot web application, we can leverage Jackson—built into Spring Boot—to implement custom serialization. Its underlying principle is to perform desensitization when serializing objects into JSON for rendering to the frontend.

**Step 1: Enumeration of desensitization strategies.**

```java
/**
 * @author
 * @description: Desensitization strategy enum
 */
public enum DesensitizationTypeEnum {
    // Custom
    MY_RULE,
    // User ID
    USER_ID,
    // Chinese name
    CHINESE_NAME,
    // ID card number
    ID_CARD,
    // Landline phone number
    FIXED_PHONE,
    // Mobile phone number
    MOBILE_PHONE,
    // Address
    ADDRESS,
    // Email
    EMAIL,
    // Password
    PASSWORD,
    // Mainland China license plate, including regular and new-energy vehicles
    CAR_LICENSE,
    // Bank card
    BANK_CARD
}
```

The enum above represents the supported desensitization types.

**Step 2: Define a `Desensitization` annotation for desensitization.**

- `@Retention (RetentionPolicy.RUNTIME)`: Effective at runtime.
- `@Target (ElementType.FIELD)`: Applicable to fields.
- `@JacksonAnnotationsInside`: You can click into this annotation to inspect it; it is a meta-annotation primarily used to bundle other annotations together.
- `@JsonSerialize`: As mentioned above, this annotation enables custom serialization. It can be applied to annotations, methods, fields, classes, etc., and takes effect at runtime by executing the overridden methods inside the provided serializer class.

```java
/**
 * @author
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
@JsonSerialize(using = DesensitizationSerialize.class)
public @interface Desensitization {
    /**
     * Desensitization data type; when MY_RULE is used, startInclude and endExclude take effect
     */
    DesensitizationTypeEnum type() default DesensitizationTypeEnum.MY_RULE;

    /**
     * Desensitization start index (inclusive)
     */
    int startInclude() default 0;

    /**
     * Desensitization end index (exclusive)
     */
    int endExclude() default 0;
}
```

Note: The start index and end index only take effect when the custom desensitization enum `MY_RULE` is used.

**Step 3: Create the custom serializer class.**

This step is the key to implementing data desensitization. The custom serializer class extends `JsonSerializer`, implements the `ContextualSerializer` interface, and overrides two methods.

```java
/**
 * @author
 * @description: Custom serializer class
 */
@AllArgsConstructor
@NoArgsConstructor
public class DesensitizationSerialize extends JsonSerializer<String> implements ContextualSerializer {
    private DesensitizationTypeEnum type;

    private Integer startInclude;

    private Integer endExclude;

    @Override
    public void serialize(String str, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
        switch (type) {
            // Custom rule desensitization
            case MY_RULE:
                jsonGenerator.writeString(CharSequenceUtil.hide(str, startInclude, endExclude));
                break;
            // userId desensitization
            case USER_ID:
                jsonGenerator.writeString(String.valueOf(DesensitizedUtil.userId()));
                break;
            // Chinese name desensitization
            case CHINESE_NAME:
                jsonGenerator.writeString(DesensitizedUtil.chineseName(String.valueOf(str)));
                break;
            // ID card desensitization
            case ID_CARD:
                jsonGenerator.writeString(DesensitizedUtil.idCardNum(String.valueOf(str), 1, 2));
                break;
            // Landline phone desensitization
            case FIXED_PHONE:
                jsonGenerator.writeString(DesensitizedUtil.fixedPhone(String.valueOf(str)));
                break;
            // Mobile phone desensitization
            case MOBILE_PHONE:
                jsonGenerator.writeString(DesensitizedUtil.mobilePhone(String.valueOf(str)));
                break;
            // Address desensitization
            case ADDRESS:
                jsonGenerator.writeString(DesensitizedUtil.address(String.valueOf(str), 8));
                break;
            // Email desensitization
            case EMAIL:
                jsonGenerator.writeString(DesensitizedUtil.email(String.valueOf(str)));
                break;
            // Password desensitization
            case PASSWORD:
                jsonGenerator.writeString(DesensitizedUtil.password(String.valueOf(str)));
                break;
            // Chinese license plate desensitization
            case CAR_LICENSE:
                jsonGenerator.writeString(DesensitizedUtil.carLicense(String.valueOf(str)));
                break;
            // Bank card desensitization
            case BANK_CARD:
                jsonGenerator.writeString(DesensitizedUtil.bankCard(String.valueOf(str)));
                break;
            default:
        }

    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider serializerProvider, BeanProperty beanProperty) throws JsonMappingException {
        if (beanProperty != null) {
            // Check whether the data type is String
            if (Objects.equals(beanProperty.getType().getRawClass(), String.class)) {
                // Retrieve the defined annotation
                Desensitization desensitization = beanProperty.getAnnotation(Desensitization.class);
                // If null
                if (desensitization == null) {
                    desensitization = beanProperty.getContextAnnotation(Desensitization.class);
                }
                // If not null
                if (desensitization != null) {
                    // Create and return an instance of the custom serializer with type, start index, and end index from the annotation
                    return new DesensitizationSerialize(desensitization.type(), desensitization.startInclude(),
                            desensitization.endExclude());
                }
            }

            return serializerProvider.findValueSerializer(beanProperty.getType(), beanProperty);
        }
        return serializerProvider.findNullValueSerializer(null);
    }
}
```

After these three steps, annotation-based data desensitization is complete. Let us test it below.

First, define a POJO to test and add the desensitization strategy to the corresponding fields:

```java
/**
 *
 * @description:
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestPojo {

    private String userName;

    @Desensitization(type = DesensitizationTypeEnum.MOBILE_PHONE)
    private String phone;

    @Desensitization(type = DesensitizationTypeEnum.MY_RULE, startInclude = 0, endExclude = 2)
    private String address;
}
```

Next, write a test controller:

```java
@RestController
public class TestController {

    @RequestMapping("/test")
    public TestPojo testDesensitization(){
        TestPojo testPojo = new TestPojo();
        testPojo.setUserName("我是用户名");
        testPojo.setAddress("地球中国-北京市通州区京东总部2号楼");
        testPojo.setPhone("13782946666");
        return testPojo;
    }

}
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/2023-08-02-16-497DdCBy8vbf2D69g-44ed3e62.png)

As shown, we have successfully implemented data desensitization.

### Apache ShardingSphere

ShardingSphere is an ecosystem composed of open-source distributed database middleware solutions, consisting of three independent products: Sharding-JDBC, Sharding-Proxy, and Sharding-Sidecar (planned). They all provide standardized data sharding, distributed transactions, and database governance capabilities.

Apache ShardingSphere includes a data desensitization module that integrates common data desensitization features. Its basic principle is to parse and intercept user-submitted SQL, rewrite the SQL based on the user's desensitization configuration, and thereby encrypt plaintext fields and decrypt encrypted fields. Ultimately, this achieves transparent encrypted storage and querying invisible to the application user.

With Apache ShardingSphere, the data desensitization process can be automated and made transparent, so users do not need to worry about intermediate implementation details. Furthermore, it offers various built-in and third-party (AKS) desensitization strategies that can be used with simple configuration.

Official documentation URL: <https://shardingsphere.apache.org/document/4.1.1/cn/features/orchestration/encrypt/>.

### FastJSON

In daily web development, besides Spring's default serializer, FastJSON is also a very commonly used serialization tool for Spring Web RESTful APIs.

FastJSON mainly supports two approaches to implementing data desensitization:

- **Based on the `@JSONField` annotation**: You need to define a custom serializer class for desensitization, and then specify that custom serializer type via `serializeUsing` inside `@JSONField` on the field to be desensitized.
- **Based on a serialization filter**: You need to implement the `ValueFilter` interface, override the `process` method to perform custom desensitization, and then apply the custom conversion strategy during JSON serialization. For specific implementation details, refer to this article: <https://juejin.cn/post/7067916686141161479>.

### Mybatis-Mate

First, let us introduce the relationship among MyBatis, MyBatis-Plus, and Mybatis-Mate:

- MyBatis is an excellent persistence-layer framework that supports customized SQL, stored procedures, and advanced mapping.
- MyBatis-Plus is an enhancement tool for MyBatis that greatly simplifies persistence-layer development.
- Mybatis-Mate is an enterprise-grade module built for MyBatis-Plus, aimed at processing data more agilely and elegantly. However, an authorization license key (paid) must be configured before use.

Mybatis-Mate supports sensitive data desensitization and comes with 9 built-in common desensitization rules such as mobile phone numbers, emails, and bank card numbers.

```java
@FieldSensitive("testStrategy")
private String username;

@Configuration
public class SensitiveStrategyConfig {

    /**
     * Register desensitization strategy
     */
    @Bean
    public ISensitiveStrategy sensitiveStrategy() {
        // Custom desensitization handling for testStrategy type
        return new SensitiveStrategy().addStrategy("testStrategy", t -> t + "***test***");
    }
}

// Skip desensitization processing, used for edit scenarios
RequestDataTransfer.skipSensitive();
```

### MyBatis-Flex

Similar to MybatisPlus, MyBatis-Flex is also a MyBatis enhancement framework. MyBatis-Flex likewise provides data desensitization features, and it is free to use.

MyBatis-Flex provides the `@ColumnMask()` annotation along with 9 built-in desensitization rules out of the box:

```java
/**
 * Built-in data desensitization methods
 */
public class Masks {
    /**
     * Mobile phone number desensitization
     */
    public static final String MOBILE = "mobile";
    /**
     * Landline phone number desensitization
     */
    public static final String FIXED_PHONE = "fixed_phone";
    /**
     * ID card number desensitization
     */
    public static final String ID_CARD_NUMBER = "id_card_number";
    /**
     * Chinese name desensitization
     */
    public static final String CHINESE_NAME = "chinese_name";
    /**
     * Address desensitization
     */
    public static final String ADDRESS = "address";
    /**
     * Email desensitization
     */
    public static final String EMAIL = "email";
    /**
     * Password desensitization
     */
    public static final String PASSWORD = "password";
    /**
     * License plate number desensitization
     */
    public static final String CAR_LICENSE = "car_license";
    /**
     * Bank card number desensitization
     */
    public static final String BANK_CARD_NUMBER = "bank_card_number";
    //...
}
```

Usage example:

```java
@Table("tb_account")
public class Account {

    @Id(keyType = KeyType.Auto)
    private Long id;

    @ColumnMask(Masks.CHINESE_NAME)
    private String userName;

    @ColumnMask(Masks.EMAIL)
    private String email;

}
```

If these built-in desensitization rules do not meet your requirements, you can also define custom desensitization rules.

1. Register a new desensitization rule via `MaskManager`:

```java
MaskManager.registerMaskProcessor("自定义规则名称"
        , data -> {
            return data;
        })
```

2. Use the custom desensitization rule:

```java
@Table("tb_account")
public class Account {

    @Id(keyType = KeyType.Auto)
    private Long id;

    @ColumnMask("自定义规则名称")
    private String userName;
}
```

Furthermore, for scenarios where desensitization needs to be skipped—such as opening an edit page to modify user data—MyBatis-Flex also provides dedicated support:

1. **`MaskManager#execWithoutMask`** (recommended): Uses the Template Method design pattern to guarantee that desensitization is automatically restored after skipping desensitization and executing the relevant logic.
2. **`MaskManager#skipMask`**: Skips desensitization processing.
3. **`MaskManager#restoreMask`**: Restores desensitization processing, ensuring subsequent operations continue to apply desensitization logic.

The `MaskManager#execWithoutMask` method is implemented as follows:

```java
public static <T> T execWithoutMask(Supplier<T> supplier) {
    try {
        skipMask();
        return supplier.get();
    } finally {
        restoreMask();
    }
}
```

`MaskManager`'s `skipMask` and `restoreMask` methods are generally used in pairs, and the `try{...}finally{...}` pattern is recommended.

## Summary

This article mainly introduced:

- **Definition of data desensitization**: Data desensitization refers to transforming certain sensitive information according to desensitization rules to achieve reliable protection of sensitive private data.
- **Common desensitization rules**: Substitution, deletion, shuffling, noise addition, and encryption.
- **Common desensitization tools**: Hutool, Apache ShardingSphere, FastJSON, Mybatis-Mate, and MyBatis-Flex.

## References

- OWASP Cryptographic Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html>
- PCI SSC FAQ 1492 - PAN masking: <https://www.pcisecuritystandards.org/faqs/1492/>
- Hutool Official Documentation: <https://hutool.cn/docs/#/>
- Talking About How to Customize Data Desensitization: <https://juejin.cn/post/7046567603971719204>
- Implementing Data Desensitization with FastJSON: <https://juejin.cn/post/7067916686141161479>
