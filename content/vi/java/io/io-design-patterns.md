---
title: "Tổng kết Design Pattern trong Java IO"
description: "Phân tích chuyên sâu Design Pattern trong Java IO: giải thích chi tiết Decorator Pattern trong BufferedInputStream, cách cài đặt Adapter Pattern trong InputStreamReader và thiết kế Template Method Pattern trong InputStream, giúp hiểu rõ kiến trúc thư viện lớp Java IO."
category: Java
tag:
  - Java IO
  - Java cơ bản
head:
  - - meta
    - name: keywords
      content: Design Pattern Java IO,Decorator Pattern,Adapter Pattern,Template Method Pattern,FilterInputStream,Thiết kế luồng IO
lang: vi
sourceRef: zh-ref/java/io/io-design-patterns.md
---

Trong bài viết này, hãy cùng điểm qua những Design Pattern nào mà chúng ta có thể học hỏi từ Java IO.

## Decorator Pattern

**Decorator Pattern (Mẫu trang trí)** có thể mở rộng chức năng của một đối tượng hiện có mà không làm thay đổi đối tượng ban đầu.

Decorator Pattern sử dụng tổ hợp (composition) thay cho kế thừa (inheritance) để mở rộng chức năng của lớp gốc, và tỏ ra đặc biệt hữu ích trong các bối cảnh có quan hệ kế thừa phức tạp (quan hệ kế thừa giữa các lớp trong IO vốn rất phức tạp).

Đối với Byte Stream, `FilterInputStream` (tương ứng luồng nhập) và `FilterOutputStream` (tương ứng luồng xuất) là cốt lõi của Decorator Pattern, lần lượt được dùng để tăng cường chức năng cho các đối tượng thuộc lớp con của `InputStream` và `OutputStream`.

Những lớp quen thuộc như `BufferedInputStream` (Buffered Byte Input Stream), `DataInputStream`, v.v. đều là lớp con của `FilterInputStream`; còn `BufferedOutputStream` (Buffered Byte Output Stream), `DataOutputStream`, v.v. đều là lớp con của `FilterOutputStream`.

Ví dụ, chúng ta có thể dùng `BufferedInputStream` (Buffered Byte Input Stream) để tăng cường chức năng cho `FileInputStream`.

Constructor của `BufferedInputStream` như sau:

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

Có thể thấy, một trong các tham số trong constructor của `BufferedInputStream` chính là `InputStream`.

Ví dụ mã nguồn sử dụng `BufferedInputStream`:

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

Lúc này, có thể bạn sẽ nghĩ: **Tại sao chúng ta không tạo thẳng một lớp `BufferedFileInputStream` (luồng nhập file có bộ đệm) luôn cho xong?**

```java
BufferedFileInputStream bfis = new BufferedFileInputStream("input.txt");
```

Nếu số lượng lớp con của `InputStream` ít thì làm như vậy không có vấn đề gì. Tuy nhiên, `InputStream` có quá nhiều lớp con và quan hệ kế thừa lại quá phức tạp. Nếu với mỗi lớp con chúng ta đều phải thiết kế riêng một luồng nhập có bộ đệm tương ứng thì chẳng phải sẽ quá rườm rà hay sao?

Nếu bạn quen thuộc với các luồng IO, bạn sẽ thấy `ZipInputStream` và `ZipOutputStream` còn có thể tăng cường thêm khả năng cho `BufferedInputStream` và `BufferedOutputStream` tương ứng.

```java
BufferedInputStream bis = new BufferedInputStream(new FileInputStream(fileName));
ZipInputStream zis = new ZipInputStream(bis);

BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(fileName));
ZipOutputStream zipOut = new ZipOutputStream(bos);
```

`ZipInputStream` và `ZipOutputStream` lần lượt kế thừa từ `InflaterInputStream` và `DeflaterOutputStream`.

```java
public
class InflaterInputStream extends FilterInputStream {
}

public
class DeflaterOutputStream extends FilterOutputStream {
}

```

Đây cũng là một đặc trưng rất quan trọng của Decorator Pattern: có thể lồng ghép nhiều decorator lên cùng một lớp gốc.

Để đạt được hiệu quả này, các lớp decorator cần phải kế thừa cùng một lớp trừu tượng (abstract class) hoặc cài đặt cùng một interface với lớp gốc. Lớp cha chung của các lớp decorator và các lớp gốc trong IO được giới thiệu ở trên chính là `InputStream` và `OutputStream`.

Đối với Character Stream, `BufferedReader` có thể dùng để tăng cường chức năng cho các lớp con của `Reader` (luồng nhập ký tự), còn `BufferedWriter` có thể dùng để tăng cường chức năng cho các lớp con của `Writer` (luồng xuất ký tự).

```java
BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(fileName), "UTF-8"));
```

Ví dụ áp dụng Decorator Pattern trong luồng IO thực sự nhiều vô kể, hoàn toàn không cần phải học thuộc lòng! Một khi đã nắm được cốt lõi của Decorator Pattern, bạn sẽ tự nhiên nhận ra những chỗ nào đang áp dụng nó khi sử dụng.

