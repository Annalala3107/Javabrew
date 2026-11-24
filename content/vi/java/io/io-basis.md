---
title: Tổng hợp kiến thức nền tảng Java I/O
description: Tổng hợp toàn diện kiến thức nền tảng Java I/O, giải thích chi tiết sự khác biệt giữa Byte Stream và Character Stream, InputStream/OutputStream, Reader/Writer, tối ưu hóa bằng Buffered Stream và các thao tác đọc/ghi tệp.
category: Java
tag:
  - Java IO
  - Kiến thức Java cơ bản
head:
  - - meta
    - name: keywords
      content: Java IO,Byte Stream,Character Stream,InputStream,OutputStream,Reader,Writer,Thao tác tệp,Buffered Stream
lang: vi
sourceRef: zh-ref/java/io/io-basis.md
---

## Giới thiệu về I/O Stream

I/O là viết tắt của `Input/Output` (Đầu vào/Đầu ra). Quá trình đưa dữ liệu vào bộ nhớ máy tính gọi là Input (nhập), ngược lại quá trình xuất dữ liệu ra bộ nhớ ngoài (như cơ sở dữ liệu, tệp tin, máy chủ từ xa) gọi là Output (xuất). Quá trình truyền dữ liệu tương tự như dòng nước chảy, vì vậy được gọi là I/O Stream (luồng I/O). Trong Java, I/O Stream được chia thành luồng đầu vào (Input Stream) và luồng đầu ra (Output Stream); còn dựa theo cách thức xử lý dữ liệu thì được chia thành Byte Stream và Character Stream.

Hơn 40 lớp trong Java I/O Stream đều được kế thừa từ 4 lớp cơ sở trừu tượng sau đây:

- `InputStream`/`Reader`: Lớp cơ sở cho mọi luồng đầu vào, trong đó `InputStream` là Byte Input Stream (luồng nhập byte) và `Reader` là Character Input Stream (luồng nhập ký tự).
- `OutputStream`/`Writer`: Lớp cơ sở cho mọi luồng đầu ra, trong đó `OutputStream` là Byte Output Stream (luồng xuất byte) và `Writer` là Character Output Stream (luồng xuất ký tự).

## Byte Stream

### InputStream (Byte Input Stream)

`InputStream` được dùng để đọc dữ liệu (thông tin dạng byte) từ nguồn (thường là tệp tin) vào bộ nhớ. Lớp trừu tượng `java.io.InputStream` là lớp cha của tất cả các Byte Input Stream.

Các phương thức thường dùng của `InputStream`:

- `read()`: Trả về byte dữ liệu tiếp theo trong luồng đầu vào. Giá trị trả về nằm trong khoảng từ 0 đến 255. Nếu không đọc được byte nào, phương thức trả về `-1`, biểu thị đã kết thúc tệp.
- `read(byte b[ ])`: Đọc một số byte từ luồng đầu vào và lưu vào mảng `b`. Nếu độ dài mảng `b` bằng 0 thì không đọc byte nào. Nếu không có byte khả dụng để đọc, trả về `-1`. Nếu có byte khả dụng, số byte đọc được tối đa bằng `b.length`, và trả về số byte thực tế đã đọc. Phương thức này tương đương với `read(b, 0, b.length)`.
- `read(byte b[], int off, int len)`: Bổ sung thêm tham số `off` (offset — vị trí lệch) và `len` (số byte tối đa cần đọc) dựa trên phương thức `read(byte b[ ])`.
- `skip(long n)`: Bỏ qua `n` byte trong luồng đầu vào, trả về số byte thực tế đã bỏ qua.
- `available()`: Trả về giá trị ước lượng số byte có thể đọc (hoặc bỏ qua) ngay lập tức mà không bị block; không thể dùng nó để xác định tổng độ dài của luồng đầu vào.
- `close()`: Đóng luồng đầu vào và giải phóng các tài nguyên hệ thống liên quan.

Từ Java 9 trở đi, `InputStream` được bổ sung thêm một số phương thức rất hữu ích:

