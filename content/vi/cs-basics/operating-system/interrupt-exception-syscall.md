---
title: "Giải thích chi tiết về Ngắt (Interrupt), Ngoại lệ (Exception) và Lời gọi hệ thống (System Call): Từ Kernel Entry đến Page Fault"
description: "Tổng hợp các câu hỏi phỏng vấn tần suất cao về ngắt, ngoại lệ và lời gọi hệ thống. Lấy read() làm sợi dây xuyên suốt để làm rõ mối quan hệ giữa ngắt phần cứng, ngoại lệ đồng bộ, system call, tín hiệu (signal), ngắt đồng hồ (timer interrupt), lỗi trang (page fault) và chuyển đổi ngữ cảnh luồng (thread context switch)."
category: Cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
  - Lời gọi hệ thống
head:
  - - meta
    - name: keywords
      content: ngắt, ngoại lệ, lời gọi hệ thống, syscall, trap, tín hiệu, signal, user mode, kernel mode, chuyển đổi ngữ cảnh, context switch, ngắt đồng hồ, timer interrupt, lỗi trang, Page Fault, SIGSEGV, read, câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/interrupt-exception-syscall.md
---

Việc system call chuyển từ user mode (chế độ người dùng) sang kernel mode (chế độ nhân) chỉ là điểm khởi đầu để thấu hiểu đường dẫn thực thi này. Đi sâu hơn dọc theo một lệnh gọi `read()`, bạn sẽ bắt gặp một loạt câu hỏi liên quan mật thiết với nhau:

- `read()` thực sự đi vào kernel bằng cách nào?
- Tại sao timer interrupt (ngắt đồng hồ) lại có thể khiến một thread đang chạy phải dừng lại?
- Tại sao Page Fault (lỗi trang) đôi khi là hành vi bình thường của hệ thống, nhưng đôi khi lại biến thành lỗi `SIGSEGV`?
- Khi một system call đi vào kernel, liệu có nhất thiết phải xảy ra thread context switch (chuyển đổi ngữ cảnh luồng) hay không?

Những câu hỏi này có thể được xâu chuỗi thông qua một lệnh gọi `read(fd, buf, count)`. Chương trình người dùng thực thi `read()`, glibc đặt mã số system call cùng các tham số vào các thanh ghi đã được quy ước, và CPU thực thi chỉ thị `syscall` để đi vào kernel. Kernel kiểm tra file descriptor (fd), địa chỉ buffer, trạng thái file, rồi quyết định lấy dữ liệu từ Page Cache, file system, socket receive buffer hay device driver.

Nếu dữ liệu đã sẵn sàng, kernel sao chép dữ liệu trở lại user buffer và `read()` nhanh chóng trả về. Nếu dữ liệu chưa sẵn sàng, thread hiện tại có thể chuyển sang trạng thái ngủ (sleep); sau khi I/O đĩa hoàn thành hoặc card mạng nhận được dữ liệu, hardware interrupt (ngắt phần cứng) được gửi vào kernel, và kernel sẽ đánh thức thread trong hàng đợi chờ (wait queue). Chỉ khi thread được điều phối lên CPU một lần nữa, `read()` mới tiếp tục trả về kết quả.

Khi một thao tác I/O thông thường bắt đầu chạy, system call, interrupt, exception và scheduling thường xuyên liên kết chặt chẽ với nhau.

## Các nhóm sự kiện đi vào Kernel

Trong điều kiện bình thường, khi CPU thực thi chương trình người dùng, lệnh tiếp theo được quyết định bởi program counter (con trỏ lệnh) và logic rẽ nhánh. Các sự kiện từ thiết bị ngoại vi, lỗi trong chỉ thị hiện tại, hoặc chương trình người dùng chủ động yêu cầu dịch vụ của kernel đều sẽ chuyển luồng điều khiển vào kernel. Cuốn sách kinh điển CSAPP gọi những trường hợp lệch khỏi luồng chỉ thị thông thường này là Luồng điều khiển ngoại lệ (Exceptional Control Flow - ECF), đồng thời phân loại interrupt, trap, fault và abort thành các kiểu khác nhau.

Các điểm đi vào kernel phổ biến có thể được phân loại theo nguồn gốc:

