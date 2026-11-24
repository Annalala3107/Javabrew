---
title: Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 1)
description: Tổng hợp các câu hỏi phỏng vấn hệ điều hành tần suất cao mới nhất (Phần 1), bao gồm các chủ đề cốt lõi như user mode và kernel mode, interrupt, exception, system call, process và thread, context switch, thuật toán CPU scheduling, Linux CFS/EEVDF, system load và deadlock.
category: Cơ sở máy tính
tag:
  - Hệ điều hành
head:
  - - meta
    - name: keywords
      content: câu hỏi phỏng vấn hệ điều hành, user mode vs kernel mode, interrupt, exception, system call, process vs thread, trạng thái tiến trình, PCB, TCB, fork, exec, wait, giao tiếp liên tiến trình IPC, thuật toán CPU scheduling, CFS, EEVDF, load average, context switch, điều kiện cần của deadlock
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/operating-system-basic-questions-01.md
---

<!-- markdownlint-disable MD033 -->

Nhiều bạn đọc thường phàn nàn rằng kiến thức về hệ điều hành khá phức tạp và vụn vặt, bản thân không có đủ kiên nhẫn để đọc hết, nhưng khi đi phỏng vấn thì lại liên tục gặp phải. Vì vậy, tôi đã tổng hợp lại danh sách các câu hỏi thường gặp về hệ điều hành để gửi tới các bạn!

Bài viết *Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 1)* này sẽ bắt đầu từ những kiến thức cơ sở của hệ điều hành, sau đó tập trung phân tích các chủ đề trọng điểm: **user mode / kernel mode, system call, process và thread, giao tiếp liên tiến trình (IPC), điều phối tiến trình (process scheduling) và deadlock**. Tài liệu này rất thích hợp để bạn nhanh chóng thiết lập danh sách câu hỏi ôn tập phỏng vấn, cũng như dùng làm mục lục tra cứu bù đắp lỗ hổng kiến thức.

Học hệ điều hành không chỉ nhằm mục đích học vẹt câu hỏi phỏng vấn. Các tư tưởng cốt lõi như caching, scheduling, synchronization, memory mapping, zero-copy, I/O multiplexing đều hiện diện rõ nét trong Redis, Kafka, Nginx, Netty, JVM và các hệ quản trị cơ sở dữ liệu. Khi đã hiểu thấu đáo các cơ chế ở tầng đáy, việc tiếp cận các framework tầng trên và chẩn đoán các sự cố hiệu năng trong môi trường production sẽ trở nên nhẹ nhàng hơn rất nhiều.

Bài viết này đi theo định hướng "tra cứu nhanh phỏng vấn + xâu chuỗi khái niệm cốt lõi". Để học sâu hơn, bạn nên kết hợp đọc thêm sách giáo trình và các bài viết chuyên đề. Một số nội dung trong bài có tham khảo từ cuốn sách *Modern Operating Systems* (Tái bản lần thứ 3), xin được gửi lời cảm ơn chân thành.

## Cơ sở hệ điều hành

![Sơ đồ tư duy kiến thức cơ sở hệ điều hành](/media/jg/ext/oss.javaguide.cn/2020-8/image-20200807161118901-88f3b07c.png)

### Hệ điều hành là gì?

Chúng ta có thể tóm lược bản chất của hệ điều hành qua bốn điểm sau:

1. Hệ điều hành (Operating System, viết tắt là OS) là chương trình quản lý tài nguyên phần cứng và phần mềm của máy tính, đóng vai trò là nền tảng cốt lõi của hệ thống máy tính.
2. Về bản chất, hệ điều hành là một chương trình phần mềm chạy trên máy tính, chủ yếu dùng để quản lý tài nguyên phần cứng và phần mềm. Ví dụ: tất cả các ứng dụng chạy trên máy tính của bạn đều phải thông qua hệ điều hành để cấp phát bộ nhớ RAM, truy xuất ổ đĩa và các thiết bị phần cứng khác.
3. Sự tồn tại của hệ điều hành giúp che giấu sự phức tạp của tầng phần cứng. Hệ điều hành đóng vai trò như một người quản lý việc sử dụng phần cứng, điều phối nhịp nhàng tất cả các tác vụ liên quan.
4. Kernel (nhân / hạt nhân) của hệ điều hành là bộ phận cốt lõi nhất. Kernel chịu trách nhiệm quản lý bộ nhớ, thiết bị phần cứng, hệ thống tập tin (file system) và các ứng dụng trong hệ thống. Kernel chính là cây cầu nối giữa ứng dụng và phần cứng, quyết định trực tiếp hiệu năng cũng như độ ổn định của hệ thống.

Nhiều người dễ nhầm lẫn giữa Kernel của hệ điều hành và Central Processing Unit (CPU). Bạn có thể phân biệt đơn giản qua hai điểm sau:

1. Kernel thuộc về tầng phần mềm (hệ điều hành), trong khi CPU thuộc về tầng phần cứng.
2. CPU chủ yếu cung cấp năng lực tính toán và xử lý các tập lệnh. Kernel chủ yếu chịu trách nhiệm quản lý hệ thống (như quản lý bộ nhớ), trừu tượng hóa và che giấu các thao tác trực tiếp với phần cứng.

Sơ đồ dưới đây minh họa rõ ràng mối quan hệ giữa ứng dụng, kernel và CPU.

![Mối quan hệ giữa ứng dụng, kernel và CPU](/media/jg/ext/oss.javaguide.cn/2020-8/Kernel_Layout-38e67253.png)

### Hệ điều hành có những chức năng chính nào?

Xét từ góc độ quản lý tài nguyên, hệ điều hành đảm nhiệm 6 chức năng lớn:

1. **Quản lý Process và Thread**: Khởi tạo, hủy bỏ, chặn (blocking), đánh thức (waking) tiến trình, cũng như xử lý giao tiếp liên tiến trình (IPC).
2. **Quản lý bộ nhớ (Storage Management)**: Cấp phát và thu hồi bộ nhớ, chuyển đổi địa chỉ (address translation), cô lập tiến trình, thu hồi trang (page reclamation) và quản lý không gian lưu trữ ngoài.
3. **Quản lý tập tin (File Management)**: Tổ chức các khối lưu trữ tầng dưới thành các tập tin và thư mục, chịu trách nhiệm đọc/ghi, tạo mới, xóa, phân quyền truy cập và phục hồi sau sự cố sập hệ thống (crash recovery).
4. **Quản lý thiết bị (Device Management)**: Tiếp nhận yêu cầu hoặc giải phóng thiết bị (thiết bị nhập/xuất I/O, thiết bị lưu trữ ngoài...), cũng như khởi động và điều khiển thiết bị thông qua driver.
5. **Quản lý mạng (Network Management)**: Quản lý việc sử dụng mạng máy tính. Mạng là phương thức kết nối các máy tính khác nhau trong hệ thống, hệ điều hành cần quản lý cấu hình, kết nối, giao tiếp và bảo mật mạng nhằm cung cấp dịch vụ mạng hiệu quả, đáng tin cậy.
6. **Quản lý an toàn và bảo mật (Security Management)**: Xác thực danh tính người dùng, kiểm soát truy cập (access control), mã hóa tập tin nhằm ngăn chặn người dùng không hợp lệ truy cập và thao tác trái phép trên tài nguyên hệ thống.

Quản lý bộ nhớ và hệ thống tập tin là hai mảng thường xuyên bị hỏi sâu nhất trong các buổi phỏng vấn; hai mảng này sẽ được trình bày riêng biệt trong bài viết: [Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 2)](./operating-system-basic-questions-02.md).

### Các hệ điều hành phổ biến gồm những loại nào?

