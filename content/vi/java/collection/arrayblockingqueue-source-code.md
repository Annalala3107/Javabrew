---
title: Phân tích mã nguồn ArrayBlockingQueue
description: "Phân tích chuyên sâu mã nguồn ArrayBlockingQueue: giải thích chi tiết cài đặt Blocking Queue giới hạn (bounded), ứng dụng mô hình Producer-Consumer, kiểm soát đồng thời với ReentrantLock + Condition và cơ chế hàng đợi công việc (workQueue) của Thread Pool."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/arrayblockingqueue-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn ArrayBlockingQueue,Blocking Queue,hàng đợi giới hạn,mô hình Producer-Consumer,ReentrantLock,Condition,workQueue của Thread Pool
---

## Giới thiệu về Blocking Queue

### Lịch sử của Blocking Queue

Lịch sử của Blocking Queue trong Java có thể truy ngược về phiên bản JDK 1.5. Khi đó nền tảng Java đã bổ sung `java.util.concurrent`, tức gói JUC mà chúng ta thường gọi, bên trong bao gồm nhiều công cụ điều phối luồng đồng thời, các container đồng thời, lớp atomic, v.v. Tất nhiên trong đó cũng có các Blocking Queue mà bài viết này thảo luận.

Để giải quyết bài toán chia sẻ dữ liệu giữa nhiều thread trong các kịch bản đồng thời cao (high concurrency), phiên bản JDK 1.5 đã cho ra đời `ArrayBlockingQueue` và `LinkedBlockingQueue` — đây là những container đồng thời được cài đặt theo mô hình Producer-Consumer (nhà sản xuất - người tiêu dùng). Trong đó, `ArrayBlockingQueue` là hàng đợi giới hạn (bounded queue), tức là sau khi số lượng phần tử thêm vào đạt mức trần, nếu tiếp tục thêm vào thì sẽ bị chặn (block) hoặc ném ra ngoại lệ (exception). Còn `LinkedBlockingQueue` là hàng đợi được cấu tạo bởi danh sách liên kết (`linked list`); chính nhờ đặc tính của danh sách liên kết nên `LinkedBlockingQueue` không có nhiều ràng buộc khi thêm phần tử như `ArrayBlockingQueue`, do đó việc thiết lập hàng đợi có giới hạn hay không ở `LinkedBlockingQueue` là tùy chọn (lưu ý rằng "không giới hạn" ở đây không có nghĩa là có thể thêm số lượng phần tử vô hạn tùy ý, mà là kích thước mặc định của hàng đợi bằng `Integer.MAX_VALUE`, gần như vô hạn).

`SynchronousQueue` và `DelayQueue` cũng được đưa vào từ JDK 1.5, còn JDK 1.7 tiếp tục bổ sung thêm interface `TransferQueue` hỗ trợ thao tác truyền trực tiếp (`transfer`).

### Tư tưởng thiết kế của Blocking Queue

Blocking Queue chính là mô hình Producer-Consumer điển hình, có thể thực hiện được các điểm sau:

1. Khi Blocking Queue đang rỗng, toàn bộ các thread consumer sẽ bị block để chờ hàng đợi khác rỗng (`notEmpty`).
2. Sau khi producer đưa dữ liệu vào hàng đợi, hàng đợi sẽ thông báo cho consumer rằng hàng đợi đã khác rỗng, lúc này consumer có thể vào để tiêu thụ dữ liệu.
3. Khi Blocking Queue bị đầy do consumer tiêu thụ quá chậm hoặc producer đưa phần tử vào quá nhanh khiến không thể chứa thêm phần tử mới, producer sẽ bị block để chờ hàng đợi chưa đầy (`notFull`) rồi mới tiếp tục đưa phần tử vào.
4. Sau khi consumer tiêu thụ một phần tử từ hàng đợi, hàng đợi sẽ thông báo cho producer rằng hàng đợi đã khác đầy, producer có thể tiếp tục nạp thêm dữ liệu.

Tóm lại: Blocking Queue thực hiện tương tác giữa producer và consumer dựa trên hai điều kiện là khác rỗng (not-empty) và chưa đầy (not-full). Mặc dù các luồng tương tác và cơ chế chờ/đánh thức (`wait/notify`) được cài đặt rất phức tạp, nhưng thật may là dưới bàn tay thiết kế của Doug Lea, mọi chi tiết tầng dưới của Blocking Queue đã được đóng gói ẩn đi; chúng ta chỉ cần gọi các API như `put`, `take`, `offer`, `poll` là đã có thể thực hiện sản xuất và tiêu thụ giữa nhiều thread.

Điều này cũng giúp Blocking Queue được ứng dụng rộng rãi trong lập trình đa luồng. Ví dụ phổ biến nhất chính là Thread Pool; từ mã nguồn của nó ta có thể thấy khi các `core thread` không kịp xử lý tác vụ, những tác vụ này đều sẽ được đưa vào `workQueue`.

```java
public ThreadPoolExecutor(int corePoolSize,
                            int maximumPoolSize,
                            long keepAliveTime,
                            TimeUnit unit,
                            BlockingQueue<Runnable> workQueue,
                            ThreadFactory threadFactory,
                            RejectedExecutionHandler handler) {// ...}
```

## Các phương thức phổ biến và kiểm thử ArrayBlockingQueue

Sau khi tìm hiểu sơ qua lịch sử của Blocking Queue, chúng ta hãy bắt đầu đi sâu vào container đồng thời mà bài viết này giới thiệu — `ArrayBlockingQueue`. Để hiểu sâu hơn về `ArrayBlockingQueue` ở các phần sau, trước tiên hãy cùng tìm hiểu cách sử dụng `ArrayBlockingQueue` qua vài ví dụ dưới đây.

