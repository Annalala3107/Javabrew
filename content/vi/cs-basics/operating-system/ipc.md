---
title: "Phân tích chi tiết về Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder"
description: "Tổng hợp kiến thức tần suất cao về giao tiếp liên tiến trình (IPC), bắt đầu từ sự cô lập không gian địa chỉ, làm rõ các đánh đổi thiết kế giữa Pipe, FIFO, Message Queue, Shared Memory, Semaphore, Signal, Socket, Android Binder và IPC trong vi hạt nhân (microkernel)."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
  - IPC
head:
  - - meta
    - name: keywords
      content: Giao tiếp liên tiến trình,IPC,Linux IPC,Pipe,FIFO,Message Queue,Shared Memory,Semaphore,Signal,Socket,Unix Domain Socket,Android Binder,IPC vi hạt nhân,Câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/ipc.md
---

Khi hai tiến trình muốn trao đổi dữ liệu với nhau, suy nghĩ trực giác nhất là: Tiến trình A ghi dữ liệu vào bộ nhớ của mình, rồi sau đó Tiến trình B chỉ việc nhảy vào vùng nhớ đó để đọc là xong.

Tuy nhiên, trong các hệ điều hành hiện đại, điều này hoàn toàn bất khả thi. Mỗi process đều sở hữu một không gian địa chỉ ảo (virtual address space) hoàn toàn độc lập. Địa chỉ `0x7f...` trong Tiến trình A và địa chỉ `0x7f...` trong Tiến trình B không hề trỏ tới cùng một ô nhớ vật lý. Các process ở user space không thể tùy tiện đọc trộm hay sửa đổi bộ nhớ của nhau; nếu làm được điều đó, sự cô lập về bảo mật và quyền hạn của hệ thống sẽ hoàn toàn sụp đổ.

Do đó, **IPC (Inter-Process Communication - Giao tiếp liên tiến trình)** bắt buộc phải có sự can thiệp của hệ điều hành.

Đừng phức tạp hóa vấn đề, bạn hãy tư duy về IPC xoay quanh 3 nhiệm vụ cốt lõi: **truyền dữ liệu như thế nào, đồng bộ luồng kiểm soát ra sao, và cơ chế định danh cùng kiểm tra quyền hạn là gì**. Nếu chỉ học vẹt các cái tên như "pipe, message queue, shared memory", bạn sẽ rất nhanh quên sau khi học xong.

![Sự cô lập không gian địa chỉ tiến trình khiến việc giao tiếp liên tiến trình bắt buộc phải dựa vào cơ chế IPC do kernel cung cấp](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-why-ipc-d8d99cce.png)

## IPC thực chất giải quyết những vấn đề gì?

![IPC cần đồng thời giải quyết các vấn đề truyền dữ liệu, kiểm soát đồng bộ, định danh địa chỉ và kiểm tra quyền hạn](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/what-problem-does-ipc-solve-81fa7a5a.png)

1. **Cách thức dữ liệu vượt qua ranh giới tiến trình**: Pipe và Byte-stream Socket truyền tải dòng byte liên tục, ranh giới gói tin (message boundary) bắt buộc phải do giao thức tầng ứng dụng tự thỏa thuận; Message Queue, Datagram Socket và Binder Transaction truyền tải từng thông điệp riêng biệt, có sẵn ranh giới thông điệp tự nhiên; Shared Memory cho phép nhiều tiến trình cùng ánh xạ vào một vùng nhớ vật lý chung, sau khi ánh xạ xong thì việc đọc ghi không cần chuyển quyền vào kernel trong mỗi lần thao tác.
2. **Kiểm soát đồng bộ**: Shared Memory chỉ giải quyết câu hỏi "nhìn thấy cùng một vùng dữ liệu", không giải quyết được câu hỏi "ai ghi trước, ai đọc sau". Nếu nhiều tiến trình cùng đồng thời sửa đổi một hàng đợi vòng tròn (circular buffer) mà không có Mutex, Semaphore, Futex hay Condition Variable, dữ liệu sẽ nhanh chóng bị ghi đè hỗn loạn.
3. **Định danh và Kiểm tra quyền hạn**: Anonymous Pipe (đường ống vô danh) dựa vào việc kế thừa file descriptor sau khi gọi `fork()` để thiết lập quan hệ; FIFO (named pipe) dựa vào đường dẫn trên hệ thống file; System V IPC dựa vào Key và ID đối tượng kernel; Unix Domain Socket có thể liên kết với đường dẫn file hoặc dùng Abstract Namespace của Linux; Android Binder dựa vào Service Manager để ánh xạ tên dịch vụ sang tham chiếu đối tượng Binder.