- **Ngắt (Interrupt)**: Đến từ phần cứng bên ngoài, hoàn toàn không liên quan trực tiếp đến chỉ thị hiện tại của CPU. Card mạng nhận gói tin, I/O đĩa hoàn tất, bộ định thời (timer) hết giờ đều thuộc nhóm này.
- **Bẫy (Trap)**: Chương trình chủ động thực thi một chỉ thị đặc biệt để đi vào kernel. System call chính là dạng trap phổ biến nhất.
- **Lỗi (Fault)**: Chỉ thị hiện tại gặp sự cố trong quá trình thực thi, nhưng kernel có khả năng sửa chữa được. Ví dụ điển hình là lỗi trang (Page Fault); sau khi sửa xong, CPU sẽ thực thi lại chính chỉ thị đã kích hoạt fault đó.
- **Hủy bỏ (Abort)**: Bộ vi xử lý phát hiện lỗi phần cứng/hệ thống nghiêm trọng không thể khắc phục được, thông thường sẽ không bao giờ quay lại luồng chỉ thị ban đầu nữa.

![Sơ đồ mối quan hệ giữa ngắt, ngoại lệ và lời gọi hệ thống](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/ecf-kernel-entry-map-05ab14c5.webp)

Từ `trap` được sử dụng với ngữ nghĩa không hoàn toàn giống nhau trong các tài liệu khác nhau. Trong ngữ cảnh của CSAPP, nó thường chỉ các ngoại lệ đồng bộ do chương trình chủ động kích hoạt, chẳng hạn như system call; trong khi đó, kiến trúc RISC-V định nghĩa trap là bất kỳ sự chuyển giao quyền điều khiển nào do exception hoặc interrupt gây ra. Khi bài viết này đề cập đến "trap / system call", nó sử dụng định nghĩa hẹp đầu tiên; các trường hợp liên quan đến RISC-V sẽ được nêu rõ riêng.

## Mối quan hệ giữa Ngắt, Ngoại lệ, System Call và Tín hiệu (Signal)

Các khái niệm này rất dễ bị nhầm lẫn vì chúng không nằm trên cùng một tầng trừu tượng.

Hardware interrupt, synchronous exception và system call mô tả lý do *tại sao* CPU đi vào kernel; trong khi đó, tín hiệu (signal) là thông báo phần mềm do kernel gửi tới một process hoặc thread. Signal có thể được chuyển hóa từ một exception phần cứng, hoặc được tạo ra bởi một process khác, từ terminal hoặc từ timer.

Trước hết hãy tổng hợp các khái niệm này vào một bảng so sánh:

| Khái niệm | Nguồn kích hoạt | Đồng bộ / Bất đồng bộ | Bên xử lý | Kết quả phổ biến |
| --- | --- | --- | --- | --- |
| Hardware Interrupt | Thiết bị ngoại vi hoặc timer | Bất đồng bộ (Asynchronous) | Trình xử lý ngắt của kernel (Interrupt Handler) | Xử lý sự kiện thiết bị, đánh thức tác vụ đang chờ, kích hoạt scheduling |
| Synchronous Exception | Quá trình thực thi chỉ thị hiện tại | Đồng bộ (Synchronous) | Trình xử lý ngoại lệ của kernel (Exception Handler) | Thử lại sau khi sửa, chuyển thành signal, hoặc chấm dứt process |
| System Call | Chương trình chủ động bẫy qua lệnh `syscall`/`ecall` | Đồng bộ (Synchronous) | Điểm tiếp nhận system call của kernel | Trả về kết quả, trả về mã lỗi, hoặc block chờ tài nguyên |
| Tín hiệu (Signal) | Thông báo do kernel hoặc process gửi đi | Thường là bất đồng bộ (có thể sinh ra đồng bộ từ exception) | Hành động mặc định của process đích hoặc user-mode signal handler | Bỏ qua, chấm dứt, tạm dừng, tiếp tục, hoặc chạy handler |

Tính chất đồng bộ/bất đồng bộ trong bảng trên xem xét việc sự kiện có phải do chính chỉ thị hiện tại sinh ra hay không. Lỗi chia cho 0, lệnh không hợp lệ, Page Fault và system call đều gắn liền trực tiếp với chỉ thị đang được thực thi, do đó chúng là các sự kiện đồng bộ. Hardware interrupt đến từ thiết bị ngoại vi hoặc bộ định thời: khi CPU đang mải mê chạy thread Java của bạn, card mạng có thể đồng thời nhận được một gói tin; sự kiện này không liên quan gì đến dòng mã người dùng hiện tại, vì vậy nó là sự kiện bất đồng bộ.

Chặn (blocking) và không chặn (non-blocking) là một chiều không gian khác. Bước đi vào kernel của `read()` là đồng bộ, nhưng sau khi vào kernel, nếu dữ liệu chưa sẵn sàng, một fd dạng blocking sẽ đưa thread vào trạng thái ngủ; ngược lại, fd có cờ `O_NONBLOCK` có thể trả về lỗi `EAGAIN` ngay lập tức.

