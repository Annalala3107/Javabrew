---
title: "Giải thích chi tiết về Lock trong Java: Mutex Lock, Read-Write Lock, Spin Lock và tối ưu hóa synchronized"
description: "Hệ thống hóa toàn diện cơ chế khóa (Lock) trong Java: từ Mutex Lock, Read-Write Lock, Spin Lock đến synchronized, ReentrantLock, AQS, StampedLock — làm rõ cách phân loại khóa, nguyên lý cài đặt, khác biệt giữa các phiên bản JDK và gợi ý lựa chọn."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/java-lock.md
head:
  - - meta
    - name: keywords
      content: Java lock,mutex lock,read-write lock,spin lock,synchronized,ReentrantLock,AQS,StampedLock,CAS,nâng cấp khóa,tối ưu hóa khóa,Java concurrency
---

Khi học lập trình đồng thời trong Java, các tên gọi liên quan đến khóa rất dễ làm người học bị rối: Mutex Lock (khóa loại trừ tương hỗ), Read-Write Lock (khóa đọc-ghi), Spin Lock, khóa bi quan (`Pessimistic Lock`), khóa lạc quan (`Optimistic Lock`), CAS, AQS, `synchronized`, `ReentrantLock`, `StampedLock`, Biased Lock, Lightweight Lock, Heavyweight Lock.

Những tên gọi này không nằm trên cùng một chiều phân loại.

Có cái nói về "ai được phép vào vùng găng (`critical section`)", như Mutex Lock và Read-Write Lock; có cái nói về "khi không lấy được khóa thì chờ như thế nào", như Spin Lock và Blocking Lock; có cái nói về "khóa trước khi sửa dữ liệu dùng chung hay kiểm tra khi commit", như Pessimistic Lock và Optimistic Lock; lại có cái nói về cách HotSpot tối ưu hóa `synchronized` dưới các mức độ tranh chấp khác nhau.

Bài viết này trước tiên sẽ dựng lên hệ quy chiếu cho các loại khóa, sau đó đi vào cách các công cụ khóa thường dùng trong Java hiện thực điều đó trong thực tế. Chi tiết về Pessimistic Lock, Optimistic Lock và CAS đã có hai bài viết chuyên sâu trên trang: [Giải thích chi tiết về Optimistic Lock và Pessimistic Lock](./optimistic-lock-and-pessimistic-lock.md), [Giải thích chi tiết về CAS](./cas.md). Bài viết này chỉ giữ lại ngữ cảnh cần thiết, tập trung vào việc "xâu chuỗi toàn bộ hệ thống khóa lại với nhau".

PS: Bài viết này chủ yếu lấy HotSpot / OpenJDK làm bối cảnh. Tính loại trừ tương hỗ của monitor và ngữ nghĩa bộ nhớ của `synchronized` thuộc tầng đặc tả Java/JVM; các nội dung như Object Header, Mark Word, Lightweight Lock hay Lock Inflation thuộc phần tối ưu hóa cài đặt của HotSpot, chứ đặc tả ngôn ngữ Java không cam kết một quy trình cố định. Biased Lock từ JDK 15 trở đi mặc định bị vô hiệu hóa và các tham số liên quan bị đánh dấu deprecated, từ JDK 18 các tham số liên quan đã chuyển sang obsoleted; kết luận về Virtual Thread (luồng ảo) và hiện tượng `synchronized` pinning cũng cần phân biệt giữa JDK 21~23 và JDK 24+.

Trước tiên hãy dùng một bảng để tách rõ các chiều phân loại:

| Chiều phân loại | Tên gọi tiêu biểu | Câu hỏi được trả lời |
| --- | --- | --- |
| Cách loại trừ vùng găng | Mutex Lock, Read-Write Lock | Ai có thể đi vào vùng găng |
| Chiến lược chờ | Spin Lock, Blocking Lock | Khi không lấy được khóa thì chờ thế nào |
| Tư duy kiểm soát đồng thời | Khóa bi quan (`Pessimistic Lock`), Khóa lạc quan (`Optimistic Lock`) | Khóa trước rồi sửa, hay kiểm tra lúc commit |
| Cơ chế cập nhật nguyên tử | CAS, các lớp Atomic | Làm sao cập nhật không chặn (non-blocking) một biến đơn lẻ |
| Tối ưu hóa cài đặt JVM | Lightweight Lock, Heavyweight Lock, Lock Inflation | HotSpot giảm chi phí của `synchronized` như thế nào |
| Công cụ Lock trong Java | `synchronized`, `ReentrantLock`, `StampedLock` | Trong code cụ thể dùng công cụ nào |