## Pipe (Đường ống): Dòng byte, Đơn giản, nhưng thiếu ranh giới thông điệp

Pipe là cơ chế IPC quen thuộc nhất trong lập trình. Khi bạn gõ lệnh Shell `ps aux | grep java`, dấu gạch đứng `|` chính là chiếc cầu nối luồng xuất chuẩn (stdout) của tiến trình phía trước vào luồng nhập chuẩn (stdin) của tiến trình phía sau.

Trong Linux, gọi system call `pipe()` sẽ trả về hai file descriptor: một đầu đọc và một đầu ghi. Tiến trình cha sau khi tạo pipe sẽ gọi `fork()`, tiến trình con kế thừa hai file descriptor này, từ đó cha và con có thể truyền dữ liệu qua lại trên cùng một pipe. Anonymous pipe không có tên trên hệ thống file, thông thường chỉ dùng cho các tiến trình có quan hệ huyết thống (cha con).

![Pipe truyền dòng byte đơn hướng giữa tiến trình cha và tiến trình con thông qua bộ đệm kernel](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-pipe-flow-274e7ebf.png)

Đặc điểm của Pipe:
- **Đơn hướng (Unidirectional)**: Chuẩn POSIX chỉ quy định truyền một chiều; nếu muốn giao tiếp hai chiều cần tạo hai đường ống riêng biệt.
- **Không có ranh giới thông điệp (Byte stream)**: Đầu ghi có thể gọi `write()` 3 lần, nhưng đầu đọc có thể gom lại đọc hết trong duy nhất một lần `read()`.
- **Bộ đệm nằm trong kernel**: Khi buffer đầy, thao tác ghi chặn (blocking write) sẽ ngủ chờ, ghi không chặn (non-blocking) sẽ trả về `EAGAIN`.
- **Không phải file thông thường**: Pipe không hỗ trợ định vị ngẫu nhiên bằng `lseek()`.

Một hằng số rất hay bị hỏi trong phỏng vấn Linux là `PIPE_BUF` (thường là 4096 byte). Với Pipe hoặc FIFO, các lần ghi `write()` có kích thước không vượt quá `PIPE_BUF` được kernel đảm bảo tính nguyên tử (atomic)—nghĩa là dữ liệu không bao giờ bị đan xen với dữ liệu của các writer khác đang ghi đồng thời. Nếu vượt quá `PIPE_BUF`, dữ liệu có thể bị phân mảnh và đan xen. Lưu ý: tính nguyên tử này không đồng nghĩa với việc pipe có ranh giới thông điệp.

**FIFO (Named Pipe - Đường ống có tên)** sử dụng lệnh `mkfifo` để tạo ra một file đặc biệt trong filesystem. Hai tiến trình hoàn toàn không có quan hệ huyết thống có thể mở đường dẫn file này để giao tiếp. FIFO có tên đường dẫn, nhưng dữ liệu không hề ghi xuống đĩa cứng; đường dẫn chỉ là điểm hẹn định danh, toàn bộ dữ liệu thực tế vẫn nằm trong bộ đệm của kernel.

Pipe rất phù hợp để kết nối các công cụ dòng lệnh hoặc truyền dữ liệu dung lượng nhỏ giữa tiến trình cha và con. Nó không phù hợp cho các giao thức phức tạp hoặc truyền dữ liệu lớn. Nếu cần phân tách gói tin bằng tiền tố độ dài, mã kiểm tra checksum, số thứ tự, việc chuyển sang Socket hoặc Message Queue thường hợp lý hơn nhiều.

## Message Queue (Hàng đợi thông điệp): Kernel quản lý, Ứng dụng không cần bận tâm cắt gói

Message Queue tách dữ liệu thành từng thông điệp có cấu trúc và lưu trữ bên trong các đối tượng của kernel. Bên gửi gọi hàm `msgsnd()` hoặc `mq_send()` để đưa thông điệp vào hàng đợi; bên nhận gọi `msgrcv()` hoặc `mq_receive()` để lấy ra. Dù System V và POSIX Message Queue có bộ API khác nhau, chúng đều tuân theo mô hình: kernel quản lý hàng đợi, tiến trình đọc ghi theo từng thông điệp riêng biệt.

