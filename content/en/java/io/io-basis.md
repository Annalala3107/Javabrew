---
title: Summary of Java I/O Fundamentals
description: Comprehensive summary of Java I/O fundamentals, covering the differences between byte streams and character streams, InputStream/OutputStream byte streams, Reader/Writer character streams, buffered stream optimizations, and file read/write operations.
category: Java
tag:
  - Java IO
  - Java Fundamentals
head:
  - - meta
    - name: keywords
      content: Java IO,Byte Stream,Character Stream,InputStream,OutputStream,Reader,Writer,File Operations,Buffered Stream
lang: en
sourceRef: zh-ref/java/io/io-basis.md
---

## Introduction to I/O Streams

I/O stands for `Input/Output`. The process of reading data into computer memory is called input, while outputting data to external storage (such as databases, files, or remote hosts) is called output. Because data transmission resembles flowing water, it is referred to as an I/O stream. In Java, I/O streams are divided into input streams and output streams, and based on how data is processed, they are also divided into byte streams and character streams.

More than 40 classes in Java I/O streams are derived from the following 4 abstract base classes:

- `InputStream`/`Reader`: The base classes for all input streams—the former is a byte input stream, and the latter is a character input stream.
- `OutputStream`/`Writer`: The base classes for all output streams—the former is a byte output stream, and the latter is a character output stream.

## Byte Stream

### InputStream (Byte Input Stream)

`InputStream` is used to read data (byte information) from a source (usually a file) into memory. The abstract class `java.io.InputStream` is the superclass of all byte input streams.

Common methods of `InputStream`:

- `read()`: Returns the next byte of data from the input stream. The returned value is between 0 and 255. If no byte is read, it returns `-1`, indicating the end of the file.
- `read(byte b[ ])`: Reads some bytes from the input stream and stores them into the array `b`. If the length of array `b` is zero, no bytes are read. If no bytes are available because the stream is at end of file, `-1` is returned. If bytes are available, at most `b.length` bytes are read, and the number of bytes actually read is returned. This method is equivalent to `read(b, 0, b.length)`.
- `read(byte b[], int off, int len)`: Adds the `off` parameter (offset) and the `len` parameter (the maximum number of bytes to read) on top of `read(byte b[ ])`.
- `skip(long n)`: Skips over and discards `n` bytes of data from the input stream, returning the actual number of bytes skipped.
- `available()`: Returns an estimate of the number of bytes that can be read (or skipped over) without blocking; it cannot be used to determine the total length of the input stream.
- `close()`: Closes the input stream and releases any associated system resources.

Starting from Java 9, several practical methods were added to `InputStream`:

- `readAllBytes()`: Reads all remaining bytes from the input stream and returns a byte array.
- `readNBytes(byte[] b, int off, int len)`: Attempts to read up to `len` bytes, returning when the specified length has been read or the end of the stream is reached; it may block during reading or throw an exception.
- `transferTo(OutputStream out)`: Transfers all bytes from this input stream to an output stream.

`FileInputStream` is a commonly used byte input stream class. It allows you to directly specify a file path and read either single-byte data or data into a byte array.

`FileInputStream` code example:

```java
try (InputStream fis = new FileInputStream("input.txt")) {
    System.out.println("Number of remaining bytes:"
            + fis.available());
    int content;
    long skip = fis.skip(2);
    System.out.println("The actual number of bytes skipped:" + skip);
    System.out.print("The content read from file:");
    while ((content = fis.read()) != -1) {
        System.out.print((char) content);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

Content of `input.txt`:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419155214614-dcb9ca67.png)

Output:

```plain
Number of remaining bytes:11
The actual number of bytes skipped:2
The content read from file:JavaGuide
```

However, we generally do not use `FileInputStream` alone; instead, we typically wrap it with `BufferedInputStream` (the buffered byte input stream, which will be covered later).

Code like the snippet below is quite common in real projects, where we read all bytes from an input stream via `readAllBytes()` and assign them directly to a `String` object.

```java
// Create a new BufferedInputStream object
BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("input.txt"));
// Read the file content and copy it into a String object
String result = new String(bufferedInputStream.readAllBytes());
System.out.println(result);
```

`DataInputStream` is used to read data of specified primitive types. It cannot be used alone and must be combined with another stream, such as `FileInputStream`.

```java
FileInputStream fileInputStream = new FileInputStream("input.txt");
// fileInputStream must be passed as a constructor argument
DataInputStream dataInputStream = new DataInputStream(fileInputStream);
// Can read data of any specific primitive/UTF type
dataInputStream.readBoolean();
dataInputStream.readInt();
dataInputStream.readUTF();
```

`ObjectInputStream` is used to read Java objects from an input stream (Deserialization), while `ObjectOutputStream` is used to write objects to an output stream (Serialization).

```java
ObjectInputStream input = new ObjectInputStream(new FileInputStream("object.data"));
MyClass object = (MyClass) input.readObject();
input.close();
```

In addition, classes used for Serialization and Deserialization must implement the `Serializable` interface, and any field in the object that should not be serialized should be modified with `transient`.

### OutputStream (Byte Output Stream)

`OutputStream` is used to write data (byte information) to a destination (usually a file). The abstract class `java.io.OutputStream` is the superclass of all byte output streams.

Common methods of `OutputStream`:

- `write(int b)`: Writes the specified byte to this output stream.
- `write(byte b[ ])`: Writes array `b` to this output stream, equivalent to `write(b, 0, b.length)`.
- `write(byte[] b, int off, int len)`: Adds the `off` parameter (offset) and the `len` parameter (the number of bytes to write) on top of `write(byte b[ ])`.
- `flush()`: Flushes this output stream and forces any buffered output bytes to be written out.
- `close()`: Closes this output stream and releases any associated system resources.

`FileOutputStream` is the most commonly used byte output stream class. You can directly specify a file path and write either single-byte data or a specified byte array.

`FileOutputStream` code example:

```java
try (FileOutputStream output = new FileOutputStream("output.txt")) {
    byte[] array = "JavaGuide".getBytes();
    output.write(array);
} catch (IOException e) {
    e.printStackTrace();
}
```

Execution result:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419155514392-ff8834f9.png)

Similar to `FileInputStream`, `FileOutputStream` is also commonly used together with `BufferedOutputStream` (the buffered byte output stream, covered later).

```java
FileOutputStream fileOutputStream = new FileOutputStream("output.txt");
BufferedOutputStream bos = new BufferedOutputStream(fileOutputStream);
```

**`DataOutputStream`** is used to write data of specified primitive types. It cannot be used alone and must be combined with another stream, such as `FileOutputStream`.

```java
// Output stream
FileOutputStream fileOutputStream = new FileOutputStream("out.txt");
DataOutputStream dataOutputStream = new DataOutputStream(fileOutputStream);
// Write arbitrary data types
dataOutputStream.writeBoolean(true);
dataOutputStream.writeByte(1);
```

`ObjectInputStream` is used to read Java objects from an input stream (Deserialization), and `ObjectOutputStream` writes objects to an output stream (Serialization).

```java
ObjectOutputStream output = new ObjectOutputStream(new FileOutputStream("file.txt"));
Person person = new Person("Guide", "JavaGuide Author");
output.writeObject(person);
```

## Character Stream

Whether reading/writing files or sending/receiving over a network, the smallest unit of stored information is the byte. **So why are I/O stream operations divided into byte stream operations and character stream operations?**

In my view, there are mainly two reasons:

- Character streams are obtained by the JVM converting bytes into characters, and this conversion process is relatively time-consuming.
- If we do not know the encoding type, it is very easy to run into garbled text (mojibake) issues.

This garbled text issue is very easy to reproduce: we only need to change the contents of `input.txt` in the `FileInputStream` code example above to Chinese characters, without changing the original code.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419154632551-899aad23.png)

Output:

```java
Number of remaining bytes:9
The actual number of bytes skipped:2
The content read from file:§å®¶å¥½
```

We can clearly see that the read content has become garbled text.

Therefore, Java I/O simply provides an interface for directly operating on characters, making it convenient for us to work with character streams in daily development. For media files such as audio files and images, byte streams are better; when dealing with characters/text, character streams are better.

`Reader` and `Writer` are used to manipulate characters. When converting between byte streams and character streams, the encoding should be specified via `Charset`. Conversion classes that do not explicitly specify an encoding will use the JVM's default charset.

Unicode itself is only a character set—it assigns a unique numeric code point to each character, without specifying a concrete storage representation. UTF-8, UTF-16, and UTF-32 are all encoding schemes for Unicode, using different numbers of bytes to represent Unicode characters. For example, in UTF-8, an English character takes 1 byte, while a Chinese character typically takes 3 bytes.

### Reader (Character Input Stream)

`Reader` is used to read data (character information) from a source (usually a file) into memory. The abstract class `java.io.Reader` is the superclass of all character input streams.

`Reader` is used for reading text, while `InputStream` is used for reading raw bytes.

Common methods of `Reader`:

- `read()`: Reads a single character from the input stream.
- `read(char[] cbuf)`: Reads characters from the input stream and stores them into the character array `cbuf`, equivalent to `read(cbuf, 0, cbuf.length)`.
- `read(char[] cbuf, int off, int len)`: Adds the `off` parameter (offset) and the `len` parameter (the maximum number of characters to read) on top of `read(char[] cbuf)`.
- `skip(long n)`: Skips `n` characters in the input stream and returns the actual number of characters skipped.
- `close()`: Closes the input stream and releases any associated system resources.

`InputStreamReader` acts as a bridge from byte streams to character streams, and its subclass `FileReader` is a convenience wrapper built on top of it for directly operating on character files.

```java
// Bridge from byte stream to character stream
public class InputStreamReader extends Reader {
}
// Used for reading character files
public class FileReader extends InputStreamReader {
}
```

`FileReader` code example:

```java
try (FileReader fileReader = new FileReader("input.txt");) {
    int content;
    long skip = fileReader.skip(3);
    System.out.println("The actual number of characters skipped:" + skip);
    System.out.print("The content read from file:");
    while ((content = fileReader.read()) != -1) {
        System.out.print((char) content);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

Content of `input.txt`:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419154632551-899aad23.png)

Output:

```plain
The actual number of characters skipped:3
The content read from file:我是Guide。
```

### Writer (Character Output Stream)

`Writer` is used to write data (character information) to a destination (usually a file). The abstract class `java.io.Writer` is the superclass of all character output streams.

Common methods of `Writer`:

- `write(int c)`: Writes a single character.
- `write(char[] cbuf)`: Writes a character array `cbuf`, equivalent to `write(cbuf, 0, cbuf.length)`.
- `write(char[] cbuf, int off, int len)`: Adds the `off` parameter (offset) and the `len` parameter (the number of characters to write) on top of `write(char[] cbuf)`.
- `write(String str)`: Writes a string, equivalent to `write(str, 0, str.length())`.
- `write(String str, int off, int len)`: Adds the `off` parameter (offset) and the `len` parameter (the number of characters to write) on top of `write(String str)`.
- `append(CharSequence csq)`: Appends the specified character sequence to this `Writer` and returns this `Writer` object.
- `append(char c)`: Appends the specified character to this `Writer` and returns this `Writer` object.
- `flush()`: Flushes this output stream and forces any buffered output characters to be written out.
- `close()`: Closes the output stream and releases any associated system resources.

`OutputStreamWriter` acts as a bridge from character streams to byte streams, and its subclass `FileWriter` is a convenience wrapper built on top of it for directly writing characters to a file.

```java
// Bridge from character stream to byte stream
public class OutputStreamWriter extends Writer {
}
// Used for writing characters to a file
public class FileWriter extends OutputStreamWriter {
}
```

`FileWriter` code example:

```java
try (Writer output = new FileWriter("output.txt")) {
    output.write("你好，我是Guide。");
} catch (IOException e) {
    e.printStackTrace();
}
```

Output result:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419155802288-5d051886.png)