## Adapter Pattern

**Adapter Pattern (Mẫu bộ chuyển đổi)** chủ yếu được dùng để điều phối các lớp có interface không tương thích để chúng làm việc cùng nhau; bạn có thể liên tưởng đến bộ chuyển đổi nguồn (power adapter) mà chúng ta vẫn dùng hằng ngày.

Trong Adapter Pattern, đối tượng hoặc lớp được chuyển đổi gọi là **Adaptee**, còn đối tượng hoặc lớp tác động lên Adaptee gọi là **Adapter**. Adapter được chia thành Object Adapter (bộ chuyển đổi đối tượng) và Class Adapter (bộ chuyển đổi lớp). Class Adapter được cài đặt bằng quan hệ kế thừa, còn Object Adapter được cài đặt bằng quan hệ tổ hợp.

Trong luồng IO, Character Stream và Byte Stream có interface khác nhau; việc chúng có thể phối hợp làm việc cùng nhau được thực hiện dựa trên Adapter Pattern — chính xác hơn là Object Adapter. Thông qua Adapter, chúng ta có thể chuyển đổi một đối tượng Byte Stream thành một đối tượng Character Stream, nhờ đó có thể đọc hoặc ghi dữ liệu ký tự trực tiếp thông qua đối tượng Byte Stream.

`InputStreamReader` và `OutputStreamWriter` chính là hai Adapter, đồng thời chúng cũng là cầu nối giữa Byte Stream và Character Stream. `InputStreamReader` sử dụng `StreamDecoder` để giải mã byte, **thực hiện chuyển đổi từ Byte Stream sang Character Stream**, còn `OutputStreamWriter` sử dụng `StreamEncoder` để mã hóa ký tự, thực hiện chuyển đổi từ Character Stream sang Byte Stream.

Các lớp con của `InputStream` và `OutputStream` là Adaptee, còn `InputStreamReader` và `OutputStreamWriter` là Adapter.

```java
// InputStreamReader là Adapter, FileInputStream là lớp được điều phối (Adaptee)
InputStreamReader isr = new InputStreamReader(new FileInputStream(fileName), "UTF-8");
// BufferedReader tăng cường chức năng cho InputStreamReader (Decorator Pattern)
BufferedReader bufferedReader = new BufferedReader(isr);
```

Một phần mã nguồn của `java.io.InputStreamReader`:

```java
public class InputStreamReader extends Reader {
    // Đối tượng dùng để giải mã (decode)
    private final StreamDecoder sd;
    public InputStreamReader(InputStream in) {
        super(in);
        try {
            // Lấy đối tượng StreamDecoder
            sd = StreamDecoder.forInputStreamReader(in, this, (String)null);
        } catch (UnsupportedEncodingException e) {
            throw new Error(e);
        }
    }
    // Dùng đối tượng StreamDecoder để thực hiện việc đọc cụ thể
    public int read() throws IOException {
        return sd.read();
    }
}
```

Một phần mã nguồn của `java.io.OutputStreamWriter`:

```java
public class OutputStreamWriter extends Writer {
    // Đối tượng dùng để mã hóa (encode)
    private final StreamEncoder se;
    public OutputStreamWriter(OutputStream out) {
        super(out);
        try {
           // Lấy đối tượng StreamEncoder
            se = StreamEncoder.forOutputStreamWriter(out, this, (String)null);
        } catch (UnsupportedEncodingException e) {
            throw new Error(e);
        }
    }
    // Dùng đối tượng StreamEncoder để thực hiện việc ghi cụ thể
    public void write(int c) throws IOException {
        se.write(c);
    }
}
```

**Adapter Pattern và Decorator Pattern có gì khác nhau?**

**Decorator Pattern** tập trung nhiều hơn vào việc mở rộng động chức năng của lớp gốc; lớp decorator cần phải kế thừa cùng một lớp trừu tượng hoặc cài đặt cùng một interface với lớp gốc. Ngoài ra, Decorator Pattern hỗ trợ lồng ghép nhiều decorator lên lớp gốc.

**Adapter Pattern** tập trung nhiều hơn vào việc giúp các lớp có interface không tương thích (không thể tương tác trực tiếp) có thể làm việc cùng nhau. Khi chúng ta gọi phương thức tương ứng của Adapter, bên trong Adapter sẽ gọi phương thức của lớp Adaptee hoặc các lớp liên quan, quá trình này hoàn toàn trong suốt đối với bên gọi. Ví dụ, `InputStreamReader` và `OutputStreamWriter` lần lượt chuyển đổi luồng nhập byte và luồng xuất byte thành luồng nhập ký tự và luồng xuất ký tự, đồng thời tự động hoàn tất việc mã hóa/giải mã giữa byte và ký tự ở bên trong.

```java
Reader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
```

Adapter và Adaptee không cần phải kế thừa cùng một lớp trừu tượng hay cài đặt cùng một interface.

