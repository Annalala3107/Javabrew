---
title: "Điều tra sự cố production Java Backend: CPU, Bộ nhớ, GC, Thread Pool, Cơ sở dữ liệu và Redis"
description: Hướng dẫn điều tra sự cố production Java backend, bao gồm xác nhận cảnh báo, cắt giảm tác động và giữ lại bằng chứng, CPU tăng vọt, OOM, GC dày đặc, cạn kiệt Thread Pool và Connection Pool, slow SQL, nghẽn Redis, tồn đọng message và hậu kiểm sự cố.
category: Java
tag:
  - JVM
  - Điều tra sự cố production
  - Tinh chỉnh hiệu năng
  - Phỏng vấn Java
lang: vi
sourceRef: zh-ref/java/jvm/jvm-in-action.md
sitemap:
  changefreq: monthly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Điều tra sự cố production Java,xử lý lỗi JVM,CPU tăng vọt,điều tra OOM,Full GC,cạn kiệt Thread Pool,cạn kiệt Connection Pool,slow SQL,sự cố Redis,tồn đọng MQ
---

Ngay khi cảnh báo vừa reo, việc điều tra rất dễ bị dẫn dắt theo đường cong nổi bật nhất trên trang giám sát. Thấy CPU cao liền bắt Thread Dump, thấy `Full GC` liền đi kiểm tra Heap, vừa deploy xong liền chuẩn bị rollback. Thế nhưng các hiện tượng này thường truyền dẫn qua lại lẫn nhau: slow SQL giữ chặt kết nối cơ sở dữ liệu, việc chờ Connection Pool lại làm nghẽn Thread nghiệp vụ, và cuối cùng bạn có thể thấy độ trễ, tỷ lệ lỗi và CPU cùng lúc tăng lên. Chỉ nhìn vào một chỉ số đơn lẻ thì rất khó xác định nguyên nhân gốc rễ.

Khi sự cố vẫn đang lan rộng, trước tiên hãy kiểm soát phạm vi ảnh hưởng theo kịch bản ứng phó (runbook). Nếu instance vẫn còn dư tải và xác nhận việc lấy bằng chứng không làm sập tiếp dịch vụ, hãy lưu lại log, Trace, Thread Dump và thông tin bộ nhớ. Khởi động lại thường giúp khôi phục tạm thời, nhưng cũng xóa sạch hiện trường; ngược lại, cứ để một instance bất thường tiếp tục gánh lưu lượng chỉ để lấy được Heap Dump cũng có thể làm vấn đề trầm trọng thêm. Tình hình thực tế tại hiện trường quyết định xem nên rút lưu lượng, rollback hay thu thập bằng chứng trước.

Dưới đây chỉ thảo luận các vấn đề thường gặp ở phía ứng dụng Java. Nếu bằng chứng đã trỏ về lập lịch container, nhân hệ điều hành (kernel), thiết bị mạng hoặc nền tảng đám mây, cần chuyển sang hệ thống giám sát và sổ tay vận hành tương ứng của nền tảng đó để tiếp tục điều tra, bài viết không đi sâu vào phần này.

::: warning Lưu ý thao tác trên môi trường production
Trước khi thực thi lệnh chẩn đoán trên môi trường production, hãy kiểm tra xem instance có đang gánh lưu lượng hay không, ổ đĩa còn bao nhiêu dung lượng trống và chi phí phụ trội của chính câu lệnh đó. Khi lấy Thread Dump liên tiếp cần kiểm soát tần suất; Heap Dump, class histogram và chủ động ép chạy GC có thể gây ra đột biến rõ rệt về CPU, I/O hoặc thời gian dừng (`pause`). Khi instance đã gần như mất khả năng phản hồi, hãy rút lưu lượng hoặc cắt lỗ trước, đừng vì giữ lại hiện trường mà tiếp tục để nó gánh lưu lượng nghiệp vụ.
:::

## Cần xác nhận gì trước tiên sau khi nhận cảnh báo?

Sau khi nhận cảnh báo, trước tiên hãy xem phía người dùng có dấu hiệu bất thường hay không. Một instance đơn lẻ bị CPU cao nhưng các request vẫn được các instance khác xử lý bình thường hoàn toàn không cùng cấp độ với việc tỷ lệ lỗi toàn dịch vụ cùng tăng lên. Cũng cần loại trừ cảnh báo giả từ hệ thống giám sát, độ trễ thu thập chỉ số, cũng như trường hợp dịch vụ hạ nguồn (downstream) timeout làm nghẽn Thread ngay trong dịch vụ hiện tại.

Hãy đặt các đường cong lưu lượng request, tỷ lệ lỗi, P95/P99, CPU, bộ nhớ, GC, Thread Pool và Connection Pool trong khoảng mười mấy phút trước và sau thời điểm cảnh báo cạnh nhau để xem, rồi đối chiếu với các mốc thời gian deploy, thay đổi cấu hình, tác vụ định kỳ (scheduled job) và tăng đột biến lưu lượng. Đồng thời kéo thêm cảnh báo từ cơ sở dữ liệu, Redis, hàng đợi thông điệp (Message Queue) và các API bên ngoài vào xem chung. Lần theo dòng thời gian để xác nhận những API và người dùng nào bị ảnh hưởng, bất thường bắt đầu từ lúc nào và chỉ số nào biến động sớm nhất.