#### Windows

Hệ điều hành máy tính để bàn cá nhân (desktop) phổ biến nhất hiện nay. Không cần giới thiệu quá nhiều, giao diện trực quan dễ sử dụng, hệ sinh thái phần mềm vô cùng phong phú.

*Để chơi game PC thì Windows vẫn là lựa chọn bắt buộc, vì thế hiện tại tôi dùng một máy Windows để chơi game và một máy Mac phục vụ cho công việc lập trình và học tập hàng ngày.*

![Giao diện hệ điều hành desktop Windows](/media/jg/local/cs-basics/operating-system/images/windows-359ae2.png)

#### Unix

Unix là một trong những hệ điều hành đa người dùng, đa nhiệm có tầm ảnh hưởng lớn nhất trong lịch sử máy tính. Các hệ thống dạng Unix (Unix-like) sau này như Linux, BSD đều chịu ảnh hưởng sâu sắc từ Unix. Mặc dù thị phần của Unix thương mại truyền thống đã sụt giảm rõ rệt, nhưng các tiêu chuẩn Unix, hệ thống chứng nhận POSIX và tư tưởng thiết kế của nó vẫn đang được áp dụng rộng rãi.

![Biểu trưng hệ điều hành Unix](/media/jg/local/cs-basics/operating-system/images/unix-044fe7.png)

#### Linux

**Linux là một hệ điều hành dạng Unix mã nguồn mở và miễn phí.** Linux có rất nhiều bản phân phối (distributions) khác nhau, nhưng tất cả đều sử dụng chung **Linux Kernel**.

> Nói một cách chặt chẽ, từ "Linux" ban đầu chỉ dùng để chỉ Linux kernel. Trong hệ thống GNU/Linux, Linux thực chất là kernel, còn phần còn lại của hệ điều hành chủ yếu được tạo nên từ các chương trình do dự án GNU phát triển và cung cấp. Bản thân một Linux kernel độc lập không thể tạo thành một hệ điều hành hoàn chỉnh có thể hoạt động bình thường.
>
> **Nhiều người có xu hướng sử dụng thuật ngữ "GNU/Linux" để chỉ hệ điều hành mà mọi người thường gọi tắt là "Linux".**

![Giao diện desktop và dòng lệnh của hệ điều hành Linux](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-95faaf8a.jpg)

#### Mac OS

Hệ điều hành độc quyền của Apple dành cho máy tính Mac. Trải nghiệm lập trình tương đương với Linux, nhưng giao diện đồ họa, hệ sinh thái phần mềm và trải nghiệm người dùng tổng thể đều vượt trội hơn so với các bản phân phối Linux thông thường.

![Giao diện hệ điều hành desktop macOS](/media/jg/local/cs-basics/operating-system/images/macos-677c23.png)

### User Mode và Kernel Mode

#### User Mode và Kernel Mode là gì?

User Mode (chế độ người dùng) và Kernel Mode (chế độ hạt nhân/chế độ nhân) mô tả các cấp độ đặc quyền (privilege levels) của CPU khi thực thi mã lệnh. Mã ứng dụng thông thường chạy ở User Mode; khi cần truy cập các tài nguyên được bảo vệ, CPU sẽ chuyển sang Kernel Mode thông qua các điểm vào (entry points) được quy định bởi kiến trúc phần cứng, để kernel đại diện cho thread hiện tại hoàn thành thao tác.

![User Mode và Kernel Mode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/usermode-and-kernelmode-7ac25c26.png)

- **User Mode (Chế độ người dùng)**: Có quyền hạn thấp, không thể trực tiếp thực thi các chỉ lệnh đặc quyền (privileged instructions), không thể tùy tiện truy cập không gian địa chỉ của kernel hay thao tác trực tiếp trên phần cứng. Khi ứng dụng đọc file hoặc gửi/nhận dữ liệu qua mạng, nó buộc phải thông qua System Call để yêu cầu kernel phục vụ.
- **Kernel Mode (Chế độ nhân)**: Có đặc quyền cao, có thể thực thi các thao tác đặc quyền như quản lý bảng trang (page table), xử lý ngắt (interrupt), điều khiển thiết bị phần cứng. Khi đi vào kernel thông qua system call, interrupt hoặc synchronous exception, CPU đang chạy mã lệnh của kernel, chứ không phải toàn bộ tiến trình người dùng biến thành "tiến trình kernel".

Việc chuyển đổi giữa User Mode và Kernel Mode đòi hỏi phải đi qua các điểm vào chuẩn của kiến trúc, lưu lại ngữ cảnh cần thiết và tiến hành kiểm tra quyền hạn cũng như tham số, vì vậy nó có chi phí tốn kém hơn so với một lời gọi hàm thông thường. Tuy nhiên, nó không đồng nhất với context switch giữa các thread: chỉ khi scheduler chuyển quyền thực thi sang một thực thể khác thì mới xảy ra thread context switch.

#### Tại sao cần phân chia User Mode và Kernel Mode? Chỉ dùng một Kernel Mode có được không?

Thiết kế này được sinh ra chủ yếu vì mục tiêu **an toàn** và **ổn định**.

- **Hạn chế các thao tác đặc quyền**: Việc sửa đổi bảng trang, kiểm soát ngắt, truy cập trực tiếp thanh ghi của thiết bị ngoại vi... có ảnh hưởng tới toàn bộ hệ thống, nên bắt buộc chỉ được phép thực hiện bởi kernel.
- **Cô lập lỗi và đặc quyền**: Nếu tất cả các ứng dụng đều chạy với quyền hạn của kernel, thì chỉ một lỗi ghi tràn mảng (out-of-bounds write) hoặc một chương trình độc hại cũng có thể phá hỏng các tiến trình khác và làm hỏng cấu trúc dữ liệu của kernel, khiến cho cơ chế cô lập tiến trình (process isolation) hoàn toàn sụp đổ.

Cơ chế phân cấp đặc quyền này giúp giam các ứng dụng thông thường trong một môi trường được kiểm soát, trong khi phần cứng và tài nguyên hệ thống được kernel quản lý tập trung.

#### User Mode và Kernel Mode chuyển đổi như thế nào?

![3 phương thức chuyển đổi từ User Mode sang Kernel Mode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/the-way-switch-between-user-mode-and-kernel-mode-59692e9a.png)

Các sự kiện khiến CPU chuyển từ User Mode sang Kernel Mode chủ yếu gồm ba loại:

1. **System Call (Trap - Lời gọi hệ thống)**: Ứng dụng chủ động thực thi các lệnh như `syscall`, `ecall` để yêu cầu kernel hoàn thành các thao tác như `read()`, `send()`. Sự kiện này do chính chỉ lệnh hiện tại kích hoạt, thuộc loại sự kiện đồng bộ (synchronous).
2. **Hardware Interrupt (Ngắt phần cứng)**: Kích hoạt bởi các phần cứng bên ngoài như bộ đếm thời gian (timer), card mạng, đĩa cứng... Sự kiện này không có mối liên hệ trực tiếp với chỉ lệnh đang chạy, thuộc loại sự kiện bất đồng bộ (asynchronous).
3. **Synchronous Exception (Ngoại lệ đồng bộ)**: Được kích hoạt trực tiếp bởi chỉ lệnh hiện tại, ví dụ như lỗi chia cho 0, lệnh không hợp lệ, hoặc Page Fault (lỗi trang). Exception không nhất thiết là lỗi chương trình; cơ chế lazy allocation, COW (Copy-On-Write) và nạp trang từ file cũng sẽ kích hoạt các Page Fault có thể khôi phục được.