Trước hết hãy xem ví dụ đầu tiên: ở đây chúng ta dùng hai thread lần lượt mô phỏng producer và consumer. Producer sau khi tạo ra phần tử sẽ dùng phương thức `put` để đưa 10 phần tử cho consumer tiêu thụ; khi số phần tử trong hàng đợi đạt giới hạn trên là 5 mà ta đã thiết lập, phương thức `put` sẽ bị block.
Tương tự, consumer cũng sẽ dùng phương thức `take` để lấy phần tử tiêu thụ; khi hàng đợi rỗng, phương thức `take` sẽ block thread consumer. Ở đây, để đảm bảo consumer có thể thoát kịp thời sau khi tiêu thụ xong 10 phần tử, tác giả dùng chốt đếm ngược (`CountDownLatch`) để kiểm soát việc kết thúc của consumer; producer ở đây chỉ tạo đúng 10 phần tử. Khi consumer tiêu thụ xong toàn bộ 10 phần tử, gọi `countDown()` trên `CountDownLatch`, toàn bộ các thread sẽ dừng lại.

```java
public class ProducerConsumerExample {

    public static void main(String[] args) throws InterruptedException {

        // Tạo một ArrayBlockingQueue có kích thước bằng 5
        ArrayBlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);

        // Tạo thread producer
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    // Thêm phần tử vào hàng đợi, nếu hàng đợi đã đầy thì block và chờ
                    queue.put(i);
                    System.out.println("Producer thêm phần tử: " + i);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        });

        CountDownLatch countDownLatch = new CountDownLatch(1);

        // Tạo thread consumer
        Thread consumer = new Thread(() -> {
            try {
                int count = 0;
                while (true) {

                    // Lấy phần tử từ hàng đợi, nếu hàng đợi đang rỗng thì block và chờ
                    int element = queue.take();
                    System.out.println("Consumer lấy phần tử: " + element);
                    ++count;
                    if (count == 10) {
                        break;
                    }
                }

                countDownLatch.countDown();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        });

        // Khởi chạy các thread
        producer.start();
        consumer.start();

        // Chờ các thread kết thúc
        producer.join();
        consumer.join();

        countDownLatch.await();

        producer.interrupt();
        consumer.interrupt();
    }

}
```

Kết quả đầu ra của đoạn mã như sau. Có thể thấy chỉ sau khi producer đưa phần tử vào hàng đợi thì consumer mới có thể tiêu thụ; điều này đồng nghĩa với việc khi hàng đợi không có dữ liệu, consumer sẽ bị block, chờ hàng đợi khác rỗng rồi mới tiếp tục tiêu thụ.

```cpp
Producer thêm phần tử: 1
Producer thêm phần tử: 2
Consumer lấy phần tử: 1
Consumer lấy phần tử: 2
Producer thêm phần tử: 3
Consumer lấy phần tử: 3
Producer thêm phần tử: 4
Producer thêm phần tử: 5
Consumer lấy phần tử: 4
Producer thêm phần tử: 6
Consumer lấy phần tử: 5
Producer thêm phần tử: 7
Producer thêm phần tử: 8
Producer thêm phần tử: 9
Producer thêm phần tử: 10
Consumer lấy phần tử: 6
Consumer lấy phần tử: 7
Consumer lấy phần tử: 8
Consumer lấy phần tử: 9
Consumer lấy phần tử: 10
```

Sau khi hiểu hai phương thức thêm và lấy có cơ chế blocking là `put` và `take`, chúng ta hãy xem tiếp hai phương thức thêm vào và lấy ra theo cơ chế non-blocking trong Blocking Queue là `offer` và `poll`.

Như minh họa dưới đây, ta thiết lập một Blocking Queue có kích thước bằng 3, thử dùng phương thức `offer` để đưa 4 phần tử vào hàng đợi, sau đó thử dùng `poll` để lấy phần tử từ hàng đợi 4 lần.

```cpp
public class OfferPollExample {

    public static void main(String[] args) {
        // Tạo một ArrayBlockingQueue có kích thước bằng 3
        ArrayBlockingQueue<String> queue = new ArrayBlockingQueue<>(3);

        // Thêm phần tử vào hàng đợi
        System.out.println(queue.offer("A"));
        System.out.println(queue.offer("B"));
        System.out.println(queue.offer("C"));

        // Thử thêm phần tử vào hàng đợi nhưng hàng đợi đã đầy, trả về false
        System.out.println(queue.offer("D"));

        // Lấy phần tử từ hàng đợi
        System.out.println(queue.poll());
        System.out.println(queue.poll());
        System.out.println(queue.poll());

        // Thử lấy phần tử từ hàng đợi nhưng hàng đợi đã rỗng, trả về null
        System.out.println(queue.poll());
    }

}
```

Kết quả đầu ra cuối cùng của đoạn mã như sau. Có thể thấy vì kích thước hàng đợi là 3 nên 3 lần đưa phần tử vào hàng đợi đầu tiên đều trả về `true`, còn ở lần thứ 4, do hàng đợi đã đầy nên kết quả trả về `false`. Đó cũng là lý do các lệnh `poll` sau đó chỉ lấy được giá trị của 3 phần tử.

```cpp
true
true
true
false
A
B
C
null
```

Sau khi hiểu cơ chế thêm/lấy blocking và non-blocking, hãy xem tiếp một thao tác khá đặc biệt của Blocking Queue. Trong một số kịch bản, ta muốn chuyển toàn bộ dữ liệu trong Blocking Queue vào một danh sách (list) cùng một lúc để xử lý hàng loạt; khi đó ta có thể sử dụng phương thức `drainTo` của Blocking Queue. Phương thức này sẽ chuyển toàn bộ phần tử trong hàng đợi vào list trong một lần: nếu trong hàng đợi có phần tử và chuyển thành công vào list thì `drainTo` trả về số lượng phần tử đã chuyển sang list lần này; ngược lại nếu hàng đợi rỗng, `drainTo` trả về `0` ngay lập tức.

```java
public class DrainToExample {

    public static void main(String[] args) {
        // Tạo một ArrayBlockingQueue có kích thước bằng 5
        ArrayBlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);

        // Thêm phần tử vào hàng đợi
        queue.add(1);
        queue.add(2);
        queue.add(3);
        queue.add(4);
        queue.add(5);

        // Tạo một List để lưu các phần tử lấy từ hàng đợi
        List<Integer> list = new ArrayList<>();

        // Lấy toàn bộ phần tử từ hàng đợi và thêm vào List
        queue.drainTo(list);

        // In ra các phần tử trong List
        System.out.println(list);
    }

}
```

Kết quả đầu ra của đoạn mã như sau

```cpp
[1, 2, 3, 4, 5]
```

