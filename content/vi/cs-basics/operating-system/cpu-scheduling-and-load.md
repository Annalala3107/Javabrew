---
title: Giải thích chi tiết về CPU Scheduling và Tải hệ thống (System Load)
description: Tổng hợp các câu hỏi phỏng vấn tần suất cao về CPU scheduling và system load. Bắt đầu từ lý do process và thread cần được điều phối, làm rõ preemption, time slice, độ ưu tiên, context switch, các thuật toán điều phối kinh điển, Linux CFS/EEVDF, load average, CPU utilization, I/O wait và các lệnh chẩn đoán sự cố thông dụng.
category: Cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
  - CPU Scheduling
head:
  - - meta
    - name: keywords
      content: CPU scheduling, điều phối tiến trình, điều phối luồng, tải hệ thống, load average, CPU utilization, iowait, CFS, EEVDF, top, uptime, vmstat, pidstat, mpstat, perf top, câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/cpu-scheduling-and-load.md
---

CPU scheduling (điều phối CPU) không chỉ đơn thuần là những thuật ngữ thuật toán như FCFS, RR hay CFS. Khi xử lý sự cố thực tế trong môi trường production, bạn còn cần hiểu rõ tại sao thread bị hoán đổi ra ngoài, chi phí của context switch (chuyển đổi ngữ cảnh) nằm ở đâu, và ý nghĩa của việc load average rất cao nhưng CPU utilization (mức sử dụng CPU) lại không cao.

Đằng sau những câu hỏi này là cùng một tập hợp ràng buộc: Số lượng CPU core có hạn, các tác vụ cần phải xếp hàng chờ, và scheduler (bộ điều phối) chịu trách nhiệm quyết định ai được chạy trước; các chỉ số hệ thống sẽ giúp xác định xem các tác vụ đang tranh chấp CPU, đang chờ I/O, hay bị tắc nghẽn ở tầng kernel, interrupt (ngắt) hoặc virtualization (ảo hóa).

Ví dụ, trên một máy chủ có 8 logical CPU (CPU logic), load average đã lên tới 40, nhưng CPU vẫn còn nhàn rỗi (`idle`), chỉ số `wa` trong `%Cpu(s)` lại liên tục ở mức cao. Lúc này, nếu cắm đầu đi tìm các hàm tiêu tốn nhiều CPU (CPU hotspot) thì nhiều khả năng sẽ không thu được kết quả gì; thực tế máy chủ có thể đang tồn đọng một lượng lớn tác vụ đang chờ I/O. CPU utilization và load average cần phải được đánh giá tách biệt nhau.

## Tại sao cần có CPU Scheduling

Số lượng CPU core có hạn, trong khi số lượng tác vụ sẵn sàng chạy (runnable task) có thể rất nhiều.

Trong một dịch vụ Java, business thread (luồng xử lý nghiệp vụ), GC thread, JIT compiler thread, Netty event loop thread đều có thể cần chạy; cùng máy chủ đó còn có thể có log collector (thu thập log), monitoring agent (giám sát), cron job và database client. Nếu hệ thống có 8 logical CPU khả dụng, tại một thời điểm chỉ có tối đa khoảng 8 runnable task có thể chiếm dụng CPU, các task còn lại chỉ có thể xếp hàng chờ, chuyển sang trạng thái ngủ (sleep) hoặc chờ I/O. Trong môi trường container, bạn còn phải xem xét CPU quota, chứ không thể chỉ nhìn vào số core vật lý của máy chủ host.

Mỗi hệ thống có cách gọi đối tượng điều phối không hoàn toàn giống nhau. Khi phân tích backend, trước tiên có thể hiểu scheduling entity (thực thể điều phối) của Linux là đơn vị thực thi có thể được kernel sắp xếp độc lập lên CPU để chạy.

Một process (tiến trình) có thể chứa nhiều thread (luồng). Chúng chia sẻ không gian địa chỉ của process và các file descriptor, nhưng mỗi thread có stack, thanh ghi (registers), program counter riêng để lưu trữ ngữ cảnh thực thi.

![Mối quan hệ giữa chương trình, tiến trình và luồng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/relationship-between-program-process-and-thread-97be3e79.png)

Bên trong Linux kernel, cả process và thread đều được biểu diễn bằng `task`; scheduler trên thực tế điều phối các task hoặc scheduling entity. Một thread mà người dùng thấy ở user space hầu hết đều tương ứng với một schedulable task trong kernel.