So với Pipe, điểm mạnh lớn nhất của Message Queue là **thông điệp có ranh giới rõ ràng**. Ứng dụng không cần phải tự viết code cắt gói stream. System V Message Queue hỗ trợ lọc và nhận thông điệp theo trường Type; POSIX Message Queue hỗ trợ thứ tự ưu tiên (Priority), trên Linux hàm `sysconf(_SC_MQ_PRIO_MAX)` thường trả về giá trị 32,768 (vượt xa mức tối thiểu 0 đến 31 của chuẩn POSIX).

Cái giá phải trả là chi phí sao chép bộ nhớ: khi gửi, dữ liệu từ user buffer được copy vào hàng đợi kernel; khi nhận, dữ liệu từ hàng đợi kernel lại được copy ngược về user buffer của bên nhận. Bản thân hàng đợi cũng chịu giới hạn bởi các tham số kernel, ví dụ với POSIX là `/proc/sys/fs/mqueue/msg_max` và `msgsize_max`.

Do đó, Message Queue phù hợp để truyền tải các thông điệp nhỏ có cấu trúc như lệnh điều khiển, thông báo sự kiện, cập nhật trạng thái. Nó không thích hợp để truyền ảnh dung lượng lớn, luồng âm thanh video hay các object tuần tự hóa khổng lồ. Lưu ý: Message Queue trong IPC hệ điều hành hoàn toàn khác biệt với các Message Broker phân tán như Kafka hay RocketMQ—nó không có log bền vững trên đĩa, không có consumer group và không có cơ chế nhân bản đa node.

## Shared Memory (Bộ nhớ chia sẻ): Giảm thiểu sao chép, nhưng phải tự lo việc đồng bộ

Ý tưởng của Shared Memory rất trực diện: cho phép nhiều tiến trình cùng ánh xạ chung một vùng nhớ vật lý vào không gian địa chỉ ảo của riêng mình. Sau khi liên kết ánh xạ được thiết lập, Tiến trình A ghi vào vùng nhớ này thì Tiến trình B có thể lập tức đọc được dữ liệu mới.

Trên Linux có hai bộ API phổ biến: System V Shared Memory dùng họ hàm `shmget()`, `shmat()`, `shmdt()`, `shmctl()`; POSIX Shared Memory dùng `shm_open()` tạo đối tượng, `ftruncate()` thiết lập kích thước, và `mmap()` để ánh xạ vào không gian nhớ của tiến trình.

![Shared memory cho phép nhiều tiến trình cùng ánh xạ vào một vùng nhớ vật lý, nhưng vẫn cần sự phối hợp của các cơ chế đồng bộ như semaphore, futex](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-shared-memory-06c62e54.png)

Shared Memory đạt tốc độ cao nhất trong các cơ chế IPC vì đường dẫn dữ liệu là ngắn nhất. Pipe, Message Queue hay Socket đều bắt buộc dữ liệu phải copy vào kernel rồi mới copy ra tiến trình nhận. Với Shared Memory, sau khi ánh xạ xong, các tiến trình đọc ghi trực tiếp lên các trang nhớ vật lý dùng chung; dữ liệu không cần phải luân chuyển qua lại giữa user space và kernel space trong mỗi lần trao đổi. Các tình huống trao đổi dữ liệu dung lượng lớn trên cùng một máy như thu thập log hiệu năng cao, xử lý âm thanh/video, hay cache database cục bộ là đất diễn lý tưởng của Shared Memory.

Tuy nhiên, việc cùng nhìn thấy một vùng nhớ chỉ giải quyết bài toán "nhìn thấy nhau", hoàn toàn không giải quyết được "khi nào được đọc" và "ai có quyền ghi".

Lấy ví dụ về một hàng đợi vòng tròn (Ring Buffer) dùng chung: producer ghi dữ liệu và tăng `tail`, consumer dựa vào `head` và `tail` để biết có dữ liệu mới. Nếu producer vừa cập nhật `tail` trong khi dữ liệu payload chưa kịp ghi xong hoặc chưa kịp flush, consumer đọc vào sẽ nhận ngay dữ liệu rác dở dang. Bản thân Shared Memory không thể tự giải quyết vấn đề này; bạn bắt buộc phải thiết kế chặt chẽ thứ tự ghi, tính khả kiến của bộ nhớ và cơ chế đánh thức: giải pháp cơ bản có thể dùng Inter-process Mutex, POSIX Semaphore; giải pháp hiệu năng cao có thể kết hợp `eventfd`, `futex`, biến nguyên tử (atomic variables) và rào cản bộ nhớ (memory barriers).

