---
title: Summary of Java NIO Core Concepts
description: Comprehensive summary of Java NIO core knowledge, detailing the three core components (Channel, Buffer, Selector), non-blocking I/O implementation, zero-copy technology, and performance comparisons with traditional I/O.
category: Java
tag:
  - Java IO
  - Java Fundamentals
head:
  - - meta
    - name: keywords
      content: Java NIO,Channel,Buffer,Selector,Non-blocking I/O,Multiplexing,Zero-Copy,NIO Core Components
lang: en
sourceRef: zh-ref/java/io/nio-basis.md
---

Before learning NIO, you first need to understand the foundational theoretical concepts of computer I/O models. If you are not yet familiar with them, you can refer to my article: [Detailed Explanation of Java I/O Models](https://javaguide.cn/java/io/io-model.html).

## Introduction to NIO

In the traditional Java I/O model (BIO), I/O operations are performed in a blocking manner. That is, when a thread executes an I/O operation, it is blocked until the operation completes. When handling multiple concurrent connections, this blocking model can lead to performance bottlenecks, because a separate thread needs to be created for each connection, and both thread creation and context switching incur overhead.

To solve this problem, Java 1.4 introduced a new I/O model—**NIO** (New IO, also known as Non-blocking IO). NIO addresses the shortcomings of synchronous blocking I/O by providing non-blocking, buffer-oriented, channel-based I/O in standard Java code, allowing a small number of threads to handle multiple connections and greatly improving I/O efficiency and concurrency.

The figure below provides a simple comparison of how BIO, NIO, and AIO handle client requests (for an introduction to AIO, you can check my article [Detailed Explanation of Java I/O Models](https://javaguide.cn/java/io/io-model.html); it is not a primary focus, just good to know).

![Comparison of BIO, NIO, and AIO](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/bio-aio-nio-d63f4d9c.png)

⚠️ Note: Using NIO does not necessarily guarantee high performance; its performance advantages mainly shine in high-concurrency and high-latency network environments. When the number of connections is small, concurrency is low, or network transmission is very fast, NIO does not necessarily outperform traditional BIO.

## NIO Core Components

NIO mainly includes the following three core components:

- **Buffer**: All reading and writing in NIO is performed through buffers. During a read operation, data from a Channel is filled into a Buffer; during a write operation, data in a Buffer is written into a Channel.
- **Channel**: A Channel represents an open connection to an entity such as a file or a socket. Depending on the specific interface, it can support reading, writing, or both simultaneously.
- **Selector**: Allows a single thread to monitor readiness events across multiple selectable channels (`SelectableChannel`), achieving I/O Multiplexing. The Selector is responsible for reporting whether events are ready, not for dispatching worker threads to handle them.

The relationship among the three is illustrated in the figure below (it's okay if you don't understand it yet; it will be explained in detail later):

![Relationship among Buffer, Channel, and Selector](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-buffer-selector-35b44f0d.png)

Let's examine these three components in detail below.

### Buffer

In traditional BIO, data reading and writing are stream-oriented, divided into byte streams and character streams.

In the Java 1.4 NIO library, all data is processed using buffers. This is an important difference between the new library and earlier BIO, somewhat similar to buffered streams in BIO. When NIO reads data, it reads directly into a buffer; when writing data, it writes into a buffer. Whenever NIO reads or writes data, all operations go through a buffer.

The subclasses of `Buffer` are shown below. Among them, the most commonly used is `ByteBuffer`, which can be used to store and manipulate byte data.

![Subclasses of Buffer](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/buffer-subclasses-5a8569f4.png)

You can think of a Buffer as a linear, finite sequence of elements of a specific primitive type. Some Buffer implementations are backed by arrays, though implementations such as direct buffers do not necessarily have an accessible backing array.

To gain a clearer understanding of buffers, let's briefly look at the four member variables defined in the `Buffer` class:

```java
public abstract class Buffer {
    // Invariants: mark <= position <= limit <= capacity
    private int mark = -1;
    private int position = 0;
    private int limit;
    private int capacity;
}
```

The specific meanings of these four member variables are as follows:

1. Capacity (`capacity`): The maximum amount of data a `Buffer` can hold, set when the `Buffer` is created and immutable thereafter.
2. Limit (`limit`): The boundary for reading/writing data in the `Buffer`. In write mode, `limit` represents the maximum amount of data that can be written, generally equal to `capacity` (can be set via `limit(int newLimit)`); in read mode, `limit` equals the actual amount of data written into the Buffer.
3. Position (`position`): The index of the next element to be read or written. When switching from write mode to read mode (`flip`), `position` is reset to 0 so reading can start from the beginning.
4. Mark (`mark`): Allows the `Buffer` to directly reset its position back to this marked index; this is an optional attribute.

When `mark` is defined, the variables above satisfy the invariant: **0 <= mark <= position <= limit <= capacity**. When `mark` is undefined, calling `reset()` throws an `InvalidMarkException`.

Additionally, a Buffer has two modes—read mode and write mode—used for reading data from the Buffer or writing data into the Buffer, respectively. After a Buffer is created, it defaults to write mode; calling `flip()` switches it to read mode. To switch back to write mode again, you can call `clear()` or `compact()`.

![Relationship among position, limit, and capacity](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/JavaNIOBuffer-7d221097.png)

![Relationship among position, limit, and capacity](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/NIOBufferClassAttributes-55abbc9a.png)

A `Buffer` object cannot be instantiated using `new` to invoke a constructor; it can only be instantiated via static factory methods.

Here we take `ByteBuffer` as an example:

```java
// Allocate heap memory
public static ByteBuffer allocate(int capacity);
// Allocate direct memory
public static ByteBuffer allocateDirect(int capacity);
```

The two most core methods of Buffer:

1. `get`: Reads data from the buffer.
2. `put`: Writes data into the buffer.

Besides those two methods, other important methods include:

- `flip`: Switches the buffer from write mode to read mode by setting `limit` to the current `position` and resetting `position` to 0.
- `clear`: Clears the buffer, switching it from read mode back to write mode, resetting `position` to 0, and setting `limit` to `capacity`.
- ……

How data changes inside a Buffer:

```java
import java.nio.*;

public class CharBufferDemo {
    public static void main(String[] args) {
        // Allocate a CharBuffer with capacity 8
        CharBuffer buffer = CharBuffer.allocate(8);
        System.out.println("Initial state:");
        printState(buffer);

        // Write 3 characters into the buffer
        buffer.put('a').put('b').put('c');
        System.out.println("State after writing 3 characters:");
        printState(buffer);

        // Call flip() to prepare for reading data from the buffer, setting position to 0 and limit to 3
        buffer.flip();
        System.out.println("State after calling flip():");
        printState(buffer);

        // Read characters
        while (buffer.hasRemaining()) {
            System.out.print(buffer.get());
        }

        // Call clear() to clear the buffer, setting position to 0 and limit to capacity
        buffer.clear();
        System.out.println("State after calling clear():");
        printState(buffer);

    }

    // Print buffer's capacity, limit, and position
    private static void printState(CharBuffer buffer) {
        System.out.print("capacity: " + buffer.capacity());
        System.out.print(", limit: " + buffer.limit());
        System.out.print(", position: " + buffer.position());
        System.out.println("\n");
    }
}
```

Output:

```bash
Initial state:
capacity: 8, limit: 8, position: 0

State after writing 3 characters:
capacity: 8, limit: 8, position: 3

Ready to read data from the buffer!

State after calling flip():
capacity: 8, limit: 3, position: 0

Data read: abc

State after calling clear():
capacity: 8, limit: 8, position: 0
```

To help make this clearer, I drew a diagram illustrating the changes in `capacity`, `limit`, and `position` at each stage.

![Changes in capacity, limit, and position at each stage](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/NIOBufferClassAttributesDataChanges-a1374eed.png)

### Channel

A Channel is a conduit that establishes a connection to a data source (such as a file or network socket). We can use it to read and write data—much like opening a water pipe through which data flows freely.

Streams in BIO are unidirectional, divided into various `InputStream` (input streams) and `OutputStream` (output streams), where data travels in only one direction. Different types of channels can be used for reading, writing, or both—for example, `FileChannel`'s read/write capability depends on how it was opened, while `SocketChannel` supports both reading and writing.

A Channel works hand in hand with the Buffer introduced earlier: during a read operation, data from the Channel is filled into the Buffer; during a write operation, data from the Buffer is written into the Channel.

![Relationship between Channel and Buffer](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-buffer-27651f21.png)

Additionally, some Channels (such as `SocketChannel`) support both reading and writing simultaneously, allowing them to map more directly to the bidirectional communication capabilities of the underlying operating system.

The subclasses of `Channel` are shown below.

![Subclasses of Channel](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-subclasses-9756ab5f.png)

Among them, the most commonly used channel types are:

- `FileChannel`: Channel for file access.
- `SocketChannel`, `ServerSocketChannel`: Channels for TCP communication.
- `DatagramChannel`: Channel for UDP communication.

![Channel inheritance hierarchy diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-inheritance-relationship-70bf28b4.png)

The two most core methods of Channel:

1. `read`: Reads data from the Channel and writes it into a Buffer.
2. `write`: Writes data from a Buffer into the Channel.

Here we use `FileChannel` as an example to demonstrate reading file data:

```java
RandomAccessFile reader = new RandomAccessFile("/Users/guide/Documents/test_read.in", "r");
FileChannel channel = reader.getChannel();
ByteBuffer buffer = ByteBuffer.allocate(1024);
channel.read(buffer);
```

### Selector

Selector is a key component in NIO that allows a single thread to handle multiple Channels. Selector is based on an event-driven I/O Multiplexing model. Its main working principle is: you register channel events with the Selector, and the Selector continuously polls the Channels registered on it. When an event occurs on a Channel—such as a new incoming TCP connection, a read event, or a write event—that Channel enters a ready state and is selected by the Selector. The Selector adds the relevant Channels to a ready set. Through `SelectionKey`, we can obtain the set of ready Channels and perform the corresponding I/O operations on them.

![Selector working diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/selector-channel-selectionkey-005fb037.png)

A single Selector multiplexer can monitor multiple Channels simultaneously. The underlying implementation of `Selector` is determined by the platform's `SelectorProvider`—for example, `epoll` can be used on Linux, while other platforms use their respective implementations. The number of concurrent connections that can be accepted is still bounded by system resources such as file descriptors, memory, and OS configuration.

A Selector can listen for the following four event types:

1. `SelectionKey.OP_ACCEPT`: Indicates that a channel is ready to accept a new connection, typically used with `ServerSocketChannel`.
2. `SelectionKey.OP_CONNECT`: Indicates that a channel has completed its connection establishment, typically used with `SocketChannel`.
3. `SelectionKey.OP_READ`: Indicates that a channel is ready for reading, i.e., data is available to read.
4. `SelectionKey.OP_WRITE`: Indicates that a channel is ready for writing, i.e., data can be written.

`Selector` is an abstract class; a Selector instance can be created by calling its static `open()` method. A Selector can monitor the I/O status of multiple `SelectableChannel` instances simultaneously and forms the core of Non-blocking I/O.

A Selector instance maintains three `SelectionKey` sets:

1. The key set (all `SelectionKey`s): Represents all `Channel`s registered with this Selector; this set can be returned via the `keys()` method.
2. The selected-key set: Represents all Channels returned by `select()` that require I/O processing; this set can be returned via `selectedKeys()`.
3. The cancelled-key set: Represents all `Channel`s whose registrations have been cancelled. During the next `select()` invocation, the `SelectionKey`s corresponding to these `Channel`s are completely removed. Application code typically does not need to access this set directly, and no method is exposed to access it.

Here is a simple demonstration of iterating over the selected `SelectionKey` set and handling events:

```java
Set<SelectionKey> selectedKeys = selector.selectedKeys();
Iterator<SelectionKey> keyIterator = selectedKeys.iterator();
while (keyIterator.hasNext()) {
    SelectionKey key = keyIterator.next();
    if (key != null) {
        if (key.isAcceptable()) {
            // ServerSocketChannel accepted a new connection
        } else if (key.isConnectable()) {
            // Indicates a new connection has been established
        } else if (key.isReadable()) {
            // Channel has data ready to read
        } else if (key.isWritable()) {
            // Channel is ready to attempt writing data
        }
    }
    keyIterator.remove();
}
```

Selector also provides a series of `select()`-related methods:

- `int select()`: Monitors all registered `Channel`s; when at least one has pending I/O operations to process, this method returns and adds the corresponding `SelectionKey`s to the selected-key set. The return value is the number of keys whose ready-operation sets were updated in this operation.
- `int select(long timeout)`: A `select()` operation that allows specifying a timeout duration.
- `int selectNow()`: Performs an immediate non-blocking `select()` operation; unlike the no-arg `select()` method, it does not block the thread.
- `Selector wakeup()`: Causes a `select()` operation that has not yet returned to return immediately.
- ……

Simple example of using Selector to implement network reading and writing:

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Set;

public class NioSelectorExample {

  public static void main(String[] args) {
    try {
      ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
      serverSocketChannel.configureBlocking(false);
      serverSocketChannel.socket().bind(new InetSocketAddress(8080));

      Selector selector = Selector.open();
      // Register ServerSocketChannel with Selector and listen for OP_ACCEPT events
      serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);

      while (true) {
        int readyChannels = selector.select();

        if (readyChannels == 0) {
          continue;
        }

        Set<SelectionKey> selectedKeys = selector.selectedKeys();
        Iterator<SelectionKey> keyIterator = selectedKeys.iterator();

        while (keyIterator.hasNext()) {
          SelectionKey key = keyIterator.next();

          if (key.isAcceptable()) {
            // Handle accept connection event
            ServerSocketChannel server = (ServerSocketChannel) key.channel();
            SocketChannel client = server.accept();
            client.configureBlocking(false);

            // Register client channel with Selector and listen for OP_READ events
            client.register(selector, SelectionKey.OP_READ);
          } else if (key.isReadable()) {
            // Handle read event
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int bytesRead = client.read(buffer);

            if (bytesRead > 0) {
              buffer.flip();
              System.out.println("Received data: " +new String(buffer.array(), 0, bytesRead));
              // Store data to be sent and listen for OP_WRITE events
              key.attach(ByteBuffer.wrap("Hello, Client!".getBytes()));
              key.interestOps(SelectionKey.OP_WRITE);
            } else if (bytesRead < 0) {
              // Client closed connection
              client.close();
            }
          } else if (key.isWritable()) {
            // Handle write event
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buffer = (ByteBuffer) key.attachment();
            client.write(buffer);

            // Non-blocking write may only write part of the data; switch back to OP_READ after everything is written
            if (!buffer.hasRemaining()) {
              key.attach(null);
              key.interestOps(SelectionKey.OP_READ);
            }
          }

          keyIterator.remove();
        }
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
  }
}
```

In this example, we create a simple server listening on port 8080, using a Selector to handle connection, read, and write events. When receiving data from a client, the server reads the data and prints it to the console, then replies `"Hello, Client!"` to the client.

## NIO Zero-Copy

Zero-copy is a commonly used technique to improve the performance of I/O operations. Top open-source projects such as ActiveMQ, Kafka, RocketMQ, QMQ, and Netty all make use of zero-copy.

Zero-copy means that when a computer performs an I/O operation, the CPU does not need to copy data from one memory region to another, thereby reducing context switches and CPU copying time. In other words, zero-copy mainly solves the problem of the operating system frequently copying data when handling I/O operations. Common implementations of zero-copy include `mmap+write`, `sendfile`, and `sendfile + DMA gather copy`.

The table below compares various zero-copy techniques:

|                            | CPU Copies | DMA Copies | System Calls | Context Switches |
| -------------------------- | ---------- | ---------- | ------------ | ---------------- |
| Traditional approach       | 2          | 2          | read+write   | 4                |
| mmap+write                 | 1          | 2          | mmap+write   | 4                |
| sendfile                   | 1          | 2          | sendfile     | 2                |
| sendfile + DMA gather copy | 0          | 2          | sendfile     | 2                |

As you can see, whether using traditional I/O or zero-copy, 2 DMA (Direct Memory Access) copies are unavoidable, because both DMA transfers are handled directly by hardware. Zero-copy primarily reduces CPU copies and context switches.

Java support for zero-copy:

- `MappedByteBuffer` is the memory-mapped file implementation provided by Java NIO, allowing a portion of a file to be mapped directly into memory. The underlying mechanism depends on the operating system; for instance, on Linux it is typically based on `mmap`.
- `FileChannel`'s `transferTo()/transferFrom()` methods can transfer bytes directly between channels. Many operating systems can optimize this transfer—for example, on Linux it may use `sendfile`. The concrete implementation depends on the JDK and operating system. For more details on using `FileChannel`, see this article: [Usage of Java NIO FileChannel](https://www.cnblogs.com/robothy/p/14235598.html).

Code example:

```java
private void loadFileIntoMemory(File xmlFile) throws IOException {
  FileInputStream fis = new FileInputStream(xmlFile);
  // Create FileChannel object
  FileChannel fc = fis.getChannel();
  // FileChannel.map() maps the file into direct memory and returns a MappedByteBuffer object
  MappedByteBuffer mmb = fc.map(FileChannel.MapMode.READ_ONLY, 0, fc.size());
  xmlFileBuffer = new byte[(int)fc.size()];
  mmb.get(xmlFileBuffer);
  fis.close();
}
```

## Summary

In this article, we mainly introduced the core knowledge points of NIO, including NIO's core components and zero-copy.

If we need to build network applications using NIO, it is not recommended to use raw Java NIO directly, because its API is complex to program with and relatively weak in functionality. Instead, it is recommended to use mature NIO-based network programming frameworks such as Netty. Netty provides numerous optimizations and extensions on top of NIO, such as support for multiple protocols, SSL/TLS, and more.

## References

- An Introduction to Java NIO (Meituan Tech Blog): <https://tech.meituan.com/2016/11/04/nio.html>

- Interviewer: Do You Know Java NIO?: <https://mp.weixin.qq.com/s/mZobf-U8OSYQfHfYBEB6KA>

- Java NIO: Buffer, Channel, and Selector: <https://www.javadoop.com/post/java-nio>