Nếu không có scheduling, một vòng lặp vô tận (dead loop) trên máy tính đơn nhân có thể chiếm trọn CPU mãi mãi, khiến các chương trình khác không còn cơ hội phản hồi. Máy tính đa nhân chỉ nâng số lượng task có thể chạy cùng một lúc từ 1 lên N; một khi số lượng task vượt quá số core, việc xếp hàng và chuyển đổi (switch) vẫn bắt buộc phải diễn ra.

Scheduler phải cân đối giữa tính tương tác/phản hồi nhanh, tính công bằng, throughput (thông lượng), độ ưu tiên, real-time task (tác vụ thời gian thực), điện năng tiêu thụ và cache locality (tính cục bộ của bộ nhớ cache). Các mục tiêu này thường kiềm chế lẫn nhau: time slice dài hơn sẽ giảm bớt số lần chuyển đổi, nhưng tác vụ tương tác có thể phải đợi lâu hơn; time slice ngắn hơn giúp tăng tốc phản hồi, nhưng chi phí context switch lại tăng lên.

![Sơ đồ quan hệ đánh đổi trong CPU scheduling](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/scheduler-tradeoff-triangle-1f064b3b.webp)

## Các trường hợp khiến một tác vụ rời khỏi CPU

Một task rời khỏi CPU nhìn chung có vài nhóm nguyên nhân. Việc hết time slice chỉ là một trong số đó.

Phổ biến nhất là task chủ động nhường CPU (voluntary yield). Ví dụ, khi một thread gọi hàm `read()` để đọc dữ liệu từ đĩa, dữ liệu chưa sẵn sàng nên nó sẽ chuyển sang trạng thái chờ (waiting); khi thread chờ lock (khóa), condition variable (biến điều kiện), timer, nó cũng sẽ rời khỏi trạng thái đang chạy (running state). CPU không nên ngồi chờ vô ích cùng nó, scheduler sẽ chọn một runnable task khác để thực thi.

Một trường hợp khác là bị chiếm quyền điều khiển (preemption - tranh đoạt). Các hệ điều hành đa dụng thường áp dụng cơ chế preemptive scheduling (điều phối ưu tiên/tranh đoạt). Sau khi một task chạy được một khoảng thời gian, timer interrupt (ngắt đồng hồ) sẽ tạo cơ hội cho kernel kiểm tra; nếu task hiện tại đã chạy đủ lâu, hoặc có task phù hợp hơn chuyển sang trạng thái runnable, kernel có thể hoán đổi task hiện tại ra ngoài.

Nhiều giáo trình để giải thích rõ khái niệm preemption thường đơn giản hóa quy trình này thành: bộ định thời (timer) phát ra timer interrupt theo chu kỳ định sẵn.

Mô hình này giải thích được cơ chế đại thể của preemption. Tuy nhiên, Linux hiện đại hỗ trợ chế độ `NO_HZ` / tickless, giúp giảm bớt scheduling clock tick trên CPU nhàn rỗi hoặc trong các cấu hình cụ thể. Timer và scheduling tick là cơ chế quan trọng để kernel có cơ hội kiểm tra preemption, nhưng các máy chủ production không nhất thiết phải phát tick với tần số cố định liên tục.

Độ ưu tiên (priority) cũng ảnh hưởng đến việc điều phối. Task có độ ưu tiên cao hơn sẽ được xếp lên đầu hàng đợi, khiến task có độ ưu tiên thấp dễ phải chờ đợi hơn. Nếu hệ thống thiên vị hoàn toàn cho các task ưu tiên cao, task ưu tiên thấp có thể không bao giờ nhận được CPU trong thời gian dài, dẫn đến starvation (đói tài nguyên). Các thuật toán trong sách giáo khoa thường dùng dynamic priority (độ ưu tiên động), aging (lão hóa) hoặc thăng hạng hàng đợi để giảm thiểu starvation; cách xử lý trong hệ thống thực tế phụ thuộc vào scheduling class và triển khai cụ thể.

Context switch xảy ra ngay tại thời điểm hoán đổi task. Kernel phải lưu lại ngữ cảnh thực thi của task hiện tại gồm thanh ghi, program counter, stack pointer... rồi khôi phục ngữ cảnh của task tiếp theo. Việc chuyển đổi giữa các process khác nhau còn mang lại chi phí phát sinh do cập nhật bảng trang (page table), làm mất hiệu lực TLB và suy giảm cache locality. Khi có quá nhiều thread, cạnh tranh lock gay gắt, các task liên tục ngủ rồi thức giấc, mã nghiệp vụ chưa chạy được bao nhiêu thì thời gian CPU đã bị tiêu tốn phần lớn vào scheduling và synchronization (đồng bộ hóa).