Ngoài ra, lớp `FutureTask` cũng sử dụng Adapter Pattern: lớp nội bộ `RunnableAdapter` của `Executors` đóng vai trò là một Adapter dùng để chuyển đổi `Runnable` thành `Callable`.

Một constructor của `FutureTask` có tham số `Runnable`:

```java
public FutureTask(Runnable runnable, V result) {
    // Gọi phương thức callable của lớp Executors
    this.callable = Executors.callable(runnable, result);
    this.state = NEW;
}
```

Phương thức và Adapter tương ứng trong `Executors`:

```java
// Thực tế gọi constructor của lớp nội bộ RunnableAdapter trong Executors
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

Factory Pattern (Mẫu nhà máy) dùng để khởi tạo đối tượng, và trong NIO mẫu thiết kế này được sử dụng rất nhiều. Ví dụ, phương thức `newInputStream` của lớp `Files` dùng để tạo đối tượng `InputStream` (Static Factory), phương thức `get` của lớp `Paths` tạo đối tượng `Path` (Static Factory), và phương thức `getPath` của lớp `ZipFileSystem` (một lớp thuộc package `sun.nio`, là phần cài đặt nội bộ liên quan đến `java.nio`) tạo đối tượng `Path` (Simple Factory).

```java
InputStream is = Files.newInputStream(Paths.get(generatorLogoPath))
```

## Observer Pattern

Dịch vụ giám sát thư mục file trong NIO sử dụng Observer Pattern (Mẫu quan sát).

Dịch vụ giám sát thư mục file trong NIO dựa trên interface `WatchService` và interface `Watchable`. `WatchService` đóng vai trò là Observer (bên quan sát), còn `Watchable` đóng vai trò là Observable/Subject (bên được quan sát).

Interface `Watchable` định nghĩa phương thức `register` dùng để đăng ký đối tượng vào `WatchService` (dịch vụ giám sát) và gắn các sự kiện cần theo dõi.

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

`WatchService` dùng để theo dõi các thay đổi trong thư mục file; cùng một đối tượng `WatchService` có thể giám sát nhiều thư mục file cùng lúc.

```java
// Tạo đối tượng WatchService
WatchService watchService = FileSystems.getDefault().newWatchService();

// Khởi tạo đối tượng Path cho thư mục cần giám sát:
Path path = Paths.get("workingDirectory");
// Đăng ký đối tượng path này vào WatchService (dịch vụ giám sát)
WatchKey watchKey = path.register(
watchService, StandardWatchEventKinds...);
```

Tham số thứ hai `events` (các sự kiện cần giám sát) của phương thức `register` trong `Path` là tham số có độ dài biến thiên (varargs), tức là chúng ta có thể giám sát nhiều loại sự kiện cùng lúc.

```java
WatchKey register(WatchService watcher,
                  WatchEvent.Kind<?>... events)
    throws IOException;
```

Có 3 sự kiện giám sát thường dùng:

- `StandardWatchEventKinds.ENTRY_CREATE`: Tạo file.
- `StandardWatchEventKinds.ENTRY_DELETE`: Xóa file.
- `StandardWatchEventKinds.ENTRY_MODIFY`: Sửa file.

Phương thức `register` trả về đối tượng `WatchKey`; thông qua đối tượng `WatchKey` có thể lấy được thông tin chi tiết của sự kiện như file trong thư mục vừa được tạo, xóa hay sửa, và tên cụ thể của file được tạo, xóa hay sửa đó là gì.

```java
WatchKey key;
while ((key = watchService.take()) != null) {
    for (WatchEvent<?> event : key.pollEvents()) {
      // Có thể gọi các phương thức của đối tượng WatchEvent để xử lý, ví dụ như in ra thông tin ngữ cảnh cụ thể của sự kiện
    }
    key.reset();
}
```

Cài đặt cụ thể của `WatchService` phụ thuộc vào hệ thống file và Provider tầng dưới: bản cài đặt có thể sử dụng trực tiếp cơ chế sự kiện file gốc của hệ điều hành (native), hoặc hạ cấp xuống thành polling định kỳ. Dưới đây là mã nguồn rút gọn của bản cài đặt polling.

```java
class PollingWatchService
    extends AbstractWatchService
{
    // Định nghĩa một daemon thread để polling kiểm tra thay đổi file
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
      // Cập nhật các sự kiện giám sát
      this.events = events;

        // Bắt đầu polling định kỳ
      Runnable thunk = new Runnable() { public void run() { poll(); }};
      this.poller = scheduledExecutor
        .scheduleAtFixedRate(thunk, period, period, TimeUnit.SECONDS);
    }
  }
}
```

## Tài liệu tham khảo

- Patterns in Java APIs: <http://cecs.wright.edu/~tkprasad/courses/ceg860/paper/node26.html>
- Decorator Pattern: Học Decorator Pattern thông qua phân tích mã nguồn thư viện lớp Java IO: <https://time.geekbang.org/column/article/204845>
- Package `sun.nio` là gì, có phải là mã Java không? - RednaxelaFX <https://www.zhihu.com/question/29237781/answer/43653953>
