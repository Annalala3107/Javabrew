---
title: Phân tích mã nguồn DelayQueue
description: "Phân tích chuyên sâu mã nguồn DelayQueue: giải thích chi tiết nguyên lý cài đặt hàng đợi trễ (delay queue), cách dùng interface Delayed, lập lịch tác vụ trễ, các kịch bản ứng dụng như hủy đơn hàng quá hạn thanh toán và thiết kế an toàn luồng dựa trên PriorityQueue."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/delayqueue-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn DelayQueue,hàng đợi trễ,interface Delayed,tác vụ trễ,tác vụ định thời,quá hạn đơn hàng,triển khai PriorityQueue
---

## Giới thiệu về DelayQueue

`DelayQueue` là hàng đợi trễ (delay queue) mà gói JUC (`java.util.concurrent`) cung cấp cho chúng ta, dùng để triển khai các tác vụ trễ như tự động hủy đơn hàng nếu quá 15 phút sau khi đặt mà chưa thanh toán. Nó là một loại `BlockingQueue`, bên dưới là một hàng đợi không giới hạn (unbounded queue) được cài đặt dựa trên `PriorityQueue`, và có tính an toàn luồng (thread-safe).

![Các lớp triển khai của BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-hierarchy-755d1cd5.png)

Các phần tử lưu trong `DelayQueue` bắt buộc phải triển khai interface `Delayed` và ghi đè (`Override`) phương thức `getDelay()` (tính toán xem đã đến hạn hay chưa).

```java
public interface Delayed extends Comparable<Delayed> {
    long getDelay(TimeUnit unit);
}
```

Mặc định, `DelayQueue` sẽ sắp xếp các tác vụ theo thứ tự thời gian đến hạn tăng dần. Chỉ khi phần tử đã hết hạn (giá trị trả về của phương thức `getDelay()` nhỏ hơn hoặc bằng 0) thì mới có thể lấy ra khỏi hàng đợi.

`DelayQueue` được giới thiệu lần đầu từ Java 5, là một Blocking Queue không giới hạn và an toàn luồng.

## Ví dụ tình huống sử dụng phổ biến của DelayQueue

Ở đây chúng ta mong muốn các tác vụ chuyển sang trạng thái có thể lấy ra theo đúng độ trễ dự kiến; ví dụ gửi 3 tác vụ với độ trễ lần lượt là 1s, 2s và 3s — dù thêm vào không theo thứ tự, tác vụ có độ trễ đến hạn sớm nhất vẫn sẽ chuyển sang trạng thái sẵn sàng lấy ra đầu tiên.

![Tác vụ trễ](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayed-task-3af63966.png)

Để làm được điều này bằng `DelayQueue`, trước tiên chúng ta cần triển khai `Delayed` để tạo lớp `DelayedTask`, cài đặt phương thức `getDelay` và phương thức so sánh độ ưu tiên `compareTo`.

```java
/**
 * Tác vụ trễ
 */
public class DelayedTask implements Delayed {
    /**
     * Thời điểm đến hạn của tác vụ
     */
    private long executeTime;
    /**
     * Tác vụ
     */
    private Runnable task;

    public DelayedTask(long delay, Runnable task) {
        this.executeTime = System.currentTimeMillis() + delay;
        this.task = task;
    }

    /**
     * Kiểm tra tác vụ hiện tại còn bao lâu nữa thì đến hạn
     * @param unit
     * @return
     */
    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(executeTime - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
    }

    /**
     * Hàng đợi trễ cần đưa phần tử vào theo thứ tự thời gian đến hạn tăng dần, nên ta cần cài đặt compareTo để so sánh thời gian đến hạn
     * @param o
     * @return
     */
    @Override
    public int compareTo(Delayed o) {
        return Long.compare(this.executeTime, ((DelayedTask) o).executeTime);
    }

    public void execute() {
        task.run();
    }
}
```

Sau khi đóng gói xong tác vụ, cách sử dụng rất đơn giản: thiết lập thời gian bao lâu sẽ đến hạn rồi đưa tác vụ vào hàng đợi trễ là được.

```java
// Tạo hàng đợi trễ và thêm các tác vụ vào
DelayQueue < DelayedTask > delayQueue = new DelayQueue < > ();

// Lần lượt thêm các tác vụ đến hạn sau 2s, 1s, 3s
delayQueue.add(new DelayedTask(2000, () -> System.out.println("Task 2")));
delayQueue.add(new DelayedTask(1000, () -> System.out.println("Task 1")));
delayQueue.add(new DelayedTask(3000, () -> System.out.println("Task 3")));

// Lấy tác vụ ra và thực thi
while (!delayQueue.isEmpty()) {
  // Lấy tác vụ đến hạn sớm nhất theo cơ chế chặn (blocking)
  DelayedTask task = delayQueue.take();
  if (task != null) {
    task.execute();
  }
}
```

