---
title: "Hệ thống kiến thức nền tảng Khoa học máy tính: Mạng máy tính, Hệ điều hành, Cấu trúc dữ liệu và Giải thuật"
description: "Lộ trình học tập và phỏng vấn kiến thức nền tảng Khoa học máy tính, bao gồm Mạng máy tính, Hệ điều hành, Cấu trúc dữ liệu, Giải thuật, Linux, TCP/IP, HTTP, DNS, phù hợp cho ôn tập phỏng vấn mới tốt nghiệp và đã có kinh nghiệm."
icon: "mdi:desktop-classic"
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: "Kiến thức nền tảng Khoa học máy tính,Tổng hợp kiến thức CS,Câu hỏi phỏng vấn CS,Mạng máy tính,Câu hỏi phỏng vấn Mạng máy tính,Hệ điều hành,Câu hỏi phỏng vấn Hệ điều hành,Cấu trúc dữ liệu,Câu hỏi phỏng vấn Cấu trúc dữ liệu,Giải thuật,Câu hỏi phỏng vấn Giải thuật,Linux,TCP/IP,HTTP,DNS,Phỏng vấn Backend,Phỏng vấn Java,Câu hỏi lý thuyết phỏng vấn"
  - - meta
    - property: og:title
      content: "Hệ thống kiến thức nền tảng Khoa học máy tính: Mạng máy tính, Hệ điều hành, Cấu trúc dữ liệu và Giải thuật"
  - - meta
    - property: og:description
      content: "Hệ thống hóa các kiến thức nền tảng Khoa học máy tính như Mạng máy tính, Hệ điều hành, Cấu trúc dữ liệu và Giải thuật, phù hợp cho lập trình viên Backend ôn tập phỏng vấn mới tốt nghiệp và đã có kinh nghiệm."
lang: vi
sourceRef: zh-ref/cs-basics/README.md
---


**Hệ thống kiến thức nền tảng Khoa học máy tính** này hướng tới việc học Backend và ôn tập phỏng vấn, sắp xếp các bài viết liên quan đến kiến thức nền tảng trên trang theo trình tự: "Mạng máy tính -> Hệ điều hành -> Cấu trúc dữ liệu -> Giải thuật".

Nếu thời gian có hạn, bạn nên xem trước [Tổng hợp câu hỏi phỏng vấn thường gặp về Mạng máy tính](./network/other-network-questions.md) và [Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành](./operating-system/operating-system-basic-questions-01.md) để nhanh chóng lập danh sách các câu hỏi tần suất cao; nếu bạn muốn bổ sung kiến thức nền tảng một cách bài bản, có thể đi theo thứ tự các chuyên đề bên dưới.

Toàn trang được trang bị **hơn 300 hình minh họa kỹ thuật**, dùng cách trực quan hóa bằng sơ đồ để giải thích rõ các khái niệm trừu tượng, chứ không phải chỉ chất đống chữ khô khan.

![Tổng quan nội dung tóm tắt kiến thức nền tảng Khoa học máy tính](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/cs-basics-overview-34f37343.png)

## Phù hợp với ai

- Lập trình viên Backend đang củng cố bài bản các kiến thức nền tảng Khoa học máy tính.
- Các bạn đang chuẩn bị phỏng vấn Backend cho vị trí mới tốt nghiệp, đã có kinh nghiệm hoặc tại các công ty công nghệ vừa và lớn.
- Độc giả muốn xâu chuỗi Mạng máy tính, Hệ điều hành, Cấu trúc dữ liệu và Giải thuật thành một hệ thống kiến thức hoàn chỉnh.
- Kỹ sư đã từng viết code nghiệp vụ, nhưng nền tảng về TCP/IP, HTTP, Process/Thread, quản lý bộ nhớ, cây/đồ thị, sắp xếp... vẫn chưa đủ vững.

## Trọng tâm học tập