## Một chiếc Lock thực chất bảo vệ điều gì?

Vấn đề mà khóa giải quyết là bài toán vùng găng (`critical section`). Vùng găng là đoạn mã có truy cập trạng thái dùng chung có thể thay đổi (`shared mutable state`) và không thể để nhiều đơn vị thực thi xen kẽ tùy ý.

![Sơ đồ giao thức truy cập bảo vệ vùng găng: nhiều Thread truy cập trạng thái dùng chung thông qua một đầu vào khóa thống nhất; đi vòng qua khóa hoặc đổi đối tượng khóa đều phá vỡ quan hệ loại trừ tương hỗ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-critical-section-67226b1b.png)

Ví dụ phép tăng giá trị sau đây:

```java
count++;
```

Trong mã nguồn chỉ có một dòng, nhưng dòng code này không thể coi là một hành động bất khả phân. Thread thường phải đọc `count` ra trước, cộng thêm 1, rồi mới ghi ngược trở lại. Khi hai Thread thực thi đồng thời, cả hai có thể cùng đọc được giá trị cũ là `0`, mỗi bên tự tính ra `1`, và cuối cùng cùng ghi `1` vào bộ nhớ. Hai Thread đều thực hiện phép tăng, nhưng kết quả chỉ tăng đúng một lần.

Cách làm của khóa rất trực diện: trước khi đi vào đoạn code này phải lấy khóa trước, thực thi xong rồi mới giải phóng khóa. Chỉ cần toàn bộ mã nguồn truy cập cùng một trạng thái dùng chung đều tuân thủ quy ước dùng chung một khóa, các thao tác đọc ghi vốn có thể xen kẽ nhau sẽ được gom thành thực thi loại trừ tương hỗ.

Có một câu nói rất dễ bị bỏ qua ở đây: **thứ mà khóa thực sự bảo vệ là giao thức truy cập trạng thái của đối tượng; bản thân đối tượng sẽ không tự động an toàn chỉ vì được gắn khóa**.

`synchronized (account)` không tự biến tất cả các trường của `account` trở nên an toàn một cách thần kỳ. Nếu một đoạn code khác đi vòng qua chiếc khóa này và sửa trực tiếp `account.balance`, tính an toàn luồng (thread-safety) vẫn bị phá vỡ như thường. Khóa học về Lock của MIT 6.005 cũng lặp đi lặp lại chính điểm này: khóa phải canh giữ bất biến biểu diễn (`representation invariant`) của một trừu tượng hóa dữ liệu nào đó, chứ tiện tay lấy đại một đối tượng ra bọc khóa thì không thể đảm bảo bất biến luôn đúng.

## Mutex Lock: Tại một thời điểm chỉ cho phép một Thread đi vào

Quy tắc của Mutex Lock (khóa loại trừ tương hỗ) rất đơn giản: tại một thời điểm, tối đa chỉ có một Thread giữ khóa và đi vào vùng găng.

Trong Java, cả `synchronized` và `ReentrantLock` đều có thể dùng làm Mutex Lock:

```java
class Counter {
    private int count;

    public synchronized void increment() {
        count++;
    }

    public synchronized int get() {
        return count;
    }
}
```

Đổi sang `ReentrantLock` thì cách viết dài dòng hơn một chút, nhưng đổi lại bạn có nhiều quyền kiểm soát hơn:

```java
class Counter {
    private final ReentrantLock lock = new ReentrantLock();
    private int count;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }
}
```

Không thể bỏ qua `try/finally`. Thao tác nhả khóa của `synchronized` do JVM làm giúp bạn: dù khối mã thoát ra bình thường hay ném ngoại lệ thì monitor đều được giải phóng; còn `ReentrantLock` là API tường minh, việc lấy khóa và mở khóa phải tự ghép cặp với nhau. Tài liệu `ReentrantLock` của Oracle cũng khuyến nghị cách viết "ngay sau khi gọi `lock` phải đi vào khối `try`".

Điểm thực sự khó của Mutex Lock không nằm ở cú pháp, mà nằm ở độ mịn của khóa (`lock granularity`).

