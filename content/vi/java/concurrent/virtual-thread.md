---
title: "Tổng hợp các câu hỏi thường gặp về Virtual Thread"
description: "Giải thích chi tiết Virtual Thread trên Java 21: tổng hợp vai trò của Virtual Threads, nguyên lý lập lịch, sự khác biệt với Platform Thread, kịch bản phù hợp, cách khởi tạo, giới hạn hiệu năng, cách tích hợp với Spring Boot và các lưu ý thực tiễn."
category: Java
tag:
  - Java Concurrency
head:
  - - meta
    - name: keywords
      content: Java Virtual Thread,Virtual Threads,Project Loom,Tính năng mới Java 21,Thread nhẹ,Coroutine,Nguyên lý Virtual Thread
lang: vi
sourceRef: zh-ref/java/concurrent/virtual-thread.md
---

Khi một yêu cầu Web đi vào, mã nguồn cần truy vấn cơ sở dữ liệu, gọi API từ xa, đọc ghi tệp. Theo cách viết đồng bộ truyền thống, yêu cầu này sẽ chiếm giữ một Platform Thread (luồng nền tảng), cho dù phần lớn thời gian chỉ đang chờ I/O.

Thread Pool giúp giảm bớt chi phí khởi tạo Thread, nhưng không thể thay đổi một thực tế: số lượng Platform Thread vẫn bị giới hạn bởi số lượng Thread của hệ điều hành, bộ nhớ và chi phí lập lịch. Khi lượng yêu cầu đồng thời tiếp tục tăng, các Thread trong Thread Pool sẽ bị lấp đầy bởi những tác vụ xếp hàng chờ, và thông lượng (throughput) nhanh chóng bị nghẽn lại.

Virtual Thread (luồng ảo) ra đời để giải quyết vấn đề này. Nó cho phép chúng ta tiếp tục viết mã chặn đồng bộ (synchronous blocking) đơn giản, đồng thời giúp các tác vụ đang chờ I/O không còn chiếm giữ lâu dài các Platform Thread đắt đỏ nữa.

## Virtual Thread là gì?

Virtual Thread (luồng ảo) là một loại Thread nhẹ được giới thiệu chính thức trong Java 21, đồng thời cũng là một cài đặt của `java.lang.Thread`. Nó do JDK quản lý và lập lịch, chứ không gắn trực tiếp 1:1 với một OS thread (luồng hệ điều hành) cụ thể.

Platform Thread thường là lớp bọc mỏng (thin wrapper) quanh OS thread. Khi một Platform Thread chạy, nó chiếm giữ một OS thread trong suốt vòng đời của mình. Virtual Thread thì khác: khi chạy mã Java, nó cần được gắn (mount) lên một Platform Thread nào đó; khi thực hiện một thao tác chặn có thể tạm ngưng (suspendable blocking operation), JDK có thể tháo (unmount) nó khỏi Platform Thread để Platform Thread đó đi thực thi các Virtual Thread khác.

Do đó, số lượng Virtual Thread có thể lớn hơn rất nhiều so với số lượng Platform Thread. Tài liệu chính thức lấy bộ nhớ ảo (virtual memory) làm ví dụ tương đồng: hệ điều hành ánh xạ một lượng lớn địa chỉ ảo vào bộ nhớ vật lý hữu hạn, còn Java runtime ánh xạ một lượng lớn Virtual Thread vào một số lượng ít Platform Thread.

Một số điểm then chốt về Virtual Thread:

- Virtual Thread vẫn là `Thread`, hỗ trợ `ThreadLocal`, ngắt (interruption), stack trace ngoại lệ, gỡ lỗi (debugging) và quan sát qua JFR.
- Virtual Thread phù hợp với các tác vụ có nhiều khoảng chờ chặn (blocking wait), như gọi HTTP, truy vấn cơ sở dữ liệu, truy cập Message Queue, I/O tệp hoặc mạng.
- Virtual Thread không phải là đơn vị thực thi CPU nhanh hơn, nên không làm một đoạn mã thuần tính toán chạy nhanh hơn.
- Virtual Thread rất rẻ; thông thường nên áp dụng mô hình "mỗi tác vụ một Virtual Thread", thay vì gom vào pool để tái sử dụng như Platform Thread.

## Virtual Thread và Platform Thread có mối quan hệ gì?

Trong Java, mối quan hệ giữa Virtual Thread, Platform Thread và OS thread đại khái như sau:

![Mối quan hệ giữa Virtual Thread, Platform Thread và Kernel Thread của hệ thống](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/virtual-threads-platform-threads-kernel-threads--57103066.png)

Trên các hệ điều hành phổ biến như Windows và Linux, Platform Thread của HotSpot JVM thường áp dụng mô hình luồng 1:1, tức một Platform Thread tương ứng với một OS thread. Sau khi Virtual Thread được đưa vào, JDK bổ sung thêm một tầng lập lịch phía trên Platform Thread:

- Virtual Thread là đối tượng mang tác vụ; `Thread.currentThread()` mà mã nghiệp vụ nhìn thấy sẽ trả về chính Virtual Thread đó.
- Platform Thread là Carrier Thread (luồng mang) của Virtual Thread, chịu trách nhiệm thực sự chạy mã Java bên trong Virtual Thread.
- Hệ điều hành vẫn chỉ lập lịch Platform Thread và không hề biết tới sự tồn tại của Virtual Thread.

Khi một Virtual Thread bắt đầu thực thi, bộ lập lịch của JDK sẽ mount nó lên một Platform Thread. Khi gặp điểm chặn hỗ trợ tạm ngưng như blocking I/O, `BlockingQueue.take()`, `Future.get()`, v.v., Virtual Thread có thể unmount, giải phóng Platform Thread để tiếp tục phục vụ các Virtual Thread khác. Khi thao tác chặn đã sẵn sàng, Virtual Thread được đưa trở lại bộ lập lịch và mount lên một Platform Thread để tiếp tục chạy.