## Buffered Byte Stream

I/O operations are very performance-intensive. Buffered streams load data into a buffer and read/write multiple bytes at once, thereby avoiding frequent I/O operations and improving stream transfer efficiency.

Buffered byte streams use the Decorator Pattern to enhance the functionality of `InputStream` and `OutputStream` subclass objects.

For example, we can enhance `FileInputStream` using `BufferedInputStream` (buffered byte input stream).

```java
// Create a new BufferedInputStream object
BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("input.txt"));
```

The performance difference between regular byte streams and buffered byte streams mainly manifests when we call `write(int b)` and `read()`, which read or write only one byte at a time. Because a buffered byte stream has an internal buffer (a byte array), it stores the read bytes in the buffer first, greatly reducing the number of I/O system calls and improving reading efficiency.

Using the `write(int b)` and `read()` methods to copy a `524.9 MB` PDF file via a regular byte stream versus a buffered byte stream, the time comparison is as follows:

```plain
Total time to copy PDF file using buffered stream: 15428 ms
Total time to copy PDF file using regular byte stream: 2555062 ms
```

The time difference between the two is huge—the buffered stream took only 1/165th of the time taken by the regular byte stream.

The test code is as follows:

```java
@Test
void copy_pdf_to_another_pdf_buffer_stream() {
    // Record start time
    long start = System.currentTimeMillis();
    try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream("computer-systems.pdf"));
         BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("computer-systems-copy.pdf"))) {
        int content;
        while ((content = bis.read()) != -1) {
            bos.write(content);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    // Record end time
    long end = System.currentTimeMillis();
    System.out.println("Total time to copy PDF file using buffered stream: " + (end - start) + " ms");
}

@Test
void copy_pdf_to_another_pdf_stream() {
    // Record start time
    long start = System.currentTimeMillis();
    try (FileInputStream fis = new FileInputStream("computer-systems.pdf");
         FileOutputStream fos = new FileOutputStream("computer-systems-copy.pdf")) {
        int content;
        while ((content = fis.read()) != -1) {
            fos.write(content);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    // Record end time
    long end = System.currentTimeMillis();
    System.out.println("Total time to copy PDF file using regular stream: " + (end - start) + " ms");
}
```