Số lượng thread cần được thiết lập kết hợp giữa đặc tính tác vụ và số lượng CPU core. Thread có thể che giấu thời gian chờ I/O và tận dụng đa nhân; nhưng khi số lượng thread lớn hơn rất nhiều so với số CPU core, độ dài run queue, tần suất context switch, tỷ lệ cache miss và tranh chấp lock đều sẽ tăng vọt theo.

## Các thuật toán điều phối kinh điển

Trong các buổi phỏng vấn, nhà tuyển dụng thường hỏi về FCFS, SJF, RR, Priority Scheduling và Multi-Level Feedback Queue (hàng đợi phản hồi nhiều mức).

Đưa các thuật toán này vào bài toán cụ thể về cách xếp hàng giữa tác vụ ngắn, tác vụ dài và tác vụ tương tác sẽ giúp ta thấy rõ sự khác biệt. Hãy nhớ rằng đây chủ yếu là các mô hình đơn giản hóa trong giáo trình; việc điều phối tác vụ thông thường trên Linux thực tế không sao chép nguyên xi một thuật toán nào, mà còn liên quan đến CFS/EEVDF, real-time scheduling class, cgroup, CPU affinity, NUMA...

| Thuật toán | Cơ chế chọn | Vấn đề thường bị hỏi sâu |
| --- | --- | --- |
| FCFS | Đến trước phục vụ trước (First-Come, First-Served) | Tác vụ dài xếp phía trước khiến tác vụ ngắn cũng phải chờ (hiệu ứng convoy) |
| SJF | Tác vụ có thời gian chạy dự kiến ngắn nhất được chạy trước | Rất khó biết trước tác vụ cần chạy bao lâu; tác vụ dài có thể bị starvation |
| RR | Mỗi tác vụ luân phiên chạy trong một time slice (Round Robin) | Time slice quá ngắn làm tăng chi phí context switch; quá dài lại biến thành FCFS |
| Priority Scheduling | Tác vụ có độ ưu tiên cao chạy trước | Tác vụ ưu tiên thấp có thể chờ CPU vô thời hạn (starvation) |
| Multi-Level Feedback Queue | Nhiều hàng đợi ưu tiên, điều chỉnh vị trí theo hành vi chạy | Nhiều quy tắc và tham số, triển khai phức tạp |

Ví dụ, nếu ở đầu hàng đợi thread pool có vài tác vụ nén file dung lượng lớn, rất nhiều request phía sau chỉ cần đọc cache cũng sẽ phải xếp hàng chờ, khiến thời gian phản hồi trung bình bị kéo tụt bởi các tác vụ dài. SJF có thể cải thiện tình huống này, nhưng đòi hỏi tiền đề rất ngặt nghèo: hệ thống phải biết trước mỗi tác vụ sẽ chạy trong bao lâu. Hệ thống thực tế không có góc nhìn toàn tri như vậy, mà chỉ có thể phán đoán dựa trên hành vi lịch sử, thời gian chờ I/O và đặc tính tương tác.

RR giống như mô hình nhập môn của các hệ thống chia sẻ thời gian (time-sharing). Mỗi task chạy một time slice rồi được đưa trở lại cuối hàng đợi. Khi người dùng gõ lệnh, di chuột, gửi request, họ không cần phải đợi tác vụ dài kết thúc hoàn toàn mới nhận được phản hồi. Do context switch luôn có chi phí cố định, time slice càng ngắn thì tỷ lệ chi phí chuyển đổi càng cao; khi kéo dài time slice, chi phí chuyển đổi được dàn trải ra nhưng độ trễ tương tác lại có thể tăng lên.

Multi-Level Feedback Queue (MLFQ) vừa tính đến thời gian phản hồi của tác vụ ngắn vừa đảm bảo tiến độ của tác vụ dài. Tác vụ mới thường vào hàng đợi ưu tiên cao trước; nếu nó liên tục dùng hết cả time slice, mang đặc tính của tác vụ dài tính toán nhiều (CPU-bound), nó sẽ bị hạ cấp dần; nếu nó thường xuyên chủ động chờ I/O, mang đặc tính tương tác hoặc thiên về I/O (I/O-bound), nó sẽ được giữ ở mức ưu tiên cao hơn. Số lượng hàng đợi, độ dài time slice cùng các quy tắc thăng/hạ cấp đều ảnh hưởng đến hiệu quả điều phối, và hệ thống thực tế còn lồng ghép thêm nhiều cơ chế khác.

## Từ CFS đến EEVDF

Linux từ lâu đã sử dụng CFS (Completely Fair Scheduler - Bộ điều phối hoàn toàn công bằng) cho các tác vụ thông thường.