Quá trình mount và unmount này hoàn toàn trong suốt đối với mã nghiệp vụ. Bạn vẫn viết mã đồng bộ thông thường:

```java
String body = httpClient.send(request, BodyHandlers.ofString()).body();
Result result = repository.query(body);
return service.handle(result);
```

Nếu bên trong các lời gọi này xảy ra thao tác chặn, Virtual Thread có thể tự tạm ngưng; còn nếu dùng Platform Thread, Thread này sẽ chiếm giữ liên tục OS thread tương ứng.

## Project Loom và Virtual Thread có mối quan hệ gì?

Project Loom là dự án trong OpenJDK nhằm cải tiến mô hình đồng thời của Java, và Virtual Thread là một trong những thành quả quan trọng nhất của Loom. Virtual Thread lần lượt xuất hiện ở dạng Preview trong JDK 19 và JDK 20, cuối cùng chính thức ổn định trong JDK 21 thông qua [JEP 444](https://openjdk.org/jeps/444).

Loom không chỉ thêm một API Thread nhẹ. Nó còn thúc đẩy việc điều chỉnh các năng lực đi kèm của JDK như blocking I/O, debugging, JFR, Thread Dump, giúp phong cách lập trình truyền thống thread-per-request (mỗi yêu cầu một luồng) có thể mở rộng trở lại trong các kịch bản I/O đồng thời cao.

Đây cũng là một điểm khác biệt quan trọng giữa Virtual Thread và các "thư viện Coroutine" thông thường: Virtual Thread được đưa vào chính mô hình Thread của nền tảng Java. Debugger, Profiler, JFR, Thread Dump đều có thể hiểu nó dưới dạng Thread, thay vì phải tách chuỗi lời gọi nghiệp vụ thành hàng loạt giai đoạn callback.

## Virtual Thread giải quyết vấn đề gì?

Nhiều ứng dụng phía server vốn rất tự nhiên với mô hình "mỗi yêu cầu một Thread". Ưu điểm của mô hình này rất rõ ràng: mã chạy tuần tự, ngoại lệ có thể ném dọc theo call stack, debugger có thể đi theo từng bước, và Thread Dump cũng cho thấy ngay yêu cầu đang bị kẹt ở đâu.

Vấn đề nằm ở chỗ Platform Thread quá đắt đỏ.

Giả sử một API có thời gian xử lý trung bình 50 ms và hệ thống cần đạt 2.000 QPS; ước tính sơ bộ theo định luật Little (Little's Law), cần xử lý đồng thời khoảng 100 yêu cầu. Nếu thời gian xử lý trung bình tăng lên 500 ms, cùng mức 2.000 QPS đó sẽ cần khoảng 1.000 yêu cầu đồng thời. Khi mỗi yêu cầu chiếm giữ một Platform Thread, số lượng Thread rất dễ trở thành điểm nghẽn trước cả CPU, băng thông mạng hay kết nối cơ sở dữ liệu.

Lập trình bất đồng bộ (Asynchronous) hay Reactive có thể giải phóng Thread khỏi việc chờ I/O, nhưng cái giá phải trả cũng rất rõ: chuỗi lời gọi bị chia nhỏ thành callback, chuỗi `CompletableFuture` hoặc pipeline reactive, khiến việc xử lý ngoại lệ, gỡ lỗi, flame graph và ngữ cảnh Thread đều trở nên phức tạp hơn.

Virtual Thread hướng tới việc giữ nguyên khả năng dễ đọc của mã đồng bộ, đồng thời giảm chi phí chiếm giữ Platform Thread khi chờ chặn. Thứ mà nó cải thiện chủ yếu là thông lượng và khả năng chịu tải đồng thời, chứ không phải tốc độ thực thi của một yêu cầu đơn lẻ.

## Virtual Thread phù hợp với những kịch bản nào?

Virtual Thread phù hợp nhất với nhóm tác vụ sau:

- Số lượng tác vụ đồng thời lớn, thường ở mức hàng nghìn đến hàng chục nghìn.
- Tác vụ dành phần lớn thời gian để chờ I/O, như cơ sở dữ liệu, Redis, gọi HTTP/RPC, Message Queue, đọc ghi tệp và mạng.
- Mã nguồn hiện có chủ yếu theo mô hình chặn đồng bộ và không muốn viết lại thành chuỗi bất đồng bộ phức tạp chỉ để mở rộng quy mô.
- Muốn giữ nguyên call stack truyền thống để thuận tiện cho việc debug, phân tích load test và điều tra sự cố trên production.

Các kịch bản tiêu biểu bao gồm:

- Các API Spring MVC / Servlet gọi cơ sở dữ liệu và dịch vụ HTTP bên ngoài.
- Các tác vụ chạy nền (background job) gọi hàng loạt API bên thứ ba.
- Gateway hoặc dịch vụ tổng hợp (aggregation service) gọi đồng thời nhiều dịch vụ downstream.
- Logic tiêu thụ tin nhắn (message consumer) có chứa thao tác ghi cơ sở dữ liệu dạng chặn hoặc gọi từ xa.

Virtual Thread không phù hợp để làm cho các tác vụ nặng về CPU (CPU-intensive) "chạy nhanh hơn". Nếu tác vụ chủ yếu tính hash, nén ảnh, sắp xếp mảng lớn, chạy rule engine phức tạp, thì khi số lượng Thread vượt quá số nhân CPU, thông lượng thường sẽ không tăng thêm nữa. Công việc CPU-intensive vẫn nên tập trung vào thuật toán, cấu trúc dữ liệu, xử lý theo lô (batching), parallel stream, Thread Pool tính toán chuyên biệt hoặc tối ưu hóa tầng native.

## Làm thế nào để khởi tạo Virtual Thread?

Trong JDK 21 có bốn cách khởi tạo phổ biến.

### Sử dụng `Thread.startVirtualThread()`

Phù hợp để khởi chạy nhanh một Virtual Thread đơn giản:

```java
public class VirtualThreadDemo {
  public static void main(String[] args) throws InterruptedException {
    Thread thread = Thread.startVirtualThread(() -> {
      System.out.println(Thread.currentThread());
    });

    thread.join();
  }
}
```

Cần lưu ý rằng Virtual Thread là Daemon Thread (luồng nền). Nếu phương thức `main` không chờ nó kết thúc, JVM có thể thoát ngay lập tức, dẫn đến tác vụ chưa kịp chạy xong.

### Sử dụng `Thread.ofVirtual()`

`Thread.ofVirtual()` trả về một `Thread.Builder.OfVirtual`, cho phép đặt tên Thread, cũng như chọn khởi chạy ngay sau khi tạo hoặc chưa khởi chạy vội:

```java
public class VirtualThreadDemo {
  public static void main(String[] args) throws InterruptedException {
    Thread unstarted = Thread.ofVirtual()
        .name("order-query")
        .unstarted(() -> System.out.println("query order"));

    unstarted.start();
    unstarted.join();

    Thread started = Thread.ofVirtual()
        .name("payment-query")
        .start(() -> System.out.println("query payment"));

    started.join();
  }
}
```

### Sử dụng `ThreadFactory`

Nếu bạn muốn đặt tên Thread thống nhất, hoặc truyền ThreadFactory vào cho framework sử dụng, có thể tạo Virtual Thread thông qua `ThreadFactory`:

```java
import java.util.concurrent.ThreadFactory;

public class VirtualThreadDemo {
  public static void main(String[] args) throws InterruptedException {
    ThreadFactory factory = Thread.ofVirtual()
        .name("worker-", 0)
        .factory();

    Thread thread = factory.newThread(() -> {
      System.out.println(Thread.currentThread().getName());
    });

    thread.start();
    thread.join();
  }
}
```

### Sử dụng `Executors.newVirtualThreadPerTaskExecutor()`

Đây là cách phổ biến nhất trong phát triển ứng dụng nghiệp vụ. Nó sẽ tạo một Virtual Thread mới cho mỗi tác vụ được gửi vào:

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class VirtualThreadDemo {
  public static void main(String[] args) throws Exception {
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      Future<String> future = executor.submit(() -> {
        return "hello virtual thread";
      });

      System.out.println(future.get());
    }
  }
}
```

Ở đây `ExecutorService` không phải là Thread Pool theo nghĩa truyền thống. Nó không duy trì một nhóm Virtual Thread cố định để tái sử dụng, mà tạo một Virtual Thread mới cho từng tác vụ. Khi khối `try-with-resources` kết thúc, `close()` sẽ được gọi để chờ các tác vụ đã gửi hoàn thành.

## Có nên gom Virtual Thread vào Pool không?

Không nên gom Virtual Thread vào pool.

Mục tiêu chính của Thread Pool là tái sử dụng các Platform Thread đắt đỏ và tiện thể giới hạn mức độ đồng thời. Bản thân Virtual Thread không phải tài nguyên khan hiếm, nên việc pool hóa chúng thường vô nghĩa, lại còn kéo mô hình "mỗi tác vụ một Thread" quay về lối mòn cũ.

Nếu mục tiêu thực sự của bạn là giới hạn số lượng truy cập đồng thời tới một tài nguyên nào đó, hãy giới hạn chính tài nguyên đó thay vì giới hạn số lượng Virtual Thread. Ví dụ, một hệ thống cũ tối đa chỉ chịu được 20 yêu cầu đồng thời, bạn có thể dùng `Semaphore` để kiểm soát đồng thời:

```java
import java.util.concurrent.Semaphore;

public class OldServiceClient {
  private static final Semaphore LIMIT = new Semaphore(20);

  public String call() throws InterruptedException {
    LIMIT.acquire();
    try {
      return doCall();
    } finally {
      LIMIT.release();
    }
  }

  private String doCall() {
    return "ok";
  }
}
```

Nếu điểm nghẽn là kết nối cơ sở dữ liệu, hãy điều chỉnh kích thước connection pool; nếu điểm nghẽn là giới hạn tốc độ (rate limit) của API downstream, hãy áp dụng rate limiting, circuit breaking và retry có backoff. Virtual Thread giúp việc chờ đợi trở nên rẻ hơn, nhưng không làm kết nối cơ sở dữ liệu, năng lực chịu tải downstream, CPU hay bộ nhớ trở thành vô hạn.

## So sánh hiệu năng giữa Virtual Thread và Platform Thread

Chốt kết luận trước: Virtual Thread không phải là "Thread chạy nhanh hơn", mà là "Thread có thể tạo ra với số lượng rất lớn và chi phí khi bị chặn thấp hơn nhiều". Nó thường nâng cao thông lượng cho các dịch vụ nặng về I/O, nhưng không rút ngắn thời gian xử lý của bản thân một câu truy vấn cơ sở dữ liệu hay một lần gọi HTTP.

Ví dụ dưới đây mô phỏng 10.000 tác vụ đều bị chặn 1 giây:

```java
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

public class VirtualThreadCompareDemo {
  public static void main(String[] args) {
    long start = System.currentTimeMillis();

    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
          Thread.sleep(Duration.ofSeconds(1));
          return i;
        });
      });
    }

    System.out.println("cost: " + (System.currentTimeMillis() - start) + "ms");
  }
}
```

Nếu thay bằng `Executors.newFixedThreadPool(200)`, tại cùng một thời điểm tối đa chỉ có 200 tác vụ thực thi, 10.000 tác vụ sẽ bị xử lý theo từng đợt. Ước tính thô mỗi đợt 1 giây thì tổng thời gian tiêu tốn sẽ tiệm cận 50 giây. Phiên bản Virtual Thread cho phép cả 10.000 tác vụ gần như đồng thời bước vào trạng thái chờ; các Platform Thread được giải phóng trong lúc chờ, nên tổng thời gian tiệm cận với thời gian chờ của một tác vụ đơn lẻ.

Ví dụ này chỉ minh họa rằng Virtual Thread rất thân thiện với "chờ chặn" (blocking wait), chứ không phải bài benchmark chặt chẽ. Một dịch vụ thực tế còn phụ thuộc vào database connection pool, HTTP client connection pool, rate limit ở downstream, GC, cấp phát đối tượng, tranh chấp khóa (lock contention), hạn mức CPU của container và nhiều yếu tố khác.

## Nguyên lý tầng dưới của Virtual Thread là gì?

Có thể chia quá trình thực thi của Virtual Thread thành ba phần: lập lịch (scheduling), gắn/tháo (mounting/unmounting) và quản lý Stack.

### Lập lịch (Scheduling)

Platform Thread phụ thuộc vào bộ lập lịch của hệ điều hành. Virtual Thread do bộ lập lịch riêng của JDK điều phối và được thực thi nhờ Platform Thread. Theo mô tả trong JEP 444, bộ lập lịch Virtual Thread là một `ForkJoinPool` theo cơ chế work-stealing chạy ở chế độ FIFO, tách biệt với common pool mà parallel stream sử dụng.

Mặc định, độ song song (parallelism) của bộ lập lịch liên quan đến số lượng bộ xử lý khả dụng và có thể điều chỉnh qua hai system property sau:

- `jdk.virtualThreadScheduler.parallelism`: Độ song song mục tiêu của bộ lập lịch.
- `jdk.virtualThreadScheduler.maxPoolSize`: Giới hạn tối đa số lượng Platform Thread mà bộ lập lịch có thể mở rộng thêm.

Phần lớn hệ thống nghiệp vụ không cần chỉnh hai tham số này. Ưu tiên kiểm tra connection pool, rate limit, khóa và các điểm chặn thường mang lại hiệu quả cao hơn so với việc chỉnh tham số bộ lập lịch.

### Mount và Unmount

Khi thực thi mã Java, Virtual Thread được mount lên một Platform Thread. Khi gặp thao tác chặn có hỗ trợ tạm ngưng, Virtual Thread có thể lưu trạng thái thực thi hiện tại rồi unmount, để Platform Thread tiếp tục phục vụ các Virtual Thread khác.

Các thao tác chặn phổ biến trong JDK đều đã được điều chỉnh để tương thích với Virtual Thread. Ví dụ: network I/O, `BlockingQueue`, `Future.get()`, v.v. khi bị chặn bên trong Virtual Thread thường sẽ không giữ chặt Platform Thread bên dưới trong thời gian dài.

Không phải mọi thao tác chặn đều có thể unmount. Từ JDK 21 đến JDK 23, khi Virtual Thread bị chặn bên trong khối lệnh hoặc phương thức `synchronized`, hiện tượng **Pinning** sẽ xảy ra, tức bị ghim chặt vào Carrier Thread. [JEP 491](https://openjdk.org/jeps/491) trong JDK 24 đã cải tiến điểm này, cho phép Virtual Thread khi bị chặn trong `synchronized` cũng có thể giải phóng Platform Thread bên dưới, loại bỏ phần lớn các tình huống Pinning do `synchronized` gây ra. Khi gọi phương thức native hoặc mã liên quan đến Foreign Function & Memory API, vẫn cần lưu ý các rủi ro Pinning còn sót lại.

### Quản lý Stack

Platform Thread thường dùng OS thread stack có kích thước cố định. Stack của Virtual Thread được lưu trên Java Heap dưới dạng các đối tượng stack chunk (khối stack), có thể tự mở rộng và thu hẹp theo quá trình thực thi. Đây là một trong những lý do quan trọng giúp Virtual Thread có thể được tạo với số lượng cực lớn.

Tuy nhiên, điều này không có nghĩa Virtual Thread không tốn bộ nhớ. Mỗi Virtual Thread vẫn là một đối tượng, vẫn có chi phí bộ nhớ cho stack chunk, biến cục bộ, `ThreadLocal`, v.v. Hàng triệu Virtual Thread không hề miễn phí, chỉ là khả thi hơn rất nhiều so với hàng triệu Platform Thread.

## Pinning là gì?

Có thể hiểu Pinning là tình trạng "Virtual Thread tạm thời không thể unmount khỏi Carrier Thread". Sau khi Virtual Thread bị ghim vào một Platform Thread, trong thời gian bị chặn nó sẽ kéo theo OS thread bên dưới bị chiếm giữ luôn, làm khả năng mở rộng giảm sút theo.

Trong JDK 21 đến JDK 23, kịch bản Pinning điển hình nhất là: Virtual Thread thực hiện blocking I/O bên trong khối lệnh hoặc phương thức `synchronized`.

```java
public synchronized String load() throws IOException {
  return remoteClient.get("/config"); // Trong JDK 21-23, block tại đây có thể gây pin carrier thread
}
```

Các khối `synchronized` ngắn và thuần thao tác trong bộ nhớ nhìn chung không đáng lo. Điều thực sự cần chú ý là giữ khóa để thực thi I/O chậm trên đường dẫn tần suất cao, ví dụ vừa giữ object lock vừa truy vấn cơ sở dữ liệu, gọi API từ xa hoặc đọc tệp lớn.

Nếu bạn đang sử dụng JDK 21 đến JDK 23, hãy cân nhắc:

- Tránh thực hiện I/O chậm bên trong `synchronized`.
- Với các kịch bản giữ khóa có thao tác chặn tần suất cao, sử dụng `ReentrantLock` và giải phóng khóa bằng `try/finally`.
- Quan sát sự kiện `jdk.VirtualThreadPinned` thông qua JFR.
- Tạm thời bật `-Djdk.tracePinnedThreads=full` để định vị call stack bị ghim.

Nếu bạn đang dùng JDK 24 trở lên, vấn đề Pinning chính do `synchronized` gây ra đã được JEP 491 giải quyết. Việc chọn giữa `synchronized` hay `java.util.concurrent.locks` có thể quay về đánh giá dựa trên ngữ nghĩa mã nguồn, tính dễ bảo trì và năng lực của từng loại khóa.

## Cần lưu ý những gì khi sử dụng Virtual Thread?

### Đừng coi Virtual Thread là công cụ tăng tốc CPU

Virtual Thread cải thiện khả năng chịu tải đồng thời cho các tác vụ thiên về chờ đợi. Các tác vụ CPU-intensive cuối cùng vẫn phải tranh giành CPU timeslice; dù có tạo bao nhiêu Virtual Thread đi nữa cũng không thể vượt qua giới hạn vật lý của số nhân CPU.

### Đừng giới hạn Virtual Thread theo tư duy Thread Pool

Đừng tạo pool Virtual Thread với số lượng cố định. Khi cần giới hạn mức độ đồng thời, hãy dùng `Semaphore`, connection pool, rate limiter hoặc dung lượng hàng đợi để giới hạn chính tài nguyên cụ thể.

### Cẩn thận khi dùng `ThreadLocal` để cache đối tượng lớn

Bản chính thức Java 21 đảm bảo Virtual Thread hỗ trợ `ThreadLocal`, điều này giúp tương thích tốt với mã nguồn và framework cũ. Nhưng đừng dùng `ThreadLocal` để cache đối tượng lớn cho từng Virtual Thread.

Trước đây trong Thread Pool, một `ThreadLocal<SimpleDateFormat>` có thể chỉ tương ứng với vài chục hoặc vài trăm Platform Thread. Sau khi chuyển sang Virtual Thread, nếu mỗi tác vụ là một Virtual Thread, cùng cách viết đó có thể biến thành mỗi tác vụ tạo một bản sao đối tượng cache, làm phóng đại áp lực bộ nhớ và cấp phát đối tượng.

Nếu chỉ dùng để truyền request context, user ID, Trace ID thì thường không sao. Nhưng nếu dùng để cache kết nối cơ sở dữ liệu, mảng lớn, formatter phức tạp hoặc đối tượng client thì cần đánh giá lại. JDK 25 đã đưa Scoped Values lên chính thức thông qua JEP 506, phù hợp hơn để truyền ngữ cảnh bất biến giữa số lượng lớn Virtual Thread.

### Virtual Thread không xóa bỏ vấn đề an toàn luồng (Thread Safety)

Virtual Thread giúp việc tạo Thread trở nên rẻ hơn, đồng nghĩa với việc bạn dễ chạy đồng thời lượng lớn tác vụ cùng lúc hơn. Những lỗi data race vốn trước đây chưa lộ ra do Thread Pool nhỏ có thể dễ dàng bộc lộ hơn khi chuyển sang Virtual Thread.

Vẫn cần tuân thủ các nguyên tắc cơ bản của lập trình đồng thời: trạng thái có thể thay đổi được dùng chung (shared mutable state) phải được khóa hoặc cô lập; kết nối cơ sở dữ liệu, đối tượng session, client không an toàn luồng không được để nhiều Virtual Thread dùng chung bừa bãi.

### Chú ý Connection Pool và năng lực chịu tải của downstream

Sau khi chuyển một dịch vụ sang Virtual Thread, điểm nghẽn đầu tiên thường không còn là Thread Pool nghiệp vụ nữa, mà là database connection pool, HTTP connection pool, số kết nối Redis hoặc rate limit của downstream.

Đây không phải lỗi của Virtual Thread. Virtual Thread chỉ giúp nhiều tác vụ có cơ hội cùng tiến triển, còn tài nguyên dùng chung thực tế vẫn phải quản lý theo dung lượng. Khi load test nên theo dõi đồng thời:

- QPS, thời gian phản hồi và tỷ lệ lỗi của ứng dụng.
- Số kết nối đang hoạt động (active connections), hàng đợi chờ và số lần timeout của database connection pool.
- HTTP client connection pool và mã lỗi 429/5xx từ downstream.
- CPU, bộ nhớ Heap, GC và tốc độ cấp phát đối tượng.
- Các sự kiện Virtual Thread và lock contention trong JFR.

### Đừng trộn lẫn quá nhiều mô hình bất đồng bộ

Virtual Thread phù hợp nhất với mã chặn đồng bộ. Những hệ thống đã viết bất đồng bộ toàn chuỗi bằng Reactive/WebFlux/Netty chưa chắc đạt được lợi ích rõ rệt chỉ bằng cách bật Virtual Thread.

Rắc rối hơn là trộn lẫn mô hình: lớp ngoài là Virtual Thread, bên trong lại dùng dày đặc async callback và Thread Pool, đến lúc xử lý sự cố có thể phải đối mặt cùng lúc với vài tầng ngữ cảnh gồm Virtual Thread, Event Loop, Thread Pool nghiệp vụ và Connection Pool. Khi chuyển đổi, tốt nhất nên chọn thí điểm trên các luồng xử lý chặn đồng bộ trước, thay vì bật thay thế toàn hệ thống trong một lần.

## Làm thế nào để chuyển đổi từ Thread Pool truyền thống sang Virtual Thread?

Đối với mã chặn đồng bộ hiện có, các cách dùng như `submit()` và `Future.get()` thường có thể giữ nguyên. Khi chuyển đổi, cần kiểm tra xem Thread Pool cũ còn đảm nhận những trách nhiệm nào khác, ví dụ như giới hạn đồng thời downstream, kiểm soát số lượng tác vụ xếp hàng hay từ chối yêu cầu khi quá tải.

[Hướng dẫn chuyển đổi sang Virtual Thread](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html) của Oracle đưa ra cách làm tương ứng: tạo một Virtual Thread cho mỗi tác vụ, và dùng các công cụ như `Semaphore` để kiểm soát đồng thời khi truy cập tài nguyên bị giới hạn.

### Trước khi chuyển đổi: dùng Platform Thread Pool thực thi lời gọi HTTP

Giả sử ứng dụng dùng chung một Thread Pool chuyên gọi một dịch vụ downstream, dùng tối đa 20 Platform Thread và hàng đợi chứa tối đa 100 tác vụ. Dưới đây chỉ minh họa phần gửi tác vụ và lấy kết quả, lược bỏ phần import, khởi tạo HTTP client, xử lý ngoại lệ và giải phóng tài nguyên khi tắt ứng dụng:

```java
ExecutorService executor = new ThreadPoolExecutor(
    20, 20,
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(100),
    Thread.ofPlatform().name("remote-call-", 0).factory(),
    new ThreadPoolExecutor.AbortPolicy());

