---
title: "Phân tích chi tiết về Deadlock: Bốn điều kiện tiên quyết, Điều tra Deadlock trong Java và Xử lý Deadlock trong Cơ sở dữ liệu"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về Deadlock, bắt đầu từ định nghĩa và 4 điều kiện Coffman, kết hợp với Java synchronized, ReentrantLock, ThreadMXBean, jstack, jcmd, JConsole cùng thực hành điều tra deadlock và retry giao dịch trong cơ sở dữ liệu PostgreSQL, MySQL."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Java Concurrency
  - Cơ sở dữ liệu
head:
  - - meta
    - name: keywords
      content: Deadlock,Bốn điều kiện tiên quyết của deadlock,Deadlock trong Java,Deadlock luồng,synchronized,ReentrantLock,ThreadMXBean,jstack,jcmd,JConsole,Deadlock cơ sở dữ liệu,Deadlock MySQL,Deadlock PostgreSQL,Câu hỏi phỏng vấn hệ điều hành,Câu hỏi phỏng vấn Java Concurrency
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/dead-lock.md
---

Thread A đã nắm giữ Tài nguyên 1, và Thread B cũng đã nắm giữ Tài nguyên 2. Tiếp theo, Thread A muốn chạy tiếp thì cần có thêm Tài nguyên 2; trong khi Thread B muốn chạy tiếp thì lại cần có Tài nguyên 1.

Cả hai thread đều không hề ném ra bất kỳ Exception nào, và CPU cũng không hề bị đẩy lên 100%. Triệu chứng quan sát được trên môi trường production có thể chỉ đơn giản là vài request mãi không thấy trả lời, và các worker thread trong thread pool dần dần bị chiếm giữ và đóng băng toàn bộ.

Những vấn đề dạng này phức tạp chính ở điểm đó: chương trình không hề "tính toán sai", mà nó bị kẹt cứng trên một chuỗi chờ đợi mà chính nó không thể tự tháo gỡ.

**Deadlock (khóa chết)** chính là tình huống này: một nhóm thread cùng chờ đợi tài nguyên do thread khác trong nhóm đang nắm giữ, các mối quan hệ chờ đợi đan chéo thành một vòng lặp khép kín, khiến không một thread nào tham gia vào đó có thể tự mình tiếp tục thực thi.

Nếu những thread này tình cờ đang gánh vác các luồng nghiệp vụ cốt lõi như tạo đơn hàng, thanh toán, hay trừ tồn kho, thứ mà bên ngoài nhìn thấy không chỉ đơn thuần là vài thread ở trạng thái `BLOCKED`, mà sẽ là hàng loạt API bị timeout, hàng đợi tích tụ nghẽn tắc, và thậm chí tiến trình ứng dụng không thể tắt một cách an toàn.

![Sơ đồ kịch bản deadlock: Thread A giữ resource1 và chờ resource2; Thread B giữ resource2 và chờ resource1, chuỗi chờ đợi tạo thành vòng khép kín](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-scenario-13be7e13.png)

Mở rộng góc nhìn, Deadlock không phải vấn đề độc quyền của Java Thread. Tiến trình hệ điều hành, giao dịch cơ sở dữ liệu (database transactions), hay các tác vụ phân tán, chỉ cần cùng nắm giữ tài nguyên rồi tiếp tục chờ đợi tài nguyên khác thì đều có thể bị kẹt trong cùng một hình thái như vậy. "Tài nguyên" ở đây cũng không chỉ là máy in hay ổ băng từ như trong giáo trình hệ điều hành kinh điển; nó có thể là Java Object Monitor, `ReentrantLock`, khóa hàng trong database (row-level lock), khóa phân tán (distributed lock), kết nối trong connection pool, worker thread trong thread pool, hay thậm chí là bộ đệm của pipe trong IPC.

Phần sau bài viết sẽ dùng mã nguồn Java để minh họa vì các ví dụ này rất dễ tái hiện. Nhưng bạn cần nhớ rằng, Deadlock là bài toán tương tranh mang tính phổ quát. Chỉ cần trong hệ thống đồng thời xuất hiện tài nguyên độc chiếm, nắm giữ và chờ đợi, tài nguyên không thể bị cướp quyền, và quan hệ chờ đợi tạo thành chu trình khép kín, thì thread, process hay transaction đều có thể rơi vào bẫy.

Nếu bạn muốn làm rõ ranh giới và trách nhiệm của các nguyên thủy đồng bộ như Mutex, Semaphore, Condition Variable, Futex trước, hãy xem bài viết: [Phân tích chi tiết về Cơ chế Khóa và Đồng bộ trong Hệ điều hành: Mutex, Semaphore, Condition Variable, Spinlock và Futex](./os-lock-and-sync.md). Chuyên đề Deadlock này sẽ tập trung vào cơ chế hình thành chu trình chờ đợi, cùng phương pháp điều tra và phục hồi sự cố trong thực tế.

Bài viết được triển khai theo đúng trình tự điều tra sự cố ngoài thực tế: trước tiên xem chu trình chờ đợi hình thành ra sao, sau đó tới 4 điều kiện tiên quyết (Coffman conditions), code Java tái hiện sự cố, đồ thị cấp phát tài nguyên, các chiến lược xử lý, và cuối cùng là kỹ năng phân tích Thread Dump và kiểm tra khóa cơ sở dữ liệu trên môi trường production.

## Deadlock hình thành như thế nào?

Hãy cùng xem kịch bản phổ biến nhất trong lập trình đồng thời. Giả sử hệ thống có 2 thread và 2 tài nguyên:

- Thread A lấy Tài nguyên 1 trước, sau đó mới yêu cầu Tài nguyên 2.
- Thread B lấy Tài nguyên 2 trước, sau đó mới yêu cầu Tài nguyên 1.

Nếu hai thread tình cờ chạy đan xen nhau, hệ thống sẽ rơi vào trạng thái:

- Thread A đang giữ Tài nguyên 1, chờ Tài nguyên 2.
- Thread B đang giữ Tài nguyên 2, chờ Tài nguyên 1.

Thread A muốn tiếp tục chạy thì bắt buộc phải chờ Thread B giải phóng Tài nguyên 2; ngược lại Thread B muốn chạy tiếp thì bắt buộc phải chờ Thread A giải phóng Tài nguyên 1. Cả hai bên đều chờ đối phương nhường bước trước, nhưng không bên nào có cơ hội thực thi tiếp đến đoạn nhả tài nguyên.

Do đó, Deadlock và việc "chờ đợi lâu" là hai khái niệm hoàn toàn khác nhau. Chặn thông thường vẫn có cơ hội tự phục hồi tự nhiên: thread khác nhả lock, transaction commit, hoặc I/O mạng trả về dữ liệu, thread bị chặn sẽ lập tức chạy tiếp. Trong khi đó, Deadlock chứa một chu trình khép kín mà mỗi bên tham gia đều phải đợi kẻ khác nhả tài nguyên trước.

Một điểm rất dễ gây nhầm lẫn khi điều tra sự cố: **Deadlock không nhất thiết đi kèm với CPU cao**. Trong phần lớn trường hợp, các thread bị kẹt chỉ lặng lẽ dừng ở trạng thái `BLOCKED` hoặc `WAITING`, và CPU thậm chí còn rất thấp. Khi API timeout, thread pool cạn kiệt, hoặc connection pool database bị chiếm dụng sạch, mức sử dụng CPU chỉ là một manh mối tham khảo, tuyệt đối không được coi là căn cứ duy nhất để kết luận.