Interrupt, Exception và System Call giải thích lý do *tại sao* CPU chuyển vào kernel; còn Signal (tín hiệu) là cơ chế phần mềm để kernel thông báo tới process hoặc thread. Một truy cập bộ nhớ bất hợp pháp có thể kích hoạt Page Fault trước; sau khi kernel xác định không thể khắc phục được, nó mới gửi tín hiệu `SIGSEGV` tới thread hiện tại.

Chi tiết điểm vào phần cứng ở các kiến trúc vi xử lý có thể khác nhau đôi chút, nhưng tất cả đều sẽ nhảy tới entry tương ứng trong kernel dựa theo loại sự kiện. Để xem so sánh khái niệm đầy đủ và luồng xử lý chi tiết, mời xem: [Giải thích chi tiết về Ngắt, Ngoại lệ và Lời gọi hệ thống: Từ Kernel Entry đến Lỗi thiếu trang](./interrupt-exception-syscall.md).

### System Call (Lời gọi hệ thống)

#### System Call là gì?

System Call là giao diện dịch vụ được kiểm soát mà kernel cung cấp cho các chương trình người dùng. Ứng dụng không thể trực tiếp thao tác lên ổ đĩa, bảng trang hay card mạng, mà phải thông qua system call để nhờ kernel thực hiện thay.

![Chương trình người dùng yêu cầu dịch vụ kernel thông qua System Call](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/system-call-e64b6ca1.png)

Dựa theo chức năng, các system call có thể chia thành các nhóm chính sau:

- Quản lý thiết bị: Yêu cầu hoặc giải phóng thiết bị (nhập/xuất I/O, bộ nhớ ngoài...), khởi động thiết bị.
- Quản lý tập tin: Đọc, ghi, tạo mới và xóa tập tin.
- Quản lý tiến trình: Tạo mới, hủy bỏ, chặn (block), đánh thức tiến trình, giao tiếp liên tiến trình.
- Quản lý bộ nhớ: Cấp phát, thu hồi bộ nhớ, lấy kích thước và địa chỉ vùng nhớ được cấp.
- Giao tiếp mạng: Tạo Socket, thiết lập kết nối, gửi và nhận dữ liệu.

System call và hàm thư viện (library function) nằm ở hai tầng khác nhau. Lời gọi hàm thông thường luôn chạy ở User Mode; các hàm bao bọc (wrapper function) như `read()` của glibc sẽ chuẩn bị số hiệu system call và các tham số theo chuẩn ABI, sau đó thực thi chỉ lệnh đặc biệt để đi vào kernel. Rất nhiều hàm thư viện hoàn toàn không cần gọi tới system call.

#### Bạn có nắm được quy trình thực hiện một System Call không?

Lấy ví dụ về `read(fd, buf, count)` trên nền tảng Linux x86-64, quy trình gọi hệ thống diễn ra như sau:

1. Hàm wrapper của glibc tuân theo quy ước gọi hàm (calling convention), đưa số hiệu system call và các tham số vào các thanh ghi được chỉ định, rồi thực thi lệnh `syscall`.
2. CPU chuyển sang cấp đặc quyền kernel và nhảy tới entry tương ứng. Mã nguồn entry của kernel sẽ lưu lại trạng thái các thanh ghi cần thiết để phục vụ khôi phục sau này, sau đó phân phối tới hàm xử lý logic tương ứng của `read` dựa trên số hiệu system call.
3. Kernel kiểm tra tính hợp lệ của file descriptor (fd), buffer của người dùng, quyền truy cập và trạng thái file, rồi chuyển tiếp vào VFS, file system, network stack hoặc device driver tương ứng.
4. Nếu dữ liệu đã sẵn sàng, kernel hoàn thành việc đọc và trả về kết quả; nếu dữ liệu chưa sẵn sàng, thread hiện tại có thể chuyển sang trạng thái chờ (waiting/blocked), và scheduler sẽ chuyển quyền điều khiển sang tác vụ sẵn sàng khác.
5. Sau khi cuộc gọi hoàn tất, giá trị trả về được chuyển lại cho User Mode qua thanh ghi. Khi xảy ra lỗi, glibc thường chuyển mã lỗi của kernel thành `-1` và gán mã lỗi vào biến toàn cục `errno`.

![Quy trình thực hiện System Call](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/system-call-procedure-4f5c448a.png)

#### System Call có nhất thiết gây ra Context Switch không?

System call làm cho CPU chuyển sang Kernel Mode. Nếu kernel xử lý rất nhanh và lập tức trả quyền điều khiển về cho chính thread ban đầu, thì toàn bộ quá trình chỉ là chuyển đổi User Mode / Kernel Mode (mode switch), chứ không hề chuyển đổi thread (context switch).

Chỉ khi system call phải chờ I/O, chờ khóa (lock) hoặc tài nguyên chưa sẵn sàng, thread hiện tại mới bị block; lúc này scheduler mới lựa chọn một tác vụ khác đang ở trạng thái runnable, và khi đó mới xảy ra thread context switch. Ngược lại, khi ngắt đồng hồ (timer interrupt) đưa CPU vào kernel, nếu scheduler vẫn quyết định cho thread hiện tại tiếp tục chạy, thì cũng không xảy ra chuyển đổi thread.

Để tìm hiểu chuỗi gọi `read()` hoàn chỉnh, xử lý ngắt tín hiệu và khởi động lại system call, mời xem: [Giải thích chi tiết về Ngắt, Ngoại lệ và Lời gọi hệ thống: Từ Kernel Entry đến Lỗi thiếu trang](./interrupt-exception-syscall.md).

## Process và Thread

Process (tiến trình) và Thread (luồng) là cặp khái niệm không thể thiếu trong các câu hỏi phỏng vấn hệ điều hành. Dưới đây là câu trả lời cô đọng cho các câu hỏi phổ biến, nếu muốn nghiên cứu hệ thống hơn, bạn có thể đọc các bài viết chuyên sâu sau:

- [Giải thích chi tiết về Process và Thread: Khác biệt, Trạng thái, Giao tiếp, Chuyển đổi ngữ cảnh và Virtual Thread](./process-and-thread.md), đường dẫn: `./process-and-thread.md`
- [Giải thích chi tiết về Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder](./ipc.md), đường dẫn: `./ipc.md`
- [Giải thích chi tiết về CPU Scheduling và Tải hệ thống](./cpu-scheduling-and-load.md), đường dẫn: `./cpu-scheduling-and-load.md`

### Điểm khác biệt giữa Process và Thread là gì?

Process và Thread là hai khái niệm cốt lõi của việc thực thi đồng thời trong hệ điều hành. Mối quan hệ giữa chúng có thể ví von trực quan như quan hệ giữa **Nhà máy và Công nhân**.

![Mối quan hệ giữa Program, Process và Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/relationship-between-program-process-and-thread-97be3e79.png)

**Process (Tiến trình) giống như một nhà máy**. Khi hệ điều hành phân bổ tài nguyên, nó lấy process làm đơn vị cơ bản. Ví dụ, khi tôi khởi động WeChat, hệ điều hành sẽ thiết lập một nhà máy độc lập cho nó, cấp phát vùng nhớ riêng biệt, các file handle và tài nguyên khác. Nhà máy này hoàn toàn bị cô lập nghiêm ngặt với các nhà máy khác (chẳng hạn như tiến trình trình duyệt web).

**Thread (Luồng) giống như các công nhân làm việc trong nhà máy**. Trong một nhà máy có thể có rất nhiều công nhân, họ cùng chia sẻ tài nguyên trong nhà máy đó, nhưng mỗi công nhân lại có hộp đồ nghề và danh sách công việc riêng để thực hiện các nhiệm vụ độc lập. Ví dụ, trong nhà máy WeChat, có một công nhân (thread) phụ trách nhận tin nhắn, một công nhân khác phụ trách render giao diện đồ họa.