Hardware interrupt giống như việc một thiết bị ngoại vi gõ vào vai CPU. Chẳng hạn, CPU đang chạy thread Java của bạn, một timer interrupt ập đến; sau khi CPU thực thi xong chỉ thị hiện tại, nó sẽ nhảy vào điểm xử lý ngắt của kernel. Kernel cập nhật đồng hồ, tính toán thời gian chạy, và nếu cần thiết sẽ yêu cầu scheduler bàn giao CPU cho một thread khác. Mã nguồn của bạn không hề viết dòng lệnh nhường CPU nào, nhưng thread vẫn có thể bị chiếm quyền (preemption).

Ngoại lệ (exception) phát sinh từ chính bản thân chỉ thị hiện tại. Phép chia cho 0, thực thi chỉ thị không hợp lệ, truy cập vùng địa chỉ không có quyền đều là các vấn đề do chính chỉ thị đó gây ra. Page Fault cũng thuộc nhóm này: khi một process truy cập vào một địa chỉ ảo mà bảng trang (page table) tạm thời chưa có ánh xạ hợp lệ, CPU buộc phải chuyển giao ngữ cảnh cho kernel xử lý. Một ngoại lệ đồng bộ không có nghĩa là chắc chắn sửa được; nếu kernel không thể khắc phục, nó sẽ gửi signal hoặc chấm dứt process.

System call là việc chương trình người dùng chủ động nhờ kernel trợ giúp. Chương trình ở user mode không được phép trực tiếp đọc đĩa cứng, sửa bảng trang hay thao tác trên card mạng, vì vậy các hàm glibc như `read()`, `write()`, `fork()`, `mmap()` cuối cùng đều phải đi qua giao diện system call do kernel cung cấp.

Tín hiệu (signal) không thuộc về cơ chế tiếp nhận phần cứng của CPU. Nó là thông báo do kernel gửi cho process hoặc thread. Một hành vi truy cập bộ nhớ trái phép có thể kích hoạt Page Fault trước; khi kernel nhận thấy không thể khắc phục, nó mới gửi `SIGSEGV` cho process. Khi người dùng bấm tổ hợp phím `Ctrl+C`, driver của terminal sẽ yêu cầu kernel gửi `SIGINT` cho nhóm tiến trình tiền cảnh (foreground process group). Một process khác cũng có thể gọi hàm `kill()` để gửi signal.

Các chiều không gian dễ gây nhầm lẫn này có thể được tách bạch như sau:

| Chiều không gian | Vấn đề trọng tâm | Ví dụ |
| --- | --- | --- |
| Sự kiện đồng bộ / bất đồng bộ | Sự kiện có do chỉ thị hiện tại trực tiếp kích hoạt không? | Page Fault là exception đồng bộ; ngắt card mạng là interrupt bất đồng bộ |
| I/O Chặn / Không chặn | Thread có phải chờ khi tài nguyên chưa sẵn sàng không? | `read()` dạng blocking sẽ ngủ; `read()` dạng non-blocking có thể trả về `EAGAIN` |
| Chuyển đổi User mode / Kernel mode | Có đi vào kernel để thực thi mã đặc quyền hay không? | `syscall`, Page Fault, hardware interrupt đều đi vào kernel |
| Thread Context Switch | CPU có chuyển từ thread này sang thread khác hay không? | Có thể xảy ra khi bị block, bị chiếm quyền (preemption), hoặc reschedule |

Signal handler cũng không phải là hàm của kernel. Kernel thường kiểm tra các signal đang chờ xử lý ngay trước khi quay từ kernel mode về user mode; nếu cần thực thi handler, kernel sẽ thiết lập user stack, thanh ghi và trampoline, sau đó cho thread quay lại user mode để chạy handler. Do đó, signal handler thường không chèn ngang vào giữa các chỉ thị máy bất kỳ; nó chỉ thực thi sau khi thread quay từ kernel mode về user mode, hoặc sau khi được đánh thức từ giấc ngủ có thể ngắt (interruptible sleep), theo đúng sự sắp xếp của kernel. Trong các chương trình đa luồng, cần lưu ý thêm: một signal gửi đến process chưa chắc đã được xử lý bởi thread bạn mong đợi; kernel sẽ chọn ngẫu nhiên một thread chưa bị che (unmasked) signal đó.

Sau khi sự kiện được xử lý xong, điểm quay về của CPU cũng có sự khác biệt:

