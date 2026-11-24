---
title: Giải thích chi tiết về Tác vụ định kỳ (Scheduled Task) trong Java
category: Thiết kế hệ thống (System Design)
icon: "mdi:clock-outline"
description: "Hướng dẫn hệ thống về tác vụ định kỳ và tác vụ trễ trong Java: Timer, ScheduledThreadPoolExecutor, DelayQueue, Time Wheel (bánh xe thời gian), Spring @Scheduled (biểu thức Cron), cùng so sánh lựa chọn và kịch bản áp dụng các framework điều phối phân tán như Quartz, XXL-JOB, ElasticJob, PowerJob (hủy đơn quá hạn/sao lưu định kỳ/thu thập dữ liệu định kỳ)."
head:
  - - meta
    - name: keywords
      content: Tác vụ định kỳ,Scheduled Task,Quartz,Elastic-Job,XXL-JOB,PowerJob
lang: vi
sourceRef: zh-ref/system-design/schedule-task.md
---

## Tại sao cần tác vụ định kỳ?

Hãy xem xét một số kịch bản nghiệp vụ rất phổ biến dưới đây:

1. Một hệ thống cần sao lưu dữ liệu vào lúc 1 giờ sáng hằng ngày.
2. Một sàn thương mại điện tử: khi người dùng đặt đơn mà sau 30 phút chưa thanh toán thì cần tự động hủy đơn hàng.
3. Một nền tảng tổng hợp tin tức: cứ mỗi 10 phút tự động thu thập (crawl) dữ liệu từ một website khác về cho hệ thống của mình.
4. Một nền tảng blog hỗ trợ hẹn giờ đăng bài viết.
5. Một nền tảng quỹ đầu tư: mỗi tối tính toán lợi nhuận trong ngày của người dùng và gửi thông báo số liệu mới nhất.
6. ……

Những kịch bản này đều yêu cầu chúng ta thực hiện một công việc nào đó vào một thời điểm cụ thể, tức là làm theo lịch định kỳ hoặc làm sau một khoảng trễ.

- Tác vụ định kỳ (Scheduled Task): Thực thi một tác vụ cụ thể tại các mốc thời gian xác định, ví dụ 8 giờ sáng mỗi ngày, 3 giờ chiều thứ Hai hằng tuần. Tác vụ định kỳ thường dùng cho các công việc lặp lại theo chu kỳ như sao lưu dữ liệu, dọn dẹp log, xuất báo cáo.
- Tác vụ trễ (Delayed Task): Thực thi một tác vụ cụ thể sau một khoảng thời gian trễ nhất định, ví dụ sau 10 phút, sau 3 giờ. Tác vụ trễ thường dùng cho các xử lý bất đồng bộ như hủy đơn hàng, gửi thông báo đẩy (push notification), thu hồi lì xì quá hạn.

Mặc dù kịch bản áp dụng của hai loại có khác nhau, nhưng tư tưởng cốt lõi đều là sắp xếp thời điểm thực thi tác vụ vào một mốc trong tương lai để đạt được hiệu quả điều phối mong muốn.

## Tác vụ định kỳ trên một máy (Single-Node)

### `Timer`

`java.util.Timer` là một cách cài đặt tác vụ định kỳ đã được hỗ trợ từ JDK 1.3.

Bên trong `Timer` sử dụng một lớp gọi là `TaskQueue` để lưu trữ các tác vụ định kỳ; đây là một hàng đợi ưu tiên (Priority Queue) được cài đặt dựa trên Min-Heap. `TaskQueue` sắp xếp các tác vụ theo khoảng thời gian còn lại tới lần chạy kế tiếp, đảm bảo tác vụ ở đỉnh Heap luôn được chạy trước tiên. Nhờ đó, mỗi khi cần chạy tác vụ, chỉ việc lấy phần tử ở đỉnh Heap ra thực thi!

Cách dùng `Timer` khá đơn giản; với đoạn mã sau, ta có thể tạo một tác vụ chạy sau 1 giây:

```java
// Mã minh họa:
TimerTask task = new TimerTask() {
    public void run() {
        System.out.println("Thời gian hiện tại: " + new Date() + "\n" +
                "Tên Thread: " + Thread.currentThread().getName());
    }
};
System.out.println("Thời gian hiện tại: " + new Date() + "\n" +
        "Tên Thread: " + Thread.currentThread().getName());
Timer timer = new Timer("Timer");
long delay = 1000L;
timer.schedule(task, delay);


// Kết quả xuất ra:
Thời gian hiện tại: Fri May 28 15:18:47 CST 2021
Tên Thread: main
Thời gian hiện tại: Fri May 28 15:18:48 CST 2021
Tên Thread: Timer
```