Future<String> future = executor.submit(() ->
    httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body());

String body = future.get(3, TimeUnit.SECONDS);
```

Ở đây 20 Thread cũng đồng thời giới hạn số lời gọi chạy song song. Khi toàn bộ Thread đều bận, tác vụ mới đi vào hàng đợi; khi hàng đợi cũng đầy, `AbortPolicy` sẽ ném ra `RejectedExecutionException`.

Nếu thay trực tiếp Thread Pool này bằng `Executors.newVirtualThreadPerTaskExecutor()`, các giới hạn về độ đồng thời và xếp hàng ban đầu sẽ biến mất. [Tài liệu API của `Executors`](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html#newVirtualThreadPerTaskExecutor()>) nêu rõ Executor này không giới hạn số lượng Virtual Thread được tạo, ứng dụng vẫn chịu ràng buộc bởi các tài nguyên như CPU và bộ nhớ.

### Sau khi chuyển đổi: mỗi tác vụ một Virtual Thread, giới hạn riêng độ đồng thời downstream

Ví dụ dưới đây sử dụng API chính thức của Java 21, giữ nguyên lời gọi HTTP đồng bộ và `Future`, dùng `Semaphore` để giới hạn cục bộ số lời gọi downstream chạy cùng lúc. Con số 20 permit, thời gian chờ 200 ms và các mốc timeout phía sau chỉ là giá trị minh họa; thực tế cần cấu hình theo sức chịu tải của downstream và thời gian phản hồi của API. Ví dụ trả về trực tiếp phần body phản hồi, trong nghiệp vụ thực tế còn cần xử lý kết quả dựa theo HTTP status code.

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class RemoteServiceClient implements AutoCloseable {
  private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
  private final Semaphore limit = new Semaphore(20);
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(1))
      .build();

  public String fetch(URI uri)
      throws InterruptedException, ExecutionException, TimeoutException {
    Future<String> future = executor.submit(() -> {
      if (!limit.tryAcquire(200, TimeUnit.MILLISECONDS)) {
        throw new RejectedExecutionException("等待下游调用许可超时");
      }

      try {
        HttpRequest request = HttpRequest.newBuilder(uri)
            .timeout(Duration.ofSeconds(2))
            .GET()
            .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
      } finally {
        limit.release();
      }
    });

    try {
      return future.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException | InterruptedException e) {
      future.cancel(true);
      throw e;
    }
  }

  @Override
  public void close() {
    executor.close();
    httpClient.close();
  }
}
```

