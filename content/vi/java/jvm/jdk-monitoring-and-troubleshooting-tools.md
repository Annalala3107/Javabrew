---
title: Tổng hợp công cụ giám sát và xử lý sự cố JDK
description: Tổng hợp các công cụ giám sát, xử lý lỗi JDK phổ biến kèm ví dụ sử dụng, hỗ trợ định vị và phân tích vấn đề JVM.
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/jdk-monitoring-and-troubleshooting-tools.md
head:
  - - meta
    - name: keywords
      content: Công cụ JDK,jps,jstat,jmap,jstack,jvisualvm,chẩn đoán,giám sát
---

## Các công cụ dòng lệnh của JDK

Các lệnh này nằm trong thư mục `bin` bên trong thư mục cài đặt JDK:

- **`jps`** (JVM Process Status): Tương tự lệnh `ps` của UNIX. Dùng để xem thông tin như lớp khởi chạy (startup class), tham số truyền vào và các tham số của Java Virtual Machine của tất cả tiến trình Java.
- **`jstat`** (JVM Statistics Monitoring Tool): Dùng để thu thập dữ liệu vận hành ở nhiều khía cạnh của máy ảo HotSpot.
- **`jinfo`** (Configuration Info for Java): Hiển thị thông tin cấu hình của máy ảo.
- **`jmap`** (Memory Map for Java): Tạo ảnh chụp kết xuất bộ nhớ Heap (Heap Dump).
- **`jhat`** (JVM Heap Dump Browser): Dùng để phân tích file heapdump; công cụ này khởi tạo một máy chủ HTTP/HTML để người dùng xem kết quả phân tích trên trình duyệt. JDK 9 đã loại bỏ `jhat`.
- **`jstack`** (Stack Trace for Java): Tạo ảnh chụp trạng thái Thread (thread snapshot) của máy ảo tại thời điểm hiện tại; thread snapshot là tập hợp ngăn xếp lời gọi phương thức mà mỗi Thread bên trong máy ảo đang thực thi.

### `jps`: Xem tất cả tiến trình Java

Lệnh `jps` (JVM Process Status) tương tự lệnh `ps` trên UNIX, dùng để liệt kê các tiến trình JVM mà người dùng hiện tại có quyền truy cập và công cụ này phát hiện được, nhưng không đảm bảo liệt kê toàn bộ tiến trình Java trong hệ thống.

`jps`: Hiển thị tên lớp chính (main class) đang thực thi trên máy ảo và ID duy nhất của máy ảo cục bộ (`LVMID` - Local Virtual Machine Identifier) của các tiến trình đó. `jps -q`: Chỉ xuất ra ID duy nhất của máy ảo cục bộ tương ứng với tiến trình.

```powershell
C:\Users\SnailClimb>jps
7360 NettyClient2
17396
7972 Launcher
16504 Jps
17340 NettyServer
```

`jps -l`: Xuất ra tên đầy đủ của lớp chính; nếu tiến trình đang chạy file JAR thì xuất ra đường dẫn file JAR.

```powershell
C:\Users\SnailClimb>jps -l
7360 firstNettyDemo.NettyClient2
17396
7972 org.jetbrains.jps.cmdline.Launcher
16492 sun.tools.jps.Jps
17340 firstNettyDemo.NettyServer
```

`jps -v`: Xuất ra các tham số JVM được truyền khi tiến trình máy ảo khởi động.

`jps -m`: Xuất ra các tham số được truyền vào hàm `main()` của tiến trình Java.

### `jstat`: Giám sát nhiều loại thông tin trạng thái vận hành của máy ảo