## Phân tích mã nguồn ArrayBlockingQueue

Đến đây chúng ta đã có hình dung cơ bản về cách sử dụng Blocking Queue; tiếp theo hãy đi sâu tìm hiểu cơ chế hoạt động của `ArrayBlockingQueue`.

### Thiết kế tổng thể

Trước khi tìm hiểu chi tiết cụ thể của `ArrayBlockingQueue`, trước tiên hãy xem sơ đồ lớp (class diagram) của `ArrayBlockingQueue`.

![Sơ đồ lớp ArrayBlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/arrayblockingqueue-class-diagram-55a92a80.png)

Từ sơ đồ có thể thấy `ArrayBlockingQueue` triển khai interface `BlockingQueue`. Không khó để suy ra rằng thông qua việc triển khai interface `BlockingQueue`, `ArrayBlockingQueue` có được các hành vi thao tác phổ biến của một Blocking Queue.

Đồng thời, `ArrayBlockingQueue` còn kế thừa lớp trừu tượng `AbstractQueue` — lớp này kế thừa `AbstractCollection` và triển khai `Queue`. Từ đặc tính và ngữ nghĩa của lớp trừu tượng đó, ta cũng có thể thấy mối quan hệ kế thừa này giúp `ArrayBlockingQueue` sở hữu các thao tác cơ bản của hàng đợi.

Vậy liệu ta có thể rút ra kết luận sau hay không: thông qua việc kế thừa `AbstractQueue`, nó nhận được toàn bộ khuôn mẫu thao tác của hàng đợi, định nghĩa khung tổng thể cho các thao tác thêm vào (`enqueue`) và lấy ra (`dequeue`). Sau đó, `ArrayBlockingQueue` triển khai `BlockingQueue` để có được các thao tác phổ biến của Blocking Queue rồi hiện thực các thao tác này để lấp đầy phần chi tiết trong các phương thức khuôn mẫu (template method) của `AbstractQueue`, từ đó giúp `ArrayBlockingQueue` trở thành một Blocking Queue hoàn chỉnh.

Để kiểm chứng điều này, hãy cùng vào mã nguồn tìm hiểu. Trước hết hãy xem `AbstractQueue`: từ mối quan hệ kế thừa của lớp, ta có thể thấy đại khái nó nhận được các phương thức thao tác tập hợp thông thường thông qua `AbstractCollection`, rồi nhận được các đặc tính của hàng đợi thông qua interface `Queue`.

```java
public abstract class AbstractQueue<E>
    extends AbstractCollection<E>
    implements Queue<E> {
       //...
}
```

Các thao tác với collection suy cho cùng cũng là thêm, xóa, sửa, truy vấn, nên ta hãy bắt đầu từ phương thức thêm (`add`). Từ mã nguồn có thể thấy nó cài đặt phương thức `add` của `AbstractCollection` với logic bên trong như sau:

1. Gọi phương thức `offer` kế thừa từ interface `Queue`; nếu `offer` thành công thì trả về `true`.
2. Nếu `offer` thất bại, tức là phần tử hiện tại thêm vào hàng đợi không thành công, lập tức ném ra ngoại lệ.

```java
public boolean add(E e) {
  if (offer(e))
      return true;
  else
      throw new IllegalStateException("Queue full");
}
```

Tuy nhiên trong `AbstractQueue` lại không hề có phần cài đặt cho `offer` của `Queue`. Rõ ràng mục đích của cách làm này là định nghĩa sẵn logic cốt lõi của `add`, còn chi tiết của `offer` thì giao cho lớp con của nó — chính là `ArrayBlockingQueue` — cài đặt.

Đến đây, phần phân tích lớp trừu tượng `AbstractQueue` đã xong; hãy tiếp tục xem interface quan trọng khác mà `ArrayBlockingQueue` triển khai là `BlockingQueue`.

Mở mã nguồn `BlockingQueue` ra, ta thấy interface này cũng kế thừa interface `Queue`, điều đó có nghĩa nó cũng mang đầy đủ mọi hành vi mà một hàng đợi sở hữu. Đồng thời, nó cũng định nghĩa các phương thức cần phải cài đặt của riêng mình.

```java
public interface BlockingQueue<E> extends Queue<E> {

     // Thêm phần tử vào hàng đợi thành công trả về true, ngược lại ném ngoại lệ IllegalStateException
    boolean add(E e);

     // Thêm phần tử vào hàng đợi thành công trả về true, ngược lại trả về false
    boolean offer(E e);

     // Thêm phần tử vào hàng đợi thành công thì trả về ngay; nếu hàng đợi đã đầy không thể thêm sẽ block thread; do có thể bị interrupt khi đang block nên chữ ký phương thức ném InterruptedException
    void put(E e) throws InterruptedException;

   // Giống phương thức trên, chỉ khác là khi hàng đợi đầy sẽ chỉ block trong khoảng thời gian timeout với đơn vị unit; nếu hết thời gian chờ vẫn không thêm thành công thì trả về false ngay
    boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException;

    // Lấy một phần tử từ đầu hàng đợi; nếu hàng đợi rỗng thì block chờ; do có thể block thread nên phương thức có thể bị interrupt, vì vậy chữ ký khai báo InterruptedException
    E take() throws InterruptedException;

      // Lấy và trả về phần tử ở đầu hàng đợi; nếu hàng đợi hiện đang rỗng thì block chờ trong khoảng timeout theo đơn vị unit; nếu hết khoảng thời gian này vẫn không có phần tử thì trả về null ngay
    E poll(long timeout, TimeUnit unit)
        throws InterruptedException;

      // Lấy dung lượng còn trống của hàng đợi
    int remainingCapacity();

     // Xóa đối tượng được chỉ định; thành công trả về true, ngược lại trả về false
    boolean remove(Object o);

    // Kiểm tra hàng đợi có chứa phần tử chỉ định hay không
    public boolean contains(Object o);

     // Chuyển toàn bộ phần tử trong hàng đợi vào collection chỉ định
    int drainTo(Collection<? super E> c);

    // Chuyển tối đa maxElements phần tử vào collection
    int drainTo(Collection<? super E> c, int maxElements);
}
```