Dưới đây là hình vẽ minh họa sinh động được tạo bởi AI:

![Ẩn dụ nhà máy WeChat so sánh Process và Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/wechat-factory-process-thread-b3457524.png)

Hình dưới đây là các vùng nhớ trong Java, chúng ta hãy cùng xem xét mối quan hệ giữa thread và process từ góc nhìn của JVM nhé!

![Khu vực dữ liệu thời gian chạy của Java (từ JDK 1.8 trở đi)](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/java-runtime-data-areas-jdk1.8-6401fdf0.png)

Có thể thấy từ sơ đồ: Trong một process có thể có nhiều thread, các thread cùng chia sẻ tài nguyên **Heap** và **Method Area (Metaspace từ JDK 1.8 trở đi)** của process, nhưng mỗi thread lại có **Program Counter (Bộ đếm chương trình)**, **JVM Stack** và **Native Method Stack** riêng biệt.

![Nội dung dùng chung và nội dung riêng tư của Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/thread-shared-and-private-content-c8d5ff09.png)

Chúng ta có thể đúc kết sự khác biệt qua 5 khía cạnh: tài nguyên, điều phối, giao tiếp, chi phí và độ tin cậy:

| Khía cạnh | Process | Thread |
| --- | --- | --- |
| Định vị cơ bản | Đơn vị cơ bản của phân bổ và cô lập tài nguyên | Đơn vị cơ bản của điều phối và thực thi CPU |
| Không gian địa chỉ | Mặc định sở hữu không gian địa chỉ ảo độc lập | Các thread trong cùng một process dùng chung không gian địa chỉ |
| Nội dung riêng | Tài nguyên cấp tiến trình: PID, không gian địa chỉ, bảng mở file, quyền hạn | Ngữ cảnh thực thi: Thread ID, Stack, thanh ghi, Program Counter, Thread-Local Storage |
| Phương thức giao tiếp | Cần dùng IPC (pipe, message queue, shared memory, socket...) | Có thể trực tiếp đọc/ghi bộ nhớ dùng chung, nhưng phải xử lý đồng bộ và an toàn luồng |
| Chi phí tạo / chuyển đổi | Thường cao hơn, chuyển đổi process có thể kéo theo chuyển đổi không gian địa chỉ, vô hiệu hóa TLB... | Thường thấp hơn, chuyển đổi thread trong cùng process không cần đổi toàn bộ không gian địa chỉ |
| Ảnh hưởng khi gặp lỗi | Tính cô lập tốt hơn, một process bị crash thường không làm ảnh hưởng tới process khác | Một thread gặp lỗi không xử lý có thể khiến toàn bộ process bị dừng hoạt động |

Một câu trả lời phỏng vấn đầy đủ có thể diễn đạt như sau:

> Process là vùng chứa tài nguyên thời gian chạy của chương trình, sở hữu không gian địa chỉ ảo độc lập cùng các tài nguyên như file, quyền hạn; Thread là luồng thực thi bên trong process, nhiều thread chia sẻ tài nguyên của process nhưng mỗi thread tự lưu giữ ngữ cảnh thực thi riêng gồm stack, thanh ghi, program counter. Giữa các process có tính cô lập mạnh hơn nhưng chi phí giao tiếp và chuyển đổi cao hơn; giữa các thread việc phối hợp thuận tiện hơn, chi phí tạo và chuyển đổi nhẹ hơn, nhưng bộ nhớ dùng chung đòi hỏi phải xử lý cẩn thận bài toán thread safety.

### Đã có Process rồi, tại sao vẫn cần Thread?

Lý do cốt lõi là **nhằm hiện thực hóa khả năng xử lý đồng thời (concurrency) với chi phí thấp và hiệu suất cao bên trong một ứng dụng đơn lẻ**.

Nếu một ứng dụng server cần đồng thời xử lý đọc ghi mạng, tính toán nghiệp vụ, ghi log ra đĩa, dùng nhiều process hoàn toàn có thể làm được, nhưng việc chia sẻ trạng thái giữa các process rất phức tạp, giao tiếp phải qua IPC, và mức tiêu tốn tài nguyên cao hơn hẳn. Khi chuyển sang dùng nhiều thread, chúng có thể trực tiếp chia sẻ bộ nhớ Heap và các kết nối mở; chỉ cần viết đúng logic đồng bộ, chi phí phối hợp sẽ thấp hơn rất nhiều.

Thread cũng giúp nâng cao tỷ lệ tận dụng tài nguyên phần cứng. Trên CPU đơn nhân (single-core), khi một thread bị block do chờ I/O ổ đĩa hoặc mạng, các thread khác vẫn có thể tiếp tục tận dụng CPU để xử lý; trên CPU đa nhân (multi-core), nhiều thread có cơ hội thực thi song song (parallel) trên các core khác nhau. Tuy nhiên, không phải càng nhiều thread thì càng tốt. Quá nhiều thread sẽ làm tốn bộ nhớ stack, tăng chi phí điều phối (scheduling overhead), gây cạnh tranh khóa (lock contention) và làm mất hiệu lực bộ nhớ đệm (cache invalidation). Số lượng thread cấu hình cho tác vụ CPU-bound và I/O-bound cũng hoàn toàn khác nhau.

### Đa luồng (Multithreading) có chắc chắn nâng cao hiệu năng không?

Việc đa luồng có giúp tăng tốc được hay không phụ thuộc vào loại tác vụ, số lượng CPU core và mức độ cạnh tranh tài nguyên dùng chung:

- **Tác vụ I/O-bound**: Khi một thread chờ đĩa cứng, mạng hoặc chờ lock, các thread ở trạng thái runnable khác có thể tiếp tục sử dụng CPU, nhờ đó đa luồng có thể che giấu được một phần thời gian chờ đợi.
- **Tác vụ CPU-bound**: Các phép tính có thể phân rã và độc lập với nhau có thể chia cho nhiều CPU core thực thi song song, tuy nhiên hiệu quả tăng tốc vẫn chịu ràng buộc bởi phần code tuần tự (Định luật Amdahl), sự phụ thuộc dữ liệu, cache và chi phí điều phối.
- **Quá nhiều thread**: Khi số lượng thread sẵn sàng chạy vượt xa số core CPU, hàng đợi thực thi (run queue) sẽ dài ra, việc context switch diễn ra liên tục, cache mất hiệu lực và tranh chấp lock gia tăng, khiến cả thông lượng (throughput) lẫn độ trễ (latency) đều sụt giảm nghiêm trọng.

Số lượng thread cần được thiết lập dựa trên đặc tính tác vụ, CPU quota, tỷ lệ thời gian blocking và kết quả kiểm thử tải (stress test), chứ không thể chỉ suy đoán đơn thuần theo số core vật lý của máy chủ hay số lượng request đồng thời.

### Các phương thức đồng bộ hóa giữa các Thread gồm những gì?

Đồng bộ luồng (Thread Synchronization) là việc phối hợp thực thi đồng thời của hai hoặc nhiều thread có chia sẻ tài nguyên trọng yếu. Cần phải đồng bộ luồng để tránh xung đột khi truy cập vào các tài nguyên trọng yếu.

Dưới đây là một số phương thức đồng bộ luồng phổ biến:

1. **Khóa loại trừ tương hỗ (Mutex)**: Áp dụng cơ chế đối tượng loại trừ tương hỗ, chỉ có thread sở hữu mutex mới có quyền truy cập tài nguyên công cộng. Vì chỉ có duy nhất một đối tượng mutex, cơ chế này đảm bảo tài nguyên dùng chung không bị truy cập đồng thời bởi nhiều thread. Ví dụ: từ khóa `synchronized` và các triển khai `Lock` trong Java đều áp dụng cơ chế này.
2. **Khóa đọc-ghi (Read-Write Lock)**: Cho phép nhiều thread đọc tài nguyên dùng chung cùng một lúc, nhưng chỉ cho phép duy nhất một thread thực hiện thao tác ghi tại một thời điểm.
3. **Semaphore (Đèn hiệu)**: Cho phép nhiều thread truy cập vào cùng một tài nguyên tại cùng một thời điểm, nhưng có kiểm soát số lượng thread tối đa được phép truy cập đồng thời.
4. **Barrier (Rào chắn)**: Barrier là một nguyên hàm đồng bộ hóa dùng để chờ nhiều thread cùng tới một điểm mốc rồi mới cùng nhau tiếp tục thực thi. Khi một thread tới rào chắn, nó sẽ dừng lại chờ các thread khác tới, cho tới khi tất cả các thread đều đã tới rào chắn thì chúng mới cùng vượt qua rào chắn để tiếp tục. Ví dụ: `CyclicBarrier` trong Java thuộc cơ chế này.
5. **Biến điều kiện (Condition Variable) / Thông báo sự kiện (Event Notification)**: Thread sẽ chờ khi điều kiện chưa thỏa mãn, và các thread khác sẽ thông báo cho thread đang chờ tiếp tục thực thi sau khi điều kiện thay đổi. Nó thường phải kết hợp cùng Mutex để tránh vấn đề mất thông báo (lost wake-up). Trong Java, `Object.wait()/notify()` và `Condition.await()/signal()` đều thuộc nhóm này; đối tượng Event trong Windows cũng có thể coi là một triển khai nguyên hàm đồng bộ thuộc nhóm thông báo sự kiện.

### PCB là gì? Chứa những thông tin nào?

**PCB (Process Control Block)** tức Khối điều khiển tiến trình, là cấu trúc dữ liệu được hệ điều hành sử dụng để quản lý và theo dõi tiến trình; mỗi tiến trình đều tương ứng với một PCB độc lập. Bạn có thể coi PCB như bộ não hoặc hồ sơ định danh của tiến trình.

Khi hệ điều hành tạo một tiến trình mới, nó sẽ cấp phát một Process ID (PID) duy nhất và khởi tạo một PCB tương ứng cho tiến trình đó. Khi tiến trình thực thi, thông tin trong PCB sẽ liên tục thay đổi, hệ điều hành dựa vào các thông tin này để quản lý và điều phối tiến trình.

- **Thông tin định danh**: PID, PID của tiến trình cha (PPID), User ID (UID)...
- **Trạng thái tiến trình và thông tin điều phối**: Sẵn sàng (ready), đang chạy (running), bị chặn (blocked), độ ưu tiên, time slice, thống kê thời gian sử dụng CPU...
- **Ngữ cảnh CPU (CPU Context)**: Bộ đếm chương trình (Program Counter), con trỏ ngăn xếp (Stack Pointer), các thanh ghi đa năng, từ trạng thái chương trình (PSW)... dùng để khôi phục lại việc thực thi sau khi context switch.
- **Thông tin quản lý bộ nhớ**: Giới hạn không gian địa chỉ ảo, bảng trang, ánh xạ bộ nhớ...
- **Thông tin tài nguyên**: Danh sách file đang mở, file descriptor, trạng thái I/O, thư mục làm việc, thông tin xử lý tín hiệu (signal)...
- ...

Khi xảy ra context switch, hệ điều hành sẽ lưu lại hiện trường (các thanh ghi...) của tiến trình hiện tại vào PCB của nó, sau đó khôi phục hiện trường từ PCB của tiến trình tiếp theo để tiến trình đó có thể tiếp tục chạy từ vị trí đã tạm dừng trước đó.

### TCB là gì? Có quan hệ như thế nào với PCB?

**TCB (Thread Control Block)** tức Khối điều khiển luồng, dùng để lưu trữ thông tin kiểm soát ở cấp độ thread, ví dụ: Thread ID, trạng thái thread, hiện trường thanh ghi, thông tin stack, độ ưu tiên điều phối, Thread-Local Storage...

Trong một số giáo trình hoặc kiến trúc hệ điều hành, PCB và TCB được tách bạch rõ ràng: PCB thiên về tài nguyên cấp tiến trình, TCB thiên về hiện trường thực thi cấp luồng. Triển khai của Linux thì khá đặc biệt: Linux coi cả process và thread đều là task, sử dụng `task_struct` để mô tả thực thể điều phối, sau đó dựa vào việc các cấu trúc tài nguyên có được chia sẻ hay không để phân biệt process và thread. Khi tìm hiểu bạn không cần quá câu nệ vào tên gọi, điều cốt lõi là nắm rõ: **Không gian địa chỉ, bảng file... thuộc về ranh giới tài nguyên; còn stack, thanh ghi, program counter... thuộc về hiện trường thực thi**.

### Process có những trạng thái nào?

Chúng ta thường chia tiến trình thành 5 trạng thái cơ bản, điểm này rất tương đồng với thread:

- **Trạng thái khởi tạo (new)**: Tiến trình đang được tạo lập, chưa chuyển sang trạng thái sẵn sàng.
- **Trạng thái sẵn sàng (ready)**: Tiến trình đã chuẩn bị xong xuôi để chạy, tức là đã có đủ mọi tài nguyên cần thiết ngoại trừ CPU; chỉ cần được cấp phát tài nguyên vi xử lý (time slice) là có thể chạy ngay.
- **Trạng thái đang chạy (running)**: Tiến trình đang thực thi trên vi xử lý (trên CPU đơn nhân tại một thời điểm chỉ có duy nhất một tiến trình ở trạng thái running).
- **Trạng thái bị chặn (waiting / blocked)**: Còn gọi là trạng thái chờ đợi, tiến trình tạm dừng hoạt động để chờ đợi một sự kiện nào đó (chẳng hạn chờ tài nguyên sẵn sàng hoặc chờ thao tác I/O hoàn tất). Ngay cả khi CPU đang rảnh rỗi thì tiến trình này cũng không thể chạy.
- **Trạng thái kết thúc (terminated)**: Tiến trình đang biến mất khỏi hệ thống. Có thể do tiến trình kết thúc bình thường hoặc bị hủy bỏ do lỗi.

![Sơ đồ chuyển đổi trạng thái tiến trình](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/state-transition-of-process-d4bbabcd.png)

Khi học về chuyển đổi trạng thái, bạn cần chú ý tới nguyên nhân kích hoạt: Trạng thái Ready nhận được CPU sẽ chuyển sang Running; Running hết time slice có thể quay lại Ready; Running phát sinh I/O chặn, chờ lock hoặc chờ sự kiện sẽ chuyển sang Blocked; sự kiện chờ đợi hoàn thành thì thông thường tiến trình sẽ quay lại Ready để đợi được điều phối ở lượt kế tiếp.

Một số giáo trình còn bổ sung thêm **trạng thái treo (Suspended)**. Trạng thái treo nhấn mạnh việc tiến trình tạm thời không nằm trong bộ nhớ RAM (bị chuyển ra swap/đĩa), hoặc bị người dùng/hệ thống tạm dừng; trong khi trạng thái blocked nhấn mạnh việc tiến trình đang chờ một sự kiện. Hai khái niệm này khác nhau: một tiến trình có thể bị blocked nhưng vẫn nằm trong RAM, hoặc có thể bị hoán đổi ra đĩa và rơi vào trạng thái blocked-suspended.

