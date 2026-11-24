---
title: Tổng hợp kiến thức cốt lõi Java NIO
description: Tổng hợp toàn diện kiến thức cốt lõi Java NIO, giải thích chi tiết ba thành phần cốt lõi (Channel, Buffer, Selector), cơ chế triển khai Non-blocking I/O, kỹ thuật Zero-Copy và so sánh hiệu năng với I/O truyền thống.
category: Java
tag:
  - Java IO
  - Kiến thức Java cơ bản
head:
  - - meta
    - name: keywords
      content: Java NIO,Channel,Buffer,Selector,Non-blocking I/O,I/O Multiplexing,Zero-Copy,Thành phần cốt lõi NIO
lang: vi
sourceRef: zh-ref/java/io/nio-basis.md
---

Trước khi học NIO, cần tìm hiểu trước các kiến thức lý thuyết nền tảng về mô hình I/O máy tính. Nếu chưa nắm rõ, bạn có thể tham khảo bài viết này của tôi: [Giải thích chi tiết các mô hình Java I/O](https://javaguide.cn/java/io/io-model.html).

## Giới thiệu về NIO

Trong mô hình Java I/O truyền thống (BIO), các thao tác I/O được thực hiện theo phương thức chặn (blocking). Nghĩa là khi một `Thread` (luồng) thực thi một thao tác I/O, nó sẽ bị chặn cho đến khi thao tác đó hoàn tất. Mô hình blocking này khi xử lý nhiều kết nối đồng thời có thể dẫn đến nút thắt cổ chai về hiệu năng, vì cần tạo một thread riêng cho mỗi kết nối, trong khi việc khởi tạo và chuyển đổi ngữ cảnh (context switch) của thread đều tốn chi phí.

Để giải quyết vấn đề này, phiên bản Java 1.4 đã giới thiệu một mô hình I/O mới — **NIO** (New IO, còn gọi là Non-blocking IO). NIO khắc phục những hạn chế của Synchronous Blocking I/O, cung cấp cơ chế I/O không chặn (non-blocking), hướng vùng đệm (buffer-oriented) và dựa trên kênh (channel-based) ngay trong mã Java chuẩn, cho phép dùng ít thread hơn để xử lý nhiều kết nối, nâng cao đáng kể hiệu suất I/O và khả năng xử lý đồng thời.

Hình dưới đây là biểu đồ so sánh đơn giản cách BIO, NIO và AIO xử lý yêu cầu từ client (về phần giới thiệu AIO, bạn có thể xem bài viết này của tôi: [Giải thích chi tiết các mô hình Java I/O](https://javaguide.cn/java/io/io-model.html); phần này không phải trọng tâm, chỉ cần nắm sơ lược).

![So sánh BIO, NIO và AIO](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/bio-aio-nio-d63f4d9c.png)

⚠️ Cần lưu ý: Sử dụng NIO không đồng nghĩa với việc chắc chắn đạt hiệu năng cao; lợi thế hiệu năng của nó chủ yếu thể hiện trong môi trường mạng có độ đồng thời cao (high concurrency) và độ trễ cao (high latency). Khi số lượng kết nối ít, mức độ đồng thời thấp hoặc tốc độ truyền mạng nhanh, hiệu năng của NIO chưa chắc đã vượt trội hơn BIO truyền thống.

## Các thành phần cốt lõi của NIO

NIO chủ yếu bao gồm ba thành phần cốt lõi sau đây:

- **Buffer (vùng đệm)**: Toàn bộ việc đọc/ghi dữ liệu trong NIO đều thao tác thông qua vùng đệm. Khi đọc, dữ liệu từ Channel được nạp vào Buffer; còn khi ghi, dữ liệu từ Buffer được ghi vào Channel.
- **Channel (kênh)**: Channel biểu thị kết nối đang mở tới một thực thể như tệp tin hoặc socket mạng. Tùy vào từng interface cụ thể, Channel có thể hỗ trợ đọc, ghi hoặc cả đọc lẫn ghi đồng thời.
- **Selector (bộ chọn)**: Cho phép một thread duy nhất giám sát các sự kiện sẵn sàng của nhiều kênh có thể chọn (`SelectableChannel`), thực hiện I/O Multiplexing (ghép kênh I/O). Selector chịu trách nhiệm thông báo sự kiện đã sẵn sàng hay chưa, chứ không chịu trách nhiệm phân phối thread xử lý.

Mối quan hệ giữa ba thành phần được minh họa như hình dưới đây (tạm thời chưa hiểu cũng không sao, phần sau sẽ giải thích chi tiết):

![Mối quan hệ giữa Buffer, Channel và Selector](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-buffer-selector-35b44f0d.png)

Dưới đây sẽ giới thiệu chi tiết về ba thành phần này.

### Buffer (Vùng đệm)

Trong BIO truyền thống, việc đọc/ghi dữ liệu hướng theo luồng (stream-oriented), được chia thành Byte Stream và Character Stream.

Trong thư viện NIO của Java 1.4, mọi dữ liệu đều được xử lý bằng vùng đệm; đây là một điểm khác biệt quan trọng giữa thư viện mới và BIO trước đây, hơi giống với Buffered Stream trong BIO. Khi NIO đọc dữ liệu, nó đọc trực tiếp vào vùng đệm; khi ghi dữ liệu, cũng ghi vào vùng đệm. Khi sử dụng NIO để đọc/ghi dữ liệu, mọi thao tác đều đi qua vùng đệm.

Các lớp con của `Buffer` được minh họa như hình dưới đây. Trong đó, phổ biến nhất là `ByteBuffer`, dùng để lưu trữ và thao tác với dữ liệu byte.

![Các lớp con của Buffer](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/buffer-subclasses-5a8569f4.png)

Bạn có thể hình dung Buffer như một chuỗi dữ liệu tuyến tính, hữu hạn gồm các phần tử cùng kiểu. Một số triển khai Buffer được hỗ trợ bởi mảng (array), nhưng các triển khai như Direct Buffer (vùng đệm bộ nhớ trực tiếp) không nhất thiết có mảng nền có thể truy cập trực tiếp.

Để hiểu rõ hơn về vùng đệm, hãy cùng xem nhanh bốn biến thành viên được định nghĩa trong lớp `Buffer`:

```java
public abstract class Buffer {
    // Invariants: mark <= position <= limit <= capacity
    private int mark = -1;
    private int position = 0;
    private int limit;
    private int capacity;
}
```

Ý nghĩa cụ thể của bốn biến thành viên này như sau:

1. Dung lượng (`capacity`): Lượng dữ liệu tối đa mà `Buffer` có thể lưu trữ, được thiết lập khi tạo `Buffer` và không thể thay đổi.
2. Giới hạn (`limit`): Ranh giới dữ liệu có thể đọc/ghi trong `Buffer`. Ở chế độ ghi (write mode), `limit` đại diện cho lượng dữ liệu tối đa có thể ghi, thông thường bằng `capacity` (có thể thiết lập qua phương thức `limit(int newLimit)`); ở chế độ đọc (read mode), `limit` bằng kích thước dữ liệu thực tế đã được ghi vào Buffer.
3. Vị trí (`position`): Vị trí (chỉ số) của phần tử dữ liệu tiếp theo có thể được đọc hoặc ghi. Khi chuyển từ chế độ ghi sang chế độ đọc (`flip`), `position` sẽ được đặt lại về 0 để có thể bắt đầu đọc từ đầu.
4. Đánh dấu (`mark`): `Buffer` cho phép đưa con trỏ `position` quay trực tiếp về vị trí đã đánh dấu này; đây là thuộc tính tùy chọn.

Khi `mark` đã được định nghĩa, các biến trên thỏa mãn mối quan hệ: **0 <= mark <= position <= limit <= capacity**. Khi `mark` chưa được định nghĩa, việc gọi `reset()` sẽ ném ra ngoại lệ `InvalidMarkException`.

Ngoài ra, Buffer có hai chế độ là chế độ đọc (read mode) và chế độ ghi (write mode), tương ứng dùng để đọc dữ liệu ra khỏi Buffer hoặc ghi dữ liệu vào Buffer. Sau khi được tạo, Buffer mặc định ở chế độ ghi; gọi `flip()` có thể chuyển sang chế độ đọc. Nếu muốn chuyển ngược lại sang chế độ ghi, có thể gọi phương thức `clear()` hoặc `compact()`.

![Mối quan hệ giữa position, limit và capacity](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/JavaNIOBuffer-7d221097.png)

![Mối quan hệ giữa position, limit và capacity](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/NIOBufferClassAttributes-55abbc9a.png)

Đối tượng `Buffer` không thể tạo bằng từ khóa `new` để gọi constructor, mà chỉ có thể khởi tạo thông qua các phương thức tĩnh (static factory methods).

Ở đây lấy `ByteBuffer` làm ví dụ minh họa:

```java
// Cấp phát bộ nhớ Heap
public static ByteBuffer allocate(int capacity);
// Cấp phát bộ nhớ trực tiếp (Direct Memory)
public static ByteBuffer allocateDirect(int capacity);
```

Hai phương thức cốt lõi nhất của Buffer:

1. `get`: Đọc dữ liệu từ vùng đệm.
2. `put`: Ghi dữ liệu vào vùng đệm.

Ngoài hai phương thức trên, các phương thức quan trọng khác gồm:

- `flip`: Chuyển vùng đệm từ chế độ ghi sang chế độ đọc; phương thức này gán giá trị của `limit` bằng giá trị `position` hiện tại, và đặt `position` về 0.
- `clear`: Làm rỗng vùng đệm, chuyển từ chế độ đọc sang chế độ ghi, đặt giá trị `position` về 0 và đặt giá trị `limit` bằng `capacity`.
- ……

Quá trình thay đổi dữ liệu bên trong Buffer:

```java
import java.nio.*;

public class CharBufferDemo {
    public static void main(String[] args) {
        // Cấp phát một CharBuffer có capacity bằng 8
        CharBuffer buffer = CharBuffer.allocate(8);
        System.out.println("Trạng thái ban đầu:");
        printState(buffer);

        // Ghi 3 ký tự vào buffer
        buffer.put('a').put('b').put('c');
        System.out.println("Trạng thái sau khi ghi 3 ký tự:");
        printState(buffer);

        // Gọi flip() để chuẩn bị đọc dữ liệu trong buffer, đặt position về 0 và limit bằng 3
        buffer.flip();
        System.out.println("Trạng thái sau khi gọi flip():");
        printState(buffer);

        // Đọc các ký tự
        while (buffer.hasRemaining()) {
            System.out.print(buffer.get());
        }

        // Gọi clear() để làm rỗng buffer, đặt position về 0 và limit bằng capacity
        buffer.clear();
        System.out.println("Trạng thái sau khi gọi clear():");
        printState(buffer);

    }

    // In capacity, limit và position của buffer
    private static void printState(CharBuffer buffer) {
        System.out.print("capacity: " + buffer.capacity());
        System.out.print(", limit: " + buffer.limit());
        System.out.print(", position: " + buffer.position());
        System.out.println("\n");
    }
}
```

Kết quả đầu ra:

```bash
Trạng thái ban đầu:
capacity: 8, limit: 8, position: 0

Trạng thái sau khi ghi 3 ký tự:
capacity: 8, limit: 8, position: 3

Chuẩn bị đọc dữ liệu trong buffer!

Trạng thái sau khi gọi flip():
capacity: 8, limit: 3, position: 0

Dữ liệu đọc được: abc

Trạng thái sau khi gọi clear():
capacity: 8, limit: 8, position: 0
```

Để giúp dễ hình dung, tôi đã vẽ một hình minh họa sự thay đổi của `capacity`, `limit` và `position` qua từng giai đoạn.

![Sự thay đổi của capacity, limit và position qua từng giai đoạn](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/NIOBufferClassAttributesDataChanges-a1374eed.png)

### Channel (Kênh)

Channel là một kênh kết nối được thiết lập với nguồn dữ liệu (như tệp tin, socket mạng...). Chúng ta có thể dùng nó để đọc và ghi dữ liệu, giống như mở một đường ống dẫn nước để dữ liệu chảy tự do trong Channel.

Stream trong BIO là một chiều, chia thành nhiều loại `InputStream` (luồng đầu vào) và `OutputStream` (luồng đầu ra), dữ liệu chỉ truyền theo một hướng. Các loại Channel khác nhau có thể dùng để đọc, ghi hoặc cả hai; ví dụ khả năng đọc/ghi của `FileChannel` phụ thuộc vào cách mở, còn `SocketChannel` hỗ trợ cả đọc và ghi.

Channel làm việc trực tiếp với Buffer đã giới thiệu ở trên: khi đọc thì nạp dữ liệu từ Channel vào Buffer, còn khi ghi thì xuất dữ liệu từ Buffer vào Channel.

![Mối quan hệ giữa Channel và Buffer](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-buffer-27651f21.png)

Ngoài ra, một số Channel (chẳng hạn `SocketChannel`) hỗ trợ đồng thời cả đọc và ghi, giúp ánh xạ trực tiếp hơn tới khả năng giao tiếp hai chiều của hệ điều hành bên dưới.

Các lớp con của `Channel` được minh họa như hình dưới đây.

![Các lớp con của Channel](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-subclasses-9756ab5f.png)

Trong đó, các loại kênh được sử dụng phổ biến nhất gồm:

- `FileChannel`: Kênh truy cập tệp tin.
- `SocketChannel`, `ServerSocketChannel`: Kênh giao tiếp TCP.
- `DatagramChannel`: Kênh giao tiếp UDP.

![Sơ đồ quan hệ kế thừa của Channel](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-inheritance-relationship-70bf28b4.png)

Hai phương thức cốt lõi nhất của Channel:

1. `read`: Đọc dữ liệu và ghi vào Buffer.
2. `write`: Ghi dữ liệu từ Buffer vào Channel.

Ở đây chúng ta lấy `FileChannel` làm ví dụ minh họa việc đọc dữ liệu từ tệp:

```java
RandomAccessFile reader = new RandomAccessFile("/Users/guide/Documents/test_read.in", "r");
FileChannel channel = reader.getChannel();
ByteBuffer buffer = ByteBuffer.allocate(1024);
channel.read(buffer);
```

### Selector (Bộ chọn)

Selector (bộ chọn) là một thành phần then chốt trong NIO, cho phép một thread duy nhất xử lý nhiều Channel. Selector hoạt động dựa trên mô hình I/O Multiplexing hướng sự kiện (event-driven). Nguyên lý vận hành chính là: đăng ký sự kiện của các kênh thông qua Selector, Selector sẽ liên tục thăm dò (poll) các Channel đã đăng ký trên nó. Khi có sự kiện xảy ra—chẳng hạn trên một Channel nào đó có kết nối TCP mới tới, sự kiện đọc hoặc sự kiện ghi—Channel đó chuyển sang trạng thái sẵn sàng (ready) và được Selector chọn ra. Selector sẽ đưa các Channel liên quan vào tập sẵn sàng (ready set). Thông qua `SelectionKey`, có thể lấy được tập hợp các Channel đã sẵn sàng và thực hiện các thao tác I/O tương ứng trên chúng.

![Sơ đồ nguyên lý hoạt động của Selector](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/selector-channel-selectionkey-005fb037.png)

Một bộ ghép kênh Selector có thể giám sát đồng thời nhiều Channel. Triển khai tầng dưới của Selector do `SelectorProvider` của từng nền tảng quyết định—ví dụ trên Linux có thể sử dụng `epoll`, còn các nền tảng khác dùng triển khai riêng tương ứng. Số lượng kết nối tiếp nhận được vẫn chịu giới hạn bởi các tài nguyên hệ thống như bộ mô tả tệp (file descriptor), bộ nhớ và cấu hình hệ điều hành.

Selector có thể lắng nghe 4 loại sự kiện sau:

1. `SelectionKey.OP_ACCEPT`: Biểu thị sự kiện kênh chấp nhận kết nối mới, thường dùng cho `ServerSocketChannel`.
2. `SelectionKey.OP_CONNECT`: Biểu thị sự kiện kênh hoàn tất việc kết nối, thường dùng cho `SocketChannel`.
3. `SelectionKey.OP_READ`: Biểu thị sự kiện kênh đã sẵn sàng để đọc, tức là có dữ liệu để đọc.
4. `SelectionKey.OP_WRITE`: Biểu thị sự kiện kênh đã sẵn sàng để ghi, tức là có thể ghi dữ liệu.

`Selector` là lớp trừu tượng, có thể tạo đối tượng Selector bằng cách gọi phương thức tĩnh `open()` của lớp này. Selector có thể giám sát đồng thời trạng thái I/O của nhiều `SelectableChannel` và là hạt nhân của Non-blocking I/O.

Một đối tượng Selector có ba tập hợp `SelectionKey`:

1. Tập hợp toàn bộ `SelectionKey`: Đại diện cho tất cả `Channel` đã đăng ký trên Selector đó; tập hợp này có thể lấy thông qua phương thức `keys()`.
2. Tập hợp `SelectionKey` được chọn (selected-key set): Đại diện cho tất cả các Channel có thể lấy được thông qua phương thức `select()` và cần xử lý I/O; tập hợp này có thể lấy qua `selectedKeys()`.
3. Tập hợp `SelectionKey` đã bị hủy (cancelled-key set): Đại diện cho tất cả `Channel` đã hủy đăng ký. Trong lần thực thi `select()` tiếp theo, các `SelectionKey` tương ứng với những `Channel` này sẽ bị xóa hoàn toàn; chương trình thông thường không cần truy cập trực tiếp tập này và cũng không có phương thức nào được công khai để truy cập nó.

Minh họa đơn giản cách duyệt tập `SelectionKey` được chọn và xử lý:

```java
Set<SelectionKey> selectedKeys = selector.selectedKeys();
Iterator<SelectionKey> keyIterator = selectedKeys.iterator();
while (keyIterator.hasNext()) {
    SelectionKey key = keyIterator.next();
    if (key != null) {
        if (key.isAcceptable()) {
            // ServerSocketChannel đã tiếp nhận một kết nối mới
        } else if (key.isConnectable()) {
            // Biểu thị một kết nối mới đã được thiết lập
        } else if (key.isReadable()) {
            // Channel có dữ liệu sẵn sàng để đọc
        } else if (key.isWritable()) {
            // Channel đã sẵn sàng, có thể thử ghi dữ liệu
        }
    }
    keyIterator.remove();
}
```

Selector còn cung cấp hàng loạt phương thức liên quan đến `select()`:

- `int select()`: Giám sát tất cả `Channel` đã đăng ký; khi có ít nhất một kênh cần xử lý thao tác I/O, phương thức này trả về và thêm các `SelectionKey` tương ứng vào tập `selectedKeys`. Giá trị trả về là số lượng key có tập sự kiện sẵn sàng được cập nhật trong lần gọi này.
- `int select(long timeout)`: Thao tác `select()` cho phép thiết lập thời gian chờ tối đa (timeout).
- `int selectNow()`: Thực hiện một thao tác `select()` trả về ngay lập tức; so với phương thức `select()` không tham số, phương thức này không làm block thread.
- `Selector wakeup()`: Khiến một lời gọi `select()` chưa kịp trả về lập tức thoát khỏi trạng thái chờ và trả về ngay.
- ……

Ví dụ đơn giản sử dụng Selector để đọc/ghi mạng:

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
      // Đăng ký ServerSocketChannel vào Selector và lắng nghe sự kiện OP_ACCEPT
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
            // Xử lý sự kiện kết nối mới
            ServerSocketChannel server = (ServerSocketChannel) key.channel();
            SocketChannel client = server.accept();
            client.configureBlocking(false);

            // Đăng ký kênh client vào Selector và lắng nghe sự kiện OP_READ
            client.register(selector, SelectionKey.OP_READ);
          } else if (key.isReadable()) {
            // Xử lý sự kiện đọc
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int bytesRead = client.read(buffer);

            if (bytesRead > 0) {
              buffer.flip();
              System.out.println("Dữ liệu nhận được: " +new String(buffer.array(), 0, bytesRead));
              // Lưu dữ liệu chờ gửi và lắng nghe sự kiện OP_WRITE
              key.attach(ByteBuffer.wrap("Hello, Client!".getBytes()));
              key.interestOps(SelectionKey.OP_WRITE);
            } else if (bytesRead < 0) {
              // Client ngắt kết nối
              client.close();
            }
          } else if (key.isWritable()) {
            // Xử lý sự kiện ghi
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buffer = (ByteBuffer) key.attachment();
            client.write(buffer);

            // Ghi non-blocking có thể chỉ ghi được một phần dữ liệu; chỉ chuyển về OP_READ sau khi đã ghi hết
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

Trong ví dụ trên, chúng ta tạo một server đơn giản lắng nghe trên cổng 8080, sử dụng Selector để xử lý các sự kiện kết nối, đọc và ghi. Khi nhận được dữ liệu từ client, server sẽ đọc dữ liệu, in ra console, sau đó phản hồi lại client chuỗi `"Hello, Client!"`.

## Zero-Copy trong NIO

Zero-Copy là một kỹ thuật phổ biến nhằm nâng cao hiệu năng cho các thao tác I/O; nhiều dự án mã nguồn mở hàng đầu như ActiveMQ, Kafka, RocketMQ, QMQ, Netty đều sử dụng Zero-Copy.

Zero-Copy có nghĩa là khi máy tính thực hiện thao tác I/O, CPU không cần phải sao chép dữ liệu từ vùng nhớ này sang vùng nhớ khác, nhờ đó giảm được số lần chuyển đổi ngữ cảnh (Context Switch) cũng như thời gian sao chép của CPU. Nói cách khác, Zero-Copy chủ yếu giải quyết vấn đề hệ điều hành phải sao chép dữ liệu liên tục khi xử lý các thao tác I/O. Các kỹ thuật triển khai Zero-Copy phổ biến gồm: `mmap+write`, `sendfile` và `sendfile + DMA gather copy`.

Bảng dưới đây so sánh các kỹ thuật Zero-Copy khác nhau:

|                            | CPU Copy | DMA Copy | System Call | Context Switch |
| -------------------------- | -------- | -------- | ----------- | -------------- |
| Phương pháp truyền thống   | 2        | 2        | read+write  | 4              |
| mmap+write                 | 1        | 2        | mmap+write  | 4              |
| sendfile                   | 1        | 2        | sendfile    | 2              |
| sendfile + DMA gather copy | 0        | 2        | sendfile    | 2              |

Có thể thấy rằng, dù là phương thức I/O truyền thống hay đã áp dụng Zero-Copy thì 2 lần sao chép DMA (Direct Memory Access) đều không thể tránh khỏi, bởi cả hai lần DMA đều do phần cứng thực hiện. Zero-Copy chủ yếu giúp cắt giảm số lần CPU Copy và Context Switch.

Hỗ trợ Zero-Copy trong Java:

- `MappedByteBuffer` là cơ chế tệp ánh xạ bộ nhớ (Memory-Mapped File) do Java NIO cung cấp, có thể ánh xạ một phần tệp tin trực tiếp vào bộ nhớ. Cơ chế bên dưới phụ thuộc vào hệ điều hành, ví dụ trên Linux thường dựa trên `mmap`.
- Phương thức `transferTo()/transferFrom()` của `FileChannel` có thể truyền trực tiếp các byte giữa các kênh với nhau; nhiều hệ điều hành có thể tối ưu hóa quá trình truyền này, ví dụ trên Linux có thể sử dụng `sendfile`. Triển khai cụ thể phụ thuộc vào JDK và hệ điều hành. Về cách sử dụng `FileChannel`, bạn có thể tham khảo bài viết này: [Cách sử dụng FileChannel trong Java NIO](https://www.cnblogs.com/robothy/p/14235598.html).

Ví dụ code:

```java
private void loadFileIntoMemory(File xmlFile) throws IOException {
  FileInputStream fis = new FileInputStream(xmlFile);
  // Tạo đối tượng FileChannel
  FileChannel fc = fis.getChannel();
  // FileChannel.map() ánh xạ tệp vào Direct Memory và trả về đối tượng MappedByteBuffer
  MappedByteBuffer mmb = fc.map(FileChannel.MapMode.READ_ONLY, 0, fc.size());
  xmlFileBuffer = new byte[(int)fc.size()];
  mmb.get(xmlFileBuffer);
  fis.close();
}
```

## Tổng kết

Trong bài viết này, chúng ta chủ yếu đã tìm hiểu các kiến thức cốt lõi của NIO, bao gồm các thành phần cốt lõi của NIO và kỹ thuật Zero-Copy.

Nếu cần sử dụng NIO để xây dựng các ứng dụng mạng, không khuyến khích dùng trực tiếp Java NIO thuần vì lập trình phức tạp và tính năng còn khá hạn chế; thay vào đó, nên sử dụng các framework lập trình mạng trưởng thành dựa trên NIO như Netty. Netty đã thực hiện nhiều tối ưu hóa và mở rộng trên nền tảng NIO, chẳng hạn hỗ trợ nhiều giao thức, hỗ trợ SSL/TLS, v.v.

## Tài liệu tham khảo

- Phân tích sơ lược Java NIO (Meituan Tech Blog): <https://tech.meituan.com/2016/11/04/nio.html>

- Người phỏng vấn: Bạn có nắm về Java NIO không?: <https://mp.weixin.qq.com/s/mZobf-U8OSYQfHfYBEB6KA>

- Java NIO: Buffer, Channel và Selector: <https://www.javadoop.com/post/java-nio>