Từ kết quả đầu ra có thể thấy, dù tác giả gửi tác vụ đến hạn sau 2s vào trước, tác vụ `Task 1` đến hạn sau 1s vẫn được thực thi ưu tiên trước.

```java
Task 1
Task 2
Task 3
```

## Phân tích mã nguồn DelayQueue

Ở đây lấy JDK 1.8 làm ví dụ để phân tích mã nguồn cốt lõi tầng dưới của `DelayQueue`.

Định nghĩa lớp `DelayQueue` như sau:

```java
public class DelayQueue<E extends Delayed> extends AbstractQueue<E> implements BlockingQueue<E>
{
  //...
}
```

`DelayQueue` kế thừa lớp `AbstractQueue` và triển khai interface `BlockingQueue`.

![Sơ đồ lớp DelayQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-class-diagram-933c7629.png)

### Các biến thành viên cốt lõi

4 biến thành viên cốt lõi của `DelayQueue` như sau:

```java
// Reentrant Lock, chìa khóa để đảm bảo an toàn luồng
private final transient ReentrantLock lock = new ReentrantLock();
// Tập hợp lưu trữ dữ liệu tầng dưới của hàng đợi trễ, đảm bảo phần tử sắp xếp tăng dần theo thời gian đến hạn
private final PriorityQueue<E> q = new PriorityQueue<E>();

// Trỏ tới Thread đang chờ phần tử có độ ưu tiên cao nhất
private Thread leader = null;
// Thực hiện tương tác chờ và đánh thức giữa nhiều Thread
private final Condition available = lock.newCondition();
```

- `lock`: Chúng ta đều biết thao tác đọc và ghi trên `DelayQueue` là an toàn luồng, vì vậy để đảm bảo an toàn luồng khi truy xuất phần tử, ta cần khóa khi đọc/ghi; `DelayQueue` sử dụng khóa độc chiếm `ReentrantLock` để đảm bảo an toàn luồng cho các thao tác truy xuất.
- `q`: Hàng đợi trễ yêu cầu các phần tử được sắp xếp tăng dần theo thời gian đến hạn, nên khi thêm phần tử chắc chắn phải sắp xếp theo độ ưu tiên; do đó việc lưu trữ và lấy phần tử tầng dưới của `DelayQueue` đều được quản lý thông qua biến thành viên `q` kiểu hàng đợi ưu tiên `PriorityQueue`.
- `leader`: Tác vụ trong hàng đợi trễ chỉ được thực thi sau khi đến hạn, còn những tác vụ chưa đến hạn thì chỉ có thể chờ; để đảm bảo tác vụ có độ ưu tiên cao nhất được thực thi ngay lập tức khi đến hạn, tác giả thiết kế đã dùng `leader` để điều phối tác vụ trễ: chỉ Thread mà `leader` trỏ tới mới có quyền chờ có thời hạn cho đến khi tác vụ đến hạn để thực thi, còn các Thread chờ tác vụ có độ ưu tiên thấp hơn chỉ có thể chờ vô thời hạn cho đến khi Thread `leader` lấy xong tác vụ trong tay và đánh thức nó.
- `available`: Cơ chế tương tác chờ và đánh thức được nhắc đến khi nói về Thread `leader` ở trên chính là được cài đặt thông qua `available`. Giả sử Thread 1 thử lấy tác vụ từ một `DelayQueue` đang rỗng, `available` sẽ đưa nó vào hàng đợi chờ (wait queue) cho đến khi có một Thread khác thêm một tác vụ trễ vào rồi đánh thức nó qua phương thức `signal` của `available`.

### Hàm tạo (Constructors)

So với các container đồng thời khác, hàm tạo của `DelayQueue` khá đơn giản, chỉ có hai hàm tạo. Vì mọi biến thành viên đều đã được khởi tạo xong ngay khi nạp/tạo lớp, nên hàm tạo mặc định không làm gì cả. Còn hàm tạo truyền vào đối tượng `Collection` sẽ gọi phương thức `addAll()` để đưa các phần tử của tập hợp đó vào hàng đợi ưu tiên `q`.

```java
public DelayQueue() {}

public DelayQueue(Collection<? extends E> c) {
    this.addAll(c);
}
```