### Các phương thức giao tiếp liên tiến trình (IPC) gồm những gì?

Do mặc định mỗi tiến trình đều có không gian địa chỉ ảo độc lập và không thể trực tiếp truy cập vào bộ nhớ user mode của nhau, nên cần tới **IPC (Inter-Process Communication, giao tiếp liên tiến trình)**.

Khi đi phỏng vấn, bạn có thể trả lời theo từng kịch bản sử dụng thực tế:

- Truyền luồng byte nhỏ giữa tiến trình cha và con: Anonymous Pipe (đường ống vô danh).
- Giao tiếp cục bộ giữa các tiến trình không có quan hệ huyết thống: Named Pipe (FIFO - đường ống có tên), Unix Domain Socket.
- Thông điệp có cấu trúc kích thước nhỏ: Message Queue (hàng đợi thông điệp).
- Trao đổi khối lượng dữ liệu lớn cục bộ: Shared Memory (bộ nhớ dùng chung), nhưng phải kết hợp với các cơ chế đồng bộ như semaphore, mutex, `futex`, `eventfd`.
- Thông báo sự kiện bất đồng bộ: Signal (tín hiệu).
- Giao tiếp giữa các máy tính khác nhau: TCP/UDP Socket hoặc các RPC framework tầng trên.

Để xem phân loại có hệ thống, ranh giới và cách lựa chọn giải pháp, mời xem: [Giải thích chi tiết về Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder](./ipc.md), đường dẫn: `./ipc.md`.

### fork, exec, wait lần lượt làm nhiệm vụ gì?

Trong lập trình Unix/Linux, việc tạo tiến trình và thay thế chương trình luôn gắn liền với bộ ba `fork()`, `exec()`, `wait()`. Dưới đây là câu trả lời ngắn gọn phục vụ phỏng vấn; các chi tiết về kế thừa file descriptor, Copy-On-Write và `fork` trong môi trường đa luồng có thể xem tại: [Giải thích chi tiết về Process và Thread](./process-and-thread.md), đường dẫn: `./process-and-thread.md`.

![Chuỗi gọi hàm của fork, exec và wait](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/fork-exec-wait-call-chain-4d2918b1.png)

- **`fork()`**: Tạo tiến trình con. Cả tiến trình cha và con đều tiếp tục thực thi từ cùng một vị trí sau lệnh gọi, nhưng nhận giá trị trả về khác nhau.
- **`exec()`**: Nạp và thực thi một chương trình khác trong tiến trình hiện tại. Nó không tạo ra tiến trình mới, mà thay thế toàn bộ mã lệnh và dữ liệu ở User Mode của tiến trình hiện tại.
- **`wait()` / `waitpid()`**: Chờ trạng thái của tiến trình con thay đổi, và thu dọn thông tin trạng thái mà tiến trình con để lại trong kernel sau khi thoát.

Khi Shell khởi chạy một câu lệnh ngoài, chuỗi xử lý thường thấy là: Shell gọi `fork()` để tạo tiến trình con, tiến trình con gọi `exec()` để nạp chương trình đích, và tiến trình cha Shell dùng `wait()` hoặc `waitpid()` để chờ và thu dọn trạng thái thoát. Nếu tiến trình cha không thu dọn tiến trình con đã thoát, hệ thống sẽ xuất hiện zombie process (tiến trình thây ma).

### Context Switch (Chuyển đổi ngữ cảnh) là gì?

Context switch chỉ việc CPU chuyển quyền thực thi từ một thực thể này sang một thực thể khác. Hệ điều hành cần lưu lại ngữ cảnh hiện tại gồm các thanh ghi, bộ đếm chương trình, con trỏ stack của thực thể đang chạy, sau đó khôi phục lại ngữ cảnh của thực thể tiếp theo.

![So sánh chi phí giữa Thread Context Switch và Process Context Switch](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/context-switch-cost-comparison-63e31c11.png)

Cả chuyển đổi thread lẫn chuyển đổi process đều phát sinh chi phí, nhưng chuyển đổi process thường nặng nề hơn rất nhiều. Lý do là process sở hữu không gian địa chỉ độc lập; việc chuyển đổi process có thể kéo theo việc chuyển đổi bảng trang, vô hiệu hóa TLB (TLB invalidation), suy giảm tính cục bộ của bộ nhớ cache...; trong khi các thread trong cùng process dùng chung không gian địa chỉ, nên khi chuyển đổi thường không cần thay đổi toàn bộ ánh xạ bộ nhớ.

Bạn có thể hiểu đơn giản: Chuyển đổi thread trong cùng process chủ yếu chỉ tráo đổi ngữ cảnh thực thi riêng của thread (stack, thanh ghi, PC); còn chuyển đổi giữa các process khác nhau thì ngoài việc tráo đổi ngữ cảnh thực thi còn phải chuyển đổi không gian địa chỉ, mang lại tổn thất lớn về TLB và cache locality. Khi phân tích hiệu năng hệ thống thực tế, nếu phát hiện phần lớn thời gian CPU bị tiêu tốn cho việc điều phối, chờ lock, system call và context switch, việc tiếp tục cắm đầu tăng số lượng thread thường chỉ làm tình hình tồi tệ hơn.

Bạn cũng cần phân biệt rạch ròi giữa **Context Switch** và **Chuyển đổi User Mode / Kernel Mode (Mode Switch)**. System call, Page Fault hay ngắt phần cứng đều chuyển CPU vào kernel, nhưng chỉ cần kernel xử lý xong mà vẫn trả quyền điều khiển về cho thread ban đầu, thì không hề xảy ra thread context switch.

### Các thuật toán điều phối tiến trình (Process Scheduling) gồm những gì?

![Các thuật toán điều phối tiến trình phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/scheduling-algorithms-of-process-f1a8c27a.png)

Các thuật toán điều phối tiến trình trong giáo trình được dùng để giải quyết câu hỏi: Khi số lượng tác vụ sẵn sàng chạy nhiều hơn số lượng core CPU, thì nên cho ai chạy trước? Bộ điều phối thường phải cân bằng giữa các yếu tố: **thông lượng (throughput), thời gian chu chuyển (turnaround time), thời gian phản hồi (response time), tính công bằng (fairness)** và chi phí chuyển đổi.

Các thuật toán này có thể chia thành hai nhóm lớn: **Không đoạt quyền (Non-Preemptive)** và **Có đoạt quyền (Preemptive)**.

**Nhóm 1: Điều phối không đoạt quyền (Non-Preemptive Scheduling)**

Ở phương thức này, một khi CPU đã được cấp phát cho một tiến trình, nó sẽ tiếp tục chạy mãi cho tới khi hoàn thành hoặc tự nguyện nhường lại CPU (chẳng hạn khi chờ I/O).

1. **Đến trước phục vụ trước (FCFS - First Come, First Served)**: Chạy theo thứ tự tiến trình đến trước; triển khai đơn giản, nhưng khi tác vụ dài xếp phía trước thì các tác vụ ngắn phía sau phải chờ rất lâu, gây ra hiện tượng hộ tống (convoy effect).
2. **Việc ngắn nhất làm trước (SJF - Shortest Job First)**: Ưu tiên chạy các tác vụ có thời gian thực thi dự kiến ngắn nhất, giúp giảm thời gian chờ trung bình; tuy nhiên trong thực tế rất khó dự đoán chính xác thời lượng của tác vụ, đồng thời có thể khiến các tác vụ dài bị bỏ đói (starvation) trong thời gian dài.

**Nhóm 2: Điều phối có đoạt quyền (Preemptive Scheduling)**