Sau khi hiểu các thao tác phổ biến của `BlockingQueue`, ta đã biết `ArrayBlockingQueue` triển khai và ghi đè (`override`) các phương thức của `BlockingQueue`, qua đó lấp vào các phương thức của `AbstractQueue`. Nhờ vậy ta biết được phương thức `offer` trong `add` của `AbstractQueue` ở trên được cài đặt từ đâu.

```java
public boolean add(E e) {
  // offer của AbstractQueue đến từ việc lớp con ArrayBlockingQueue triển khai và ghi đè phương thức offer của BlockingQueue
  if (offer(e))
      return true;
  else
      throw new IllegalStateException("Queue full");
}
```

### Khởi tạo

Trước khi tìm hiểu chi tiết của `ArrayBlockingQueue`, hãy xem qua các hàm khởi tạo (constructor) của nó để nắm quá trình khởi tạo. Từ mã nguồn có thể thấy `ArrayBlockingQueue` có 3 constructor, và constructor cốt lõi nhất chính là constructor bên dưới.

```java
// capacity biểu thị dung lượng ban đầu của hàng đợi, fair biểu thị tính công bằng của lock
public ArrayBlockingQueue(int capacity, boolean fair) {
  // Nếu kích thước hàng đợi thiết lập nhỏ hơn 0, ném trực tiếp IllegalArgumentException
  if (capacity <= 0)
      throw new IllegalArgumentException();
  // Khởi tạo một mảng để lưu trữ các phần tử của hàng đợi
  this.items = new Object[capacity];
  // Tạo lock để kiểm soát luồng hoạt động của Blocking Queue
  lock = new ReentrantLock(fair);
  // Tạo hai Condition từ lock để điều khiển quá trình sản xuất và tiêu thụ của hàng đợi
  notEmpty = lock.newCondition();
  notFull =  lock.newCondition();
}
```

Trong constructor này có hai biến thành viên khá cốt lõi là `notEmpty` (khác rỗng) và `notFull` (chưa đầy) mà ta cần đặc biệt lưu ý; chúng chính là mấu chốt giúp producer và consumer phối hợp nhịp nhàng, điểm này tôi sẽ giải thích chi tiết trong phần phân tích mã nguồn tiếp theo. Ở đây ta chỉ cần nắm bước đầu về cách khởi tạo Blocking Queue là được.

Hai constructor còn lại đều dựa trên constructor ở trên. Theo mặc định, ta sẽ dùng constructor dưới đây; constructor này đồng nghĩa với việc `ArrayBlockingQueue` sử dụng Non-fair Lock, tức là sau khi các thread producer hoặc consumer nhận được thông báo, việc tranh giành lock sẽ mang tính ngẫu nhiên.

```java
 public ArrayBlockingQueue(int capacity) {
        this(capacity, false);
    }
```

Còn một constructor nữa ít được dùng hơn: sau khi khởi tạo dung lượng và tính công bằng của lock, nó cung cấp thêm một tham số `Collection`. Từ mã nguồn không khó để nhận ra constructor này đưa trực tiếp các phần tử của collection truyền từ bên ngoài vào trong Blocking Queue ngay lúc khởi tạo.

```java
public ArrayBlockingQueue(int capacity, boolean fair,
                              Collection<? extends E> c) {
  // Khởi tạo dung lượng và tính công bằng của lock
  this(capacity, fair);

  final ReentrantLock lock = this.lock;
  // Khóa lại và đưa các phần tử trong c vào mảng tầng dưới của ArrayBlockingQueue
  lock.lock();
  try {
      int i = 0;
      try {
                // Duyệt và thêm phần tử vào mảng
          for (E e : c) {
              checkNotNull(e);
              items[i++] = e;
          }
      } catch (ArrayIndexOutOfBoundsException ex) {
          throw new IllegalArgumentException();
      }
      // Ghi nhận số phần tử hiện tại của hàng đợi
      count = i;
                      // Cập nhật vị trí trong mảng tầng dưới của hàng đợi cho lần thêm tiếp theo bằng put, offer hoặc add
      putIndex = (i == capacity) ? 0 : i;
  } finally {
      // Giải phóng lock sau khi duyệt xong
      lock.unlock();
  }
}
```

### Lấy và thêm phần tử theo cơ chế blocking

Việc lấy và thêm phần tử theo cơ chế blocking của `ArrayBlockingQueue` tương ứng với mô hình Producer-Consumer. Tuy nó cũng hỗ trợ lấy và thêm phần tử theo cơ chế non-blocking (chẳng hạn phương thức `poll()` và `offer(E e)`, sẽ được giới thiệu ở phần sau), nhưng thông thường ít khi dùng đến trong ngữ cảnh blocking.

Các phương thức lấy và thêm phần tử theo cơ chế blocking của `ArrayBlockingQueue` gồm:

- `put(E e)`: Chèn phần tử vào hàng đợi; nếu hàng đợi đã đầy, phương thức này sẽ block mãi cho đến khi hàng đợi có chỗ trống hoặc thread bị ngắt (`interrupt`).
- `take()`: Lấy và xóa phần tử ở đầu hàng đợi; nếu hàng đợi đang rỗng, phương thức này sẽ block mãi cho đến khi hàng đợi khác rỗng hoặc thread bị ngắt (`interrupt`).

Chìa khóa để cài đặt hai phương thức này nằm ở hai đối tượng điều kiện `notEmpty` (khác rỗng) và `notFull` (chưa đầy) mà ta đã nhắc đến ở phần constructor phía trên.

Tiếp theo, tôi sẽ dùng hai hình minh họa để giúp bạn hiểu cách hai điều kiện này được vận dụng trong Blocking Queue.

![Điều kiện notEmpty của ArrayBlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-notEmpty-take-09a7e944.png)

Giả sử trong mã của chúng ta, consumer chạy trước. Khi phát hiện hàng đợi không có dữ liệu, điều kiện `notEmpty` sẽ tạm dừng (suspend) thread này lại, tức là bị treo để chờ điều kiện khác rỗng. Sau đó quyền thực thi CPU chuyển sang producer; producer thấy hàng đợi có thể chứa dữ liệu nên đưa dữ liệu vào rồi thông báo rằng điều kiện khác rỗng đã thỏa mãn. Lúc này consumer sẽ được đánh thức để vào hàng đợi lấy giá trị bằng các phương thức như `take`.

