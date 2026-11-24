---
title: "Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 1)"
description: "Câu hỏi phỏng vấn nền tảng về lập trình đồng thời trong Java: giải thích chuyên sâu sự khác biệt giữa Thread và Process, các cách tạo đa luồng, trạng thái vòng đời của Thread, bốn điều kiện gây Deadlock và cách phòng tránh, khái niệm Concurrency và Parallelism cùng các kiến thức cốt lõi khác."
category: Java
tag:
  - Java Concurrency
head:
  - - meta
    - name: keywords
      content: Java Concurrency,Thread và Process,Đa luồng,Deadlock,Vòng đời Thread,Lập trình đồng thời,Câu hỏi phỏng vấn Java,Cách tạo Thread
lang: vi
sourceRef: zh-ref/java/concurrent/java-concurrent-questions-01.md
---

## Thread

### ⭐️ Thread và Process là gì?

#### Process là gì?

Process (tiến trình) là một lần thực thi của chương trình và là đơn vị cơ bản để hệ thống vận hành một chương trình, vì vậy Process mang tính động. Việc hệ thống chạy một chương trình chính là quá trình một Process được khởi tạo, thực thi cho đến khi kết thúc.

Trong Java, khi khởi chạy hàm `main`, thực chất chúng ta đang khởi động một Process JVM, và Thread thực thi hàm `main` chính là một luồng bên trong Process đó, còn được gọi là main thread (luồng chính).

Như hình bên dưới, khi mở Task Manager trên Windows, chúng ta có thể thấy rõ các Process đang chạy trên Windows (việc thực thi các tệp `.exe`).

![Ví dụ về Process trên Windows](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/Windows-4993191f.png)

#### Thread là gì?

Thread (luồng) tương tự như Process, nhưng là đơn vị thực thi nhỏ hơn Process. Một Process trong quá trình thực thi có thể tạo ra nhiều Thread. Điểm khác với Process là các Thread cùng loại trong một Process dùng chung tài nguyên **Heap** và **Method Area** của Process đó, nhưng mỗi Thread lại có **Program Counter Register** (bộ đếm chương trình), **JVM Stack** và **Native Method Stack** riêng. Do đó, gánh nặng của hệ thống khi tạo mới một Thread hoặc chuyển đổi giữa các Thread nhỏ hơn rất nhiều so với Process; cũng chính vì vậy, Thread còn được gọi là lightweight process (tiến trình nhẹ).

Chương trình Java về bản chất đã là chương trình đa luồng. Chúng ta có thể thông qua JMX để xem một chương trình Java thông thường gồm những Thread nào, như đoạn mã dưới đây.

```java
public class MultiThread {
	public static void main(String[] args) {
		// Lấy MXBean quản lý Thread của Java
	ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
		// Không cần lấy thông tin monitor và synchronizer đồng bộ, chỉ lấy thông tin Thread và Thread Stack
		ThreadInfo[] threadInfos = threadMXBean.dumpAllThreads(false, false);
		// Duyệt thông tin Thread, chỉ in ra Thread ID và tên Thread
		for (ThreadInfo threadInfo : threadInfos) {
			System.out.println("[" + threadInfo.getThreadId() + "] " + threadInfo.getThreadName());
		}
	}
}
```

Kết quả đầu ra của chương trình trên như sau (nội dung đầu ra có thể khác nhau tùy môi trường; không cần quá bận tâm vai trò của từng Thread bên dưới, chỉ cần biết `main` thread thực thi phương thức `main` là đủ):

```plain
[5] Attach Listener // Thêm sự kiện
[4] Signal Dispatcher // Thread phân phối và xử lý tín hiệu gửi tới JVM
[3] Finalizer // Thread gọi phương thức finalize của đối tượng
[2] Reference Handler // Thread dọn dẹp reference
[1] main // main thread, điểm vào chương trình
```

Từ kết quả trên có thể thấy: **một chương trình Java vận hành bằng cách chạy đồng thời `main` thread cùng nhiều Thread khác**.

### Java Thread và Thread của hệ điều hành khác nhau ở điểm nào?

Các phiên bản JDK đời đầu từng sử dụng Green Threads để cài đặt user-level thread (luồng mức người dùng). Về sau, các Thread truyền thống được tạo bằng `new Thread()` trong HotSpot sử dụng Platform Thread (luồng nền tảng); Platform Thread thường được ánh xạ 1:1 với OS thread (luồng của hệ điều hành) và do hệ điều hành chịu trách nhiệm lập lịch. Virtual Thread (luồng ảo) được chính thức giới thiệu từ Java 21 lại do JVM lập lịch, cho phép số lượng lớn Virtual Thread dùng chung một số lượng ít Platform Thread làm vật mang (carrier), vì vậy không thể đánh đồng mọi Java Thread với OS thread nữa.