## Bốn điều kiện tiên quyết của Deadlock

Giáo trình hệ điều hành kinh điển thường nhắc tới các điều kiện Coffman. Để Deadlock có thể xảy ra, cả 4 điều kiện sau bắt buộc phải **đồng thời thỏa mãn**:

| Điều kiện | Ý nghĩa | Đối chiếu với Java hoặc Database |
| --- | --- | --- |
| Loại trừ tương hỗ (Mutual Exclusion) | Một tài nguyên tại một thời điểm chỉ có thể do một thực thể chiếm giữ | Khóa `synchronized`, khóa hàng độc quyền (`FOR UPDATE`), khóa file độc quyền |
| Nắm giữ và chờ đợi (Hold and Wait) | Đã nắm giữ một phần tài nguyên, đồng thời tiếp tục chờ đợi thêm tài nguyên khác | Thread đang giữ `resource1` tiếp tục xin cấp phát `resource2` |
| Không thể cướp quyền (No Preemption) | Tài nguyên không thể bị bên ngoài cưỡng chế tước đoạt, chỉ có thể do chính bên nắm giữ tự nguyện giải phóng | Khóa nội tại của Java (`synchronized`) không thể bị một thread khác ép nhả ra |
| Chờ đợi vòng tròn (Circular Wait) | Mối quan hệ chờ đợi tạo thành một chu trình khép kín | Thread 1 chờ Thread 2, Thread 2 lại chờ Thread 1 |

![Sơ đồ 4 điều kiện tiên quyết của deadlock: Loại trừ tương hỗ, nắm giữ và chờ đợi, không cướp quyền và chờ đợi vòng tròn đồng thời thỏa mãn mới tạo thành deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-four-conditions-79f8adec.png)

Đừng xem bảng này như danh sách "thỏa mãn một điều kiện là bị deadlock". Bản chất thực sự của nó là: cả bốn điều kiện phải đồng thời xuất hiện thì Deadlock mới có đủ cơ sở để phát sinh; chỉ cần loại bỏ được bất kỳ một điều kiện nào trong số đó, chu trình chờ đợi sẽ không thể khép kín.

Khi viết code nghiệp vụ, hai điều kiện dễ can thiệp nhất là Điều kiện 2 (Nắm giữ và chờ đợi) và Điều kiện 4 (Chờ đợi vòng tròn).

Loại trừ tương hỗ thường là bất khả kháng: một dòng tồn kho, số dư một tài khoản, hay một đoạn bộ nhớ dùng chung vốn dĩ không thể cho phép nhiều luồng cùng ghi đè hỗn loạn. Không cướp quyền cũng rất khó can thiệp một cách thô bạo: khóa thường bảo vệ một chuỗi thay đổi trạng thái chưa hoàn tất, nếu cưỡng chế tước đoạt khóa giữa chừng sẽ để lại dữ liệu dở dang và sai lệch nghiêm trọng. Ngược lại, việc bắt buộc thread phải xin đủ toàn bộ tài nguyên trong một lần, hoặc quy định mọi lối vào đều phải lấy khóa theo một thứ tự duy nhất, là giải pháp rất khả thi để đưa vào quy chuẩn viết code của đội ngũ phát triển.

## Tái hiện Deadlock bằng mã nguồn Java

Đoạn mã sau chuyển hóa kịch bản ở Hình 1 sang Java. Hai đối tượng `Object` đóng vai trò là Tài nguyên 1 và Tài nguyên 2, hai thread lần lượt bước vào các khối `synchronized` theo thứ tự trái ngược nhau.

Lệnh gọi `Thread.sleep(1000)` không phải là nguyên nhân gây ra deadlock; nó chỉ nhằm kéo dài khoảng thời gian chạy đan xen giữa hai thread để sự cố chắc chắn được tái hiện.

```java
public class DeadLockDemo {
    private static final Object resource1 = new Object();
    private static final Object resource2 = new Object();

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
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
                    Thread.currentThread().interrupt();
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

Kết quả in ra console điển hình:

```text
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

Chương trình dừng lại vĩnh viễn ở đây. Lệnh `sleep()` đã kết thúc từ lâu, điểm thực sự bị tắc nghẽn là khối `synchronized` thứ hai: Thread 1 không thể bước vào `resource2`, còn Thread 2 không thể bước vào `resource1`.

Đối chiếu hiện trường với 4 điều kiện ở trên:
- **Loại trừ tương hỗ**: `resource1` và `resource2` tại một thời điểm chỉ có thể do một thread nắm giữ.
- **Nắm giữ và chờ đợi**: Thread 1 giữ `resource1` và chờ `resource2`; Thread 2 giữ `resource2` và chờ `resource1`.
- **Không thể cướp quyền**: Máy ảo Java sẽ không cưỡng chế tước đoạt `resource1` khỏi tay Thread 1.
- **Chờ đợi vòng tròn**: Thread 1 chờ Thread 2, Thread 2 lại chờ Thread 1.

Cả 4 điều kiện đều đã hội tụ đầy đủ; việc deadlock có phát tác hay không phụ thuộc hoàn toàn vào thời điểm lập lịch CPU (timing). Cũng chính vì phụ thuộc vào timing, một số lỗi deadlock trên production không xuất hiện trong mọi lần chạy; chạy stress test 10 lần có thể chỉ bị kẹt 1 hoặc 2 lần.

### Làm thế nào để sửa đoạn code trên nhằm loại bỏ hoàn toàn Deadlock?

Cách sửa chữa trực tiếp và triệt để nhất là cố định thứ tự lấy khóa. Tất cả các thread đều bắt buộc phải lấy `resource1` trước, sau đó mới lấy `resource2`; khi đó chuỗi chờ đợi sẽ không bao giờ có cơ hội vòng ngược lại điểm xuất phát:

```java
public class OrderedLockDemo {
    private static final Object resource1 = new Object();
    private static final Object resource2 = new Object();

    public static void main(String[] args) {
        Runnable task = () -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");

                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        };

        new Thread(task, "Thread 1").start();
        new Thread(task, "Thread 2").start();
    }
}
```

Cách sửa này đã phá vỡ điều kiện **Chờ đợi vòng tròn (Circular Wait)**. Chỉ cần mọi luồng code đều tuân thủ nghiêm ngặt cùng một thứ tự, kịch bản A chờ B và B lại chờ A sẽ không bao giờ phát sinh.

Điểm khó khăn trong thực tế nằm ở cụm từ "mọi luồng code". Trong ví dụ nhỏ chỉ có hai cái khóa, nhìn qua là thấy ngay; nhưng trong hệ thống doanh nghiệp lớn, các khóa nằm rải rác ở module Đơn hàng, Kho vận, Thanh toán. Luồng A lấy khóa Đơn hàng trước rồi mới lấy khóa Tồn kho; Luồng B lại lấy khóa Tồn kho trước rồi mới lấy khóa Đơn hàng. Đứng riêng từng phương thức xem xét thì thấy đều hợp lý, chỉ khi ráp nối chạy đồng thời trong thực tế thì sự cố mới bùng phát.

Trong các dự án thực tế, bạn nên đưa các nguyên tắc sau vào danh sách checklist khi review code lập trình đồng thời:

- **Tài nguyên phải có thứ tự ổn định.** Hãy sắp xếp theo ID nghiệp vụ không đổi, Primary Key của database, hoặc số tài khoản. Tránh dựa vào `System.identityHashCode()`, vì nó không biểu thị thứ tự nghiệp vụ tin cậy.
- **Bên trong miền găng chỉ thực hiện các thay đổi trạng thái thực sự cần thiết.** Các thao tác như gọi RPC, câu truy vấn SQL chậm, đọc ghi file nên đưa ra ngoài phạm vi của khóa. Một lệnh gọi chậm sẽ kéo dài thời gian giữ khóa và làm tăng nguy cơ tắc nghẽn.
- **Nếu không lấy đủ tài nguyên thì phải rút lui.** Khi đã lấy được khóa A nhưng không lấy được khóa B, hãy chủ động giải phóng khóa A rồi thử lại sau, an toàn hơn rất nhiều so với việc ôm khư khư A rồi chờ B vô thời hạn.
- **Khi nghiệp vụ cho phép thất bại, hãy dùng `tryLock(timeout, unit)`** để đặt giới hạn trần cho thời gian chờ đợi, không bao giờ để thread bị treo vĩnh viễn.
- **Nếu hai cái khóa luôn xuất hiện cùng nhau, hãy cân nhắc gộp thành một khóa có phạm vi bao quát hơn (coarser lock).** Mức độ đồng thời có thể giảm đi một chút, nhưng đổi lại là tính chính xác dễ dàng chứng minh hơn rất nhiều.

Nguyên tắc cuối cùng nhìn qua có vẻ là một "bước lùi", nhưng trong kỹ thuật phần mềm nó lại cực kỳ hữu ích. Khóa chia quá nhỏ chưa chắc đã là thiết kế tốt; nếu nhiều trạng thái vốn dĩ gắn chặt mật thiết với nhau, việc cố tình xé nhỏ khóa chỉ tạo thêm kẽ hở cho Deadlock xuất hiện.

## Đồ thị cấp phát tài nguyên và Đồ thị chờ đợi

Giáo trình hệ điều hành thường dùng Đồ thị cấp phát tài nguyên (Resource Allocation Graph - RAG) để mô hình hóa Deadlock. Đồ thị này bao gồm hai loại nút:
- Nút tiến trình hoặc luồng (Thread/Process nodes).
- Nút tài nguyên (Resource nodes).

Cùng hai loại cạnh có hướng:
- Cạnh yêu cầu: Từ thread trỏ tới tài nguyên, biểu thị thread đang chờ được cấp tài nguyên đó.
- Cạnh phân bổ: Từ tài nguyên trỏ tới thread, biểu thị tài nguyên đã được cấp phát cho thread đó.

Một kết luận mang tính định lý: **Nếu đồ thị không chứa chu trình khép kín (cycle), chắc chắn hệ thống không có deadlock.**

Nếu đồ thị có chu trình, ta phải xét tiếp số lượng thực thể (instances) của mỗi loại tài nguyên:
- **Tài nguyên đơn thực thể (mỗi loại chỉ có 1 instance)**: Có chu trình đồng nghĩa với việc **chắc chắn xảy ra Deadlock** (điều kiện cần và đủ).
- **Tài nguyên đa thực thể (mỗi loại có nhiều instances)**: Có chu trình chỉ nói lên rằng **có nguy cơ Deadlock**; cần phân tích tiếp xem có thread nào trong hệ thống có thể hoàn thành và trả lại tài nguyên để phá vỡ chu trình hay không.

Lấy khóa dòng trong cơ sở dữ liệu làm ví dụ: Transaction T1 đã khóa đơn hàng `id=1` và đang chờ cập nhật `id=2`; Transaction T2 đã khóa `id=2` và quay lại chờ cập nhật `id=1`. Lúc này ta có thể tạm lược bỏ các nút tài nguyên, chỉ giữ lại quan hệ chờ đợi trực tiếp giữa các transaction:

```text
T1 -> T2
T2 -> T1
```

Đồ thị chỉ giữ lại quan hệ "ai đang chờ ai" này được gọi là **Đồ thị chờ đợi (Wait-for Graph - WFG)**, chính là bản thu gọn của Đồ thị cấp phát tài nguyên. Cơ chế phát hiện deadlock của Java Thread, bộ phát hiện deadlock trong database, hay công cụ `lockdep` của Linux kernel đều áp dụng tư duy đồ thị này, chỉ khác nhau ở thời điểm kích hoạt: database thường chỉ kiểm tra chu trình khi có transaction thực sự bị chặn; còn `lockdep` ghi nhận các tổ hợp thứ tự lấy khóa để phát hiện sớm các nguy cơ tiềm ẩn ngay cả khi chưa bị kẹt.

![Sơ đồ đồ thị cấp phát tài nguyên và đồ thị chờ đợi: Đồ thị cấp phát tài nguyên bao gồm nút thread và tài nguyên; đồ thị chờ đợi chỉ giữ lại quan hệ chờ đợi giữa các thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-resource-allocation-graph-d834fca8.png)

## Phòng ngừa, Né tránh, Phát hiện và Phục hồi

Khi xử lý Deadlock, y văn thường nhắc tới 4 chiến lược: Phòng ngừa (Prevention), Né tránh (Avoidance), Phát hiện (Detection) và Phục hồi (Recovery). Dù tên gọi gần giống nhau, chúng can thiệp ở các giai đoạn hoàn toàn khác nhau trong vòng đời hệ thống.

Trong code ứng dụng, phổ biến nhất là **Phòng ngừa** (như thống nhất thứ tự lấy khóa, rút ngắn thời gian giữ khóa); các hệ quản trị cơ sở dữ liệu lại quen thuộc với **Phát hiện và Phục hồi** nhờ ranh giới rollback rõ ràng của transaction; Thuật toán Banker thuộc nhóm **Né tránh**, rất hay để hiểu về trạng thái an toàn, nhưng hiếm khi có dịch vụ backend nào tự xây dựng một hệ thống theo thuật toán này trong thực tế.

| Chiến lược | Cơ chế thực hiện | Chi phí / Đánh đổi | Mức độ phổ biến trong thực tế |
| --- | --- | --- | --- |
| Phòng ngừa (Prevention) | Phá vỡ 1 trong 4 điều kiện Coffman để deadlock không thể hình thành về mặt cấu trúc | Có thể làm giảm tính đồng thời hoặc tăng ràng buộc khi viết code | Rất phổ biến |
| Né tránh (Avoidance) | Trước khi cấp tài nguyên, phán đoán xem việc cấp phát có đẩy hệ thống vào trạng thái nguy hiểm hay không | Cần biết trước nhu cầu tài nguyên tối đa; chi phí kiểm tra cao | Hay gặp trong giáo trình; hiếm gặp trong hệ thống thực tế |
| Phát hiện (Detection) | Cho phép deadlock xảy ra; định kỳ hoặc kích hoạt kiểm tra chu trình chờ đợi khi bị nghẽn | Bản thân việc quét đồ thị gây hao tổn tài nguyên | Rất phổ biến trong database, JVM tooling, gỡ lỗi kernel |
| Phục hồi (Recovery) | Sau khi phát hiện deadlock, tiến hành hủy, rollback hoặc cưỡng chế thu hồi tài nguyên | Có thể phải hủy bỏ phần công việc đã thực hiện | Cực kỳ tự nhiên và chuẩn mực trong database transaction |

![Sơ đồ chiến lược xử lý deadlock: Vị trí tác động và mức độ phổ biến trong thực tế của 4 phương pháp phòng ngừa, né tránh, phát hiện, phục hồi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-strategies-b7623bee.png)

### 1. Phòng ngừa Deadlock (Deadlock Prevention)