![Điều kiện notFull của ArrayBlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-notFull-put-8854a63b.png)

Trong quá trình chạy tiếp theo, tốc độ tạo dữ liệu của producer lớn hơn nhiều so với tốc độ tiêu thụ của consumer, vì thế sau khi lấp đầy hàng đợi, producer lại thử đưa dữ liệu vào hàng đợi và phát hiện hàng đợi đã đầy, do đó Blocking Queue liền tạm dừng thread hiện tại để chờ điều kiện chưa đầy. Sau đó consumer nhận được quyền thực thi CPU và tiến hành tiêu thụ, nhờ vậy hàng đợi có thể chứa dữ liệu mới trở lại và phát ra thông báo chưa đầy. Lúc này producer đang bị treo sẽ chờ đến lượt CPU thực thi để thử đưa dữ liệu vào hàng đợi lần nữa.

Sau khi nắm sơ lược luồng tương tác của Blocking Queue dựa trên hai điều kiện này, hãy cùng xem mã nguồn của hai phương thức `put` và `take`.

```java
public void put(E e) throws InterruptedException {
    // Đảm bảo phần tử chèn vào không phải null
    checkNotNull(e);
    // Lấy và giữ lock
    final ReentrantLock lock = this.lock;
    // Ở đây dùng lockInterruptibly() thay vì lock() để có thể phản hồi thao tác interrupt; nếu bị ngắt trong lúc chờ lấy lock thì phương thức sẽ ném ngoại lệ InterruptedException
    lock.lockInterruptibly();
    try {
            // Nếu count bằng độ dài mảng tức là hàng đợi đã đầy, thread hiện tại sẽ bị tạm dừng và đưa vào hàng đợi AQS, chờ đến khi hàng đợi chưa đầy mới chèn (điều kiện notFull)
       // Trong thời gian chờ, lock sẽ được giải phóng để các thread khác có thể tiếp tục thao tác với hàng đợi
        while (count == items.length)
            notFull.await();
           // Nếu hàng đợi có thể chứa phần tử thì gọi enqueue để đưa phần tử vào hàng đợi
        enqueue(e);
    } finally {
        // Giải phóng lock
        lock.unlock();
    }
}
```

Bên trong `put` gọi phương thức `enqueue` để thực hiện đưa phần tử vào hàng đợi. Hãy tiếp tục xem chi tiết cài đặt của `enqueue`:

```java
private void enqueue(E x) {
   // Lấy mảng tầng dưới của hàng đợi
    final Object[] items = this.items;
    // Gán giá trị tại vị trí putIndex bằng x truyền vào
    items[putIndex] = x;
    // Cập nhật putIndex, nếu putIndex bằng độ dài mảng thì đặt lại về 0
    if (++putIndex == items.length)
        putIndex = 0;
    // Độ dài hàng đợi + 1
    count++;
    // Thông báo hàng đợi khác rỗng, các thread đang bị block vì lấy phần tử có thể tiếp tục làm việc
    notEmpty.signal();
}
```

Từ mã nguồn có thể thấy logic của thao tác `enqueue` là thêm một phần tử mới vào trong mảng, các bước thực thi tổng thể gồm:

1. Lấy mảng tầng dưới `items` của `ArrayBlockingQueue`.
2. Lưu phần tử vào vị trí `putIndex`.
3. Cập nhật `putIndex` sang vị trí kế tiếp; nếu `putIndex` bằng độ dài hàng đợi thì chứng tỏ `putIndex` đã đi đến cuối mảng, lần chèn tiếp theo cần bắt đầu từ `0`. (`ArrayBlockingQueue` áp dụng tư tưởng hàng đợi vòng — `circular queue`, tức là tái sử dụng tuần hoàn một mảng từ đầu đến cuối.)
4. Cập nhật giá trị `count`, biểu thị độ dài hàng đợi hiện tại tăng thêm 1.
5. Gọi `notEmpty.signal()` để thông báo hàng đợi đã khác rỗng, consumer có thể lấy giá trị từ hàng đợi.

Đến đây ta đã hiểu luồng hoạt động của phương thức `put`. Để hiểu trọn vẹn hơn thiết kế của `ArrayBlockingQueue` cho mô hình Producer-Consumer, hãy xem tiếp phương thức `take` lấy phần tử từ hàng đợi theo cơ chế blocking.

```java
public E take() throws InterruptedException {
       // Lấy lock
     final ReentrantLock lock = this.lock;
     lock.lockInterruptibly();
     try {
             // Nếu số phần tử trong hàng đợi bằng 0 thì tạm dừng thread hiện tại và đưa vào hàng đợi AQS, chờ đến khi hàng đợi khác rỗng mới lấy và xóa phần tử (điều kiện notEmpty)
         while (count == 0)
             notEmpty.await();
            // Nếu hàng đợi khác rỗng thì gọi dequeue để lấy phần tử
         return dequeue();
     } finally {
          // Giải phóng lock
         lock.unlock();
     }
}
```

Hiểu được phương thức `put` rồi thì xem phương thức `take` sẽ rất đơn giản: logic cốt lõi của nó hoàn toàn đối nghịch với `put`. Chẳng hạn, `put` khi hàng đợi đầy sẽ chờ đến lúc hàng đợi chưa đầy mới chèn phần tử (điều kiện `notFull`), còn `take` sẽ chờ đến lúc hàng đợi khác rỗng mới lấy và xóa phần tử (điều kiện `notEmpty`).

Bên trong `take` gọi phương thức `dequeue` để thực hiện lấy phần tử ra khỏi hàng đợi, và logic cốt lõi của nó cũng ngược lại với `enqueue`.

```java
private E dequeue() {
  // Lấy mảng tầng dưới của Blocking Queue
  final Object[] items = this.items;
  @SuppressWarnings("unchecked")
  // Lấy phần tử tại vị trí takeIndex trong hàng đợi
  E x = (E) items[takeIndex];
  // Đặt vị trí takeIndex về null
  items[takeIndex] = null;
  // Dịch takeIndex về sau; nếu bằng độ dài mảng thì cập nhật về 0
  if (++takeIndex == items.length)
      takeIndex = 0;
  // Giảm độ dài hàng đợi đi 1
  count--;
  if (itrs != null)
      itrs.elementDequeued();
  // Thông báo cho các thread đang chờ rằng trạng thái hàng đợi hiện tại đã khác đầy, có thể tiếp tục đưa phần tử vào
  notFull.signal();
  return x;
}
```