Một chiếc khóa lớn bọc toàn bộ thao tác lại là nhàn nhất, nhưng mức độ đồng thời thấp; nhiều khóa nhỏ bảo vệ riêng từng phần dữ liệu có thể cho thông lượng tốt hơn, nhưng thứ tự khóa, `Deadlock` và tính nhất quán trạng thái đều khó quản lý hơn. OSTEP khi nói về POSIX mutex cũng nhắc tới sự đánh đổi này: dùng khóa khác nhau cho dữ liệu khác nhau giúp tăng tính đồng thời, nhưng lập trình viên phải nắm rất rõ từng chiếc khóa thực chất đang bảo vệ phần trạng thái nào.

## Read-Write Lock: Đọc-Đọc chia sẻ, thao tác Ghi độc chiếm

Mutex Lock khắt khe với cả thao tác đọc: chỉ cần một Thread đang đọc thì Thread khác cũng không thể vào đọc cùng lúc. Nhưng nhiều đối tượng nghiệp vụ có một đặc điểm: đọc không làm thay đổi trạng thái, nhiều Thread đọc chạy đồng thời sẽ không phá hỏng dữ liệu của nhau.

Read-Write Lock (khóa đọc-ghi) sinh ra là để phục vụ kịch bản này.

Nó chia quyền truy cập thành hai loại:

- Khóa đọc (Read Lock): Khóa chia sẻ (`shared lock`), nhiều Thread có thể nắm giữ cùng lúc.
- Khóa ghi (Write Lock): Khóa độc chiếm (`exclusive lock`), chỉ một Thread được giữ tại một thời điểm, đồng thời khóa ghi loại trừ tương hỗ với khóa đọc.

Quy tắc tương ứng cũng rất dễ nhớ:

- Đọc - Đọc không loại trừ nhau.
- Đọc - Ghi loại trừ nhau.
- Ghi - Ghi loại trừ nhau.

Hiện thực tiêu biểu trong Java là `ReentrantReadWriteLock`:

```java
class ProfileCache {
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private final Map<Long, String> cache = new HashMap<>();

    public String get(long userId) {
        readLock.lock();
        try {
            return cache.get(userId);
        } finally {
            readLock.unlock();
        }
    }

    public void put(long userId, String profile) {
        writeLock.lock();
        try {
            cache.put(userId, profile);
        } finally {
            writeLock.unlock();
        }
    }
}
```

Read-Write Lock phù hợp với kịch bản đọc nhiều ghi ít, thao tác đọc đủ ngắn và cấu trúc dữ liệu không dễ bị phá hỏng khi truy cập đồng thời. Nó không phù hợp với mọi loại cache, và cũng không chắc chắn nhanh hơn Mutex Lock. Nếu thao tác ghi xảy ra thường xuyên, Thread đọc và Thread ghi sẽ liên tục chặn đường nhau, chi phí duy trì của Read-Write Lock ngược lại có thể triệt tiêu hết lợi ích.

Java còn cung cấp `StampedLock`, hỗ trợ khóa ghi, khóa đọc bi quan và đọc lạc quan (`optimistic read`). Đọc lạc quan không thực sự giữ khóa đọc truyền thống; nó sẽ lấy một `stamp` trước, sau khi đọc xong mới kiểm tra xem trong khoảng thời gian đó có thao tác ghi nào xảy ra hay không:

```java
class Point {
    private final StampedLock lock = new StampedLock();
    private double x;
    private double y;

    double distanceFromOrigin() {
        long stamp = lock.tryOptimisticRead();
        double currentX = x;
        double currentY = y;
        if (!lock.validate(stamp)) {
            stamp = lock.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                lock.unlockRead(stamp);
            }
        }
        return Math.hypot(currentX, currentY);
    }
}
```

Đọc lạc quan của `StampedLock` có ranh giới rõ ràng: dữ liệu đọc được có thể tạm thời không nhất quán, nên chỉ phù hợp với những pha đọc ngắn có thể đọc hết vào biến cục bộ và có phương án dự phòng đọc lại khi `validate` thất bại. Nó cũng khó thay thế trực tiếp cho `ReentrantReadWriteLock`, đặc biệt cần lưu ý là nó không hỗ trợ tính chất khả nhập lại (reentrant).

## Spin Lock: Không block, chờ tại chỗ một lát trước

Khi Thread không lấy được khóa, thường có hai cách chờ:

- Blocking (chặn): Treo Thread hiện tại lại, để hệ điều hành đánh thức sau.
- Spinning (tự xoay): Không treo Thread, chạy vòng lặp trên CPU để kiểm tra xem khóa đã khả dụng hay chưa.

