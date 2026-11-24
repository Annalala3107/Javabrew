---
title: "Java IO Design Patterns Summary"
description: "In-depth analysis of Java IO design patterns: detailed explanation of the Decorator pattern in BufferedInputStream, the Adapter pattern implementation in InputStreamReader, and the Template Method pattern design in InputStream to understand the Java IO class library architecture."
category: Java
tag:
  - Java IO
  - Java Basics
head:
  - - meta
    - name: keywords
      content: Java IO Design Patterns,Decorator Pattern,Adapter Pattern,Template Method Pattern,FilterInputStream,IO Stream Design
lang: en
sourceRef: zh-ref/java/io/io-design-patterns.md
---

In this article, let's take a brief look at which design patterns we can learn from Java IO.

## Decorator Pattern

The **Decorator pattern** can extend the functionality of an existing object without modifying the original object itself.

The Decorator pattern uses composition instead of inheritance to extend the functionality of the original class, which is especially practical in scenarios with complex inheritance hierarchies (the inheritance relationships among various classes in IO are indeed quite complex).

For Byte Streams, `FilterInputStream` (for input streams) and `FilterOutputStream` (for output streams) are the core of the Decorator pattern, used respectively to enhance the functionality of `InputStream` and `OutputStream` subclass objects.

Common classes we encounter such as `BufferedInputStream` (buffered byte input stream) and `DataInputStream` are subclasses of `FilterInputStream`, while `BufferedOutputStream` (buffered byte output stream) and `DataOutputStream` are subclasses of `FilterOutputStream`.

For example, we can enhance the functionality of `FileInputStream` using `BufferedInputStream` (buffered byte input stream).

The constructors of `BufferedInputStream` are as follows:

```java
public BufferedInputStream(InputStream in) {
    this(in, DEFAULT_BUFFER_SIZE);
}

public BufferedInputStream(InputStream in, int size) {
    super(in);
    if (size <= 0) {
        throw new IllegalArgumentException("Buffer size <= 0");
    }
    buf = new byte[size];
}
```

As you can see, one of the parameters in `BufferedInputStream`'s constructor is `InputStream`.

`BufferedInputStream` code example:

```java
try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream("input.txt"))) {
    int content;
    long skip = bis.skip(2);
    while ((content = bis.read()) != -1) {
        System.out.print((char) content);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

At this point, you might be wondering: **Why don't we just create a `BufferedFileInputStream` (buffered file input stream) directly?**

```java
BufferedFileInputStream bfis = new BufferedFileInputStream("input.txt");
```

If `InputStream` only had a few subclasses, doing so would be fine. However, `InputStream` has far too many subclasses, and the inheritance hierarchy is too complex. If we had to build a dedicated buffered input stream for every single subclass, it would be far too cumbersome.

If you are relatively familiar with IO streams, you will also notice that `ZipInputStream` and `ZipOutputStream` can further enhance the capabilities of `BufferedInputStream` and `BufferedOutputStream`, respectively.

```java
BufferedInputStream bis = new BufferedInputStream(new FileInputStream(fileName));
ZipInputStream zis = new ZipInputStream(bis);

BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(fileName));
ZipOutputStream zipOut = new ZipOutputStream(bos);
```

`ZipInputStream` and `ZipOutputStream` inherit from `InflaterInputStream` and `DeflaterOutputStream`, respectively.

```java
public
class InflaterInputStream extends FilterInputStream {
}

public
class DeflaterOutputStream extends FilterOutputStream {
}

