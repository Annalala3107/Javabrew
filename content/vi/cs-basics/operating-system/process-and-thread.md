---
title: "Phân tích chi tiết về Process và Thread: Phân biệt, Trạng thái, Giao tiếp, Context Switch và Virtual Thread"
description: "Tổng hợp các câu hỏi phỏng vấn tần suất cao về Process và Thread, phân tích dưới góc nhìn hệ điều hành về khái niệm, mô hình tài nguyên, chuyển đổi trạng thái, PCB/TCB, fork/exec/wait, mô hình thread, context switch cùng mối quan hệ giữa Java Thread và Virtual Thread."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Process và Thread
  - Java Concurrency
head:
  - - meta
    - name: keywords
      content: Process,Thread,Phân biệt Process và Thread,Trạng thái process,Trạng thái thread,PCB,TCB,fork,exec,wait,clone,pthread,Context Switch,Mô hình thread,Java Virtual Thread,Câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/process-and-thread.md
---

Process (tiến trình) và Thread (luồng) là hai khái niệm nền tảng nhất trong hệ điều hành, nhưng cũng là hai khái niệm dễ bị học vẹt và nhầm lẫn nhất.

Khi phỏng vấn hỏi về sự khác biệt giữa chúng, nhiều câu trả lời chỉ dừng lại ở mức: *"Process là đơn vị cơ bản để cấp phát tài nguyên, còn Thread là đơn vị cơ bản để lập lịch CPU"*. Câu nói này dùng làm điểm bắt đầu thì được, nhưng hoàn toàn chưa đủ sâu.

Nếu người phỏng vấn hỏi tiếp, bạn sẽ gặp một chuỗi câu hỏi rất cụ thể: Tại sao mặc định các process lại cô lập với nhau? Các thread thực chất dùng chung những tài nguyên gì? Sau khi gọi `fork()`, process cha và con có những thứ gì giống nhau và những gì đã được tách biệt? Tại sao trong một chương trình đa luồng, việc gọi `fork()` tùy tiện lại dễ gây lỗi nghiêm trọng? Và Virtual Thread trong Java có được coi là một thread của hệ điều hành hay không?

Bài viết này sẽ lần lượt giải quyết những câu hỏi đó. Chúng ta sẽ làm rõ ranh giới giữa Program, Process và Thread; tìm hiểu các lệnh gọi `fork`, `exec`, `wait`, `clone` trong Linux; và cuối cùng quay lại với Context Switch (chuyển đổi ngữ cảnh), mô hình thread cùng Java Virtual Thread. Khi đọc, bạn hãy nắm chắc một sợi dây cốt lõi: **Process đóng vai trò là ranh giới tài nguyên và sự cô lập, còn Thread là một luồng thực thi có thể được lập lịch.**

## Program, Process và Thread là gì?

![Mối quan hệ giữa Program, Process và Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/relationship-between-program-process-and-thread-97be3e79.png)

**Program (chương trình)** là một tập hợp các chỉ lệnh và dữ liệu được lưu trữ trên đĩa cứng, ví dụ như một file thực thi (executable file) hay một file JAR. Lúc này nó chưa chạy, chỉ là một file tĩnh.

Khi hệ điều hành nạp chương trình vào bộ nhớ, thiết lập không gian địa chỉ ảo (virtual address space), bảng file descriptor cùng các tài nguyên cấp tiến trình khác, đồng thời khởi tạo ngăn xếp (stack), ngữ cảnh thanh ghi cho thread đầu tiên, thì một lượt chạy thực tế của chương trình đó trở thành một **Process (tiến trình)**. Cùng một chương trình có thể được khởi chạy nhiều lần, tạo thành nhiều process riêng biệt; ví dụ bạn mở hai cửa sổ terminal đồng thời, thông thường đó là hai process instance hoàn toàn độc lập.

**Thread (luồng)** là luồng thực thi bên trong một process. Một process có ít nhất một thread. Nhiều thread trong cùng một process cùng chia sẻ tài nguyên chung của process đó, nhưng mỗi thread vẫn có không gian thực thi riêng biệt. Trong các hệ điều hành hiện đại, thực thể thực sự được bộ lập lịch (scheduler) đưa lên CPU để thực thi chính là thread: thread nào ở trạng thái sẵn sàng (runnable), scheduler sẽ cấp phát time slice của CPU cho thread đó.

Có thể ghi nhớ định hướng lớn bằng một câu ngắn gọn: **Process tập trung vào ranh giới tài nguyên, còn Thread tập trung vào thực thi và lập lịch.**