Spin Lock phù hợp với kịch bản vùng găng cực kỳ ngắn. Ví dụ Thread đang giữ khóa sắp nhả khóa ngay lập tức: nếu Thread đang chờ bị block ngay thì chi phí treo và đánh thức Thread có thể còn cao hơn cả việc "xoay tại chỗ vài vòng" để đợi.

Vấn đề cũng nằm ngay ở đây: tự xoay phải trả giá bằng CPU vì nó sẽ chiếm dụng CPU liên tục. Nếu khóa rất lâu không được giải phóng, hoặc có quá nhiều Thread đang chờ, Spin Lock sẽ lãng phí thời gian CPU vào việc quay không tải.

Trong code Java có thể dùng CAS để viết một ví dụ Spin Lock rất nhỏ như sau:

```java
class SpinLock {
    private final AtomicReference<Thread> owner = new AtomicReference<>();

    public void lock() {
        Thread current = Thread.currentThread();
        while (!owner.compareAndSet(null, current)) {
            Thread.onSpinWait();
        }
    }

    public void unlock() {
        Thread current = Thread.currentThread();
        if (!owner.compareAndSet(current, null)) {
            throw new IllegalMonitorStateException();
        }
    }
}
```

Đoạn code này chỉ dùng để minh họa mối quan hệ giữa "tự xoay + CAS", không khuyến nghị mang thẳng vào làm khóa nghiệp vụ. Một chiếc khóa thực tế phải tính đến khả năng khả nhập lại (reentrancy), tính công bằng, ngắt (interruption), timeout, giải phóng khi có ngoại lệ, chỉ số giám sát, hàng đợi chờ, v.v. JDK đã đóng gói sẵn toàn bộ sự phức tạp này trong `synchronized`, `ReentrantLock`, các bộ đồng bộ AQS và các lớp Atomic.

## Vị trí của Pessimistic Lock, Optimistic Lock và CAS

Khóa bi quan (`Pessimistic Lock`) và khóa lạc quan (`Optimistic Lock`) mô tả hai tư duy kiểm soát đồng thời, chứ không tương ứng với một lớp Java cố định nào.

Pessimistic Lock giả định xung đột rất dễ xảy ra, nên khóa tài nguyên lại trước rồi mới thao tác. `synchronized`, `ReentrantLock`, câu lệnh `SELECT ... FOR UPDATE` của cơ sở dữ liệu đều là những ví dụ phổ biến.

Optimistic Lock giả định xung đột không thường xuyên, trước hết không chặn người khác, đến lúc commit thay đổi mới kiểm tra xem dữ liệu có bị sửa hay chưa. Trường `version` trong cơ sở dữ liệu và CAS trong các lớp Atomic của Java đều đi theo hướng này.

CAS (Compare-And-Swap, so sánh và hoán đổi) có thể hiểu là một cơ chế cập nhật nguyên tử được phần cứng hỗ trợ: chỉ khi giá trị trong bộ nhớ vẫn bằng giá trị cũ kỳ vọng thì mới đổi nó thành giá trị mới. Ngược lại, điều đó chứng tỏ đã có người sửa trước rồi, và Thread hiện tại có thể chọn thử lại, bỏ cuộc hoặc đi theo luồng xử lý hạ cấp.

CAS có ba vấn đề thường gặp:

- Thử lại khi thất bại sẽ tiêu tốn CPU, xung đột càng gay gắt thì mức tiêu tốn càng rõ rệt.
- Về mặt tự nhiên chỉ xử lý được một biến đơn lẻ; đảm bảo tính nhất quán cho nhiều biến đòi hỏi thiết kế bổ sung.
- Vấn đề ABA: giá trị đổi từ A thành B rồi lại đổi về A; chỉ nhìn giá trị sẽ tưởng rằng nó chưa từng thay đổi.

Vấn đề ABA có thể giải quyết bằng số phiên bản (`version`), dấu thời gian (`timestamp`) hoặc tham chiếu kèm cờ đánh dấu. Trong Java có các công cụ như `AtomicStampedReference` và `AtomicMarkableReference`, tuy nhiên trong code nghiệp vụ, cách phổ biến hơn là để chính mô hình dữ liệu mang sẵn số phiên bản.

Nếu triển khai sâu hơn phần này sẽ bị trùng lặp với các bài viết đã có. Muốn xem cách cài đặt, ví dụ số phiên bản, xử lý ABA và mã nguồn lớp Atomic, bạn có thể đọc tiếp:

- [Giải thích chi tiết về Optimistic Lock và Pessimistic Lock](./optimistic-lock-and-pessimistic-lock.md)
- [Giải thích chi tiết về CAS](./cas.md)
- [Tổng hợp về các lớp Atomic](./atomic-classes.md)

