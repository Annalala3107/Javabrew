---
title: "Chuyên đề Hệ điều hành: Process & Thread, Quản lý bộ nhớ, File System, I/O Multiplexing, Linux & Shell"
description: "Lộ trình học tập và ôn luyện phỏng vấn Hệ điều hành cho backend, bao gồm Process & Thread, IPC, cơ chế khóa và đồng bộ, Deadlock, Bộ nhớ ảo, Zero-Copy, I/O Multiplexing, File System, Linux cơ bản, lập trình Shell và các câu hỏi phỏng vấn thường gặp."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
  - Shell
sidebar: false
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Hệ điều hành,Câu hỏi phỏng vấn hệ điều hành,Process,Thread,Giao tiếp liên tiến trình,IPC,Khóa và đồng bộ,Mutex,Semaphore,Condition Variable,futex,Deadlock,Quản lý bộ nhớ,Bộ nhớ ảo,Zero-Copy,I/O Multiplexing,select,poll,epoll,File System,Linux,Shell,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/README.md
---

Tài liệu **Chuyên đề Hệ điều hành** này hướng tới mục tiêu học tập và ôn luyện phỏng vấn backend, tổng hợp có hệ thống các kiến thức nền tảng về Hệ điều hành, Process & Thread, giao tiếp liên tiến trình (IPC), khóa và đồng bộ, quản lý bộ nhớ, bộ nhớ ảo, Zero-Copy, I/O Multiplexing, File System, Linux và Shell.

## Phù hợp với ai

- Lập trình viên backend đang học tập có hệ thống kiến thức nền tảng hệ điều hành.
- Ứng viên chuẩn bị cho các kỳ phỏng vấn tuyển dụng sinh viên tốt nghiệp (campus recruiting), phỏng vấn chuyển việc, hoặc phỏng vấn hệ điều hành tại các công ty công nghệ vừa và lớn.
- Người đọc chỉ mới học vẹt, nhớ rời rạc các mảnh kiến thức về Process & Thread, Deadlock, quản lý bộ nhớ hay câu lệnh Linux.
- Kỹ sư muốn xây dựng nền tảng vững chắc cho Java Concurrency, JVM, cơ sở dữ liệu và lập trình mạng.

## Trọng tâm học tập

- Hệ điều hành chịu trách nhiệm quản lý CPU, bộ nhớ, file, I/O và tiến trình; đây là nền tảng cốt lõi để hiểu cách thức vận hành của phần mềm tầng trên.
- Process (tiến trình), Thread (luồng) và giao tiếp liên tiến trình (IPC) là các khái niệm nền tảng trong lập trình đồng thời (concurrency), hiệu năng hệ thống phía server và điều tra xử lý sự cố.
- Khóa và đồng bộ, Deadlock, chuyển đổi ngữ cảnh (context switch), lập lịch CPU là các chủ đề có tần suất xuất hiện rất cao trong phỏng vấn.
- Quản lý bộ nhớ, bộ nhớ ảo, phân trang (paging), thay thế trang (page replacement) giúp hiểu sâu sắc về JVM, cơ sở dữ liệu và bộ nhớ đệm (cache).
- Zero-Copy và I/O Multiplexing giúp giải mã nguyên lý hoạt động của các thành phần middleware hiệu năng cao như Kafka, RocketMQ, Redis, Nginx, Netty.
- Linux và Shell là kỹ năng thiết yếu hàng ngày cho việc phát triển backend, triển khai hệ thống, xử lý sự cố và viết script tự động hóa.

## Lộ trình đọc gợi ý