```

This is also a very important characteristic of the Decorator pattern: multiple decorators can be nested around the original class.

To achieve this effect, decorator classes need to inherit from the same abstract class or implement the same interface as the original class. The common parent classes of the IO decorator classes and original classes introduced above are `InputStream` and `OutputStream`.

For Character Streams, `BufferedReader` can be used to add functionality to `Reader` (character input stream) subclasses, and `BufferedWriter` can be used to add functionality to `Writer` (character output stream) subclasses.

```java
BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(fileName), "UTF-8"));
```

There are simply too many examples of the Decorator pattern in IO streams—there is no need to memorize them by rote at all! Once you grasp the core idea of the Decorator pattern, you will naturally recognize where it is being used when working with IO.

## Adapter Pattern

The **Adapter pattern** is mainly used to coordinate classes with incompatible interfaces so they can work together; you can compare it to the power adapters we use in everyday life.

In the Adapter pattern, the object or class being adapted is called the **Adaptee**, and the object or class acting upon the adaptee is called the **Adapter**. Adapters are divided into object adapters and class adapters. Class adapters are implemented using inheritance, whereas object adapters are implemented using composition.

In IO streams, Character Streams and Byte Streams have different interfaces, and the fact that they can work together smoothly is based on the Adapter pattern—more precisely, an object adapter. Through an adapter, we can adapt a Byte Stream object into a Character Stream object, allowing us to read or write character data directly over the Byte Stream object.

`InputStreamReader` and `OutputStreamWriter` are two Adapters, and at the same time, they serve as the bridge between Byte Streams and Character Streams. `InputStreamReader` uses `StreamDecoder` to decode bytes, **converting a Byte Stream into a Character Stream**, while `OutputStreamWriter` uses `StreamEncoder` to encode characters, converting a Character Stream into a Byte Stream.

Subclasses of `InputStream` and `OutputStream` are the Adaptees, while `InputStreamReader` and `OutputStreamWriter` are the Adapters.

```java
// InputStreamReader is the Adapter; FileInputStream is the Adaptee class
InputStreamReader isr = new InputStreamReader(new FileInputStream(fileName), "UTF-8");
// BufferedReader enhances the functionality of InputStreamReader (Decorator Pattern)
BufferedReader bufferedReader = new BufferedReader(isr);
```

Partial source code of `java.io.InputStreamReader`:

```java
public class InputStreamReader extends Reader {
    // Object used for decoding
    private final StreamDecoder sd;
    public InputStreamReader(InputStream in) {
        super(in);
        try {
            // Obtain the StreamDecoder object
            sd = StreamDecoder.forInputStreamReader(in, this, (String)null);
        } catch (UnsupportedEncodingException e) {
            throw new Error(e);
        }
    }
    // Use the StreamDecoder object to perform the actual reading
    public int read() throws IOException {
        return sd.read();
    }
}
```

Partial source code of `java.io.OutputStreamWriter`:

```java
public class OutputStreamWriter extends Writer {
    // Object used for encoding
    private final StreamEncoder se;
    public OutputStreamWriter(OutputStream out) {
        super(out);
        try {
           // Obtain the StreamEncoder object
            se = StreamEncoder.forOutputStreamWriter(out, this, (String)null);
        } catch (UnsupportedEncodingException e) {
            throw new Error(e);
        }
    }
    // Use the StreamEncoder object to perform the actual writing
    public void write(int c) throws IOException {
        se.write(c);
    }
}
```

**What is the difference between the Adapter pattern and the Decorator pattern?**

The **Decorator pattern** focuses more on dynamically enhancing the functionality of an original class; the decorator class needs to inherit from the same abstract class or implement the same interface as the original class. Moreover, the Decorator pattern supports nesting multiple decorators on an original class.

The **Adapter pattern** focuses more on enabling classes with incompatible interfaces that cannot directly interact to work together. When we invoke the corresponding methods of the adapter, the adapter internally calls methods on the adaptee class or related classes, and this process is transparent to the caller. For example, `InputStreamReader` and `OutputStreamWriter` adapt a byte input stream and byte output stream into a character input stream and character output stream respectively, completing encoding and decoding between bytes and characters internally.

```java
Reader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
```

The Adapter and the Adaptee do not need to inherit from the same abstract class or implement the same interface.

Additionally, the `FutureTask` class uses the Adapter pattern: the inner class `RunnableAdapter` in `Executors` is an adapter used to adapt a `Runnable` into a `Callable`.

A `FutureTask` constructor that takes a `Runnable` parameter:

```java
public FutureTask(Runnable runnable, V result) {
    // Call the callable method of the Executors class
    this.callable = Executors.callable(runnable, result);
    this.state = NEW;
}
```

The corresponding method and adapter in `Executors`:

```java
// Actually invokes the constructor of Executors' inner class RunnableAdapter
public static <T> Callable<T> callable(Runnable task, T result) {
    if (task == null)
        throw new NullPointerException();
    return new RunnableAdapter<T>(task, result);
}
// Adapter
static final class RunnableAdapter<T> implements Callable<T> {
    final Runnable task;
    final T result;
    RunnableAdapter(Runnable task, T result) {
        this.task = task;
        this.result = result;
    }
    public T call() {
        task.run();
        return result;
    }
}
```

## Factory Pattern

The Factory pattern is used to create objects, and it is widely used in NIO. For example, the `newInputStream` method of the `Files` class creates an `InputStream` object (static factory), the `get` method of the `Paths` class creates a `Path` object (static factory), and the `getPath` method of the `ZipFileSystem` class (a class under the `sun.nio` package, which is an internal implementation related to `java.nio`) creates a `Path` object (simple factory).

```java
InputStream is = Files.newInputStream(Paths.get(generatorLogoPath))
```

## Observer Pattern

The file directory watch service in NIO uses the Observer pattern.

The directory watch service in NIO is based on the `WatchService` interface and the `Watchable` interface. `WatchService` acts as the observer, and `Watchable` acts as the observable (subject).

The `Watchable` interface defines a `register` method used to register an object with a `WatchService` and bind the events to watch for.

```java
public interface Path
    extends Comparable<Path>, Iterable<Path>, Watchable{
}