Hệ điều hành có thể tạm dừng tác vụ hiện tại để trao CPU cho một tác vụ sẵn sàng chạy khác phù hợp hơn. Các hệ điều hành đa dụng hiện đại hầu như đều hỗ trợ cơ chế đoạt quyền.

- **Xoay vòng thời gian (RR - Round-Robin)**: Mỗi tác vụ lần lượt được chạy trong một lát cắt thời gian (time slice). Nếu time slice quá ngắn sẽ phóng đại chi phí context switch; nếu quá dài thì thuật toán sẽ dần biến thành FCFS.
- **Điều phối theo độ ưu tiên (Priority Scheduling)**: Ưu tiên chạy các tác vụ có độ ưu tiên cao hơn, thể hiện được mức độ khẩn cấp của công việc, nhưng cần có cơ chế làm già độ ưu tiên (aging) để giải quyết tình trạng đói tài nguyên của các tác vụ có độ ưu tiên thấp.

**Hàng đợi phản hồi đa cấp (MLFQ - Multi-Level Feedback Queue)** thiết lập nhiều hàng đợi có mức ưu tiên khác nhau, và tự động điều chỉnh vị trí của tác vụ dựa trên hành vi thực thi thực tế của nó. Tác vụ mới thường được đưa vào hàng đợi ưu tiên cao; các tác vụ CPU-bound thường xuyên dùng hết time slice sẽ dần bị giáng cấp xuống hàng đợi thấp hơn, trong khi các tác vụ tương tác thường chủ động chờ I/O sẽ được giữ lại ở hàng đợi ưu tiên cao. Quy tắc thăng cấp, giáng cấp và chống đói cụ thể tùy thuộc vào cách hiện thực của hệ thống.

FCFS, SJF, RR, Priority và MLFQ chủ yếu là các mô hình đơn giản hóa trong sách giáo khoa. Trong thực tế, Linux điều phối các task hoặc schedulable entity: các tác vụ thông thường từ lâu được điều phối bởi CFS dựa trên trọng số và `vruntime` để phân bổ CPU; từ phiên bản Linux 6.6, EEVDF bắt đầu được đưa vào lớp điều phối fair, sử dụng lag và hạn chót ảo (virtual deadline) để cải thiện việc lựa chọn tác vụ. Máy chủ production sử dụng cơ chế nào còn tùy thuộc vào phiên bản kernel và các bản vá của bản phân phối.

Bài viết chi tiết: [Giải thích chi tiết về CPU Scheduling và Tải hệ thống](./cpu-scheduling-and-load.md).

### Vậy rốt cuộc thành phần nào thực hiện điều phối tiến trình?

Thành phần chịu trách nhiệm điều phối là **Bộ điều phối (Scheduler)** nằm trong kernel của hệ điều hành. Khi tác vụ hiện tại bị block, chủ động nhường CPU, hết time slice hoặc hạn mức chạy, độ ưu tiên thay đổi, hoặc có một tác vụ phù hợp hơn được đánh thức, kernel đều có thể kích hoạt quá trình điều phối.

Trong giáo trình, người ta còn dùng khái niệm **Bộ phân phối (Dispatcher)** để mô tả quá trình áp dụng quyết định điều phối lên CPU:

- Scheduler chọn ra tác vụ tiếp theo từ hàng đợi sẵn sàng (run queue).
- Quá trình Dispatcher hoàn tất thao tác context switch cụ thể:
  - Lưu ngữ cảnh của tiến trình hiện tại (trạng thái thanh ghi CPU, bộ đếm chương trình...) vào PCB của nó.
  - Nạp ngữ cảnh của tiến trình tiếp theo được chọn, đọc trạng thái từ PCB của nó và khôi phục vào các thanh ghi CPU.
  - Chính thức bàn giao quyền điều khiển CPU cho tiến trình mới để nó bắt đầu thực thi.

Triển khai thực tế trong Linux kernel hiện đại không tách cứng nhắc thành hai thành phần độc lập; khi đi phỏng vấn, bạn chỉ cần nắm chắc hai nhiệm vụ: "lựa chọn tác vụ tiếp theo" và "hoàn thành việc tráo đổi ngữ cảnh".

### Điểm khác biệt giữa load average và CPU utilization là gì?

Load average phản ánh số lượng tác vụ đang ở trạng thái có thể chạy (R - runnable) và trạng thái ngủ không thể ngắt (D - uninterruptible sleep) trung bình trong hệ thống qua một khoảng thời gian nhất định (1, 5, 15 phút); trong khi CPU utilization (mức sử dụng CPU) mô tả cụ thể thời gian của CPU được tiêu tốn vào đâu: User Mode, Kernel Mode, I/O wait, Interrupt, Idle, hay Steal (ảo hóa).

Chỉ số load cao có thể do các tác vụ runnable đang tranh chấp CPU gay gắt, nhưng cũng có thể do một lượng lớn tác vụ đang bị tắc nghẽn chờ thiết bị lưu trữ, lưu trữ mạng, hệ thống tập tin hoặc Swap; ở trường hợp thứ hai, CPU thực tế vẫn có thể rất rảnh rỗi. Khi đánh giá load average, bắt buộc phải đối chiếu với số lượng CPU logic: cùng là load bằng 8, nhưng đối với máy chủ có 1 CPU logic và máy chủ có 64 CPU logic thì áp lực là hoàn toàn khác nhau một trời một vực.

Khi chẩn đoán sự cố, bạn có thể dùng lệnh `uptime` để quan sát xu hướng tải ở các mốc 1, 5, 15 phút, sau đó kết hợp với `top`, `vmstat 1`, `pidstat` và `mpstat` để xác định xem các tác vụ đang tranh chấp CPU, đang chờ I/O, hay đang liên tục bị context switch. Xem giải thích đầy đủ các chỉ số và quy trình chẩn đoán tại: [Giải thích chi tiết về CPU Scheduling và Tải hệ thống](./cpu-scheduling-and-load.md).

## Deadlock (Khóa chết)

### Deadlock là gì?

Deadlock (khóa chết) mô tả tình huống trong đó một nhóm các process hoặc thread đang chờ đợi lẫn nhau giải phóng tài nguyên hoặc hoàn thành hành động, các mối quan hệ chờ đợi này tạo thành một vòng tròn khép kín, dẫn tới việc tất cả các bên tham gia đều không thể tự mình tiếp tục thực thi.

Nói một cách cụ thể hơn, deadlock không đơn thuần chỉ là "chờ đợi lâu". Việc chờ đợi thông thường có thể tiếp tục thực thi sau khi khóa được giải phóng, I/O trả về dữ liệu hoặc transaction hoàn tất; trong khi ở deadlock, chuỗi chờ đợi đã tạo thành một vòng lặp kín (loop), nếu không có sự can thiệp từ bên ngoài thì vòng lặp này sẽ vĩnh viễn không thể tự tháo gỡ.

Để tìm hiểu quy trình hình thành deadlock, cách chẩn đoán deadlock trong Java thread và xử lý deadlock trong database, mời xem bài viết chuyên đề đầy đủ: [Giải thích chi tiết về Deadlock: Bốn điều kiện cần, Chẩn đoán Deadlock Java và Xử lý Deadlock Cơ sở dữ liệu](./dead-lock.md).

Một ví dụ kinh điển nhất chính là **"giữ khóa chéo nhau" (cross-holding locks)**. Hãy tưởng tượng có 2 thread và 2 lock:

- Thread 1 chiếm được Lock A trước, sau đó cố gắng lấy thêm Lock B.
- Gần như cùng lúc đó, Thread 2 chiếm được Lock B trước, sau đó cố gắng lấy thêm Lock A.