Thời gian phản hồi trung bình bình thường không có nghĩa là mọi request đều bình thường. Một lượng nhỏ request cực chậm có thể rơi đúng vào các luồng nghiệp vụ trọng yếu như đăng nhập, đặt đơn hoặc thanh toán; lúc này P95/P99, tỷ lệ timeout và tỷ lệ thành công nghiệp vụ mới có giá trị tham khảo cao hơn.

## Cân đối giữa cắt giảm tác động và lưu giữ bằng chứng như thế nào?

Khi sự cố vẫn đang mở rộng, hãy ưu tiên cắt giảm tác động theo kịch bản ứng phó. Các biện pháp phổ biến bao gồm rollback phiên bản gần nhất, gỡ bỏ instance bất thường khỏi cân bằng tải, tắt các tác vụ định kỳ có vấn đề, giới hạn lưu lượng (rate limiting), ngắt mạch (circuit breaking), hạ cấp tính năng không cốt lõi (degradation) và mở rộng quy mô (scale out). Mỗi biện pháp đều có tác dụng phụ: scale out có thể tiếp tục đè nặng lên cơ sở dữ liệu, cơ chế retry sẽ khuếch đại lưu lượng xuống hạ nguồn, còn rollback cũng chưa chắc tương thích với dữ liệu đã bị thay đổi.

Khi điều kiện cho phép, trước khi khởi động lại hoặc rollback, hãy giữ lại những thông tin sau:

- Ảnh chụp màn hình giám sát hoặc khung thời gian trước và sau khi phát sinh cảnh báo.
- Log ứng dụng, access log, GC log và lịch sử thay đổi.
- Từ một đến ba bản Thread Dump cách nhau vài giây, thay vì chỉ lấy một bản duy nhất.
- Các lời gọi chậm, lời gọi lỗi và thời gian tiêu tốn ở thượng nguồn/hạ nguồn trong Trace.
- CPU của tiến trình, RSS, Heap, số lượng Thread, file descriptor và trạng thái kết nối mạng.
- Slow query của cơ sở dữ liệu, chờ khóa (lock wait), trạng thái Connection Pool, lệnh chậm Redis và độ trễ tồn đọng tiêu thụ MQ (`MQ lag`).

Ngay cả khi đã rút lưu lượng khỏi instance, cũng đừng vội mặc định rằng có thể lấy Heap Dump một cách an toàn. Việc kết xuất một Heap lớn cần đủ dung lượng đĩa và I/O, một số lệnh còn có thể gây ra khoảng dừng khá dài. Cách chắc chắn hơn là cấu hình sẵn trong tham số khởi động để tự động kết xuất khi gặp `OOM`, đồng thời ghi file dump vào thư mục có đủ dung lượng và quyền ghi phù hợp.

```bash
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/with/enough/space
```

## Làm sao phán đoán nhanh vấn đề nằm ở tầng nào?

Khi tạm thời chưa có manh mối từ chuỗi lời gọi (trace), hãy chọn điểm vào điều tra dựa theo hiện tượng trước. Mối tương ứng trong bảng không thể thay thế cho bước kiểm chứng sau đó.

| Hiện tượng | Ưu tiên kiểm tra |
| --- | --- |
| CPU cao, API đồng thời chậm đi | Thread nóng (hot threads), vòng lặp vô hạn, `Serialization`, tranh chấp khóa (`lock contention`), GC dày đặc |
| CPU không cao, Load rất cao | I/O đĩa, trạng thái ngủ không thể ngắt (`uninterruptible sleep`), lưu trữ mạng, giới hạn CPU của container |
| RSS tăng liên tục, Java Heap ổn định | Direct Memory, Thread Stack, `Metaspace`, JNI, thư viện native và ánh xạ bộ nhớ (`mmap`) |
| Vùng Old vẫn tăng liên tục sau khi thu gom | Đối tượng sống dài hạn, cache không giới hạn, tập hợp giữ tham chiếu, listener hoặc `ThreadLocal` |
| Số lượng Thread và độ dài hàng đợi tăng | Hạ nguồn chậm lại, chờ khóa, xử lý tác vụ chậm đi, cô lập Thread Pool chưa đủ |
| Thời gian chờ Database Connection Pool tăng | Slow SQL, transaction kéo dài, rò rỉ kết nối (`connection leak`), năng lực cơ sở dữ liệu không đủ |
| Redis RT tăng | Lệnh chậm, Big Key, Hot Key, rung lắc mạng (`network jitter`), chờ Connection Pool |
| MQ Lag tăng liên tục | Tiêu thụ chậm đi, phân chia partition không đều, retry message lỗi, năng lực hạ nguồn không đủ |

Vấn đề cũng có thể lan truyền xuyên tầng. Một câu slow SQL giữ chặt kết nối cơ sở dữ liệu, các Thread nghiệp vụ nối đuôi nhau bị chặn ở Connection Pool, hàng đợi Thread Pool bắt đầu dồn ứ, phía thượng nguồn timeout rồi retry, cuối cùng thứ bạn nhìn thấy là CPU, độ trễ và tỷ lệ lỗi cùng lúc tăng lên. Khi điều tra phải lần theo dòng thời gian để xác nhận chỉ số nào biến đổi đầu tiên.

## Điều tra CPU tăng vọt như thế nào?

Trước tiên hãy xác nhận mức CPU cao đến từ tiến trình nào, sau đó tìm ra Thread đang chiếm dụng CPU bên trong tiến trình đó. Dưới đây là cách điều tra phổ biến trên Linux:

```bash
# Tìm tiến trình Java
jps -l

# Xem mức sử dụng CPU của từng Thread trong tiến trình
top -H -p <pid>

# Cũng có thể xem mức sử dụng CPU theo từng Thread trong một khoảng thời gian
pidstat -t -p <pid> 1
```

ID Thread nhìn thấy trong `top -H` là số thập phân, còn `nid` trong Thread Dump thường dùng hệ thập lục phân (hex). Hãy chuyển đổi trước rồi mới tra cứu Thread tương ứng trong Thread Dump:

```bash
printf '%x\n' <tid>
jcmd <pid> Thread.print > /tmp/thread-dump.txt
```

Cần lấy liên tiếp vài bản Thread Dump. Nếu một Thread chỉ xuất hiện đang chạy JSON serialization trong đúng một bản dump, có thể chỉ là vô tình lấy mẫu trúng lúc đó; chỉ khi nhiều bản dump liên tiếp đều dừng ở cùng một đoạn mã thì mới đáng đi sâu kiểm tra tiếp. Các nguyên nhân thường gặp bao gồm:

- Vòng lặp hoặc đệ quy không thể thoát.
- Các tác vụ tính toán như serialize đối tượng lớn, quay lui biểu thức chính quy (regex backtracking) và mã hóa/giải mã.
- Cấp phát lượng lớn đối tượng gây ra GC dày đặc.
- Nhiều Thread tranh giành cùng một khóa, đi kèm với chuyển đổi ngữ cảnh (`context switch`).
- Lưu lượng tăng hoặc retry khuếch đại khiến CPU chỉ đơn thuần là đang làm nhiều việc hơn bình thường.

Khi CPU đã gần chạm ngưỡng 100%, đừng khởi chạy đồng thời nhiều tác vụ chẩn đoán tốn nhiều tài nguyên. Hãy rút bớt một phần lưu lượng hoặc chọn một instance bất thường để lấy bằng chứng, tránh việc thao tác chẩn đoán tiếp tục tranh giành tài nguyên.

## CPU không cao nhưng Load rất cao thì xử lý thế nào?

Linux Load Average thống kê cả các tác vụ đang chạy (`runnable`) lẫn các tác vụ đang ngủ không thể ngắt (`uninterruptible sleep`). Khi đĩa, lưu trữ mạng hoặc một số thao tác chờ I/O của kernel trở nên nghiêm trọng, tỷ lệ sử dụng CPU có thể không cao nhưng Load vẫn tăng liên tục.

```bash
vmstat 1
iostat -xz 1
pidstat -d -p <pid> 1
```

Tập trung quan sát hàng đợi chạy (`run queue`), chờ I/O và các tác vụ bị chặn trong `vmstat`, cũng như mức độ sử dụng thiết bị, thời gian chờ và độ dài hàng đợi trong `iostat`. `iostat` và `pidstat` thường do gói phần mềm `sysstat` cung cấp, cần kiểm tra trước xem môi trường production có sẵn hay không.

## API rất chậm nhưng CPU không cao thì điều tra thế nào?

Loại vấn đề này thường xảy ra ở khâu chờ đợi: chờ kết nối cơ sở dữ liệu, chờ phản hồi từ hạ nguồn, chờ khóa, chờ tác vụ trong Thread Pool hoặc chờ I/O đĩa.

Trước tiên hãy tìm đoạn tốn nhiều thời gian nhất từ Trace. Nếu không có Trace, có thể kết hợp thời gian xử lý request trong access log, slow query của cơ sở dữ liệu, chỉ số Connection Pool phía client và Thread Dump để thu hẹp phạm vi. Các trạng thái thường gặp trong Thread Dump gồm:

- Hàng loạt Thread dừng ở `getConnection()` của Database Connection Pool: kiểm tra thời gian chờ Connection Pool, số kết nối đang hoạt động (`active connections`), slow SQL và transaction kéo dài.
- Hàng loạt Thread dừng ở bước đọc phản hồi của HTTP client: kiểm tra độ trễ hạ nguồn, cấu hình timeout và số lần retry.
- Hàng loạt Thread ở trạng thái `BLOCKED`: kiểm tra Thread đang giữ khóa và các thao tác chậm bên trong vùng găng (`critical section`).
- Thread xử lý nghiệp vụ nhàn rỗi nhưng hàng đợi tác vụ lại chất đống: kiểm tra các Thread tiêu thụ (consumer), cách thức đẩy tác vụ vào và trạng thái của Executor.

Tổng thời gian của một request chậm phải khớp với tổng thời gian các giai đoạn. Nếu Trace chỉ ghi nhận thời gian chạy phương thức nghiệp vụ mà không ghi nhận thời gian chờ Connection Pool, xếp hàng trong Thread Pool và DNS/TLS phía client, ở giữa sẽ xuất hiện một khoảng trống không giải thích được và cần bổ sung giám sát hoặc instrumentation tương ứng.

## Bộ nhớ tăng liên tục và OOM điều tra như thế nào?

Trước tiên hãy phân biệt rõ vùng đang tăng là Java Heap, RSS của tiến trình hay tổng bộ nhớ của container. `-Xmx` chỉ giới hạn Java Heap; tiến trình còn sử dụng `Metaspace`, Code Cache, Thread Stack, Direct Memory, cấu trúc dữ liệu nội bộ của GC và bộ nhớ của thư viện native.

Kiểm tra số liệu từ cả hai phía JVM và hệ thống trước:

```bash
jcmd <pid> GC.heap_info
jcmd <pid> VM.flags
jcmd <pid> VM.native_memory summary
```

`VM.native_memory` phụ thuộc vào Native Memory Tracking (NMT), tính năng này cần được bật sẵn khi khởi động JVM, ví dụ `-XX:NativeMemoryTracking=summary`. Nó tạo ra chi phí phụ trội và không thể bật bổ sung tạm thời sau khi sự cố đã xảy ra.

NMT chủ yếu thống kê phần native memory do chính JVM/HotSpot quản lý, không thể bao phủ toàn bộ cấp phát bộ nhớ của JNI hoặc thư viện native bên thứ ba. Khi RSS tăng liên tục mà NMT không có biến động tương ứng, cần tiếp tục điều tra bằng các công cụ phân tích bộ nhớ của hệ điều hành và native memory.

Các thông báo `OOM` phổ biến tương ứng với các hướng điều tra khác nhau:

| Thông báo OOM | Hướng điều tra phổ biến |
| --- | --- |
| `Java heap space` | Đối tượng lớn, giữ tham chiếu, tập hợp không giới hạn, cache, một truy vấn trả về quá nhiều dữ liệu |
| `GC overhead limit exceeded` | Heap gần cạn kiệt, GC tốn rất nhiều thời gian nhưng thu hồi được rất ít |
| `Metaspace` | Sinh class động, rò rỉ `ClassLoader`, giới hạn trên của `Metaspace` đặt quá nhỏ |
| `Direct buffer memory` | NIO Direct Memory, Netty Buffer, giải phóng chậm trễ hoặc giới hạn trên chưa hợp lý |
| `unable to create native thread` | Số lượng Thread quá nhiều, giới hạn tiến trình của OS, thiếu bộ nhớ container, Stack mỗi Thread quá lớn |

Heap Dump có thể phân tích bằng các công cụ như MAT, VisualVM... Trước tiên hãy xem các đối tượng chiếm dung lượng lớn nhất, Dominator Tree, chuỗi tham chiếu tới GC Roots và các `ClassLoader` đáng nghi, đừng chỉ dựa vào số lượng đối tượng để kết luận.

Khi cần kết xuất thủ công, có thể sử dụng:

```bash
jcmd <pid> GC.heap_dump filename=/path/with/enough/space/heap.hprof
```

Lệnh này có thể tạo tác động rõ rệt lên ứng dụng. Trước khi chạy cần đánh giá kích thước Heap, dung lượng đĩa còn trống, I/O và rủi ro gây dừng (`pause`). Khi instance production vẫn đang gánh lưu lượng, hãy ưu tiên thao tác trên instance bất thường sau khi đã rút lưu lượng. `jmap -dump:live` có thể kích hoạt `Full GC`, không thích hợp coi là lệnh vô hại để thực thi tùy tiện.

## Làm sao phân biệt Memory Leak với tăng trưởng bình thường?

Hãy quan sát mức chiếm dụng Heap sau các lần thu gom toàn phần (`Full GC`). Nếu lưu lượng nghiệp vụ và quy mô dữ liệu ổn định, nhưng vùng Old vẫn tăng dần liên tục sau nhiều lần thu gom toàn phần, khi đó mới cần đặc biệt nghi ngờ có đối tượng không thể giải phóng. Quá trình làm nóng cache (`cache warm-up`), nạp class và tăng trưởng lưu lượng cũng có thể làm Heap tăng dần sau khi khởi động; chúng không nhất thiết là `Memory Leak`.

Khi phân tích cũng cần xem tại sao đối tượng lại bị giữ lại. Một `Map` rất lớn chỉ nói lên rằng nó đang chiếm bộ nhớ; lần theo chuỗi tham chiếu để tìm ra cache không giới hạn, tập hợp tĩnh (`static collection`), listener, `ThreadLocal` hoặc vòng đời session sai lệch mới xác định được chính xác vị trí cần sửa.

## Young GC xảy ra dày đặc điều tra thế nào?

`Young GC` dày đặc thường cho thấy tốc độ cấp phát đối tượng nhanh hoặc dung lượng Young Generation không đủ. Trước tiên hãy xem tốc độ cấp phát, lượng đối tượng còn sống sau mỗi lần thu gom và thời gian dừng, rồi mới đánh giá xem cần sửa code hay điều chỉnh tham số.

```bash
jstat -gcutil <pid> 1000 10
jcmd <pid> GC.heap_info
```

Các nguyên nhân phổ biến gồm: một câu truy vấn nạp lượng lớn đối tượng, API trả về kết quả quá lớn, ghi log hoặc `Serialization` tạo hàng loạt đối tượng tạm, xử lý theo lô (`batch processing`) không kiểm soát kích thước lô, và cấu hình Young Generation không khớp với tải thực tế.

Điều chỉnh Young Generation chỉ thay đổi nhịp điệu GC, không thể sửa được câu truy vấn không giới hạn hay đoạn mã cấp phát quá nhiều bộ nhớ. Trước tiên hãy xác nhận đối tượng được sinh ra từ đâu thông qua GC log, JFR, lấy mẫu cấp phát (`allocation profiling`) hoặc kiểm thử tải. Sau khi sửa tham số, cần so sánh thông lượng, P95/P99, số lần GC và tổng thời gian dừng dưới cùng điều kiện lưu lượng và dữ liệu.

## Full GC xảy ra dày đặc điều tra thế nào?