Các lời gọi tới cùng một downstream cần dùng chung một thực thể `RemoteServiceClient` này, chẳng hạn giao cho Spring quản lý dưới dạng singleton Bean và gọi `close()` khi tắt ứng dụng. Nếu mỗi yêu cầu lại tạo một thực thể mới thì mỗi cái sẽ có 20 permit riêng, không đạt được tác dụng giới hạn đồng thời thống nhất. Khi ứng dụng triển khai nhiều instance, số permit của mỗi instance cũng độc lập với nhau.

Khi xin permit thất bại, `RejectedExecutionException` bên trong tác vụ sẽ bị bọc vào trong `ExecutionException`, phía gọi có thể dùng `getCause()` để kiểm tra nguyên nhân. Vị trí xử lý của nó khác với ngoại lệ từ chối được ném trực tiếp ngay lúc gửi tác vụ trước khi chuyển đổi.

Ví dụ này đã giới hạn độ đồng thời của lời gọi và đặt timeout cho việc chờ permit, nhưng chưa giữ lại giới hạn cũ là tối đa 100 tác vụ xếp hàng chờ. Khi lượng yêu cầu ồ ạt đổ về trong thời gian ngắn, hệ thống vẫn có thể tạo ra rất nhiều Virtual Thread đang chờ permit. Những hệ thống trước đây dựa vào hàng đợi có giới hạn (bounded queue) để bảo vệ bộ nhớ vẫn cần giới hạn số yêu cầu đang xử lý ngay ở cửa ngõ vào (ingress), hoặc sử dụng hàng đợi có ngưỡng trần, từ chối nhanh để xử lý quá tải.