Ở trên chúng ta có nhắc tới user thread (luồng người dùng) và kernel thread (luồng nhân). Vì nhiều bạn đọc chưa rõ sự khác biệt giữa hai khái niệm này, phần dưới sẽ giới thiệu ngắn gọn:

- User Thread: Là Thread do chương trình ở user space (không gian người dùng) quản lý và lập lịch, chạy trong user space (dành riêng cho ứng dụng sử dụng).
- Kernel Thread: Là Thread do kernel (nhân) của hệ điều hành quản lý và lập lịch, chạy trong kernel space (không gian nhân, chỉ chương trình nhân mới truy cập được).

Tóm tắt nhanh đặc điểm và sự khác biệt giữa user thread và kernel thread: User-level thread thường do runtime lập lịch ở user space nên chi phí tạo và chuyển đổi thấp; việc có tận dụng được đa nhân hay không phụ thuộc vào mô hình ánh xạ giữa user thread và kernel thread — mô hình many-to-one không thể tận dụng đa nhân song song, còn mô hình many-to-many thì có thể. Kernel thread do hệ điều hành lập lịch, chi phí tạo và chuyển đổi thường cao hơn, nhưng có thể tận dụng trực tiếp đa nhân CPU.

Tóm gọn mối quan hệ giữa Java Thread và OS thread trong một câu: **Platform Thread thường ánh xạ tới OS thread, còn Virtual Thread do JVM lập lịch và được gắn (mount) lên Platform Thread để thực thi.**

Mô hình luồng (threading model) là cách liên kết giữa user thread và kernel thread. Có ba mô hình luồng phổ biến:

1. One-to-One (một user thread tương ứng với một kernel thread)
2. Many-to-One (nhiều user thread ánh xạ tới một kernel thread)
3. Many-to-Many (nhiều user thread ánh xạ tới nhiều kernel thread)

![Ba mô hình luồng phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/three-types-of-thread-models-6adf6f60.png)

Trên các hệ điều hành phổ biến như Windows và Linux, Platform Thread của HotSpot thường áp dụng mô hình one-to-one, tức là một Platform Thread tương ứng với một OS thread. Virtual Thread không dùng ánh xạ 1:1 này, mà do JVM lập lịch để thực thi trên một tập Platform Thread.

### ⭐️ Trình bày ngắn gọn mối quan hệ, sự khác biệt và ưu nhược điểm giữa Thread và Process?

Hình dưới đây là các vùng nhớ của Java; thông qua hình này chúng ta sẽ nói về mối quan hệ giữa Thread và Process dưới góc độ JVM.

![Các vùng dữ liệu runtime của Java (từ JDK 1.8 trở đi)](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/java-runtime-data-areas-jdk1.8-6401fdf0.png)

Từ hình trên có thể thấy: một Process có thể chứa nhiều Thread; các Thread dùng chung tài nguyên **Heap** và **Method Area (Metaspace từ JDK 1.8 trở đi)** của Process, nhưng mỗi Thread có **Program Counter Register**, **JVM Stack** và **Native Method Stack** riêng.

**Tổng kết:** Thread là đơn vị thực thi nhỏ hơn được chia nhỏ từ Process. Điểm khác biệt lớn nhất giữa Thread và Process là về cơ bản các Process độc lập với nhau, còn các Thread thì chưa chắc, vì các Thread trong cùng một Process rất dễ tác động lẫn nhau. Thread có chi phí thực thi nhỏ, nhưng bất lợi cho việc quản lý và bảo vệ tài nguyên; còn Process thì ngược lại.

Dưới đây là phần mở rộng của kiến thức này!

Hãy cùng suy nghĩ một câu hỏi: Vì sao **Program Counter Register**, **JVM Stack** và **Native Method Stack** là riêng tư theo từng Thread, còn **Heap** và **Method Area** lại được dùng chung giữa các Thread?

#### Vì sao Program Counter Register lại riêng tư?

Program Counter Register chủ yếu có hai vai trò sau:

1. Bộ thông dịch bytecode thay đổi giá trị Program Counter Register để đọc tuần tự các lệnh, qua đó thực hiện điều khiển luồng chạy của mã nguồn như: thực thi tuần tự, rẽ nhánh, lặp và xử lý ngoại lệ.
2. Trong môi trường đa luồng, Program Counter Register dùng để ghi lại vị trí thực thi hiện tại của Thread, nhờ đó khi Thread được chuyển đổi quay lại, nó biết được lần trước mình đang chạy đến đâu.

Cần lưu ý rằng nếu đang thực thi phương thức `native`, giá trị mà Program Counter Register ghi nhận là địa chỉ `undefined`; chỉ khi thực thi mã Java thì Program Counter Register mới ghi nhận địa chỉ của lệnh tiếp theo.