Trước tiên hãy xác nhận từ GC log nguyên nhân kích hoạt, mức chiếm dụng trước và sau thu gom cũng như thời gian dừng. Các trường log và nguyên nhân kích hoạt của từng bộ thu gom khác nhau không hoàn toàn giống nhau, đừng quy mọi `Full GC` về câu "Old Generation đã đầy".

Khi điều tra tập trung xem:

- Mức chiếm dụng vùng Old sau khi thu gom có giảm rõ rệt hay không.
- Đối tượng lớn và đối tượng thăng cấp (`promotion`) có quá nhiều hay không.
- `Metaspace` có đang tiệm cận giới hạn trên hay không.
- Có tồn tại lời gọi `System.gc()` tường minh hoặc bị kích hoạt bởi công cụ chẩn đoán hay không.
- Kích thước Heap, giới hạn bộ nhớ container và cấu hình bộ thu gom có khớp nhau hay không.
- Ngay trước khi xảy ra GC có xuất hiện tăng lưu lượng, chạy batch job hay làm mới cache hay không.

Nếu mức chiếm dụng sau thu gom vẫn rất cao, hãy tiếp tục phân tích việc giữ tham chiếu đối tượng; nếu hiệu quả thu gom bình thường nhưng lại đầy trở lại rất nhanh, hãy tập trung kiểm tra tốc độ cấp phát, tốc độ thăng cấp và dung lượng Heap. Trước khi thay đổi tham số JVM, hãy xác nhận hành vi của ứng dụng trước; nếu không, việc tăng kích thước Heap chỉ trì hoãn lần sự cố tiếp theo, đồng thời có thể làm tăng chi phí tạm dừng hoặc chi phí kết xuất dump.

## Hàng đợi Thread Pool bị tồn đọng điều tra thế nào?

Với vấn đề Thread Pool, không thể chỉ nhìn vào số Thread đang hoạt động (`active threads`). Tối thiểu phải giám sát đồng thời các chỉ số sau:

- `corePoolSize`, `maximumPoolSize` và số lượng Thread hiện tại.
- Số Thread đang hoạt động, độ dài hàng đợi và sức chứa của hàng đợi (`queue capacity`).
- Tốc độ đẩy tác vụ (`submission rate`), tốc độ hoàn thành (`completion rate`), thời gian chờ trong hàng đợi và thời gian thực thi.
- Số lần bị từ chối và `Rejection Policy` cụ thể.

Hàng đợi tăng liên tục cho thấy tốc độ tác vụ đi vào cao hơn tốc độ hoàn thành. Nguyên nhân có thể là lưu lượng tăng đột biến, hoặc bản thân tác vụ chạy chậm đi, ví dụ chờ kết nối cơ sở dữ liệu, timeout hạ nguồn hoặc tranh chấp khóa. Tăng thẳng số lượng Thread sẽ làm tăng lượng truy cập đồng thời vào cơ sở dữ liệu, Redis và các API bên ngoài, có khả năng đẩy vấn đề sang tầng hạ nguồn.

Điều tra theo trình tự dưới đây:

1. Xác nhận những tác vụ nghiệp vụ nào đang dùng Thread Pool này, có bị trộn lẫn tác vụ không liên quan hay không.
2. So sánh tốc độ đẩy tác vụ, tốc độ hoàn thành, thời gian xếp hàng và thời gian thực thi.
3. Trích xuất Thread Dump của các Thread đang chạy tác vụ để xác nhận chúng đang tính toán hay đang chờ đợi.
4. Kiểm tra xem Connection Pool của cơ sở dữ liệu, HTTP và Redis có đang bị cạn kiệt đồng thời hay không.
5. Dựa theo mức độ quan trọng của tác vụ để quyết định giới hạn lưu lượng, hạ cấp, mở rộng, cô lập hay chiến lược loại bỏ.

`CallerRunsPolicy` sẽ khiến chính Thread gửi tác vụ tự thực thi tác vụ đó, có thể tạm thời làm chậm tốc độ đẩy tác vụ vào, nhưng khi Thread xử lý web request bị các tác vụ dài chiếm giữ theo cách này, độ trễ của API cũng sẽ tăng theo. Chính sách này có phù hợp với Thread Pool hiện tại hay không cần đánh giá dựa trên bên gọi và loại tác vụ.

## Database Connection Pool bị cạn kiệt điều tra thế nào?

Khi Connection Pool bị cạn kiệt, trước tiên hãy xem số kết nối đang hoạt động, số kết nối nhàn rỗi, số Thread đang chờ và thời gian lấy được kết nối. Khi hàng loạt Thread nghiệp vụ đang chờ kết nối, thông thường tiếp tục kiểm tra theo ba hướng:

- SQL thực thi chậm, kết nối không thể trả về kịp thời.
- Phạm vi transaction quá lớn, chứa cả lời gọi từ xa, xử lý file hoặc tính toán nặng.
- Code không đóng kết nối đúng cách ở mọi nhánh rẽ, gây ra rò rỉ kết nối (`connection leak`).

Ở phía cơ sở dữ liệu hãy kiểm tra thêm các phiên đang chạy, slow query, chờ khóa, transaction kéo dài và tài nguyên của instance. Với MySQL có thể kết hợp `SHOW PROCESSLIST`, slow query log, Performance Schema, `EXPLAIN` và thông tin khóa transaction của InnoDB để định vị. Kế hoạch thực thi (`execution plan`) đến từ câu SQL hiện tại, tham số và phân bố dữ liệu; việc "ăn index" ở môi trường test không chứng minh được môi trường production chắc chắn giống hệt.