Để hiểu CFS, trước hết hãy nhìn vào `vruntime`.

`vruntime` (virtual runtime - thời gian chạy ảo) ghi lại thời gian một task đã thực sự chạy trên trục thời gian công bằng chuẩn hóa. Sau khi một task chạy trong một khoảng thời gian thực tế, kernel sẽ quy đổi khoảng thời gian này vào thời gian chạy ảo của nó; nice value khác nhau tương ứng với trọng số (weight) khác nhau, và tốc độ quy đổi cũng khác nhau. Scheduler có xu hướng chọn task có `vruntime` nhỏ hơn, đảm bảo về lâu dài mỗi task đều được chia sẻ CPU tương ứng với trọng số của mình.

CFS không có khái niệm timeslice cố định như các scheduler cũ, mà tiến gần hơn đến việc chia sẻ tỷ lệ CPU theo trọng số trong một khoảng thời gian. Khi số runnable task ít, mỗi task có thể chạy lâu hơn một chút; khi số runnable task nhiều, lát cắt được phân bổ cho mỗi task sẽ ngắn lại. CFS sử dụng cây đỏ-đen (Red-Black Tree) để quản lý các runnable task được sắp xếp theo thời gian chạy ảo, và thường chọn node ngoài cùng bên trái—tức là task nhận được ít thời gian CPU nhất trên trục thời gian công bằng.

Từ phiên bản Linux 6.6, EEVDF (Earliest Eligible Virtual Deadline First) bắt đầu được đưa vào điều phối tác vụ thông thường.

EEVDF vẫn xoay quanh việc phân bổ CPU công bằng, nhưng đưa thêm hai khái niệm lag và virtual deadline (hạn chót ảo) vào quá trình chọn lựa task. Lag mang giá trị dương nghĩa là task vẫn đang bị "thiếu nợ" thời gian CPU; trong số các task đủ điều kiện (eligible), task có virtual deadline sớm hơn sẽ được ưu tiên chạy trước. Các tác vụ nhạy cảm với độ trễ (latency-sensitive) và chỉ yêu cầu time slice ngắn sẽ có cơ hội được điều phối sớm hơn.

Trong mã nguồn và đầu ra công cụ của Linux, các tác vụ thông thường vẫn thuộc scheduling class `fair`. EEVDF chỉ thay đổi logic chọn task bên trong fair class, chứ không làm thay đổi toàn bộ tên gọi của các khái niệm điều phối.

Việc máy chủ production đã sử dụng EEVDF hay chưa phụ thuộc vào phiên bản kernel thực tế và việc bản phân phối (distro) có backport hay tinh chỉnh các bản vá liên quan hay không. Khi xử lý sự cố thực tế, đừng mặc định tất cả các máy đều dùng cùng một triển khai scheduler.

Khi phỏng vấn vị trí backend, bạn thường chỉ cần giải thích rõ `vruntime`, trọng số và tỷ lệ công bằng của CFS, cùng với lag, virtual deadline và tác vụ nhạy cảm độ trễ của EEVDF. Những nội dung sâu hơn sẽ đi vào chi tiết triển khai bên trong kernel.

![Sơ đồ so sánh giữa CFS và EEVDF](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/cfs-eevdf-comparison-898fc546.webp)

## Load Average và CPU Utilization không phải là một

Ba con số load average nhìn thấy trong lệnh `uptime` tương ứng với mức tải trung bình trên các khung thời gian 1, 5 và 15 phút. Chúng là giá trị trung bình suy giảm theo cấp số nhân (exponentially decaying average), chứ không phải là giá trị trung bình cộng số học đơn giản của các mẫu trong N phút gần nhất.

Load average thống kê cả các task sẵn sàng chạy ở trạng thái `R` (runnable) lẫn các task ngủ không thể ngắt ở trạng thái `D` (uninterruptible sleep). Trạng thái `D` thường liên quan mật thiết đến I/O, nhưng khi kiểm tra không được chỉ chăm chăm nhìn vào đĩa cứng cục bộ, mà phải xem xét tất cả các luồng chờ không thể ngắt như block device, network storage, file system, Swap...

Vì vậy, load cao không đồng nghĩa với CPU bị quá tải 100%. Nó có thể đến từ việc các runnable task đang tranh giành CPU, hoặc do một lượng lớn task đang bị mắc kẹt trong trạng thái chờ không thể ngắt.