### Thêm phần tử

Các phương thức thêm phần tử của `DelayQueue` dù là `add`, `put` hay `offer`, về bản chất đều gọi tới `offer`, nên để hiểu logic thêm phần tử của hàng đợi trễ ta chỉ cần đọc phương thức `offer` là đủ.

Logic tổng thể của phương thức `offer` là:

1. Thử giành lấy `lock`.
2. Nếu khóa thành công, gọi phương thức `offer` của `q` để đưa phần tử vào hàng đợi ưu tiên.
3. Gọi phương thức `peek` xem phần tử đầu hàng đợi hiện tại có đúng là phần tử vừa đưa vào hay không; nếu đúng, chứng tỏ phần tử này chính là tác vụ sắp đến hạn sớm nhất (tức phần tử có độ ưu tiên cao nhất), khi đó đặt `leader` về `null` và thông báo cho các Thread đang bị chặn do gọi `take` lúc hàng đợi rỗng vào tranh giành phần tử.
4. Sau khi hoàn tất các bước trên, giải phóng `lock`.
5. Trả về `true`.

Mã nguồn đã được chú thích chi tiết như dưới đây, bạn đọc có thể tham khảo trực tiếp:

```java
public boolean offer(E e) {
    // Thử giành lấy lock
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        // Nếu khóa thành công, gọi q.offer để đưa phần tử vào hàng đợi ưu tiên
        q.offer(e);
        // Gọi peek xem phần tử đầu hàng đợi hiện tại có phải phần tử vừa đưa vào không; nếu đúng thì đây là tác vụ sắp đến hạn sớm nhất (ưu tiên cao nhất)
        if (q.peek() == e) {
            // Đặt leader về null, thông báo cho các Thread bị chặn khi lấy phần tử tới tranh giành tác vụ này
            leader = null;
            available.signal();
        }
        return true;
    } finally {
        // Sau khi hoàn tất các bước trên, giải phóng lock
        lock.unlock();
    }
}
```

### Lấy phần tử

Cách lấy phần tử trong `DelayQueue` chia làm dạng chặn (blocking) và dạng không chặn (non-blocking). Trước tiên hãy xem phương thức lấy phần tử dạng chặn có logic phức tạp hơn là `take`. Để bạn đọc hình dung trực quan toàn bộ quy trình lấy phần tử dạng chặn, tác giả sẽ lấy ví dụ 3 Thread cùng lúc truy cập để minh họa luồng hoạt động của `take`.

> Để hiểu nội dung bên dưới cần có kiến thức liên quan đến AQS, khuyến nghị đọc hai bài viết sau:
>
> - [Giải thích AQS bằng hình ảnh, cùng xem mã nguồn AQS... (bài viết kèm nhiều hình ảnh)](https://xie.infoq.cn/article/5a3cc0b709012d40cb9f41986)
> - [Đọc xong AQS rồi, sao có thể bỏ qua nguyên lý Condition!](https://xie.infoq.cn/article/0223d5e5f19726b36b084b10d)

1. Đầu tiên, 3 Thread sẽ thử giành lấy khóa tái nhập `lock`. Giả sử ta có 3 Thread lần lượt là t1, t2, t3; sau đó t1 giành được khóa, còn t2 và t3 không giành được khóa nên bị đưa vào hàng đợi chờ của khóa.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-take-0-e892f631.png)

2. Ngay sau đó t1 bắt đầu thực hiện logic lấy phần tử.

3. Thread t1 trước tiên kiểm tra xem phần tử đầu hàng đợi `DelayQueue` có rỗng (`null`) hay không.

4. Nếu phần tử là `null`, nghĩa là hàng đợi hiện tại không có phần tử nào, nên t1 sẽ bị chặn và đưa vào hàng đợi `conditionWaiter`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-take-1-4d66e368.png)

Lưu ý, sau khi gọi `await` thì t1 sẽ giải phóng khóa `lock`. Nếu `DelayQueue` vẫn tiếp tục rỗng, t2 và t3 cũng sẽ thực hiện logic y hệt như t1 và đi vào hàng đợi `conditionWaiter`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-take-2-f0c6ac83.png)

