---
title: Thực hành tốt nhất cho Java Thread Pool
description: "Tổng kết các thực hành tốt nhất cho Java Thread Pool: ước lượng số Thread và độ dài hàng đợi từ thông lượng nghiệp vụ, thời gian chạy tác vụ và năng lực downstream; giải quyết các vấn đề production như tồn đọng hàng đợi, chính sách từ chối, timeout tác vụ, xử lý ngoại lệ, điều chỉnh tham số động, giám sát và Virtual Thread."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/java-thread-pool-best-practices.md
head:
  - - meta
    - name: keywords
      content: Thực hành tốt Thread Pool,cấu hình tham số ThreadPoolExecutor,giám sát Thread Pool,tồn đọng hàng đợi,CallerRunsPolicy,Thread Pool động,timeout tác vụ,Virtual Thread
---

Khi nhìn thấy bộ cấu hình `corePoolSize = 8`, `maximumPoolSize = 16`, `queueCapacity = 1000`, chỉ dựa vào việc máy có 8 nhân CPU thì vẫn chưa đủ để đánh giá cấu hình đó có hợp lý hay không. Nén ảnh, truy vấn cơ sở dữ liệu hàng loạt và gọi API bên ngoài có cấu trúc thời gian tiêu tốn khác nhau, nên số lượng Thread cần thiết có thể chênh lệch rất lớn. Tốc độ tác vụ đi vào nhanh hay chậm, thời gian thực thi bao lâu, được phép xếp hàng tối đa bao lâu, cũng như cơ sở dữ liệu và downstream chịu tải được mức đồng thời bao nhiêu đều sẽ ảnh hưởng đến cấu hình cuối cùng.

Kiến thức nền tảng về 7 tham số khởi tạo, quy trình thực thi tác vụ, `BlockingQueue` và `Rejection Policy` (chính sách từ chối) có thể xem trước tại [Giải thích chi tiết Java Thread Pool](./java-thread-pool-summary.md). Trong môi trường production còn phải xử lý bài toán ước lượng tham số, quá tải, timeout tác vụ và giám sát — những vấn đề phụ thuộc nhiều hơn vào năng lực nghiệp vụ và dữ liệu vận hành thực tế.

## Khai báo Thread Pool đúng cách

Thread Pool nghiệp vụ thường cần chỉ định rõ số lượng Thread, dung lượng hàng đợi, tên Thread và `Rejection Policy` (chính sách từ chối). Dù các phương thức tiện ích của `Executors` rất tiện lợi, nhưng một số phương thức lại tạo ra hàng đợi gần như không giới hạn hoặc cho phép số lượng Thread tăng liên tục, dễ làm tồn đọng lượng lớn tác vụ hoặc tạo quá nhiều Thread vào giờ cao điểm.

- `newFixedThreadPool()` và `newSingleThreadExecutor()` sử dụng `LinkedBlockingQueue` không giới hạn kích thước; khi tác vụ liên tục đổ vào, hàng đợi có thể phình to không ngừng.
- `newCachedThreadPool()` sử dụng `SynchronousQueue` với số Thread tối đa là `Integer.MAX_VALUE`; nếu tốc độ đẩy tác vụ cao hơn tốc độ xử lý trong thời gian dài, nó có thể sinh ra rất nhiều Thread.
- `newScheduledThreadPool()` sử dụng `DelayedWorkQueue` không giới hạn, tương tự cũng cần lưu ý nguy cơ tác vụ trễ tích tụ liên tục.

Do đó, các Thread Pool nghiệp vụ thông thường phù hợp hơn với việc sử dụng trực tiếp `ThreadPoolExecutor` và ghi rõ giới hạn dung lượng ngay trong cấu hình:

```java
ThreadFactory threadFactory = new NamingThreadFactory("order-query");

ThreadPoolExecutor executor = new ThreadPoolExecutor(
        8,
        16,
        60L,
        TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(200),
        threadFactory,
        new ThreadPoolExecutor.AbortPolicy()
);
```

Các con số `8`, `16` và `200` trong ví dụ chỉ dùng để minh họa vị trí tham số, tuyệt đối không dùng thẳng cho môi trường production. Tham số thực tế phải được xác định dựa trên năng lực nghiệp vụ và kết quả kiểm thử tải (`stress test`).

`ThreadFactory` tối thiểu nên đặt cho Thread một cái tên mang ý nghĩa nghiệp vụ:

```java
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

public final class NamingThreadFactory implements ThreadFactory {

    private final AtomicInteger sequence = new AtomicInteger();
    private final String prefix;

    public NamingThreadFactory(String prefix) {
        this.prefix = prefix;
    }

    @Override
    public Thread newThread(Runnable task) {
        Thread thread = new Thread(task);
        thread.setName(prefix + "-" + sequence.incrementAndGet());
        thread.setDaemon(false);
        return thread;
    }
}
```

Tên Thread sẽ xuất hiện trong Thread Dump, log và dữ liệu giám sát. Nhìn `pool-1-thread-3` rất khó đoán thuộc về nghiệp vụ nào, trong khi `order-query-3` giúp thu hẹp ngay phạm vi điều tra sự cố.

## Ước lượng tham số Thread Pool như thế nào?