Đánh giá load bắt buộc phải kết hợp với số lượng logical CPU. Trên máy chủ 8 logical CPU, load ở mức khoảng 8 có thể chỉ là CPU đã được tận dụng hết công suất; load lên tới 40 thường cho thấy một lượng lớn task đang phải xếp hàng hoặc rơi vào uninterruptible sleep. Ngược lại, trên máy 1 logical CPU thì load bằng 8 đã là tình trạng quá tải nghiêm trọng, nhưng trên máy 64 logical CPU thì load bằng 8 lại là mức tải khá nhẹ.

Trường thứ tư trong `/proc/loadavg` có dạng như `3/1024`. Số đứng trước dấu gạch chéo là số lượng thực thể điều phối kernel hiện đang ở trạng thái runnable, số đứng sau là tổng số thực thể điều phối hiện có trong hệ thống. Trường này bổ sung thông tin về số lượng task tại đúng thời điểm lấy mẫu, có thể đối chiếu cùng ba giá trị load average phía trước.

CPU utilization phản ánh thời gian CPU thực sự được tiêu tốn vào đâu. Các trường phổ biến trong `%Cpu(s)` của lệnh `top` có thể được hiểu như sau:

- `us`: Thời gian ở user mode không điều chỉnh nice value. Xử lý tính toán nghiệp vụ, tuần tự hóa JSON, regex, nén dữ liệu, mã hóa/giải mã thường rơi vào đây.
- `ni`: Thời gian ở user mode có điều chỉnh nice value. Thường thấy ở các tiến trình người dùng đã bị hạ thấp độ ưu tiên.
- `sy`: Thời gian ở kernel mode. System call (lời gọi hệ thống), network protocol stack, file system, tranh chấp kernel lock sẽ đẩy chỉ số này lên cao.
- `wa`: I/O wait. Thể hiện khoảng thời gian CPU nhàn rỗi trong khi hệ thống đang có các yêu cầu I/O chưa hoàn thành. Chỉ số này đóng vai trò như một manh mối chẩn đoán, không thể dùng độc lập để quy kết nguyên nhân chính xác.
- `id`: Thời gian nhàn rỗi (idle). CPU không có việc gì để làm, hoặc các task đang bị nghẽn ở các tài nguyên khác.
- `hi` / `si`: Thời gian xử lý ngắt phần cứng (hard interrupt) / ngắt phần mềm (soft interrupt). Cần chú ý khi lưu lượng gói tin mạng lớn, ngắt card mạng tập trung trên một core, hoặc protocol stack chịu áp lực lớn.
- `st`: Steal time, thời gian CPU bị hypervisor lấy đi trong môi trường ảo hóa. Khi chỉ số này tăng cao trên máy chủ đám mây (cloud VM), trước tiên đừng vội vàng sửa mã nguồn nghiệp vụ.

![Sơ đồ so sánh giữa load average và CPU utilization](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/load-average-vs-cpu-usage-baef20d7.webp)

Chỉ số `wa` rất dễ bị hiểu sai. `iowait` không phải là căn cứ quy kết nguyên nhân đáng tin cậy: CPU không thực sự ngồi đợi I/O hoàn thành; trong hệ thống đa nhân, các task chờ I/O cũng không thực thi trên bất kỳ CPU nào. Do đó, `wa` cao chỉ cho thấy hệ thống có manh mối về việc chờ I/O, chứ không trực tiếp chứng minh CPU đang bận xử lý I/O.

Bước tiếp theo, bạn nên kiểm tra các cột `b`, `bi/bo`, `si/so` trong `vmstat`, rồi dùng `pidstat -d` và `iostat -x` để tìm ra process và block device cụ thể.

## Quy trình chẩn đoán sự cố bắt đầu từ cảnh báo CPU

Khi xử lý sự cố, đừng vừa vào việc đã vội vàng đào sâu vào Java thread dump. Trước hết hãy phân loại dạng áp lực tài nguyên, sau đó mới khoan sâu dần xuống process, thread, CPU core và hàm hotspot.

![Sơ đồ phân nhánh chẩn đoán cảnh báo CPU](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/load-cpu-alert-triage-4a1773db.webp)

Dùng lệnh `uptime` để xem xu hướng tải trước. Nếu tải 1 phút cao nhưng 5 phút và 15 phút không cao, đó có thể chỉ là một đợt tăng vọt (spike) tức thời; nếu cả ba giá trị đều cao, áp lực đã kéo dài một khoảng thời gian. Tiếp theo, mở `top` và quan sát trong mục `%Cpu(s)` xem chỉ số nào đang tăng cao: `us`, `ni`, `sy`, `wa`, `si` hay `st`, đồng thời xem thứ tự sắp xếp process và trạng thái các task.

