---
title: Giải thích chi tiết về Thread Pool trong Java
description: "Giải thích chi tiết về Thread Pool trong Java: phân tích chuyên sâu cấu hình các tham số cốt lõi của ThreadPoolExecutor, hệ thống Executor Framework, lựa chọn hàng đợi tác vụ, chính sách từ chối, nguyên lý hoạt động của Thread Pool và các best practices."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/java-thread-pool-summary.md
head:
  - - meta
    - name: keywords
      content: Java Thread Pool,ThreadPoolExecutor,Executor Framework,Tham số Thread Pool,Rejection Policy,Task Queue,Nguyên lý Thread Pool
---

<!-- markdownlint-disable MD024 -->

Kỹ thuật pooling hẳn đã quá quen thuộc với mọi người — Thread Pool, Database Connection Pool, HTTP Connection Pool... đều là những ứng dụng của tư tưởng này. Tư tưởng cốt lõi của kỹ thuật pooling chủ yếu nhằm giảm chi phí cho mỗi lần cấp phát tài nguyên và nâng cao hiệu suất sử dụng tài nguyên.

Trong bài viết này, tôi sẽ giới thiệu chi tiết các khái niệm cơ bản cũng như nguyên lý cốt lõi của Thread Pool.

## Giới thiệu về Thread Pool

Kỹ thuật pooling hẳn đã quá quen thuộc với mọi người — Thread Pool, Database Connection Pool, HTTP Connection Pool... đều là những ứng dụng của tư tưởng này. Tư tưởng cốt lõi của kỹ thuật pooling chủ yếu nhằm giảm chi phí cho mỗi lần cấp phát tài nguyên và nâng cao hiệu suất sử dụng tài nguyên.

Thread Pool cung cấp một cách thức để giới hạn và quản lý tài nguyên (bao gồm cả việc thực thi một tác vụ). Mỗi Thread Pool cũng duy trì một số thông tin thống kê cơ bản, chẳng hạn như số lượng tác vụ đã hoàn thành. Sử dụng Thread Pool mang lại những lợi ích chính sau đây:

1. **Giảm tiêu hao tài nguyên**: Các `Thread` trong Thread Pool có thể được tái sử dụng. Một khi thread hoàn thành một tác vụ nào đó, nó sẽ không bị hủy ngay lập tức mà quay trở lại pool để chờ tác vụ tiếp theo. Điều này giúp tránh chi phí phát sinh do việc tạo và hủy thread liên tục.
2. **Tăng tốc độ phản hồi**: Vì Thread Pool thường duy trì một số lượng nhất định các core thread (hay còn gọi là "công nhân thường trực"), khi có tác vụ mới đến, tác vụ đó có thể được giao ngay cho những thread nhàn rỗi đã tồn tại này thực thi, lược bỏ được thời gian tạo thread và giúp tác vụ được xử lý nhanh hơn.
3. **Nâng cao khả năng quản lý thread**: Thread Pool cho phép chúng ta quản lý thống nhất các thread bên trong pool. Chúng ta có thể cấu hình kích thước của Thread Pool (`corePoolSize`, `maximumPoolSize`), loại và kích thước hàng đợi tác vụ (task queue), Rejection Policy (chính sách từ chối), v.v. Nhờ đó có thể kiểm soát tổng số lượng thread chạy đồng thời, ngăn ngừa cạn kiệt tài nguyên và đảm bảo tính ổn định của hệ thống. Đồng thời, Thread Pool thường cung cấp các giao diện giám sát (monitoring), giúp chúng ta dễ dàng nắm bắt trạng thái vận hành của Thread Pool (chẳng hạn như có bao nhiêu thread đang hoạt động, bao nhiêu tác vụ đang xếp hàng chờ...) để thuận tiện cho việc tinh chỉnh (tuning).

## Giới thiệu về Executor Framework

`Executor` Framework được giới thiệu từ Java 5. Kể từ Java 5 trở đi, việc khởi chạy thread thông qua `Executor` tốt hơn nhiều so với việc dùng phương thức `start` của `Thread`: ngoài việc dễ quản lý hơn và hiệu quả hơn (triển khai bằng Thread Pool giúp tiết kiệm chi phí), còn có một điểm then chốt nữa là giúp tránh vấn đề thoát tham chiếu `this` (`this` escape).

> `this` escape đề cập đến tình huống các thread khác đã nắm giữ tham chiếu tới một đối tượng trước khi hàm tạo (constructor) của nó kết thúc trả về; việc gọi phương thức trên một đối tượng chưa được khởi tạo hoàn chỉnh có thể gây ra những lỗi khó hiểu.

`Executor` Framework không chỉ bao gồm việc quản lý Thread Pool, mà còn cung cấp `ThreadFactory`, hàng đợi (queue), Rejection Policy, v.v., giúp việc lập trình đồng thời (concurrent programming) trở nên đơn giản hơn nhiều.

Cấu trúc của `Executor` Framework chủ yếu gồm ba phần chính:

**1. Tác vụ (`Runnable` / `Callable`)**

Để thực thi tác vụ, cần triển khai **interface `Runnable`** hoặc **interface `Callable`**. Các lớp triển khai của **interface `Runnable`** hoặc **interface `Callable`** đều có thể được thực thi bởi **`ThreadPoolExecutor`** hoặc **`ScheduledThreadPoolExecutor`**.

**2. Thực thi tác vụ (`Executor`)**

Như hình dưới đây minh họa, thành phần này bao gồm interface cốt lõi của cơ chế thực thi tác vụ là **`Executor`**, cùng với **interface `ExecutorService`** kế thừa từ interface `Executor`. Hai lớp quan trọng là **`ThreadPoolExecutor`** và **`ScheduledThreadPoolExecutor`** triển khai **interface `ExecutorService`**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/executor-class-diagram-7f84e326.png)

Ở đây nhắc tới khá nhiều quan hệ kế thừa lớp ở tầng dưới, tuy nhiên trong thực tế sử dụng Thread Pool, lớp chúng ta cần quan tâm nhiều hơn cả chính là `ThreadPoolExecutor`, vì lớp này có tần suất sử dụng rất cao.

**Lưu ý:** Khi xem mã nguồn của `ScheduledThreadPoolExecutor`, chúng ta phát hiện `ScheduledThreadPoolExecutor` thực chất kế thừa `ThreadPoolExecutor` và triển khai `ScheduledExecutorService`, còn `ScheduledExecutorService` lại kế thừa `ExecutorService`, đúng như sơ đồ quan hệ lớp đã trình bày ở trên.

Khai báo lớp `ThreadPoolExecutor`:

```java
// AbstractExecutorService triển khai interface ExecutorService
public class ThreadPoolExecutor extends AbstractExecutorService
```

Khai báo lớp `ScheduledThreadPoolExecutor`:

```java
// ScheduledExecutorService kế thừa interface ExecutorService
public class ScheduledThreadPoolExecutor
        extends ThreadPoolExecutor
        implements ScheduledExecutorService
```

**3. Kết quả tính toán bất đồng bộ (`Future`)**

Interface **`Future`** cũng như lớp triển khai của nó là **`FutureTask`** đều có thể đại diện cho kết quả của một phép tính toán bất đồng bộ (asynchronous computation).

Khi chúng ta gửi một lớp triển khai của **interface `Runnable`** hoặc **interface `Callable`** tới **`ThreadPoolExecutor`** hoặc **`ScheduledThreadPoolExecutor`** để thực thi, việc gọi `submit()` sẽ trả về một đối tượng triển khai interface `Future`. Lớp triển khai cụ thể không nhất thiết phải là `FutureTask`; ví dụ, Thread Pool lập lịch định kỳ sẽ trả về một triển khai `RunnableScheduledFuture` tương ứng.

**Sơ đồ minh họa cách sử dụng `Executor` Framework**:

![Sơ đồ minh họa cách sử dụng Executor Framework](/media/jg/local/java/concurrent/images/java-thread-pool-summary/Executor-f61bc9.png)