`jstat` (JVM Statistics Monitoring Tool) là công cụ dòng lệnh dùng để giám sát các thông tin trạng thái vận hành khác nhau của máy ảo. Công cụ này có thể hiển thị dữ liệu vận hành như thông tin class, bộ nhớ, Garbage Collection, biên dịch JIT... của tiến trình máy ảo cục bộ hoặc từ xa (cần máy chủ từ xa hỗ trợ RMI). Trên các máy chủ không có giao diện đồ họa (GUI), chỉ cung cấp màn hình dòng lệnh thuần văn bản, đây là công cụ ưu tiên hàng đầu để định vị vấn đề hiệu năng máy ảo trong lúc chạy.

**Cú pháp sử dụng lệnh `jstat`:**

```powershell
jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
```

Ví dụ: `jstat -gc -h3 31736 1000 10` có nghĩa là phân tích tình trạng GC của tiến trình có ID `31736`, cứ mỗi `1000ms` in ra một bản ghi, in `10` lần thì dừng, và sau mỗi `3` dòng lại in tiêu đề các chỉ số.

**Các `option` phổ biến như sau:**

- `jstat -class vmid`: Hiển thị thông tin liên quan đến `ClassLoader`.
- `jstat -compiler vmid`: Hiển thị thông tin liên quan đến biên dịch JIT.
- `jstat -gc vmid`: Hiển thị thông tin Heap liên quan đến GC.
- `jstat -gccapacity vmid`: Hiển thị dung lượng và mức sử dụng của từng thế hệ (generation).
- `jstat -gcnew vmid`: Hiển thị thông tin Young Generation (thế hệ trẻ).
- `jstat -gcnewcapacity vmid`: Hiển thị kích thước và mức sử dụng của Young Generation.
- `jstat -gcold vmid`: Hiển thị thống kê hành vi của Old Generation (thế hệ già); trên các JDK hiện đại, đầu ra còn bao gồm thống kê của `Metaspace` và `Compressed Class Space`.
- `jstat -gcoldcapacity vmid`: Hiển thị kích thước của Old Generation.
- `jstat -gcpermcapacity vmid`: Hiển thị kích thước Permanent Generation; từ JDK 8 trở đi tùy chọn này không còn tồn tại; trên các JDK hiện đại có thể dùng `-gcmetacapacity` để xem thống kê dung lượng `Metaspace`.
- `jstat -gcutil vmid`: Hiển thị thông tin thu gom rác (Garbage Collection).

Ngoài ra, thêm tham số `-t` sẽ bổ sung một cột `Timestamp` vào kết quả đầu ra, hiển thị thời gian đã chạy của chương trình.

### `jinfo`: Xem và điều chỉnh trực tiếp các tham số của máy ảo theo thời gian thực

`jinfo vmid`: Xuất ra toàn bộ tham số và thuộc tính hệ thống (system properties) của tiến trình JVM hiện tại (phần thứ nhất là thuộc tính hệ thống, phần thứ hai là các tham số JVM).

`jinfo -flag name vmid`: Xuất ra giá trị cụ thể của tham số có tên tương ứng, ví dụ xuất ra `MaxHeapSize`. Ví dụ xem và điều chỉnh động `PrintGC` bên dưới áp dụng cho JDK 8; từ JDK 9 trở về sau, log GC nên sử dụng tham số log hợp nhất `-Xlog` và có thể điều chỉnh lúc chạy thông qua `jcmd VM.log`.

```powershell
C:\Users\SnailClimb>jinfo  -flag MaxHeapSize 17340
-XX:MaxHeapSize=2124414976
C:\Users\SnailClimb>jinfo  -flag PrintGC 17340
-XX:-PrintGC
```

`jinfo` có thể thay đổi động một số tham số JVM được đánh dấu là có thể quản lý (manageable) mà không cần khởi động lại máy ảo; không phải mọi tham số đều hỗ trợ thay đổi lúc chạy. Hãy xem ví dụ JDK 8 bên dưới:

`jinfo -flag [+|-]name vmid` bật hoặc tắt tham số có tên tương ứng.