Các tác vụ CPU-bound thường xuất phát quanh mức số nhân CPU, còn các tác vụ I/O-bound có thể cấu hình nhiều Thread hơn. Kinh nghiệm kiểu này phù hợp để phán đoán ban đầu, nhưng khi cấu hình thực tế vẫn cần trả lời các câu hỏi cụ thể hơn: Lúc cao điểm mỗi giây có bao nhiêu tác vụ được đẩy vào? Một tác vụ chạy trong bao lâu? Trong đó bao nhiêu thời gian là chờ I/O? Hạ nguồn (downstream) chịu được mức đồng thời bao nhiêu? Tác vụ được phép xếp hàng tối đa bao lâu?

Trong một khung thời gian cao điểm tương đối ổn định, giả sử số lượng tác vụ đẩy vào mỗi giây là $\lambda$, thời gian thực thi trung bình của một tác vụ là $T$ giây, thì số lượng tác vụ đang thực thi đồng thời $L$ có thể ước lượng trước theo công thức sau:

$$
L \approx \lambda \times T
$$

Ví dụ: một API vào lúc cao điểm sinh ra 400 tác vụ bất đồng bộ mỗi giây, mỗi tác vụ mất trung bình 80 ms để thực thi, thì nhu cầu đồng thời trung bình tương ứng khoảng `400 × 0.08 = 32`. Đây mới chỉ là điểm khởi đầu để ước lượng, không thể căn cứ vào đây mà đặt thẳng số Thread là 32, vì những lý do sau:

- Thời gian trung bình sẽ che khuất các tác vụ chậm; P95 và P99 có thể cao hơn rất nhiều so với mức trung bình.
- Khi thời gian chạy tác vụ tăng lên, nhu cầu đồng thời cũng tăng theo.
- CPU, bộ nhớ và chi phí chuyển ngữ cảnh (`context switch`) sẽ giới hạn số lượng Platform Thread.
- Connection Pool của cơ sở dữ liệu hoặc API downstream có thể chỉ cho phép mức đồng thời thấp hơn nhiều.

Cuốn *Java Concurrency in Practice* từng đưa ra một công thức ước lượng có tính đến mức độ sử dụng CPU mục tiêu. Đối với các tác vụ kết hợp giữa tính toán và chờ đợi, bạn có thể dùng công thức này để hỗ trợ xác định giá trị ban đầu:

$$
N_{threads} \approx N_{cpu} \times U_{cpu} \times \left(1 + \frac{W}{C}\right)
$$

Trong đó, $N_{cpu}$ là số nhân CPU, $U_{cpu}$ là mức độ sử dụng CPU mục tiêu, và $W/C$ là tỷ lệ giữa thời gian chờ đợi và thời gian tính toán của tác vụ.

Thời gian chờ càng dài, về lý thuyết có thể bố trí càng nhiều Thread để trong lúc một phần tác vụ đang chờ I/O, các tác vụ khác vẫn tiếp tục dùng CPU. Tuy nhiên, khi sự chờ đợi đến từ việc cạn kiệt Connection Pool cơ sở dữ liệu, bị downstream giới hạn lưu lượng hay tranh chấp khóa, việc tăng thêm Thread chỉ tạo ra thêm nhiều Thread đứng chờ mà thôi. Công thức không thể phân biệt được sự khác nhau này.

Sau khi chốt giá trị ban đầu, vẫn cần dùng kiểm thử tải với lưu lượng sát thực tế để điều chỉnh dần. Khi chạy load test phải theo dõi đồng thời thông lượng, độ trễ P95/P99, CPU, `context switch`, thời gian chờ trong hàng đợi và Connection Pool phía downstream, chứ không thể chỉ nhìn vào mỗi QPS của ứng dụng.

## Hàng đợi giới hạn nên đặt kích thước bao nhiêu?

Hàng đợi chủ yếu dùng để hấp thụ các biến động lưu lượng trong thời gian ngắn, không phù hợp để lưu giữ lâu dài những tác vụ không kịp xử lý. Hàng đợi quá nhỏ thì chỉ cần dao động nhẹ là đã kích hoạt từ chối; hàng đợi quá lớn thì tác vụ tuy được nhận vào nhưng trước khi kịp thực thi thực sự đã quá thời hạn timeout nghiệp vụ, đồng thời còn chiếm nhiều bộ nhớ Heap.

Trước tiên có thể dùng lưu lượng tăng đột biến (`burst`) để ước lượng lượng đệm cần thiết, với $\lambda_{in}$ là tốc độ tác vụ đi vào, $\lambda_{out}$ là tốc độ hoàn thành, và $\Delta t$ là khoảng thời gian bùng nổ:

$$
Q \approx (\lambda_{in} - \lambda_{out}) \times \Delta t
$$

Ví dụ: Thread Pool mỗi giây hoàn thành được khoảng 500 tác vụ, một đợt tăng đột biến lưu lượng trong 2 giây đẩy tốc độ gửi tác vụ lên 600 tác vụ/giây, thì khoảng thời gian này sẽ dư ra khoảng 200 tác vụ. Con số này chỉ phản ánh nhu cầu đệm ngắn hạn; dung lượng cuối cùng vẫn bị ràng buộc bởi thời hạn hiệu lực của tác vụ và giới hạn bộ nhớ.