Để xác định một khái niệm nghiêng về process hay thread, bạn có thể tự hỏi: Khái niệm đó mô tả ranh giới tài nguyên hay là một đường thực thi? Không gian địa chỉ, bảng file đang mở, thông tin quyền hạn nghiêng về process; stack, thanh ghi (registers), bộ đếm chương trình (program counter) nghiêng về thread.

![Dùng mô hình nhà máy WeChat để ví von sự khác biệt giữa process và thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/wechat-factory-process-thread-b3457524.png)

Tuy nhiên, câu nói này chỉ là điểm tựa tư duy khi học tập, không nên coi là chi tiết triển khai bất biến trên mọi hệ điều hành. Ví dụ, Linux kernel sử dụng cấu trúc `task_struct` để mô tả thực thể lập lịch, xem process và thread giống như các task chỉ khác nhau ở mức độ chia sẻ tài nguyên; trong khi tài liệu Windows lại nêu rất rõ rằng thread là đơn vị cơ bản mà hệ điều hành cấp phát thời gian xử lý của CPU. Cách đặt tên ở các hệ thống có thể khác nhau, nhưng mối quan hệ ở tầng trừu tượng thì tương đồng.

## Process sở hữu những tài nguyên nào?

Một process không chỉ chứa đoạn code đang thực thi. Một process thông thường bao gồm các thành phần sau:

- **Không gian địa chỉ ảo (Virtual Address Space)**: Đoạn bộ nhớ ảo liên tục mà process nhìn thấy, chứa đoạn mã lệnh (code/text segment), đoạn dữ liệu (data segment), Heap, Stack, các vùng ánh xạ bộ nhớ (memory mapping), v.v.
- **Các file và handle đang mở**: Ví dụ file descriptor, Socket, pipe, device handle.
- **Thông tin bảo mật và định danh**: User ID (UID), quyền hạn, thông tin chứng thực (credentials), security context.
- **Thông tin lập lịch**: Mức độ ưu tiên (priority), số liệu thống kê CPU time, độ tương thích CPU (affinity), trạng thái.
- **Ngữ cảnh thực thi khác**: Xử lý tín hiệu (signal handlers), biến môi trường, thư mục làm việc hiện tại.

Mặc định, các process hoàn toàn cô lập với nhau. Một process không thể tự ý đọc ghi vào không gian địa chỉ ảo của một process khác. Đây là nền tảng để hệ điều hành bảo vệ các chương trình không bị xâm phạm lẫn nhau. Khi hai process muốn trao đổi dữ liệu, chúng bắt buộc phải thông qua các cơ chế giao tiếp liên tiến trình (IPC) như pipe, message queue, shared memory, socket, file, hoặc signal.

Sự cô lập mang lại an toàn, nhưng cũng kéo theo chi phí. Vì mỗi process có không gian địa chỉ và bảng tài nguyên riêng biệt, nên việc chuyển đổi ngữ cảnh, giao tiếp, tạo mới và giải phóng process đều nặng nề hơn rất nhiều so với thread.

## Các trạng thái thường gặp của Process là gì?

Mô hình 5 trạng thái kinh điển trong giáo trình là đủ để trả lời hầu hết các câu hỏi phỏng vấn:

- **Khởi tạo (New/Created)**: Process đang được tạo, chưa được đưa vào hàng đợi sẵn sàng (ready queue).
- **Sẵn sàng (Ready)**: Mọi điều kiện để chạy đã sẵn sàng, chỉ chờ được cấp CPU.
- **Đang chạy (Running)**: Đang thực thi chỉ lệnh trên CPU.
- **Bị chặn (Blocked/Waiting)**: Đang chờ một sự kiện nào đó hoàn thành, chẳng hạn như I/O hoàn tất, khóa (lock) được giải phóng, bộ đếm thời gian (timer) hết hạn.
- **Kết thúc (Terminated/Exit)**: Process kết thúc, hệ điều hành tiến hành thu hồi các tài nguyên liên quan.

![Sơ đồ chuyển đổi trạng thái của process](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/state-transition-of-process-d4bbabcd.png)

Mấu chốt để hiểu chuyển đổi trạng thái không nằm ở tên gọi, mà nằm ở nguyên nhân kích hoạt. Một process ở trạng thái Ready khi được cấp CPU sẽ chuyển sang Running; process đang Running khi hết time slice có thể bị chuyển ngược về Ready; nếu đang Running mà phát sinh thao tác I/O chặn (blocking I/O), nó sẽ chuyển sang Blocked; khi sự kiện chờ đợi hoàn thành, nó sẽ quay trở về trạng thái Ready để chờ đến lượt lập lịch tiếp theo.