Nếu `us` rất cao, hãy tìm hotspot nghiệp vụ trước. Với tiến trình Java, bạn có thể nhấn phím `H` trong `top` để chuyển sang chế độ xem luồng (thread view), tìm thread có mức sử dụng CPU cao nhất, đổi thread ID (TID) sang dạng thập lục phân (hex), rồi vào `jstack` hoặc `jcmd Thread.print` để tìm stack trace tương ứng. Một lần chụp `jstack` đơn lẻ chỉ phản ánh khoảnh khắc tức thời, tốt nhất nên thu thập liên tiếp 2 đến 3 lần; nếu cùng một thread liên tục dừng lại ở cùng một đoạn mã nghiệp vụ, độ tin cậy sẽ cao hơn nhiều. Bạn cũng có thể dùng lệnh:

```bash
pidstat -u -t -p <pid> 1
```

Lệnh này giúp xem CPU utilization chi tiết theo từng thread. Sau khi xác định được thread, hãy xem nó đang chạy vòng lặp nghiệp vụ, tuần tự hóa, regex, mã hóa/giải mã, hay đang bị kẹt ở GC/JIT. `jstack` thích hợp để xem call stack hiện tại; còn để tìm hotspot tiêu tốn CPU chính xác, các công cụ lấy mẫu như `perf top` hay async-profiler sẽ đáng tin cậy hơn nhiều.

Nếu `sy` hoặc `si` rất cao, đừng chỉ chăm chăm nhìn vào Java stack. Lượng lớn kết nối ngắn hạn (short-lived connection), tiếp nhận gói tin mạng, I/O file, system call dày đặc, soft interrupt đều có thể đẩy thời gian CPU vào kernel mode. Bạn có thể sử dụng:

```bash
mpstat -P ALL 1
sudo perf top
```

`mpstat` giúp kiểm tra xem có CPU core nào bị bận bất thường không, còn `perf top` giúp xem các symbol điểm nóng nằm ở hàm user mode, network stack của kernel, softirq handler hay các đoạn mã tranh chấp lock. Khi một core đạt 100% trong khi các core khác rất rảnh rỗi, cần lưu ý đến hiện tượng nghẽn đơn luồng, softirq tập trung vào một core duy nhất, cấu hình ghim CPU (CPU affinity/pinning) hoặc lệch hàng đợi (queue skew).

Nếu load cao và `wa` cũng cao, trước tiên hãy chạy:

```bash
vmstat 1
```

Tập trung quan sát các cột `r`, `b`, `wa`, `bi`, `bo`, `si`, `so`. `r` là số lượng runnable task; `b` không phải là tổng số thread đang ngủ, mà là số task đang bị block chờ I/O; `bi/bo` là thông lượng đọc/ghi block device, đơn vị thường là KiB/s, không phải số lượng yêu cầu I/O; `si/so` là lượng Swap tráo đổi vào/ra. Nếu `wa` cao đồng thời `b` và `bi/bo` cao, hãy tiếp tục kiểm tra ổ đĩa; nếu `wa` cao đồng thời `si/so` cao, áp lực bộ nhớ và việc tráo đổi Swap có thể đã làm toàn bộ dịch vụ bị chậm lại nghiêm trọng.

Tiếp tục sử dụng:

```bash
pidstat -d -p ALL 1
iostat -x 1
```

Xem process nào đang thực hiện đọc/ghi và block device nào có độ trễ cao. Với `iostat -x`, hãy chú ý đặc biệt đến `await`, `aqu-sz`, thông lượng đọc/ghi và số IOPS. Chỉ số `%util` có giá trị tham khảo tốt cho ổ đĩa cơ học (HDD); tuy nhiên, vì hệ thống RAID, SSD và NVMe có thể xử lý các yêu cầu song song, bạn không thể chỉ dựa vào `%util` để kết luận ổ đĩa đã bị quá tải hoàn toàn. Dòng đầu tiên của `iostat` thường là giá trị trung bình kể từ khi khởi động máy, nên khi xử lý sự cố hiện tại, bạn cần xem các mẫu lấy tiếp theo; nếu cần, có thể dùng `iostat -x -y 1` để bỏ qua dòng đầu tiên.

Nếu process nghiệp vụ có I/O không cao nhưng chỉ số `wa` của hệ thống lại cao, cần kiểm tra thêm các tiến trình nén log, sao lưu backup, cơ sở dữ liệu, kéo image container hoặc các container khác chạy chung trên cùng node.

Nếu hệ thống hỗ trợ PSI (Pressure Stall Information), bạn cũng có thể kiểm tra:

```bash
cat /proc/pressure/cpu
cat /proc/pressure/io
cat /proc/pressure/memory
```