- Mạng máy tính tập trung hiểu mô hình phân tầng, TCP/UDP, HTTP/HTTPS, DNS, ARP, NAT và các vấn đề bảo mật mạng phổ biến.
- Hệ điều hành tập trung hiểu Process (tiến trình) và Thread (luồng), khóa và đồng bộ hóa, quản lý bộ nhớ, bộ nhớ ảo, Zero-Copy, I/O Multiplexing, hệ thống tệp tin, Linux cơ bản và sử dụng Shell.
- Cấu trúc dữ liệu tập trung hiểu đặc điểm và kịch bản áp dụng của mảng, danh sách liên kết, Stack, Queue, bảng băm (Hash Table), cây, đồ thị, Heap, Trie, Union-Find, Skip List, cây đỏ-đen (Red-Black Tree), Bloom Filter và LRU.
- Giải thuật tập trung hiểu phân tích độ phức tạp, tìm kiếm nhị phân (Binary Search), hai con trỏ (Two Pointers), cửa sổ trượt (Sliding Window), DFS/BFS, quay lui (Backtracking), quy hoạch động (Dynamic Programming), tham lam (Greedy), Top K, sắp xếp, chuỗi, danh sách liên kết và các bài LeetCode tần suất cao.
- Trong buổi phỏng vấn, cần có khả năng xâu chuỗi theo mạch "Khái niệm -> Nguyên lý -> So sánh -> Kịch bản áp dụng -> Vấn đề thường gặp" thành câu trả lời trọn vẹn.

## Thứ tự đọc khuyến nghị

1. [Chuyên đề Mạng máy tính](./network/): Bắt đầu từ mô hình phân tầng, HTTP, TCP, DNS và các câu hỏi phỏng vấn mạng thường gặp để xây dựng nhận thức tổng thể về giao tiếp mạng.
2. [Chuyên đề Hệ điều hành](./operating-system/): Hiểu rõ Process/Thread, bộ nhớ, hệ thống tệp tin, Linux và Shell để tạo nền móng cho lập trình đồng thời (Concurrency), JVM và cơ sở dữ liệu.
3. [Chuyên đề Cấu trúc dữ liệu](./data-structure/): Nắm vững các cấu trúc phổ biến như cấu trúc tuyến tính, bảng băm, cây, đồ thị, Heap, Trie, Union-Find, Skip List, cây đỏ-đen, Bloom Filter, LRU.
4. [Chuyên đề Giải thuật](./algorithms/): Kết hợp phân tích độ phức tạp, các template giải thuật cốt lõi và bài tập LeetCode tần suất cao để luyện tập.
5. Quay lại phần câu hỏi phỏng vấn để rà soát lỗ hổng: Tập trung ôn lại các câu hỏi tần suất cao về mạng và hệ điều hành, sau đó luyện bài tập cấu trúc dữ liệu và giải thuật theo từng dạng.

Nếu công ty mục tiêu của bạn chú trọng nhiều vào giải thuật, bạn nên gộp bước 3 và bước 4 để ôn cùng lúc: xem xong một cấu trúc dữ liệu rồi làm ngay dạng bài tương ứng. Ví dụ: xem xong [Bảng băm](./data-structure/hash-table.md) thì luyện Two Sum, Prefix Sum; xem xong [Heap](./data-structure/heap.md) thì luyện [Top K](./algorithms/top-k.md); xem xong [Cây](./data-structure/tree.md) và [Đồ thị](./data-structure/graph.md) thì tập trung luyện [DFS và BFS](./algorithms/dfs-bfs.md), [Quay lui](./algorithms/backtracking.md) và [Quy hoạch động](./algorithms/dynamic-programming.md).

## Các bài viết cốt lõi

### Mạng máy tính