- `readAllBytes()`: Đọc toàn bộ các byte còn lại trong luồng đầu vào và trả về mảng byte.
- `readNBytes(byte[] b, int off, int len)`: Thử đọc tối đa `len` byte, trả về khi đã đọc đủ độ dài chỉ định hoặc gặp cuối luồng; quá trình đọc có thể bị block hoặc ném ra ngoại lệ.
- `transferTo(OutputStream out)`: Chuyển toàn bộ các byte từ một luồng đầu vào sang một luồng đầu ra.

`FileInputStream` là một đối tượng Byte Input Stream khá phổ biến, có thể chỉ định trực tiếp đường dẫn tệp, đọc trực tiếp dữ liệu từng byte hoặc đọc vào mảng byte.

Ví dụ code `FileInputStream`:

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

Nội dung tệp `input.txt`:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419155214614-dcb9ca67.png)

Kết quả đầu ra:

```plain
Number of remaining bytes:11
The actual number of bytes skipped:2
The content read from file:JavaGuide
```

Tuy nhiên, thông thường chúng ta không dùng riêng lẻ `FileInputStream`, mà thường kết hợp cùng `BufferedInputStream` (Buffered Byte Input Stream, sẽ trình bày ở phần sau).

Đoạn code như dưới đây khá phổ biến trong các dự án thực tế: chúng ta dùng `readAllBytes()` để đọc toàn bộ byte của luồng đầu vào và gán trực tiếp vào một đối tượng `String`.

```java
// Tạo mới một đối tượng BufferedInputStream
BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("input.txt"));
// Đọc nội dung tệp và sao chép vào đối tượng String
String result = new String(bufferedInputStream.readAllBytes());
System.out.println(result);
```

`DataInputStream` được dùng để đọc dữ liệu theo kiểu chỉ định, không thể dùng độc lập mà phải kết hợp với một luồng khác, chẳng hạn như `FileInputStream`.

```java
FileInputStream fileInputStream = new FileInputStream("input.txt");
// Phải truyền fileInputStream làm tham số constructor mới dùng được
DataInputStream dataInputStream = new DataInputStream(fileInputStream);
// Có thể đọc bất kỳ kiểu dữ liệu cụ thể nào
dataInputStream.readBoolean();
dataInputStream.readInt();
dataInputStream.readUTF();
```

`ObjectInputStream` dùng để đọc đối tượng Java từ luồng đầu vào (Giải tuần tự hóa - `Deserialization`), còn `ObjectOutputStream` dùng để ghi đối tượng vào luồng đầu ra (Tuần tự hóa - `Serialization`).

```java
ObjectInputStream input = new ObjectInputStream(new FileInputStream("object.data"));
MyClass object = (MyClass) input.readObject();
input.close();
```

Ngoài ra, lớp dùng cho `Serialization` và `Deserialization` bắt buộc phải triển khai interface `Serializable`; nếu có thuộc tính nào trong đối tượng không muốn bị tuần tự hóa thì dùng từ khóa `transient` để đánh dấu.

### OutputStream (Byte Output Stream)

`OutputStream` được dùng để ghi dữ liệu (thông tin dạng byte) tới đích (thường là tệp tin). Lớp trừu tượng `java.io.OutputStream` là lớp cha của tất cả các Byte Output Stream.

Các phương thức thường dùng của `OutputStream`:

- `write(int b)`: Ghi một byte cụ thể vào luồng đầu ra.
- `write(byte b[ ])`: Ghi mảng `b` vào luồng đầu ra, tương đương với `write(b, 0, b.length)`.
- `write(byte[] b, int off, int len)`: Bổ sung thêm tham số `off` (offset) và `len` (số byte cần ghi) dựa trên phương thức `write(byte b[ ])`.
- `flush()`: Xả bộ đệm của luồng đầu ra và ép ghi toàn bộ các byte đang được đệm ra ngoài.
- `close()`: Đóng luồng đầu ra và giải phóng các tài nguyên hệ thống liên quan.

`FileOutputStream` là đối tượng Byte Output Stream được sử dụng phổ biến nhất, có thể chỉ định trực tiếp đường dẫn tệp, xuất trực tiếp dữ liệu từng byte hoặc xuất một mảng byte chỉ định.

Ví dụ code `FileOutputStream`:

```java
try (FileOutputStream output = new FileOutputStream("output.txt")) {
    byte[] array = "JavaGuide".getBytes();
    output.write(array);
} catch (IOException e) {
    e.printStackTrace();
}
```