## Tầng dưới của synchronized: Monitor, Bytecode và ngữ nghĩa bộ nhớ

`synchronized` là cơ chế đồng bộ tích hợp sẵn trong ngôn ngữ Java, có thể gắn lên phương thức thực thể (instance method), phương thức tĩnh (static method), hoặc bọc quanh khối mã.

```java
class Account {
    private long balance;

    public synchronized void deposit(long amount) {
        balance += amount;
    }

    public long balance() {
        synchronized (this) {
            return balance;
        }
    }
}
```

Phương thức đồng bộ và khối mã đồng bộ thể hiện ở tầng bytecode không hoàn toàn giống nhau:

- Phương thức đồng bộ dựa vào cờ truy cập phương thức `ACC_SYNCHRONIZED`.
- Khối mã đồng bộ sẽ sinh ra các chỉ thị `monitorenter` và `monitorexit`.

Dù hình thức thể hiện ra sao, ngữ nghĩa vẫn là đi vào monitor và thoát khỏi monitor. Đặc tả ngôn ngữ Java cũng quy định quan hệ happens-before giữa việc giải phóng khóa và lần lấy khóa tiếp theo: những thao tác ghi của một Thread trước khi giải phóng một khóa sẽ khả kiến đối với Thread lấy được chính khóa đó sau này.

Đây cũng là điểm khác biệt giữa `synchronized` với khái niệm khóa thông thường chỉ làm nhiệm vụ loại trừ tương hỗ. Nó cung cấp đồng thời cả tính loại trừ tương hỗ lẫn tính khả kiến bộ nhớ (`Visibility`). Nếu chỉ bảo vệ vùng găng mà không thiết lập tính khả kiến, Thread khác vẫn có thể đọc phải giá trị cũ.

Ngoài ra, `synchronized` có tính khả nhập lại (`reentrant`). Khi một Thread đã giữ monitor của một đối tượng nào đó, nó có thể đi vào lại đoạn mã được bảo vệ bởi cùng chiếc khóa đó; JVM sẽ ghi nhận số lần vào lại (reentry count) và giảm dần qua từng tầng khi thoát ra.

```java
class ReentrantDemo {
    public synchronized void outer() {
        inner();
    }

    public synchronized void inner() {
        // Cùng một Thread có thể đi vào lại monitor của this
    }
}
```

## Tối ưu hóa Lock của synchronized: Đừng học vẹt "nâng cấp khóa" thành công thức cứng nhắc

Nhiều tài liệu giảng `synchronized` theo kiểu "không khóa -> Biased Lock -> Lightweight Lock -> Heavyweight Lock". Mạch tư duy này rất hữu ích để hiểu các tối ưu hóa thời kỳ đầu của HotSpot, nhưng không thể tách rời khỏi phiên bản JDK.

Từ JDK 6 trở đi, HotSpot đã tối ưu rất nhiều cho `synchronized`. Biased Lock hướng tới kịch bản "luôn chỉ có cùng một Thread đi vào cùng một khóa"; Lightweight Lock hướng tới kịch bản "tranh chấp không gay gắt, nhiều Thread đi vào lệch pha nhau"; còn Heavyweight Lock sẽ sử dụng `ObjectMonitor`, nơi các Thread tranh chấp có thể bị block và đánh thức.

Cần ghi nhớ riêng sự khác biệt giữa các phiên bản:

- JDK 6 đến JDK 14: Biased Lock là một trong các tối ưu hóa phổ biến của HotSpot.
- JDK 15: JEP 374 mặc định vô hiệu hóa Biased Lock và đánh dấu deprecated các tham số liên quan.
- JDK 18: Các tham số liên quan đến Biased Lock chuyển sang obsoleted; truyền vào sẽ bị bỏ qua kèm cảnh báo.
- JDK 21 đến JDK 23: Virtual Thread khi bị block bên trong `synchronized` có thể làm kẹt (pin) Platform Thread.
- JDK 24: JEP 491 cải thiện sự phối hợp giữa Virtual Thread và `synchronized`, giúp Virtual Thread bị block trên `synchronized` có thể giải phóng Platform Thread bên dưới, giảm vấn đề pinning.

Vì vậy, khi phỏng vấn hoặc viết bài, bạn có thể nói "HotSpot từng dùng Biased Lock, Lightweight Lock, Heavyweight Lock để giảm chi phí của `synchronized`", chứ đừng khẳng định Biased Lock vẫn là đường đi mặc định trên các bản JDK hiện đại.