Một số giáo trình còn đề cập đến **trạng thái treo (Suspended)**. Trạng thái Suspended nhấn mạnh rằng process tạm thời bị đưa ra khỏi bộ nhớ vật lý (swapped out) hoặc bị người dùng/hệ thống tạm dừng; còn Blocked nhấn mạnh rằng nó đang chờ một sự kiện. Hai khái niệm này không giống nhau: một process có thể bị Blocked nhưng vẫn nằm trong RAM, hoặc có thể bị hoán đổi ra bộ nhớ ngoài (disk) và rơi vào trạng thái blocked-suspended.

## PCB là gì?

PCB (Process Control Block - Khối điều khiển tiến trình) là cấu trúc dữ liệu mà hệ điều hành sử dụng để quản lý process. Mọi thông tin trong lúc vận hành của process không biến mất mà được kernel lưu trữ và duy trì trong cấu trúc dạng PCB này.

PCB thường ghi lại:

- **Thông tin định danh tiến trình**: PID, PID của tiến trình cha (PPID), User ID (UID), v.v.
- **Trạng thái tiến trình và thông tin lập lịch**: Ready, Running, Blocked, priority, thống kê thời gian thực thi CPU.
- **Ngữ cảnh CPU (CPU Context)**: Con trỏ lệnh (Program Counter), con trỏ ngăn xếp (Stack Pointer), các thanh ghi đa năng, giúp khôi phục việc thực thi liền mạch khi được chuyển đổi trở lại.
- **Thông tin quản lý bộ nhớ**: Bảng trang (page table), không gian địa chỉ ảo, ánh xạ bộ nhớ.
- **Thông tin tài nguyên**: Bảng file descriptor đang mở, bộ xử lý tín hiệu (signal handlers), thư mục làm việc, trạng thái I/O.

Khi diễn ra chuyển đổi ngữ cảnh (context switch), hệ điều hành sẽ lưu lại trạng thái các thanh ghi của thực thể đang chạy, sau đó khôi phục ngữ cảnh của thực thể tiếp theo. Các cấu trúc như PCB/TCB chính là căn cứ cho câu hỏi "lần sau sẽ tiếp tục chạy từ đâu".

Linux có cách triển khai đặc biệt: nó xem cả process và thread đều là task. Cấu trúc `task_struct` không nhồi nhét trực tiếp mọi tài nguyên vào bên trong, mà sử dụng các con trỏ trỏ tới các cấu trúc tài nguyên riêng biệt như bộ mô tả bộ nhớ (memory descriptor), bảng file, bộ xử lý tín hiệu. Khi nhiều thread thuộc về cùng một process, chúng sẽ trỏ tới cùng một nhóm cấu trúc tài nguyên; còn các process khác nhau sẽ trỏ tới các nhóm tài nguyên độc lập. Đây là lý do tại sao việc hiểu cơ chế này giúp hiểu rất rõ hàm `clone()` trên Linux.

## fork, exec, wait trong Linux làm những việc gì?

![Chuỗi gọi hàm fork, exec, wait](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/fork-exec-wait-call-chain-4d2918b1.png)

Trong lập trình hệ thống Unix/Linux, việc tạo tiến trình thường gắn liền với bộ ba lời gọi hàm: `fork()`, `exec()`, và `wait()`.

`fork()` được dùng để tạo một tiến trình con (child process). Sau khi gọi thành công, cả process cha và con đều tiếp tục thực thi từ cùng một vị trí mã lệnh, chỉ khác nhau ở giá trị trả về: process cha nhận về PID của con, còn process con nhận về giá trị 0. Process cha và con sở hữu không gian địa chỉ ảo độc lập, lúc mới tạo trông nội dung giống hệt nhau. Các hệ điều hành hiện đại thường áp dụng kỹ thuật **Copy-on-Write (COW)**: ban đầu các trang bộ nhớ vật lý được chia sẻ ở chế độ chỉ đọc (read-only), chỉ khi một bên ghi dữ liệu vào bộ nhớ thì kernel mới thực sự sao chép trang tương ứng.

Cần đặc biệt lưu ý về file descriptor. Sau khi `fork()`, bảng file descriptor của cha và con là hai bản sao riêng biệt, nhưng các file descriptor tương ứng vẫn trỏ tới cùng một cấu trúc mô tả file mở (open file description) trong kernel. Do đó, vị trí con trỏ đọc ghi (file offset), cờ trạng thái mở file sẽ được chia sẻ chung. Trong thực tế lập trình, người ta thường kết hợp cờ `FD_CLOEXEC` hoặc `O_CLOEXEC` để tránh rò rỉ các file descriptor không mong muốn sang chương trình mới sau khi gọi `exec()`.