Một cái bẫy chết người: **tuyệt đối không lưu con trỏ bộ nhớ nội bộ (raw pointers) vào bên trong Shared Memory**. Vùng nhớ chung đó có thể được ánh xạ vào địa chỉ ảo `0x7000...` ở Tiến trình A, nhưng lại nằm ở địa chỉ ảo `0x5000...` ở Tiến trình B. Con trỏ do A ghi vào thì B đọc ra sẽ hoàn toàn vô nghĩa và gây lỗi Segmentation Fault. Trong thực tế, người ta luôn lưu trữ độ lệch tương đối (offset), chỉ số mảng (index), hoặc thống nhất một cấu trúc phẳng (flat struct).

Vì vậy, không thể chỉ nhìn vào số lần copy dữ liệu để khen Shared Memory. Hiệu năng thực tế còn phụ thuộc vào tính nhất quán của CPU cache, mức độ tranh chấp khóa, chi phí memory barrier, cơ chế đánh thức và cách bố trí dữ liệu. Nó chỉ phù hợp khi lượng dữ liệu lớn, hai bên cùng nằm trên một máy và đội ngũ phát triển sẵn sàng xử lý tỉ mỉ các bài toán đồng bộ; nếu chỉ truyền vài trường trạng thái hay một lệnh điều khiển ngắn, Message Queue hay Unix Domain Socket an toàn và tiện lợi hơn nhiều.

## Phân biệt Semaphore và Signal

**Semaphore (Đèn hiệu)** rất hay xuất hiện cùng Shared Memory, nhưng nó không chịu trách nhiệm truyền dữ liệu nghiệp vụ. Nó đóng vai trò là một biến đếm số nguyên để kiểm soát xem có bao nhiêu tiến trình được phép bước vào miền găng, hoặc gửi tín hiệu cho bên kia biết "đã có dữ liệu sẵn sàng để đọc". POSIX Semaphore có thể là Named (có tên) hoặc Unnamed (không tên); `sem_post()` tăng biến đếm lên 1, còn `sem_wait()` cố gắng giảm biến đếm đi 1 (chặn lại nếu biến đếm bằng 0).

**Signal (Tín hiệu)** là cơ chế thông báo sự kiện bất đồng bộ do kernel gửi tới tiến trình: `SIGINT` biểu thị ngắt từ bàn phím (Ctrl+C), `SIGTERM` yêu cầu tiến trình tắt nhẹ nhàng, `SIGCHLD` thông báo tiến trình con đã thay đổi trạng thái. Linux hỗ trợ tín hiệu tiêu chuẩn và tín hiệu thời gian thực. Signal mang theo lượng dữ liệu rất hạn chế, và hàm xử lý (signal handler) bị ràng buộc ngặt nghèo bởi quy tắc an toàn bất đồng bộ (async-signal-safe). Trong code thực tế, signal handler thường chỉ bật một lá cờ `volatile sig_atomic_t`, hoặc dùng hàm async-signal-safe `write(2)` để ghi 1 byte vào self-pipe hoặc 1 số `uint64_t` vào `eventfd`, rồi nhường việc xử lý chính cho Event Loop của chương trình.

## Socket: Dùng được cho cả trên cùng một máy lẫn xuyên mạng

Socket không chỉ sinh ra để lập trình mạng, nó còn là một công cụ IPC cục bộ xuất sắc.

Nếu hai tiến trình nằm trên hai máy chủ vật lý khác nhau, bắt buộc phải dùng Network Socket (TCP/UDP). Nếu hai tiến trình cùng nằm trên một máy, giải pháp tối ưu là **Unix Domain Socket (UDS)**. Nó thuộc họ địa chỉ `AF_UNIX` (hoặc `AF_LOCAL`), hỗ trợ các kiểu truyền `SOCK_STREAM` (dòng byte), `SOCK_DGRAM` (datagram), và `SOCK_SEQPACKET` (gói tin có thứ tự và ranh giới).