Trước khi mở rộng Connection Pool, cần xác nhận cơ sở dữ liệu vẫn còn chịu được thêm mức độ đồng thời cao hơn. Số lượng instance ứng dụng nhân với giới hạn tối đa Connection Pool của mỗi instance mới là tổng số kết nối mà cơ sở dữ liệu có thể phải đối mặt; sau khi scale out dịch vụ, tổng số này cũng tăng theo.

Nội dung liên quan: [Phân tích kế hoạch thực thi MySQL](../../database/mysql/mysql-query-execution-plan.md), [Tổng hợp tối ưu SQL](../../high-performance/sql-optimization.md).

## Redis bị chậm điều tra thế nào?

Khi ứng dụng gọi Redis bị chậm, trước tiên hãy tách biệt giữa chờ đợi ở phía client và thực thi ở phía server. Cạn kiệt Connection Pool, rung lắc mạng và vấn đề DNS đều có thể khiến một lần gọi Redis bị chậm, ngay cả khi bản thân câu lệnh thực thi rất nhanh.

Ở phía Redis server tập trung xem:

- Độ trễ lệnh và slow log.
- CPU, bộ nhớ, lưu lượng mạng và số lượng kết nối.
- Big Key, Hot Key, xóa key hết hạn và các thao tác lưu trữ bền vững (`persistence`).
- Độ trễ sao chép master-replica, trạng thái cluster và chuyển đổi dự phòng (`failover`).

`SLOWLOG GET` chỉ ghi lại thời gian thực thi của lệnh trên Redis server, không bao gồm thời gian xếp hàng và truyền tải qua mạng. Khi tổng thời gian phía ứng dụng rất cao mà Slow Log bình thường, hãy tiếp tục kiểm tra chờ Connection Pool, mạng và xử lý ở phía client.

Khi điều tra Big Key có thể dùng các công cụ như `redis-cli --bigkeys`, nhưng nó cần quét không gian key nên sẽ làm tăng tải phụ trội. Trên môi trường production nên chọn giờ thấp điểm, node replica hoặc lấy mẫu có kiểm soát, đồng thời xác nhận trước tác động của câu lệnh đối với phiên bản và cluster hiện tại. Tuyệt đối không chạy trực tiếp `KEYS *` trên môi trường production.

Hot Key cần kết hợp tần suất truy cập và tải của node để xác nhận. Chỉ nhìn vào dung lượng của Key sẽ không tìm ra được những Key nhỏ nhưng có số lần đọc cực cao; có thể thu thập bằng chứng thông qua tầng proxy, thống kê phía client, nền tảng giám sát hoặc năng lực phân tích Hot Key có kiểm soát.

Nội dung liên quan: [Các câu hỏi phỏng vấn Redis thường gặp](../../database/redis/redis-questions-02.md).

## Message Queue bị tồn đọng điều tra thế nào?

Trước tiên hãy so sánh tốc độ sản xuất (`production rate`) và tốc độ tiêu thụ (`consumption rate`), đồng thời xác nhận tình trạng tồn đọng tập trung ở Topic, queue hoặc partition nào. Tiếp theo kiểm tra xem các consumer instance còn sống hay không, Thread tiêu thụ có bị chặn hay không, thời gian xử lý từng message có thay đổi không, và cơ sở dữ liệu hay API hạ nguồn có đang chậm lại không.

Các nguyên nhân thường gặp bao gồm:

- Lưu lượng tăng, tốc độ đẩy tin nhắn vượt quá năng lực thiết kế.
- Một loại message nào đó xử lý chậm, kéo chậm cả partition hoặc queue.
- Message lỗi bị retry liên tục, tạo thành bão retry (`retry storm`).
- Phân bổ partition không đều hoặc consumer bị Rebalance liên tục.
- Tiêu thụ thành công nhưng commit offset thất bại, gây ra tiêu thụ trùng lặp.
- Cơ sở dữ liệu, Redis hoặc API bên ngoài ở hạ nguồn trở thành điểm nghẽn cổ chai.

Việc tăng số lượng consumer có hiệu quả hay không phụ thuộc vào mô hình của Message Queue. Trong cùng một consumer group của Kafka, mức độ song song hiệu quả bị giới hạn bởi số partition; tiếp tục tăng consumer khi không còn partition để phân chia sẽ không làm tăng thông lượng. Ngay cả khi tăng thêm partition và consumer, cũng phải xác nhận năng lực hạ nguồn để tránh việc lưu lượng tồn đọng dội ào xuống cơ sở dữ liệu cùng một lúc sau khi tốc độ tiêu thụ phục hồi.

Trong thời gian xử lý tồn đọng còn phải đảm bảo tính lũy đẳng (`idempotency`), giám sát lỗi tiêu thụ và dead-letter queue (`DLQ`). Khi cần bỏ qua một message bất thường, hãy lưu giữ nội dung message và nguyên nhân lỗi để bù đắp xử lý sau, thay vì vứt bỏ thẳng.

Nội dung liên quan: [Các vấn đề thường gặp về Message Queue](../../high-performance/message-queue/message-queue.md).

## API hạ nguồn bị timeout điều tra thế nào?