Tuy nhiên, nhược điểm của `Timer` khá nhiều. Mỗi `Timer` chỉ dùng duy nhất một Background Thread để chạy tuần tự tất cả các tác vụ, nên một tác vụ chạy quá lâu sẽ làm chậm trễ các tác vụ khác. Nếu `TimerTask#run()` ném ra Runtime Exception hoặc Error không được bắt, Thread thực thi duy nhất của `Timer` đó sẽ chấm dứt và các tác vụ tiếp theo cũng không thể tiếp tục được điều phối. Hành vi này không thể tóm gọn đơn thuần thành "`Timer` chỉ bắt `InterruptedException`".

Trên lớp `Timer` có một đoạn chú thích như sau:

```java
 * This class does not offer real-time guarantees: it schedules
 * tasks using the <tt>Object.wait(long)</tt> method.
 *Java 5.0 introduced the {@code java.util.concurrent} package and
 * one of the concurrency utilities therein is the {@link
 * java.util.concurrent.ScheduledThreadPoolExecutor
 * ScheduledThreadPoolExecutor} which is a thread pool for repeatedly
 * executing tasks at a given rate or delay.  It is effectively a more
 * versatile replacement for the {@code Timer}/{@code TimerTask}
 * combination, as it allows multiple service threads, accepts various
 * time units, and doesn't require subclassing {@code TimerTask} (just
 * implement {@code Runnable}).  Configuring {@code
 * ScheduledThreadPoolExecutor} with one thread makes it equivalent to
 * {@code Timer}.
```

Đại ý là: `ScheduledThreadPoolExecutor` hỗ trợ thực thi tác vụ định kỳ bằng nhiều Thread và có nhiều tính năng mạnh mẽ hơn, là giải pháp thay thế cho `Timer`.

### `ScheduledExecutorService`

`ScheduledExecutorService` là một interface có nhiều lớp cài đặt, trong đó phổ biến nhất là `ScheduledThreadPoolExecutor`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/20210607154324712-748f068e.png)

Bản thân `ScheduledThreadPoolExecutor` là một Thread Pool hỗ trợ chạy đồng thời nhiều tác vụ. Bên trong nó sử dụng `DelayedWorkQueue` làm hàng đợi tác vụ.

```java
// Mã minh họa:
TimerTask repeatedTask = new TimerTask() {
    @SneakyThrows
    public void run() {
        System.out.println("Thời gian hiện tại: " + new Date() + "\n" +
                "Tên Thread: " + Thread.currentThread().getName());
    }
};
System.out.println("Thời gian hiện tại: " + new Date() + "\n" +
        "Tên Thread: " + Thread.currentThread().getName());
ScheduledExecutorService executor = Executors.newScheduledThreadPool(3);
long delay  = 1000L;
long period = 1000L;
executor.scheduleAtFixedRate(repeatedTask, delay, period, TimeUnit.MILLISECONDS);
Thread.sleep(delay + period * 5);
executor.shutdown();
// Kết quả xuất ra:
Thời gian hiện tại: Fri May 28 15:40:46 CST 2021
Tên Thread: main
Thời gian hiện tại: Fri May 28 15:40:47 CST 2021
Tên Thread: pool-1-thread-1
Thời gian hiện tại: Fri May 28 15:40:48 CST 2021
Tên Thread: pool-1-thread-1
Thời gian hiện tại: Fri May 28 15:40:49 CST 2021
Tên Thread: pool-1-thread-2
Thời gian hiện tại: Fri May 28 15:40:50 CST 2021
Tên Thread: pool-1-thread-2
Thời gian hiện tại: Fri May 28 15:40:51 CST 2021
Tên Thread: pool-1-thread-2
Thời gian hiện tại: Fri May 28 15:40:52 CST 2021
Tên Thread: pool-1-thread-2
```

Dù dùng `Timer` hay `ScheduledExecutorService` thì đều không thể dùng biểu thức Cron để chỉ định thời điểm chạy cụ thể của tác vụ.

### `DelayQueue`