Ở góc độ kỹ thuật thực tiễn, có một kết luận quan trọng hơn: câu nói ngày xưa "tránh dùng `synchronized` nếu có thể" không còn phù hợp với `synchronized` ngày nay nữa. Trong các kịch bản loại trừ tương hỗ thông thường, nó có cú pháp ngắn gọn, nhả khóa an toàn khi có ngoại lệ và tối ưu hóa JIT đã rất chín muồi. Chỉ khi bạn cần Fair Lock, lấy khóa có thể ngắt (interruptible), lấy khóa có timeout hoặc nhiều hàng đợi điều kiện (`Condition`), lúc đó chuyển sang `ReentrantLock` mới là lựa chọn tự nhiên.

## ReentrantLock, Condition và AQS kết nối với nhau như thế nào

`ReentrantLock` cung cấp khả năng kiểm soát chi tiết hơn `synchronized`:

- Có thể chọn Fair Lock hoặc Non-fair Lock.
- Có thể dùng `lockInterruptibly()` để phản hồi tín hiệu ngắt (`interrupt`).
- Có thể dùng `tryLock()` hoặc `tryLock(timeout, unit)` để tránh chờ vô thời hạn.
- Có thể tạo nhiều `Condition` để tách riêng các điều kiện chờ khác nhau.

Một cách viết điển hình như sau:

```java
class BoundedBuffer<E> {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    private final Queue<E> queue = new ArrayDeque<>();
    private final int capacity;

    BoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    public void put(E item) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.size() == capacity) {
                notFull.await();
            }
            queue.add(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public E take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            E item = queue.remove();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}
```

Vòng `while` ở đây cũng không được tùy tiện đổi thành `if`. Thread sau khi được đánh thức chỉ có nghĩa là "có cơ hội tranh chấp lại khóa và kiểm tra điều kiện", chứ không đồng nghĩa điều kiện chắc chắn đã thỏa mãn. Đánh thức giả (`spurious wakeup`), cạnh tranh giữa nhiều Thread đang chờ, hoặc điều kiện đã bị Thread khác tiêu thụ trước đó đều đòi hỏi phải kiểm tra lại sau khi tỉnh dậy.

Tầng dưới của `ReentrantLock` dựa vào AQS (`AbstractQueuedSynchronizer`). Có thể hiểu sơ bộ AQS là một framework đồng bộ hóa: dùng một biến `state` biểu diễn trạng thái đồng bộ, dùng hàng đợi FIFO để quản lý các Thread chưa giành được tài nguyên, kết hợp với CAS và `LockSupport.park/unpark` để hoàn thành việc xếp hàng, chặn và đánh thức.

Nhiều công cụ đồng thời được xây dựng trên nền AQS, chẳng hạn `ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock`. Nếu muốn bóc tách sâu hơn tuyến bài về hàng đợi, `state`, CAS và cơ chế block/đánh thức, bạn có thể xem tiếp [Giải thích chi tiết về AQS](./aqs.md) và [Tìm hiểu nguyên lý và ứng dụng của AQS qua hiện thực ReentrantLock](./reentrantlock.md).

## Nên lựa chọn Lock trong Java như thế nào?

Khi chọn khóa, đừng vội so sánh "cái nào nhanh nhất". Hiệu quả của khóa phụ thuộc vào độ dài vùng găng, cường độ tranh chấp, số lượng Thread và cách xử lý sau khi thất bại. Hãy trả lời rõ vài câu hỏi trước: Đoạn code này bảo vệ phần trạng thái dùng chung nào? Thời gian giữ khóa khoảng bao lâu? Khi không lấy được khóa có được phép chờ không? Sau khi chờ thất bại thì trả về, thử lại hay báo lỗi ngay?

Nếu chỉ bảo vệ một đoạn trạng thái nhỏ bên trong tiến trình JVM, như cập nhật vài trường, duy trì một `Map` trong bộ nhớ hay chuyển đổi trạng thái đối tượng, `synchronized` thường là đã đủ. Nó viết ngắn gọn, thoát khỏi khối code là tự động nhả khóa, lại tránh được rủi ro quên gọi `unlock()` bằng tay. Khi nào code cần lấy khóa có timeout, lấy khóa phản hồi ngắt, Fair Lock hoặc phải dùng nhiều `Condition` để quản lý các hàng đợi chờ khác nhau, chuyển sang `ReentrantLock` sẽ thuận tay hơn.