1. [Tổng hợp câu hỏi phỏng vấn hệ điều hành thường gặp (Phần 1)](./operating-system-basic-questions-01.md): Thiết lập danh sách câu hỏi tần suất cao về kiến thức cơ bản hệ điều hành, Process & Thread, Deadlock và quản lý bộ nhớ.
2. [Tổng hợp câu hỏi phỏng vấn hệ điều hành thường gặp (Phần 2)](./operating-system-basic-questions-02.md): Tiếp tục bổ sung các câu hỏi về File System, I/O, Linux.
3. [Phân tích chi tiết về Process và Thread: Phân biệt, Trạng thái, Giao tiếp, Context Switch và Virtual Thread](./process-and-thread.md): Hiểu có hệ thống về Process, Thread, PCB/TCB, fork/exec/wait, mô hình thread và context switch.
4. [Phân tích chi tiết về Ngắt, Ngoại lệ và System Call: Từ cửa ngõ Kernel đến Page Fault](./interrupt-exception-syscall.md): Lấy `read()` làm sợi dây xuyên suốt kết nối ngắt phần cứng, ngoại lệ đồng bộ, system call, tín hiệu (signal), lỗi thiếu trang (page fault) và chuyển đổi thread.
5. [Phân tích chi tiết về Lập lịch CPU và Tải hệ thống (System Load)](./cpu-scheduling-and-load.md): Nắm vững các thuật toán lập lịch, CFS/EEVDF, load average, CPU utilization và tư duy điều tra sự cố thực tế.
6. [Phân tích chi tiết về Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder](./ipc.md): So sánh toàn diện các giải pháp IPC: Pipe, Message Queue, Shared Memory, Semaphore, Socket, Binder.
7. [Phân tích chi tiết về Cơ chế Khóa và Đồng bộ trong Hệ điều hành: Mutex, Semaphore, Condition Variable, Spinlock và Futex](./os-lock-and-sync.md): Phân định rõ ràng ranh giới trách nhiệm giữa miền găng (critical section), Mutex, Semaphore, Condition Variable, Spinlock và Futex.
8. [Phân tích chi tiết về Deadlock: Bốn điều kiện tiên quyết, Điều tra Deadlock trong Java và Xử lý Deadlock trong Cơ sở dữ liệu](./dead-lock.md): Làm sáng tỏ chu trình chờ khóa, 4 điều kiện cần của deadlock, cách điều tra deadlock trong Java Thread và cơ chế retry giao dịch cơ sở dữ liệu.
9. [Phân tích chi tiết về Quản lý bộ nhớ trong Hệ điều hành: Phân trang, Phân đoạn, Thay thế trang, Swap và OOM](./memory-management.md): Hiểu rõ cấp phát bộ nhớ, phân mảnh, bảng trang (page table), thu hồi trang và OOM.
10. [Phân tích chi tiết về Bộ nhớ ảo: Chuyển đổi địa chỉ, TLB, Page Fault và Thay thế trang](./virtual-memory.md): Xâu chuỗi liền mạch phân trang, bảng trang, TLB, page fault và thay thế trang.
11. [Phân tích chi tiết về File System trong Hệ điều hành: Inode, VFS, Page Cache và Cơ chế Ghi nhật ký (Journaling)](./file-system.md): Nắm chắc file, thư mục, inode, VFS, Page Cache và phục hồi sau sự cố nhờ journaling.
12. [Phân tích chi tiết về I/O Multiplexing: Nguyên lý và So sánh select, poll, epoll](./io-multiplexing.md): Thấu hiểu cơ chế tầng kernel cho phép một thread xử lý hàng triệu kết nối đồng thời.
13. [Phân tích chi tiết về Zero-Copy: mmap, sendfile và splice](./zero-copy.md): Nắm rõ luồng sao chép dữ liệu thực tế và các tình huống ứng dụng tối ưu của I/O truyền thống, mmap, sendfile, splice.
14. [Tổng hợp kiến thức Linux cơ bản](./linux-intro.md): Nắm vững cấu trúc thư mục, quyền file, các câu lệnh thông dụng và kỹ năng xử lý sự cố cơ bản.
15. [Tổng hợp kiến thức lập trình Shell cơ bản](./shell-intro.md): Học biến, rẽ nhánh điều kiện, vòng lặp, hàm và cách viết script thực tế thông dụng.

## Các bài viết cốt lõi