Họ hàm `exec()` dùng để nạp một chương trình khác vào thực thi trong chính process hiện tại. Nó không tạo ra process mới, mà thay thế toàn bộ mã lệnh, dữ liệu, heap, stack ở user space của process hiện tại bằng chương trình mới. Mô hình kinh điển trong dòng lệnh chính là: Shell gọi `fork()` tạo process con, sau đó process con gọi `exec()` để biến thành chương trình đích.

`wait()` / `waitpid()` dùng để chờ đợi sự thay đổi trạng thái của process con và thu hồi thông tin trạng thái thoát (exit status) còn lưu lại trong kernel khi process con kết thúc. Nếu process con đã thoát nhưng process cha chưa gọi `wait()`, con sẽ trở thành **zombie process (tiến trình ma)**. Zombie process không còn thực thi code nữa, nhưng vẫn chiếm giữ một vị trí trong bảng PID và lưu trữ bản ghi trạng thái thoát.

Chuỗi hành động kinh điển khi Shell chạy một lệnh bên ngoài:
1. Shell gọi `fork()` để tạo process con.
2. Process con gọi `exec()` để nạp và biến thành chương trình đích.
3. Process cha dùng `wait()` hoặc `waitpid()` để chờ và thu hồi exit status của con.

Một chi tiết rất dễ bị bỏ qua: khi một process đa luồng gọi `fork()`, trong process con chỉ còn duy nhất một thread thực hiện lệnh gọi `fork()` đó. Các trạng thái lock, condition variable, trạng thái cấp phát malloc, bộ đệm stdio mà các thread khác của process cha đang nắm giữ có thể bị sao chép sang, nhưng các thread nắm giữ chúng đã không còn tồn tại trong process con. Nói một cách chặt chẽ hơn, trong một chương trình đa luồng, khoảng thời gian sau khi gọi `fork()` và trước khi gọi `exec()`, process con chỉ nên gọi các hàm an toàn với tín hiệu bất đồng bộ (async-signal-safe functions). Thực hiện các logic phức tạp trong khoảng thời gian này là nguyên nhân rất phổ biến dẫn tới deadlock hoặc lỗi bộ nhớ.

## Thread chia sẻ những gì, và có những gì riêng biệt?

![Tài nguyên dùng chung và ngữ cảnh thực thi riêng của Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/thread-shared-and-private-content-c8d5ff09.png)

Dưới góc nhìn của hệ điều hành, các thread trong cùng một process chia sẻ phần lớn tài nguyên của process đó, bao gồm:

- Vùng nhớ trong không gian địa chỉ ảo của process: đoạn mã lệnh (code segment), đoạn dữ liệu (data segment), Heap;
- Các file descriptor, Socket, thư mục làm việc đang mở;
- Process ID, không gian địa chỉ, một phần cấu hình xử lý tín hiệu;
- Biến toàn cục (global variables) và các đối tượng nằm trên Heap.

Trong ngữ cảnh Java/JVM, các Java Thread còn chia sẻ các vùng dữ liệu lúc thực thi (runtime data areas) trong cùng process JVM, tiêu biểu là Java Heap và Method Area / Metaspace. Lưu ý rằng Method Area / Metaspace là khái niệm trong JVM Specification, không phải khái niệm chung của hệ điều hành.

Ở tầng user space của Linux, khi các thread trong cùng process gọi `getpid()`, chúng nhìn thấy cùng một Thread Group ID (TGID) - tức PID của tiến trình mà chúng ta thường thấy; tuy nhiên mỗi thread trong kernel vẫn có một task/TID riêng biệt, có thể phân biệt bằng hàm `gettid()`.

Ngược lại, mỗi thread sở hữu nội dung riêng tư:

- **Stack**: Lưu trữ các khung ngăn xếp khi gọi hàm (stack frames), biến cục bộ, địa chỉ trả về;
- **Bộ đếm chương trình (Program Counter) và các thanh ghi**: Ghi nhận chỉ lệnh CPU mà thread đang thực thi;
- **Thread ID (TID), độ ưu tiên lập lịch, Thread-Local Storage (TLS)**;
- **Trạng thái thread cùng lượng nhỏ thông tin ngữ cảnh mà kernel dùng để phục hồi thực thi**.