Trước tiên hãy tách nhỏ thời gian của một lời gọi: chờ Connection Pool, DNS, bắt tay TCP, bắt tay TLS, gửi request, xử lý ở server và đọc response. Các giai đoạn khác nhau cần cấu hình timeout khác nhau; chỉ đặt một mức timeout tổng duy nhất sẽ rất khó phán đoán thời gian đã tiêu tốn vào đâu.

Khi kiểm tra phía bên gọi cần tập trung xem:

- Connect timeout, read timeout và ngân sách tổng của cả chuỗi lời gọi.
- Số kết nối đang hoạt động, hàng đợi chờ và mức độ tái sử dụng kết nối của HTTP Connection Pool.
- Số lần retry, chiến lược lùi thời gian (`backoff`) và những loại lỗi nào sẽ kích hoạt retry.
- Trạng thái circuit breaker, kết quả hạ cấp (`fallback`) và tỷ lệ thành công ngay lần request đầu tiên.

Khi hạ nguồn đã chậm sẵn, việc retry ở nhiều tầng sẽ nhanh chóng khuếch đại lưu lượng. Nếu gateway, dịch vụ nghiệp vụ và SDK mỗi nơi retry ba lần, trong trường hợp xấu nhất sẽ tạo ra lượng request vượt xa một lời gọi đơn lẻ. Trước hết hãy giới hạn số tầng retry và tổng ngân sách, sau đó mới căn cứ vào việc API có tính lũy đẳng hay không để quyết định có được phép retry hay không.

## Xâu chuỗi quy trình điều tra qua một API chậm

Giả sử API truy vấn đơn hàng sau một đợt phát hành phiên bản mới có P99 tăng lên và tỷ lệ lỗi cũng bắt đầu tăng, hãy điều tra theo thứ tự bên dưới. Ví dụ này dùng để minh họa phương pháp, không đại diện cho sự cố production có thật.

1. Xác nhận từ hệ thống giám sát rằng vấn đề bắt đầu sau đợt phát hành, tập trung ở các instance phiên bản mới và API truy vấn đơn hàng.
2. Tạm dừng việc phát hành tiếp và rút bớt một số instance bất thường; tỷ lệ lỗi giảm xuống, kiểm soát phạm vi ảnh hưởng trước.
3. So sánh Trace giữa các instance cũ và mới, phát hiện phần lớn thời gian tiêu tốn ở việc lấy kết nối cơ sở dữ liệu và thực thi truy vấn.
4. Giám sát Connection Pool cho thấy số Thread chờ tăng lên, và log slow query của cơ sở dữ liệu xuất hiện cùng một câu SQL.
5. Kiểm tra execution plan bằng điều kiện truy vấn tương ứng với tham số thực tế trên production, phát hiện điều kiện lọc mới thêm làm cho composite index ban đầu không thể lọc hiệu quả và phát sinh thêm thao tác sắp xếp (`sort`).
6. Chỉnh sửa câu truy vấn và index trên môi trường test có phân bố dữ liệu gần với production, so sánh số dòng quét (`rows scanned`), P95/P99, CPU và mức chiếm dụng kết nối.
7. Sau khi đưa thay đổi qua canary rollout, tiếp tục theo dõi slow query, chờ Connection Pool và tỷ lệ lỗi nghiệp vụ rồi mới khôi phục dần lưu lượng.
8. Khi hậu kiểm (postmortem), bổ sung kiểm thử hiệu năng cho kịch bản truy vấn tương ứng và các hạng mục giám sát sau khi phát hành.

Trong kịch bản giả định này, tình trạng dồn ứ ở Thread Pool và Connection Pool xuất hiện sau slow SQL; execution plan và bản ghi slow query đã trỏ nguyên nhân gốc về câu SQL. Nếu ở bước 4 phát hiện SQL chạy rất nhanh mà thời gian chủ yếu tiêu tốn bên ngoài Connection Pool, thì phải quay lại các giả thuyết khác để tiếp tục kiểm chứng.

## Sau khi sửa xong kiểm chứng thế nào?

Sau khi sửa code hoặc cấu hình xong, còn phải xác nhận các chỉ số phía người dùng đã khôi phục, các biện pháp tạm thời có thể thu hồi an toàn và không phát sinh vấn đề dữ liệu mới.

Khi kiểm chứng, hãy đối chiếu cùng một bộ chỉ số ở các mốc trước sự cố, trong sự cố và sau khi sửa: lưu lượng request, P95/P99, tỷ lệ lỗi, tỷ lệ thành công nghiệp vụ, CPU, bộ nhớ, GC, Thread Pool, Connection Pool và độ trễ của các thành phần phụ thuộc. Khi có liên quan đến tiêu thụ trùng lặp, tồn kho, đơn hàng và trạng thái dòng tiền, cần tiến hành đối soát dữ liệu (`data reconciliation`).

Các thay đổi về hiệu năng phải được so sánh dưới điều kiện tương đồng về lượng dữ liệu, mô hình lưu lượng, cấu hình máy và trạng thái cache. Chỉ chạy một lần kiểm thử tải cho một API đơn lẻ không thể đại diện cho việc toàn bộ luồng nghiệp vụ đã hồi phục. Chi tiết có thể tham khảo: [Nhập môn kiểm thử hiệu năng và kiểm thử áp lực](../../high-availability/performance-test.md).

## Hậu kiểm sự cố (Postmortem) nên ghi lại những gì?

Bản hậu kiểm cần để lại tài liệu có thể dùng trực tiếp cho lần sự cố tiếp theo. Tài liệu tối thiểu cần lưu giữ:

- Dòng thời gian sự cố, phạm vi ảnh hưởng và biểu hiện phía người dùng.
- Nguyên nhân trực tiếp, điều kiện kích hoạt và tại sao sự cố lại lan rộng.
- Các bằng chứng đã dùng trong quá trình cắt giảm tác động, định vị nguyên nhân và khắc phục.
- Những cảnh báo, kịch bản ứng phó hoặc bài test nào đã không phát huy tác dụng.
- Các hạng mục cải tiến tiếp theo, người phụ trách và thời hạn hoàn thành.

Những mục như "lập trình viên cần tăng cường review code" rất khó kiểm chứng đã hoàn thành hay chưa. Hạng mục cải tiến cần gắn vào cơ chế cụ thể, ví dụ bổ sung cảnh báo cho thời gian chờ Connection Pool, giới hạn số bản ghi truy vấn theo lô, bổ sung bài test tính lũy đẳng cho tiêu thụ message, hoặc thêm bước kiểm tra đối chiếu các API trọng yếu vào quy trình phát hành.

## Trả lời câu hỏi điều tra sự cố production trong phỏng vấn như thế nào?

Khi người phỏng vấn hỏi "CPU trên production tăng vọt thì xử lý thế nào?", có thể trình bày trình tự tổng quát trước, rồi kết hợp với tình huống bản thân đã từng làm:

> Trước tiên tôi sẽ xác nhận phạm vi ảnh hưởng, lưu lượng và các thay đổi gần đây để đánh giá xem có cần rút instance, giới hạn lưu lượng hay rollback không. Khi điều kiện cho phép sẽ giữ lại dữ liệu giám sát, log và nhiều bản Thread Dump. Sau khi xác nhận CPU cao đúng là từ tiến trình Java, tôi dùng `top -H` hoặc `pidstat -t` để tìm các Thread nóng, chuyển Thread ID sang hệ thập lục phân rồi đối chiếu với `nid` trong Thread Dump. Lấy mẫu liên tiếp để xác nhận Thread bị kẹt lâu ở đoạn code nào, rồi kết hợp với GC, Trace và lưu lượng để phán đoán xem đó là điểm nóng tính toán, vòng lặp vô hạn, tranh chấp khóa hay GC dày đặc. Sau khi sửa xong sẽ kiểm chứng lại bằng đúng kịch bản đó, đồng thời bổ sung giám sát và test hồi quy.

Nếu chưa từng xử lý sự cố production thật, có thể trình bày rõ mình đã diễn tập những kịch bản nào trên môi trường test và đã tham khảo những tình huống thực tế nào. Đừng biến bài viết mình từng đọc thành sự cố do chính mình trực tiếp phụ trách.

## Tra cứu nhanh các công cụ thường dùng

| Công cụ | Công dụng phổ biến | Lưu ý khi sử dụng |
| --- | --- | --- |
| `top`, `pidstat` | CPU và I/O của tiến trình và Thread | Xác nhận trước phạm vi quan sát giữa container và máy chủ host |
| `vmstat`, `iostat` | Hàng đợi chạy hệ thống, bộ nhớ và đĩa | Cần kết hợp xu hướng trong một khoảng thời gian |
| `jcmd` | Thread Dump, thông tin Heap, JFR, class histogram | Một số lệnh có chi phí cao, cần đánh giá trước khi chạy |
| `jstat` | Biến động của GC và các vùng bộ nhớ | Lấy mẫu liên tiếp hữu ích hơn nhiều so với số liệu tại một điểm |
| JFR, JMC | Phân tích sự kiện CPU, cấp phát, khóa, I/O... | Cấu hình thu thập phải cân nhắc chi phí trên môi trường production |
| MAT, VisualVM | Phân tích Heap Dump | Tập trung xem chuỗi tham chiếu và GC Roots |
| Arthas | Thời gian chạy phương thức, Thread, class và chẩn đoán runtime | Khi chạy Trace/Watch trên phương thức lưu lượng cao cần giới hạn phạm vi |
| Nền tảng Trace / Giám sát | Chuỗi request, tỷ lệ lỗi, độ trễ và thành phần phụ thuộc | Chú ý tỷ lệ lấy mẫu, che giấu dữ liệu nhạy cảm và đồng bộ thời gian |

## Đọc thêm đề xuất

- [Tổng hợp công cụ giám sát và xử lý sự cố JDK](./jdk-monitoring-and-troubleshooting-tools.md)
- [Tổng hợp các tham số JVM quan trọng nhất](./jvm-parameters-intro.md)
- [Giải thích chi tiết về Garbage Collection trong JVM](./jvm-garbage-collection.md)
- [Giải thích chi tiết về Java Thread Pool](../concurrent/java-thread-pool-summary.md)
- [Giải thích chi tiết về Deadlock](../../cs-basics/operating-system/dead-lock.md)
- [Hướng dẫn xử lý sự cố Java của Oracle: Memory Leaks](https://docs.oracle.com/en/java/javase/17/troubleshoot/troubleshooting-memory-leaks.html)
- [Điều tra vấn đề độ trễ Redis](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)
- [Redis Slow Log](https://redis.io/docs/latest/commands/slowlog/)
- [Phân tích một sự cố OOM trên production](https://juejin.cn/post/7205141492264976445)
- [Phân tích và giải quyết 9 vấn đề CMS GC thường gặp trong Java](https://tech.meituan.com/2020/11/12/java-9-cms-gc.html)