- [Chuyên đề Mạng máy tính](./network/): Hệ thống hóa kiến thức cốt lõi và các câu hỏi phỏng vấn tần suất cao về mạng máy tính theo từng tầng giao thức.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Mạng máy tính (Phần 1)](./network/other-network-questions.md): Bao phủ các vấn đề nền tảng như mô hình OSI/TCP-IP, HTTP, HTTPS, DNS.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Mạng máy tính (Phần 2)](./network/other-network-questions2.md): Bổ sung tiếp các câu hỏi phổ biến về TCP, UDP, bảo mật mạng, Socket.
- [Giải thích chi tiết mô hình 7 tầng OSI và mô hình 4 tầng TCP/IP](./network/osi-and-tcp-ip-model.md): Xây dựng nhận thức về phân tầng mạng và trách nhiệm của từng giao thức.
- [Điều gì thực sự xảy ra từ lúc nhập URL đến khi trang web hiển thị?](./network/the-whole-process-of-accessing-web-pages.md): Dùng một request hoàn chỉnh để xâu chuỗi các kiến thức như DNS, TCP, HTTP, render của trình duyệt.
- [HTTP vs HTTPS](./network/http-vs-https.md), [HTTP 1.0 vs HTTP 1.1](./network/http1.0-vs-http1.1.md), [Tổng hợp mã trạng thái HTTP thường gặp](./network/http-status-codes.md): Tập trung nắm các điểm trọng tâm hay hỏi về HTTP.
- [Bắt tay 3 bước và ngắt kết nối 4 bước của TCP](./network/tcp-connection-and-disconnection.md), [Đảm bảo truyền tải tin cậy của TCP](./network/tcp-reliability-guarantee.md): Nắm vững cơ chế quản lý kết nối và truyền tải tin cậy cốt lõi nhất của TCP.

### Hệ điều hành

- [Chuyên đề Hệ điều hành](./operating-system/): Trình bày từ nền tảng hệ điều hành đến các câu hỏi thường gặp về Linux.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 1)](./operating-system/operating-system-basic-questions-01.md): Bao phủ nền tảng hệ điều hành, Process/Thread, Deadlock, quản lý bộ nhớ...
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 2)](./operating-system/operating-system-basic-questions-02.md): Tiếp tục tổng hợp các điểm trọng tâm phỏng vấn về hệ thống tệp tin, I/O, Linux...
- [Giải thích chi tiết Process và Thread: Khác biệt, trạng thái, giao tiếp, Context Switch và Virtual Thread](./operating-system/process-and-thread.md): Làm rõ ranh giới tài nguyên, chuyển đổi trạng thái, Context Switch và Java Virtual Thread của Process và Thread.
- [Giải thích chi tiết Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder](./operating-system/ipc.md): So sánh các cơ chế IPC như Pipe, Message Queue, Shared Memory, Socket, Binder.
- [Giải thích chi tiết Khóa và cơ chế đồng bộ trong Hệ điều hành: mutex, semaphore, condition variable, spinlock và futex](./operating-system/os-lock-and-sync.md): Giải thích rõ vùng găng (Critical Section), Mutex, Semaphore, Condition Variable, Spinlock và Futex.
- [Giải thích chi tiết Quản lý bộ nhớ Hệ điều hành: Paging, Segmentation, thay thế trang, Swap và OOM](./operating-system/memory-management.md): Giải thích phân bổ bộ nhớ, phân mảnh bộ nhớ, bảng trang (Page Table), TLB, thay thế trang, Swap và OOM.
- [Giải thích chi tiết Bộ nhớ ảo: Ánh xạ địa chỉ, TLB, Page Fault và thay thế trang](./operating-system/virtual-memory.md): Giải thích Paging, Page Table, TLB, Page Fault và thay thế trang.
- [Giải thích chi tiết Hệ thống tệp tin Hệ điều hành: inode, VFS, Page Cache và cơ chế Journaling](./operating-system/file-system.md): Giải thích rõ inode, dentry, file descriptor, VFS, Page Cache và cơ chế ghi nhật ký (Journaling).
- [Giải thích chi tiết I/O Multiplexing: Nguyên lý và khác biệt giữa select, poll, epoll](./operating-system/io-multiplexing.md): Giải thích nguyên lý triển khai, chênh lệch hiệu năng và kịch bản áp dụng của select, poll, epoll.
- [Giải thích chi tiết Zero-Copy: mmap, sendfile và splice](./operating-system/zero-copy.md): Giải thích luồng sao chép dữ liệu và ứng dụng kỹ thuật của I/O truyền thống, mmap, sendfile, splice.
- [Tổng hợp kiến thức nền tảng Linux](./operating-system/linux-intro.md): Nắm vững cấu trúc thư mục Linux, phân quyền tệp, các lệnh thường dùng và nền tảng hệ thống.
- [Tổng hợp kiến thức nền tảng lập trình Shell](./operating-system/shell-intro.md): Bổ sung kỹ năng viết script, biến, điều khiển luồng và các lệnh thường dùng.