Cũng có thể ước tính sơ bộ thời gian chờ trong hàng đợi: trong hàng đợi đang có 500 tác vụ, Thread Pool mỗi giây xử lý xong 500 tác vụ, thì tác vụ ở cuối hàng đợi còn phải chờ khoảng 1 giây. Khi tổng timeout của API chỉ là 800 ms, nhóm tác vụ này dù có vào được hàng đợi cũng rất khó trả về kịp lúc.

Sau khi số Thread làm việc đạt tới `corePoolSize`, tác vụ mới sẽ đi vào hàng đợi trước; chỉ khi hàng đợi đầy, Thread Pool mới tạo tiếp Thread cho tới ngưỡng `maximumPoolSize`. Khi đặt kích thước hàng đợi quá lớn, số lượng Thread có thể giữ nguyên ở mức `corePoolSize` trong thời gian dài, khiến `maximumPoolSize` rất ít có cơ hội phát huy tác dụng. Dưới hàng đợi không giới hạn, `maximumPoolSize` trên thực tế không tham gia vào quá trình mở rộng.

Khi xác định dung lượng hàng đợi, tối thiểu phải kiểm chứng 4 điểm:

1. Ước lượng nhu cầu đệm dựa trên lưu lượng cao điểm và thời gian kéo dài của đợt tăng đột biến.
2. Kiểm tra xem thời gian chờ dự kiến của tác vụ ở cuối hàng đợi có vượt quá thời hạn nghiệp vụ hay không.
3. Đo lường lượng bộ nhớ mà các tác vụ xếp hàng chiếm dụng, đặc biệt là những tác vụ mang theo file, request body hoặc collection kích thước lớn.
4. Kiểm chứng xem cơ chế hạ cấp (`degradation`) và cảnh báo có hoạt động đúng khi hàng đợi đầy và tác vụ bị từ chối hay không.

## Tại sao số lượng Thread phải thiết kế cùng với năng lực downstream?

Không ít tác vụ I/O cuối cùng đều sẽ truy cập cơ sở dữ liệu, Redis hoặc các API bên ngoài. Thread Pool có thể giúp nhiều tác vụ cùng lúc phát sinh lời gọi, nhưng không hề làm tăng năng lực xử lý của hệ thống downstream.

Giả sử dịch vụ đơn hàng triển khai 4 instance, mỗi instance cấu hình 40 Thread cho một tác vụ cơ sở dữ liệu nào đó, thì về mặt lý thuyết có thể đồng thời tạo ra tới 160 truy vấn DB cùng lúc. Khi Connection Pool cơ sở dữ liệu của mỗi instance chỉ có 20 kết nối, hàng loạt Thread sẽ bị chặn ngay tại bước lấy kết nối; còn nếu bản thân cơ sở dữ liệu chỉ chịu tải ổn định được 80 truy vấn đồng thời, thì ngay cả khi mở rộng thêm Connection Pool cũng chỉ đẩy áp lực dồn sang cho DB.

Khi cấu hình, cần phân bổ ngân sách đồng thời trên toàn bộ chuỗi lời gọi:

- Kết nối cơ sở dữ liệu phải chừa phần cho HTTP request từ Web, các job định kỳ và các Thread Pool nghiệp vụ khác, không được dồn hết cho một Thread Pool duy nhất.
- Giới hạn kết nối trên mỗi route và tổng số kết nối của HTTP Client Connection Pool phải khớp với mức đồng thời lời gọi thực tế.
- Khi downstream có ngưỡng giới hạn lưu lượng (`rate limit`), tổng mức độ đồng thời của tất cả các instance phía upstream không được vượt quá ngưỡng đó trong thời gian dài.
- Khi một tác vụ gọi tuần tự hoặc song song tới nhiều thành phần phụ thuộc, cần tính riêng thời gian chiếm dụng đối với từng thành phần phụ thuộc đó.

Sau khi tăng số lượng Thread, nếu số kết nối hoạt động, thời gian chờ lấy kết nối, độ trễ P99 downstream và tỷ lệ lỗi cùng lúc tăng lên, việc tiếp tục tăng thêm Thread thường không giúp ích gì. Lúc này cần giảm bớt mức đồng thời vô ích và xử lý slow SQL, timeout phía downstream hoặc tài nguyên điểm nóng (`hotspot`).

## Xử lý như thế nào khi hàng đợi bị tồn đọng?

Hàng đợi tăng liên tục cho thấy tốc độ tác vụ đi vào đã vượt quá tốc độ hoàn thành. Lưu lượng tăng đột ngột sẽ gây tồn đọng, và bản thân tác vụ chạy chậm đi cũng sẽ gây tồn đọng; cách xử lý hai tình huống này khác nhau.