`DelayQueue` là hàng đợi trễ do gói JUC (`java.util.concurrent`) cung cấp, dùng để triển khai tác vụ trễ như tự động hủy đơn hàng sau 15 phút đặt mà chưa thanh toán. Đây là một dạng `BlockingQueue`, bên dưới dùng `PriorityQueue` để cài đặt thành hàng đợi không giới hạn dung lượng (unbounded) và an toàn luồng (thread-safe). Về `PriorityQueue`, bạn có thể tham khảo bài viết do tác giả biên soạn: [Phân tích mã nguồn PriorityQueue](https://javaguide.cn/java/collection/priorityqueue-source-code.html).

![Các lớp cài đặt của BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-hierarchy-755d1cd5.png)

Cả `DelayQueue` lẫn `Timer/TimerTask` đều có thể làm nền tảng cho điều phối trễ. `DelayQueue` dùng hàng đợi ưu tiên để quản lý các phần tử cài đặt interface `Delayed`, chỉ khi hết thời gian trễ thì phần tử mới được lấy ra; tuy nhiên bản thân nó không tự tạo Thread để chạy tác vụ, mà thường cần tự viết vòng lặp tiêu thụ (consumer loop) và chọn Executor phù hợp. Trong khi đó `Timer` có sẵn một Thread thực thi riêng. Cả hai đều cho phép thêm tác vụ mới sau khi đã khởi tạo và đều hỗ trợ hủy hoặc xóa tác vụ; nhận định "`Timer` chỉ có thể chỉ định tác vụ lúc khởi tạo" là không đúng.

Để tìm hiểu chi tiết về `DelayQueue`, hãy tham khảo bài viết: [Phân tích mã nguồn `DelayQueue`](https://javaguide.cn/java/collection/delayqueue-source-code.html).

### Spring Task

Chúng ta có thể định nghĩa trực tiếp tác vụ định kỳ thông qua annotation `@Scheduled` mà Spring cung cấp — cực kỳ tiện lợi!

```java
/**
 * cron: Sử dụng biểu thức Cron. Chạy vào giây thứ 1 và 2 của mỗi phút
 */
@Scheduled(cron = "1-2 * * * * ? ")
public void reportCurrentTimeWithCronExpression() {
  log.info("Cron Expression: The time is now {}", dateFormat.format(new Date()));
}

```

Hồi đại học khi làm một dự án doanh nghiệp dùng SSM, mình cũng dùng Spring Task để chạy tác vụ định kỳ.

Hơn nữa, Spring Task còn hỗ trợ **biểu thức Cron (Cron Expression)**. Biểu thức Cron chủ yếu dùng trong hệ thống tác vụ định kỳ để định nghĩa thời gian hoặc tần suất thực thi; nó rất mạnh mẽ, giúp bạn cấu hình tác vụ chạy vào giờ nào mỗi ngày hoặc ngày nào mỗi tháng. Nếu học về tác vụ định kỳ thì biểu thức Cron chắc chắn là phần cần tập trung nắm vững. Giới thiệu một công cụ tạo biểu thức Cron trực tuyến: <http://cron.qqe2.com/>.

Tuy nhiên, cơ chế điều phối sẵn có của Spring chỉ hỗ trợ chạy trên một máy đơn lẻ và tính năng khá đơn giản. Trước đây mình từng viết một bài: [Hiểu nhanh cách Schedule Tasks trong Spring Boot trong 5 phút](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485563&idx=1&sn=7419341f04036a10b141b74624a3f8c9&chksm=cea247b0f9d5cea6440759e6d49b4e77d06f4c99470243a10c1463834e873ca90266413fbc92&token=2133161636&lang=zh_CN#rd), các bạn chưa rõ có thể tham khảo thêm.

Spring cung cấp tầng trừu tượng điều phối thông qua `TaskScheduler` chứ không cố định chỉ một hiện thực bên dưới. Lớp hay dùng `ThreadPoolTaskScheduler` bên trong ủy quyền cho `ScheduledExecutorService`; trong môi trường như Jakarta EE cũng có thể dùng bộ điều phối do Container quản lý. Bản thân `@Scheduled` không cung cấp cơ chế điều phối Cluster: khi triển khai nhiều instance của cùng một ứng dụng, mỗi instance đều có thể kích hoạt tác vụ.

**Tổng kết ưu nhược điểm:**

- Ưu điểm: Đơn giản, gọn nhẹ, hỗ trợ biểu thức Cron
- Nhược điểm: Tính năng đơn giản

### Time Wheel (Bánh xe thời gian)

Kafka, Dubbo, ZooKeeper, Netty, Caffeine và Akka đều có cài đặt Time Wheel.

Nói một cách đơn giản, Time Wheel là một hàng đợi vòng (circular queue, bên dưới thường cài đặt bằng mảng), mỗi phần tử trong hàng đợi (gọi là một ô thời gian / slot) có thể chứa một danh sách các tác vụ định kỳ.

Mỗi ô thời gian trong Time Wheel đại diện cho khoảng thời gian cơ bản hay độ chính xác thời gian của bánh xe; ví dụ nếu cứ 1 giây kim dịch qua một ô thì độ chính xác cao nhất của Time Wheel này là 1 giây (nghĩa là 3 giây và 3.9 giây sẽ rơi vào cùng một ô).

Hình dưới đây là một Time Wheel gồm 12 ô thời gian, quay hết một vòng mất 12 giây. Khi cần tạo một tác vụ chạy sau 3 giây, chỉ cần đặt tác vụ vào ô có chỉ số 3. Khi cần tạo tác vụ chạy sau 9 giây, chỉ cần đặt vào ô có chỉ số 9.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/one-layers-of-time-wheel-52b302cf.png)

Vậy nếu cần tạo một tác vụ chạy sau 13 giây thì sao? Lúc này có thể đưa thêm khái niệm **số vòng (rounds)**. Tác vụ vẫn nằm ở ô chỉ số 1, đồng thời ghi nhận số vòng còn phải chờ, chỉ thực thi sau khi quay trọn một vòng rồi đi thêm 1 giây nữa. Các cài đặt khác nhau có thể quy ước khác nhau về việc ô hiện tại có tính vào số vòng hay không, nên không được tách khỏi hiện thực cụ thể để quy chụp cứng là "2 vòng".

Ngoài cách tăng số vòng, còn có loại **Time Wheel đa tầng (Hierarchical Time Wheel)** (giống như đồng hồ đeo tay), và Kafka chính là đang sử dụng phương án này.

Dựa vào sơ đồ Time Wheel bên dưới, mình lấy một ví dụ để các bạn dễ hình dung.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/three-layers-of-time-wheel-29645300.png)

Trong Time Wheel trên (ms -> s), tầng 1 có độ chính xác là 1, tầng 2 có độ chính xác là 20, tầng 3 có độ chính xác là 400. Giả sử cần thêm tác vụ A chạy sau 350 giây (thời điểm hiện tại là 0 giây), tác vụ này sẽ được đặt vào tầng 2 (vì tổng độ dài tầng 2 là 20 * 20 = 400 > 350) tại ô số 350 / 20 = 17.

Sau khi tầng 1 quay đủ 17 vòng, tức là 340 giây đã trôi qua, kim của tầng 2 lúc này trỏ tới ô số 17. Khi đó, tác vụ ở ô số 17 của tầng 2 sẽ được chuyển xuống tầng 1.

Tác vụ A lúc này còn 10 giây nữa là chạy, vì vậy nó được chuyển vào ô số 10 của tầng 1.

Việc di chuyển qua lại giữa các tầng như thế này còn gọi là nâng/hạ cấp (cascading) của Time Wheel. Cứ liên hệ với chiếc đồng hồ cơ là hiểu ngay!

**Time Wheel rất phù hợp với bài toán quản lý số lượng lớn Timer. Trong các cài đặt điển hình có số tầng và số slot mỗi tầng hữu hạn, chi phí định vị slot, chèn tác vụ và đẩy kim thời gian thường tiệm cận O(1); tuy nhiên chi phí thực thi thực tế ở một nhịp (tick) cụ thể vẫn phụ thuộc vào số tác vụ đến hạn, quá trình di chuyển giữa các tầng và hiện thực cụ thể.**

## Tác vụ định kỳ phân tán

### Redis

Redis có thể dùng để làm tác vụ trễ; giải pháp làm tác vụ trễ trên nền Redis về cơ bản chỉ có hai hướng sau:

1. Lắng nghe sự kiện hết hạn khóa (Key Expiration Event) của Redis
2. Hàng đợi trễ tích hợp sẵn của Redisson (`RDelayedQueue`)

Phần nội dung chi tiết này mình đã trình bày trong tài liệu [*Các câu hỏi thiết kế hệ thống & tình huống tần suất cao trong phỏng vấn Backend*](https://javaguide.cn/zhuanlan/back-end-interview-high-frequency-system-design-and-scenario-questions.html), các bạn cần có thể vào Planet để đọc học thêm. Do dung lượng khá dài nên ở đây không chia sẻ lặp lại.

### MQ

Đa số Message Queue như RocketMQ, RabbitMQ đều hỗ trợ message định kỳ / message trễ (Scheduled / Delayed Message). Về bản chất message định kỳ và message trễ là giống nhau: đều là phía Server căn cứ theo thời gian hẹn giờ trên message để phát message tới Consumer tiêu thụ tại một mốc thời gian cố định.

Tuy nhiên, trước khi dùng message định kỳ của MQ, nhất định phải xem kỹ giới hạn của từng sản phẩm và từng phiên bản. Ví dụ, bản chính thức RocketMQ 4.x cung cấp 18 mức trễ cố định với tối đa 2 giờ; sang RocketMQ 5.x đã đổi sang đặt thời điểm phát theo Unix Timestamp ở mức mili giây, với phạm vi hẹn giờ tối đa mặc định là 24 giờ. Không thể gộp cơ chế của hai dòng phiên bản này thành cùng một giới hạn chung.

**Tổng kết ưu nhược điểm:**

- **Ưu điểm**: Tích hợp được với Spring, hỗ trợ phân tán, hỗ trợ Cluster, hiệu năng tốt
- **Nhược điểm**: Tính năng điều phối hạn chế, kém linh hoạt, cần tự đảm bảo độ tin cậy của message

## Các Framework điều phối tác vụ phân tán

Nếu cần các tính năng nâng cao như phân mảnh tác vụ (Sharding) và độ sẵn sàng cao (High Availability) trong môi trường phân tán, chúng ta cần dùng đến các Framework điều phối tác vụ phân tán.

Thông thường, việc thực thi một tác vụ định kỳ phân tán sẽ liên quan đến các vai trò sau:

- **Tác vụ (Task / Job)**: Trước hết chắc chắn là tác vụ cần thực thi, tức logic nghiệp vụ cụ thể như hẹn giờ đăng bài viết.
- **Bộ điều phối (Scheduler)**: Trung tâm điều phối (Scheduling Center) chịu trách nhiệm quản lý tác vụ và phân bổ tác vụ xuống cho các Executor.
- **Bộ thực thi (Executor)**: Tiếp nhận tác vụ do bộ điều phối giao xuống và tiến hành chạy.

### Quartz

Một framework điều phối tác vụ mã nguồn mở rất nổi tiếng, được viết hoàn toàn bằng Java. Có thể coi Quartz là "đàn anh" hay chuẩn tham chiếu trong lĩnh vực tác vụ định kỳ của Java; các framework điều phối khác cơ bản đều phát triển dựa trên Quartz, chẳng hạn `elastic-job` của Dangdang chính là giải pháp điều phối phân tán được phát triển mở rộng từ Quartz.

Quartz tích hợp rất thuận tiện với Spring, hỗ trợ thêm tác vụ động (dynamic job) và chạy Cluster. Tuy nhiên, Quartz khá rườm rà khi sử dụng, API phức tạp.

Ngoài ra, Quartz không tích hợp sẵn giao diện quản trị UI, nhưng bạn có thể dùng dự án mã nguồn mở [quartzui](https://github.com/zhaopeiym/quartzui) để giải quyết vấn đề này.

Bên cạnh đó, dù Quartz có hỗ trợ tác vụ phân tán, nhưng cơ chế lại làm ở tầng Database thông qua khóa Database (DB Lock), gây ra rất nhiều hạn chế như xâm lấn hệ thống nặng nề và tải giữa các node không cân bằng — mang hơi hướng "giả phân tán".

**Tổng kết ưu nhược điểm:**

- Ưu điểm: Tích hợp được với Spring, hỗ trợ thêm tác vụ động và chạy Cluster.
- Nhược điểm: Hỗ trợ phân tán kém thân thiện, không có giao diện quản lý trực quan, cách dùng rườm rà (so với các framework cùng loại).

### Elastic-Job

ElasticJob ban đầu được Dangdang mở nguồn và trong lịch sử từng chia làm hai dự án con: ElasticJob-Lite và ElasticJob-Cloud. Cách phân chia này cũng như sự phụ thuộc của ElasticJob-Cloud vào Mesos thuộc bối cảnh các phiên bản cũ, không nên đưa vào bảng lựa chọn hiện tại. Hiện nay trang chính thức mô tả ElasticJob là một giải pháp gọn nhẹ, phi tập trung (decentralized) cung cấp khả năng phân mảnh tác vụ phân tán, hỗ trợ Registry Center là ZooKeeper và etcd.

`ElasticJob` hỗ trợ các tính năng như phân mảnh tác vụ trong môi trường phân tán, độ sẵn sàng cao, quản lý tác vụ trực quan, v.v.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/elasticjob-feature-list-56ba3f1c.png)

Dưới đây là sơ đồ kiến trúc thời đầu của ElasticJob-Lite dùng ZooKeeper làm Registry Center, dùng để hiểu tư tưởng điều phối phi tập trung của nó; các phiên bản hiện tại còn hỗ trợ etcd nên không thể coi các thành phần trong hình là cách triển khai duy nhất.

![Thiết kế kiến trúc của ElasticJob-Lite](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/elasticjob-lite-architecture-design-dea99a80.png)

Trong mô hình triển khai này, ElasticJob không dựng dịch vụ điều phối trung tâm mà dùng ZooKeeper để điều phối các mảnh tác vụ (shard) giữa các node. Phiên bản hiện tại cũng có thể chọn etcd làm Registry Center.

Việc kích hoạt lịch chạy trong Elastic-Job đều do từng Executor tự thực hiện; thiết kế này còn gọi là thiết kế phi tập trung (cả điều phối và xử lý đều do Executor tự hoàn thành).

Spring Boot Starter chính thức hiện nay đăng ký job thông qua Spring Bean và file cấu hình, không cung cấp annotation `@ElasticJobConf`. Dưới đây là ví dụ dùng ZooKeeper làm Registry Center:

```java
@Component
public class TestJob implements SimpleJob {
    @Override
    public void execute(ShardingContext context) {
        System.out.printf("Tên job: %s, tổng số shard: %d, tham số shard hiện tại: %s%n",
                context.getJobName(),
                context.getShardingTotalCount(),
                context.getShardingParameter());
    }
}
```

```yaml
elasticjob:
  regCenter:
    serverLists: localhost:2181
    namespace: elasticjob-demo
  jobs:
    dayJob:
      elasticJobClass: com.example.job.TestJob
      cron: 0/10 * * * * ?
      shardingTotalCount: 2
      shardingItemParameters: 0=AAAA,1=BBBB
```

Thuộc tính cấu hình và loại Registry Center thay đổi theo từng phiên bản; khi tích hợp cần lấy tài liệu của đúng phiên bản đang dùng làm chuẩn: [Tài liệu Spring Boot Starter](https://shardingsphere.apache.org/elasticjob/current/en/user-manual/usage/job-api/spring-boot-starter/) và [Tài liệu Registry Center](https://shardingsphere.apache.org/elasticjob/current/en/user-manual/configuration/registry-center/).

**Liên kết tham khảo:**

- GitHub: <https://github.com/apache/shardingsphere-elasticjob>.
- Trang chủ chính thức: <https://shardingsphere.apache.org/elasticjob/index_zh.html>.

**Tổng kết ưu nhược điểm:**

- Ưu điểm: Tích hợp được với Spring, hỗ trợ phân tán, hỗ trợ Cluster, hiệu năng tốt, hỗ trợ quản lý tác vụ trực quan
- Nhược điểm: Cần triển khai thêm Registry Center như ZooKeeper hoặc etcd, làm tăng độ phức tạp và chi phí vận hành bảo trì hệ thống

### XXL-JOB

Được mở nguồn năm 2015, `XXL-JOB` là một framework điều phối tác vụ phân tán gọn nhẹ xuất sắc, hỗ trợ quản lý tác vụ trực quan, mở rộng/thu gọn linh hoạt, thử lại khi lỗi và cảnh báo, phân mảnh tác vụ, v.v.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/xxljob-feature-list-9bb2bec9.png)

Theo giới thiệu trên trang chủ `XXL-JOB`, nó giải quyết được rất nhiều hạn chế của Quartz:

> Với tư cách là một cái tên nổi bật trong điều phối tác vụ mã nguồn mở, Quartz thường là lựa chọn hàng đầu. Tuy nhiên trong môi trường Cluster, Quartz dùng API để quản lý tác vụ nên dù tránh được một số vấn đề vẫn còn các nhược điểm sau:
>
> - Vấn đề 1: Thao tác quản lý tác vụ bằng cách gọi API kém thân thiện với người dùng;
> - Vấn đề 2: Phải lưu bền vững các `QuartzJobBean` nghiệp vụ xuống bảng Database bên dưới, mức độ xâm lấn hệ thống rất nghiêm trọng.
> - Vấn đề 3: Logic điều phối và `QuartzJobBean` bị gắn chặt trong cùng một dự án, dẫn đến vấn đề là khi số lượng tác vụ ngày càng tăng và logic tác vụ ngày càng nặng, hiệu năng hệ thống điều phối sẽ bị giới hạn nặng bởi nghiệp vụ;
> - Vấn đề 4: Quartz bên dưới chiếm DB Lock theo kiểu "cạnh tranh giành giật", node nào giành được lock thì node đó chạy tác vụ, dẫn đến chênh lệch tải giữa các node cực lớn; trong khi XXL-JOB thực thi tác vụ qua Executor theo kiểu "phân bổ phối hợp", phát huy tối đa lợi thế Cluster và cân bằng tải giữa các node.
>
> XXL-JOB đã khắc phục những điểm yếu kể trên của Quartz.

Kiến trúc của `XXL-JOB` được minh họa như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/xxljob-architecture-design-v2.1.0-3abf925a.png)

Từ hình trên có thể thấy `XXL-JOB` gồm hai thành phần chính: **Trung tâm điều phối (Scheduling Center)** và **Executor**. Trung tâm điều phối chủ yếu quản lý tác vụ, quản lý Executor và quản lý log. Executor chủ yếu nhận tín hiệu điều phối và xử lý. Ngoài ra, Trung tâm điều phối thực hiện gửi lệnh điều phối qua RPC tự phát triển.

Khác với thiết kế phi tập trung của Elastic-Job, kiểu thiết kế của `XXL-JOB` được gọi là thiết kế tập trung (Trung tâm điều phối phân phát tác vụ cho nhiều Executor thực thi).

Tương tự `Quartz`, `XXL-JOB` cũng điều phối tác vụ dựa trên khóa Database nên có nút thắt cổ chai về hiệu năng. Tuy nhiên nhìn chung khi lượng tác vụ chưa quá lớn thì hầu như không ảnh hưởng gì và có thể đáp ứng tốt yêu cầu của đại đa số công ty.

Phiên bản hiện tại khuyến nghị gắn `@XxlJob` lên phương thức `void` không tham số trong Spring Bean; tham số tác vụ, log và kết quả thực thi được xử lý qua `XxlJobHelper`. Cách viết `@JobHandler`, nhận tham số `String` và trả về `ReturnT` thuộc API cũ.

```java
@Component
public class MyApiJobHandler {

    @XxlJob("myApiJobHandler")
    public void execute() {
        String param = XxlJobHelper.getJobParam();
        XxlJobHelper.log("Tham số tác vụ: {}", param);
        // Thực thi logic nghiệp vụ; mặc định kết quả là thành công, khi thất bại có thể gọi XxlJobHelper.handleFail(...)
    }
}
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/xxljob-admin-task-management-e968a1f8.png)

**Liên kết tham khảo:**

- GitHub: <https://github.com/xuxueli/xxl-job/>.
- Giới thiệu chính thức: <https://www.xuxueli.com/xxl-job/>.

**Tổng kết ưu nhược điểm:**

- Ưu điểm: Cài xong dùng ngay (chi phí học thấp), tích hợp Spring, hỗ trợ phân tán, hỗ trợ Cluster, hỗ trợ quản lý tác vụ trực quan.
- Nhược điểm: Không hỗ trợ thêm tác vụ động theo mặc định (nếu nhất định cần tạo tác vụ động vẫn có thể tham khảo: [xxl-job issue277](https://github.com/xuxueli/xxl-job/issues/277)).

### PowerJob

Một framework điều phối tác vụ phân tán rất đáng quan tâm — ngôi sao mới nổi trong lĩnh vực điều phối phân tán. Hiện đã có nhiều công ty đưa vào sử dụng như OPPO, JD.com, ZTO, Cisco.

Câu chuyện ra đời của framework này cũng khá thú vị: tác giả của PowerJob từng thực tập tại Alibaba; hồi đó Alibaba dùng sản phẩm nội bộ tự phát triển là SchedulerX (sản phẩm trả phí trên Alibaba Cloud). Sau khi hết kỳ thực tập và rời Alibaba, tác giả nghĩ đến việc tự xây dựng một giải pháp thay thế SchedulerX phòng khi SchedulerX không đáp ứng được nhu cầu, thế là PowerJob ra đời.

Muốn biết thêm câu chuyện về PowerJob, các bạn có thể xem video của tác giả [*Tôi và Middleware điều phối tác vụ của tôi*](https://www.bilibili.com/video/BV1SK411A7F3/). Tóm gọn một câu: "Chơi game chán rồi, tôi sẽ gánh vác ngọn cờ của thế hệ framework điều phối và tính toán tác vụ phân tán mới!"

Vì SchedulerX là sản phẩm thương mại trả phí nên ở đây mình không đi sâu thêm. Nhóm phát triển PowerJob cũng từng so sánh PowerJob với Quartz, XXL-JOB và SchedulerX. Bảng dưới đây là bảng so sánh tính năng do phía dự án cung cấp, không phải benchmark độc lập; hiệu năng và sức chịu tải thực tế vẫn cần kiểm chứng theo từng phiên bản, Database, quy mô triển khai và tải nghiệp vụ cụ thể.

| | Quartz | xxl-job | SchedulerX 2.0 | PowerJob |
| --- | --- | --- | --- | --- |
| Loại lịch chạy | CRON | CRON | CRON, tần suất cố định, độ trễ cố định, OpenAPI | **CRON, tần suất cố định, độ trễ cố định, OpenAPI** |
| Loại tác vụ | Java tích hợp sẵn | Java tích hợp, GLUE Java, Shell, Python và các script khác | Java tích hợp, Java ngoài (FatJar), Shell, Python và các script khác | **Java tích hợp, Java ngoài (Container), Shell, Python và các script khác** |
| Tính toán phân tán | Không | Phân mảnh tĩnh (Static Sharding) | Phân mảnh động MapReduce | **Phân mảnh động MapReduce** |
| Quản trị tác vụ trực tuyến | Không hỗ trợ | Hỗ trợ | Hỗ trợ | **Hỗ trợ** |
| Xem log trực tiếp trên Web | Không hỗ trợ | Hỗ trợ | Không hỗ trợ | **Hỗ trợ** |
| Cách điều phối & hiệu năng | Dựa trên khóa DB, có nút thắt hiệu năng | Dựa trên khóa DB, có nút thắt hiệu năng | Không rõ | **Phía dự án cho biết dùng thiết kế không khóa (lock-free), sức chịu tải thực tế cần đo kiểm tải** |
| Cảnh báo & giám sát | Không | Email | SMS | **WebHook, Email, DingTalk và mở rộng tùy biến** |
| Phụ thuộc hệ thống | Database quan hệ hỗ trợ JDBC (MySQL, Oracle...) | MySQL | Dịch vụ thương mại trả phí | **Bất kỳ Database quan hệ nào được Spring Data JPA hỗ trợ (MySQL, Oracle...)** |
| DAG Workflow | Không hỗ trợ | Không hỗ trợ | Hỗ trợ | **Hỗ trợ** |

## Tổng kết các giải pháp tác vụ định kỳ

Các giải pháp phổ biến cho tác vụ định kỳ trên một máy gồm `Timer`, `ScheduledExecutorService`, `DelayQueue`, Spring Task và Time Wheel. Với tác vụ định kỳ hoặc tác vụ trễ thông thường trong Java, nên ưu tiên dùng `ScheduledExecutorService` hoặc Spring Task; Time Wheel phù hợp hơn với kịch bản có số lượng Timer cực lớn và chấp nhận đánh đổi một mức độ chính xác thời gian để lấy hiệu năng điều phối, chứ không phải phương án mặc định tối ưu nhất cho mọi tác vụ đơn máy.

Redis và MQ tuy có thể thực hiện kích hoạt trễ phân tán, nhưng thường không cung cấp đầy đủ khả năng điều phối quy trình, phân mảnh, bù trừ lỗi và quản lý trực quan. Ngữ nghĩa bàn giao phổ biến của MQ tin cậy là "ít nhất một lần" (at-least-once): khi Timeout, Retry hoặc chuyển đổi dự phòng (failover) có thể xảy ra phát lặp message, nên phía Consumer bắt buộc phải xử lý tính lũy đẳng (Idempotency). Tác vụ định kỳ đòi hỏi bộ điều phối liên tục sinh ra sự kiện kích hoạt mới, không liên quan trực tiếp đến việc một message có thể được "tiêu thụ nhiều lần" hay không. MQ vẫn rất phù hợp cho kích hoạt trễ một lần như hủy đơn quá hạn, đồng thời cũng dùng được để tách rời (decouple) phần điều phối và phần thực thi.

Dù chọn phương án nào, trước khi đưa lên Production đều phải làm rõ các ngữ nghĩa sau:

- Tác vụ có tính lũy đẳng hay không và xử lý thực thi trùng lặp như thế nào;
- Khi ứng dụng ngừng hoạt động hoặc bỏ lỡ thời điểm chạy, sẽ chạy bù, bỏ qua hay gộp các lần chạy;
- Chiến lược Timeout, Retry, lùi thời gian (Backoff), số lần thử tối đa và Dead-Letter / bù trừ thủ công;
- Cách xử lý múi giờ, giờ tiết kiệm ánh sáng ban ngày (DST), đồng hồ bị quay ngược (clock rollback) và sai lệch đồng hồ trong Cluster;
- Cách tránh điều phối trùng lặp ngoài ý muốn trong Cluster, đồng thời thiết lập giám sát và cảnh báo cho độ trễ, tỷ lệ thành công, số lần Retry và lượng tồn đọng.

Quartz, Elastic-Job, XXL-JOB và PowerJob là các framework chuyên dụng cho điều phối phân tán, cung cấp tính năng tác vụ định kỳ phân tán đầy đủ và mạnh mẽ hơn, phù hợp hơn cho các tác vụ định kỳ theo chu kỳ. Ngoại trừ Quartz, cả ba framework còn lại đều hỗ trợ quản lý tác vụ trực quan.

XXL-JOB ra mắt năm 2015, có ngưỡng tiếp cận tương đối thấp và dùng kiến trúc điều phối tập trung; ElasticJob dùng thiết kế điều phối phi tập trung và điều phối phân mảnh tác vụ qua ZooKeeper hoặc etcd. Kiến trúc và thành phần vận hành phụ thuộc của hai framework khác nhau, không thể dựa vào đó để khẳng định ngay rằng một framework "có hiệu năng tốt hơn". Khi lựa chọn giải pháp, cần đo kiểm chịu tải (load test) theo đúng phiên bản thực tế, số lượng tác vụ, tần suất kích hoạt, quy mô shard, yêu cầu khôi phục sự cố và tải của Database hoặc Registry Center. PowerJob và các framework khác cũng nên được kiểm chứng theo cùng các tiêu chí này, không nên chỉ dựa vào bảng so sánh tính năng do phía dự án công bố để kết luận.

Bài viết này chưa đi sâu vào hướng dẫn sử dụng thực tế từng bước, nhưng điều đó không có nghĩa phần thực hành không quan trọng. Trước khi viết bài này, mình đều đã tự viết các Demo tương ứng. Như Quartz hồi đại học mình đã từng dùng, nhưng lúc đó dùng với Spring; để trải nghiệm tốt hơn, mình cũng tự thử nghiệm lại trên Spring Boot. Nếu bạn chưa từng dùng thử một framework nào mà đã vội khẳng định nó khó dùng thì lập luận đó hoàn toàn không đứng vững.