Bản chất của phòng ngừa là: triệt tiêu để 4 điều kiện tiên quyết không bao giờ đồng thời hội tụ.

- **Phá vỡ Loại trừ tương hỗ**: Chuyển tài nguyên sang dạng có thể chia sẻ (shareable). Dữ liệu chỉ đọc (read-only), đối tượng bất biến (immutable objects), cấu trúc dữ liệu lock-free, ghi log dạng nối đuôi (append-only) đều giúp giảm nhu cầu loại trừ tương hỗ. Tuy nhiên con đường này thường bị tắc ở các bài toán thực tế: trừ tồn kho cùng một mặt hàng, ghi cùng một vị trí file, hay sửa số dư tài khoản thì không thể cho phép ghi đồng thời không kiểm soát.
- **Phá vỡ Nắm giữ và chờ đợi**: Hoặc là xin cấp phát toàn bộ tài nguyên cần thiết trong một lần duy nhất, hoặc không cầm giữ tài nguyên nào cả. Cách này loại bỏ trạng thái "tay ôm A, mắt ngóng B". Đánh đổi: hiệu suất tận dụng tài nguyên sụt giảm, và caller bắt buộc phải biết trước toàn bộ danh sách tài nguyên cần dùng.
- **Phá vỡ Không thể cướp quyền**: Khi không xin được tài nguyên mới, chủ động giải phóng toàn bộ tài nguyên hiện đang nắm giữ, rồi thử lại sau. Khóa nội tại `synchronized` của Java không hỗ trợ timeout hay giải phóng cưỡng chế; nhưng phương thức `tryLock()` của interface `Lock` cho phép bạn hiện thực hóa logic "chờ không được thì chủ động rút lui":

```java
boolean gotA = false;
boolean gotB = false;

try {
    gotA = lockA.tryLock(100, TimeUnit.MILLISECONDS);
    if (!gotA) {
        return;
    }

    gotB = lockB.tryLock(100, TimeUnit.MILLISECONDS);
    if (!gotB) {
        return;
    }

    // Chỉ xử lý trạng thái dùng chung khi đã nắm chắc cả hai khóa
    updateSharedState();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    // Không nuốt tín hiệu ngắt; tùy nghiệp vụ để quyết định return hay ném exception
} finally {
    if (gotB) {
        lockB.unlock();
    }
    if (gotA) {
        lockA.unlock();
    }
}
```

Ưu điểm của đoạn code này là thread không bao giờ bị treo vô tận. Nhưng hãy nhìn rõ sự đánh đổi: nó biến việc chờ đợi thành một lần trả về thất bại. Tầng nghiệp vụ phải tự xử lý việc retry ra sao, tối đa bao nhiêu lần, có idempotency key hay không. Nếu không thiết kế kỹ, Deadlock biến mất nhưng lỗi Livelock hoặc tỷ lệ request thất bại cao sẽ xuất hiện thay thế.

- **Phá vỡ Chờ đợi vòng tròn**: Đánh số thứ tự cố định cho mọi tài nguyên, bắt buộc tất cả các thread chỉ được xin cấp phát tài nguyên theo chiều tăng dần của thứ tự đó. Trong backend, ví dụ điển hình nhất là sắp xếp tăng dần theo ID trước khi thực hiện batch update nhiều dòng trong database.

### 2. Né tránh Deadlock (Deadlock Avoidance)

Né tránh Deadlock không phá vỡ trực tiếp 4 điều kiện. Thay vào đó, trước mỗi lần cấp phát tài nguyên, hệ thống sẽ tự hỏi: *Nếu cấp phát tài nguyên này đi, hệ thống có còn tìm ra một trình tự an toàn để tất cả các tiến trình lần lượt hoàn thành hay không?*