Unix Domain Socket dùng chung giao diện lập trình như Network Socket, hỗ trợ giao tiếp giữa các tiến trình không có quan hệ huyết thống; trên Linux nó có thể liên kết với một đường dẫn file hoặc dùng Abstract Namespace (không tạo file rác trên ổ cứng). UDS còn sở hữu một năng lực đặc biệt: truyền gửi File Descriptor giữa các tiến trình thông qua cấu trúc dữ liệu phụ trợ (`SCM_RIGHTS`) của hàm `sendmsg()`. Về mặt xác thực danh tính, kiểu kết nối stream có thể dùng `SO_PEERCRED` để lấy PID, UID, GID của đối tác; kiểu datagram có thể kết hợp `SO_PASSCRED` và `SCM_CREDENTIALS` để gửi chứng thực kèm theo từng thông điệp.

So sánh giữa Pipe và Unix Domain Socket:
- Dòng byte đơn giản, truyền 1 chiều giữa cha và con: **Pipe** là đủ.
- Giao tiếp hai chiều, mô hình client-server, cần truyền file descriptor: **Unix Domain Socket** là lựa chọn số một.
- Giao tiếp xuyên máy chủ: Dùng **TCP/UDP Socket** hoặc các framework RPC cấp cao (như gRPC).

## Android Binder: Biến IPC thành lời gọi dịch vụ hệ thống

![Android Binder đóng gói IPC thành các lời gọi dịch vụ hệ thống thông qua AIDL, Parcel, Binder Driver và Service Manager](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/android-binder-turning-ipc-into-system-service-c-6cd21610.png)

Trong hệ điều hành Android, **Binder** là cơ chế IPC thống trị toàn diện. Ứng dụng gọi dịch vụ hệ thống, các Service ở các process khác nhau tương tác với nhau, hay các interface do AIDL sinh ra đều hoạt động dựa trên Binder ở tầng dưới.

Các điểm sáng tạo trong thiết kế của Binder:
- **AIDL & Sinh mã**: AIDL giúp Client và Service thống nhất giao diện gọi hàm. Toolchain của Android tự động sinh mã tuần tự hóa, giải tuần tự hóa và mã Proxy/Stub. Client gọi hàm từ xa tự nhiên như gọi một phương thức Java cục bộ.
- **Parcel & Binder Driver**: Tham số gọi hàm được đóng gói vào đối tượng `Parcel`, chuyển xuống driver `/dev/binder` trong kernel Linux để thực hiện transaction xuyên tiến trình.
- **Service Manager**: Đóng vai trò là Context Manager đăng ký với Binder Driver, quản lý việc tra cứu từ tên dịch vụ dạng chuỗi sang tham chiếu đối tượng Binder.
- **Truyền tham chiếu và File Descriptor**: Transaction của Binder có thể truyền đối tượng Binder, Token và File Descriptor. Nhờ khả năng truyền fd, Binder thường bắt tay với Shared Memory (ashmem/memfd): Binder chỉ truyền thông điệp điều khiển và fd, còn dữ liệu dung lượng lớn được bơm qua Shared Memory.
- **Thread Pool phục vụ**: Các lời gọi AIDL được phân phối vào một Binder Thread Pool do nền tảng quản lý bên trong tiến trình Service; do đó code phía Service bắt buộc phải bảo đảm Thread Safety.

Binder tuyệt đối không phải là nơi để nhồi nhét dữ liệu lớn. Tài liệu về ngoại lệ `TransactionTooLargeException` của Android nêu rất rõ: bộ đệm Binder Transaction buffer hiện tại bị giới hạn cứng ở mức **1 MB**, và dung lượng này được chia sẻ chung cho toàn bộ các transaction đang diễn ra bên trong tiến trình đó. Ngoại lệ này là một cảnh báo heuristic: phía Client thậm chí không thể biết chính xác lỗi xảy ra ở chiều gửi request đi hay chiều nhận response về. Lời khuyên thiết kế chuẩn mực là: chỉ dùng Binder để truyền tham số gọi hàm, kết quả phân trang, token định danh hoặc file descriptor.

## Vì sao Vi hạt nhân (Microkernel) lại cực kỳ quan tâm tới hiệu năng IPC?

