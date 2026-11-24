---
title: Java Serialization Explained
description: "An in-depth analysis of Java serialization and deserialization mechanisms: explaining the Serializable interface, the transient keyword, the role of serialVersionUID, serialization protocol selection, and use cases such as RPC and caching."
category: Java
tag:
  - Java Fundamentals
lang: en
sourceRef: zh-ref/java/basis/serialization.md
head:
  - - meta
    - name: keywords
      content: Java serialization,deserialization,Serializable interface,transient keyword,serialVersionUID,serialization protocols,object persistence
---

## What Are Serialization and Deserialization?

Whenever we need to persist Java objects—for example, saving Java objects to a file—or transmit Java objects over a network, serialization is required.

Simply put:

- **Serialization**: Converting a data structure or object into a format suitable for storage or transmission, typically a binary byte stream, though text formats such as JSON or XML are also used.
- **Deserialization**: The process of converting the data generated during serialization back into the original data structure or object.

For an object-oriented programming language like Java, what we serialize are objects—that is, instantiated classes (`Class`). By contrast, in a hybrid/semi-object-oriented language like C++, a `struct` defines a data structure type, whereas a `class` corresponds to an object type.

Below are common use cases for serialization and deserialization:

- Before an object is transmitted over the network (such as during a Remote Procedure Call, RPC), it must be serialized; after receiving the serialized object, the receiver must deserialize it.
- Before storing an object into a file, it must be serialized; when reading the object back from the file, it must be deserialized.
- Before storing an object in a database (such as Redis), serialization is required; when reading the object back from the cache database, deserialization is required.
- Serialization is typically needed when converting an object into a byte representation for long-term persistence or cross-component transfer; ordinary Java objects used solely within JVM memory do not need to be serialized.

Wikipedia describes serialization as follows:

> In computing, **serialization** is the process of translating a data structure or object state into a format that can be stored (for example, in a file or memory data buffer) or transmitted (for example, over a computer network) and reconstructed later (possibly in a different computer environment). When the resulting series of bits is reread according to the serialization format, it can be used to create a semantically identical clone of the original object. For many complex objects, such as those that make extensive use of references, this process is not straightforward. Serialization of object-oriented objects does not include any of their associated methods with which they were previously linked. This process of serializing an object is also called marshalling an object in some situations. The opposite operation, extracting a data structure from a series of bytes, is deserialization (also called unserialization or unmarshalling).

In summary: **the primary purpose of serialization is to convert objects into a representation suitable for network transmission or persistence in filesystems, databases, caches, and other storage media.**

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/a478c74d-2c48-40ae-9374-87aacf05188c-92692fb2.png)

<p style="text-align:right;font-size:13px;color:gray">https://www.corejavaguru.com/java/serialization/interview-questions-1</p>

**Which layer of the TCP/IP 4-layer model do serialization protocols correspond to?**

We know that both parties in network communication must adopt and abide by the same protocol. The TCP/IP 4-layer model consists of the following layers—which layer does a serialization protocol belong to?

1. Application Layer
2. Transport Layer
3. Internet (Network) Layer
4. Network Interface (Link) Layer