```powershell
C:\Users\SnailClimb>jinfo  -flag  PrintGC 17340
-XX:-PrintGC

C:\Users\SnailClimb>jinfo  -flag  +PrintGC 17340

C:\Users\SnailClimb>jinfo  -flag  PrintGC 17340
-XX:+PrintGC
```

### `jmap`: Tạo ảnh chụp kết xuất bộ nhớ Heap (Heap Dump)

Lệnh `jmap` (Memory Map for Java) được dùng để tạo ảnh chụp kết xuất bộ nhớ Heap. Nếu không dùng lệnh `jmap`, để thu được Java Heap Dump, bạn có thể dùng tham số `-XX:+HeapDumpOnOutOfMemoryError` để máy ảo tự động tạo file dump sau khi xảy ra lỗi `OOM`. Trên Linux/macOS, `kill -3 <pid>` gửi tín hiệu `SIGQUIT`, HotSpot sẽ in ngăn xếp Thread Java ra luồng lỗi chuẩn (`stderr`), kết quả thu được là Thread Dump chứ không phải Heap Dump.

Công dụng của `jmap` không chỉ dừng lại ở việc lấy file dump; nó còn có thể truy vấn hàng đợi finalizer, Java Heap và thông tin `ClassLoader`..., các lệnh con cụ thể thay đổi theo từng phiên bản JDK. Permanent Generation chỉ tồn tại ở các bản HotSpot cũ, đầu ra tương ứng ở các JDK hiện đại là thống kê `Metaspace` hoặc `ClassLoader`. Giống như `jinfo`, một số tính năng của `jmap` cũng chịu giới hạn bởi hệ điều hành và quyền attach vào tiến trình đích.

Ví dụ: Xuất ảnh chụp Heap của ứng dụng được chỉ định ra Desktop. Sau đó, có thể phân tích file Heap này bằng các công cụ như `jhat`, VisualVM...

```powershell
C:\Users\SnailClimb>jmap -dump:format=b,file=C:\Users\SnailClimb\Desktop\heap.hprof 17340
Dumping heap to C:\Users\SnailClimb\Desktop\heap.hprof ...
Heap dump file created
```

### **`jhat`**: Phân tích file `heapdump`

**`jhat`** dùng để phân tích file `heapdump`; công cụ này sẽ dựng một máy chủ HTTP/HTML để người dùng có thể xem kết quả phân tích trên trình duyệt.

```powershell
C:\Users\SnailClimb>jhat C:\Users\SnailClimb\Desktop\heap.hprof
Reading from C:\Users\SnailClimb\Desktop\heap.hprof...
Dump file created Sat May 04 12:30:31 CST 2019
Snapshot read, resolving...
Resolving 131419 objects...
Chasing references, expect 26 dots..........................
Eliminating duplicate references..........................
Snapshot resolved.
Started HTTP server on port 7000
Server is ready.
```

Truy cập <http://localhost:7000/>.