Việc chia sẻ tài nguyên giúp giao tiếp giữa các thread rất thuận tiện: một thread ghi dữ liệu vào một đối tượng trên heap, thread khác gần như có thể nhìn thấy ngay lập tức. Nhưng việc dùng chung này cũng sinh ra xung đột dữ liệu (data race): khi nhiều thread đồng thời đọc và ghi vào cùng một vùng dữ liệu khả biến mà không có các cơ chế đồng bộ (như lock, atomic variable, condition variable), kết quả thực thi sẽ không thể lường trước.

Đây cũng là điểm khác biệt quan trọng trong thực tế giữa process và thread: một process bị crash thường không làm hỏng trực tiếp process khác; nhưng trong cùng một process, chỉ cần một thread ghi đè vùng nhớ không hợp lệ hoặc gây lỗi truy cập bộ nhớ, nó thường sẽ kéo theo toàn bộ process bị tắt.

## TCB là gì?

TCB (Thread Control Block - Khối điều khiển luồng) có thể hiểu là thông tin điều khiển ở cấp độ thread. Nó thường lưu trữ ID của thread, trạng thái thread, ngữ cảnh các thanh ghi, thông tin ngăn xếp, mức độ ưu tiên, con trỏ tới Thread-Local Storage, v.v.

Trong một số giáo trình hoặc hệ thống, PCB và TCB được tách bạch rõ ràng: PCB quản lý tài nguyên cấp process, còn TCB quản lý ngữ cảnh thực thi cấp thread. Nhưng trong Linux, cấu trúc `task_struct` thống nhất thực thể lập lịch thành task, rồi dựa vào việc các cấu trúc tài nguyên có được chia sẻ hay không để phân biệt process và thread. Khi học lý thuyết, bạn không cần câu nệ tên gọi, mà hãy tập trung phân biệt thông tin nào thuộc về ranh giới tài nguyên và thông tin nào thuộc về ngữ cảnh thực thi.

## Đã có Process, tại sao lại cần thêm Thread?

Mục đích chính là để thực hiện xử lý đồng thời (concurrency) bên trong cùng một ứng dụng với chi phí tài nguyên thấp hơn rất nhiều.

Nếu một máy chủ muốn đồng thời xử lý đọc ghi mạng, tính toán nghiệp vụ và ghi log xuống đĩa cứng, dùng nhiều process hoàn toàn có thể làm được. Tuy nhiên, việc chia sẻ trạng thái giữa các process rất phức tạp, giao tiếp phải thông qua IPC, và lượng tài nguyên chiếm dụng lớn hơn nhiều. Khi chuyển sang dùng nhiều thread, chúng có thể trực tiếp chia sẻ bộ nhớ heap và các kết nối socket đang mở; chỉ cần cơ chế đồng bộ được viết chuẩn xác, chi phí phối hợp giữa chúng sẽ thấp hơn rất nhiều.

Thread cũng giúp nâng cao hiệu suất tận dụng tài nguyên phần cứng. Trên CPU đơn nhân, khi một thread bị chặn chờ I/O đĩa hoặc mạng, các thread khác có thể tiếp tục chạy; trên CPU đa nhân, nhiều thread có cơ hội thực thi đồng thời thực sự trên các lõi khác nhau. Các tác vụ chuyên về CPU (CPU-bound) và tác vụ chuyên về I/O (I/O-bound) có nhu cầu về số lượng thread hoàn toàn khác nhau, không thể hiểu đơn giản là càng nhiều thread thì càng chạy nhanh.

Thread không phải tài nguyên miễn phí. Dưới Linux NPTL, nếu giới hạn mềm `RLIMIT_STACK` lúc khởi chạy process không phải là `unlimited`, nó sẽ quy định kích thước stack mặc định của thread mới; giá trị phổ biến của `ulimit -s` là 8192 KB, do đó kích thước stack mặc định thường là 8 MB. Nếu `RLIMIT_STACK` là `unlimited`, hệ thống sẽ dùng giá trị mặc định theo kiến trúc phần cứng (đa phần là 2 MB). Lập trình viên cũng có thể chỉ định kích thước stack qua hàm `pthread_attr_setstacksize()`, nhưng không được thấp hơn `PTHREAD_STACK_MIN` (16,384 byte theo tài liệu Linux man-pages). Ngoài ra, số lượng thread còn chịu giới hạn bởi giới hạn PID, `threads-max` và dung lượng RAM vật lý. Việc tạo ồ ạt một lượng lớn platform thread trên hệ thống production thường dẫn đến áp lực bộ nhớ, nghẽn scheduler và số lượng context switch tăng vọt.

## Phân biệt User Thread, Kernel Thread và Mô hình Thread như thế nào?