| Kiểu sự kiện | Vị trí thường quay về sau khi xử lý |
| --- | --- |
| Interrupt | Quay lại vị trí bị ngắt để tiếp tục chạy, hoặc điều phối sang thread khác |
| Trap / System Call | Thường quay lại chỉ thị ngay sau lệnh trap; ngoại trừ trường hợp restart system call |
| Fault / Lỗi trang | Thực thi lại chính chỉ thị đã kích hoạt fault sau khi đã sửa chữa xong |
| Abort | Thường không bao giờ quay lại chương trình ban đầu |

Bảng trên chỉ mô tả các đường dẫn phổ biến nhất. Trong hệ thống thực tế, kernel còn có thể gửi signal, khởi động lại system call, chuyển sang thread khác hoặc chấm dứt trực tiếp tiến trình.

## Chuyển đổi User Mode/Kernel Mode và Chuyển đổi Ngữ cảnh (Context Switch)

Sự khác biệt cốt lõi giữa user mode và kernel mode nằm ở cấp độ đặc quyền (privilege level) của CPU. User mode không thể thực thi các chỉ thị đặc quyền, không thể tùy tiện truy cập không gian địa chỉ của kernel; ngược lại, kernel mode có toàn quyền quản lý bảng trang, thiết bị phần cứng, bộ điều khiển ngắt và scheduler.

Việc chuyển từ user mode vào kernel mode không phải là một lời gọi hàm thông thường. CPU và kernel bắt buộc phải lưu lại đầy đủ thông tin ngữ cảnh thực thi; nếu không, sau này hệ thống sẽ không biết phải quay lại chỉ thị nào trong chương trình người dùng.

Trên kiến trúc x86-64, các system call 64-bit thường sử dụng chỉ thị `syscall`; trong khi exception và interrupt bên ngoài phần lớn đi qua các entry point đã được cấu hình trong bảng IDT (Interrupt Descriptor Table). Một số exception sẽ đẩy mã lỗi (error code) vào stack, số khác thì không; các entry point đặc biệt như NMI hay Double Fault thậm chí có thể sử dụng stack IST (Interrupt Stack Table) riêng biệt.

Bài viết này lấy Linux x86-64 làm ví dụ nên tập trung vào `syscall`. Các kiến trúc khác hoặc các ABI cũ có thể dùng các chỉ thị như `int 0x80`, `sysenter`, `ecall`, `svc`, với quy ước thanh ghi khác nhau.

Bản thân chỉ thị `syscall` làm khối lượng công việc khá hạn chế. Nó lưu địa chỉ trả về và thanh ghi cờ (flags) vào `RCX` và `R11`, nhưng không lưu toàn bộ các thanh ghi như lời gọi hàm thông thường, cũng không tự động trỏ sang kernel stack. Đoạn mã assembly tại điểm đón tiếp của Linux kernel phải tiếp tục hoàn thành việc hoán đổi stack, gọi lệnh `swapgs`, lưu các thanh ghi cần thiết...

Đặc biệt, cần phân biệt rạch ròi giữa chuyển đổi chế độ và chuyển đổi ngữ cảnh:

- Chuyển đổi User mode / Kernel mode: CPU chuyển từ mức đặc quyền thấp lên mức đặc quyền cao, thực thi mã kernel, rồi quay lại user mode.
- Chuyển đổi ngữ cảnh (Context Switch): Scheduler chuyển quyền sử dụng CPU từ thread/process này sang một thực thể thực thi khác.

Một system call chắc chắn sẽ đi vào kernel, nhưng chưa chắc đã dẫn đến việc chuyển sang thread khác. Những lệnh gọi như `getpid()` thường trả về gần như ngay tức khắc và thread hiện tại vẫn tiếp tục chạy. Nếu `read()` phải chờ đợi dữ liệu, kernel mới có thể treo (suspend) thread hiện tại và điều phối một thread khác lên chạy. Ngoài ra, một số giao diện liên quan đến thời gian có thể hoàn thành ngay tại user mode nhờ cơ chế vDSO; ví dụ `clock_gettime()` hay `gettimeofday()` trên một số kiến trúc và cấu hình có thể đọc trực tiếp trang dữ liệu mà kernel ánh xạ cho user mode mà không cần thực sự đi vào kernel mỗi lần.

![Sơ đồ so sánh giữa chuyển đổi user/kernel mode và context switch](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/kernel-mode-vs-context-switch-7a013af2.webp)

## Đường dẫn System Call của `read()`

Lấy ví dụ hàm `read(fd, buf, count)` trên Linux x86-64, mã nghiệp vụ thông thường chỉ gọi hàm wrapper do thư viện glibc cung cấp chứ không tự viết mã assembly.