| Hiện tượng | Bằng chứng cần đối chiếu | Hướng xử lý |
| --- | --- | --- |
| Tốc độ đẩy vào tăng lên, thời gian thực thi tác vụ gần như không đổi | QPS đầu vào, lưu lượng chiến dịch, bên gọi retry | Giới hạn lưu lượng đầu vào, tăng instance hoặc dùng MQ cắt đỉnh |
| Tốc độ đẩy vào ổn định, thời gian thực thi tác vụ tăng lên | Thread Dump, slow SQL, chờ khóa, độ trễ downstream | Xử lý tác vụ chậm và sự cố downstream, không vội tăng Thread |
| Thread hoạt động đã đầy, CPU chạm trần trong thời gian dài | Mức sử dụng CPU, run queue, `context switch` | Tối ưu tính toán, chia nhỏ tác vụ hoặc mở rộng máy |
| Thread chờ kết nối cơ sở dữ liệu với số lượng lớn | Số kết nối active/waiting của Connection Pool, timeout lấy kết nối | Giới hạn đồng thời, tối ưu SQL, phân bổ lại ngân sách kết nối |
| Thời gian xếp hàng đã vượt quá thời hạn hiệu lực của tác vụ | Thời gian chờ hàng đợi P95/P99, timeout nghiệp vụ | Fail-fast, loại bỏ tác vụ quá hạn hoặc chuyển sang luồng bù trừ |
| Hàng đợi và số lần từ chối tăng lên, downstream vẫn còn dư tải | Các chỉ số CPU, Connection Pool và downstream đều bình thường | Điều chỉnh số Thread, hàng đợi hoặc số instance sau khi load test |

Mở rộng máy (scale out) phù hợp với trường hợp tổng năng lực của dịch vụ không đủ và tác vụ có thể chia tách theo chiều ngang. Tăng số Thread phù hợp với trường hợp từng instance vẫn còn dư địa CPU và downstream, nhưng mức độ đồng thời hiện tại đang đặt hơi thấp. Khi tác vụ đã quá thời hạn hiệu lực thì tiếp tục xếp hàng không còn nhiều ý nghĩa; còn với các tác vụ bất đồng bộ không được phép mất, nên ghi trước vào MQ hoặc cơ sở dữ liệu để quy trình tiêu thụ hỗ trợ retry xử lý.