PSI đo lường thời gian các task bị đình trệ do thiếu hụt tài nguyên CPU, bộ nhớ hoặc I/O. `some` chỉ ra rằng có ít nhất một task bị đình trệ do thiếu tài nguyên tương ứng; đối với bộ nhớ và I/O, `full` chỉ ra rằng tất cả các task không ở trạng thái idle đều bị đình trệ cùng lúc. Chỉ số `full` trong `/proc/pressure/cpu` cấp hệ thống không có ý nghĩa chẩn đoán, vì vậy khi kiểm tra áp lực CPU, hãy chủ yếu nhìn vào `some`. PSI phản ánh trực tiếp việc nghiệp vụ có bị ngưng trệ do áp lực tài nguyên hay không, điều mà chỉ nhìn vào CPU utilization đơn thuần sẽ không thể thấy được.

Trong môi trường container, cần kiểm tra thêm các giới hạn cgroup. Một container chỉ được cấp quota 2 core, dù máy chủ host có 64 core thì các task bên trong container vẫn có thể đã phải xếp hàng chờ đợi. Khi chẩn đoán, cần kết hợp các chỉ số cgroup như `cpu.max`, `cpu.stat`, `cpu.pressure`, `memory.current`, `memory.events`, `memory.pressure`, `io.stat`, `io.pressure`, chứ không chỉ nhìn vào tổng CPU của máy host. Danh sách trên là tên file phổ biến trong cgroup v2; nếu hệ thống vẫn dùng cgroup v1, đường dẫn và tên file sẽ phân tán ở các thư mục controller khác nhau.

Nếu load cao nhưng `wa` không cao, và cột `r` trong `vmstat 1` liên tục lớn hơn đáng kể so với số CPU core, điều đó cho thấy các runnable task đang bị ùn tắc trong hàng đợi. Tiếp theo, hãy kiểm tra số lượng thread, cấu hình thread pool, tranh chấp lock và context switch:

```bash
vmstat 1
pidstat -w -p ALL 1
ps -eo pid,ppid,stat,ni,pri,psr,pcpu,comm --sort=-pcpu | head
```

Cột `cs` trong `vmstat` cho thấy tần suất context switch của hệ thống; trong `pidstat -w`, hãy chú ý đến `cswch/s` và `nvcswch/s`. Chỉ số đầu là voluntary context switch (chuyển đổi tự nguyện), thường gặp khi chờ I/O, lock, condition variable; chỉ số sau là involuntary context switch (chuyển đổi không tự nguyện), thường gặp khi task bị chiếm quyền sau khi hết time slice. Khi thread pool được cấu hình quá lớn, `r`, `cs` và CPU utilization sẽ cùng tăng lên nhưng độ trễ của request lại xấu đi; việc tiếp tục tăng số thread chỉ khiến hệ thống nghẽn thêm.

Lệnh `time` rất thích hợp để phân tích xem một lệnh đơn lẻ tiêu tốn thời gian ở đâu:

```bash
/usr/bin/time -p <command>
```

`real` là thời gian thực tế trôi qua trên đồng hồ (wall-clock time), `user` là thời gian CPU chạy ở user mode, và `sys` là thời gian CPU chạy ở kernel mode. Nếu `real` rất dài nhưng `user + sys` lại thấp, tiến trình thường mất thời gian chờ đợi I/O, mạng hoặc lock; nếu `user` rất cao, bản thân tính toán nghiệp vụ tiêu hao nhiều CPU; nếu `sys` cao, cần xem xét kỹ các system call và đường dẫn thực thi trong kernel.

## Các lệnh chẩn đoán sự cố thông dụng

Bảng dưới đây tổng hợp các lệnh giúp bạn nhanh chóng khoanh vùng định hướng cho hầu hết các vấn đề về CPU và load:

| Lệnh | Cách dùng phổ biến | Trọng tâm cần quan sát |
| --- | --- | --- |
| `uptime` | `uptime` | Load average trong 1, 5, 15 phút |
| `top` | `top`, sau đó nhấn `H` | Tổng CPU, CPU theo process/thread, trạng thái task, load |
| `vmstat` | `vmstat 1` | `r`, `b`, `us/sy/wa/id/st`, `cs`, `bi/bo`, `si/so` |
| `pidstat` | `pidstat -u -d -w -t -p <pid> 1` | CPU, I/O, context switch theo từng process/thread |
| `iostat` | `iostat -x 1` | Thông lượng block device, độ dài hàng đợi, thời gian chờ trung bình, mức độ sử dụng |
| `mpstat` | `mpstat -P ALL 1` | Mức sử dụng từng CPU core, iowait, softirq, steal |
| `ps` | `ps -eo pid,stat,ni,pri,psr,pcpu,comm --sort=-pcpu` | Trạng thái process, priority, nice, CPU core, mức chiếm CPU |
| `perf top` | `sudo perf top` | Hàm hotspot CPU theo thời gian thực, phân biệt hotspot user mode và kernel mode |
| `PSI` | `cat /proc/pressure/{cpu,io,memory}` | Tỷ lệ thời gian task bị đình trệ do áp lực CPU, I/O, memory |