Khi đọc nhiều ghi ít, có thể xem xét `ReentrantReadWriteLock`. Trọng tâm ở đây là "ghi ít", chỉ có phương thức đọc thôi là chưa đủ. Nếu thao tác ghi diễn ra thường xuyên, khóa đọc và khóa ghi sẽ liên tục cản đường nhau, việc duy trì trạng thái đọc-ghi cũng có chi phí riêng, rốt cuộc chưa chắc đã lời hơn một chiếc Mutex Lock. Đọc lạc quan của `StampedLock` còn kén kịch bản hơn nữa: logic đọc phải ngắn, lỡ đọc phải trạng thái trung gian cũng không gây hậu quả lớn, và bắt buộc phải chấp nhận việc đọc lại khi `validate` thất bại.

Nếu chỉ cập nhật một bộ đếm, cờ trạng thái hoặc một tham chiếu, hãy ưu tiên xem xét các lớp Atomic, `LongAdder`, `LongAccumulator`. Chúng phù hợp cho các cập nhật nguyên tử rất ngắn, không phù hợp để nhồi cả một quy trình nghiệp vụ dài vào vòng lặp thử lại CAS. Quy trình nghiệp vụ càng dài, việc thử lại khi thất bại càng dễ đốt CPU vào vòng lặp vô ích và càng khó xử lý các tác dụng phụ.

Nếu bài toán đã vượt ra ngoài ranh giới JVM, ví dụ nhiều instance ứng dụng cùng lúc sửa một dòng bản ghi trong cơ sở dữ liệu, thì các loại khóa trong Java không quản lý nổi nữa. Khi xung đột ít xảy ra, có thể dùng cột `version` để làm khóa lạc quan; khi xung đột thường xuyên và bắt buộc sửa đổi nhất quán mạnh, thường phải quay về khóa dòng của cơ sở dữ liệu, `SELECT ... FOR UPDATE`, ràng buộc duy nhất (`unique constraint`) và các cơ chế tương tự của DB. Đi xa hơn nữa tới mức loại trừ tương hỗ liên dịch vụ (cross-service) thì cần các hệ thống bên ngoài như Redis, ZooKeeper hoặc cơ sở dữ liệu đảm nhiệm, chứ không thể trông cậy vào `synchronized` hay `ReentrantLock`.

Độ mịn của khóa cũng đừng mù quáng chạy theo "càng nhỏ càng tốt". Một chiếc khóa lớn dễ đảm bảo tính đúng đắn, nhưng thông lượng có thể bị ảnh hưởng; tách thành nhiều khóa nhỏ sẽ giảm tranh chấp, nhưng thứ tự khóa, nguy cơ `Deadlock` và chi phí điều tra lỗi đều tăng lên. Trong nhiều trường hợp, dùng trước một chiếc khóa rõ ràng để giữ chắc các bất biến, rồi mới dựa theo kết quả kiểm thử tải (`stress test`) để tách khóa sẽ vững vàng hơn nhiều so với việc ngay từ đầu đã thiết kế cả đống khóa mịn.

## Các bẫy thường gặp

**Đối tượng khóa không ổn định.**

Một số đoạn code nhìn có vẻ đã gắn khóa, nhưng thực tế có thể đã khóa vào các đối tượng khác nhau. Nguyên nhân phổ biến là đối tượng khóa bị thay đổi, chẳng hạn kết quả nối chuỗi, đối tượng đóng gói kiểu nguyên thủy (boxed object), hoặc trường có thể gán lại giá trị. Thread A vào khóa đối tượng cũ, Thread B vào khóa đối tượng mới, hai bên không ảnh hưởng gì nhau và vùng găng bị tách rời.

```java
private Object lock = new Object();

public void update() {
    synchronized (lock) {
        lock = new Object(); // Các Thread đến sau có thể khóa nhầm sang một đối tượng khóa khác
    }
}
```

Nếu cần một đối tượng khóa riêng, thông thường hãy khai báo nó là `private final` và tuyệt đối không để lộ ra cho mã nguồn bên ngoài.

**Khóa lên đối tượng lộ ra bên ngoài.**

`synchronized (this)` và `synchronized (SomeClass.class)` đôi khi không có vấn đề gì, nhưng chúng cũng có thể bị mã nguồn bên ngoài lấy ra để gắn khóa, khiến bạn không kiểm soát được phạm vi tranh chấp khóa. Mã nguồn thư viện đặc biệt phải thận trọng và thường khuyến nghị dùng đối tượng khóa `private final`.