public interface Watchable {
    WatchKey register(WatchService watcher,
                      WatchEvent.Kind<?>[] events,
                      WatchEvent.Modifier... modifiers)
        throws IOException;
}
```

`WatchService` is used to monitor changes in file directories, and a single `WatchService` object can monitor multiple file directories.

```java
// Create a WatchService object
WatchService watchService = FileSystems.getDefault().newWatchService();

// Initialize a Path instance for the monitored directory:
Path path = Paths.get("workingDirectory");
// Register this path object with WatchService (monitoring service)
WatchKey watchKey = path.register(
watchService, StandardWatchEventKinds...);
```

The second parameter `events` (the events to be monitored) of `Path`'s `register` method is a varargs parameter, which means we can monitor multiple types of events simultaneously.

```java
WatchKey register(WatchService watcher,
                  WatchEvent.Kind<?>... events)
    throws IOException;
```

There are 3 commonly monitored events:

- `StandardWatchEventKinds.ENTRY_CREATE`: File creation.
- `StandardWatchEventKinds.ENTRY_DELETE`: File deletion.
- `StandardWatchEventKinds.ENTRY_MODIFY`: File modification.

The `register` method returns a `WatchKey` object, through which you can obtain specific event information—such as whether a file in the directory was created, deleted, or modified, and the exact name of the created, deleted, or modified file.

```java
WatchKey key;
while ((key = watchService.take()) != null) {
    for (WatchEvent<?> event : key.pollEvents()) {
      // You can call methods on the WatchEvent object to do things like printing the event's context details
    }
    key.reset();
}
```

The concrete implementation of `WatchService` depends on the file system and underlying Provider: an implementation may directly use native file event mechanisms, or fall back to periodic polling. Below is a simplified source snippet of the polling implementation.

```java
class PollingWatchService
    extends AbstractWatchService
{
    // Define a daemon thread to poll for file changes
    private final ScheduledExecutorService scheduledExecutor;

    PollingWatchService() {
        scheduledExecutor = Executors
            .newSingleThreadScheduledExecutor(new ThreadFactory() {
                 @Override
                 public Thread newThread(Runnable r) {
                     Thread t = new Thread(r);
                     t.setDaemon(true);
                     return t;
                 }});
    }

  void enable(Set<? extends WatchEvent.Kind<?>> events, long period) {
    synchronized (this) {
      // Update monitored events
      this.events = events;

        // Start periodic polling
      Runnable thunk = new Runnable() { public void run() { poll(); }};
      this.poller = scheduledExecutor
        .scheduleAtFixedRate(thunk, period, period, TimeUnit.SECONDS);
    }
  }
}
```

## References

- Patterns in Java APIs: <http://cecs.wright.edu/~tkprasad/courses/ceg860/paper/node26.html>
- Decorator Pattern: Learning the Decorator Pattern by Analyzing Java IO Class Library Source Code: <https://time.geekbang.org/column/article/204845>
- What Is the `sun.nio` Package—Is It Java Code? - RednaxelaFX <https://www.zhihu.com/question/29237781/answer/43653953>