- [Tổng hợp câu hỏi phỏng vấn hệ điều hành thường gặp (Phần 1)](./operating-system-basic-questions-01.md): Bao quát các câu hỏi tần suất cao về cơ sở hệ điều hành, Process & Thread, Deadlock, quản lý bộ nhớ.
- [Tổng hợp câu hỏi phỏng vấn hệ điều hành thường gặp (Phần 2)](./operating-system-basic-questions-02.md): Tiếp tục tổng hợp kiến thức về File System, I/O, I/O Multiplexing, Linux.
- [Phân tích chi tiết về Process và Thread: Phân biệt, Trạng thái, Giao tiếp, Context Switch và Virtual Thread](./process-and-thread.md): Làm rõ ranh giới tài nguyên giữa Process và Thread, chuyển đổi trạng thái, cơ chế tạo trong Linux và Java Virtual Thread.
- [Phân tích chi tiết về Ngắt, Ngoại lệ và System Call: Từ cửa ngõ Kernel đến Page Fault](./interrupt-exception-syscall.md): Làm rõ mối quan hệ giữa ngắt phần cứng, ngoại lệ đồng bộ, system call, tín hiệu và page fault.
- [Phân tích chi tiết về Lập lịch CPU và Tải hệ thống (System Load)](./cpu-scheduling-and-load.md): Làm rõ việc lập lịch tác vụ, CFS/EEVDF, load average, CPU utilization và các lệnh điều tra thường dùng.
- [Phân tích chi tiết về Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder](./ipc.md): Làm rõ nguyên lý, ưu nhược điểm và tư duy lựa chọn các phương thức IPC thông dụng.
- [Phân tích chi tiết về Cơ chế Khóa và Đồng bộ trong Hệ điều hành: Mutex, Semaphore, Condition Variable, Spinlock và Futex](./os-lock-and-sync.md): Làm rõ miền găng, Mutex, Semaphore, Condition Variable, Spinlock, Futex, thứ tự bộ nhớ (memory ordering) và ngữ cảnh khóa kernel.
- [Phân tích chi tiết về Deadlock: Bốn điều kiện tiên quyết, Điều tra Deadlock trong Java và Xử lý Deadlock trong Cơ sở dữ liệu](./dead-lock.md): Làm rõ điều kiện hình thành deadlock, đồ thị cấp phát tài nguyên, công cụ điều tra trong Java, phát hiện deadlock cơ sở dữ liệu và chiến lược retry ở tầng ứng dụng.
- [Phân tích chi tiết về Quản lý bộ nhớ trong Hệ điều hành: Phân trang, Phân đoạn, Thay thế trang, Swap và OOM](./memory-management.md): Làm rõ VSZ/RSS/PSS, cấp phát liên tục, phân mảnh bộ nhớ, buddy system, bảng trang, TLB, page fault, thu hồi trang và OOM.
- [Phân tích chi tiết về Bộ nhớ ảo: Chuyển đổi địa chỉ, TLB, Page Fault và Thay thế trang](./virtual-memory.md): Làm rõ địa chỉ ảo, địa chỉ vật lý, phân trang, bảng trang nhiều cấp, TLB, page fault và thuật toán thay thế trang.
- [Phân tích chi tiết về File System trong Hệ điều hành: Inode, VFS, Page Cache và Cơ chế Ghi nhật ký (Journaling)](./file-system.md): Làm rõ file, thư mục, inode, dentry, file descriptor, VFS, Page Cache, fsync và cơ chế journaling.
- [Phân tích chi tiết về I/O Multiplexing: Nguyên lý và So sánh select, poll, epoll](./io-multiplexing.md): Làm rõ hai giai đoạn của I/O mạng, 5 mô hình I/O, cùng sự khác biệt kiến trúc giữa select, poll và epoll.
- [Phân tích chi tiết về Zero-Copy: mmap, sendfile và splice](./zero-copy.md): Làm rõ Zero-Copy thực sự lược bỏ được những chi phí nào và các ứng dụng điển hình trong Java NIO, Kafka, RocketMQ.
- [Tổng hợp kiến thức Linux cơ bản](./linux-intro.md): Trình bày cây thư mục Linux, quyền hạn file, câu lệnh thông dụng, quản lý user và process.
- [Tổng hợp kiến thức lập trình Shell cơ bản](./shell-intro.md): Trình bày biến Shell, câu lệnh điều kiện, vòng lặp, hàm, xử lý văn bản và thực hành viết script.

## Câu hỏi tần suất cao

- Process và Thread có điểm gì khác nhau? Các thread dùng chung những tài nguyên nào?
- Có những phương thức giao tiếp liên tiến trình (IPC) nào? Mỗi phương thức phù hợp với trường hợp nào?
- Context switch (chuyển đổi ngữ cảnh) là gì? Context switch quá thường xuyên gây ảnh hưởng gì?
- Mutex, Semaphore, Condition Variable, Spinlock và Futex giải quyết những bài toán cụ thể nào?
- Các điều kiện tiên quyết để xảy ra Deadlock là gì? Cách điều tra và xử lý Deadlock trong Java và cơ sở dữ liệu?
- Bộ nhớ ảo là gì? Sự khác nhau giữa phân trang (paging) và phân đoạn (segmentation)?
- TLB, Page Fault và thay thế trang giải quyết những vấn đề cụ thể nào?
- Có những thuật toán thay thế trang nào? Cơ chế diễn ra khi gặp lỗi thiếu trang (Page Fault)?
- Tại sao Zero-Copy lại nhanh? Điểm khác biệt giữa mmap, sendfile và splice?
- Trong hệ thống file, Inode, Hard Link và Soft Link (Symbolic Link) là gì?
- Sự khác nhau giữa select, poll và epoll là gì?
- Cách hiểu quyền file trong Linux? Các lệnh điều tra sự cố thường dùng nhất?
- Shell script phù hợp giải quyết những bài toán tự động hóa nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức cơ sở máy tính](../)
- [Chuyên đề Mạng máy tính](../network/)
- [Chuyên đề Cấu trúc dữ liệu](../data-structure/)
- [Lập trình đồng thời trong Java (Java Concurrency)](../../java/concurrent/java-concurrent-questions-01.md)
- [Phân tích chi tiết về Vùng nhớ JVM](../../java/jvm/memory-area.md)