1. Main thread trước tiên cần tạo một đối tượng tác vụ triển khai interface `Runnable` hoặc `Callable`.
2. Giao trực tiếp đối tượng đã tạo triển khai interface `Runnable`/`Callable` cho `ExecutorService` thực thi: `ExecutorService.execute(Runnable command)`, hoặc có thể gửi đối tượng `Runnable` hay `Callable` cho `ExecutorService` thực thi (`ExecutorService.submit(Runnable task)` hoặc `ExecutorService.submit(Callable<T> task)`).
3. Nếu thực thi `ExecutorService.submit(...)`, `ExecutorService` sẽ trả về một đối tượng triển khai interface `Future`. Vì `FutureTask` triển khai đồng thời cả `Runnable` và `Future`, chúng ta cũng có thể tự tạo một `FutureTask` rồi giao trực tiếp cho `ExecutorService` thực thi.
4. Cuối cùng, main thread có thể gọi phương thức `Future.get()` để chờ tác vụ thực thi xong, hoặc gọi `Future.cancel(boolean mayInterruptIfRunning)` để thử hủy tác vụ.

## Giới thiệu về lớp ThreadPoolExecutor (Quan trọng)

Lớp triển khai Thread Pool `ThreadPoolExecutor` là lớp cốt lõi nhất trong `Executor` Framework.

### Phân tích các tham số của Thread Pool

Lớp `ThreadPoolExecutor` cung cấp bốn hàm tạo (constructor). Hãy xem hàm tạo có nhiều tham số nhất; ba hàm tạo còn lại đều được tạo ra dựa trên hàm tạo này (nói một cách dễ hiểu thì các hàm tạo khác chỉ gán sẵn một số tham số mặc định, chẳng hạn như mặc định chỉ định Rejection Policy là gì).

```java
    /**
     * Tạo một ThreadPoolExecutor mới với các tham số khởi tạo cho trước.
     */
    public ThreadPoolExecutor(int corePoolSize,// Số lượng thread cốt lõi (core thread) của Thread Pool
                              int maximumPoolSize,// Số lượng thread tối đa của Thread Pool
                              long keepAliveTime,// Thời gian sống tối đa của các thread nhàn rỗi dư thừa khi số lượng thread > corePoolSize
                              TimeUnit unit,// Đơn vị thời gian
                              BlockingQueue<Runnable> workQueue,// Hàng đợi tác vụ, dùng để lưu trữ các tác vụ đang chờ thực thi
                              ThreadFactory threadFactory,// Thread factory dùng để tạo thread, thông thường dùng mặc định là được
                              RejectedExecutionHandler handler// Chính sách từ chối (Rejection Policy), tùy chỉnh cách xử lý khi tác vụ gửi vào quá nhiều không thể xử lý kịp
                               ) {
        if (corePoolSize < 0 ||
            maximumPoolSize <= 0 ||
            maximumPoolSize < corePoolSize ||
            keepAliveTime < 0)
            throw new IllegalArgumentException();
        if (workQueue == null || threadFactory == null || handler == null)
            throw new NullPointerException();
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = workQueue;
        this.keepAliveTime = unit.toNanos(keepAliveTime);
        this.threadFactory = threadFactory;
        this.handler = handler;
    }
```

Các tham số dưới đây vô cùng quan trọng, sau này khi sử dụng Thread Pool chắc chắn bạn sẽ phải dùng đến! Vì vậy, hãy nhớ ghi chép lại thật cẩn thận.

3 tham số quan trọng nhất của `ThreadPoolExecutor`:

- `corePoolSize`: Số lượng worker thread mà Thread Pool ưu tiên duy trì. Theo mặc định, các thread được tạo theo nhu cầu; sau khi số lượng worker thread đạt đến giá trị này, các tác vụ mới thường sẽ đi vào hàng đợi trước.
- `maximumPoolSize`: Khi các tác vụ lưu trữ trong hàng đợi tác vụ đạt đến dung lượng tối đa của hàng đợi, số lượng thread có thể chạy đồng thời lúc này sẽ trở thành `maximumPoolSize` (số lượng thread tối đa).
- `workQueue`: Khi có tác vụ mới đến, Thread Pool sẽ kiểm tra xem số lượng thread đang chạy hiện tại đã đạt tới `corePoolSize` hay chưa; nếu đã đạt, tác vụ mới sẽ được lưu vào trong hàng đợi này.

Các tham số phổ biến khác của `ThreadPoolExecutor`:

- `keepAliveTime`: Khi số lượng thread trong Thread Pool lớn hơn `corePoolSize`, nếu lúc này không có tác vụ mới được gửi vào, các thread nằm ngoài core thread sẽ không bị hủy ngay lập tức mà sẽ chờ đợi; chỉ khi thời gian chờ vượt quá `keepAliveTime` thì chúng mới bị thu hồi và hủy bỏ.
- `unit`: Đơn vị thời gian cho tham số `keepAliveTime`.
- `threadFactory`: Được sử dụng khi executor tạo các thread mới.
- `handler`: Chính sách từ chối — Rejection Policy (sẽ được giới thiệu chi tiết riêng ở phần sau).

Hình dưới đây có thể giúp bạn hiểu sâu hơn về mối quan hệ qua lại giữa các tham số trong Thread Pool (Nguồn ảnh: *Java Performance Tuning in Practice*):

![Mối quan hệ giữa các tham số trong Thread Pool](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/relationship-between-thread-pool-parameters-8e02c62d.jpg)

### Các trạng thái vòng đời của Thread Pool

`ThreadPoolExecutor` sử dụng biến `ctl` (kiểu `AtomicInteger`) để quản lý đồng thời trạng thái hoạt động (run state) của Thread Pool và số lượng worker thread. Thread Pool có tổng cộng 5 trạng thái:

- **Đang chạy (`RUNNING`)**: Chấp nhận tác vụ mới và xử lý các tác vụ trong hàng đợi. Đây là trạng thái ban đầu sau khi Thread Pool được tạo.
- **Đang đóng (`SHUTDOWN`)**: Không còn nhận tác vụ mới, nhưng vẫn tiếp tục xử lý hết các tác vụ đã có trong hàng đợi. Chuyển sang trạng thái này sau khi gọi `shutdown()`.
- **Dừng (`STOP`)**: Không nhận tác vụ mới, không xử lý tác vụ trong hàng đợi, và cố gắng ngắt (interrupt) các tác vụ đang thực thi. Chuyển sang trạng thái này sau khi gọi `shutdownNow()`.
- **Đang dọn dẹp (`TIDYING`)**: Toàn bộ tác vụ đã chấm dứt, số lượng worker thread bằng 0, chuẩn bị thực thi hook method `terminated()`.
- **Đã kết thúc (`TERMINATED`)**: Phương thức `terminated()` đã thực thi xong, Thread Pool kết thúc hoàn toàn.

Trạng thái chỉ có thể chuyển dịch một chiều: `RUNNING` → `SHUTDOWN` → `TIDYING` → `TERMINATED`, hoặc `RUNNING` → `STOP` → `TIDYING` → `TERMINATED`. Khi đang ở trạng thái `SHUTDOWN`, nếu gọi thêm `shutdownNow()` thì cũng sẽ chuyển sang `STOP`.

`shutdown()` là "đóng nhẹ nhàng" (graceful shutdown) — ngắt các thread đang nhàn rỗi, nhưng các tác vụ trong hàng đợi vẫn sẽ được thực thi cho đến khi hoàn tất. `shutdownNow()` là "đóng cưỡng bức" (forceful shutdown) — cố gắng ngắt tất cả các thread đang chạy và trả về các tác vụ chưa được thực thi trong hàng đợi dưới dạng `List<Runnable>`. `terminated()` là một hook method rỗng, có thể kế thừa `ThreadPoolExecutor` để ghi đè (override) phương thức này nhằm thực hiện công việc dọn dẹp sau khi Thread Pool kết thúc.

### Cơ chế Worker Thread

`ThreadPoolExecutor` đóng gói mỗi worker thread thành một lớp nội bộ (inner class) tên là `Worker`. `Worker` kế thừa `AQS` và triển khai interface `Runnable`.

**Tại sao `Worker` phải kế thừa AQS?** `Worker` triển khai một **exclusive lock không thể tái nhập (non-reentrant exclusive lock)** để phối hợp với `shutdown()` phân biệt thread đang nhàn rỗi hay đang làm việc — một `Worker` đang thực thi tác vụ sẽ giữ lock đó; `shutdown()` sẽ thử gọi `tryLock()` lên từng `Worker`, nếu thất bại nghĩa là thread đó đang làm việc và sẽ không bị ngắt.

**Vòng đời của `Worker`:**