Xét theo góc độ "ai chịu trách nhiệm lập lịch", thread được chia thành User-level Thread (luồng cấp người dùng) và Kernel-level Thread (luồng cấp kernel).

**User-level Thread (ULT)** được quản lý hoàn toàn bởi runtime ở user space hoặc thư viện thread; kernel thông thường không hề hay biết về sự tồn tại của các thread này. Điểm mạnh là thao tác tạo mới và chuyển đổi ngữ cảnh không cần gọi system call; nhược điểm là nếu nhiều user thread chỉ map vào một thực thể lập lịch duy nhất của kernel, thì một khi một user thread gọi một system call chặn (blocking), toàn bộ process có thể bị đình trệ, đồng thời không thể tận dụng được sức mạnh của CPU đa lõi.

**Kernel-level Thread (KLT)** được khởi tạo và lập lịch trực tiếp bởi hệ điều hành. Khi một thread bị chặn, kernel vẫn có thể lập lịch cho các thread khác trong cùng process tiếp tục chạy; nhiều thread có thể chạy song song trên nhiều lõi CPU. Cái giá phải trả là việc tạo, hủy, chặn, đánh thức và chuyển đổi ngữ cảnh đều bắt buộc phải chuyển quyền qua kernel.

Có 3 mô hình thread kinh điển:

![Ba mô hình thread thường gặp](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/process-and-thread-three-thread-models-8bb78c39.png)

| Mô hình | Ý nghĩa | Ưu điểm | Vấn đề chính |
| --- | --- | --- | --- |
| Nhiều-Một (Many-to-One) | Nhiều user thread ánh xạ tới một kernel thread | Chuyển đổi ở user space rất nhanh, chi phí triển khai thấp | Một thread bị chặn ảnh hưởng toàn bộ; không tận dụng được đa nhân |
| Một-Một (One-to-One) | Một user thread ánh xạ tới một kernel thread | Tận dụng được đa nhân phần cứng; giảm thiểu ảnh hưởng khi bị chặn | Số lượng thread bị giới hạn bởi tài nguyên hệ thống; chi phí tạo và switch cao hơn |
| Nhiều-Nhiều (Many-to-Many) | Nhiều user thread ánh xạ tới nhiều kernel thread | Cân bằng giữa tính linh hoạt và khả năng xử lý song song | Cài đặt runtime và bộ lập lịch phức tạp hơn rất nhiều |

POSIX Threads (pthreads) trên Linux và Thread hệ thống trên Windows về cơ bản đều thuộc **mô hình Một-Một**. Trên Linux, hàm `pthread_create()` ở tầng dưới gọi system call `clone()`, và các cờ như `CLONE_VM`, `CLONE_FILES`, `CLONE_FS`, `CLONE_THREAD` sẽ quyết định những tài nguyên nào được chia sẻ. Trên Linux, process và thread không phải là hai cơ chế tạo hoàn toàn tách rời, mà chính là sự khác biệt về mức độ chia sẻ tài nguyên thông qua các tham số của `clone()`.

## Chuyển đổi ngữ cảnh của Thread và Process khác nhau ra sao?

![So sánh chi phí chuyển đổi ngữ cảnh giữa Thread và Process](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/context-switch-cost-comparison-63e31c11.png)

Context Switch (chuyển đổi ngữ cảnh) là quá trình CPU chuyển quyền thực thi từ thực thể này sang thực thể khác. Hệ điều hành cần lưu lại các thanh ghi, bộ đếm chương trình (PC), con trỏ ngăn xếp (SP) của thực thể hiện tại, sau đó khôi phục lại ngữ cảnh đã lưu của thực thể tiếp theo.

Cả thread switch và process switch đều gây hao tổn hiệu năng, nhưng process switch nặng hơn rất nhiều. Lý do là process sở hữu không gian địa chỉ độc lập; khi chuyển đổi giữa các process, CPU phải chuyển đổi bảng trang (như nạp lại thanh ghi CR3 trên kiến trúc x86), làm mất hiệu lực bộ đệm chuyển đổi địa chỉ (TLB invalidation) và làm giảm tính cục bộ của CPU cache (cache locality degradation). Trong khi đó, các thread trong cùng process dùng chung không gian địa chỉ, nên khi chuyển đổi không cần phải đổi bảng ánh xạ bộ nhớ.