### Cần lưu ý thêm gì về Timeout và hủy tác vụ?

[`Future.get(3, TimeUnit.SECONDS)`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html) bắt đầu tính thời gian chờ từ thời điểm gọi `get()`, sau khi hết giờ thì tác vụ vẫn có thể đang chạy. Khi chờ quá giờ hoặc phía gọi bị ngắt, ví dụ trên gọi `future.cancel(true)` để thử hủy tác vụ rồi mới ném ngoại lệ lên tầng trên. Platform Thread Pool cũng cần xử lý cả hai tình huống này.

Ở đây chỉ cần ném tiếp `InterruptedException` là được; nếu bắt lại mà không thể ném tiếp, thông thường cần dùng `Thread.currentThread().interrupt()` để khôi phục cờ ngắt (interrupt flag), tránh làm tầng trên mất tín hiệu ngắt.

Các mốc timeout trong ví dụ có điểm xuất phát khác nhau: 200 ms dùng để chờ permit, connect timeout và HTTP request timeout do HTTP client xử lý, còn 3 giây dùng để chờ kết quả của toàn bộ tác vụ — trong đó có thể bao gồm cả thời gian chờ permit và lời gọi HTTP. Khoảng thời gian của chúng có thể chồng lấn lên nhau nên không thể cộng dồn trực tiếp. Khi liên quan đến nhiều lời gọi downstream, còn phải phân bổ ngân sách timeout theo thời gian còn lại của yêu cầu.