1. **Khởi tạo**: Khi `execute()` xác định cần tạo thread mới, nó gọi `addWorker()` để tạo một thực thể `Worker`, bên trong sẽ thông qua `ThreadFactory` để tạo thread.
2. **Vận hành**: Sau khi thread khởi chạy, nó đi vào vòng lặp `while` của `runWorker()`, liên tục lấy tác vụ từ hàng đợi thông qua `getTask()` để thực thi. `Worker` không bị gắn nhãn vĩnh viễn là "core" hay "non-core"; chỉ khi cho phép core thread timeout, hoặc khi số lượng worker thread hiện tại lớn hơn `corePoolSize`, thì `getTask()` mới sử dụng `workQueue.poll(keepAliveTime, unit)` có thời hạn chờ, nếu không thì sẽ dùng `workQueue.take()` để chặn (block) và chờ đợi.
3. **Thoát**: Khi `getTask()` trả về `null`, `Worker` thoát khỏi vòng lặp và dọn dẹp. Các trường hợp trả về `null` bao gồm: Thread Pool đang ở trạng thái `STOP`, Thread Pool đang ở trạng thái `SHUTDOWN` và hàng đợi rỗng, non-core thread chờ quá thời gian (timeout), hoặc `maximumPoolSize` bị thu nhỏ lại trong lúc chạy. Nếu sau khi thoát mà số lượng worker thread thấp hơn `corePoolSize`, hệ thống sẽ tự động bổ sung một thread mới.

**Định nghĩa các Rejection Policy của `ThreadPoolExecutor`:**

Khi Thread Pool đã đóng, hoặc khi số lượng worker thread hiện tại đã đạt tới giới hạn trên và hàng đợi cũng không thể tiếp nhận thêm tác vụ mới, `ThreadPoolExecutor` sẽ gọi Rejection Policy:

- `ThreadPoolExecutor.AbortPolicy`: Ném ra ngoại lệ `RejectedExecutionException` để từ chối xử lý tác vụ mới.
- `ThreadPoolExecutor.CallerRunsPolicy`: Gọi chính thread đã gửi yêu cầu thực thi để chạy tác vụ, tức là chạy trực tiếp (`run`) tác vụ bị từ chối ngay trong thread đã gọi phương thức `execute`; nếu executor đã bị đóng thì tác vụ sẽ bị loại bỏ. Do đó chính sách này sẽ làm giảm tốc độ gửi tác vụ mới và ảnh hưởng đến hiệu năng tổng thể của chương trình. Nếu ứng dụng của bạn có thể chịu được độ trễ này và bạn yêu cầu mọi yêu cầu tác vụ đều phải được thực thi thì bạn có thể chọn chính sách này.
- `ThreadPoolExecutor.DiscardPolicy`: Không xử lý tác vụ mới mà loại bỏ trực tiếp.
- `ThreadPoolExecutor.DiscardOldestPolicy`: Chính sách này sẽ loại bỏ yêu cầu tác vụ cũ nhất chưa được xử lý.

Ví dụ:

Ví dụ: Khi Spring tạo Thread Pool thông qua `ThreadPoolTaskExecutor` hoặc khi chúng ta tự tạo trực tiếp qua hàm tạo của `ThreadPoolExecutor` mà không chỉ định cấu hình Rejection Policy `RejectedExecutionHandler`, mặc định hệ thống sẽ sử dụng `AbortPolicy`. Dưới chính sách từ chối này, nếu hàng đợi bị đầy, `ThreadPoolExecutor` sẽ ném ra ngoại lệ `RejectedExecutionException` để từ chối tác vụ mới đến, đồng nghĩa với việc bạn sẽ mất việc xử lý tác vụ này. Khi Thread Pool vẫn đang ở trạng thái chạy, `CallerRunsPolicy` sẽ giao tác vụ bị từ chối cho thread gọi hàm thực thi; khi Thread Pool đã đóng, chính sách này sẽ loại bỏ tác vụ trực tiếp.

```java
public static class CallerRunsPolicy implements RejectedExecutionHandler {

        public CallerRunsPolicy() { }

        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            if (!e.isShutdown()) {
                // Thực thi trực tiếp trên main thread thay vì trên thread trong Thread Pool
                r.run();
            }
        }
    }
```

### Kịch bản ứng dụng thực tế của 4 Rejection Policy

Ở trên đã giới thiệu hành vi cơ bản của 4 Rejection Policy có sẵn; dưới đây sẽ kết hợp với kinh nghiệm thực tế trong môi trường production để giải thích mỗi chính sách phù hợp với kịch bản nào:

**`AbortPolicy`**: Phù hợp với các nghiệp vụ cốt lõi có mức độ khoan dung bằng 0 đối với việc mất tác vụ (như thanh toán, chuyển khoản). Khi tác vụ bị từ chối, bên gọi sẽ nhận được `RejectedExecutionException`, bắt buộc phải bắt (catch) trong mã nguồn nghiệp vụ và thực hiện cơ chế bù trừ (như thử lại hoặc lưu bền vững vào cơ sở dữ liệu để thực thi bù sau). *Alibaba Java Coding Guidelines* chỉ ra rằng nếu không cấu hình gì, khi hàng đợi đầy hệ thống sẽ ném thẳng ngoại lệ, lập trình viên bắt buộc phải xử lý tường minh.

**`CallerRunsPolicy`**: Phù hợp với kịch bản không cho phép đánh mất tác vụ và cho phép làm chậm tốc độ gửi tác vụ. Do tác vụ được thực thi ngay trên thread của bên gọi, bên gọi sẽ không thể gửi tác vụ mới trong khoảng thời gian đó, hình thành một cơ chế **back-pressure (áp suất ngược)** tự nhiên. Đội ngũ kỹ thuật của Meituan trong bài viết *Java Thread Pool Implementation Principles and Its Practice in Meituan's Business* có đề cập rằng đây là chính sách từ chối họ thường sử dụng hơn cả trong các dịch vụ chạy thực tế. Tuy nhiên cần lưu ý: nếu thread gửi tác vụ là thread xử lý request của Web Container (như Worker thread của Tomcat), nó sẽ làm thời gian phản hồi của request đó tăng lên đáng kể, nên cần thận trọng trong các kịch bản nhạy cảm về độ trễ.

**`DiscardPolicy`**: Phù hợp với các luồng không trọng yếu nơi tác vụ được phép thất lạc, chẳng hạn như ghi log bất đồng bộ hoặc báo cáo chỉ số giám sát (metrics). Chính sách này hoàn toàn im lặng (triển khai rỗng), tác vụ bị từ chối sẽ không để lại bất kỳ dấu vết nào, khiến việc phát hiện mất tác vụ có thể gặp khó khăn khi điều tra sự cố.

**`DiscardOldestPolicy`**: Phù hợp với kịch bản chỉ quan tâm đến dữ liệu mới nhất, các tác vụ cũ có thể bị ghi đè, chẳng hạn như đẩy dữ liệu thị trường theo thời gian thực hoặc thu thập dữ liệu cảm biến. Cần lưu ý: nếu sử dụng `PriorityBlockingQueue`, `poll()` sẽ lấy ra tác vụ có độ ưu tiên cao nhất chứ không phải tác vụ cũ nhất, có thể dẫn tới việc loại bỏ nhầm các tác vụ quan trọng.

**Cách làm phổ biến trong môi trường production**: 4 chính sách có sẵn ở trên thường không thể đáp ứng hoàn toàn nhu cầu. Framework Dubbo tự tùy biến chính sách `AbortPolicyWithReport`, ngoài việc ném ngoại lệ ra còn dump thông tin tác vụ bị từ chối ra tệp cục bộ để thuận tiện cho việc tra cứu sự cố về sau. Đội ngũ kỹ thuật Meituan khuyến nghị cần giám sát và cảnh báo (alert) số lần Thread Pool từ chối tác vụ. Các hướng tùy biến chính sách phổ biến bao gồm: ghi tác vụ bị từ chối vào cơ sở dữ liệu hoặc Message Queue để tiêu thụ bù sau, tăng bộ đếm giám sát gửi lên Prometheus, hoặc gọi `workQueue.put(r)` để chặn (block) chờ cho đến khi hàng đợi có chỗ trống (Netty cũng có cách triển khai tương tự).

### Hai cách tạo Thread Pool

Trong Java, chủ yếu có hai cách để tạo Thread Pool:

**Cách 1: Tạo trực tiếp thông qua hàm tạo `ThreadPoolExecutor` (Khuyến nghị)**

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/threadpoolexecutor-construtors-c8527210.png)

Cụm từ "default thread factory" (thread factory mặc định) và "default rejection policy" (chính sách từ chối mặc định) trong hình ám chỉ việc khi hàm tạo hiện tại không truyền tường minh tham số tương ứng, `ThreadPoolExecutor` sẽ sử dụng triển khai mặc định, chứ không phải do phương thức và phần chú thích bị đặt lệch vị trí.