Có thể tóm gọn lại thành hai câu: Chuyển đổi giữa các thread trong cùng một process chủ yếu chỉ cần tráo đổi stack, thanh ghi, program counter riêng của thread đó; còn chuyển đổi giữa các process, ngoài việc tráo đổi ngữ cảnh thực thi, còn phải chuyển đổi không gian địa chỉ, kéo theo chi phí làm mới TLB và hao tổn CPU cache.

Tuy nhiên, chuyển đổi thread cũng không thể chỉ xem đơn giản là "lưu vài thanh ghi". Khi di chuyển giữa các CPU core khác nhau, tranh chấp lock, cache line bị mất hiệu lực liên tục, hoặc khi số lượng thread vượt quá xa số lõi CPU, việc lập lịch thread vẫn làm tiêu hao rất nhiều tài nguyên CPU. Nếu công cụ phân tích hiệu năng chỉ ra rằng phần lớn thời gian CPU đang bị tiêu tốn cho scheduling, chờ lock, system call và context switch, việc tiếp tục tăng thêm thread chỉ làm tình hình tồi tệ hơn.

## Fiber, Coroutine và Virtual Thread có được coi là Thread không?

Fiber (sợi) và Coroutine thường chạy hoàn toàn ở user space, do ứng dụng hoặc runtime tự lập lịch. Thực thể mà hệ điều hành thực sự lập lịch là các kernel thread bên dưới đang nâng đỡ chúng, chứ không phải từng fiber hay coroutine riêng lẻ. Do đó, việc chuyển đổi giữa các đơn vị thực thi siêu nhẹ này không cần chuyển quyền vào kernel, giúp chi phí thấp hơn rất nhiều.

Nhưng chúng không phải là "những thread miễn phí". Nếu runtime không chuyển đổi các thao tác I/O chặn thành dạng có thể tạm dừng (suspend) và khôi phục (resume), thì một tác vụ user space bị chặn ở system call sẽ làm tắc nghẽn luôn cả thread mang nó, kéo theo mọi tác vụ khác cùng chia sẻ thread đó bị ảnh hưởng. Thêm vào đó, sự khác biệt về ngôn ngữ, runtime, kiến trúc CPU và độ sâu của call stack đều ảnh hưởng trực tiếp đến chi phí chuyển đổi; không nên lấy con số nano-giây từ một bài benchmark đơn lẻ làm kết luận cho mọi trường hợp.

**Virtual Thread** được giới thiệu chính thức từ Java 21 là một ví dụ điển hình. Nó vẫn là một thể hiện của `java.lang.Thread`, nhưng không chiếm giữ độc quyền một thread của hệ điều hành trong thời gian dài. Khi chạy, Virtual Thread sẽ được gắn kết (mount) lên một Platform Thread, và platform thread này tương ứng trực tiếp với kernel thread bên dưới hệ điều hành; khi Virtual Thread thực hiện một thao tác I/O chặn được JDK hỗ trợ tính năng tạm dừng, JDK có thể gỡ (unmount) Virtual Thread này ra, giải phóng platform thread để đi chạy một Virtual Thread khác.

Vì vậy, Virtual Thread cực kỳ phù hợp cho các tác vụ tốn thời gian "chờ đợi I/O", chẳng hạn như các yêu cầu web đồng thời cao, truy vấn database, gọi RPC từ xa. Thứ mà nó cải thiện là năng lực xử lý đồng thời và khả năng mở rộng throughput, chứ không làm cho một đoạn code tính toán CPU chạy nhanh hơn. Những tác vụ nặng về tính toán CPU vẫn phụ thuộc vào số lõi CPU vật lý, khối lượng tính toán và chi phí lập lịch, tuyệt đối không nên đưa vô tội vạ vào Virtual Thread.

Mối quan hệ giữa Virtual Thread, Platform Thread và Kernel Thread hệ điều hành:

![Mối quan hệ giữa Virtual Thread, Platform Thread và Kernel Thread](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/virtual-threads-platform-threads-kernel-threads--57103066.png)

Cũng cần lưu ý đến hiện tượng **Thread Pinning**. Lấy Java 21 làm ví dụ, khi một Virtual Thread thực hiện thao tác I/O chặn bên trong một khối/phương thức `synchronized`, một phương thức native hoặc foreign function, nó có thể không thể unmount khỏi Platform Thread mang nó. Hậu quả là Platform Thread cũng bị giữ chặt theo và không thể chạy các Virtual Thread khác. Hiện tượng pinning diễn ra ít và trong thời gian rất ngắn sẽ không gây lỗi chương trình, nhưng nếu diễn ra thường xuyên và kéo dài sẽ ảnh hưởng nghiêm trọng đến khả năng mở rộng (scalability). Các phiên bản JDK sau này đã có những cải tiến đối với pinning liên quan đến `synchronized`, nhưng khi đánh giá thực tế bạn cần căn cứ theo phiên bản JDK đang sử dụng; các ranh giới gọi native/foreign function vẫn đòi hỏi sự cẩn trọng đặc biệt.