```java
private final Object lock = new Object();
```

**Làm các thao tác chậm trong thời gian giữ khóa.**

Truy cập cơ sở dữ liệu, gọi RPC hay ghi file lớn trong khi đang giữ khóa đều kéo dài thời gian chiếm giữ khóa. Khóa bị giữ càng lâu thì số Thread phải chờ càng nhiều, kéo theo nguy cơ timeout, cạn kiệt Thread Pool và `Deadlock` đều tăng cao.

**Thứ tự lấy khóa không nhất quán.**

Hai Thread lần lượt lấy khóa theo thứ tự `A -> B` và `B -> A` rất dễ tạo thành `Deadlock`. Khi sử dụng nhiều khóa cùng lúc, phải sắp xếp một thứ tự ổn định toàn cục cho các tài nguyên. Để tìm hiểu đầy đủ về `Deadlock`, bạn có thể xem [Giải thích chi tiết về Deadlock](../../cs-basics/operating-system/dead-lock.md).

**Đánh đồng lớp thread-safe với thao tác tổ hợp.**

Các lời gọi `get`, `put` đơn lẻ của `ConcurrentHashMap` là thread-safe, nhưng "kiểm tra chưa tồn tại rồi mới chèn" là một thao tác tổ hợp (`compound operation`), cần dùng các phương thức nguyên tử như `computeIfAbsent` hoặc đồng bộ hóa bổ sung.

```java
// Không khuyến nghị: giữa containsKey và put có thể bị Thread khác chèn vào
if (!map.containsKey(key)) {
    map.put(key, createValue());
}

// Khuyến nghị: giao logic tổ hợp cho phương thức nguyên tử của ConcurrentHashMap
map.computeIfAbsent(key, ignored -> createValue());
```

**Chỉ nhìn khóa mà bỏ qua resource pool.**

Rất nhiều sự cố "đứng hình" trên môi trường production không liên quan gì đến `Deadlock` của khóa Java; các Thread có thể đều đang chờ kết nối cơ sở dữ liệu, kết nối HTTP, hàng đợi Thread Pool hoặc phản hồi từ dịch vụ bên ngoài. Trong Thread Dump nhìn thấy trạng thái `WAITING` chỉ cho biết Thread đang chờ; muốn kết luận là `Deadlock` thì còn phải tìm được một vòng chờ ổn định.

## Tổng kết

Lock là tên gọi chung cho một tập hợp các công cụ kiểm soát đồng thời, khái niệm này khá rộng.

Mutex Lock và Read-Write Lock trả lời câu hỏi "ai được vào vùng găng"; Spin Lock và Blocking Lock trả lời "không lấy được khóa thì chờ thế nào"; Pessimistic Lock và Optimistic Lock trả lời "xử lý trước và sau khi xung đột xảy ra như thế nào"; CAS và các lớp Atomic giải quyết cập nhật nguyên tử cho một biến đơn lẻ; còn `synchronized`, `ReentrantLock`, `StampedLock`, AQS chính là cách Java đưa những tư tưởng đó vào mã nguồn.

Khi thực sự viết code, trước tiên hãy xác định rõ trạng thái dùng chung và các bất biến, sau đó mới quyết định khóa bảo vệ cái gì, độ mịn khóa lớn bao nhiêu, việc chờ có thể bị ngắt hay không, và thất bại có thể thử lại hay không. Công cụ chỉ là phương tiện; thứ thực sự cần bảo vệ là cùng một giao thức đồng bộ hóa: mọi đường dẫn truy cập vào trạng thái dùng chung đều bắt buộc phải tuân thủ nó.

## Tài liệu tham khảo

- [The Java Language Specification, Chapter 17. Threads and Locks](https://docs.oracle.com/javase/specs/jls/se24/html/jls-17.html)
- [The Java Virtual Machine Specification, monitorenter](https://docs.oracle.com/javase/specs/jvms/se24/html/jvms-6.html#jvms-6.5.monitorenter)
- [Oracle Java API: Lock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/Lock.html)
- [Oracle Java API: ReentrantLock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/ReentrantLock.html)
- [Oracle Java API: StampedLock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/StampedLock.html)
- [OpenJDK JEP 374: Deprecate and Disable Biased Locking](https://openjdk.org/jeps/374)
- [OpenJDK JEP 491: Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)
- [OSTEP (bản tiếng Trung): Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/Chinese/28.pdf)
- [MIT 6.005: Locks and Synchronization](http://web.mit.edu/6.005/www/fa15/classes/23-locks/)