If we call `read(byte b[])` and `write(byte b[], int off, int len)`—which read and write an entire byte array at a time—as long as the byte array size is appropriate, the performance gap between the two is small and basically negligible.

This time, using `read(byte b[])` and `write(byte b[], int off, int len)` to copy the same 524.9 MB PDF file via a regular byte stream versus a buffered byte stream, the time comparison is as follows:

```plain
Total time to copy PDF file using buffered stream: 695 ms
Total time to copy PDF file using regular byte stream: 989 ms
```

The time difference is not large, with the buffered stream performing slightly better.

The test code is as follows:

```java
@Test
void copy_pdf_to_another_pdf_with_byte_array_buffer_stream() {
    // Record start time
    long start = System.currentTimeMillis();
    try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream("computer-systems.pdf"));
         BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("computer-systems-copy.pdf"))) {
        int len;
        byte[] bytes = new byte[4 * 1024];
        while ((len = bis.read(bytes)) != -1) {
            bos.write(bytes, 0, len);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    // Record end time
    long end = System.currentTimeMillis();
    System.out.println("Total time to copy PDF file using buffered stream: " + (end - start) + " ms");
}

@Test
void copy_pdf_to_another_pdf_with_byte_array_stream() {
    // Record start time
    long start = System.currentTimeMillis();
    try (FileInputStream fis = new FileInputStream("computer-systems.pdf");
         FileOutputStream fos = new FileOutputStream("computer-systems-copy.pdf")) {
        int len;
        byte[] bytes = new byte[4 * 1024];
        while ((len = fis.read(bytes)) != -1) {
            fos.write(bytes, 0, len);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    // Record end time
    long end = System.currentTimeMillis();
    System.out.println("Total time to copy PDF file using regular stream: " + (end - start) + " ms");
}
```

### BufferedInputStream (Buffered Byte Input Stream)

When reading data (byte information) from a source (usually a file) into memory, `BufferedInputStream` does not read one byte at a time from the underlying stream; instead, it first stores the read bytes into an internal buffer and reads individual bytes from that buffer. This drastically reduces the number of I/O operations and improves reading efficiency.

`BufferedInputStream` maintains an internal buffer, which is actually a byte array. We can verify this by reading the `BufferedInputStream` source code:

```java
public
class BufferedInputStream extends FilterInputStream {
    // Internal buffer array
    protected volatile byte buf[];
    // Default buffer size
    private static int DEFAULT_BUFFER_SIZE = 8192;
    // Use default buffer size
    public BufferedInputStream(InputStream in) {
        this(in, DEFAULT_BUFFER_SIZE);
    }
    // Custom buffer size
    public BufferedInputStream(InputStream in, int size) {
        super(in);
        if (size <= 0) {
            throw new IllegalArgumentException("Buffer size <= 0");
        }
        buf = new byte[size];
    }
}
```

The default buffer size is **8192** bytes. Of course, you can also specify a custom buffer size via the `BufferedInputStream(InputStream in, int size)` constructor.

### BufferedOutputStream (Buffered Byte Output Stream)

When writing data (byte information) to a destination (usually a file), `BufferedOutputStream` does not write one byte at a time directly to the underlying stream; instead, it first places the bytes to be written into a buffer and writes from the internal buffer. This drastically reduces the number of I/O operations and improves efficiency.

```java
try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("output.txt"))) {
    byte[] array = "JavaGuide".getBytes();
    bos.write(array);
} catch (IOException e) {
    e.printStackTrace();
}
```

Similar to `BufferedInputStream`, `BufferedOutputStream` also maintains an internal buffer, and its default size is also **8192** bytes.

## Buffered Character Stream

`BufferedReader` (buffered character input stream) and `BufferedWriter` (buffered character output stream) are similar to `BufferedInputStream` (buffered byte input stream) and `BufferedOutputStream` (buffered byte output stream), except that the former maintain an internal character buffer for operating on character information.