## Tóm tắt sự khác biệt giữa Process và Thread như thế nào?

Khi phỏng vấn, bạn có thể trả lời một cách mạch lạc dựa trên 5 khía cạnh: tài nguyên, lập lịch, giao tiếp, chi phí và độ tin cậy.

| Khía cạnh | Process | Thread |
| --- | --- | --- |
| Định vị cơ bản | Đơn vị cơ bản cấp phát tài nguyên và cô lập | Đơn vị cơ bản lập lịch và thực thi trên CPU |
| Không gian địa chỉ | Mặc định độc lập | Dùng chung giữa các thread trong cùng process |
| Nội dung riêng tư | PID, không gian địa chỉ, bảng tài nguyên, v.v. | Stack, thanh ghi, Program Counter, TLS, v.v. |
| Phương thức giao tiếp | Cần IPC (Pipe, Socket, Shared Memory) | Đọc ghi trực tiếp vùng nhớ chung, nhưng cần đồng bộ |
| Chi phí tạo/chuyển đổi | Thông thường cao hơn nhiều | Thông thường thấp hơn rất nhiều |
| Ảnh hưởng sự cố | Cô lập tốt, một process crash không ảnh hưởng process khác | Một thread crash (truy cập trái phép vùng nhớ) có thể làm sập toàn bộ process |

Một câu trả lời hoàn chỉnh có thể trình bày như sau:

> Process đóng vai trò là kho chứa tài nguyên khi chương trình chạy, sở hữu không gian địa chỉ ảo độc lập cùng các tài nguyên như file, quyền hạn; Thread là một luồng thực thi bên trong process, nhiều thread cùng chia sẻ tài nguyên của process nhưng mỗi thread lưu giữ ngăn xếp (stack), thanh ghi và program counter riêng. Giữa các process có sự cô lập mạnh mẽ hơn, nhưng chi phí giao tiếp và context switch cao hơn; giữa các thread phối hợp thuận tiện hơn, chi phí tạo và chuyển đổi nhẹ hơn, nhưng việc chia sẻ bộ nhớ phát sinh vấn đề Thread Safety, và lỗi ở một thread có thể làm sập toàn bộ process.

## Các hiểu lầm thường gặp

**Hiểu lầm 1: Process chạy song song (parallel), còn Thread chạy đồng thời (concurrent).**
Đồng thời (concurrency) và song song (parallelism) mô tả quan hệ về mặt thời gian thực thi, không phải là thuộc tính cố định của process hay thread. Trên CPU đơn nhân, nhiều process hay nhiều thread đều chỉ có thể chạy đồng thời; trên CPU đa nhân, nhiều process hay nhiều thread đều có cơ hội chạy song song trên các lõi phần cứng riêng biệt.

**Hiểu lầm 2: Càng nhiều thread thì hiệu năng càng cao.**
Thread phù hợp để che lấp độ trễ chờ đợi I/O và tận dụng CPU đa lõi; nhưng quá nhiều thread sẽ ngốn bộ nhớ stack, tăng tranh chấp lock, làm mất hiệu lực CPU cache và gây nghẽn bộ lập lịch. Các tác vụ chuyên về CPU thường có số thread tối ưu xấp xỉ số lõi CPU vật lý, chỉ các tác vụ chuyên về I/O mới hưởng lợi từ số lượng thread lớn hơn.

**Hiểu lầm 3: Các process hoàn toàn không thể chia sẻ bộ nhớ.**
Cô lập mặc định không có nghĩa là không thể chia sẻ. Shared Memory (bộ nhớ chia sẻ) chính là cơ chế IPC sinh ra để cho phép nhiều process cùng ánh xạ vào một vùng nhớ vật lý chung, điều quan trọng là lập trình viên phải tự quản lý việc đồng bộ và vòng đời của dữ liệu.

**Hiểu lầm 4: Java Virtual Thread chính là Thread của hệ điều hành.**
Platform Thread trong Java thường là một lớp bọc mỏng bên ngoài Thread của hệ điều hành; còn Virtual Thread do runtime của Java tự quản lý và lập lịch, sau đó được gắn kết (mount) lên Platform Thread để thực thi. Cả hai đều kế thừa lớp `Thread`, nhưng mô hình tài nguyên và cách thức lập lịch hoàn toàn khác biệt.