Kết quả của `perf top` phụ thuộc vào quyền hạn của perf cũng như việc có giải mã được kernel symbol, user space symbol và JIT symbol hay không; trong ngữ cảnh Java, khi cần thiết nên kết hợp thêm async-profiler.

## Trọng tâm trả lời phỏng vấn

Khi trả lời về CPU scheduling, bạn cần trình bày rõ tại sao task phải xếp hàng, khi nào kernel chuyển đổi task và việc chuyển đổi đó phát sinh những chi phí gì. Điều này sẽ hoàn chỉnh và thuyết phục hơn nhiều so với việc chỉ học vẹt tên các thuật toán.

### CPU Scheduling

> Số lượng CPU core có hạn, trong khi số process và thread sẵn sàng chạy có thể rất nhiều. Scheduler sẽ chọn task từ run queue để đưa lên CPU chạy; khi task bị block, hết time slice, độ ưu tiên thay đổi, hoặc xuất hiện task phù hợp hơn, kernel sẽ tiến hành điều phối và context switch. Quá trình điều phối luôn phải đánh đổi giữa thời gian phản hồi, thông lượng, tính công bằng và chi phí chuyển đổi ngữ cảnh; việc mở quá nhiều thread có thể phản tác dụng, khiến CPU tiêu tốn phần lớn thời gian vào việc xếp hàng và chuyển đổi qua lại.

### Cách trả lời về các thuật toán điều phối kinh điển

> FCFS đơn giản nhưng tác vụ dài sẽ cản trở tác vụ ngắn (hiệu ứng convoy); SJF tối ưu thời gian luân chuyển trung bình nhưng rất khó biết trước độ dài tác vụ và dễ khiến tác vụ dài bị starvation; RR dùng time slice để cải thiện thời gian phản hồi, nhưng time slice quá ngắn sẽ làm tăng chi phí context switch; Priority Scheduling thể hiện được mức độ khẩn cấp của tác vụ nhưng phải giải quyết vấn đề starvation của tác vụ ưu tiên thấp; Multi-Level Feedback Queue điều chỉnh vị trí hàng đợi dựa trên hành vi chạy thực tế của tác vụ, vừa ưu tiên tác vụ tương tác vừa đảm bảo tác vụ dài vẫn tiếp tục tiến triển.

### Linux Scheduling

> Việc điều phối tác vụ thông thường trong Linux không áp dụng rập khuôn một thuật toán giáo trình đơn lẻ nào. CFS sử dụng thời gian chạy ảo (`vruntime`) và trọng số để phân bổ CPU, ưu tiên chọn task đã nhận được ít CPU hơn trên trục thời gian công bằng; EEVDF tiếp tục xoay quanh việc phân bổ công bằng, dùng lag để phán đoán task có đang bị thiếu CPU hay không, rồi chọn task theo virtual deadline. Đối với các vị trí backend thông thường, giải thích được đến tầng này là đã đạt yêu cầu.

### Load Average và CPU Utilization

> Load average thống kê cả runnable task ở trạng thái `R` lẫn uninterruptible sleep task ở trạng thái `D`, và luôn phải đánh giá tương quan với số lượng CPU core. CPU utilization mô tả thời gian CPU được tiêu tốn vào đâu, trong đó `us/ni/sy/wa/id/hi/si/st` lần lượt tương ứng với user mode thông thường, user mode có nice, kernel mode, I/O wait, idle, ngắt phần cứng, ngắt phần mềm và virtualization steal time. Load cao nhưng CPU utilization không cao thường do một lượng lớn task đang kẹt ở uninterruptible sleep; CPU cao nhưng load không quá đột biến thường do một số ít thread vắt kiệt CPU core.

Nếu người phỏng vấn hỏi tiếp về phương pháp chẩn đoán sự cố, bạn có thể trả lời: dùng `uptime` và `top` để định vị hiện tượng ban đầu, dùng `vmstat` để đánh giá xem vấn đề nằm ở run queue, I/O hay context switch, sau đó dùng `pidstat` và `mpstat` để khoanh vùng đến process và CPU core cụ thể, khi cần thiết dùng `perf top` hoặc profiler để tìm hàm hotspot tiêu tốn CPU.