Thuật toán tiêu biểu nhất trong giáo trình là **Thuật toán Banker (Banker's Algorithm)** của Dijkstra. Nó đòi hỏi mỗi tiến trình phải khai báo trước nhu cầu tài nguyên tối đa. Mỗi khi có yêu cầu cấp phát, hệ điều hành sẽ chạy thuật toán kiểm tra tính an toàn:
- Nếu sau khi cấp phát vẫn tồn tại ít nhất một chuỗi an toàn (safe sequence), yêu cầu được chấp thuận.
- Nếu không tìm ra chuỗi an toàn nào, yêu cầu sẽ bị tạm hoãn và tiến trình phải chờ.

Trạng thái an toàn đảm bảo chắc chắn không bị deadlock; trạng thái không an toàn (unsafe state) chưa phải là đã bị deadlock, nhưng tiềm ẩn nguy cơ dẫn tới deadlock.

Thuật toán Banker rất tuyệt để hiểu bản chất của trạng thái an toàn, nhưng trong các dịch vụ ứng dụng thông thường hầu như không ai dùng. Lý do rất thực tế: phần lớn ứng dụng không thể khai báo trước nhu cầu tài nguyên tối đa; luồng nghiệp vụ rẽ nhánh động; và việc chạy kiểm tra an toàn ma trận trước mỗi lần cấp phát tiêu tốn chi phí CPU rất lớn.

### 3. Phát hiện Deadlock (Deadlock Detection)

Chiến lược phát hiện đi theo hướng ngược lại: cứ để hệ thống vận hành tự nhiên, khi thread hoặc transaction thực sự bị nghẽn lại thì mới tiến hành quét đồ thị tìm chu trình.

Cơ sở dữ liệu cực kỳ phù hợp với cơ chế này. Bản thân transaction đã có ranh giới rollback rõ ràng; khi phát hiện chu trình deadlock, database chỉ việc chọn một transaction làm "nạn nhân" để rollback, giải phóng tài nguyên cho transaction còn lại chạy tiếp. Phía ứng dụng chỉ cần bắt lỗi deadlock này và quyết định xem có nên retry lại toàn bộ transaction hay không.

Trong máy ảo Java, JDK cung cấp sẵn công cụ chẩn đoán qua `ThreadMXBean`:

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;

public class DeadlockDetector {
    public static void printDeadlocks() {
        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        long[] threadIds = bean.findDeadlockedThreads();

        if (threadIds == null || threadIds.length == 0) {
            System.out.println("No deadlock found");
            return;
        }

        ThreadInfo[] threadInfos = bean.getThreadInfo(threadIds, true, true);
        for (ThreadInfo threadInfo : threadInfos) {
            System.out.println(threadInfo);
        }
    }
}
```

Hàm `findDeadlockedThreads()` có khả năng kiểm tra cả Object Monitor (`synchronized`) lẫn các Ownable Synchronizer trong gói `java.util.concurrent` (như `ReentrantLock`). Phương thức này phù hợp để đặt trong các công cụ giám sát hoặc script chẩn đoán sự cố đột xuất, không nên gọi với tần suất cao trong luồng nghiệp vụ chính vì chi phí quét đồ thị không hề nhỏ.

Bạn cũng cần hiểu rõ ranh giới của nó: `ThreadMXBean` chỉ nhìn thấy các monitor và synchronizer bên trong chính JVM đó. Nếu Thread A đang giữ khóa Java và chờ khóa dòng database, trong khi Thread B đang giữ khóa dòng database và bị kẹt chờ một hành động ở ứng dụng khác, thì chuỗi chờ đợi xuyên hệ thống này `ThreadMXBean` hoàn toàn bất lực. Lúc này bạn bắt buộc phải kết hợp đồng thời Thread Dump, view khóa database và log nghiệp vụ.

Trên môi trường production, thao tác phổ biến nhất là trích xuất Thread Dump từ dòng lệnh:

```bash
jcmd <pid> Thread.print -l
jstack -l <pid>
```

Nếu trong output xuất hiện các dòng như `Found one Java-level deadlock`, `waiting to lock`, `which is held by`, bạn hoàn toàn có thể lần theo chuỗi chờ đợi này để tìm thẳng ra dòng code nghiệp vụ gây lỗi. Hãy luôn nhớ thêm tham số `-l`, bởi nếu thiếu nó, thông tin về các khóa JUC (`ReentrantLock`, `ReentrantReadWriteLock`) sẽ bị thiếu sót.

Khi tái hiện sự cố ở môi trường local, các công cụ trực quan như JConsole hay VisualVM rất tiện lợi. Với JConsole, mở terminal và gõ `jconsole`:

![jconsole](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jdk-home-bin-jconsole-2cf07489.png)

Sau khi kết nối vào tiến trình Java, chuyển sang tab "Threads" (Luồng) và bấm nút "Detect Deadlock" (Phát hiện khóa chết):

![jconsole phát hiện deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-29a7f927.png)

Nếu trong tiến trình thực sự tồn tại Deadlock giữa các Java Thread, JConsole sẽ tách riêng và hiển thị chi tiết các thread liên quan:

![jconsole đã phát hiện deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-done-3ff1d402.png)

Trên môi trường production thực tế, các công cụ CLI như `jcmd` và `jstack` vẫn luôn là ưu tiên số một. Chúng chạy trực tiếp qua SSH, output dạng văn bản dễ dàng lưu trữ làm tài liệu đối soát sự cố, và tiêu tốn cực ít tài nguyên. JConsole phù hợp hơn cho môi trường dev/staging. Việc mở kết nối JConsole từ xa vào production tiềm ẩn nhiều rủi ro bảo mật, vướng tường lửa và gây tải không cần thiết; xuất file Thread Dump ra rồi phân tích offline an toàn hơn nhiều.

Nếu ứng dụng sử dụng nhiều **Virtual Thread trong Java 21+**, bạn cần lưu ý thêm: Virtual Thread không gắn chặt cố định với một OS Platform Thread nào. Lệnh `jstack` truyền thống có thể không hiển thị đầy đủ thông tin của Virtual Thread. Bạn nên dùng `jcmd` để xuất Virtual Thread Dump chuyên biệt:

```bash
jcmd <pid> Thread.dump_to_file -format=text thread-dump.txt
jcmd <pid> Thread.dump_to_file -format=json thread-dump.json
```

Cấu trúc file dump của Virtual Thread có sự khác biệt so với Platform Thread truyền thống; các thông tin như địa chỉ đối tượng, thống kê JNI hay chi tiết Heap có thể không hiển thị y hệt. Khi điều tra sự cố, đừng chỉ dựa vào một bản dump duy nhất mà hãy kết hợp cả log nghiệp vụ, JFR (Java Flight Recorder), database metrics và trạng thái các dịch vụ phụ thuộc.

### 4. Phục hồi Deadlock (Deadlock Recovery)

Phục hồi thường phức tạp hơn phát hiện, bởi hệ thống phải đưa ra quyết định: "Hi sinh ai?".

Có 3 giải pháp phổ biến:
1. **Tiêu diệt toàn bộ các thực thể tham gia deadlock.**
2. **Tiêu diệt từng thực thể một**, sau mỗi lần lại chạy phát hiện deadlock xem chu trình đã được phá vỡ hay chưa.
3. **Cưỡng chế thu hồi tài nguyên**, đưa thực thể được chọn quay ngược lại (rollback) một điểm kiểm tra an toàn (checkpoint) trước đó rồi cho chạy lại.

Database Transaction cực kỳ phù hợp với cơ chế phục hồi, vì ranh giới transaction rất rõ ràng và rollback trả lại trạng thái nguyên vẹn. Ngược lại, Java Thread thông thường rất khó phục hồi theo cách này: một thread đang giữ lock có thể đã sửa đổi dở dang một nửa dữ liệu trên Heap, ghi dở một nửa file, hoặc đã bắn dở một request RPC ra bên ngoài; việc thẳng tay tiêu diệt thread (`kill`) gần như chắc chắn phá hủy tính toàn vẹn của dữ liệu. Đây chính là lý do phương thức `Thread.stop()` đã bị gắn cờ deprecated và loại bỏ từ lâu.

Trong lập trình ứng dụng, mục tiêu tối thượng là tránh tự dồn mình vào bước đường cùng: nơi mà một khi đã kẹt thì chỉ còn cách khởi động lại tiến trình.

## Deadlock trong Cơ sở dữ liệu

Deadlock xuất hiện rất thường xuyên trong cơ sở dữ liệu quan hệ, đặc biệt khi nhiều transaction cùng cập nhật đồng thời nhiều dòng dữ liệu.

Giả sử ta có bảng đơn hàng:

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  status VARCHAR(32) NOT NULL
);
```

Hai transaction chạy đồng thời như sau:

```sql
-- Transaction T1
BEGIN;
UPDATE orders SET status = 'PAID' WHERE id = 1;
UPDATE orders SET status = 'PAID' WHERE id = 2;
COMMIT;
```

```sql
-- Transaction T2
BEGIN;
UPDATE orders SET status = 'CANCELLED' WHERE id = 2;
UPDATE orders SET status = 'CANCELLED' WHERE id = 1;
COMMIT;
```

Nếu T1 khóa thành công dòng `id=1`, còn T2 khóa thành công dòng `id=2`, các câu lệnh UPDATE tiếp theo của cả hai bên sẽ rơi vào trạng thái chờ đợi lẫn nhau.

Cơ sở dữ liệu thông thường sẽ không để hai transaction này bị treo vĩnh viễn. PostgreSQL có tham số `deadlock_timeout` (mặc định là `1s`); transaction chờ khóa vượt quá khoảng thời gian này thì database mới bắt đầu kích hoạt thuật toán quét chu trình deadlock, nhằm tránh chi phí dựng đồ thị liên tục cho các trường hợp chờ khóa ngắn hạn. Trong MySQL InnoDB, cơ chế phát hiện deadlock được bật mặc định; khi tìm thấy chu trình, InnoDB sẽ tự động rollback một transaction (thường ưu tiên rollback transaction có số lượng dòng bị thay đổi ít hơn) để tháo gỡ bế tắc.

Phía ứng dụng cần phối hợp xử lý hai vấn đề quan trọng:

1. **Khả năng tự động retry transaction**: Ứng dụng phải bắt được lỗi deadlock để chạy lại. Mã lỗi deadlock của PostgreSQL là SQLSTATE `40P01`; MySQL InnoDB khi gặp deadlock sẽ rollback toàn bộ transaction với error code 1213. Khi nhận được các lỗi này, ứng dụng phải thực hiện chạy lại **toàn bộ transaction nghiệp vụ**, chứ không phải chỉ gửi lại duy nhất câu lệnh SQL bị lỗi.
2. **Thống nhất thứ tự lấy khóa**: Khi cập nhật nhiều dòng dữ liệu hàng loạt (batch update), hãy sắp xếp các khóa chính (Primary Key) hoặc ID nghiệp vụ duy nhất theo thứ tự tăng dần trước khi thực hiện UPDATE. Thói quen đơn giản này giúp loại bỏ phần lớn các chu trình chờ đợi chéo nhau.

Trước khi cấu hình cơ chế retry, bắt buộc phải bảo đảm nghiệp vụ có **tính lũy thỏa (idempotency)**. Hãy sử dụng request ID duy nhất, mã giao dịch nghiệp vụ, hoặc kiểm tra trạng thái trong State Machine. Nếu không, database vừa tự tháo gỡ xong deadlock thì ứng dụng lại gây ra thảm họa trừ tiền hai lần hoặc xuất kho hai lần do cơ chế retry mù quáng.

Các lưu ý để giảm thiểu và điều tra deadlock trong database:
- Giữ transaction càng ngắn càng tốt; tuyệt đối không chờ input của người dùng, không gọi API bên ngoài, không xử lý file dung lượng lớn bên trong một transaction database.
- Đảm bảo câu lệnh UPDATE có Index chuẩn xác; thiếu index sẽ khiến database quét toàn bộ bảng và vô tình khóa luôn cả những dòng dữ liệu không liên quan.
- Hạn chế sử dụng các câu lệnh `SELECT ... FOR UPDATE` khi không thực sự cần thiết.
- Với MySQL, dùng lệnh `SHOW ENGINE INNODB STATUS` để xem chi tiết thông tin vụ deadlock gần nhất. Nếu deadlock xảy ra liên tục, hãy bật cờ `innodb_print_all_deadlocks` để ghi toàn bộ lịch sử deadlock vào error log.
- Với PostgreSQL, kết hợp error log cùng các view `pg_locks` và `pg_stat_activity` để kiểm tra quan hệ chặn khóa.

Trong PostgreSQL, bạn có thể chạy câu query sau để xem phiên làm việc nào đang bị chờ khóa và bị chặn bởi PID nào:

```sql
SELECT
    a.pid,
    a.usename,
    a.state,
    a.wait_event_type,
    a.wait_event,
    pg_blocking_pids(a.pid) AS blocking_pids,
    a.query
FROM pg_stat_activity a
WHERE a.wait_event_type = 'Lock';
```

Câu lệnh SQL này dùng để soi hiện trường đang bị nghẽn. Để phân tích một vụ deadlock đã diễn ra trong quá khứ, bạn cần mở error log của database để đọc deadlock dump, lấy ra `traceId` / `requestId` trong log ứng dụng, rồi phục hồi lại trình tự các câu lệnh SQL mà hai transaction đã thực thi.

Deadlock trong database không có nghĩa là "database bị hỏng". Phần lớn trường hợp, nó là lời nhắc nhở rằng: tầng ứng dụng đang truy cập vào cùng một tập tài nguyên với thứ tự không nhất quán.

## Phân biệt Deadlock, Starvation và Livelock

Cả ba khái niệm này khi quan sát bên ngoài đều biểu hiện ra là "chương trình không chịu chạy tiếp theo kỳ vọng", nhưng hiện trường bên trong lại hoàn toàn khác biệt.

| Vấn đề | Biểu hiện | Nguyên nhân điển hình |
| --- | --- | --- |
| Deadlock (Khóa chết) | Nhiều thực thể chờ đợi lẫn nhau, tạo thành chu trình khép kín | Lấy khóa ngược chiều, transaction cập nhật chéo hàng |
| Starvation (Chết đói) | Một thực thể bị bỏ đói tài nguyên lâu dài, nhưng toàn hệ thống vẫn liên tục tiến triển | Độ ưu tiên quá thấp, tranh chấp khóa không công bằng (non-fair lock) |
| Livelock (Khóa sống) | Các thực thể liên tục thay đổi trạng thái để nhường nhau, nhưng không ai hoàn thành | Thất bại đồng thời retry, chiến lược giãn cách (backoff) bị đồng bộ hóa |

![So sánh Deadlock, Starvation và Livelock: Deadlock biểu hiện là chu trình chờ; Starvation biểu hiện là không xin được tài nguyên trong thời gian dài; Livelock biểu hiện là liên tục hành động nhưng không tiến triển](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-vs-starvation-livelock-0659685e.png)

Có thể ghi nhớ bằng 3 hình ảnh đời thường:
- **Deadlock** giống như hai chiếc ô tô đối đầu nhau trên một cây cầu hẹp, không chiếc nào chịu lùi lại.
- **Starvation** giống như một người xếp hàng ở cuối nhưng liên tục bị người khác chen ngang lên trước, vĩnh viễn không đến lượt.
- **Livelock** giống như hai người đi đối diện nhau ở hành lang hẹp, cả hai cùng lịch sự bước sang cùng một bên để nhường đường cho nhau, rồi lại cùng bước sang bên kia, kết quả là cứ lắc qua lắc lại mà chẳng ai bước qua được.

Khi điều tra sự cố, đừng chỉ nhìn vào chữ "bị kẹt". Với Deadlock, hãy đi tìm chu trình chờ đợi; với Starvation, hãy xem cơ chế lập lịch hoặc tranh chấp khóa có bị thiên vị lâu dài hay không; với Livelock, hãy xem logic retry có đang bắt tất cả các bên cùng nhảy theo một nhịp điệu giống hệt nhau hay không (thiếu jitter).

## Những hiện tượng "bị kẹt" nào KHÔNG PHẢI là Deadlock?

Trên môi trường production, có rất nhiều trường hợp hệ thống "bị kẹt cứng" trông rất giống Deadlock, nhưng khi điều tra kỹ thì hoàn toàn không có chu trình chờ đợi nào:

- **Cạn kiệt Thread Pool**: Mọi worker thread đều đang bận xử lý các tác vụ chậm chạp; các request mới đến đành phải xếp hàng chờ đợi.
- **Cạn kiệt Connection Pool**: Toàn bộ thread đều đang chờ mượn connection database từ pool, nhưng không có chu trình phụ thuộc lẫn nhau giữa các thread.
- **Truy vấn SQL chậm (Slow Query)**: Thread bị giữ chân bên trong driver JDBC vì database đang phải quét toàn bộ bảng do thiếu Index.
- **Dịch vụ bên ngoài bị timeout**: Thread bị treo ở lệnh gọi HTTP/RPC để chờ phản hồi từ một microservice khác.
- **Điểm dừng GC hoặc Safepoint**: Toàn bộ Java Thread bị tạm dừng trong thời gian ngắn (Stop-The-World) để dọn rác.
- **Chết đói (Starvation)**: Một số thread cá biệt không giành được tài nguyên, trong khi các luồng khác của hệ thống vẫn đang xử lý ầm ầm.

Bằng chứng mang tính quyết định để kết luận Deadlock không phải là "chậm" hay "kẹt", mà là việc bạn có tìm ra được một **chu trình chờ đợi khép kín** hay không.

## Quy trình điều tra Java Deadlock trên Production

Khi các API trên production bị treo, đừng vội vàng khởi động lại ứng dụng ngay lập tức. Miễn là tiến trình JVM vẫn còn sống, hãy ưu tiên trích xuất Thread Dump và các chỉ số hiện trường trước tiên.

### 1. Xác định sơ bộ xem có phải hệ thống bị "treo toàn bộ"

Trước tiên hãy quan sát xem triệu chứng có tập trung vào hiện tượng "thread không chịu giải phóng tài nguyên" hay không:
- Một số API nhất định liên tục bị timeout, nhưng tiến trình Java vẫn còn sống.
- CPU không cao, nhưng số lượng thread, số lượng kết nối và hàng đợi request liên tục tăng vọt.
- Số lượng active thread trong thread pool chạm trần và không bao giờ giảm xuống.
- Connection pool database bị mượn hết sạch và không thấy trả lại.

Những dấu hiệu này chỉ chứng minh các service đang phải chờ đợi, chưa đủ để khẳng định có deadlock. Slow SQL, microservice bên ngoài bị đơ, hay cấu hình thread pool không hợp lý cũng tạo ra hiện trường y hệt.

### 2. Trích xuất Thread Dump liên tiếp từ 2 đến 3 lần

Bạn nên trích xuất Thread Dump liên tiếp vài lần, mỗi lần cách nhau từ 10 đến 30 giây. Nếu chỉ lấy duy nhất một bản dump, bạn rất dễ nhầm lẫn một đợt chờ khóa tức thời (transient lock wait) thành Deadlock vĩnh viễn:

```bash
jcmd <pid> Thread.print -l > thread-1.log
sleep 10
jcmd <pid> Thread.print -l > thread-2.log
sleep 10
jcmd <pid> Thread.print -l > thread-3.log
```

Giá trị của việc lấy nhiều bản dump nằm ở sự đối chiếu. Nếu cả 3 lần dump các thread đều đang dừng ở đúng chiếc khóa đó, đúng connection pool đó, đúng dòng code nghiệp vụ đó, nhận định của bạn sẽ đáng tin cậy hơn rất nhiều.

Với các deadlock giữa các Java Thread thông thường, bản dump sẽ in ra thông báo cảnh báo rõ ràng. Trong trường hợp không có thông báo tự động, bạn cũng có thể quan sát xem có lượng lớn thread đang dừng chân tại cùng một nhóm khóa hay cùng một logic nghiệp vụ hay không.

### 3. Lần theo `waiting to lock` để tìm người đang giữ khóa

Khi đọc nội dung Thread Dump, hãy tập trung vào các thông tin sau:
- Tên thread và trạng thái thread (ví dụ `BLOCKED`, `WAITING`).
- Đối tượng khóa mà thread đang chờ đợi (`waiting to lock <...>`).
- Các khóa mà thread hiện tại đang nắm giữ (`locked <...>`).
- Phương thức nghiệp vụ nằm ở đỉnh của Call Stack.
- `parking to wait for <...>` tương ứng với các đối tượng `Lock` của JUC hoặc hàng đợi điều kiện.

Nếu bạn nhìn thấy Thread A đang chờ khóa do Thread B nắm giữ, và Thread B lại đang chờ khóa do Thread A nắm giữ, chu trình deadlock đã lộ diện hoàn toàn.

Với deadlock liên quan đến `synchronized`, bạn sẽ thấy các nhãn `waiting to lock <...>` và `locked <...>`. Với các khóa JUC như `ReentrantLock`, bạn sẽ thấy `parking to wait for <...>` và cần soi kỹ mục `Locked ownable synchronizers`. Đó là lý do vì sao luôn cần thêm cờ `-l` khi dump.

### 4. Quay lại mã nguồn để rà soát thứ tự lấy khóa

Khi đã xác định được phương thức nghiệp vụ trong stack trace, hãy mở mã nguồn và rà soát:
- Có phải đang tồn tại nhiều lối vào gọi khóa chéo chiều nhau hay không.
- Có thực hiện gọi API bên ngoài hoặc database bên trong miền găng hay không.
- Có đang khóa lên các đối tượng có phạm vi quá rộng hay không (ví dụ biến `Map` static, đối tượng Singleton, hoặc `Class` object).
- Có sự kết hợp chéo giữa khóa Java và transaction database hay không.
- Có đang sử dụng non-fair lock, chờ đợi vô hạn hoặc không có timeout hay không.

Phần lớn các vụ deadlock không bắt nguồn từ một dòng code lỗi đơn lẻ, mà sinh ra từ sự kết hợp của hai luồng gọi hàm độc lập tại runtime. Đứng riêng từng luồng đều rất hợp lý, nhưng khi chạy song song thì lại khép kín thành một vòng tròn.

## Kỹ thuật giảm thiểu Deadlock khi lập trình

Các nguyên tắc sau đây đóng vai trò như checklist khi review mã nguồn, đặc biệt cho các kịch bản liên quan đến nhiều khóa, nhiều transaction và cập nhật nhiều tài nguyên đồng thời.

### Cố định thứ tự lấy khóa

Khi đồng thời thao tác trên nhiều User, Order hoặc Account, hãy sắp xếp chúng theo một thứ tự nhất quán trước khi tiến hành khóa. Ví dụ hàm chuyển tiền dưới đây giả định Account ID là duy nhất trên toàn hệ thống và không đổi sau khi tạo:

```java
public void transfer(Account from, Account to, long amount) {
    if (from == to) {
        return;
    }

    Account first;
    Account second;
    int compare = Long.compare(from.id(), to.id());
    if (compare < 0) {
        first = from;
        second = to;
    } else if (compare > 0) {
        first = to;
        second = from;
    } else {
        throw new IllegalStateException("Account id must be unique");
    }

    synchronized (first) {
        synchronized (second) {
            from.withdraw(amount);
            to.deposit(amount);
        }
    }
}
```

Trong ví dụ này, dù là A chuyển cho B hay B chuyển cho A, cả hai thread đều luôn luôn khóa tài khoản có ID nhỏ trước, rồi mới khóa tài khoản có ID lớn sau. Thứ tự đã được cố định, điều kiện chờ đợi vòng tròn bị triệt tiêu hoàn toàn.

### Tuyệt đối không làm tác vụ chậm bên trong miền găng

Trong thời gian đang nắm giữ khóa, hãy tránh xa các thao tác sau:
- Gửi request RPC hoặc HTTP.
- Thực thi các câu SQL chậm hoặc transaction lớn.
- Thao tác upload/download file dung lượng lớn.
- Đứng chờ message trả về từ Message Queue.
- Gọi code của bên thứ ba mà bạn không nắm rõ bên trong có khóa hay không.

Khóa sinh ra để bảo vệ sự biến đổi của trạng thái trong bộ nhớ, không phải để bao bọc toàn bộ quy trình nghiệp vụ. Những dữ liệu nào tính toán trước được hãy tính ngoài khóa; bên trong khóa chỉ để lại thao tác tráo đổi trạng thái ngắn gọn nhất.

### Sử dụng cơ chế Timeout và chiến lược dự phòng

Khóa nội tại `synchronized` không hỗ trợ timeout. Khi nghiệp vụ cho phép thất bại hoặc retry, hãy cân nhắc chuyển sang dùng `ReentrantLock.tryLock()`:

```java
try {
    if (!lock.tryLock(200, TimeUnit.MILLISECONDS)) {
        throw new IllegalStateException("Hệ thống đang bận, vui lòng thử lại sau");
    }

    try {
        updateSharedState();
    } finally {
        lock.unlock();
    }
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new IllegalStateException("Bị ngắt trong lúc chờ lấy khóa", e);
}
```

Timeout chỉ giúp giới hạn thời gian chờ, không tự động bảo đảm tính đúng đắn của nghiệp vụ. Việc sau khi không lấy được khóa thì có retry không, retry tối đa mấy lần, có bị trùng lặp dữ liệu không, có cần Idempotency Key không... đều phải được thiết kế kỹ càng từ trước.

### Hạn chế trộn lẫn nhiều tầng khóa khác nhau

Loại deadlock khó điều tra nhất là Deadlock xuyên tầng:
- Java Thread đang giữ khóa JVM và chờ khóa dòng database.
- Một request khác đang giữ khóa dòng database, gọi ngược lại ứng dụng và chờ khóa JVM.

Chuỗi chờ đợi này cùng lúc xuất hiện ở cả Thread Dump JVM lẫn Error Log database, soi riêng từng bên đều không thấy chu trình hoàn chỉnh. Hãy cố gắng cô lập việc khóa trong cùng một tầng kiến trúc. Nếu bắt buộc phải khóa xuyên tầng, tối thiểu phải có Timeout, Log chi tiết và thứ tự lấy khóa thống nhất tuyệt đối.

### Đặt tên rõ ràng cho Thread và Lock

Khi điều tra sự cố ngoài thực tế, điều ám ảnh nhất là nhìn thấy những dòng log kiểu: `Thread-17 waiting on Object@4afcd809`. Việc chủ động đặt tên rõ ràng cho thread pool, gắn ID nghiệp vụ vào đối tượng lock, và in thứ tự tài nguyên ra log sẽ giúp tiết kiệm hàng giờ đồng hồ khi có sự cố.

Ví dụ đặt tên cho Thread trong ThreadFactory:

```java
private static final AtomicInteger THREAD_INDEX = new AtomicInteger();

ThreadFactory factory = runnable -> {
    Thread thread = new Thread(runnable);
    thread.setName("order-worker-" + THREAD_INDEX.incrementAndGet());
    return thread;
};
```

Sử dụng `AtomicInteger` từ gói `java.util.concurrent.atomic` giúp đánh số luồng an toàn và tương thích hoàn hảo từ Java 8, 11 đến các phiên bản mới. Việc đặt tên không giúp ngăn chặn deadlock, nhưng nó giúp bạn nhận diện ngay lập tức nhóm thread nghiệp vụ nào đang gặp nguy hiểm.

## Cách trả lời phỏng vấn về Deadlock

Khi người phỏng vấn hỏi về Deadlock, đừng vội vàng đọc thuộc lòng một định nghĩa dài dòng. Hãy bắt đầu bằng một ví dụ trực quan về hai thread chờ nhau:

> Deadlock là trạng thái mà nhiều thread hoặc process cùng chờ đợi tài nguyên do bên kia nắm giữ, khiến toàn bộ các bên tham gia đều bị đình trệ và không thể tự mình chạy tiếp. Ví dụ kinh điển là Thread A giữ Khóa 1 chờ Khóa 2, còn Thread B giữ Khóa 2 chờ Khóa 1.

Sau đó nêu 4 điều kiện tiên quyết:

> Để Deadlock xảy ra, bắt buộc phải đồng thời hội tụ đủ 4 điều kiện Coffman: Loại trừ tương hỗ (Mutual Exclusion), Nắm giữ và chờ đợi (Hold and Wait), Không thể cướp quyền (No Preemption), và Chờ đợi vòng tròn (Circular Wait). Chỉ cần phá vỡ được bất kỳ một điều kiện nào trong số này, ta sẽ ngăn chặn được Deadlock về mặt cấu trúc.

Tiếp tục trình bày các giải pháp trong thực tế:

> Trong kỹ thuật phần mềm, phương pháp phổ biến nhất là Phòng ngừa (Prevention) — ví dụ như cố định thứ tự lấy khóa toàn cục, thu hẹp phạm vi miền găng, hoặc sử dụng `tryLock` có timeout. Giáo trình hệ điều hành còn nhắc tới Thuật toán Banker thuộc nhóm Né tránh (Avoidance), nhưng đòi hỏi phải biết trước nhu cầu tài nguyên tối đa. Với Cơ sở dữ liệu, giải pháp chủ đạo là Phát hiện và Phục hồi (Detection & Recovery): khi phát hiện chu trình chờ đợi, engine sẽ tự động rollback một transaction để tháo gỡ, và tầng ứng dụng sẽ thực hiện retry.

Nếu người phỏng vấn hỏi sâu về cách điều tra trong Java:

> Trong Java, ta có thể dùng lệnh `jcmd <pid> Thread.print -l` hoặc `jstack -l <pid>` để trích xuất Thread Dump, hoặc dùng `ThreadMXBean.findDeadlockedThreads()` trong code để chẩn đoán. Khi soi dump, ta quan sát trạng thái thread (`BLOCKED`), các đối tượng khóa đang chờ và đang giữ, mục `Locked ownable synchronizers` để tìm ra chu trình, sau đó đối chiếu lại mã nguồn để tìm các điểm lấy khóa ngược chiều hoặc thao tác chậm bên trong miền găng.

Cách trả lời này bao quát trọn vẹn từ khái niệm, điều kiện, giải pháp kiến trúc cho tới kỹ năng điều tra thực tế, vượt trội hơn hẳn so với việc chỉ học vẹt 4 điều kiện lý thuyết.

## Tổng kết

Điều quan trọng nhất cần ghi nhớ về Deadlock không phải là các thuật ngữ, mà chính là **quan hệ chờ đợi**.

Bất cứ khi nào trong mã nguồn xuất hiện đoạn code "đã nắm giữ một phần tài nguyên, lại tiếp tục chờ đợi thêm tài nguyên khác", hãy luôn tự hỏi: *Mối quan hệ chờ đợi này liệu có thể khép thành một chu trình kín hay không?* Nếu có, hãy lập tức cố định thứ tự lấy khóa, rút ngắn thời gian giữ khóa, áp dụng cơ chế timeout rút lui an toàn, hoặc giao phó cho các hệ thống có khả năng phát hiện chu trình và tự động rollback như Transaction Database xử lý.

Không hệ thống phân tán phức tạp nào có thể cam kết 100% không bao giờ gặp deadlock khi đối mặt với lượng truy cập đồng thời khổng lồ. Mục tiêu thực tế và chuyên nghiệp hơn là: giảm thiểu tối đa xác suất xảy ra, lưu giữ trọn vẹn hiện trường khi gặp lỗi, và thiết kế tầng nghiệp vụ có khả năng tự động retry an toàn thay vì kéo toàn bộ hệ thống đến mức phải restart tiến trình.

## Tài liệu tham khảo

- [JavaGuide: Common Operating System Interview Questions Summary (Part 1)](https://github.com/Snailclimb/JavaGuide)
- [Explaining Deadlock with an Intuitive Example - Zhihu Column](https://zhuanlan.zhihu.com/p/26945588)
- [Yale CS: Deadlock](https://www.cs.yale.edu/homes/aspnes/pinewiki/Deadlock.html)
- [University of Wisconsin CS 537 Notes: Deadlock](https://pages.cs.wisc.edu/~bart/537/lecturenotes/s12.html)
- [Oracle Java Tutorials: Deadlock](https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html)
- [Oracle JDK API: ReentrantLock](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [Oracle JDK API: ThreadMXBean](https://docs.oracle.com/javase/8/docs/api/java/lang/management/ThreadMXBean.html)
- [Oracle Troubleshooting Guide: The jstack Utility](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/tooldescr016.html)
- [Oracle Java Documentation: Virtual Threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [Linux Kernel Documentation: Runtime locking correctness validator](https://docs.kernel.org/locking/lockdep-design.html)
- [PostgreSQL Documentation: Lock Management](https://www.postgresql.org/docs/current/runtime-config-locks.html)
- [PostgreSQL Documentation: Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [PostgreSQL Documentation: pg_locks](https://www.postgresql.org/docs/current/view-pg-locks.html)
- [MySQL 8.4 Reference Manual: Deadlock Detection](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html)
- [MySQL 8.4 Reference Manual: InnoDB Error Handling](https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html)