Nếu phần tử không rỗng, kiểm tra xem tác vụ hiện tại đã đến hạn hay chưa; nếu đã đến hạn thì trả về ngay. Nếu phần tử chưa đến hạn, kiểm tra xem Thread `leader` (tham chiếu Thread duy nhất trong `DelayQueue` được phép chờ theo thời gian để lấy phần tử) có rỗng không; nếu không rỗng, chứng tỏ hiện đang có `leader` chờ thực thi một phần tử có độ ưu tiên cao hơn phần tử hiện tại, nên Thread t1 chỉ có thể gọi `await` để bước vào trạng thái chờ vô thời hạn cho tới khi được đánh thức sau khi `leader` lấy được phần tử. Ngược lại, nếu Thread `leader` là `null`, thì đặt Thread hiện tại làm `leader` rồi bước vào trạng thái chờ hữu hạn; khi hết hạn sẽ lấy phần tử ra và trả về.

Đến đây toàn bộ logic lấy phần tử dạng chặn đã hoàn chỉnh, mã nguồn như dưới đây:

```java
public E take() throws InterruptedException {
    // Thử giành lấy Reentrant Lock, đặt state của AQS tầng dưới thành 1 và thiết lập làm khóa độc chiếm
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        for (;;) {
            // Xem phần tử đầu tiên của hàng đợi
            E first = q.peek();
            // Nếu null, đưa Thread hiện tại vào hàng đợi chờ của ConditionObject, đặt state của AQS về 0 (giải phóng khóa) và chờ vô thời hạn
            if (first == null)
                available.await();
            else {
                // Nếu phần tử không null, kiểm tra xem còn bao lâu nữa thì đến hạn
                long delay = first.getDelay(NANOSECONDS);
                // Nếu <= 0 thì nghĩa là đã đến hạn, lấy ra và trả về trực tiếp
                if (delay <= 0)
                    return q.poll();
                // Nếu > 0 thì nghĩa là tác vụ chưa đến hạn, trước hết giải phóng tham chiếu tới phần tử này
                first = null; // don't retain ref while waiting
                // Kiểm tra leader có null không; nếu khác null nghĩa là đã có Thread làm leader đang chờ một tác vụ đến hạn, nên Thread hiện tại chờ vô thời hạn
                if (leader != null)
                    available.await();
                else {
                    // Ngược lại, đặt Thread hiện tại trở thành leader
                    Thread thisThread = Thread.currentThread();
                    leader = thisThread;
                    try {
                        // Và bước vào trạng thái chờ hữu hạn
                        available.awaitNanos(delay);
                    } finally {
                        // Khi hết thời gian chờ, giải phóng tham chiếu leader, vào vòng lặp tiếp theo để return tác vụ ra ngoài
                        if (leader == thisThread)
                            leader = null;
                    }
                }
            }
        }
    } finally {
        // Logic dọn dẹp cuối: khi leader là null và trong hàng đợi vẫn còn tác vụ, đánh thức một Thread đang chờ lấy phần tử
        if (leader == null && q.peek() != null)
            available.signal();
        // Giải phóng khóa
        lock.unlock();
    }
}
```

Tiếp theo chúng ta xem phương thức lấy phần tử không chặn `poll`, logic tương đối đơn giản, các bước tổng thể như sau:

1. Thử giành lấy Reentrant Lock.
2. Xem phần tử đầu tiên trong hàng đợi, kiểm tra phần tử có rỗng không.
3. Nếu phần tử rỗng, hoặc phần tử chưa đến hạn, trả về `null` trực tiếp.
4. Nếu phần tử không rỗng và đã đến hạn, gọi trực tiếp `poll` để trả về.
5. Giải phóng Reentrant Lock `lock`.

Mã nguồn như dưới đây, bạn đọc có thể tự tham khảo mã nguồn và chú thích:

```java
public E poll() {
    // Thử giành lấy Reentrant Lock
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        // Xem phần tử đầu tiên của hàng đợi, kiểm tra phần tử có rỗng không
        E first = q.peek();

        // Nếu phần tử rỗng hoặc chưa đến hạn, trả về null trực tiếp
        if (first == null || first.getDelay(NANOSECONDS) > 0)
            return null;
        else
            // Nếu phần tử không rỗng và đã đến hạn, gọi poll để trả về
            return q.poll();
    } finally {
        // Giải phóng Reentrant Lock
        lock.unlock();
    }
}
```

### Xem phần tử

Khi lấy phần tử ở trên đều có gọi tới phương thức `peek`; đúng như tên gọi, `peek` chỉ là ngó qua phần tử trong hàng đợi, gồm đúng 4 bước:

1. Khóa.
2. Gọi phương thức `peek` của hàng đợi ưu tiên `q` để xem phần tử tại vị trí chỉ số 0.
3. Mở khóa.
4. Trả về phần tử đó.

```java
public E peek() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        return q.peek();
    } finally {
        lock.unlock();
    }
}
```