### Cấu trúc dữ liệu

- [Chuyên đề Cấu trúc dữ liệu](./data-structure/): Hệ thống hóa các cấu trúc dữ liệu phổ biến kèm hình minh họa theo từng loại cấu trúc.
- [Giải thích chi tiết Cấu trúc dữ liệu tuyến tính](./data-structure/linear-data-structure.md): Hiểu đặc điểm lưu trữ và độ phức tạp thao tác của mảng, danh sách liên kết, Stack và Queue.
- [Tổng hợp câu hỏi phỏng vấn về Bảng băm](./data-structure/hash-table.md): Hiểu hàm băm, xung đột băm (Hash Collision), cơ chế mở rộng dung lượng (`resize`) và mối liên hệ với `HashMap` trong Java.
- [Giải thích chi tiết Cấu trúc cây](./data-structure/tree.md): Nắm vững các cấu trúc cây phổ biến như cây nhị phân, cây tìm kiếm nhị phân, AVL, B-Tree, B+ Tree.
- [Giải thích chi tiết Đồ thị](./data-structure/graph.md): Hiểu các giải thuật cơ bản như biểu diễn đồ thị, DFS, BFS và đường đi ngắn nhất.
- [Giải thích chi tiết Heap](./data-structure/heap.md), [Giải thích chi tiết Cây đỏ-đen](./data-structure/red-black-tree.md), [Giải thích chi tiết Bloom Filter](./data-structure/bloom-filter.md): Bổ sung các cấu trúc kỹ thuật tần suất cao và trọng tâm phỏng vấn.
- [Tổng hợp câu hỏi phỏng vấn cây tiền tố Trie](./data-structure/trie.md), [Tổng hợp câu hỏi phỏng vấn Union-Find](./data-structure/union-find.md), [Tổng hợp câu hỏi phỏng vấn Skip List](./data-structure/skip-list.md), [Tổng hợp câu hỏi phỏng vấn LRU Cache](./data-structure/lru-cache.md): Bổ sung các kịch bản tần suất cao như tập hợp chuỗi, tính liên thông, Redis ZSet và loại bỏ cache.

Khi ôn tập cấu trúc dữ liệu, bạn có thể đối chiếu song song với chuyên đề Java và Cơ sở dữ liệu: mảng/danh sách liên kết/bảng băm tương ứng với [Java Collections](../java/collection/), cây B+ tương ứng với [MySQL Index](../database/mysql/mysql-index.md), Skip List tương ứng với [Redis Skip List](../database/redis/redis-skiplist.md), còn LRU và Bloom Filter tương ứng với các kịch bản Cache.

### Giải thuật