Các hệ điều hành đơn nhân (Monolithic Kernel) như Linux đưa toàn bộ File System, Network Stack, Driver vào bên trong không gian kernel. Ngược lại, **Vi hạt nhân (Microkernel)** đưa tối đa các dịch vụ này ra ngoài các tiến trình độc lập ở user space (như File System Service, Network Driver Service, Device Manager). Thiết kế này đem lại tính cô lập và độ tin cậy vượt trội, nhưng kéo theo việc tần suất IPC tăng vọt theo cấp số nhân.

Khi ứng dụng đọc một file, trong monolithic kernel chỉ tốn 1 lần system call; trong microkernel, nó có thể phải thực hiện hàng loạt lượt IPC qua lại giữa ứng dụng, dịch vụ file system và dịch vụ điều khiển ổ đĩa. Nếu IPC chậm một chút, toàn bộ hệ điều hành sẽ bị tê liệt về hiệu năng.

Chính vì vậy, trong các công trình nghiên cứu về Microkernel, tối ưu hóa IPC luôn là mặt trận khốc liệt nhất:
- **Hệ thống Mach**: Tiêu biểu với khái niệm `port`—một hàng đợi thông điệp được kernel bảo vệ đi kèm quyền hạn (capability). Một tác vụ phải nắm giữ `port right` hợp lệ mới được phép gửi hoặc nhận thông điệp.
- **Dòng họ L4**: Tối ưu hóa cực hạn đường đi nhanh của IPC. Thông điệp ngắn được truyền trực tiếp qua thanh ghi CPU; IPC đồng bộ áp dụng cơ chế hẹn gặp (rendezvous); kỹ thuật Direct Process Switch cho phép chuyển thẳng quyền thực thi từ thread gọi sang thread nhận mà không cần đi vòng qua scheduler thông thường.
- **LRPC (Lightweight Remote Procedure Call)**: Tối ưu các cuộc gọi thủ tục từ xa trên cùng một máy để giảm thiểu chi phí chuyển đổi thread, copy bộ đệm và lập lịch.

## Tiêu chí lựa chọn cơ chế IPC phù hợp

Đừng bao giờ chỉ hỏi "cơ chế nào nhanh nhất". Câu hỏi chuẩn xác hơn là: Kích thước dữ liệu là bao nhiêu? Có cần ranh giới thông điệp không? Hai bên có quan hệ cha-con không? Có cần gọi hai chiều request-response không? Có cần giao tiếp xuyên máy tính không? Có cần kiểm tra quyền hạn và định danh đối tác không?

| Cơ chế IPC | Hình thái dữ liệu | Giữ ranh giới thông điệp? | Phù hợp dữ liệu lớn? | Giao tiếp xuyên máy? | Kịch bản điển hình |
| --- | --- | --- | --- | --- | --- |
| Anonymous Pipe | Dòng byte (Stream) | Không | Không | Không | Tiến trình cha con, nối lệnh Shell |
| FIFO (Named Pipe) | Dòng byte (Stream) | Không | Không | Không | Giao tiếp đơn giản giữa 2 tiến trình độc lập |
| Message Queue | Thông điệp rời rạc | Có | Không | Không | Lệnh điều khiển, thông báo sự kiện nhỏ |
| Shared Memory | Vùng nhớ chung | Do ứng dụng tự định nghĩa | Rất phù hợp | Không | Trao đổi dữ liệu lớn tốc độ cao trên cùng máy |
| Unix Domain Socket | Dòng byte, datagram, gói tuần tự | Tùy thuộc cấu hình | Trung bình | Không | Dịch vụ daemon cục bộ, truyền File Descriptor |
| TCP/UDP Socket | Dòng byte hoặc datagram | Tùy thuộc giao thức | Tùy thuộc giao thức | Có | Giao tiếp mạng phân tán giữa các máy |
| Android Binder | Transaction, tham chiếu, fd | Có | Không phù hợp truyền trực tiếp | Không (nội bộ Android) | Gọi dịch vụ hệ thống Android |

![So sánh trực quan các cơ chế IPC phổ biến về hình thái dữ liệu, ranh giới thông điệp, truyền dữ liệu lớn và khả năng xuyên máy](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-ipc-comparison-0315c5c3.png)