Do các bước của phương thức `dequeue` (ra khỏi hàng đợi) nhìn chung tương tự với phương thức `enqueue` (vào hàng đợi) đã giới thiệu ở trên nên ở đây không nhắc lại nữa.

Để giúp dễ hình dung hơn, tôi đã vẽ riêng một sơ đồ minh họa cách hai đối tượng điều kiện `notEmpty` (khác rỗng) và `notFull` (chưa đầy) kiểm soát việc thêm và lấy dữ liệu của `ArrayBlockingQueue`.

![Điều kiện notEmpty và notFull của ArrayBlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-notEmpty-notFull-c0b39e45.png)

- **Consumer**: Khi consumer lấy một phần tử ra khỏi hàng đợi thông qua các thao tác như `take` hoặc `poll`, nó sẽ thông báo hàng đợi đã khác đầy; lúc này các producer đang chờ điều kiện chưa đầy sẽ được đánh thức và chờ nhận CPU time slice để thực hiện thao tác đưa vào hàng đợi (`enqueue`).
- **Producer**: Khi producer đưa phần tử vào hàng đợi xong, nó sẽ kích hoạt thông báo hàng đợi đã khác rỗng; lúc này consumer sẽ được đánh thức và chờ CPU time slice để thử lấy phần tử. Cứ lặp đi lặp lại như vậy, hai đối tượng điều kiện tạo thành một vòng khép kín kiểm soát việc thêm và lấy giữa nhiều thread.

### Lấy và thêm phần tử theo cơ chế non-blocking

Các phương thức lấy và thêm phần tử theo cơ chế non-blocking của `ArrayBlockingQueue` gồm:

- `offer(E e)`: Chèn phần tử vào cuối hàng đợi. Nếu hàng đợi đã đầy, phương thức này trả về `false` ngay lập tức, không chờ đợi và không block thread.
- `poll()`: Lấy và xóa phần tử ở đầu hàng đợi. Nếu hàng đợi đang rỗng, phương thức này trả về `null` ngay lập tức, không chờ đợi và không block thread.
- `add(E e)`: Chèn phần tử vào cuối hàng đợi. Nếu hàng đợi đã đầy sẽ ném ngoại lệ `IllegalStateException`, bên dưới dựa trên phương thức `offer(E e)`.
- `remove()`: Xóa phần tử ở đầu hàng đợi. Nếu hàng đợi đang rỗng sẽ ném ngoại lệ `NoSuchElementException`, bên dưới dựa trên `poll()`.
- `peek()`: Lấy nhưng không xóa phần tử ở đầu hàng đợi. Nếu hàng đợi đang rỗng, phương thức này trả về `null` ngay lập tức, không chờ đợi và không block thread.

Trước tiên hãy xem phương thức `offer`, logic gần như giống `put`, điểm khác biệt duy nhất là khi đưa vào hàng đợi thất bại thì không block thread hiện tại mà trả về `false` ngay.

```java
public boolean offer(E e) {
        // Đảm bảo phần tử chèn vào không phải null
        checkNotNull(e);
        // Lấy lock
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
             // Hàng đợi đã đầy thì trả về false ngay
            if (count == items.length)
                return false;
            else {
                // Ngược lại đưa phần tử vào hàng đợi và trả về true ngay
                enqueue(e);
                return true;
            }
        } finally {
            // Giải phóng lock
            lock.unlock();
        }
    }
```

Phương thức `poll` cũng tương tự: khi lấy phần tử thất bại cũng trả về `null` ngay chứ không block thread đang lấy phần tử.

```java
public E poll() {
        final ReentrantLock lock = this.lock;
        // Khóa lại
        lock.lock();
        try {
            // Nếu hàng đợi rỗng trả về null ngay, ngược lại lấy ra và trả về giá trị phần tử
            return (count == 0) ? null : dequeue();
        } finally {
            lock.unlock();
        }
    }
```

Phương thức `add` thực chất chỉ là một lớp bọc bên ngoài `offer`. Như đoạn mã dưới đây cho thấy, `add` gọi phương thức `offer` không có tham số thời gian, nếu đưa vào hàng đợi thất bại thì ném ngoại lệ ngay.

```java
public boolean add(E e) {
        return super.add(e);
    }


public boolean add(E e) {
        // Gọi phương thức offer, nếu thất bại thì ném ngoại lệ ngay
        if (offer(e))
            return true;
        else
            throw new IllegalStateException("Queue full");
    }
```

Phương thức `remove` cũng tương tự: gọi `poll`, nếu trả về `null` nghĩa là hàng đợi không có phần tử, lập tức ném ngoại lệ.

```java
public E remove() {
        E x = poll();
        if (x != null)
            return x;
        else
            throw new NoSuchElementException();
    }
```

Logic của phương thức `peek()` cũng rất đơn giản, bên trong gọi phương thức `itemAt`.

```java
public E peek() {
        // Giữ lock
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            // Khi hàng đợi rỗng sẽ trả về null
            return itemAt(takeIndex);
        } finally {
            // Giải phóng lock
            lock.unlock();
        }
    }

// Trả về phần tử tại vị trí chỉ định trong hàng đợi
@SuppressWarnings("unchecked")
final E itemAt(int i) {
    return (E) items[i];
}
```

### Lấy và thêm phần tử theo cơ chế blocking có thời gian chờ (timeout)

Trên nền tảng lấy và thêm phần tử non-blocking của `offer(E e)` và `poll()`, tác giả thiết kế đã cung cấp thêm `offer(E e, long timeout, TimeUnit unit)` và `poll(long timeout, TimeUnit unit)` có thời gian chờ, dùng để thêm và lấy phần tử theo cơ chế blocking trong khoảng thời gian timeout được chỉ định.