Đây là cách được khuyến nghị nhất, vì nó cho phép lập trình viên chỉ định rõ ràng các tham số cốt lõi của Thread Pool, kiểm soát tinh tế hơn hành vi vận hành của Thread Pool, từ đó tránh nguy cơ cạn kiệt tài nguyên.

**Cách 2: Tạo thông qua lớp tiện ích `Executors` (Không khuyến nghị dùng cho môi trường production)**

Các phương thức tạo Thread Pool do lớp tiện ích `Executors` cung cấp được thể hiện trong hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/executors-new-thread-pool-methods-49624012.png)

Có thể thấy, thông qua lớp tiện ích `Executors` có thể tạo ra nhiều loại Thread Pool khác nhau, bao gồm:

- `FixedThreadPool`: Trong quá trình vận hành bình thường sử dụng tối đa một số lượng cố định worker thread. Một thread có thể được thay thế sau khi kết thúc do ngoại lệ, và cũng sẽ thoát khi Thread Pool đóng, vì vậy số lượng không phải lúc nào cũng bất biến trong suốt toàn bộ vòng đời. Khi có một tác vụ mới được gửi vào, nếu trong Thread Pool có thread nhàn rỗi thì sẽ thực thi ngay lập tức. Nếu không, tác vụ mới sẽ được lưu tạm vào một hàng đợi tác vụ, chờ đến khi có thread nhàn rỗi mới xử lý tác vụ trong hàng đợi đó.
- `SingleThreadExecutor`: Thread Pool chỉ có duy nhất một thread. Nếu có nhiều hơn một tác vụ được gửi vào Thread Pool này, các tác vụ sẽ được lưu trong hàng đợi tác vụ, chờ đến khi thread nhàn rỗi thì thực thi lần lượt theo thứ tự vào trước ra trước (FIFO).
- `CachedThreadPool`: Thread Pool có thể điều chỉnh số lượng thread dựa trên tình hình thực tế. Số lượng thread của Thread Pool không cố định, nhưng nếu có thread nhàn rỗi có thể tái sử dụng thì sẽ ưu tiên dùng các thread tái sử dụng được đó. Nếu tất cả các thread đều đang làm việc mà có tác vụ mới gửi vào, nó sẽ tạo thread mới để xử lý tác vụ. Tất cả các thread sau khi thực thi xong tác vụ hiện tại sẽ quay trở lại Thread Pool để tái sử dụng.
- `ScheduledThreadPool`: Thread Pool dùng để chạy tác vụ sau một độ trễ cho trước hoặc thực thi tác vụ định kỳ.

*Alibaba Java Coding Guidelines* bắt buộc không được phép sử dụng `Executors` để tạo Thread Pool mà phải thông qua hàm tạo `ThreadPoolExecutor`; cách xử lý này giúp người viết code nắm rõ hơn quy tắc vận hành của Thread Pool và phòng tránh rủi ro cạn kiệt tài nguyên.

Nhược điểm của các đối tượng Thread Pool do `Executors` trả về như sau (phần sau sẽ giới thiệu chi tiết hơn):

- `FixedThreadPool` và `SingleThreadExecutor`: Sử dụng Blocking Queue `LinkedBlockingQueue` với độ dài tối đa của hàng đợi tác vụ là `Integer.MAX_VALUE`, có thể xem là không giới hạn (unbounded), dễ tích tụ lượng lớn request và dẫn tới OOM.
- `CachedThreadPool`: Sử dụng hàng đợi đồng bộ `SynchronousQueue`, cho phép tạo số lượng thread tối đa lên tới `Integer.MAX_VALUE`; nếu số lượng tác vụ quá nhiều và tốc độ thực thi chậm, nó có thể tạo ra số lượng lớn thread, từ đó dẫn tới OOM.
- `ScheduledThreadPool` và `SingleThreadScheduledExecutor`: Sử dụng hàng đợi chặn có độ trễ không giới hạn `DelayedWorkQueue`, với độ dài tối đa của hàng đợi tác vụ là `Integer.MAX_VALUE`, dễ tích tụ lượng lớn request và dẫn tới OOM.

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    // Độ dài mặc định của LinkedBlockingQueue là Integer.MAX_VALUE, có thể xem là không giới hạn
    return new ThreadPoolExecutor(nThreads, nThreads,0L, TimeUnit.MILLISECONDS,new LinkedBlockingQueue<Runnable>());

}

public static ExecutorService newSingleThreadExecutor() {
    // Độ dài mặc định của LinkedBlockingQueue là Integer.MAX_VALUE, có thể xem là không giới hạn
    return new FinalizableDelegatedExecutorService (new ThreadPoolExecutor(1, 1,0L, TimeUnit.MILLISECONDS,new LinkedBlockingQueue<Runnable>()));

}

// Hàng đợi đồng bộ SynchronousQueue không có sức chứa, số thread tối đa là Integer.MAX_VALUE
public static ExecutorService newCachedThreadPool() {

    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,60L, TimeUnit.SECONDS,new SynchronousQueue<Runnable>());

}

// DelayedWorkQueue (hàng đợi chặn có độ trễ)
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
          new DelayedWorkQueue());
}
```

### Tổng kết các Blocking Queue thường dùng trong Thread Pool

Khi có tác vụ mới đến, hệ thống sẽ kiểm tra trước xem số lượng thread đang chạy hiện tại đã đạt đến `corePoolSize` chưa; nếu đã đạt thì tác vụ mới sẽ được đưa vào hàng đợi.

Các Thread Pool khác nhau sẽ lựa chọn các Blocking Queue khác nhau; chúng ta có thể phân tích kết hợp với các Thread Pool tích hợp sẵn (built-in):

- `LinkedBlockingQueue` có dung lượng `Integer.MAX_VALUE` (hàng đợi không giới hạn): `FixedThreadPool` và `SingleThreadExecutor`. `FixedThreadPool` chỉ có thể tạo tối đa `corePoolSize` thread (`corePoolSize` và `maximumPoolSize` bằng nhau), còn `SingleThreadExecutor` chỉ có thể tạo 1 thread (`corePoolSize` và `maximumPoolSize` đều bằng 1); hàng đợi tác vụ của cả hai trên thực tế hầu như không bao giờ bị lấp đầy.
- `SynchronousQueue` (hàng đợi đồng bộ): `CachedThreadPool`. `SynchronousQueue` không có dung lượng và không lưu trữ phần tử, mục đích là đảm bảo với mỗi tác vụ được gửi vào, nếu có thread nhàn rỗi thì dùng thread nhàn rỗi đó để xử lý; nếu không thì tạo mới một thread để xử lý tác vụ. Nói cách khác, `maximumPoolSize` của `CachedThreadPool` là `Integer.MAX_VALUE`, có thể hiểu là số lượng thread có thể mở rộng vô hạn, rất dễ tạo ra quá nhiều thread và dẫn tới OOM.
- `DelayedWorkQueue` (hàng đợi chặn có độ trễ): `ScheduledThreadPool` và `SingleThreadScheduledExecutor`. Các phần tử bên trong `DelayedWorkQueue` không được sắp xếp theo thứ tự thời gian đưa vào, mà được sắp xếp theo độ dài thời gian trễ; bên trong sử dụng cấu trúc dữ liệu dạng "heap" (đống), đảm bảo mỗi lần lấy ra khỏi hàng đợi đều là tác vụ có thời điểm thực thi sớm nhất trong hàng đợi hiện tại. Khi `DelayedWorkQueue` thêm phần tử và bị đầy, nó sẽ tự động mở rộng thêm 1/2 dung lượng ban đầu — tức là không bao giờ bị chặn (block), mở rộng tối đa lên tới `Integer.MAX_VALUE` — nên tối đa cũng chỉ tạo ra số lượng thread bằng `corePoolSize`.

## Phân tích nguyên lý Thread Pool (Quan trọng)

Ở trên chúng ta đã giải thích về `Executor` Framework cũng như lớp `ThreadPoolExecutor`. Sau đây hãy cùng thực hành bằng cách viết một ví dụ nhỏ về `ThreadPoolExecutor` để ôn lại các nội dung vừa học.

### Mã nguồn ví dụ Thread Pool

Trước tiên tạo một lớp triển khai interface `Runnable` (tất nhiên cũng có thể là interface `Callable`, chúng ta sẽ giới thiệu sự khác nhau giữa hai interface này ở phần sau).

`MyRunnable.java`

```java
import java.util.Date;