Do đó, Program Counter Register mang tính riêng tư theo Thread chủ yếu để **khôi phục đúng vị trí thực thi sau khi chuyển đổi Thread**.

#### Vì sao JVM Stack và Native Method Stack lại riêng tư?

- **JVM Stack:** Trước khi mỗi phương thức Java được thực thi, một Stack Frame sẽ được tạo ra để lưu trữ Local Variable Table (bảng biến cục bộ), Operand Stack (ngăn xếp toán hạng), tham chiếu tới Constant Pool và các thông tin khác. Quá trình từ khi gọi phương thức cho tới khi thực thi xong chính là quá trình một Stack Frame được đẩy vào (push) và lấy ra (pop) khỏi JVM Stack.
- **Native Method Stack:** Đóng vai trò rất tương đồng với JVM Stack; điểm khác biệt là: **JVM Stack phục vụ việc máy ảo thực thi các phương thức Java (tức bytecode), còn Native Method Stack phục vụ các phương thức Native mà máy ảo sử dụng.** Trong HotSpot VM, vùng này được gộp chung với JVM Stack thành một.

Vì vậy, nhằm **đảm bảo các biến cục bộ bên trong một Thread không bị các Thread khác truy cập**, JVM Stack và Native Method Stack là riêng tư theo từng Thread.

#### Hiểu nhanh về Heap và Method Area trong một câu

Heap và Method Area là các vùng tài nguyên dùng chung cho tất cả các Thread. Trong đó, Heap là vùng nhớ lớn nhất trong một Process, chủ yếu dùng để lưu trữ các đối tượng mới được tạo (hầu hết mọi đối tượng đều được cấp phát bộ nhớ tại đây); còn Method Area chủ yếu dùng để lưu thông tin các lớp đã được nạp, hằng số, biến tĩnh, mã đã được trình biên dịch JIT biên dịch và các dữ liệu khác.

### Làm thế nào để tạo Thread?

Thông thường có rất nhiều cách tạo Thread, ví dụ: kế thừa lớp `Thread`, triển khai giao diện `Runnable`, triển khai giao diện `Callable`, sử dụng Thread Pool, sử dụng lớp `CompletableFuture`, v.v.

Tuy nhiên, các cách này thực chất chưa tự tạo ra Thread mới. Nói chính xác hơn, đây đều là các cách sử dụng đa luồng trong mã nguồn Java.

Xét một cách chặt chẽ, Java chỉ có duy nhất một cách tạo Thread, đó là thông qua `new Thread().start()`. Dù dùng cách nào đi nữa, cuối cùng đều phải phụ thuộc vào `new Thread().start()`.

### ⭐️ Trình bày vòng đời và các trạng thái của Thread?

Tại một thời điểm xác định trong vòng đời thực thi, một Thread Java chỉ có thể ở một trong 6 trạng thái khác nhau dưới đây:

- NEW: Trạng thái khởi tạo, Thread đã được tạo ra nhưng chưa được gọi `start()`.
- RUNNABLE: Trạng thái đang chạy/sẵn sàng chạy, Thread đã được gọi `start()` và đang chạy hoặc chờ được cấp phát để chạy.
- BLOCKED: Trạng thái bị chặn, đang cần chờ giải phóng khóa (lock).
- WAITING: Trạng thái chờ đợi, biểu thị Thread này cần đợi các Thread khác thực hiện một hành động cụ thể nào đó (thông báo hoặc ngắt).
- TIMED_WAITING: Trạng thái chờ có thời hạn, có thể tự quay lại sau một khoảng thời gian chỉ định chứ không chờ vô thời hạn như WAITING.
- TERMINATED: Trạng thái kết thúc, biểu thị Thread đã chạy xong.

Trong suốt vòng đời, Thread không cố định ở một trạng thái duy nhất mà chuyển đổi qua lại giữa các trạng thái theo tiến trình thực thi của mã nguồn.