## Câu hỏi phỏng vấn thường gặp về DelayQueue

### Nguyên lý cài đặt của DelayQueue là gì?

Ở tầng dưới, `DelayQueue` sử dụng hàng đợi ưu tiên `PriorityQueue` để lưu trữ phần tử, còn `PriorityQueue` áp dụng tư tưởng Binary Min-Heap để đảm bảo phần tử có giá trị nhỏ hơn luôn nằm ở phía trước, giúp `DelayQueue` quản lý độ ưu tiên của các tác vụ trễ hết sức thuận tiện. Đồng thời, để đảm bảo an toàn luồng, `DelayQueue` sử dụng Reentrant Lock `ReentrantLock`, bảo đảm tại một thời điểm chỉ có một Thread được thao tác với hàng đợi trễ. Cuối cùng, để tối ưu hiệu quả tương tác chờ và đánh thức giữa nhiều Thread, `DelayQueue` sử dụng `Condition`, hoàn thành việc chờ và đánh thức giữa các Thread thông qua hai phương thức `await` và `signal` của `Condition`.

### Việc cài đặt DelayQueue có an toàn luồng không?

Cài đặt của `DelayQueue` có an toàn luồng (thread-safe). Nó thực hiện truy cập loại trừ lẫn nhau thông qua `ReentrantLock` và thao tác chờ/đánh thức giữa các Thread thông qua `Condition`, nhờ đó đảm bảo tính an toàn và độ tin cậy trong môi trường đa luồng.

### Các kịch bản sử dụng của DelayQueue là gì?

`DelayQueue` thường được dùng để cài đặt các kịch bản như lập lịch tác vụ định thời (scheduled task scheduling) và xóa cache hết hạn. Trong lập lịch tác vụ định thời, ta đóng gói tác vụ cần thực thi thành đối tượng tác vụ trễ rồi thêm vào `DelayQueue`, phần tử đầu hàng đợi khi đến hạn có thể được lấy ra; thời điểm tác vụ thực sự chạy vẫn phụ thuộc vào việc điều phối của Thread tiêu thụ (consumer thread). Đối với kịch bản hết hạn cache, sau khi dữ liệu được lưu đệm vào bộ nhớ, ta có thể đóng gói key của cache thành một tác vụ xóa trễ và thêm vào `DelayQueue`; khi dữ liệu hết hạn, lấy key của tác vụ này ra để xóa key đó khỏi bộ nhớ.

### Vai trò của interface Delayed trong DelayQueue là gì?

Interface `Delayed` định nghĩa thời gian trễ còn lại của phần tử (`getDelay`) và quy tắc so sánh giữa các phần tử (interface này kế thừa interface `Comparable`). Nếu muốn đưa phần tử vào `DelayQueue`, phần tử đó bắt buộc phải triển khai phương thức `getDelay()` và `compareTo()` của interface `Delayed`; nếu không, `DelayQueue` không thể biết được thời gian còn lại của tác vụ hiện tại cũng như cách so sánh độ ưu tiên giữa các tác vụ.

### Sự khác nhau giữa DelayQueue và Timer/TimerTask là gì?

`DelayQueue` và `Timer`/`TimerTask` đều có thể dùng để thực hiện lập lịch tác vụ định thời, nhưng cách cài đặt của chúng khác nhau. `DelayQueue` được xây dựng dựa trên hàng đợi ưu tiên, chỉ chịu trách nhiệm lưu giữ các phần tử trễ và cho phép lấy ra sau khi đến hạn; trong khi `Timer`/`TimerTask` dùng một Thread chạy nền duy nhất để thực thi lần lượt các tác vụ — nếu một tác vụ nào đó chạy quá lâu sẽ ảnh hưởng đến việc thực thi các tác vụ khác. Cả hai đều hỗ trợ thêm tác vụ trong lúc đang chạy, nhưng `DelayQueue` còn cho phép xóa trực tiếp phần tử trễ bên trong.

## Tài liệu tham khảo

- *Hiểu sâu lập trình đồng thời cao: Công nghệ cốt lõi JDK* (*Deep Understanding of High-Concurrency Programming: JDK Core Technologies*):
- Kể tên một hơi 6 cách cài đặt hàng đợi trễ trong Java (người phỏng vấn cũng phải nể): <https://www.jb51.net/article/186192.htm>
- Giải thích mã nguồn DelayQueue bằng hình ảnh (Java 8) — Những bí mật nhỏ của hàng đợi trễ: <https://blog.csdn.net/every__day/article/details/113810985>