Lưu ý ⚠️: JDK 9 đã loại bỏ `jhat` ([JEP 241: Remove the jhat Tool](https://openjdk.org/jeps/241)). Bạn có thể sử dụng các công cụ thay thế là Eclipse Memory Analyzer Tool (MAT) và VisualVM, đây cũng là những công cụ được khuyến nghị chính thức.

### **`jstack`**: Tạo ảnh chụp Thread của máy ảo tại thời điểm hiện tại

Lệnh `jstack` (Stack Trace for Java) được dùng để tạo ảnh chụp Thread (thread snapshot) của máy ảo tại thời điểm hiện tại. Thread snapshot là tập hợp ngăn xếp lời gọi phương thức mà mỗi Thread bên trong máy ảo đang thực thi.

Mục đích chính của việc tạo thread snapshot là định vị nguyên nhân khiến Thread bị dừng/treo trong thời gian dài, chẳng hạn như `Deadlock` giữa các Thread, vòng lặp vô hạn, hoặc chờ đợi lâu do gọi tài nguyên bên ngoài. Khi Thread bị treo, thông qua `jstack` để xem call stack của từng Thread, bạn có thể biết được Thread không phản hồi đang làm gì ở nền hoặc đang chờ tài nguyên nào.

**Đoạn mã dưới đây dùng `sleep` để tăng xác suất hai Thread giữ khóa lẫn nhau, nhằm minh họa cách kiểm tra `Deadlock` bằng `jstack`. Việc lập lịch Thread không mang tính tất định nên không thể đảm bảo chắc chắn 100% lần chạy nào cũng tái hiện được `Deadlock`.**

```java
public class DeadLockDemo {
    private static Object resource1 = new Object();// tài nguyên 1
    private static Object resource2 = new Object();// tài nguyên 2

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
        }, "Thread 1").start();

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
        }, "Thread 2").start();
    }
}
```

Output

```plain
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

Thread A thông qua `synchronized (resource1)` giành được monitor lock của `resource1`, sau đó thông qua `Thread.sleep(1000);` cho Thread A ngủ 1 giây để Thread B được thực thi rồi giành lấy monitor lock của `resource2`. Sau khi Thread A và Thread B ngủ xong, cả hai đều bắt đầu cố gắng yêu cầu lấy tài nguyên của đối phương, dẫn đến hai Thread rơi vào trạng thái chờ đợi lẫn nhau, từ đó phát sinh `Deadlock`.

**Phân tích thông qua lệnh `jstack`:**

```powershell
C:\Users\SnailClimb>jps
13792 KotlinCompileDaemon
7360 NettyClient2
17396
7972 Launcher
8932 Launcher
9256 DeadLockDemo
10764 Jps
17340 NettyServer

C:\Users\SnailClimb>jstack 9256
```

Một phần nội dung đầu ra như sau:

```powershell
Found one Java-level deadlock:
=============================
"Thread 2":
  waiting to lock monitor 0x000000000333e668 (object 0x00000000d5efe1c0, a java.lang.Object),
  which is held by "Thread 1"
"Thread 1":
  waiting to lock monitor 0x000000000333be88 (object 0x00000000d5efe1d0, a java.lang.Object),
  which is held by "Thread 2"

Java stack information for the threads listed above:
===================================================
"Thread 2":
        at DeadLockDemo.lambda$main$1(DeadLockDemo.java:31)
        - waiting to lock <0x00000000d5efe1c0> (a java.lang.Object)
        - locked <0x00000000d5efe1d0> (a java.lang.Object)
        at DeadLockDemo$$Lambda$2/1078694789.run(Unknown Source)
        at java.lang.Thread.run(Thread.java:748)
"Thread 1":
        at DeadLockDemo.lambda$main$0(DeadLockDemo.java:16)
        - waiting to lock <0x00000000d5efe1d0> (a java.lang.Object)
        - locked <0x00000000d5efe1c0> (a java.lang.Object)
        at DeadLockDemo$$Lambda$1/1324119927.run(Unknown Source)
        at java.lang.Thread.run(Thread.java:748)

Found 1 deadlock.
```

Có thể thấy lệnh `jstack` đã tìm ra giúp chúng ta thông tin cụ thể của các Thread đang bị `Deadlock`.

## Công cụ phân tích trực quan của JDK

### JConsole: Bảng điều khiển giám sát và quản lý Java

JConsole là công cụ giám sát và quản lý trực quan dựa trên JMX. Công cụ này giúp giám sát tình trạng sử dụng bộ nhớ của tiến trình Java trên máy cục bộ và máy chủ từ xa một cách rất thuận tiện. Bạn có thể gõ lệnh `jconsole` trên console để khởi chạy hoặc tìm `jconsole.exe` trong thư mục `bin` dưới thư mục cài đặt JDK rồi nhấp đúp để mở.

#### Kết nối JConsole

![Kết nối JConsole](/media/jg/local/java/jvm/pictures/jdk/1JConsole-13ef79.png)

Nếu cần dùng JConsole để kết nối tới tiến trình từ xa, có thể thêm các tham số sau khi khởi động chương trình Java từ xa:

```properties
-Djava.rmi.server.hostname=<địa chỉ IP truy cập từ bên ngoài>
-Dcom.sun.management.jmxremote.port=60001   // cổng giám sát
-Dcom.sun.management.jmxremote.authenticate=false   // tắt xác thực
-Dcom.sun.management.jmxremote.ssl=false
```

Bộ ví dụ này tắt đồng thời cả xác thực và SSL, nên chỉ phù hợp với môi trường phát triển cục bộ được kiểm soát hoặc môi trường kiểm thử cô lập. Tài liệu chính thức của Oracle chỉ rõ rằng cấu hình này cho phép người dùng từ xa có thể truy cập vào cổng giám sát và điều khiển ứng dụng; trong môi trường production cần bật xác thực và truyền tải bảo mật, đồng thời giới hạn phạm vi phơi bày thông qua kiểm soát truy cập mạng.

Khi sử dụng JConsole để kết nối, địa chỉ tiến trình từ xa như sau:

```plain
<địa chỉ IP truy cập từ bên ngoài>:60001
```

#### Xem tổng quan chương trình Java

![Xem tổng quan chương trình Java](/media/jg/local/java/jvm/pictures/jdk/2Java-0f6650.png)

#### Giám sát bộ nhớ

JConsole có thể hiển thị thông tin chi tiết về bộ nhớ hiện tại. Không chỉ bao gồm thông tin tổng thể của vùng nhớ Heap / Non-Heap, mà còn có thể chi tiết tới tình trạng sử dụng của vùng Eden, vùng Survivor..., như minh họa trong hình dưới đây.

Khi nhấn nút "Perform GC (G)" (Thực thi GC) ở bên phải, công cụ sẽ gửi yêu cầu thu gom rác tường minh thông qua giao diện quản lý, ngữ nghĩa tương tự việc gọi `System.gc()`; JVM không đảm bảo chắc chắn sẽ thực thi thu gom, cũng không đảm bảo sẽ thực thi dưới một dạng `Full GC` cụ thể nào.

> - **Young Generation GC (Minor GC)**: Chỉ hoạt động Garbage Collection diễn ra ở Young Generation; `Minor GC` xảy ra rất thường xuyên và tốc độ thu gom thường khá nhanh.
> - **Old Generation GC (Major GC / Old GC)**: Chỉ việc thu gom nhắm vào riêng Old Generation. Các tài liệu khác nhau sử dụng thuật ngữ `Major GC` không hoàn toàn thống nhất, đôi khi còn dùng để chỉ thu gom toàn bộ Heap; vì vậy khi đọc log cần kết hợp với bộ thu gom cụ thể và sự kiện trong log để phán đoán.
> - **Full-Heap Collection (Full GC)**: Thu gom toàn bộ Java Heap, thường mang lại khoảng dừng (`pause`) khá dài; thời gian thực thi phụ thuộc vào kích thước Heap, lượng đối tượng còn sống, bộ thu gom và các yếu tố khác, không thể dùng một bội số cố định để so sánh với `Minor GC`.

![Giám sát bộ nhớ](/media/jg/local/java/jvm/pictures/jdk/3-17aa2e.png)

#### Giám sát Thread

Tương tự lệnh `jstack` mà chúng ta đã nói ở phần trước, nhưng công cụ này ở dạng trực quan.

Ở phía dưới cùng có nút "Detect Deadlock (D)" (Phát hiện Deadlock); nhấn vào nút này công cụ sẽ tự động tìm giúp bạn các Thread đang xảy ra `Deadlock` cùng thông tin chi tiết của chúng.

![Giám sát Thread](/media/jg/local/java/jvm/pictures/jdk/4-f665b5.png)

### VisualVM: Công cụ xử lý sự cố đa năng (All-in-One)

VisualVM cung cấp thông tin chi tiết về các ứng dụng Java đang chạy trên Java Virtual Machine (JVM). Trong giao diện đồ họa người dùng của VisualVM, bạn có thể xem thông tin liên quan của nhiều ứng dụng Java một cách thuận tiện và nhanh chóng. Trang chủ VisualVM: <https://visualvm.github.io/>. Tài liệu tiếng Trung của VisualVM: <https://visualvm.github.io/documentation.html>.

Đoạn trích dưới đây được lấy từ cuốn *Hiểu sâu về Java Virtual Machine*.

> VisualVM (All-in-One Java Troubleshooting Tool) cung cấp các tính năng như giám sát vận hành, xử lý sự cố và phân tích hiệu năng (Profiling). Java VisualVM từng được phát hành kèm Oracle JDK 6–8, nhưng từ Oracle JDK 9 trở đi không còn được đóng gói sẵn trong JDK nữa; hiện nay thường cần tải xuống và cài đặt VisualVM riêng. Có nên bật Profiling trực tiếp trong môi trường production hay không cần đánh giá thận trọng dựa trên chế độ lấy mẫu (sampling) hay chèn mã (instrumentation) cũng như chi phí phụ trội thực tế.

VisualVM được phát triển trên nền tảng NetBeans, do đó ngay từ đầu nó đã có khả năng mở rộng bằng plugin. Thông qua hỗ trợ mở rộng plugin, VisualVM có thể làm được:

- Hiển thị tiến trình máy ảo cũng như thông tin cấu hình, môi trường của tiến trình (`jps`, `jinfo`).
- Giám sát thông tin CPU, GC, Heap, Method Area và Thread của ứng dụng (`jstat`, `jstack`).
- Dump và phân tích ảnh chụp kết xuất bộ nhớ Heap (`jmap`, `jhat`).
- Phân tích hiệu năng chạy chương trình ở mức phương thức, tìm ra các phương thức được gọi nhiều nhất và chạy lâu nhất.
- Ảnh chụp chương trình ngoại tuyến (offline snapshot): thu thập cấu hình runtime, thread dump, memory dump... của chương trình để tạo thành một bản snapshot, có thể gửi cho lập trình viên để báo cáo Bug.
- Khả năng mở rộng vô hạn từ các plugin khác……

Ở đây sẽ không đi sâu vào hướng dẫn sử dụng cụ thể VisualVM; nếu muốn tìm hiểu, bạn có thể xem:

- <https://visualvm.github.io/documentation.html>
- <https://www.ibm.com/developerworks/cn/java/j-lo-visualvm/index.html>

### MAT: Công cụ phân tích bộ nhớ (Memory Analyzer Tool)

MAT (Memory Analyzer Tool) là công cụ phân tích ngoại tuyến bộ nhớ Heap của JVM nhanh chóng, tiện lợi và giàu tính năng. Thông qua việc hiển thị trạng thái của ảnh chụp kết xuất bộ nhớ Heap lúc chạy (`Heap dump`) được ghi lại khi JVM gặp sự cố bất thường (khi chạy bình thường cũng có thể thực hiện phân tích Heap dump), MAT giúp định vị vấn đề `Memory Leak` hoặc tối ưu hóa các đoạn logic tiêu tốn nhiều bộ nhớ.

Khi gặp các vấn đề về `OOM` và GC, tôi thường ưu tiên sử dụng MAT để phân tích file dump; đây cũng là kịch bản được ứng dụng nhiều nhất của công cụ này.

Để tìm hiểu chi tiết về MAT, xin giới thiệu hai bài viết rất hay dưới đây:

- [Giải thích chuyên sâu và thực hành công cụ phân tích bộ nhớ JVM MAT — Phần nhập môn](https://juejin.cn/post/6908665391136899079)
- [Giải thích chuyên sâu và thực hành công cụ phân tích bộ nhớ JVM MAT — Phần nâng cao](https://juejin.cn/post/6911624328472133646)