Sơ đồ chuyển đổi trạng thái Thread trong Java (Nguồn ảnh: [Bắt lỗi | Ba điểm sai về trạng thái Thread trong cuốn *The Art of Java Concurrency Programming*](https://mp.weixin.qq.com/s/0UTyrJpRKaKhkhHcQtXAiA)):

![Sơ đồ chuyển đổi trạng thái Thread trong Java](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/640-8103777c.png)

Từ sơ đồ trên có thể thấy: sau khi được tạo, Thread sẽ ở trạng thái **NEW (mới tạo)**. Sau khi gọi phương thức `start()` để bắt đầu chạy, lúc này Thread ở trạng thái **READY (sẵn sàng)**. Khi Thread ở trạng thái READY nhận được lát cắt thời gian (timeslice) của CPU, nó chuyển sang trạng thái **RUNNING (đang chạy)**.

> Ở tầng hệ điều hành, Thread có trạng thái READY và RUNNING; còn ở tầng JVM, chỉ nhìn thấy trạng thái RUNNABLE (Nguồn ảnh: [HowToDoInJava](https://howtodoinJava.com/ "HowToDoInJava"): [Java Thread Life Cycle and Thread States](https://howtodoinJava.com/Java/multi-threading/Java-thread-life-cycle-and-thread-states/ "Java Thread Life Cycle and Thread States")), nên hệ thống Java thường gọi chung hai trạng thái này là **RUNNABLE**.
>
> **Vì sao JVM không phân biệt hai trạng thái này?** `Thread.State` của Java mô tả trạng thái Thread ở tầng JVM, không dùng để phản ánh toàn bộ trạng thái nội bộ của bộ lập lịch hệ điều hành. Chiến lược lập lịch cụ thể, độ dài timeslice và việc có dùng cơ chế luân phiên (round-robin) hay không đều do hệ điều hành và cấu hình của nó quyết định, không thể khái quát cứng nhắc là lập lịch luân phiên 10~20 ms.

![RUNNABLE-VS-RUNNING](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/RUNNABLE-VS-RUNNING-497c7636.png)

- Khi Thread thực thi phương thức `wait()`, Thread đi vào trạng thái **WAITING (chờ đợi)**. Thread ở trạng thái chờ cần dựa vào thông báo từ Thread khác mới có thể quay lại trạng thái hoạt động.
- Trạng thái **TIMED_WAITING (chờ có thời hạn)** tương đương với việc bổ sung thêm giới hạn thời gian chờ lên trạng thái WAITING; ví dụ thông qua `sleep(long millis)` hoặc `wait(long millis)` có thể đưa Thread vào trạng thái TIMED_WAITING. Khi hết thời gian chờ, Thread sẽ quay lại trạng thái RUNNABLE.
- Khi Thread đi vào phương thức/khối lệnh `synchronized`, hoặc sau khi gọi `wait()` (và được `notify()`) quay lại phương thức/khối lệnh `synchronized` nhưng lock đang bị Thread khác nắm giữ, lúc này Thread sẽ chuyển sang trạng thái **BLOCKED (bị chặn)**.
- Sau khi Thread thực thi xong phương thức `run()`, nó sẽ đi vào trạng thái **TERMINATED (kết thúc)**.

### Context Switch (chuyển ngữ cảnh) của Thread là gì?

Trong quá trình thực thi, Thread có các điều kiện chạy và trạng thái riêng của mình (còn gọi là context / ngữ cảnh), chẳng hạn như Program Counter Register, thông tin stack đã đề cập ở trên. Khi xảy ra các tình huống sau, Thread sẽ rời khỏi trạng thái chiếm dụng CPU:

- Chủ động nhường CPU, ví dụ gọi `sleep()`, `wait()`, v.v.
- Hết timeslice, vì hệ điều hành cần ngăn một Thread hoặc Process chiếm dụng CPU quá lâu khiến các Thread hoặc Process khác bị "đói" (starvation).
- Gọi ngắt hệ thống mang tính chặn (blocking system interrupt), ví dụ yêu cầu I/O khiến Thread bị chặn.
- Bị hủy hoặc kết thúc quá trình thực thi.

Trong đó, ba trường hợp đầu đều gây ra chuyển đổi Thread. Chuyển đổi Thread đồng nghĩa với việc phải lưu lại ngữ cảnh của Thread hiện tại để khôi phục trạng thái cho lần Thread đó được cấp CPU tiếp theo, đồng thời nạp ngữ cảnh của Thread tiếp theo sắp chiếm dụng CPU. Đây chính là cái gọi là **Context Switch (chuyển ngữ cảnh)**.

Context Switch là chức năng cơ bản của hệ điều hành hiện đại. Vì mỗi lần chuyển đổi đều phải lưu và khôi phục thông tin nên sẽ tiêu tốn tài nguyên hệ thống như CPU, bộ nhớ để xử lý, đồng nghĩa với việc có hao hụt hiệu năng nhất định; nếu chuyển đổi quá thường xuyên sẽ khiến hiệu suất tổng thể suy giảm.

### So sánh giữa phương thức Thread#sleep() và Object#wait()

**Điểm giống nhau:** Cả hai đều có thể tạm dừng quá trình thực thi của Thread.

**Điểm khác nhau:**

- **`sleep()` không giải phóng lock, còn `wait()` giải phóng lock.**
- `wait()` thường được dùng cho tương tác/giao tiếp giữa các Thread, còn `sleep()` thường được dùng để tạm dừng thực thi.
- Sau khi gọi `wait()`, Thread không tự động tỉnh lại mà cần Thread khác gọi `notify()` hoặc `notifyAll()` trên cùng một đối tượng. Sau khi `sleep()` chạy hết thời gian, Thread sẽ tự động tỉnh lại; hoặc cũng có thể dùng `wait(long timeout)` để Thread tự động tỉnh lại khi hết thời gian chờ.
- `sleep()` là phương thức `static native` của lớp `Thread`, còn `wait()` là phương thức `native` của lớp `Object`. Vì sao lại thiết kế như vậy? Câu hỏi ngay sau đây sẽ giải đáp.

### Vì sao phương thức wait() không được định nghĩa trong Thread?

`wait()` khiến Thread đang giữ object lock (khóa đối tượng) chuyển sang trạng thái chờ và tự động giải phóng object lock mà Thread hiện tại đang nắm giữ. Mỗi đối tượng (`Object`) đều sở hữu một object lock; đã là giải phóng object lock mà Thread hiện tại đang giữ và đưa Thread vào trạng thái WAITING thì đương nhiên phải thao tác trên đối tượng tương ứng (`Object`) chứ không phải trên Thread hiện tại (`Thread`).

Câu hỏi tương tự: **Vì sao phương thức `sleep()` được định nghĩa trong `Thread`?**

Vì `sleep()` chỉ làm Thread hiện tại tạm dừng thực thi, không liên quan đến lớp đối tượng nào và cũng không cần lấy object lock.

### Có thể gọi trực tiếp phương thức run() của lớp Thread không?

Đây là một câu hỏi phỏng vấn đa luồng Java cực kỳ kinh điển khác và rất hay được hỏi khi phỏng vấn. Rất đơn giản nhưng nhiều người vẫn trả lời chưa chuẩn!

Khi `new` một `Thread`, Thread bước vào trạng thái NEW. Gọi phương thức `start()` sẽ khởi chạy một Thread và đưa Thread vào trạng thái sẵn sàng (ready); khi được cấp phát timeslice thì có thể bắt đầu chạy. `start()` thực hiện các công tác chuẩn bị tương ứng cho Thread rồi tự động chạy nội dung trong `run()` — đây mới là thực thi đa luồng thực sự. Ngược lại, gọi trực tiếp `run()` sẽ coi `run()` như một phương thức bình thường chạy trên chính Thread đang gọi nó, nên đó không phải là thực thi đa luồng.

**Tổng kết: Chỉ khi gọi phương thức `start()` mới khởi chạy được Thread và đưa Thread vào trạng thái sẵn sàng; gọi trực tiếp phương thức `run()` sẽ không thực thi theo cơ chế đa luồng.**

## Đa luồng (Multithreading)

### Sự khác biệt giữa Concurrency (đồng thời) và Parallelism (song song)

- **Concurrency (đồng thời):** Hai hoặc nhiều tác vụ được thực thi trong cùng một **khoảng thời gian**.
- **Parallelism (song song):** Hai hoặc nhiều tác vụ được thực thi tại cùng một **thời điểm**.

Điểm mấu chốt nằm ở chỗ: chúng có thực thi **cùng một thời điểm** hay không.

### Sự khác biệt giữa Synchronous (đồng bộ) và Asynchronous (bất đồng bộ)

- **Synchronous (đồng bộ):** Sau khi phát đi một lời gọi, khi chưa nhận được kết quả thì lời gọi đó chưa thể trả về mà phải chờ đợi liên tục.
- **Asynchronous (bất đồng bộ):** Sau khi phát đi lời gọi, không cần chờ kết quả trả về mà lời gọi trả về ngay lập tức.

### ⭐️ Vì sao cần sử dụng đa luồng?

Trước tiên xét trên tổng thể:

- **Từ tầng thấp của máy tính:** Có thể ví Thread như lightweight process, là đơn vị thực thi nhỏ nhất của chương trình; chi phí chuyển đổi và lập lịch giữa các Thread nhỏ hơn rất nhiều so với Process. Ngoài ra, kỷ nguyên CPU đa nhân đồng nghĩa với việc nhiều Thread có thể chạy đồng thời, giúp giảm chi phí Context Switch của Thread.
- **Từ xu hướng phát triển Internet hiện đại:** Các hệ thống ngày nay dễ dàng đối mặt với mức đồng thời hàng triệu thậm chí hàng chục triệu yêu cầu. Lập trình đồng thời đa luồng chính là nền tảng để phát triển các hệ thống chịu tải đồng thời cao; tận dụng tốt cơ chế đa luồng có thể nâng cao đáng kể năng lực xử lý đồng thời và hiệu năng tổng thể của hệ thống.

Đi sâu hơn xuống tầng kiến trúc phần cứng máy tính:

- **Kỷ nguyên đơn nhân:** Trong thời kỳ CPU đơn nhân, đa luồng chủ yếu nhằm nâng cao hiệu quả tận dụng CPU và hệ thống I/O của một Process đơn lẻ. Giả sử chỉ có một Process Java đang chạy: khi gửi yêu cầu I/O, nếu Process Java chỉ có một Thread, Thread này bị I/O chặn thì toàn bộ Process bị chặn theo. Lúc đó chỉ có CPU hoặc thiết bị I/O hoạt động, nên có thể nói đơn giản hiệu suất tổng thể hệ thống chỉ đạt 50%. Khi sử dụng đa luồng, một Thread bị I/O chặn thì các Thread khác vẫn có thể tiếp tục dùng CPU, từ đó nâng cao hiệu suất sử dụng tài nguyên hệ thống tổng thể của Process Java.
- **Kỷ nguyên đa nhân:** Trong thời kỳ CPU đa nhân, đa luồng chủ yếu nhằm nâng cao khả năng tận dụng CPU đa nhân của Process. Ví dụ: giả sử chúng ta cần tính toán một tác vụ phức tạp; nếu chỉ dùng một Thread thì bất kể hệ thống có bao nhiêu nhân CPU, cũng chỉ có duy nhất một nhân CPU được sử dụng. Còn khi tạo nhiều Thread, các Thread này có thể được ánh xạ lên nhiều nhân CPU bên dưới để thực thi; trong trường hợp các Thread không có tranh chấp tài nguyên, hiệu suất thực thi sẽ tăng lên rõ rệt, xấp xỉ bằng `(thời gian chạy đơn nhân / số nhân CPU)`.

### ⭐️ CPU đơn nhân có hỗ trợ đa luồng Java không?

CPU đơn nhân có hỗ trợ đa luồng Java. Hệ điều hành phân bổ thời gian CPU cho các Thread khác nhau thông qua cơ chế time-slice round-robin (luân phiên chia sẻ lát cắt thời gian). Dù tại một thời điểm CPU đơn nhân chỉ thực thi được một tác vụ, nhưng bằng cách chuyển đổi nhanh giữa nhiều Thread, hệ thống tạo cảm giác cho người dùng như nhiều tác vụ đang chạy cùng lúc.

Nhân tiện ở đây cũng đề cập thêm cách lập lịch Thread mà Java sử dụng.

Hệ điều hành chủ yếu quản lý việc thực thi đa luồng thông qua hai chiến lược lập lịch Thread:

- **Preemptive Scheduling (lập lịch chiếm quyền):** Hệ điều hành quyết định khi nào tạm dừng Thread đang chạy và chuyển sang chạy Thread khác. Sự chuyển đổi này thường được kích hoạt bởi ngắt đồng hồ hệ thống (luân phiên timeslice) hoặc các sự kiện ưu tiên cao khác (như hoàn tất thao tác I/O). Cách này có chi phí Context Switch, nhưng tính công bằng và hiệu suất tận dụng CPU tốt, ít bị kẹt cứng.
- **Cooperative Scheduling (lập lịch hợp tác):** Sau khi Thread thực thi xong phần việc của mình, nó chủ động thông báo cho hệ thống chuyển sang Thread khác. Cách này giúp giảm hao phí hiệu năng do Context Switch, nhưng tính công bằng kém và dễ bị chặn.

Cách lập lịch Thread mà Java sử dụng là Preemptive Scheduling. Tức là bản thân JVM không trực tiếp đảm nhận việc lập lịch Thread mà ủy thác việc này cho hệ điều hành. Hệ điều hành thường dựa vào độ ưu tiên của Thread (thread priority) và timeslice để lập lịch thực thi; những Thread có độ ưu tiên cao thường có nhiều cơ hội nhận được timeslice CPU hơn.

### ⭐️ Chạy nhiều Thread trên CPU đơn nhân hiệu suất có chắc chắn cao hơn không?

Việc chạy đồng thời nhiều Thread trên CPU đơn nhân có mang lại hiệu suất cao hơn hay không phụ thuộc vào loại Thread và tính chất của tác vụ. Thông thường có hai loại Thread:

1. **CPU-intensive (nặng về CPU):** Các Thread nặng về CPU chủ yếu thực hiện tính toán và xử lý logic, cần chiếm dụng lượng lớn tài nguyên CPU.
2. **I/O-intensive (nặng về I/O):** Các Thread nặng về I/O chủ yếu thực hiện thao tác nhập/xuất như đọc ghi tệp, giao tiếp mạng, cần chờ phản hồi từ thiết bị I/O chứ không chiếm dụng nhiều tài nguyên CPU.

Trên CPU đơn nhân, tại cùng một thời điểm chỉ có duy nhất một Thread đang chạy, các Thread khác phải chờ được cấp timeslice CPU. Nếu Thread thuộc loại CPU-intensive, chạy đồng thời nhiều Thread sẽ dẫn đến chuyển đổi Thread liên tục, làm tăng chi phí hệ thống và giảm hiệu suất. Nếu Thread thuộc loại I/O-intensive, chạy đồng thời nhiều Thread có thể tận dụng khoảng thời gian CPU rảnh trong lúc chờ I/O, nhờ đó tăng hiệu suất.

Vì vậy, đối với CPU đơn nhân, nếu tác vụ là CPU-intensive thì mở nhiều Thread sẽ làm giảm hiệu suất; nếu tác vụ là I/O-intensive thì mở nhiều Thread sẽ giúp tăng hiệu suất. Tất nhiên, "nhiều" ở đây cũng cần có chừng mực, không thể vượt quá giới hạn chịu tải của hệ thống.

### Sử dụng đa luồng có thể gây ra những vấn đề gì?

Mục đích của lập trình đồng thời là nâng cao hiệu quả thực thi chương trình để tăng tốc độ chạy, tuy nhiên lập trình đồng thời không phải lúc nào cũng tăng tốc độ chương trình, và có thể gặp rất nhiều vấn đề như: Memory Leak (rò rỉ bộ nhớ), Deadlock, không an toàn luồng (thread-unsafe), v.v.

### Hiểu thế nào về Thread-Safe và Thread-Unsafe?

Thread-safe (an toàn luồng) và Thread-unsafe (không an toàn luồng) dùng để mô tả việc truy cập vào cùng một dữ liệu trong môi trường đa luồng có đảm bảo được tính đúng đắn và tính nhất quán của dữ liệu đó hay không.

- Thread-safe nghĩa là trong môi trường đa luồng, đối với cùng một dữ liệu, bất kể có bao nhiêu Thread truy cập đồng thời thì tính đúng đắn và tính nhất quán của dữ liệu đó vẫn được đảm bảo.
- Thread-unsafe nghĩa là trong môi trường đa luồng, khi nhiều Thread truy cập đồng thời vào cùng một dữ liệu có thể dẫn đến dữ liệu bị hỗn loạn, sai lệch hoặc mất mát.

## ⭐️ Deadlock

### Deadlock là gì?

Deadlock (bế tắc) của Thread mô tả tình huống nhiều Thread cùng lúc bị chặn, một hoặc tất cả các Thread đó đều đang chờ một tài nguyên nào đó được giải phóng. Vì các Thread bị chặn vô thời hạn nên chương trình không thể kết thúc bình thường.

Như hình dưới đây, Thread A giữ tài nguyên 2, Thread B giữ tài nguyên 1; cả hai đồng thời đều muốn xin tài nguyên của đối phương, nên hai Thread này sẽ chờ đợi lẫn nhau và rơi vào trạng thái Deadlock.

![Sơ đồ minh họa tình huống Deadlock: Thread A giữ resource1 và chờ resource2, Thread B giữ resource2 và chờ resource1, chuỗi chờ tạo thành vòng khép kín](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-scenario-13be7e13.png)

Dưới đây là một ví dụ minh họa Deadlock; đoạn mã mô phỏng tình huống Deadlock ở hình trên (mã nguồn trích từ cuốn *The Beauty of Concurrent Programming*):

```java
public class DeadLockDemo {
    private static Object resource1 = new Object();// Tài nguyên 1
    private static Object resource2 = new Object();// Tài nguyên 2

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "线程 1").start();

        new Thread(() -> {
            synchronized (resource2) {
                System.out.println(Thread.currentThread() + "get resource2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource1");
                synchronized (resource1) {
                    System.out.println(Thread.currentThread() + "get resource1");
                }
            }
        }, "线程 2").start();
    }
}
```

Output

```plain
Thread[线程 1,5,main]get resource1
Thread[线程 2,5,main]get resource2
Thread[线程 1,5,main]waiting get resource2
Thread[线程 2,5,main]waiting get resource1
```

Thread A lấy được Monitor Lock của `resource1` thông qua `synchronized (resource1)`, sau đó gọi `Thread.sleep(1000);` để Thread A ngủ 1 giây, nhằm để Thread B có cơ hội chạy và lấy được Monitor Lock của `resource2`. Khi Thread A và Thread B hết thời gian ngủ, cả hai đều cố gắng xin lấy tài nguyên của đối phương, khiến hai Thread rơi vào trạng thái chờ nhau vô hạn — và Deadlock đã xảy ra.

Ví dụ trên thỏa mãn đầy đủ bốn điều kiện cần để phát sinh Deadlock:

1. **Điều kiện loại trừ lẫn nhau (Mutual Exclusion):** Tài nguyên tại bất kỳ một thời điểm nào chỉ do một Thread chiếm giữ.
2. **Điều kiện giữ và chờ (Hold and Wait):** Khi một Thread bị chặn do yêu cầu thêm tài nguyên, nó vẫn giữ nguyên các tài nguyên đã có.
3. **Điều kiện không thu hồi (No Preemption):** Tài nguyên mà Thread đã lấy được trước khi dùng xong không thể bị Thread khác cưỡng chế tước đoạt, chỉ sau khi tự mình sử dụng xong mới giải phóng tài nguyên.
4. **Điều kiện chờ vòng tròn (Circular Wait):** Giữa một số Thread hình thành mối quan hệ chờ tài nguyên theo vòng tròn nối đầu nối đuôi.

### Làm thế nào để phát hiện Deadlock?

- Dùng `jstack <pid>` hoặc `jcmd <pid> Thread.print -l` để kiểm tra Thread Stack và thông tin khóa đồng thời. Nếu phát hiện Deadlock ở tầng Java, kết quả đầu ra sẽ liệt kê các Thread liên quan cùng với các lock mà chúng đang nắm giữ và đang chờ. `jmap` chủ yếu dùng để xem thông tin Heap hoặc xuất Heap Dump, không phải công cụ chẩn đoán Deadlock của Thread.
- Sử dụng các công cụ như VisualVM, JConsole để kiểm tra.

Ở đây lấy công cụ JConsole làm ví dụ minh họa.

Trước tiên, tìm đến thư mục `bin` của JDK, tìm `jconsole` rồi nhấp đúp để mở.

![jconsole](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jdk-home-bin-jconsole-2cf07489.png)

Đối với người dùng Mac, có thể dùng `/usr/libexec/java_home -V` để xem thư mục cài đặt JDK; sau khi tìm thấy thì mở bằng lệnh `open .` + đường dẫn thư mục. Ví dụ, đường dẫn của một JDK trên máy tôi là:

```bash
 open . /Users/guide/Library/Java/JavaVirtualMachines/corretto-1.8.0_252/Contents/Home
```

Sau khi mở `jconsole`, kết nối tới chương trình tương ứng, rồi vào giao diện Threads và chọn phát hiện Deadlock (Detect Deadlock)!

![jconsole phát hiện Deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-29a7f927.png)

![jconsole đã phát hiện Deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-done-3ff1d402.png)

### Làm thế nào để phòng ngừa và tránh Deadlock?

**Phòng ngừa Deadlock như thế nào?** Chỉ cần phá vỡ các điều kiện cần để phát sinh Deadlock:

1. **Phá vỡ điều kiện giữ và chờ:** Xin cấp phát toàn bộ các tài nguyên cùng một lúc.
2. **Phá vỡ điều kiện không thu hồi:** Khi Thread đang chiếm giữ một phần tài nguyên muốn xin thêm tài nguyên khác mà không xin được, có thể chủ động giải phóng các tài nguyên mình đang giữ.
3. **Phá vỡ điều kiện chờ vòng tròn:** Phòng ngừa bằng cách xin cấp phát tài nguyên theo thứ tự cố định. Xin tài nguyên theo một thứ tự nhất định và giải phóng theo thứ tự ngược lại — điều này phá vỡ điều kiện chờ vòng tròn.

**Tránh Deadlock như thế nào?**

Tránh Deadlock là trong quá trình phân bổ tài nguyên, dựa vào thuật toán (như thuật toán Banker) để tính toán và đánh giá việc cấp phát tài nguyên, giữ cho hệ thống đi vào trạng thái an toàn (Safe State).

> **Trạng thái an toàn (Safe State)** là trạng thái mà hệ thống có thể cấp phát lượng tài nguyên cần thiết cho từng Thread theo một thứ tự tiến triển nào đó (`P1, P2, P3, ..., Pn`), cho đến khi đáp ứng được nhu cầu tài nguyên tối đa của mỗi Thread, giúp tất cả các Thread đều hoàn thành suôn sẻ. Chuỗi `<P1, P2, P3, ..., Pn>` đó được gọi là chuỗi an toàn (Safe Sequence).

Nếu sửa mã nguồn của Thread 2 thành như bên dưới thì sẽ không xảy ra Deadlock nữa.

```java
new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "线程 2").start();
```

Kết quả đầu ra:

```plain
Thread[线程 1,5,main]get resource1
Thread[线程 1,5,main]waiting get resource2
Thread[线程 1,5,main]get resource2
Thread[线程 2,5,main]get resource1
Thread[线程 2,5,main]waiting get resource2
Thread[线程 2,5,main]get resource2

Process finished with exit code 0
```

Cùng phân tích vì sao đoạn mã trên tránh được Deadlock:

Thread 1 trước tiên lấy được Monitor Lock của `resource1`, lúc này Thread 2 sẽ không lấy được. Sau đó Thread 1 tiếp tục xin Monitor Lock của `resource2` và lấy được. Tiếp theo Thread 1 giải phóng việc chiếm giữ Monitor Lock trên `resource1` và `resource2`, khi đó Thread 2 mới lấy được để thực thi. Cách làm này đã phá vỡ điều kiện chờ vòng tròn, nhờ đó tránh được Deadlock.