Tóm tắt lựa chọn nhanh:
- Truyền dòng byte đơn giản giữa cha và con: Dùng **Pipe**.
- Tiến trình độc lập cần giao tiếp hai chiều request-response: Dùng **Unix Domain Socket**.
- Bắn các sự kiện nhỏ có cấu trúc: Dùng **Message Queue**.
- Trao đổi khối lượng dữ liệu khổng lồ trên cùng máy: Dùng **Shared Memory** kết hợp công cụ đồng bộ.
- Giao tiếp xuyên máy tính: Dùng **TCP/UDP Socket** hoặc framework RPC (gRPC).
- Giao tiếp giữa các thành phần trên Android: Dùng **Binder**.

![Lựa chọn cơ chế IPC chuẩn xác dựa trên kích thước dữ liệu, ranh giới thông điệp, phạm vi mạng và quan hệ tiến trình](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-ipc-selection-d8d08e8b.png)

## Cách trả lời phỏng vấn về IPC

Khi được hỏi về IPC, bạn có thể tổ chức câu trả lời mạch lạc như sau:

> Mặc định, các tiến trình hoàn toàn cô lập trong không gian địa chỉ ảo độc lập để bảo đảm an toàn. Do đó, muốn giao tiếp liên tiến trình (IPC), hệ điều hành bắt buộc phải đứng ra làm trung gian: hoặc là kernel trực tiếp nhận và chuyển tiếp dữ liệu, hoặc kernel thiết lập một vùng nhớ vật lý chung để các tiến trình cùng ánh xạ vào.

Sau đó phân loại nhanh các cơ chế:

> - **Pipe và FIFO**: Truyền dòng byte liên tục, không có ranh giới thông điệp, thích hợp cho việc nối lệnh hoặc truyền luồng dữ liệu đơn giản giữa cha và con.
> - **Message Queue**: Hàng đợi thông điệp do kernel lưu trữ, giữ nguyên ranh giới gói tin, phù hợp cho việc gửi các lệnh điều khiển và sự kiện nhỏ có cấu trúc.
> - **Shared Memory**: Cho phép nhiều tiến trình ánh xạ chung một vùng nhớ vật lý, tốc độ nhanh nhất vì triệt tiêu chi phí copy qua lại với kernel khi truyền dữ liệu lớn; tuy nhiên việc đồng bộ (Mutex, Semaphore, Futex) và quản lý bộ nhớ phải do ứng dụng tự đảm nhận.
> - **Unix Domain Socket**: Cơ chế IPC hai chiều linh hoạt trên cùng một máy, hỗ trợ kiểm tra định danh người gọi (`SO_PEERCRED`) và có khả năng truyền File Descriptor (`SCM_RIGHTS`).
> - **Android Binder**: Cơ chế IPC hướng đối tượng/transaction phục vụ việc gọi dịch vụ hệ thống trên Android, hỗ trợ sinh mã AIDL, truyền tham chiếu và chia sẻ bộ nhớ qua fd.

Nếu người phỏng vấn hỏi sâu: *"Tại sao dùng Shared Memory rồi vẫn cần Semaphore?"*:

> Shared Memory chỉ giải quyết việc các tiến trình nhìn thấy cùng một vùng nhớ, hoàn toàn không có cơ chế đồng bộ thứ tự truy cập. Nếu không có các nguyên thủy đồng bộ như Semaphore, Mutex hay Futex đứng ra bảo vệ, các thao tác đọc và ghi đồng thời sẽ lập tức gây ra xung đột dữ liệu (data race) và làm sai lệch trạng thái bộ nhớ.

Nếu người phỏng vấn hỏi: *"Vì sao Binder không phù hợp để truyền dữ liệu lớn?"*:

> Android quy định giới hạn bộ đệm giao dịch của Binder (Binder transaction buffer) cho mỗi tiến trình chỉ là 1 MB, và dung lượng này được chia sẻ chung cho toàn bộ các giao dịch đang diễn ra. Nếu vượt quá sẽ ném ra ngoại lệ `TransactionTooLargeException`. Với dữ liệu lớn, giải pháp chuẩn mực là chia nhỏ phân trang, hoặc sử dụng Shared Memory (ashmem/memfd) rồi chỉ truyền File Descriptor qua Binder.

Cách trả lời này đi từ bản chất cô lập bộ nhớ, phân tích ưu nhược điểm kiến trúc, đến lý do chọn lựa kỹ thuật, thể hiện chiều sâu của một kỹ sư backend vững vàng.