Kết quả chạy chương trình:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419155514392-ff8834f9.png)

Tương tự như `FileInputStream`, `FileOutputStream` thường cũng sẽ được kết hợp sử dụng cùng `BufferedOutputStream` (Buffered Byte Output Stream, sẽ trình bày ở phần sau).

```java
FileOutputStream fileOutputStream = new FileOutputStream("output.txt");
BufferedOutputStream bos = new BufferedOutputStream(fileOutputStream);
```

**`DataOutputStream`** dùng để ghi dữ liệu theo kiểu chỉ định, không thể dùng độc lập mà phải kết hợp với một luồng khác, chẳng hạn như `FileOutputStream`.

```java
// Luồng đầu ra
FileOutputStream fileOutputStream = new FileOutputStream("out.txt");
DataOutputStream dataOutputStream = new DataOutputStream(fileOutputStream);
// Xuất các kiểu dữ liệu tùy ý
dataOutputStream.writeBoolean(true);
dataOutputStream.writeByte(1);
```

`ObjectInputStream` dùng để đọc đối tượng Java từ luồng đầu vào (`Deserialization`), còn `ObjectOutputStream` ghi đối tượng vào luồng đầu ra (`Serialization`).

```java
ObjectOutputStream output = new ObjectOutputStream(new FileOutputStream("file.txt"));
Person person = new Person("Guide", "Tác giả JavaGuide");
output.writeObject(person);
```

## Character Stream

Dù là đọc/ghi tệp hay gửi/nhận qua mạng, đơn vị lưu trữ nhỏ nhất của thông tin đều là byte. **Vậy tại sao các thao tác luồng I/O lại phải chia thành thao tác Byte Stream và thao tác Character Stream?**

Theo cá nhân tôi, chủ yếu có hai nguyên nhân:

- Character Stream được tạo ra nhờ JVM chuyển đổi từ byte sang ký tự, và quá trình chuyển đổi này tương đối tốn thời gian.
- Nếu chúng ta không biết loại bảng mã (encoding), rất dễ gặp phải vấn đề lỗi font/ký tự rác (garbled text).

Vấn đề lỗi ký tự rác này rất dễ tái hiện: chúng ta chỉ cần sửa nội dung tệp `input.txt` trong ví dụ code `FileInputStream` ở trên thành chữ tiếng Trung, còn code gốc không cần thay đổi gì.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419154632551-899aad23.png)

Kết quả đầu ra:

```java
Number of remaining bytes:9
The actual number of bytes skipped:2
The content read from file:§å®¶å¥½
```

Có thể thấy rất rõ nội dung đọc ra đã bị biến thành ký tự lỗi.

Do đó, Java I/O cung cấp luôn một interface để thao tác trực tiếp trên ký tự, thuận tiện cho việc xử lý luồng ký tự hằng ngày. Với các tệp đa phương tiện như âm thanh, hình ảnh thì dùng Byte Stream sẽ tốt hơn; còn khi liên quan đến ký tự/văn bản thì dùng Character Stream sẽ tốt hơn.

`Reader` và `Writer` dùng để thao tác với ký tự; khi chuyển đổi qua lại giữa Byte Stream và Character Stream, cần chỉ định bảng mã thông qua `Charset`. Các lớp chuyển đổi không chỉ định rõ bảng mã sẽ sử dụng bảng mã mặc định của JVM.

Bản thân Unicode chỉ là một tập ký tự (character set), nó gán một mã số duy nhất cho mỗi ký tự chứ không quy định cách lưu trữ cụ thể. UTF-8, UTF-16, UTF-32 đều là các cách mã hóa (encoding) của Unicode, sử dụng số lượng byte khác nhau để biểu diễn ký tự Unicode. Ví dụ, với UTF-8: ký tự tiếng Anh chiếm 1 byte, ký tự tiếng Trung chiếm 3 byte.

### Reader (Character Input Stream)

`Reader` được dùng để đọc dữ liệu (thông tin ký tự) từ nguồn (thường là tệp tin) vào bộ nhớ. Lớp trừu tượng `java.io.Reader` là lớp cha của tất cả các Character Input Stream.

`Reader` dùng để đọc văn bản, còn `InputStream` dùng để đọc byte thô.

Các phương thức thường dùng của `Reader`:

- `read()`: Đọc một ký tự từ luồng đầu vào.
- `read(char[] cbuf)`: Đọc một số ký tự từ luồng đầu vào và lưu vào mảng ký tự `cbuf`, tương đương với `read(cbuf, 0, cbuf.length)`.
- `read(char[] cbuf, int off, int len)`: Bổ sung thêm tham số `off` (offset) và `len` (số ký tự tối đa cần đọc) dựa trên phương thức `read(char[] cbuf)`.
- `skip(long n)`: Bỏ qua `n` ký tự trong luồng đầu vào, trả về số ký tự thực tế đã bỏ qua.
- `close()`: Đóng luồng đầu vào và giải phóng các tài nguyên hệ thống liên quan.

`InputStreamReader` là cầu nối chuyển đổi từ Byte Stream sang Character Stream, còn lớp con của nó là `FileReader` được đóng gói dựa trên nền tảng này để thao tác trực tiếp với tệp ký tự.

```java
// Cầu nối chuyển đổi Byte Stream sang Character Stream
public class InputStreamReader extends Reader {
}
// Dùng để đọc tệp ký tự
public class FileReader extends InputStreamReader {
}
```

Ví dụ code `FileReader`:

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

Nội dung tệp `input.txt`:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419154632551-899aad23.png)

Kết quả đầu ra:

```plain
The actual number of characters skipped:3
The content read from file:我是Guide。
```

### Writer (Character Output Stream)

`Writer` được dùng để ghi dữ liệu (thông tin ký tự) tới đích (thường là tệp tin). Lớp trừu tượng `java.io.Writer` là lớp cha của tất cả các Character Output Stream.

Các phương thức thường dùng của `Writer`:

- `write(int c)`: Ghi một ký tự đơn lẻ.
- `write(char[] cbuf)`: Ghi mảng ký tự `cbuf`, tương đương với `write(cbuf, 0, cbuf.length)`.
- `write(char[] cbuf, int off, int len)`: Bổ sung thêm tham số `off` (offset) và `len` (số ký tự cần ghi) dựa trên phương thức `write(char[] cbuf)`.
- `write(String str)`: Ghi chuỗi ký tự, tương đương với `write(str, 0, str.length())`.
- `write(String str, int off, int len)`: Bổ sung thêm tham số `off` (offset) và `len` (số ký tự cần ghi) dựa trên phương thức `write(String str)`.
- `append(CharSequence csq)`: Nối chuỗi ký tự chỉ định vào đối tượng `Writer` này và trả về chính đối tượng `Writer` đó.
- `append(char c)`: Nối ký tự chỉ định vào đối tượng `Writer` này và trả về chính đối tượng `Writer` đó.
- `flush()`: Xả bộ đệm của luồng đầu ra và ép ghi toàn bộ các ký tự đang được đệm ra ngoài.
- `close()`: Đóng luồng đầu ra và giải phóng các tài nguyên hệ thống liên quan.

`OutputStreamWriter` là cầu nối chuyển đổi từ Character Stream sang Byte Stream, còn lớp con của nó là `FileWriter` được đóng gói dựa trên nền tảng này để ghi trực tiếp ký tự vào tệp.

```java
// Cầu nối chuyển đổi Character Stream sang Byte Stream
public class OutputStreamWriter extends Writer {
}
// Dùng để ghi ký tự vào tệp
public class FileWriter extends OutputStreamWriter {
}
```

Ví dụ code `FileWriter`:

```java
try (Writer output = new FileWriter("output.txt")) {
    output.write("你好，我是Guide。");
} catch (IOException e) {
    e.printStackTrace();
}
```

Kết quả đầu ra:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220419155802288-5d051886.png)

## Buffered Byte Stream

Thao tác I/O tiêu tốn rất nhiều hiệu năng; Buffered Stream nạp dữ liệu vào vùng đệm (buffer) để đọc/ghi nhiều byte trong một lần, từ đó tránh các thao tác I/O lặp đi lặp lại và nâng cao hiệu suất truyền luồng.

Ở đây, Buffered Byte Stream áp dụng mẫu thiết kế Decorator Pattern để tăng cường chức năng cho các đối tượng lớp con của `InputStream` và `OutputStream`.

Ví dụ, chúng ta có thể dùng `BufferedInputStream` (Buffered Byte Input Stream) để tăng cường chức năng cho `FileInputStream`.