/**
 * Đây là một lớp Runnable đơn giản, mất khoảng 5 giây để thực thi tác vụ của nó.
 * @author shuang.kou
 */
public class MyRunnable implements Runnable {

    private String command;

    public MyRunnable(String s) {
        this.command = s;
    }

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + " Start. Time = " + new Date());
        processCommand();
        System.out.println(Thread.currentThread().getName() + " End. Time = " + new Date());
    }

    private void processCommand() {
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    public String toString() {
        return this.command;
    }
}

```

Viết chương trình kiểm thử; ở đây chúng ta áp dụng cách tạo Thread Pool thông qua hàm tạo `ThreadPoolExecutor` với các tham số tùy chỉnh theo khuyến nghị của Alibaba.

`ThreadPoolExecutorDemo.java`

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class ThreadPoolExecutorDemo {

    private static final int CORE_POOL_SIZE = 5;
    private static final int MAX_POOL_SIZE = 10;
    private static final int QUEUE_CAPACITY = 100;
    private static final Long KEEP_ALIVE_TIME = 1L;
    public static void main(String[] args) {

        // Sử dụng cách tạo Thread Pool được Alibaba khuyến nghị
        // Khởi tạo bằng các tham số tùy chỉnh thông qua hàm tạo ThreadPoolExecutor
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                CORE_POOL_SIZE,
                MAX_POOL_SIZE,
                KEEP_ALIVE_TIME,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(QUEUE_CAPACITY),
                new ThreadPoolExecutor.CallerRunsPolicy());

        for (int i = 0; i < 10; i++) {
            // Tạo đối tượng WorkerThread (lớp MyRunnable triển khai interface Runnable)
            Runnable worker = new MyRunnable("" + i);
            // Thực thi Runnable
            executor.execute(worker);
        }
        // Dừng Thread Pool
        executor.shutdown();
        while (!executor.isTerminated()) {
        }
        System.out.println("Finished all threads");
    }
}

```

Có thể thấy đoạn mã trên của chúng ta đã chỉ định:

- `corePoolSize`: Số lượng core thread là 5.
- `maximumPoolSize`: Số lượng thread tối đa là 10.
- `keepAliveTime`: Thời gian chờ là `1L`.
- `unit`: Đơn vị của thời gian chờ là `TimeUnit.SECONDS`.
- `workQueue`: Hàng đợi tác vụ là `ArrayBlockingQueue`, với dung lượng bằng 100.
- `handler`: Chính sách từ chối là `CallerRunsPolicy`.

**Kết quả đầu ra**:

```plain
pool-1-thread-3 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-5 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-2 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-1 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-4 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-3 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-4 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-1 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-5 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-1 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-2 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-5 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-4 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-3 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-2 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-1 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-4 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-5 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-3 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-2 End. Time = Sun Apr 12 11:14:47 CST 2020
Finished all threads  // Chỉ thoát ra sau khi tất cả tác vụ hoàn tất, vì vòng lặp while chỉ thoát khi executor.isTerminated() trả về true — điều này chỉ xảy ra sau khi đã gọi shutdown() và toàn bộ tác vụ đã gửi đều hoàn thành

```

### Phân tích nguyên lý Thread Pool

Qua kết quả đầu ra của đoạn mã trên chúng ta có thể thấy: **Thread Pool sẽ thực thi trước 5 tác vụ, sau đó hễ có tác vụ nào thực thi xong thì nó sẽ đi lấy tác vụ mới về thực thi.** Bạn có thể dựa vào các kiến thức đã giải thích ở trên để tự phân tích xem rốt cuộc chuyện gì đã xảy ra (hãy tự suy nghĩ một lát).

Bây giờ, chúng ta sẽ dựa vào kết quả đầu ra trên để phân tích ngắn gọn nguyên lý của Thread Pool.

Để hiểu rõ nguyên lý của Thread Pool, trước tiên chúng ta cần phân tích phương thức `execute`. Trong mã nguồn ví dụ, chúng ta đã dùng `executor.execute(worker)` để gửi một tác vụ vào Thread Pool.

Phương thức này vô cùng quan trọng, hãy cùng xem mã nguồn của nó dưới đây:

```java
   // Lưu trạng thái vận hành (runState) của Thread Pool và số lượng thread hợp lệ bên trong Thread Pool (workerCount)
   private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));

    private static int workerCountOf(int c) {
        return c & CAPACITY;
    }
    // Hàng đợi tác vụ
    private final BlockingQueue<Runnable> workQueue;

    public void execute(Runnable command) {
        // Nếu tác vụ là null thì ném ngoại lệ.
        if (command == null)
            throw new NullPointerException();
        // Các thông tin trạng thái hiện tại của Thread Pool được lưu trong ctl
        int c = ctl.get();

        // Dưới đây liên quan đến 3 bước thao tác
        // 1. Trước tiên kiểm tra xem tổng số worker thread hiện tại trong Thread Pool có nhỏ hơn corePoolSize hay không
        // Nếu nhỏ hơn, tạo một thread mới thông qua addWorker(command, true) và gắn tác vụ (command) vào thread đó; sau đó khởi chạy thread này để thực thi tác vụ.
        if (workerCountOf(c) < corePoolSize) {
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
        // 2. Nếu tổng số worker thread hiện tại lớn hơn hoặc bằng corePoolSize thì sẽ đi vào đây, cho thấy không đi nhánh tạo core thread.
        // Kiểm tra trạng thái Thread Pool bằng phương thức isRunning; chỉ khi Thread Pool ở trạng thái RUNNING và hàng đợi có thể tiếp nhận tác vụ thì tác vụ mới được thêm vào hàng đợi
        if (isRunning(c) && workQueue.offer(command)) {
            int recheck = ctl.get();
            // Kiểm tra lại trạng thái Thread Pool; nếu không còn là trạng thái RUNNING thì cần xóa tác vụ khỏi hàng đợi, đồng thời thực thi chính sách từ chối.
            if (!isRunning(recheck) && remove(command))
                reject(command);
                // Nếu số lượng worker thread hiện tại bằng 0, tạo mới một thread để thực thi.
            else if (workerCountOf(recheck) == 0)
                addWorker(null, false);
        }
        // 3. Tạo một thread mới thông qua addWorker(command, false) và gắn tác vụ (command) vào thread đó; sau đó khởi chạy thread này để thực thi tác vụ.
        // Truyền false biểu thị khi thêm thread sẽ kiểm tra xem số thread hiện tại có nhỏ hơn maximumPoolSize hay không
        // Nếu addWorker(command, false) thất bại, thực thi nội dung chính sách từ chối tương ứng thông qua reject().
        else if (!addWorker(command, false))
            reject(command);
    }
```

Ở đây phân tích ngắn gọn toàn bộ quy trình (đã đơn giản hóa toàn bộ logic để dễ hiểu):

1. Nếu tổng số worker thread hiện tại nhỏ hơn `corePoolSize`, thì sẽ tạo mới một thread để thực thi tác vụ.
2. Nếu tổng số worker thread hiện tại đã đạt tới `corePoolSize`, trước tiên thử đưa tác vụ vào hàng đợi tác vụ để chờ thực thi.
3. Nếu việc đưa tác vụ vào hàng đợi thất bại (hàng đợi tác vụ đã đầy), và tổng số worker thread hiện tại nhỏ hơn `maximumPoolSize`, thì tạo mới một non-core thread để thực thi tác vụ.
4. Nếu tổng số worker thread hiện tại đã bằng `maximumPoolSize` và hàng đợi tác vụ cũng không thể tiếp nhận thêm tác vụ nào nữa, thì tác vụ hiện tại sẽ bị từ chối; Rejection Policy sẽ gọi phương thức `RejectedExecutionHandler.rejectedExecution()`.