![Sơ đồ luồng thực thi system call read](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/read-syscall-path-4aeb6736.webp)

glibc sẽ đưa số hiệu system call vào thanh ghi `rax`, và đặt các tham số vào các thanh ghi theo quy ước. Trên x86-64, các tham số của system call lần lượt được nạp vào `rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9`.

Sau khi CPU thực thi lệnh `syscall`, nó sẽ nhảy đến entry point mà kernel đã cấu hình sẵn theo quy ước kiến trúc. Mã đón tiếp của Linux lưu lại trạng thái các thanh ghi cần dùng sau này, rồi căn cứ vào số hiệu system call để phân phối đến hàm xử lý tương ứng của `read`. Kernel tiến hành kiểm tra fd, quyền truy cập và các tham số khác; khi thực sự sao chép dữ liệu vào buffer của người dùng, vấn đề địa chỉ không hợp lệ vẫn có thể dẫn đến lỗi `EFAULT`.

Nếu mục tiêu là một file thông thường, đường dẫn sẽ đi qua VFS (Virtual File System) và file system cụ thể, ưu tiên lấy dữ liệu từ Page Cache. Nếu mục tiêu là một socket, kernel kiểm tra xem receive buffer có dữ liệu hay chưa. Sau khi dữ liệu sẵn sàng, kernel sao chép dữ liệu vào `buf` do người dùng truyền vào.

Khi kernel truy cập vào buffer của người dùng, thao tác này cũng có thể kích hoạt Page Fault. Linux ghi nhận các vị trí truy cập bộ nhớ người dùng có khả năng bị fault vào một bảng gọi là exception table; nếu fault xảy ra tại một vị trí có thể khắc phục được, kernel sẽ nhảy đến đoạn mã fixup tương ứng, chuyển đổi kết quả thành mã lỗi như `-EFAULT` để trả về, thay vì làm toàn bộ kernel bị sập (kernel panic).

Ví dụ, nếu truyền vào `read()` một con trỏ `buf` trỏ tới địa chỉ rõ ràng không thể ghi, system call thông thường sẽ không kéo sập kernel mà trả về giá trị `-1` và gán biến `errno` thành `EFAULT`.

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