```java
// Tạo mới một đối tượng BufferedInputStream
BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("input.txt"));
```

Sự khác biệt về hiệu năng giữa Byte Stream thường và Buffered Byte Stream thể hiện chủ yếu khi chúng ta sử dụng cả hai với phương thức `write(int b)` và `read()` — hai phương thức mỗi lần chỉ đọc/ghi một byte. Do bên trong Buffered Byte Stream có vùng đệm (một mảng byte), nên nó sẽ lưu các byte đọc được vào vùng đệm trước, giảm đáng kể số lần thao tác I/O và nâng cao hiệu suất đọc.

Bảng so sánh thời gian tiêu tốn khi sử dụng phương thức `write(int b)` và `read()` để sao chép một tệp PDF dung lượng `524.9 MB` thông qua Byte Stream thường và Buffered Byte Stream như sau:

```plain
Tổng thời gian sao chép tệp PDF bằng Buffered Stream: 15428 ms
Tổng thời gian sao chép tệp PDF bằng Byte Stream thường: 2555062 ms
```

Chênh lệch thời gian giữa hai cách là rất lớn: thời gian tiêu tốn của Buffered Stream chỉ bằng 1/165 lần so với Byte Stream thường.

Code kiểm thử như sau:

```java
@Test
void copy_pdf_to_another_pdf_buffer_stream() {
    // Ghi lại thời điểm bắt đầu
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
    // Ghi lại thời điểm kết thúc
    long end = System.currentTimeMillis();
    System.out.println("Tổng thời gian sao chép tệp PDF bằng Buffered Stream: " + (end - start) + " ms");
}

@Test
void copy_pdf_to_another_pdf_stream() {
    // Ghi lại thời điểm bắt đầu
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
    // Ghi lại thời điểm kết thúc
    long end = System.currentTimeMillis();
    System.out.println("Tổng thời gian sao chép tệp PDF bằng luồng thường: " + (end - start) + " ms");
}
```

Nếu gọi hai phương thức `read(byte b[])` và `write(byte b[], int off, int len)` để đọc/ghi cả một mảng byte, chỉ cần kích thước mảng byte phù hợp thì chênh lệch hiệu năng giữa hai loại thực ra không lớn, gần như có thể bỏ qua.

Lần này chúng ta dùng phương thức `read(byte b[])` và `write(byte b[], int off, int len)` để sao chép tệp PDF 524.9 MB bằng Byte Stream thường và Buffered Byte Stream, kết quả so sánh thời gian như sau:

```plain
Tổng thời gian sao chép tệp PDF bằng Buffered Stream: 695 ms
Tổng thời gian sao chép tệp PDF bằng Byte Stream thường: 989 ms
```

Thời gian tiêu tốn của hai cách không chênh lệch nhiều, hiệu năng của Buffered Stream nhỉnh hơn một chút.

Code kiểm thử như sau:

```java
@Test
void copy_pdf_to_another_pdf_with_byte_array_buffer_stream() {
    // Ghi lại thời điểm bắt đầu
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
    // Ghi lại thời điểm kết thúc
    long end = System.currentTimeMillis();
    System.out.println("Tổng thời gian sao chép tệp PDF bằng Buffered Stream: " + (end - start) + " ms");
}

@Test
void copy_pdf_to_another_pdf_with_byte_array_stream() {
    // Ghi lại thời điểm bắt đầu
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
    // Ghi lại thời điểm kết thúc
    long end = System.currentTimeMillis();
    System.out.println("Tổng thời gian sao chép tệp PDF bằng luồng thường: " + (end - start) + " ms");
}
```

### BufferedInputStream (Buffered Byte Input Stream)

Trong quá trình đọc dữ liệu (thông tin byte) từ nguồn (thường là tệp tin) vào bộ nhớ, `BufferedInputStream` không đọc từng byte một từ luồng gốc, mà sẽ lưu trước các byte đọc được vào vùng đệm và đọc từng byte từ vùng đệm nội bộ này. Nhờ đó giảm mạnh số lần thao tác I/O và nâng cao hiệu suất đọc.

Bên trong `BufferedInputStream` duy trì một vùng đệm, thực chất chính là một mảng byte; ta có thể kiểm chứng kết luận này bằng cách đọc mã nguồn của `BufferedInputStream`:

```java
public
class BufferedInputStream extends FilterInputStream {
    // Mảng vùng đệm nội bộ
    protected volatile byte buf[];
    // Kích thước mặc định của vùng đệm
    private static int DEFAULT_BUFFER_SIZE = 8192;
    // Sử dụng kích thước vùng đệm mặc định
    public BufferedInputStream(InputStream in) {
        this(in, DEFAULT_BUFFER_SIZE);
    }
    // Tùy chỉnh kích thước vùng đệm
    public BufferedInputStream(InputStream in, int size) {
        super(in);
        if (size <= 0) {
            throw new IllegalArgumentException("Buffer size <= 0");
        }
        buf = new byte[size];
    }
}
```

Kích thước mặc định của vùng đệm là **8192** byte; tất nhiên, bạn cũng có thể chỉ định kích thước vùng đệm thông qua constructor `BufferedInputStream(InputStream in, int size)`.

### BufferedOutputStream (Buffered Byte Output Stream)

Trong quá trình ghi dữ liệu (thông tin byte) tới đích (thường là tệp tin), `BufferedOutputStream` không ghi từng byte một trực tiếp xuống tệp, mà sẽ đưa các byte cần ghi vào vùng đệm trước rồi xuất từ vùng đệm nội bộ. Nhờ vậy giảm đáng kể số lần thao tác I/O và nâng cao hiệu suất.

```java
try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("output.txt"))) {
    byte[] array = "JavaGuide".getBytes();
    bos.write(array);
} catch (IOException e) {
    e.printStackTrace();
}
```

Tương tự như `BufferedInputStream`, bên trong `BufferedOutputStream` cũng duy trì một vùng đệm, và kích thước của vùng đệm này cũng là **8192** byte.

## Buffered Character Stream

`BufferedReader` (Buffered Character Input Stream) và `BufferedWriter` (Buffered Character Output Stream) tương tự như `BufferedInputStream` (Buffered Byte Input Stream) và `BufferedOutputStream` (Buffered Byte Output Stream), nhưng bên trong hai lớp này duy trì vùng đệm ký tự để thao tác với thông tin dạng ký tự.

## Print Stream

Đoạn code dưới đây mọi người chắc hẳn dùng rất thường xuyên đúng không?

```java
System.out.print("Hello!");
System.out.println("Hello!");
```

`System.out` thực chất dùng để lấy một đối tượng `PrintStream`, và phương thức `print` thực tế gọi phương thức `write` của đối tượng `PrintStream`.

`PrintStream` thuộc về Byte Print Stream (luồng in byte), tương ứng với nó là `PrintWriter` (Character Print Stream — luồng in ký tự). `PrintStream` là lớp con của `OutputStream`, còn `PrintWriter` là lớp con của `Writer`.

```java
public class PrintStream extends FilterOutputStream
    implements Appendable, Closeable {
}
public class PrintWriter extends Writer {
}
```

## Random Access Stream

Random Access Stream (luồng truy cập ngẫu nhiên) được giới thiệu ở đây chỉ lớp `RandomAccessFile`, hỗ trợ nhảy tự do đến bất kỳ vị trí nào trong tệp để đọc và ghi.

Constructor của `RandomAccessFile` như sau; chúng ta có thể chỉ định `mode` (chế độ đọc/ghi).

```java
// Tham số openAndDelete mặc định là false, biểu thị mở tệp và tệp này sẽ không bị xóa
public RandomAccessFile(File file, String mode)
    throws FileNotFoundException {
    this(file, mode, false);
}
// Phương thức private
private RandomAccessFile(File file, String mode, boolean openAndDelete)  throws FileNotFoundException{
  // Lược bỏ phần lớn mã nguồn
}
```

Chế độ đọc/ghi chủ yếu có 4 loại sau:

- `r`: Chế độ chỉ đọc.
- `rw`: Chế độ đọc/ghi.
- `rws`: So với `rw`, `rws` đồng bộ cập nhật cả thay đổi đối với "nội dung tệp" lẫn "siêu dữ liệu (metadata)" xuống thiết bị lưu trữ ngoài.
- `rwd`: So với `rw`, `rwd` đồng bộ cập nhật các thay đổi đối với "nội dung tệp" xuống thiết bị lưu trữ ngoài.