![TCP/IP 4-Layer Model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

As shown in the diagram above, in the OSI 7-layer protocol model, the Presentation Layer's main responsibility is processing user data from the Application Layer and converting it into a binary stream—and conversely, converting a binary stream back into Application Layer user data. Doesn't that correspond directly to serialization and deserialization?

Because the Application Layer, Presentation Layer, and Session Layer of the OSI 7-layer model all correspond to the Application Layer in the TCP/IP 4-layer model, serialization protocols belong to the Application Layer of the TCP/IP protocol suite.

## What Are the Common Serialization Protocols?

Java's built-in JDK serialization mechanism is generally avoided because of low serialization efficiency and security vulnerabilities. More commonly used serialization protocols include Hessian, Kryo, Protobuf, and ProtoStuff, all of which are binary-based serialization protocols.

Formats such as JSON and XML belong to text-based serialization. Although they offer good human readability, their performance is relatively poor, so they are generally not chosen for high-performance RPC serialization.

### JDK Built-in Serialization

To use JDK's built-in serialization, a class simply implements the `java.io.Serializable` interface.

```java
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Builder
@ToString
public class RpcRequest implements Serializable {
    private static final long serialVersionUID = 1905122041950251207L;
    private String requestId;
    private String interfaceName;
    private String methodName;
    private Object[] parameters;
    private Class<?>[] paramTypes;
    private RpcMessageTypeEnum rpcMessageTypeEnum;
}
```

**What is the role of `serialVersionUID`?**

The serialization identifier `serialVersionUID` serves for version control. During deserialization, the runtime checks whether the `serialVersionUID` in the byte stream matches the `serialVersionUID` of the current class; if they do not match, an `InvalidClassException` is thrown. It is strongly recommended to manually declare `serialVersionUID` in every serializable class. If it is not explicitly declared, the serialization runtime computes a default value based on the class's structure rather than having the compiler generate a field.

**Isn't `serialVersionUID` modified with `static`? Why is it still "serialized"?**

~~Variables modified with `static` are static variables located in the Method Area and are not serialized themselves. `static` variables belong to the class rather than to any object. After deserialization, it only looks as though the `static` variable's value was restored onto the object by default—seeing it as serialized is merely an illusion.~~

**🐛 Correction (see: [issue#2174](https://github.com/Snailclimb/JavaGuide/issues/2174)):**

Under normal circumstances, `static` variables belong to the class rather than to any individual object instance, so they are not included in the serialized object data stream. Serialization saves an object's state (that is, the values of its instance variables). However, `serialVersionUID` is a special exception—its handling during serialization is specially treated. The key point is that `serialVersionUID` is not serialized as part of the object's state; instead, it is used by the serialization mechanism itself as a special "fingerprint" or "version number".

When an object is serialized, `serialVersionUID` is written into the serialized binary stream (effectively saving a version identifier rather than saving the state of a `static` variable itself); during deserialization, it is also parsed and checked for equality to verify version compatibility of the serialized object. If the two do not match, the deserialization process throws an `InvalidClassException`, because this usually means the definition of the serialized class has changed and may no longer be compatible.

The official specification states:

> A serializable class can declare its own serialVersionUID explicitly by declaring a field named `"serialVersionUID"` that must be `static`, `final`, and of type `long`;
>
> If you want to explicitly specify `serialVersionUID`, you must declare a `long` field modified with `static` and `final` inside the class, and the variable name must be `"serialVersionUID"`.

In other words, `serialVersionUID` itself (as a `static` variable) is indeed not serialized as object state. However, its value is given special treatment by Java's serialization mechanism—it is written to and read from the serialization stream as a version identifier used to verify version compatibility during deserialization.

**What if there are certain fields we do not want to serialize?**

For variables that you do not want to serialize, you can mark them with the `transient` keyword.

The role of the `transient` keyword is to prevent instance variables modified by this keyword from being serialized; when the object is deserialized, the values of fields marked with `transient` are not persisted or restored.

A few additional notes about `transient`:

- `transient` can only modify variables; it cannot modify classes or methods.
- After deserialization, a variable modified with `transient` is reset to the default value of its type. For example, if it modifies an `int` field, the value after deserialization will be `0`.
- Because `static` variables do not belong to any object (`Object`), they will never be serialized regardless of whether they are modified with `transient`.

**Why is JDK's built-in serialization not recommended?**

We rarely or almost never use JDK's built-in serialization directly, mainly for the following reasons:

- **No cross-language support**: It cannot be used when calling services developed in other programming languages.
- **Poor performance**: Compared with other serialization frameworks, its performance is much lower, primarily because the serialized byte arrays are relatively large, increasing network transmission overhead.
- **Security vulnerabilities**: Serialization and deserialization themselves are not inherently flawed, but when the input data to be deserialized can be controlled by a user, an attacker can craft malicious payloads that cause deserialization to instantiate unexpected objects and execute arbitrary crafted code during the process. Related reading: [Application Security: The Tragedy of Java Deserialization Vulnerabilities - Cryin](https://cryin.github.io/blog/secure-development-java-deserialization-vulnerability/), [What Is Behind Java Deserialization Security Vulnerabilities? - Monica](https://www.zhihu.com/question/37562657/answer/1916596031).

### Kryo

Kryo is a high-performance serialization/deserialization library. Thanks to its variable-length encoding and bytecode generation mechanism, it achieves high runtime speed and compact serialized byte sizes.

Moreover, Kryo is a very mature serialization implementation and is widely used at Twitter, Groupon, Yahoo, and in well-known open-source projects such as Hive and Storm.

[guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) uses Kryo for serialization. The serialization and deserialization code is as follows:

```java
/**
 * Kryo serialization class, Kryo serialization efficiency is very high, but only compatible with Java language
 *
 * @author shuang.kou
 * @createTime 2020-05-13 19:29:00
 */
@Slf4j
public class KryoSerializer implements Serializer {

    /**
     * Because Kryo is not thread safe. So, use ThreadLocal to store Kryo objects
     */
    private final ThreadLocal<Kryo> kryoThreadLocal = ThreadLocal.withInitial(() -> {
        Kryo kryo = new Kryo();
        kryo.register(RpcResponse.class);
        kryo.register(RpcRequest.class);
        return kryo;
    });

    @Override
    public byte[] serialize(Object obj) {
        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             Output output = new Output(byteArrayOutputStream)) {
            Kryo kryo = kryoThreadLocal.get();
            // Object->byte: Serialize the object into a byte array
            kryo.writeObject(output, obj);
            kryoThreadLocal.remove();
            return output.toBytes();
        } catch (Exception e) {
            throw new SerializeException("Serialization failed");
        }
    }

    @Override
    public <T> T deserialize(byte[] bytes, Class<T> clazz) {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);
             Input input = new Input(byteArrayInputStream)) {
            Kryo kryo = kryoThreadLocal.get();
            // byte->Object: Deserialize the object from the byte array
            Object o = kryo.readObject(input, clazz);
            kryoThreadLocal.remove();
            return clazz.cast(o);
        } catch (Exception e) {
            throw new SerializeException("Deserialization failed");
        }
    }

}
```

GitHub repository: [https://github.com/EsotericSoftware/kryo](https://github.com/EsotericSoftware/kryo).

### Protobuf

Protobuf comes from Google. It offers strong performance, supports multiple languages, and is cross-platform. However, it is somewhat cumbersome to use because you have to define IDL files yourself and generate the corresponding serialization code. While that makes it less flexible, on the upside it also avoids the risk of deserialization vulnerabilities in Protobuf.

> Protobuf consists of a serialization format definition, libraries for various languages, and an IDL compiler. Normally, you need to define `.proto` files and then use the IDL compiler to compile them into your target language.

A simple `.proto` file looks like this:

```protobuf
// Protobuf version
syntax = "proto3";
// SearchRequest will be compiled into corresponding objects in different programming languages, such as a class in Java or a struct in Go
message Person {
  // string type field
  string name = 1;
  // int type field
  int32 age = 2;
}
```

GitHub repository: [https://github.com/protocolbuffers/protobuf](https://github.com/protocolbuffers/protobuf).

### ProtoStuff

Because Protobuf is relatively cumbersome to use, its brother Protostuff was born.

Protostuff is built on top of Google Protobuf, while providing more features and simpler usage. Being easier to use does not mean ProtoStuff has inferior performance.

GitHub repository: [https://github.com/protostuff/protostuff](https://github.com/protostuff/protostuff).

### Hessian

Hessian is a lightweight, self-describing binary RPC protocol. Hessian is an older serialization implementation, and it is also cross-language.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/8613ec4c-bde5-47bf-897e-99e0f90b9fa3-b63315b5.png)

The default serialization format enabled in Dubbo 2.x is Hessian2—though Dubbo modified Hessian2, its overall structure remains largely similar.

### Summary

Kryo is tailored specifically for Java and offers outstanding performance; if your application is strictly Java-only, you can consider using it—an article on Dubbo's official website also explicitly recommends using Kryo as the serialization method in production environments (article URL: <https://cn.dubbo.apache.org/zh-cn/docsv2.7/user/serialization/>).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/569e541a-22b2-4846-aa07-0ad479f07440-20230814090-66ad225f.png)

Protocols such as Protobuf, ProtoStuff, and Hessian are all cross-language serialization solutions and are worth considering when cross-language interoperability is required.

Beyond the serialization options introduced above, there are also alternatives such as Thrift and Avro.