Lúc này, Thread 1 chờ Thread 2 nhả Lock B, còn Thread 2 lại chờ Thread 1 nhả Lock A, cả hai bên đều đang nắm giữ tài nguyên mà đối phương cần và đồng thời chờ đối phương nhả ra, tạo thành một vòng tròn chờ đợi.

![Sơ đồ kịch bản Deadlock: Thread A giữ resource1 và chờ resource2, Thread B giữ resource2 và chờ resource1, chuỗi chờ đợi tạo thành vòng lặp khép kín](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-scenario-13be7e13.png)

### Bốn điều kiện cần để xảy ra Deadlock là gì?

Sự xuất hiện của deadlock không phải là ngẫu nhiên, nó đòi hỏi phải đồng thời thỏa mãn **bốn điều kiện cần**:

1. **Loại trừ tương hỗ (Mutual Exclusion)**: Tài nguyên phải ở chế độ không thể chia sẻ, tức là tại một thời điểm chỉ có duy nhất một tiến trình được sử dụng. Nếu tiến trình khác yêu cầu tài nguyên này, nó buộc phải chờ cho đến khi tài nguyên được giải phóng.
2. **Chiếm giữ và chờ đợi (Hold and Wait)**: Một tiến trình phải đang nắm giữ ít nhất một tài nguyên, đồng thời đang chờ xin cấp phát thêm tài nguyên khác mà tài nguyên đó hiện đang bị tiến trình khác chiếm giữ.
3. **Không đoạt quyền (No Preemption)**: Tài nguyên không thể bị cướp đoạt giữa chừng. Tài nguyên chỉ có thể được giải phóng một cách tự nguyện bởi chính tiến trình đang nắm giữ sau khi nó đã hoàn thành nhiệm vụ.
4. **Chờ đợi vòng tròn (Circular Wait)**: Tồn tại một tập hợp các tiến trình chờ đợi `{P0, P1, ..., Pn}`, trong đó `P0` chờ tài nguyên do `P1` nắm giữ, `P1` chờ tài nguyên do `P2` nắm giữ, ..., `Pn-1` chờ tài nguyên do `Pn` nắm giữ, và `Pn` lại chờ tài nguyên do `P0` nắm giữ.

![Sơ đồ 4 điều kiện cần của Deadlock: Loại trừ tương hỗ, Chiếm giữ và chờ đợi, Không đoạt quyền, Chờ đợi vòng tròn đồng thời xảy ra mới tạo thành Deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-four-conditions-79f8adec.png)

**Lưu ý**: Bốn điều kiện này là điều kiện cần của deadlock, bắt buộc phải đồng thời thỏa mãn. Nếu chỉ thỏa mãn một hoặc hai điều kiện thì chưa chắc đã xảy ra deadlock; ngược lại, chỉ cần chúng ta phá vỡ được bất kỳ một điều kiện nào trong số đó một cách chắc chắn, là có thể ngăn chặn hoàn toàn deadlock về mặt cấu trúc.

### Bạn có thể viết đoạn code mô phỏng việc tạo ra Deadlock không?

Dưới đây là một ví dụ thực tế bằng Java nhằm tái hiện lại kịch bản giữ khóa chéo nhau ở trên:

```java
public class DeadLockDemo {
    private static final Object resource1 = new Object(); // Tài nguyên 1
    private static final Object resource2 = new Object(); // Tài nguyên 2

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

Output:

```text
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

Thread 1 giành được monitor lock của `resource1` thông qua `synchronized (resource1)`, trong khi Thread 2 giành được monitor lock của `resource2` thông qua `synchronized (resource2)`. Lệnh `Thread.sleep(1000)` không phải là nguyên nhân gây ra deadlock; nó chỉ có tác dụng kéo dài cửa sổ thực thi xen kẽ giữa hai thread để deadlock chắc chắn xảy ra. Sau khi ngủ dậy, cả hai thread đều xin cấp phát tài nguyên mà đối phương đang nắm giữ, do đó cùng rơi vào trạng thái chờ đợi lẫn nhau.

### Các phương pháp giải quyết Deadlock

Khi phỏng vấn, bạn chỉ cần trả lời tới cấp độ sau: Việc giải quyết deadlock nhìn chung có 4 hướng tiếp cận: **Phòng ngừa (Prevention), Tránh né (Avoidance), Phát hiện (Detection) và Hóa giải / Khôi phục (Recovery)**.

- **Phòng ngừa (Prevention)**: Chủ động phá vỡ một trong 4 điều kiện cần của deadlock từ trước. Trong thực tế công nghệ, giải pháp phổ biến nhất là cố định thứ tự lấy khóa (lock ordering), thu hẹp phạm vi giữ khóa, và tránh thực hiện các thao tác chậm khi đang giữ khóa.
- **Tránh né (Avoidance)**: Trước khi cấp phát tài nguyên, đánh giá xem hệ thống có duy trì được trạng thái an toàn (safe state) hay không, đại diện kinh điển là Thuật toán ngân hàng (Banker's Algorithm). Phương pháp này chủ yếu mang tính lý thuyết trong giáo trình, các hệ thống nghiệp vụ thông thường hiếm khi áp dụng trực tiếp.
- **Phát hiện (Detection)**: Chấp nhận cho việc chờ đợi diễn ra, sau đó kiểm tra xem trong đồ thị chờ (Wait-For Graph) hoặc đồ thị cấp phát tài nguyên (Resource Allocation Graph) có xuất hiện chu trình lặp (cycle) hay không. Trong Java có thể dùng `jcmd <pid> Thread.print -l`, `jstack -l <pid>` hoặc `ThreadMXBean.findDeadlockedThreads()` để hỗ trợ phát hiện; các hệ cơ sở dữ liệu cũng liên tục quét tìm chu trình chờ đợi giữa các transaction.
- **Hóa giải / Khôi phục (Recovery)**: Sau khi phát hiện deadlock thì phá vỡ chu trình chờ đợi, ví dụ như buộc dừng tiến trình, rollback transaction, thu hồi tài nguyên hoặc yêu cầu tầng ứng dụng thực hiện cơ chế retry. Transaction trong database có sẵn khả năng rollback tự nhiên, do đó rất phù hợp áp dụng mô hình phát hiện và khôi phục.

![Sơ đồ chiến lược xử lý Deadlock: Vị trí tác động và mức độ phổ biến trong kỹ thuật của 4 phương pháp phòng ngừa, tránh né, phát hiện, khôi phục](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-strategies-b7623bee.png)

Phần này trong phỏng vấn không cần đi quá sâu, chỉ cần nắm vững các tầng chiến lược. Nếu muốn tìm hiểu thêm về đồ thị cấp phát tài nguyên, đồ thị chờ đợi, phân tích thread stack trong Java và retry khi gặp deadlock trong database, mời xem: [Giải thích chi tiết về Deadlock: Bốn điều kiện cần, Chẩn đoán Deadlock Java và Xử lý Deadlock Cơ sở dữ liệu](./dead-lock.md).

## Tài liệu tham khảo

- *Giáo trình Hệ điều hành máy tính* (Thang Tiểu Đan - Tái bản lần thứ 4)
- *Computer Systems: A Programmer's Perspective* (CS:APP)
- *Học lại Hệ điều hành* (Relearning Operating Systems)
- Tại sao hệ điều hành cần phân chia User Mode và Kernel Mode: <https://blog.csdn.net/chen134225/article/details/81783980>
- Hiểu thấu đáo về User Mode và Kernel Mode từ gốc rễ: <https://juejin.cn/post/6923863670132850701>
- Thế nào là zombie process và orphan process: <https://blog.csdn.net/a745233700/article/details/120715371>