int main(void) {
    int fd = open("/dev/zero", O_RDONLY);
    char *p = (char *)1;
    ssize_t n = read(fd, p, 1); // n == -1, errno == EFAULT
    printf("n=%zd errno=%d\n", n, errno);
}
```

Mô tả về `EFAULT` trong `read(2)` nêu rõ: buffer của người dùng nằm ngoài không gian địa chỉ có thể truy cập được. Đối chiếu vào đường dẫn kernel, sự cố xảy ra ở bước kernel sao chép dữ liệu trở lại user buffer. Tài liệu exception table của x86 cũng dùng hàm `get_user()` làm ví dụ: các lệnh truy cập bộ nhớ người dùng có khả năng fault sẽ được ghép đôi với một đoạn mã fixup; sau khi Page Fault xảy ra, kernel tra cứu được cặp địa chỉ này, sửa giá trị trả về thành `-EFAULT`, rồi nhảy sang đường dẫn fixup để hoàn tất dọn dẹp.

Khi system call kết thúc, một lệnh `read()` thành công sẽ trả về số byte thực tế đọc được; con số này có thể nhỏ hơn `count` mà không bị coi là lỗi. Khi thất bại, kernel trả về một mã lỗi âm, và hàm wrapper của glibc thường chuyển nó thành `-1` đồng thời gán giá trị cho `errno`. Nếu user buffer không thể truy cập, lỗi nhận được có thể là `EFAULT`; nếu trong lúc chờ blocking bị tín hiệu ngắt quãng, lỗi nhận được có thể là `EINTR`.

Khi viết code production, đừng bao giờ mặc định một lần gọi `read()` hoặc là đọc đầy dữ liệu, hoặc là thất bại hoàn toàn. Trong thời gian system call dạng blocking đang chờ, nếu thread nhận được signal và thực thi handler, system call có thể trả về `EINTR`; nếu trước khi signal tới đã đọc được một phần dữ liệu, `read()` cũng có thể trực tiếp trả về số byte đã đọc được thay vì báo lỗi. Nếu khi đăng ký signal handler có sử dụng cờ `SA_RESTART`, một số system call dạng blocking sẽ tự động khởi động lại sau khi handler thực thi xong. Việc có tự khởi động lại hay không phụ thuộc vào loại giao diện và cấu hình xử lý tín hiệu.

## Ngắt đồng hồ và Chiếm quyền điều khiển (Preemption)

Một hệ điều hành đa nhiệm ưu tiên (preemptive OS) không thể trông chờ vào việc mọi chương trình đều tự nguyện nhường CPU. Sách giáo khoa thường đơn giản hóa cơ chế này thành việc kernel cấu hình một bộ định thời (timer) và phần cứng định kỳ phát ra interrupt. Dù Linux hiện đại đã hỗ trợ chế độ tickless và máy tính thực tế không nhất thiết phát ra scheduling tick với tần số cố định, timer interrupt vẫn là mô hình cơ bản để hiểu về preemption.

Giả sử Thread A đang chạy ở user mode. Khi timer hết giờ, CPU đi vào trình xử lý ngắt đồng hồ (timer interrupt handler) của kernel. Kernel cập nhật thời gian chạy của Thread A và kiểm tra xem có cần điều phối lại hay không. Nếu không cần điều phối, sau khi xử lý xong sẽ quay về Thread A để A chạy tiếp; nếu cần điều phối, kernel lưu lại ngữ cảnh thực thi của A, chọn ra Thread B, chuyển sang kernel stack và ngữ cảnh thanh ghi của B, cuối cùng từ kernel quay về vị trí thực thi ở user mode của Thread B.

Khi cuốn sách OSTEP giảng giải về Limited Direct Execution (Thực thi trực tiếp có giới hạn), nó cũng trình bày theo chuỗi này: timer interrupt giúp phần cứng và kernel lưu lại các thanh ghi user mode của tiến trình hiện tại, kernel sau đó gọi thủ tục switch để lưu ngữ cảnh tiến trình cũ, khôi phục ngữ cảnh tiến trình mới, và cuối cùng dùng lệnh return-from-trap để quay lại tiến trình mới.

Trên đường dẫn này, interrupt chắc chắn đã xảy ra; còn việc có xảy ra context switch hay không hoàn toàn phụ thuộc vào việc scheduler có chọn một thread khác hay không.

Trình xử lý ngắt phần cứng (hardware interrupt handler) thường phải tuân thủ nguyên tắc vào nhanh ra nhanh, không được phép tùy tiện block hay ngủ như ngữ cảnh process thông thường. Những phần việc nặng nề hơn sẽ được trì hoãn để xử lý trong softirq (ngắt mềm), workqueue hoặc kernel thread.

Tiếp nhận gói tin mạng là một ví dụ rất phổ biến. Cơ chế Linux NAPI hoạt động theo đường dẫn cơ bản: Thiết bị dùng hardware interrupt thông báo cho máy chủ, driver trong hàm xử lý ngắt sẽ lên lịch cho NAPI, và các thao tác xử lý gói tin tiếp theo thường chạy trong ngữ cảnh softirq. Sau khi driver lên lịch cho NAPI, nó thường giữ cờ IRQ masked (bị che), cho đến khi quá trình NAPI polling kết thúc, vì trong khoảng thời gian này việc tiếp tục nhận hard interrupt là không cần thiết. Khi khối lượng xử lý quá lớn hoặc softirq bị trì hoãn, các kernel thread chuyên trách như `ksoftirqd` có thể tiếp quản xử lý. Khi quan sát thấy `ksoftirqd` hoặc `%si` liên tục tăng cao trong hệ thống production, bạn cần liên tưởng ngay đến áp lực xử lý gói tin mạng, tải softirq và độ gắn kết ngắt (interrupt affinity). Hard interrupt chỉ chịu trách nhiệm xếp hàng công việc; việc xử lý hàng loạt gói tin thực chất đã được chuyển sang ngữ cảnh softirq hoặc kernel thread.

## Lỗi trang (Page Fault): Đường dẫn bình thường và Đường dẫn lỗi

Cái tên "Page Fault" rất dễ khiến người ta lầm tưởng rằng chương trình đã gặp lỗi nghiêm trọng. Trên thực tế, nó chỉ biểu thị rằng khi CPU thực hiện dịch địa chỉ hoặc kiểm tra quyền hạn, mục bảng trang (PTE) hiện tại không thể hoàn thành trực tiếp thao tác truy cập đó.

Các tình huống phổ biến bao gồm:

1. Trang chưa được cấp phát bộ nhớ vật lý, ví dụ trang vùng nhớ Heap được cấp phát lười (lazy allocation) được truy cập lần đầu tiên;
2. Trang nằm trong file hoặc Swap, hiện chưa cư trú trong RAM;
3. Trang COW (Copy-On-Write) bị ghi dữ liệu, bảng trang tạm thời đánh dấu là chỉ đọc (read-only), đòi hỏi kernel phải nhân bản một bản sao;
4. Quyền truy cập không hợp lệ, ví dụ user mode cố tình truy cập trang của kernel, ghi vào trang chỉ đọc, hoặc thực thi trang không thể thực thi;
5. Địa chỉ hoàn toàn không thuộc về bất kỳ vùng bộ nhớ ảo (VMA) hợp lệ nào của process.

![Sơ đồ phân nhánh xử lý Page Fault](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/page-fault-branching-8bcbb8b0.webp)

Khi xử lý Page Fault, trước tiên kernel kiểm tra xem địa chỉ có rơi vào một VMA hợp lệ của process hay không, sau đó kiểm tra loại truy cập và quyền hạn có tương thích không.

Một lỗi trang hợp lệ hoàn toàn có thể khắc phục được. Kernel cấp phát trang vật lý, đọc trang từ file, nạp trang từ Swap vào RAM, hoặc xử lý cơ chế COW, sau đó cập nhật bảng trang rồi quay về. CPU sẽ thực thi lại chính chỉ thị đã kích hoạt ngoại lệ. Dạng lỗi trang này có thể là minor fault hoặc major fault, điểm khác biệt nằm ở chỗ có cần phát sinh I/O vật lý hay không.

Nếu địa chỉ không thuộc về bất kỳ VMA hợp lệ nào, hoặc cách thức truy cập vi phạm quyền cấp độ trang, kernel thường sẽ gửi tín hiệu `SIGSEGV` tới thread hiện tại. Truy cập vùng nhớ gần `NULL` hay ghi vào vùng ánh xạ chỉ đọc đều thuộc tình huống này. Trong ngôn ngữ C/C++, việc truy cập tràn mảng ngoài giới hạn không đảm bảo chắc chắn kích hoạt Page Fault: nếu địa chỉ mục tiêu vẫn rơi vào một trang đã được ánh xạ và có đủ quyền hạn cho phép, chương trình có thể chỉ âm thầm làm sai lệch dữ liệu lân cận. Chỉ khi địa chỉ vượt biên rơi vào vùng chưa được ánh xạ hoặc vi phạm quyền của trang, phần cứng mới thông qua Page Fault để chuyển giao vấn đề cho kernel xử lý.

Cơ chế COW fork và lazy allocation trong hệ điều hành giảng dạy xv6 là minh họa tuyệt vời cho điều này. Tiến trình cha và tiến trình con ban đầu chia sẻ các trang chỉ đọc; bên nào thực hiện thao tác ghi sẽ kích hoạt lỗi trang, kernel sao chép trang đó ra rồi cho phép thao tác ghi tiếp tục; khi tiến trình mở rộng không gian địa chỉ, kernel có thể chỉ ghi nhận phạm vi trước, đợi đến lần truy cập đầu tiên mới thực sự cấp phát trang vật lý. Cả hai trường hợp đều tận dụng Page Fault để trì hoãn khối lượng công việc một cách thông minh.

Hàm `userfaultfd(2)` là một ví dụ nâng cao: sau khi user space đăng ký một đoạn bộ nhớ nhất định, các lỗi trang như missing, minor hay write-protect có thể chuyển thành các sự kiện trên file descriptor; thread kích hoạt fault sẽ tạm thời bị block, trong khi một thread khác ở user space tiến hành bù trang, giải quyết vấn đề hoặc dỡ bỏ bảo vệ ghi rồi mới cho thread kia chạy tiếp. Cơ chế này thường dùng trong di trú máy ảo (live migration), nạp lười và theo dõi trang bẩn, nhưng các dịch vụ backend thông thường hiếm khi phải dùng trực tiếp.

## Chi phí của System Call

System call nặng nề hơn rất nhiều so với lời gọi hàm thông thường. Một hàm thông thường chạy hoàn toàn trong user mode, truyền tham số, lưu ngữ cảnh cần thiết và rẽ nhánh/quay về theo quy ước ABI; trong khi system call buộc phải chuyển sang kernel mode, đi qua mã tiếp nhận assembly để lưu ngữ cảnh, kiểm tra quyền hạn, và có thể phải truy cập bảng trang, file object, device driver hay hàng đợi chờ. Trước khi quay lại user mode, kernel còn có thể kiểm tra các signal đang chờ xử lý, cờ chiếm quyền và nhu cầu tái điều phối.

Tuy nhiên, chi phí của system call không thể đánh đồng một cách cào bằng. Các lệnh như `getpid()` tiêu tốn thời gian chủ yếu vào việc ra vào kernel; còn `read()` khi gặp I/O đĩa thì chi phí lớn nhất lại nằm ở việc chờ đợi thiết bị phần cứng và sao chép dữ liệu. Các loại khóa xây dựng trên cơ chế futex khi không có cạnh tranh thường chỉ thực thi các thao tác nguyên tử (atomic operation) ở user mode mà không gọi `futex(2)`; chỉ khi xảy ra cạnh tranh, cần đưa thread vào trạng thái ngủ hoặc đánh thức thread dậy, nó mới gọi `futex(2)` để đi vào kernel.

Trong thực tế kỹ thuật, đừng bao giờ hy sinh tính đúng đắn chỉ để bớt đi một lời gọi hệ thống. Các tối ưu hóa phổ biến và thiết thực hơn luôn tập trung vào việc xử lý theo lô (batching) và giảm thiểu chờ đợi vô ích: buffered I/O, đọc ghi khối lượng dữ liệu lớn hơn trong một lần, I/O multiplexing, `sendfile()`, `mmap()`, `io_uring`—mỗi phương pháp giúp giảm chi phí chuyển đổi chế độ, sao chép dữ liệu hoặc chờ đợi trong các tình huống chuyên biệt.

## Trọng tâm trả lời phỏng vấn

Khi trả lời câu hỏi "Mối quan hệ giữa ngắt, ngoại lệ và system call là gì?", hãy triển khai theo nguồn gốc đi vào kernel:

> Bình thường CPU thực thi tuần tự theo luồng chỉ thị. Sự kiện từ thiết bị ngoại vi, lỗi trong chỉ thị hiện tại, hoặc chương trình người dùng chủ động yêu cầu kernel đều sẽ khiến luồng điều khiển đi vào kernel. Ngắt phần cứng (hardware interrupt) đến từ thiết bị bên ngoài và mang tính bất đồng bộ; ngoại lệ đồng bộ (synchronous exception) do chính chỉ thị hiện tại kích hoạt; còn system call là dạng bẫy (trap) do chương trình chủ động gọi qua các lệnh như `syscall`, `ecall`, cũng thuộc nhóm sự kiện đồng bộ. Sau khi xử lý xong, kernel có thể quay lại chương trình cũ để chạy tiếp, điều phối sang thread khác, hoặc gửi signal cho tiến trình.

Khi trả lời về "Quy trình thực thi của system call", hãy bám vào ví dụ hàm `read()`:

> Hàm wrapper của glibc nạp số hiệu system call và các tham số vào các thanh ghi đã quy ước, rồi thực thi lệnh `syscall`. CPU nhảy vào điểm tiếp nhận của kernel theo quy ước kiến trúc, mã tiếp nhận của Linux lưu lại trạng thái thanh ghi cần dùng, phân phối đến hàm xử lý tương ứng dựa vào số hiệu syscall, kiểm tra tham số và quyền hạn, rồi thực thi logic của VFS, network hoặc quản lý bộ nhớ. Khi trả về, kết quả được nạp vào thanh ghi; nếu có lỗi, glibc chuyển mã lỗi âm thành `-1` và gán vào `errno`. Nếu lời gọi phải chờ đợi I/O, thread sẽ bị block và ngắt phần cứng của thiết bị sau đó sẽ đánh thức nó dậy.

Khi trả lời về "Sự khác biệt giữa lỗi trang (Page Fault) và truy cập bộ nhớ trái phép", hãy nhấn mạnh vào cách phân luồng của kernel:

> Page Fault đơn thuần chỉ là CPU nhận thấy không thể hoàn thành việc dịch địa chỉ hoặc kiểm tra quyền bằng mục bảng trang hiện tại. Kernel sẽ thẩm tra xem địa chỉ và quyền hạn truy cập có hợp lệ hay không. Lỗi trang hợp lệ có thể sửa chữa được—như cấp phát trang ẩn danh (anonymous page), nạp trang từ file hoặc Swap, xử lý sao chép khi ghi (COW)—sau đó CPU thực thi lại chính chỉ thị đã kích hoạt lỗi; truy cập trái phép không thể sửa chữa, kernel thường gửi tín hiệu `SIGSEGV` khiến tiến trình bị chấm dứt theo mặc định.

Chuyển đổi User mode / Kernel mode và Thread Context Switch là hai việc hoàn toàn khác nhau. Một system call thực sự chắc chắn sẽ đi vào kernel, nhưng CPU chỉ chuyển đổi sang thread khác khi scheduler quyết định lựa chọn một thực thể thực thi mới—chẳng hạn khi thread hiện tại bị block, chủ động nhường CPU hoặc bị chiếm quyền điều khiển.