```java
 public boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException {

        checkNotNull(e);
        long nanos = unit.toNanos(timeout);
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
        // Hàng đợi đã đầy, đi vào vòng lặp
            while (count == items.length) {
            // Hết thời gian mà hàng đợi vẫn đầy thì trả về false ngay
                if (nanos <= 0)
                    return false;
                 // Block trong khoảng thời gian nanos, chờ điều kiện notFull
                nanos = notFull.awaitNanos(nanos);
            }
            enqueue(e);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

Có thể thấy phương thức `offer` có thời gian timeout trong trường hợp hàng đợi đã đầy sẽ chờ trong khoảng thời gian do người dùng truyền vào; nếu hết thời gian quy định vẫn chưa thể thêm phần tử thì trả về `false` ngay.

```java
public E poll(long timeout, TimeUnit unit) throws InterruptedException {
        long nanos = unit.toNanos(timeout);
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
          // Hàng đợi rỗng, lặp chờ; nếu hết thời gian mà vẫn rỗng thì trả về null ngay
            while (count == 0) {
                if (nanos <= 0)
                    return null;
                nanos = notEmpty.awaitNanos(nanos);
            }
            return dequeue();
        } finally {
            lock.unlock();
        }
    }
```

Tương tự, phương thức `poll` có thời gian timeout cũng vậy: khi hàng đợi rỗng sẽ chờ trong khoảng thời gian quy định, nếu hết thời gian mà vẫn rỗng thì trả về `null` ngay.

### Kiểm tra phần tử có tồn tại hay không

`ArrayBlockingQueue` cung cấp `contains(Object o)` để kiểm tra xem phần tử chỉ định có tồn tại trong hàng đợi hay không.

```java
public boolean contains(Object o) {
    // Nếu phần tử đích là null thì trả về false ngay
    if (o == null) return false;
    // Lấy mảng phần tử của hàng đợi hiện tại
    final Object[] items = this.items;
    // Giữ lock
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        // Nếu hàng đợi khác rỗng
        if (count > 0) {
            final int putIndex = this.putIndex;
            // Bắt đầu duyệt từ đầu hàng đợi
            int i = takeIndex;
            do {
                if (o.equals(items[i]))
                    return true;
                if (++i == items.length)
                    i = 0;
            } while (i != putIndex);
        }
        return false;
    } finally {
        // Giải phóng lock
        lock.unlock();
    }
}
```

## So sánh các phương thức lấy và thêm phần tử của ArrayBlockingQueue

Để dễ hiểu hơn về `ArrayBlockingQueue`, chúng ta hãy so sánh lại các phương thức lấy và thêm phần tử đã đề cập ở trên.

Thêm phần tử:

| Phương thức                               | Cách xử lý khi hàng đợi đầy                                                      | Giá trị trả về |
| ----------------------------------------- | -------------------------------------------------------------------------------- | -------------- |
| `put(E e)`                                | Block thread cho đến khi bị interrupt hoặc được đánh thức                        | void           |
| `offer(E e)`                              | Trả về false ngay lập tức                                                        | boolean        |
| `offer(E e, long timeout, TimeUnit unit)` | Block trong thời gian timeout chỉ định; hết thời gian vẫn chưa thêm được trả về false | boolean   |
| `add(E e)`                                | Ném trực tiếp ngoại lệ `IllegalStateException`                                   | boolean        |

Lấy / xóa phần tử:

| Phương thức                         | Cách xử lý khi hàng đợi rỗng                                               | Giá trị trả về |
| ----------------------------------- | -------------------------------------------------------------------------- | -------------- |
| `take()`                            | Block thread cho đến khi bị interrupt hoặc được đánh thức                  | E              |
| `poll()`                            | Trả về null                                                                | E              |
| `poll(long timeout, TimeUnit unit)` | Block trong thời gian timeout chỉ định; hết thời gian vẫn rỗng trả về null | E              |
| `peek()`                            | Trả về null                                                                | E              |
| `remove()`                          | Ném trực tiếp ngoại lệ `NoSuchElementException`                            | boolean        |

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-get-add-element-methods-75b69ca9.png)

## Câu hỏi phỏng vấn liên quan đến ArrayBlockingQueue

### ArrayBlockingQueue là gì? Đặc điểm của nó là gì?

`ArrayBlockingQueue` là lớp cài đặt hàng đợi giới hạn (bounded queue) của interface `BlockingQueue`, thường được dùng để chia sẻ dữ liệu giữa nhiều thread; tầng dưới được cài đặt bằng mảng, nhìn tên gọi là có thể thấy ngay.

Dung lượng của `ArrayBlockingQueue` là hữu hạn; một khi đã khởi tạo thì không thể thay đổi dung lượng.

Để đảm bảo an toàn luồng (thread-safe), việc kiểm soát đồng thời của `ArrayBlockingQueue` sử dụng Reentrant Lock `ReentrantLock`; dù là thao tác chèn hay thao tác đọc thì đều phải lấy được lock mới có thể thực hiện. Hơn nữa, nó còn hỗ trợ hai cơ chế truy cập lock là Fair Lock và Non-fair Lock, mặc định là Non-fair Lock.

`ArrayBlockingQueue` tuy mang tên là Blocking Queue nhưng cũng hỗ trợ lấy và thêm phần tử theo cơ chế non-blocking (ví dụ các phương thức `poll()` và `offer(E e)`). Khi hàng đợi đầy, `offer(E e)` sẽ trả về `false`; khi hàng đợi rỗng, `poll()` sẽ trả về `null`.

### ArrayBlockingQueue và LinkedBlockingQueue khác nhau như thế nào?

`ArrayBlockingQueue` và `LinkedBlockingQueue` là hai cài đặt Blocking Queue phổ biến trong gói đồng thời của Java (`java.util.concurrent`), cả hai đều thread-safe. Tuy nhiên, giữa chúng vẫn tồn tại những điểm khác biệt sau:

- Cài đặt tầng dưới: `ArrayBlockingQueue` dựa trên mảng, trong khi `LinkedBlockingQueue` dựa trên danh sách liên kết.
- Có giới hạn hay không: `ArrayBlockingQueue` là hàng đợi giới hạn (bounded), bắt buộc phải chỉ định kích thước dung lượng khi khởi tạo. `LinkedBlockingQueue` khi khởi tạo có thể không chỉ định kích thước dung lượng, mặc định là `Integer.MAX_VALUE`, tức là không giới hạn (unbounded). Tuy nhiên cũng có thể chỉ định kích thước hàng đợi để biến nó thành hàng đợi giới hạn.
- Lock có tách biệt hay không: Lock trong `ArrayBlockingQueue` không tách biệt, tức là sản xuất và tiêu thụ dùng chung một lock; lock trong `LinkedBlockingQueue` được tách biệt, tức là sản xuất dùng `putLock` còn tiêu thụ dùng `takeLock`, điều này giúp tránh tranh chấp lock giữa các thread producer và consumer.
- Mức tiêu thụ bộ nhớ: `ArrayBlockingQueue` cần cấp phát trước bộ nhớ cho mảng, trong khi `LinkedBlockingQueue` cấp phát động bộ nhớ cho từng nút của danh sách liên kết. Điều này có nghĩa là `ArrayBlockingQueue` ngay lúc khởi tạo đã chiếm một lượng không gian bộ nhớ nhất định, và thường bộ nhớ xin cấp phát lớn hơn bộ nhớ thực tế đang dùng, còn `LinkedBlockingQueue` thì chiếm dần không gian bộ nhớ theo số lượng phần tử tăng thêm.

### ArrayBlockingQueue và ConcurrentLinkedQueue khác nhau như thế nào?

`ArrayBlockingQueue` và `ConcurrentLinkedQueue` là hai cài đặt hàng đợi phổ biến trong gói đồng thời của Java, cả hai đều thread-safe. Tuy nhiên, giữa chúng vẫn tồn tại những điểm khác biệt sau:

- Cài đặt tầng dưới: `ArrayBlockingQueue` dựa trên mảng, trong khi `ConcurrentLinkedQueue` dựa trên danh sách liên kết.
- Có giới hạn hay không: `ArrayBlockingQueue` là hàng đợi giới hạn (bounded), bắt buộc phải chỉ định kích thước dung lượng khi khởi tạo, còn `ConcurrentLinkedQueue` là hàng đợi không giới hạn (unbounded), có thể tăng dung lượng một cách linh động.
- Có hỗ trợ blocking hay không: `ArrayBlockingQueue` hỗ trợ cả hai cách lấy và thêm phần tử là blocking và non-blocking (thông thường chỉ dùng cách đầu), còn `ConcurrentLinkedQueue` là hàng đợi không giới hạn và chỉ hỗ trợ lấy và thêm phần tử theo cơ chế non-blocking.

### Nguyên lý cài đặt của ArrayBlockingQueue là gì?

Nguyên lý cài đặt của `ArrayBlockingQueue` chủ yếu gồm các điểm sau (lấy việc lấy và thêm phần tử theo cơ chế blocking làm ví dụ):

- `ArrayBlockingQueue` duy trì một mảng có độ dài cố định ở bên trong để lưu trữ các phần tử.
- Đồng bộ hóa các thao tác đọc và ghi bằng cách sử dụng đối tượng lock `ReentrantLock`, tức là đảm bảo an toàn luồng (thread-safe) thông qua cơ chế khóa.
- Thực hiện các thao tác chờ và đánh thức giữa các thread thông qua `Condition`.

Dưới đây là phần giới thiệu chi tiết hơn về cách cài đặt cụ thể việc chờ và đánh thức giữa các thread (không cần nhớ chính xác từng tên phương thức, khi phỏng vấn chỉ cần trả lời đúng các ý chính là được):

- Khi hàng đợi đã đầy, thread producer sẽ gọi phương thức `notFull.await()` để cho producer chờ đợi, chờ cho đến khi hàng đợi chưa đầy mới chèn (điều kiện `notFull`).
- Khi hàng đợi đang rỗng, thread consumer sẽ gọi phương thức `notEmpty.await()` để cho consumer chờ đợi, chờ cho đến khi hàng đợi khác rỗng mới tiêu thụ (điều kiện `notEmpty`).
- Khi có phần tử mới được thêm vào, thread producer sẽ gọi phương thức `notEmpty.signal()` để đánh thức các thread consumer đang chờ tiêu thụ.
- Khi có phần tử được lấy ra khỏi hàng đợi, thread consumer sẽ gọi phương thức `notFull.signal()` để đánh thức các thread producer đang chờ chèn phần tử.

Bổ sung thêm về interface `Condition`:

> `Condition` mới có từ JDK 1.5 trở đi, nó có tính linh hoạt rất cao, ví dụ như có thể thực hiện chức năng thông báo đa luồng (multi-way notification), tức là trong một đối tượng `Lock` có thể tạo nhiều instance `Condition` (tức object monitor); **các đối tượng thread có thể đăng ký vào một `Condition` chỉ định, từ đó có thể thực hiện thông báo thread một cách có chọn lọc, linh hoạt hơn nhiều trong việc điều phối thread. Khi sử dụng phương thức `notify()/notifyAll()` để thông báo, thread được thông báo là do JVM lựa chọn, còn dùng lớp `ReentrantLock` kết hợp với các instance `Condition` có thể đạt được "thông báo có chọn lọc"** — tính năng này rất quan trọng và được interface `Condition` cung cấp mặc định. Trong khi đó, từ khóa `synchronized` tương đương với việc trong toàn bộ đối tượng `Lock` chỉ có duy nhất một instance `Condition`, tất cả các thread đều đăng ký trên cùng một instance đó. Nếu thực hiện phương thức `notifyAll()` thì sẽ đánh thức toàn bộ các thread đang ở trạng thái chờ, điều này sẽ gây ra vấn đề rất lớn về hiệu năng. Còn phương thức `signalAll()` của một instance `Condition` thì chỉ đánh thức tất cả các thread đang chờ đã đăng ký trên chính instance `Condition` đó.

## Tài liệu tham khảo

- Chuỗi bài Hiểu sâu về Java | Giải thích chi tiết cách dùng BlockingQueue: <https://juejin.cn/post/6999798721269465102>
- Tìm hiểu từ cơ bản đến chuyên sâu về BlockingQueue và cài đặt điển hình ArrayBlockingQueue: <https://zhuanlan.zhihu.com/p/539619957>
- Tổng quan lập trình đồng thời: Nguyên lý tầng dưới và thực chiến ArrayBlockingQueue: <https://zhuanlan.zhihu.com/p/339662987>