Khi trên môi trường production đã xảy ra tồn đọng Thread Pool, có thể tham khảo [Điều tra sự cố production Java Backend](../jvm/jvm-in-action.md#线程池队列堆积怎么排查), kết hợp tốc độ đẩy tác vụ, tốc độ hoàn thành, Thread Dump và trạng thái downstream để khoanh vùng nguyên nhân.

## CallerRunsPolicy có tạo được áp lực ngược (Backpressure) không?

`CallerRunsPolicy` sẽ bắt Thread gọi `execute()` phải tự thực thi tác vụ bị từ chối. Thread đẩy tác vụ vì thế bị làm chậm lại, tốc độ đẩy các tác vụ tiếp theo cũng có thể giảm theo, nên nó có tác dụng điều tiết phản hồi nhất định.

Hiệu quả phụ thuộc vào việc ai là người đẩy tác vụ. Khi Thread tiêu thụ message hoặc Thread điều phối batch job bị buộc phải tự chạy tác vụ, tốc độ kéo dữ liệu từ upstream có thể giảm xuống một cách tự nhiên; nhưng khi Thread xử lý request của Tomcat phải chạy tác vụ dài, Thread request sẽ bị giữ chân, làm độ trễ API và áp lực lên Thread Pool của Web tăng theo. Nếu Thread đẩy tác vụ đang giữ khóa hoặc transaction cơ sở dữ liệu, việc thực thi tác vụ ngay trên Thread gọi còn kéo dài thời gian chiếm giữ khóa và transaction đó.

Sau khi Thread Pool đã đóng (`shutdown`), `CallerRunsPolicy` sẽ không thực thi tác vụ nữa mà vứt bỏ thẳng. Khi nghiệp vụ không chấp nhận mất tác vụ, cần tự cài đặt cơ chế xử lý từ chối riêng: ghi nhận số lần từ chối, trả về lỗi rõ ràng hoặc lưu tác vụ vào nơi lưu trữ bền vững. Đừng chỉ thay đổi mỗi `Rejection Policy` rồi phó mặc bài toán độ tin cậy tác vụ cho bên gọi.

## Các nghiệp vụ khác nhau có nên cô lập Thread Pool không?

Dùng chung Thread Pool sẽ khiến một nhóm tác vụ chậm chiếm hết tài nguyên thực thi của các nghiệp vụ khác. Callback thanh toán, xuất báo cáo và gửi thông báo thông thường có yêu cầu thời hạn, cách xử lý lỗi và tài nguyên phụ thuộc khác hẳn nhau; nhét chung vào một Thread Pool rất khó cấu hình số lượng Thread, hàng đợi và `Rejection Policy` thống nhất.

Cô lập cũng không có nghĩa là cứ mỗi API lại tạo một Thread Pool riêng. Thông thường sẽ phân tách dựa theo độ ưu tiên của tác vụ, đặc trưng thời gian chạy và phụ thuộc downstream: các tác vụ gọi cùng một dịch vụ chậm có thể cô lập riêng; giao dịch cốt lõi và thông báo thứ yếu không dùng chung hàng đợi; tác vụ CPU-bound không trộn lẫn với lượng lớn tác vụ I/O chặn (`blocking I/O`). Quá nhiều Thread Pool sẽ làm tăng chi phí Thread, hàng đợi, giám sát và cấu hình; những tác vụ cùng loại có thể dùng chung một Pool.

Các bài viết trước đây từng dẫn một sự cố thực tế do tác vụ cha và tác vụ con dùng chung Thread Pool (nguồn: [Một sự cố production do sử dụng Thread Pool không đúng cách](https://heapdump.cn/article/646639)):

![Tổng quan mã nguồn ví dụ trong sự cố](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/production-accident-threadpool-sharing-example-546d273a.png)

Giả sử Thread Pool có $n$ Worker Thread và cùng lúc có $n$ tác vụ cha đang chạy. Mỗi tác vụ cha sau khi đẩy tác vụ con vào Pool lại chờ đồng bộ cho đến khi tác vụ con kết thúc. Các tác vụ con đi vào hàng đợi nhưng không có Thread rảnh nào để thực thi; tác vụ cha không kết thúc nên Worker Thread cũng không được giải phóng, cuối cùng tạo thành Thread Starvation Deadlock (tắc nghẽn do đói Thread).

![Sử dụng Thread Pool sai cách dẫn đến Deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/production-accident-threadpool-sharing-deadlock-75237ba7.png)

Tác vụ cha và các tác vụ con mà nó chờ đồng bộ không nên sử dụng chung Thread Pool giới hạn đó để tạo thành vòng chờ tuần hoàn. Bạn có thể để tác vụ cha trực tiếp thực thi logic con, chuyển sang điều phối tác vụ không chặn (non-blocking), hoặc cấp tài nguyên thực thi độc lập cho những tác vụ con thực sự cần cô lập.

## Tác vụ bị timeout có tự động dừng lại không?

`Future.get(timeout, unit)` chỉ giới hạn thời gian Thread gọi ngồi chờ kết quả. Khi ném ra `TimeoutException`, tác vụ chạy ngầm có thể vẫn đang tiếp tục chạy. Gọi `cancel(true)` có thể thử ngắt (`interrupt`) Thread đang thực thi, nhưng ngắt trong Java là cơ chế mang tính hợp tác: nếu tác vụ không kiểm tra trạng thái ngắt, hoặc lời gọi tầng dưới không phản hồi tín hiệu ngắt, tác vụ vẫn có thể chạy tiếp.

```java
Future<String> future = executor.submit(this::callRemoteService);

try {
    return future.get(200, TimeUnit.MILLISECONDS);
} catch (TimeoutException e) {
    future.cancel(true);
    throw new IllegalStateException("调用超时", e);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new IllegalStateException("等待任务时被中断", e);
} catch (ExecutionException e) {
    throw new IllegalStateException("任务执行失败", e.getCause());
}
```

Đoạn code này vẫn chưa đủ để thay thế cho timeout mạng. HTTP Client, cơ sở dữ liệu và Redis Client vẫn bắt buộc phải cấu hình connect timeout, read timeout và tổng timeout lời gọi; nếu không, Thread có thể bị kẹt mãi trong các thao tác tầng dưới vốn không phản hồi tín hiệu ngắt.

Sau khi mã tác vụ bắt được `InterruptedException`, thông thường cần kết thúc công việc hiện tại; nếu không thể kết thúc ngay ở tầng hiện tại, phải khôi phục lại cờ ngắt để tầng trên tiếp tục xử lý:

```java
try {
    blockingCall();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}
```

`CompletableFuture.orTimeout()` sẽ khiến `CompletableFuture` hoàn thành ở trạng thái ngoại lệ sau khi quá thời gian, nhưng không tự động chấm dứt tác vụ bên dưới. Tham số của `CompletableFuture.cancel(true)` trong bản cài đặt đó cũng không kích hoạt ngắt Thread. Khi dùng `CompletableFuture` để điều phối các tác vụ blocking, vẫn phải cấu hình timeout và phương án hủy cho các lời gọi tầng dưới.

## Tại sao ngoại lệ trong tác vụ bất đồng bộ dễ bị nuốt mất?

Khi `Runnable` được gửi qua `execute()` ném ra ngoại lệ chưa được bắt, Worker Thread sẽ kết thúc bất thường và có thể được ghi log bởi `UncaughtExceptionHandler` của Thread. Khi gửi qua `submit()`, tác vụ thường được bọc thành `FutureTask`, ngoại lệ được lưu bên trong đối tượng `Future` trả về; nếu bên gọi không giữ `Future` và cũng không gọi `get()`, ngoại lệ có thể sẽ không có dòng log nghiệp vụ nào.

`ThreadPoolExecutor.afterExecute()` cũng có điểm khác biệt tương tự. Khi dùng `submit()`, tham số `Throwable` truyền vào `afterExecute()` thường là `null`; bạn cần kiểm tra xem tác vụ có phải là một `Future` đã hoàn thành hay không rồi mới lấy ngoại lệ ra thông qua `get()`.

Cách xử lý ngoại lệ tốt nhất nên được thống nhất trong toàn dự án: bên gọi tiêu thụ `Future`, điểm đầu vào của tác vụ chủ động bắt và ghi log ngoại lệ, hoặc mở rộng Thread Pool để xử lý tập trung. Log phải đính kèm loại tác vụ, ID nghiệp vụ và Trace ID, tránh chỉ in ra một đoạn stack trace tách rời khỏi ngữ cảnh nghiệp vụ.

## Nên giám sát những chỉ số nào của Thread Pool?

Thông tin thống kê có sẵn của `ThreadPoolExecutor` cho phép xem số Thread hiện tại, số Thread đang hoạt động (`active`), số Thread tối đa trong lịch sử, tổng số tác vụ, số tác vụ đã hoàn thành và độ dài hàng đợi. Phần lớn các giá trị này là giá trị gần đúng, phù hợp cho giám sát và phân tích xu hướng, không phù hợp để tham gia vào các quyết định nghiệp vụ đòi hỏi tính nhất quán chặt chẽ.

Giám sát trên môi trường production tối thiểu cần bao phủ:

- **Lưu lượng tác vụ**: Tốc độ đẩy vào, tốc độ bắt đầu thực thi và tốc độ hoàn thành.
- **Trạng thái Thread**: Số Thread hiện tại, số Thread đang hoạt động, số Thread tối đa lịch sử và tỷ lệ hoạt động.
- **Trạng thái hàng đợi**: Độ dài hiện tại, tổng dung lượng, tỷ lệ sử dụng và thời gian chờ trong hàng đợi.
- **Kết quả tác vụ**: Thời gian thực thi, số lượng thành công, số lượng ngoại lệ, số lượng timeout, số lượng bị hủy và số lượng bị từ chối.
- **Tài nguyên liên quan**: CPU, bộ nhớ Heap, Connection Pool cơ sở dữ liệu, Connection Pool HTTP và độ trễ downstream.

Tổng số tác vụ và số tác vụ đã hoàn thành là giá trị cộng dồn, cần tính hiệu số trong một khoảng thời gian mới ra được tốc độ. Độ dài hàng đợi cũng phải kết hợp với xu hướng biến động: đều là hàng đợi dài 100, nhưng một bên đang giảm từ 500 xuống 100 còn bên kia đang tăng từ 10 lên 100 thì mức độ rủi ro hoàn toàn khác nhau.

Thời gian xếp hàng và thời gian thực thi không được gộp chung thành một chỉ số. Thời gian xếp hàng tăng trong khi thời gian thực thi ổn định phần lớn là do thiếu dung lượng hoặc lưu lượng tăng vọt; còn thời gian thực thi tăng trước rồi hàng đợi mới bắt đầu phình to thì nên ưu tiên kiểm tra logic tác vụ và downstream. Có thể ghi lại timestamp lúc đẩy tác vụ, rồi tính riêng hai quãng thời gian này khi tác vụ thực sự bắt đầu chạy và khi kết thúc.

Hàng đợi bỗng nhiên dài ra trong một chu kỳ thu thập chỉ số có thể chỉ là gai lưu lượng nhất thời rồi sẽ hạ xuống nhanh chóng. Quy tắc cảnh báo ngoài ngưỡng giá trị còn cần thêm thời gian duy trì liên tục, và xác nhận xem phần tồn đọng có tự tiêu hóa được không. Hàng đợi nằm ở mức cao trong thời gian dài và tốc độ hoàn thành liên tục thấp hơn tốc độ đẩy vào chứng tỏ tác vụ cũ đang chất đống ngày càng nhiều; khi thời gian xếp hàng P99 tiệm cận thời gian có thể chờ của tác vụ, ngay cả khi hàng đợi chưa đầy cũng phải phát cảnh báo. Số lần bị từ chối cần thống kê riêng: với tác vụ cốt lõi, hễ có từ chối là cảnh báo ngay; với tác vụ cho phép loại bỏ thì mới thiết lập ngưỡng theo tỷ lệ từ chối và thời gian kéo dài.

## Điều chỉnh tham số động giải quyết được vấn đề gì?

Khi thời gian xử lý tác vụ không biến động rõ rệt, CPU, Connection Pool và downstream vẫn còn dư tải, mà chỉ là mức đồng thời hiện tại không theo kịp tốc độ đẩy tác vụ, lúc này có thể điều chỉnh số lượng Thread. Ngược lại, nếu các Thread đều đang kẹt ở kết nối cơ sở dữ liệu, slow SQL hoặc timeout downstream, việc tăng số Thread chỉ làm xuất hiện thêm một loạt Thread đứng chờ.

Một số tham số của `ThreadPoolExecutor` có thể chỉnh sửa trực tuyến, nhưng cơ chế phát huy hiệu lực không giống nhau. Trong lúc đang chạy có thể thay đổi `corePoolSize`, `maximumPoolSize`, `keepAliveTime`, `Rejection Policy` và `ThreadFactory`. Sau khi tăng `corePoolSize`, chỉ cần trong hàng đợi vẫn còn tác vụ, Thread Pool sẽ tạo Thread mới theo nhu cầu. Khi giảm `corePoolSize` hoặc `maximumPoolSize`, các tác vụ đang chạy sẽ không bị ngắt; các Worker Thread dư ra sẽ thoát sau khi rảnh rỗi. `ThreadFactory` mới thiết lập chỉ ảnh hưởng tới các Thread được tạo sau thời điểm đó, không đổi tên những Worker Thread đã tồn tại.

Khi thay đổi `corePoolSize` và `maximumPoolSize` cần chú ý thứ tự:

- Nếu `corePoolSize` mới cao hơn `maximumPoolSize` cũ, hãy tăng `maximumPoolSize` lên trước, rồi mới chỉnh `corePoolSize`.
- Nếu `maximumPoolSize` mới thấp hơn `corePoolSize` cũ, hãy giảm `corePoolSize` xuống trước, rồi mới chỉnh `maximumPoolSize`.

Nếu không, bước kiểm tra tham số sẽ ném ra `IllegalArgumentException`.

JDK không cung cấp phương thức phổ thông để sửa dung lượng của `BlockingQueue` hiện có. Khi cần điều chỉnh hàng đợi, có thể sử dụng các hàng đợi cho phép thay đổi dung lượng đã được kiểm chứng hoặc các framework Dynamic Thread Pool; nếu tự sửa hiện thực `LinkedBlockingQueue` thì phải xử lý đồng thời tính khả kiến đồng bộ (`Visibility`), điều kiện nhập hàng đợi và logic đánh thức, chứ không thể chỉ đổi mỗi một trường dung lượng.

Đội ngũ kỹ thuật Meituan từng giới thiệu hướng thiết kế cấu hình động tham số và cảnh báo giám sát Thread Pool trong bài viết [Nguyên lý cài đặt Java Thread Pool và thực tiễn áp dụng trong nghiệp vụ tại Meituan](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html). Trong các giải pháp mã nguồn mở, [Hippo4j](https://github.com/opengoofy/hippo4j) và [Dynamic TP](https://github.com/dromara/dynamic-tp) đều cung cấp khả năng cấu hình động, giám sát và cảnh báo. Trước khi đưa vào sử dụng, vẫn cần đối chiếu loại Thread Pool dự án đang dùng, configuration center, phiên bản framework và phương án hạ cấp khi sự cố xảy ra.

Việc điều chỉnh trước tham số trước giờ cao điểm nghiệp vụ tốt nhất nên dựa trên chỉ số lịch sử hoặc kết quả load test. Sau khi điều chỉnh, nếu tốc độ hoàn thành không tăng mà ngược lại xuất hiện tình trạng CPU tăng cao, chờ Connection Pool hoặc tăng tỷ lệ lỗi phía downstream, cần rollback tham số ngay và tiếp tục kiểm tra bản thân tác vụ cùng các thành phần phụ thuộc.

Khi sửa đổi trực tiếp trên production, cần giữ giới hạn trên/dưới cho tham số, lịch sử thay đổi, phạm vi canary và giá trị rollback. Mỗi lần cố gắng chỉ thay đổi một biến số chính, quan sát tốc độ hoàn thành tác vụ, thời gian xếp hàng, số lần từ chối và áp lực downstream rồi mới quyết định có tiếp tục chỉnh hay không.

## Còn những vấn đề nào dễ bị bỏ qua?

### Không tạo đi tạo lại Thread Pool

Thread Pool dùng để tái sử dụng Thread, không nên tạo mới lại ở mỗi request hoặc mỗi lần gọi phương thức. Tạo và hủy thường xuyên sẽ làm tăng chi phí khởi tạo và tiêu hủy Thread, đồng thời dễ bỏ sót logic đóng Pool. Các Thread Pool cấp ứng dụng thường được giao cho container quản lý thống nhất vòng đời.

`@Async` của Spring, tác vụ định kỳ, Web container và một số client cũng tự sử dụng Thread Pool bên trong. Dự án không gọi tường minh `new ThreadPoolExecutor()` không có nghĩa là không tồn tại những Thread Pool cần cấu hình và giám sát.

### Không để tác vụ dài chiếm kín Thread Pool dùng chung

Các tác vụ bị chặn kéo dài sẽ chiếm giữ Worker Thread, khiến các tác vụ ngắn phía sau chỉ còn cách xếp hàng chờ. Xuất báo cáo, xử lý file và các API bên ngoài chậm phù hợp sử dụng tài nguyên thực thi độc lập, hoặc chuyển thành tác vụ bất đồng bộ và trả trạng thái tác vụ về cho người dùng.

`CompletableFuture` chỉ đảm nhận việc điều phối tác vụ, không thể biến lời gọi mạng dạng blocking thành thao tác non-blocking. Các phương thức bất đồng bộ không truyền tường minh `Executor` thường dùng Thread Pool công cộng (`ForkJoinPool.commonPool()`); khi Pool công cộng này bị nghẽn, nó còn có thể ảnh hưởng tới các tác vụ bất đồng bộ khác trong toàn ứng dụng.

### Dọn dẹp ngữ cảnh Thread (Thread Context)

Thread Pool tái sử dụng lại Thread. Nếu tác vụ trước ghi dữ liệu vào `ThreadLocal` mà không dọn dẹp, tác vụ sau chạy trên cùng Thread đó có thể đọc nhầm giá trị cũ, đồng thời còn có thể khiến các đối tượng lớn bị Worker Thread giữ tham chiếu trong thời gian dài.

Việc truyền và dọn dẹp ngữ cảnh nên được xử lý qua một bộ bọc tác vụ (task wrapper) thống nhất, khôi phục hoặc xóa giá trị gốc trong khối `finally`. Log MDC, thông tin đăng nhập và thông tin tenant đều phải tính đến vấn đề này. Với các kịch bản truyền ngữ cảnh xuyên Thread, cũng có thể dùng [TransmittableThreadLocal](https://github.com/alibaba/transmittable-thread-local), nhưng vẫn phải xác nhận rõ cách bọc tác vụ và thời điểm dọn dẹp.

### Đóng Thread Pool đúng cách

`shutdown()` ngừng nhận tác vụ mới nhưng vẫn tiếp tục xử lý hết các tác vụ đã được đẩy vào trước đó; `shutdownNow()` sẽ cố gắng ngắt các tác vụ đang chạy và trả về danh sách các tác vụ chưa bắt đầu chạy. Cả hai phương thức đều không chờ cho đến khi Thread Pool dừng hẳn.

```java
executor.shutdown();
try {
    if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
        executor.shutdownNow();
        if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
            System.err.println("线程池未能正常退出");
        }
    }
} catch (InterruptedException e) {
    executor.shutdownNow();
    Thread.currentThread().interrupt();
}
```

Tác vụ cần phản hồi đúng cách với tín hiệu ngắt, nếu không thì ngay cả `shutdownNow()` cũng không đảm bảo dừng lại ngay lập tức. Trong lúc ứng dụng tắt, còn phải quyết định xem các tác vụ trong hàng đợi có được phép mất hay không; những tác vụ nghiệp vụ không thể để mất không nên chỉ tồn tại trong bộ nhớ của tiến trình.

## Sau khi dùng Virtual Thread có còn cần Thread Pool truyền thống nữa không?

Virtual Thread (luồng ảo) phù hợp với những tác vụ chứa nhiều khoảng chờ blocking. Chi phí tạo mới và chuyển ngữ cảnh của nó thấp hơn nhiều so với Platform Thread, nên thông thường áp dụng mô hình mỗi tác vụ một Virtual Thread, tuyệt đối không đưa Virtual Thread vào một Pool kích thước cố định để tái sử dụng.

Khi cần giới hạn mức độ đồng thời truy cập cơ sở dữ liệu hoặc API downstream, hãy tiếp tục sử dụng Connection Pool, `Semaphore`, Rate Limiter và các cơ chế tương tự để ràng buộc tài nguyên cụ thể. Số lượng Virtual Thread có nhiều đến đâu cũng không làm tăng số kết nối DB, số nhân CPU hay năng lực của API downstream.

Platform Thread Pool truyền thống vẫn phù hợp cho các tác vụ CPU-bound, các tác vụ cần Thread điều phối cố định và các thành phần bắt buộc phải kiểm soát tường minh Platform Thread cùng hàng đợi công việc. Dự án có nên chuyển dịch hay không còn phụ thuộc vào phiên bản JDK, mức độ hỗ trợ của framework, công cụ giám sát và mô hình bất đồng bộ hiện có. Giải thích chi tiết có thể tham khảo [Tổng hợp câu hỏi thường gặp về Virtual Thread](./virtual-thread.md).

## Trả lời phỏng vấn về cấu hình tham số Thread Pool như thế nào?

Khi trả lời về tham số Thread Pool, có thể xuất phát từ đặc tính tác vụ và năng lực hệ thống: trước tiên dựa vào tốc độ đẩy tác vụ lúc cao điểm và thời gian xử lý tác vụ để ước lượng nhu cầu đồng thời, sau đó tách bạch giữa thời gian tính toán và thời gian chờ I/O; số lượng Thread còn chịu ràng buộc từ CPU, Connection Pool cơ sở dữ liệu, Connection Pool HTTP và giới hạn lưu lượng phía downstream. Hàng đợi chỉ dùng để hấp thụ lưu lượng bùng nổ ngắn hạn, dung lượng của nó phải đáp ứng đồng thời cả thời hạn chờ nghiệp vụ lẫn giới hạn bộ nhớ. Sau khi chốt tham số ban đầu, thông qua load test và giám sát trên production để theo dõi tốc độ đẩy vào, tốc độ hoàn thành, thời gian xếp hàng, thời gian thực thi và số lần từ chối, rồi điều chỉnh dần từng bước.

Nếu người phỏng vấn hỏi sâu thêm về tình trạng tồn đọng hàng đợi, đừng chỉ trả lời mỗi việc mở rộng Thread Pool. Trước tiên hãy so sánh tốc độ đẩy tác vụ và tốc độ hoàn thành, sau đó xem xét thời gian thực thi, Thread Dump, CPU, Connection Pool và độ trễ downstream. Lưu lượng tăng cao có thể giới hạn lưu lượng hoặc tăng instance; tác vụ chạy chậm phải xử lý SQL, khóa hoặc sự cố downstream; khi tác vụ đã quá hạn thì cần fail-fast hoặc chuyển sang cơ chế bù trừ. Điều chỉnh tham số động chỉ giải quyết được phần cấu hình dung lượng chưa phù hợp, chứ không thể thay thế cho timeout, cô lập, giới hạn lưu lượng và quản trị downstream.

## Tài liệu tham khảo

- [Tài liệu API ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
- [Tài liệu API Future](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Future.html)
- [Tài liệu API CompletableFuture](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [Nguyên lý cài đặt Java Thread Pool và thực tiễn áp dụng trong nghiệp vụ tại Meituan](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html)
- *Java Concurrency in Practice*