> **Giải thích bổ sung**: Nhiều người lầm tưởng rằng non-core thread chỉ được tạo khi hàng đợi tác vụ đã đầy, rồi sau đó cứ "ngồi chơi" chờ bị hủy. Thực tế là sau khi non-core thread thực thi xong tác vụ ban đầu của nó, nó không bị hủy ngay lập tức mà sẽ **chủ động kéo tác vụ từ hàng đợi tác vụ ra để thực thi** (thông qua phương thức `getTask()`). Cụ thể, core thread sử dụng `workQueue.take()` để chặn (block) chờ tác vụ, còn non-core thread sử dụng `workQueue.poll(keepAliveTime, unit)` — nếu trong thời gian sống (`keepAliveTime`) lấy được tác vụ từ hàng đợi thì sẽ tiếp tục thực thi; chỉ khi hết giờ (timeout) mà vẫn không lấy được tác vụ nào thì non-core thread mới bị thu hồi. Điều này có nghĩa là ngay cả khi tác vụ mới được đưa vào hàng đợi, các non-core thread nhàn rỗi cũng sẽ tranh thủ lấy tác vụ từ hàng đợi về thực thi chứ không chờ bị động cho tới khi hàng đợi đầy.

![Sơ đồ minh họa nguyên lý triển khai Thread Pool](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/thread-pool-principle-aa009a67.png)

Trong phương thức `execute`, phương thức `addWorker` được gọi nhiều lần. Phương thức `addWorker` này chủ yếu dùng để tạo worker thread mới; nếu trả về `true` nghĩa là tạo và khởi chạy worker thread thành công, ngược lại trả về `false`.

```java
    // Lock toàn cục, bắt buộc phải có cho các thao tác đồng thời
    private final ReentrantLock mainLock = new ReentrantLock();
    // Theo dõi kích thước tối đa của Thread Pool, chỉ có thể truy cập tập hợp/biến này khi đang giữ lock toàn cục mainLock
    private int largestPoolSize;
    // Tập hợp worker thread, lưu trữ tất cả worker thread (đang hoạt động) trong Thread Pool; chỉ có thể truy cập khi đang giữ lock toàn cục mainLock
    private final HashSet<Worker> workers = new HashSet<>();
    // Lấy trạng thái của Thread Pool
    private static int runStateOf(int c)     { return c & ~CAPACITY; }
    // Kiểm tra xem trạng thái của Thread Pool có phải là RUNNING hay không
    private static boolean isRunning(int c) {
        return c < SHUTDOWN;
    }


    /**
     * Thêm worker thread mới vào Thread Pool
     * @param firstTask tác vụ đầu tiên cần thực thi
     * @param core nếu tham số là true thì dùng corePoolSize làm giới hạn, nếu là false thì dùng maximumPoolSize
     * @return trả về true nếu thêm thành công, ngược lại trả về false
     */
   private boolean addWorker(Runnable firstTask, boolean core) {
        retry:
        for (;;) {
            // Hai dòng này dùng để lấy trạng thái hiện tại của Thread Pool
            int c = ctl.get();
            int rs = runStateOf(c);

            // Chỉ kiểm tra xem hàng đợi có rỗng hay không khi cần thiết.
            if (rs >= SHUTDOWN &&
                ! (rs == SHUTDOWN &&
                   firstTask == null &&
                   ! workQueue.isEmpty()))
                return false;

            for (;;) {
                // Lấy số lượng thread đang làm việc trong Thread Pool
                int wc = workerCountOf(c);
                // Nếu tham số core là false nghĩa là hàng đợi cũng đã đầy, giới hạn kích thước pool trở thành maximumPoolSize
                if (wc >= CAPACITY ||
                    wc >= (core ? corePoolSize : maximumPoolSize))
                    return false;
                // Thao tác nguyên tử tăng giá trị workerCount lên 1
                if (compareAndIncrementWorkerCount(c))
                    break retry;
                // Nếu trạng thái Thread Pool thay đổi thì quay lại thực hiện vòng lặp ngoài
                c = ctl.get();
                if (runStateOf(c) != rs)
                    continue retry;
                // Ngược lại, CAS thất bại do workerCount thay đổi; thử lại vòng lặp trong
            }
        }
        // Đánh dấu worker thread đã khởi chạy thành công hay chưa
        boolean workerStarted = false;
        // Đánh dấu worker thread đã được tạo/thêm thành công hay chưa
        boolean workerAdded = false;
        Worker w = null;
        try {

            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                // Khóa (acquire lock)
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    // Lấy trạng thái Thread Pool
                    int rs = runStateOf(ctl.get());
                    // Nếu rs < SHUTDOWN tức trạng thái Thread Pool vẫn là RUNNING, hoặc
                    // (rs == SHUTDOWN && firstTask == null) tức trạng thái nhỏ hơn STOP (RUNNING hoặc SHUTDOWN) đồng thời firstTask bằng null,
                    // thì thêm vào tập hợp worker thread và khởi chạy Worker mới.
                    // firstTask == null chứng tỏ chỉ tạo mới thread để xử lý tác vụ trong hàng đợi chứ không nhận tác vụ mới.
                    if (rs < SHUTDOWN ||
                        (rs == SHUTDOWN && firstTask == null)) {
                        if (t.isAlive()) // kiểm tra trước xem t có sẵn sàng để start hay không
                            throw new IllegalThreadStateException();
                        workers.add(w);
                        // Cập nhật kích thước lớn nhất từng đạt được của worker thread
                        int s = workers.size();
                        if (s > largestPoolSize)
                            largestPoolSize = s;
                        // Đánh dấu thêm worker thread thành công
                        workerAdded = true;
                    }
                } finally {
                    // Mở khóa (release lock)
                    mainLock.unlock();
                }
                // Nếu thêm worker thread thành công, gọi Thread#start() trên đối tượng thread nội bộ t của Worker để khởi chạy thread thực sự
                if (workerAdded) {
                    t.start();
                    // Đánh dấu khởi chạy thread thành công
                    workerStarted = true;
                }
            }
        } finally {
            // Khởi chạy thread thất bại, cần xóa Worker tương ứng khỏi tập hợp worker thread
            if (! workerStarted)
                addWorkerFailed(w);
        }
        return workerStarted;
    }
```