## Print Stream

Everyone uses code like this frequently, right?

```java
System.out.print("Hello!");
System.out.println("Hello!");
```

`System.out` actually retrieves a `PrintStream` object, and the `print` method actually calls the `write` method of that `PrintStream` object.

`PrintStream` is a byte print stream, and its counterpart is `PrintWriter` (character print stream). `PrintStream` is a subclass of `OutputStream`, while `PrintWriter` is a subclass of `Writer`.

```java
public class PrintStream extends FilterOutputStream
    implements Appendable, Closeable {
}
public class PrintWriter extends Writer {
}
```

## Random Access Stream

The random access stream introduced here refers to `RandomAccessFile`, which supports jumping freely to any position in a file for reading and writing.

The constructors of `RandomAccessFile` are shown below, allowing us to specify the `mode` (read/write mode).

```java
// The openAndDelete parameter defaults to false, meaning the file is opened and will not be deleted
public RandomAccessFile(File file, String mode)
    throws FileNotFoundException {
    this(file, mode, false);
}
// Private constructor
private RandomAccessFile(File file, String mode, boolean openAndDelete)  throws FileNotFoundException{
  // Most code omitted
}
```

There are mainly four read/write modes:

- `r`: Read-only mode.
- `rw`: Read-write mode.
- `rws`: Compared with `rw`, `rws` synchronously flushes updates to both the "file's content" and its "metadata" to the underlying storage device.
- `rwd`: Compared with `rw`, `rwd` synchronously flushes updates to the "file's content" to the underlying storage device.

File content refers to the actual data stored in the file, while metadata describes file attributes such as file size, creation time, and modification time.

`RandomAccessFile` maintains a file pointer that indicates the position of the next byte to be read or written. We can set the file pointer's offset (in bytes from the beginning of the file, `pos`) via `RandomAccessFile`'s `seek(long pos)` method. To get the current position of the file pointer, we can use the `getFilePointer()` method.

`RandomAccessFile` code example:

```java
RandomAccessFile randomAccessFile = new RandomAccessFile(new File("input.txt"), "rw");
System.out.println("Offset before reading: " + randomAccessFile.getFilePointer() + ", character read: " + (char) randomAccessFile.read() + ", offset after reading: " + randomAccessFile.getFilePointer());
// Set current pointer offset to 6
randomAccessFile.seek(6);
System.out.println("Offset before reading: " + randomAccessFile.getFilePointer() + ", character read: " + (char) randomAccessFile.read() + ", offset after reading: " + randomAccessFile.getFilePointer());
// Write byte data starting from offset 7
randomAccessFile.write(new byte[]{'H', 'I', 'J', 'K'});
// Set current pointer offset to 0, returning to the beginning
randomAccessFile.seek(0);
System.out.println("Offset before reading: " + randomAccessFile.getFilePointer() + ", character read: " + (char) randomAccessFile.read() + ", offset after reading: " + randomAccessFile.getFilePointer());
```

Content of `input.txt`:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220421162050158-c3687e7b.png)

Output:

```plain
Offset before reading: 0, character read: A, offset after reading: 1
Offset before reading: 6, character read: G, offset after reading: 7
Offset before reading: 0, character read: A, offset after reading: 1
```

The content of `input.txt` becomes `ABCDEFGHIJK`.

When `RandomAccessFile`'s `write` method writes data, if data already exists at the corresponding position, it will overwrite that data.

```java
RandomAccessFile randomAccessFile = new RandomAccessFile(new File("input.txt"), "rw");
randomAccessFile.write(new byte[]{'H', 'I', 'J', 'K'});
```

Suppose before running the program above, the content of `input.txt` is `ABCD`; after running it, the content becomes `HIJK`.

A fairly common application of `RandomAccessFile` is implementing **resumable uploads** for large files. What is a resumable upload? Simply put, when a file upload is paused or fails midway (e.g., due to network issues), you don't need to re-upload the entire file—you only need to upload the file chunks that were not successfully uploaded. Chunked upload (splitting a file into multiple file chunks first) is the foundation of resumable uploads.

`RandomAccessFile` can help us merge file chunks, as shown in the example code below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/20210609164749122-8ae39c40.png)

I covered the large file upload problem in detail in [Java Interview Guide](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220428104115362-df6e2e92.png)

The implementation of `RandomAccessFile` relies on `FileDescriptor` (file descriptor) and `FileChannel` (memory-mapped file).