Ngoại lệ cũng cần phân biệt rõ: hết giờ chờ ở `get()` sẽ ném trực tiếp `TimeoutException`; còn `HttpTimeoutException` do [`HttpRequest.Builder.timeout()`](<https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html#timeout(java.time.Duration)>) kích hoạt xảy ra bên trong tác vụ, nên phía gọi nhận được `ExecutionException` bọc lấy nó. Nếu chỉ bắt `TimeoutException`, bạn sẽ không bắt được timeout yêu cầu từ HTTP client.

`cancel(true)` phụ thuộc vào việc tác vụ có phản hồi tín hiệu ngắt hay không, nên không đảm bảo tác vụ dừng lại ngay lập tức. [Cài đặt `HttpClient.send()` mặc định của JDK](<https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html#send(java.net.http.HttpRequest,java.net.http.HttpResponse.BodyHandler)>) khi bị ngắt sẽ thử hủy phiên trao đổi HTTP, nhưng yêu cầu có thể đã gửi tới server và nghiệp vụ ở đầu xa vẫn có thể tiếp tục chạy. Khi chuyển sang JDBC driver hoặc SDK bên thứ ba, cần đối chiếu hành vi timeout và ngắt của chúng; nếu liên quan đến thao tác ghi, cần cân nhắc thêm tính lũy đẳng (idempotency).

Ngoài ra, [`ExecutorService.close()`](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html#close()>) sẽ chờ các tác vụ đã gửi kết thúc. Nếu tạo Executor bằng `try-with-resources` ngay bên trong một yêu cầu đơn lẻ, ngay cả khi `get()` đã hết giờ, lúc thoát khỏi khối mã lệnh vẫn có thể phải chờ tiếp. Ví dụ trên tái sử dụng Executor làm thành viên của client và giải phóng tập trung khi tắt ứng dụng. Bản thân `close()` không có giới hạn thời gian chờ, nên với các dịch vụ có yêu cầu về thời gian dừng (shutdown time), cần thiết kế thêm quy trình tắt có timeout.

## Spring Boot bật Virtual Thread như thế nào?

Từ Spring Boot 3.2 đã cung cấp công tắc bật khá trực tiếp. Khi sử dụng Java 21 trở lên, bạn có thể bật trong cấu hình:

```properties
spring.threads.virtual.enabled=true
```

Tài liệu chính thức của Spring Boot cũng đề cập vài điểm thực hành:

- Sau khi bật Virtual Thread, một số thuộc tính cấu hình kích thước Thread Pool truyền thống sẽ không còn tác dụng theo cách cũ, vì việc lập lịch Virtual Thread dựa vào Thread Pool Platform ở phạm vi toàn JVM.
- Virtual Thread là Daemon Thread. Nếu ứng dụng phụ thuộc vào các tác vụ nền như `@Scheduled` để giữ JVM tiếp tục sống, nên cấu hình thêm `spring.main.keep-alive=true`.
- Đội ngũ Spring Boot hiện khuyến nghị sử dụng Java 24 trở lên để có trải nghiệm Virtual Thread tốt hơn, chủ yếu liên quan đến các cải tiến về Pinning.

Một cấu hình đơn giản như sau:

```yaml
spring:
  threads:
    virtual:
      enabled: true
  main:
    keep-alive: true
```

Sau khi bật lên, không có nghĩa mọi API đều sẽ nhanh hơn. Nó có khả năng cải thiện nhiều hơn đối với các API chặn đồng bộ, chờ I/O rõ rệt và có mức đồng thời cao. Nếu API chủ yếu tốn thời gian ở CPU, tranh chấp khóa, bản thân câu SQL chậm hoặc rate limit ở downstream, thì Virtual Thread chỉ làm vấn đề lộ ra sớm hơn mà thôi.

## Làm thế nào để điều tra sự cố liên quan đến Virtual Thread?

JDK đã bổ sung khá nhiều khả năng quan sát cho Virtual Thread.

### Dùng `jcmd` xuất Thread Dump

`jstack` truyền thống không phù hợp khi đối mặt với hàng chục nghìn Virtual Thread. JDK đã cung cấp năng lực xuất Thread Dump mới:

```bash
jcmd <pid> Thread.dump_to_file -format=json thread-dump.json
```

Cũng có thể xuất dưới định dạng văn bản:

```bash
jcmd <pid> Thread.dump_to_file -format=text thread-dump.txt
```

Định dạng JSON phù hợp hơn cho công cụ phân tích, đặc biệt khi số lượng Virtual Thread rất lớn.

### Dùng JFR quan sát các sự kiện Virtual Thread

Các sự kiện liên quan đến Virtual Thread trong JFR bao gồm:

- `jdk.VirtualThreadStart`
- `jdk.VirtualThreadEnd`
- `jdk.VirtualThreadPinned`
- `jdk.VirtualThreadSubmitFailed`

Trong đó `jdk.VirtualThreadPinned` rất hữu ích để điều tra Pinning. Từ JDK 24 trở đi, phần lớn Pinning liên quan tới `synchronized` đã được giải quyết, nhưng các tình huống còn lại như native/FFM vẫn có thể quan sát qua JFR.

### Tạm thời bật dấu vết stack Pinning

Trong JDK 21 đến JDK 23, có thể tạm thời dùng:

```bash
-Djdk.tracePinnedThreads=full
```

Nó sẽ in ra call stack khi Virtual Thread bị chặn và bị ghim, phù hợp để định vị vấn đề ở môi trường local hoặc môi trường test. Sau JEP 491 của JDK 24, các kịch bản Pinning chính liên quan đến `synchronized` đã được cải thiện; đối với các ranh giới còn lại như native/FFM, vẫn nên kết hợp JFR và Thread Dump để đánh giá.

## Câu hỏi phỏng vấn thường gặp về Virtual Thread

### Virtual Thread và Platform Thread khác nhau ở điểm nào?

Platform Thread thường tương ứng 1:1 với OS thread, chi phí tạo và Context Switch cao, số lượng hữu hạn. Virtual Thread do JDK lập lịch, có thể ánh xạ số lượng lớn Virtual Thread lên số lượng ít Platform Thread. Khi Virtual Thread bị chặn chờ I/O, nó thường có thể unmount khỏi Carrier Thread để Platform Thread tiếp tục chạy các Virtual Thread khác.

### Vì sao Virtual Thread phù hợp với tác vụ I/O-intensive?

Tác vụ I/O-intensive dành phần lớn thời gian để chờ tài nguyên bên ngoài. Khi chờ, Platform Thread sẽ chiếm giữ OS thread; còn Virtual Thread khi chờ có thể tự tạm ngưng và giải phóng Carrier Thread. Nhờ đó cùng một số lượng Platform Thread có thể gánh được nhiều tác vụ đồng thời hơn.

### Virtual Thread có phù hợp với tác vụ CPU-intensive không?

Không phù hợp để coi làm công cụ tăng tốc CPU. Tác vụ CPU-intensive cần thời gian CPU thực sự; số Thread vượt quá số nhân CPU chỉ làm tăng tranh chấp lập lịch. Virtual Thread cải thiện khả năng chờ đồng thời cao, chứ không làm một tác vụ tính toán đơn lẻ chạy nhanh hơn.

### Virtual Thread có cần pool hóa không?

Không cần và cũng không khuyến nghị. Virtual Thread rất rẻ, nên được tạo theo từng tác vụ. Khi cần giới hạn mức đồng thời, hãy giới hạn chính tài nguyên cụ thể như database connection pool, HTTP connection pool, `Semaphore`, rate limiter, thay vì pool hóa Virtual Thread.

### Virtual Thread có giống Coroutine không?

Chúng đều thuộc hướng tiếp cận đồng thời nhẹ (lightweight concurrency), nhưng Java Virtual Thread là một cài đặt của `java.lang.Thread`, được tích hợp vào mô hình Thread sẵn có của Java. Mã nghiệp vụ không cần viết `async/await` và cũng không cần gọi yield thủ công. So với goroutine của Go, Virtual Thread nhấn mạnh hơn vào tính tương thích với Thread API có sẵn của Java, các công cụ debug và phong cách viết mã dạng chặn. Với lập trình viên, nó giống như "những Thread rẻ hơn rất nhiều".

### Sau khi có Virtual Thread thì có còn cần lập trình Reactive không?

Tùy kịch bản. Nhiều API phía server chạy theo kiểu chặn đồng bộ có thể đạt được khả năng dễ đọc tốt hơn và đủ thông lượng nhờ Virtual Thread, không cần viết chuỗi callback phức tạp chỉ để giải phóng Thread. Tuy nhiên, Reactive vẫn phù hợp cho xử lý luồng dữ liệu (streaming), backpressure, hướng sự kiện (event-driven), kết nối dài hạn và các hệ thống vốn đã bất đồng bộ toàn chuỗi. Virtual Thread không phải viên đạn bạc thay thế mọi mô hình bất đồng bộ.

### `synchronized` trong JDK 21 còn dùng được không?

Vẫn dùng được, nhưng cần chú ý giới hạn. Trong JDK 21 đến JDK 23, việc Virtual Thread thực hiện thao tác chặn bên trong `synchronized` có thể gây ra Pinning. Đồng bộ bộ nhớ ngắn gọn không thành vấn đề, nhưng trên đường dẫn tần suất cao không nên vừa giữ khóa `synchronized` vừa thực hiện I/O chậm. Sau khi JDK 24 cải tiến qua JEP 491, Pinning liên quan đến `synchronized` cơ bản đã được giải quyết.

## Tài liệu tham khảo

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [Oracle Java 21 Documentation: Virtual Threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [Java 21 API: Executors](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html)
- [Java 21 API: Future](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html)
- [Java 21 API: ExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)
- [Java 21 API: HttpClient](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html)
- [Java 21 API: HttpRequest.Builder](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html)
- [JEP 491: Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)
- [JEP 506: Scoped Values](https://openjdk.org/jeps/506)
- [Spring Boot Reference Documentation: Virtual threads](https://docs.spring.io/spring-boot/reference/features/spring-application.html#features.spring-application.virtual-threads)
- [Spring Blog: Embracing Virtual Threads](https://spring.io/blog/2022/10/11/embracing-virtual-threads/)
- [Inside Java: Managing Throughput with Virtual Threads](https://inside.java/2024/02/04/sip094/)
- [Quarkus Blog: When Quarkus meets Virtual Threads](https://quarkus.io/blog/virtual-thread-1/)