Nội dung tệp là dữ liệu thực tế được lưu trong tệp, còn siêu dữ liệu (metadata) dùng để mô tả các thuộc tính của tệp như thông tin kích thước tệp, thời gian tạo và thời gian chỉnh sửa.

Trong `RandomAccessFile` có một con trỏ tệp (file pointer) dùng để biểu thị vị trí của byte tiếp theo sẽ được ghi hoặc đọc. Chúng ta có thể thông qua phương thức `seek(long pos)` của `RandomAccessFile` để thiết lập vị trí lệch (offset) của con trỏ tệp (cách đầu tệp `pos` byte). Nếu muốn lấy vị trí hiện tại của con trỏ tệp, có thể dùng phương thức `getFilePointer()`.

Ví dụ code `RandomAccessFile`:

```java
RandomAccessFile randomAccessFile = new RandomAccessFile(new File("input.txt"), "rw");
System.out.println("Offset trước khi đọc: " + randomAccessFile.getFilePointer() + ", ký tự đọc được: " + (char) randomAccessFile.read() + ", offset sau khi đọc: " + randomAccessFile.getFilePointer());
// Đặt offset hiện tại của con trỏ là 6
randomAccessFile.seek(6);
System.out.println("Offset trước khi đọc: " + randomAccessFile.getFilePointer() + ", ký tự đọc được: " + (char) randomAccessFile.read() + ", offset sau khi đọc: " + randomAccessFile.getFilePointer());
// Bắt đầu ghi dữ liệu byte từ vị trí offset 7
randomAccessFile.write(new byte[]{'H', 'I', 'J', 'K'});
// Đặt offset hiện tại của con trỏ về 0, quay lại vị trí ban đầu
randomAccessFile.seek(0);
System.out.println("Offset trước khi đọc: " + randomAccessFile.getFilePointer() + ", ký tự đọc được: " + (char) randomAccessFile.read() + ", offset sau khi đọc: " + randomAccessFile.getFilePointer());
```

Nội dung tệp `input.txt`:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220421162050158-c3687e7b.png)

Kết quả đầu ra:

```plain
Offset trước khi đọc: 0, ký tự đọc được: A, offset sau khi đọc: 1
Offset trước khi đọc: 6, ký tự đọc được: G, offset sau khi đọc: 7
Offset trước khi đọc: 0, ký tự đọc được: A, offset sau khi đọc: 1
```

Nội dung tệp `input.txt` trở thành `ABCDEFGHIJK`.

Phương thức `write` của `RandomAccessFile` khi ghi dữ liệu sẽ ghi đè lên nếu tại vị trí tương ứng đã có sẵn dữ liệu.

```java
RandomAccessFile randomAccessFile = new RandomAccessFile(new File("input.txt"), "rw");
randomAccessFile.write(new byte[]{'H', 'I', 'J', 'K'});
```

Giả sử trước khi chạy đoạn chương trình trên, nội dung tệp `input.txt` là `ABCD`, thì sau khi chạy sẽ trở thành `HIJK`.

Một ứng dụng khá phổ biến của `RandomAccessFile` là triển khai **tải lên tiếp tục từ điểm ngắt (Resumable Upload)** cho các tệp lớn. Thế nào là tải lên tiếp tục từ điểm ngắt? Nói đơn giản là sau khi việc tải tệp lên bị tạm dừng hoặc thất bại giữa chừng (chẳng hạn gặp sự cố mạng), không cần tải lại từ đầu mà chỉ cần tải lên những mảnh tệp (file chunks) chưa được tải lên thành công. Tải lên theo từng mảnh (cắt tệp thành nhiều mảnh nhỏ trước) là nền tảng của cơ chế tải lên tiếp tục từ điểm ngắt.

`RandomAccessFile` có thể giúp chúng ta ghép các mảnh tệp lại, ví dụ code như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/20210609164749122-8ae39c40.png)

Tôi đã giới thiệu chi tiết về bài toán tải lên tệp lớn trong [Java Interview Guide](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/image-20220428104115362-df6e2e92.png)

Việc triển khai `RandomAccessFile` phụ thuộc vào `FileDescriptor` (bộ mô tả tệp) và `FileChannel` (tệp ánh xạ bộ nhớ).