- [Chuyên đề Giải thuật](./algorithms/): Tổng hợp các tư duy giải thuật phổ biến, bài LeetCode tần suất cao và các thuật toán sắp xếp kinh điển.
- [Hướng dẫn phỏng vấn Độ phức tạp thời gian và Độ phức tạp không gian](./algorithms/complexity-analysis.md): Nắm vững Big O, độ phức tạp đệ quy và các lỗi nhận định sai độ phức tạp thường gặp.
- [Tổng hợp câu hỏi phỏng vấn Tìm kiếm nhị phân](./algorithms/binary-search.md), [Tổng hợp câu hỏi phỏng vấn Hai con trỏ và Cửa sổ trượt](./algorithms/two-pointers-and-sliding-window.md): Nắm vững các template viết tay phổ biến nhất trong các bài mảng, chuỗi, danh sách liên kết.
- [Tổng hợp câu hỏi phỏng vấn DFS và BFS](./algorithms/dfs-bfs.md), [Tổng hợp câu hỏi phỏng vấn Thuật toán quay lui](./algorithms/backtracking.md): Nắm vững tìm kiếm trên cây, đồ thị, ma trận, tổ hợp/hoán vị và liệt kê đường đi.
- [Tổng hợp câu hỏi phỏng vấn Quy hoạch động](./algorithms/dynamic-programming.md), [Tổng hợp câu hỏi phỏng vấn Thuật toán tham lam](./algorithms/greedy.md), [Tổng hợp câu hỏi phỏng vấn Bài toán Top K](./algorithms/top-k.md): Bổ sung các dạng bài tối ưu giá trị, tham lam khoảng, Heap và luồng dữ liệu.
- [Tổng hợp các tư duy giải thuật kinh điển](./algorithms/classical-algorithm-problems-recommendations.md): Bao phủ các tư duy phổ biến như tìm kiếm nhị phân, hai con trỏ, cửa sổ trượt, quay lui, quy hoạch động.
- [Đề xuất các bài LeetCode kinh điển cho Cấu trúc dữ liệu phổ biến](./algorithms/common-data-structures-leetcode-recommendations.md): Sắp xếp lộ trình luyện bài theo từng loại cấu trúc dữ liệu.
- [Một số bài toán giải thuật về Chuỗi thường gặp](./algorithms/string-algorithm-problems.md), [Một số bài toán giải thuật về Danh sách liên kết thường gặp](./algorithms/linkedlist-algorithm-problems.md): Tập trung luyện các dạng bài tần suất cao.
- [Một số bài lập trình trong Kiếm chỉ Offer](./algorithms/the-sword-refers-to-offer.md), [Tổng hợp 10 thuật toán sắp xếp kinh điển](./algorithms/10-classical-sorting-algorithms.md): Phù hợp để ôn tập tổng hợp trước khi phỏng vấn.

Khi luyện giải thuật, bạn nên viết thật chắc template của từng dạng rồi mới làm danh sách bài tập: [Tổng hợp các tư duy giải thuật kinh điển](./algorithms/classical-algorithm-problems-recommendations.md) phù hợp luyện theo dạng bài, còn [Đề xuất các bài LeetCode kinh điển cho Cấu trúc dữ liệu phổ biến](./algorithms/common-data-structures-leetcode-recommendations.md) phù hợp luyện theo cấu trúc.

## Câu hỏi tần suất cao

- Mô hình 7 tầng OSI và mô hình 4 tầng TCP/IP lần lượt là gì? Mỗi tầng giải quyết vấn đề gì?
- Từ lúc nhập URL đến khi trang web hiển thị, ở giữa đã trải qua những bước nào?
- HTTP và HTTPS có gì khác nhau? Tại sao HTTPS lại an toàn hơn?
- Bắt tay 3 bước và ngắt kết nối 4 bước của TCP lần lượt giải quyết vấn đề gì? Tại sao lại tồn tại trạng thái `TIME_WAIT`?
- TCP đảm bảo truyền tải tin cậy như thế nào? Khi nào chọn TCP, khi nào chọn UDP?
- Process và Thread có gì khác nhau? Deadlock là gì, làm sao để tránh?
- Quản lý bộ nhớ hệ điều hành, bộ nhớ ảo, Paging (phân trang) và Segmentation (phân đoạn) lần lượt là gì?
- Mảng, danh sách liên kết, Stack, Queue, cây, đồ thị, Heap lần lượt phù hợp với những kịch bản nào?
- Bảng băm, cây đỏ-đen, cây B+, Skip List, Bloom Filter, LRU thường được dùng ở đâu trong thực tế kỹ thuật?
- Khi luyện bài tập giải thuật, làm sao để xây dựng template giải bài theo từng dạng?

## Chuyên đề liên quan

- [Hệ thống kiến thức Java](../java/)
- [Hệ thống kiến thức Cơ sở dữ liệu](../database/)
- [Hệ thống kiến thức Hệ thống phân tán](../distributed-system/)
- [Hệ thống kiến thức Hệ thống hiệu năng cao](../high-performance/)
- [Thiết kế hệ thống (System Design)](../system-design/)