Để xem thêm các nội dung phân tích mã nguồn Thread Pool chuyên sâu, bạn có thể tham khảo bài viết chất lượng này: Kiến thức chuyên sâu: [Phân tích nguyên lý triển khai ThreadPoolExecutor của JUC từ mã nguồn với 40.000 chữ](https://www.cnblogs.com/throwable/p/13574306.html).

Bây giờ, hãy quay trở lại mã nguồn ví dụ ban đầu — lúc này chắc hẳn việc hiểu nguyên lý của nó đã trở nên quá dễ dàng rồi phải không?

Nếu bạn vẫn chưa hiểu rõ cũng không sao, có thể xem phần phân tích của tôi:

> Trong code chúng ta mô phỏng 10 tác vụ, chúng ta cấu hình `corePoolSize` là 5 và dung lượng hàng đợi chờ là 100, nên tại cùng một thời điểm tối đa chỉ có thể có 5 tác vụ thực thi đồng thời, 5 tác vụ còn lại sẽ được đưa vào hàng đợi chờ. Trong 5 tác vụ hiện tại hễ có tác vụ nào thực thi xong thì Thread Pool sẽ đi lấy tác vụ mới về thực thi.

### Một số so sánh thường gặp

#### `Runnable` vs `Callable`

`Runnable` đã tồn tại từ Java 1.0, nhưng `Callable` chỉ mới được giới thiệu từ Java 1.5 với mục đích xử lý những trường hợp mà `Runnable` không hỗ trợ. Interface `Runnable` không thể trả về kết quả hay ném ra checked exception, trong khi interface `Callable` có thể làm được điều đó. Vì vậy, nếu tác vụ không cần trả về kết quả hoặc ném ngoại lệ thì nên dùng interface `Runnable`, giúp mã nguồn trông gọn gàng hơn.

Lớp tiện ích `Executors` có thể hỗ trợ chuyển đổi một đối tượng `Runnable` thành đối tượng `Callable` (`Executors.callable(Runnable task)` hoặc `Executors.callable(Runnable task, Object result)`).

`Runnable.java`

```java
@FunctionalInterface
public interface Runnable {
   /**
    * Được thread thực thi, không có giá trị trả về và cũng không thể ném ra checked exception
    */
    public abstract void run();
}
```

`Callable.java`

```java
@FunctionalInterface
public interface Callable<V> {
    /**
     * Tính toán kết quả, hoặc ném ra ngoại lệ nếu không thể thực hiện.
     * @return kết quả tính toán được
     * @throws nếu không thể tính toán kết quả thì ném ra ngoại lệ
     */
    V call() throws Exception;
}

```

#### `execute()` vs `submit()`

`execute()` và `submit()` là hai phương thức dùng để gửi tác vụ vào Thread Pool, có một số điểm khác biệt:

- **Giá trị trả về**: Phương thức `execute()` dùng để gửi các tác vụ `Runnable` không cần giá trị trả về. `submit()` có thể gửi tác vụ `Runnable` hoặc `Callable` và trả về một đối tượng `Future`. `Future.isDone()` chỉ cho biết tác vụ đã kết thúc ở một trong các trạng thái: hoàn thành bình thường, xảy ra ngoại lệ hoặc bị hủy; phải gọi `get()` mới lấy được kết quả, hoặc biết được ngoại lệ mà tác vụ đã ném ra (`get(long timeout, TimeUnit unit)` sẽ ném `TimeoutException` nếu chưa hoàn thành trước khi hết thời gian chờ).
- **Xử lý ngoại lệ**: Khi sử dụng phương thức `submit()`, có thể xử lý các ngoại lệ phát sinh trong quá trình thực thi tác vụ thông qua đối tượng `Future`; còn khi dùng phương thức `execute()`, việc xử lý ngoại lệ cần thực hiện thông qua `ThreadFactory` tùy chỉnh (thiết lập đối tượng `UncaughtExceptionHandler` khi thread factory tạo thread) hoặc thông qua phương thức `afterExecute()` của `ThreadPoolExecutor`.

Ví dụ 1: Sử dụng phương thức `get()` để lấy giá trị trả về.

```java
// Ở đây chỉ nhằm mục đích minh họa, thực tế khuyến nghị tạo Thread Pool qua hàm tạo ThreadPoolExecutor.
ExecutorService executorService = Executors.newFixedThreadPool(3);

Future<String> submit = executorService.submit(() -> {
    try {
        Thread.sleep(5000L);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "abc";
});

String s = submit.get();
System.out.println(s);
executorService.shutdown();
```

Đầu ra:

```plain
abc
```

Ví dụ 2: Sử dụng phương thức `get(long timeout, TimeUnit unit)` để lấy giá trị trả về.

```java
ExecutorService executorService = Executors.newFixedThreadPool(3);

Future<String> submit = executorService.submit(() -> {
    try {
        Thread.sleep(5000L);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "abc";
});

String s = submit.get(3, TimeUnit.SECONDS);
System.out.println(s);
executorService.shutdown();
```

Đầu ra:

```plain
Exception in thread "main" java.util.concurrent.TimeoutException
  at java.util.concurrent.FutureTask.get(FutureTask.java:205)
```

#### `shutdown()` VS `shutdownNow()`

- **`shutdown()`**: Đóng Thread Pool, trạng thái của Thread Pool chuyển sang `SHUTDOWN`. Thread Pool không còn nhận tác vụ mới nữa, nhưng các tác vụ trong hàng đợi sẽ phải thực thi xong hết.
- **`shutdownNow()`**: Đóng Thread Pool, trạng thái của Thread Pool chuyển sang `STOP`. Thread Pool sẽ cố gắng ngắt các tác vụ đang thực thi, ngừng xử lý các tác vụ đang xếp hàng và trả về danh sách các tác vụ chưa bắt đầu thực thi; khi tác vụ không phản hồi tín hiệu ngắt (interrupt), không thể đảm bảo nó sẽ chấm dứt ngay lập tức.

#### `isTerminated()` VS `isShutdown()`

- **`isShutDown`**: Trả về `true` sau khi phương thức `shutdown()` đã được gọi.
- **`isTerminated`**: Trả về `true` sau khi phương thức `shutdown()` đã được gọi và toàn bộ các tác vụ đã gửi đều hoàn thành.

## Một số Thread Pool tích hợp sẵn thường gặp

### FixedThreadPool

#### Giới thiệu

`FixedThreadPool` được gọi là Thread Pool có số lượng thread cố định và có thể tái sử dụng. Hãy cùng xem cách triển khai qua mã nguồn liên quan trong lớp `Executors`:

```java
   /**
     * Tạo một Thread Pool có số lượng thread cố định có thể tái sử dụng
     */
    public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>(),
                                      threadFactory);
    }
```

Ngoài ra còn có một phương thức triển khai `FixedThreadPool` khác tương tự như trên, nên ở đây không trình bày thêm nhiều:

```java
    public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }
```

Từ mã nguồn trên có thể thấy `corePoolSize` và `maximumPoolSize` của `FixedThreadPool` mới tạo đều được đặt thành `nThreads` — tham số `nThreads` này do chúng ta tự truyền vào khi sử dụng.

Ngay cả khi giá trị của `maximumPoolSize` lớn hơn `corePoolSize`, tối đa cũng chỉ tạo ra `corePoolSize` thread. Đó là vì `FixedThreadPool` sử dụng `LinkedBlockingQueue` có dung lượng là `Integer.MAX_VALUE` (hàng đợi không giới hạn), nên hàng đợi sẽ không bao giờ bị lấp đầy.

#### Giới thiệu quá trình thực thi tác vụ

Sơ đồ minh họa cách chạy phương thức `execute()` của `FixedThreadPool` (Nguồn ảnh: *The Art of Java Concurrency Programming*):

![Sơ đồ minh họa cách chạy phương thức execute() của FixedThreadPool](/media/jg/local/java/concurrent/images/java-thread-pool-summary/FixedThreadPool-01d9ec.png)

**Giải thích hình trên:**

1. Nếu tổng số worker thread hiện tại nhỏ hơn `corePoolSize`, khi có tác vụ mới đến thì sẽ tạo thread mới để thực thi tác vụ;
2. Sau khi tổng số worker thread hiện tại đạt tới `corePoolSize`, nếu có tác vụ mới đến thì sẽ đưa tác vụ vào `LinkedBlockingQueue`;
3. Sau khi thread trong Thread Pool thực thi xong tác vụ đang làm, nó sẽ lặp đi lặp lại trong vòng lặp để lấy tác vụ từ `LinkedBlockingQueue` về thực thi;

#### Tại sao không khuyến nghị dùng `FixedThreadPool`?

Việc `FixedThreadPool` sử dụng hàng đợi không giới hạn `LinkedBlockingQueue` (dung lượng hàng đợi là `Integer.MAX_VALUE`) làm hàng đợi công việc sẽ gây ra những ảnh hưởng sau cho Thread Pool:

1. Khi số lượng thread trong Thread Pool đạt tới `corePoolSize`, các tác vụ mới sẽ phải chờ trong hàng đợi không giới hạn, do đó số lượng thread trong Thread Pool sẽ không vượt quá `corePoolSize`;
2. Vì khi dùng hàng đợi không giới hạn thì `maximumPoolSize` sẽ trở thành một tham số vô hiệu (do không thể xảy ra tình huống hàng đợi tác vụ bị đầy), qua mã nguồn tạo `FixedThreadPool` có thể thấy `corePoolSize` và `maximumPoolSize` được đặt cùng một giá trị;
3. Do (1) và (2), khi dùng hàng đợi không giới hạn thì `keepAliveTime` cũng sẽ trở thành một tham số vô hiệu;
4. Một `FixedThreadPool` đang chạy (chưa thực thi `shutdown()` hoặc `shutdownNow()`) sẽ không bao giờ từ chối tác vụ, nên khi có nhiều tác vụ sẽ dẫn tới OOM (tràn bộ nhớ).

### SingleThreadExecutor

#### Giới thiệu

`SingleThreadExecutor` là Thread Pool chỉ có duy nhất một thread. Hãy xem **cách triển khai của `SingleThreadExecutor`:**

```java
   /**
     * Trả về Thread Pool chỉ có duy nhất một thread
     */
    public static ExecutorService newSingleThreadExecutor(ThreadFactory threadFactory) {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>(),
                                    threadFactory));
    }
```

```java
   public static ExecutorService newSingleThreadExecutor() {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>()));
    }
```

Từ mã nguồn trên có thể thấy `corePoolSize` và `maximumPoolSize` của `SingleThreadExecutor` mới tạo đều được đặt bằng 1, các tham số khác giống với `FixedThreadPool`.

#### Giới thiệu quá trình thực thi tác vụ

Sơ đồ minh họa cách chạy của `SingleThreadExecutor` (Nguồn ảnh: *The Art of Java Concurrency Programming*):

![Sơ đồ minh họa cách chạy của SingleThreadExecutor](/media/jg/local/java/concurrent/images/java-thread-pool-summary/SingleThreadExecutor-275e95.png)

**Giải thích hình trên:**

1. Nếu số lượng thread đang chạy hiện tại nhỏ hơn `corePoolSize`, tạo một thread mới để thực thi tác vụ;
2. Khi trong Thread Pool đã có một thread đang chạy, đưa tác vụ vào `LinkedBlockingQueue`;
3. Sau khi thread thực thi xong tác vụ hiện tại, nó sẽ lặp đi lặp lại trong vòng lặp để lấy tác vụ từ `LinkedBlockingQueue` về thực thi;

#### Tại sao không khuyến nghị dùng `SingleThreadExecutor`?

Giống như `FixedThreadPool`, `SingleThreadExecutor` đều sử dụng `LinkedBlockingQueue` có dung lượng là `Integer.MAX_VALUE` (hàng đợi không giới hạn). Ảnh hưởng của việc dùng hàng đợi không giới hạn làm hàng đợi công việc đối với `SingleThreadExecutor` hoàn toàn giống với `FixedThreadPool`. Nói đơn giản là nó có thể dẫn tới OOM.

### CachedThreadPool

#### Giới thiệu

`CachedThreadPool` là một Thread Pool sẽ tạo mới thread tùy theo nhu cầu. Hãy xem cách triển khai `CachedThreadPool` qua mã nguồn:

```java
    /**
     * Tạo một Thread Pool sẽ tạo thread mới theo nhu cầu, nhưng sẽ tái sử dụng các thread đã dựng trước đó khi chúng khả dụng.
     */
    public static ExecutorService newCachedThreadPool(ThreadFactory threadFactory) {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>(),
                                      threadFactory);
    }

```

```java
    public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
```

`corePoolSize` của `CachedThreadPool` được đặt bằng 0, `maximumPoolSize` được đặt là `Integer.MAX_VALUE`, tức là không giới hạn; điều này có nghĩa là nếu main thread gửi tác vụ với tốc độ nhanh hơn tốc độ xử lý của các thread trong `maximumPool`, `CachedThreadPool` sẽ liên tục tạo thread mới. Trong trường hợp cực đoan, điều này sẽ làm cạn kiệt tài nguyên CPU và bộ nhớ.

#### Giới thiệu quá trình thực thi tác vụ

Sơ đồ minh họa quá trình thực thi phương thức `execute()` của `CachedThreadPool` (Nguồn ảnh: *The Art of Java Concurrency Programming*):

![Sơ đồ minh họa quá trình thực thi phương thức execute() của CachedThreadPool](/media/jg/local/java/concurrent/images/java-thread-pool-summary/CachedThreadPool-execute-16353b.png)

**Giải thích hình trên:**

1. Trước tiên thực thi `SynchronousQueue.offer(Runnable task)` để gửi tác vụ vào hàng đợi tác vụ. Nếu trong `maximumPool` hiện đang có thread nhàn rỗi thực thi `SynchronousQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS)`, thì thao tác `offer` do main thread thực hiện sẽ ghép cặp thành công với thao tác `poll` do thread nhàn rỗi thực hiện; main thread giao tác vụ cho thread nhàn rỗi đó thực thi và phương thức `execute()` hoàn thành; ngược lại thực hiện bước 2 bên dưới;
2. Khi ban đầu `maximumPool` trống, hoặc trong `maximumPool` không có thread nào nhàn rỗi, sẽ không có thread nào thực thi `SynchronousQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS)`. Trong trường hợp này, bước 1 sẽ thất bại; lúc đó `CachedThreadPool` sẽ tạo thread mới để thực thi tác vụ, và phương thức `execute()` hoàn thành;

#### Tại sao không khuyến nghị dùng `CachedThreadPool`?

`CachedThreadPool` sử dụng hàng đợi đồng bộ `SynchronousQueue`, cho phép tạo số lượng thread lên tới `Integer.MAX_VALUE`, có thể tạo ra số lượng lớn thread, từ đó dẫn tới OOM.

### ScheduledThreadPool

#### Giới thiệu

`ScheduledThreadPool` được dùng để chạy tác vụ sau một độ trễ cho trước hoặc thực thi tác vụ định kỳ. Loại này trong dự án thực tế cơ bản không được dùng tới và cũng không được khuyến nghị sử dụng, bạn chỉ cần nắm sơ qua là được.

```java
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
          new DelayedWorkQueue());
}
```

`ScheduledThreadPool` được tạo thông qua `ScheduledThreadPoolExecutor`, sử dụng `DelayedWorkQueue` (hàng đợi chặn có độ trễ) làm hàng đợi tác vụ của Thread Pool.

Các phần tử bên trong `DelayedWorkQueue` không được sắp xếp theo thứ tự thời gian đưa vào, mà được sắp xếp theo độ dài thời gian trễ; bên trong sử dụng cấu trúc dữ liệu dạng "heap" (đống), đảm bảo mỗi lần lấy ra khỏi hàng đợi đều là tác vụ có thời điểm thực thi sớm nhất trong hàng đợi hiện tại. Khi `DelayedWorkQueue` thêm phần tử và bị đầy, nó sẽ tự động mở rộng thêm 1/2 dung lượng ban đầu — tức là không bao giờ bị chặn (block), mở rộng tối đa lên tới `Integer.MAX_VALUE` — nên tối đa cũng chỉ tạo ra số lượng thread bằng `corePoolSize`.

`ScheduledThreadPoolExecutor` kế thừa `ThreadPoolExecutor`, do đó việc tạo một `ScheduledThreadExecutor` về bản chất cũng là tạo một Thread Pool `ThreadPoolExecutor`, chỉ khác ở các tham số truyền vào.

```java
public class ScheduledThreadPoolExecutor
        extends ThreadPoolExecutor
        implements ScheduledExecutorService
```

#### So sánh giữa ScheduledThreadPoolExecutor và Timer

- `Timer` nhạy cảm với sự thay đổi của đồng hồ hệ thống, còn `ScheduledThreadPoolExecutor` thì không;
- `Timer` chỉ có duy nhất một thread thực thi, vì vậy một tác vụ chạy quá lâu có thể làm trì hoãn các tác vụ khác. `ScheduledThreadPoolExecutor` có thể cấu hình số lượng thread tùy ý. Ngoài ra, nếu muốn (bằng cách cung cấp `ThreadFactory`), bạn có thể kiểm soát hoàn toàn các thread được tạo ra;
- Một runtime exception ném ra bên trong `TimerTask` sẽ làm chấm dứt thread duy nhất của `Timer`, khiến các tác vụ định kỳ tiếp theo cũng không thể tiếp tục chạy. Trong `ScheduledThreadPoolExecutor`, một tác vụ nào đó ném ngoại lệ sẽ không làm chấm dứt các tác vụ khác; sau khi một tác vụ định kỳ ném ngoại lệ, các lần thực thi tiếp theo của nó sẽ bị ngăn lại (suppressed). Các tác vụ được gửi thông qua `submit()` hoặc các phương thức lập lịch định kỳ thường sẽ lưu ngoại lệ bên trong `Future`, bên gọi có thể lấy ra qua `Future.get()`; nếu kiểm tra tập trung trong `afterExecute()`, cũng cần đọc ngoại lệ từ `Future` được truyền vào.

Để tìm hiểu chi tiết về tác vụ định kỳ (scheduled task), bạn có thể xem bài viết này: [Giải thích chi tiết về tác vụ định kỳ trong Java](https://javaguide.cn/system-design/schedule-task.html).

## Best Practices khi sử dụng Thread Pool

Bài viết [Best Practices khi sử dụng Thread Pool trong Java](https://javaguide.cn/java/concurrent/java-thread-pool-best-practices.html) tổng kết những điều cần chú ý khi sử dụng Thread Pool; trước khi dùng Thread Pool trong dự án thực tế bạn có thể tham khảo qua.

## Tài liệu tham khảo

- *The Art of Java Concurrency Programming*
- [Java Scheduler ScheduledExecutorService ScheduledThreadPoolExecutor Example](https://www.journaldev.com/2340/java-scheduler-scheduledexecutorservice-scheduledthreadpoolexecutor-example "Java Scheduler ScheduledExecutorService ScheduledThreadPoolExecutor Example")
- [java.util.concurrent.ScheduledThreadPoolExecutor Example](https://examples.javacodegeeks.com/core-java/util/concurrent/scheduledthreadpoolexecutor/java-util-concurrent-scheduledthreadpoolexecutor-example/ "java.util.concurrent.ScheduledThreadPoolExecutor Example")
- [ThreadPoolExecutor – Java Thread Pool Example](https://www.journaldev.com/1069/threadpoolexecutor-java-thread-pool-example-executorservice "ThreadPoolExecutor – Java Thread Pool Example")
