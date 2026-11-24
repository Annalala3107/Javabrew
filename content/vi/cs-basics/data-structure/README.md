---
title: "Hệ thống kiến thức Cấu trúc dữ liệu: Mảng, Danh sách liên kết, Bảng băm, Cây, Đồ thị, Heap và Phỏng vấn"
description: "Lộ trình ôn tập cấu trúc dữ liệu cho phỏng vấn, bao gồm mảng, danh sách liên kết, ngăn xếp, hàng đợi, bảng băm, cây, đồ thị, heap, Trie, Union-Find, bảng nhảy (Skip List), cây đỏ-đen, Bloom filter, LRU, phân tích độ phức tạp và các kịch bản kỹ thuật Java backend."
category: Khoa học máy tính cơ bản
tag:
  - Cấu trúc dữ liệu
  - Thuật toán
  - Phỏng vấn
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Cấu trúc dữ liệu,Câu hỏi phỏng vấn cấu trúc dữ liệu,Lộ trình ôn tập cấu trúc dữ liệu,Mảng,Danh sách liên kết,Stack,Queue,Bảng băm,HashMap,Cây,Đồ thị,Heap,Trie,Union-Find,Skip List,Cây đỏ-đen,Bloom Filter,LRU,Java Collections,Redis,MySQL Index,Phỏng vấn backend
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/README.md
---

Tài liệu **Hệ thống kiến thức Cấu trúc dữ liệu** này được tổ chức xoay quanh các kịch bản phỏng vấn và kỹ thuật Java backend: trước hết tìm hiểu cách dữ liệu được lưu trữ, tiếp theo xem xét độ phức tạp của các thao tác phổ biến, và cuối cùng liên kết các cấu trúc này với các bài toán kỹ thuật thực tế như Java Collections, MySQL Index, Redis, bộ nhớ đệm (cache) và hàng đợi thông điệp (message queue).

Khi phỏng vấn về cấu trúc dữ liệu, người phỏng vấn hiếm khi chỉ dừng lại ở câu hỏi "mảng là gì". Thông thường, họ sẽ hỏi sâu hơn: Tại sao mảng truy vấn nhanh còn danh sách liên kết lại chèn/xóa thuận tiện? Tại sao `HashMap` cần mở rộng dung lượng (resize)? Tại sao cây B+ lại phù hợp làm chỉ mục (index)? Tại sao Bloom filter lại xảy ra phán đoán sai (false positive)? Đằng sau tất cả những câu hỏi này đều cùng đánh giá một điều: bạn có thực sự hiểu rõ sự đánh đổi về độ phức tạp và kịch bản thực tế khi lựa chọn một cấu trúc dữ liệu hay không.

Khi chuẩn bị cho phần cấu trúc dữ liệu, bạn không nên chỉ học vẹt định nghĩa. Cách hiệu quả hơn là tách mỗi cấu trúc thành 4 câu hỏi: Lưu trữ như thế nào? Truy vấn như thế nào? Chỉnh sửa như thế nào? Phù hợp với kịch bản nào? Khi đã giải thích rõ ràng 4 câu hỏi này, việc luyện các bài tập thuật toán tương ứng sẽ đạt hiệu suất cao hơn rất nhiều.

## Đối tượng phù hợp

- Các bạn đang củng cố nền tảng cấu trúc dữ liệu để chuẩn bị cho phỏng vấn backend (dành cho sinh viên mới tốt nghiệp hoặc lập trình viên đã đi làm).
- Những người luyện thuật toán nhưng thường xuyên bị tắc ở các cấu trúc như mảng, danh sách liên kết, cây, đồ thị, heap.
- Các kỹ sư muốn kết nối kiến thức cấu trúc dữ liệu với Java Collections, Redis, MySQL và hệ thống cache.
- Những lập trình viên đã nắm khái niệm nhưng khi trả lời phỏng vấn lại dễ dừng lại ở tầng định nghĩa lý thuyết.

## Phỏng vấn cấu trúc dữ liệu hỏi những gì?

| Trọng tâm đánh giá | Câu hỏi thường gặp | Trọng tâm ôn tập |
| ------------------ | ------------------ | ---------------- |
| Phương thức lưu trữ | Lưu trữ tuần tự và lưu trữ liên kết khác nhau như thế nào? | Tính liên tục của bộ nhớ, con trỏ, tính thân thiện với CPU cache |
| Độ phức tạp thao tác | Tại sao truy vấn mảng là O(1), còn truy vấn danh sách liên kết là O(n)? | Độ phức tạp truy vấn, chèn, xóa, duyệt |
| So sánh cấu trúc | Chọn cây đỏ-đen hay cây AVL như thế nào? Cây B và cây B+ khác nhau ra sao? | Bảng so sánh + kịch bản áp dụng |
| Ứng dụng kỹ thuật | HashMap, TreeMap, PriorityQueue, Redis ZSet sử dụng cấu trúc gì? | Ứng dụng thực tế trong Java/cơ sở dữ liệu/cache |
| Kế thừa thuật toán | Viết duyệt cây, tìm kiếm đồ thị, Top K, LRU như thế nào? | Ôn tập cùng với các template thuật toán |

## Khung trả lời phỏng vấn

Khi trả lời các câu hỏi cấu trúc dữ liệu, đừng chỉ dừng lại ở việc giải thích "nó là gì". Trong buổi phỏng vấn, một cách trình bày chắc chắn và thuyết phục hơn là triển khai theo mạch tư duy dưới đây:

```text
Định nghĩa -> Phương thức lưu trữ -> Độ phức tạp các thao tác phổ biến -> Ưu nhược điểm -> Kịch bản áp dụng -> Ứng dụng trong Java/Redis/MySQL
```

Lấy bảng băm (Hash Table) làm ví dụ, một câu trả lời hoàn chỉnh có thể được tổ chức như sau:

1. Bảng băm ánh xạ key thành chỉ số mảng thông qua một hàm băm (hash function).
2. Thao tác truy vấn, chèn, xóa trung bình đạt `O(1)`, nhưng khi xung đột nghiêm trọng sẽ bị thoái hóa.
3. Xung đột có thể được xử lý bằng phương pháp nối chuỗi (chaining), định địa chỉ mở (open addressing), v.v.
4. `HashMap` trong Java sử dụng mảng + danh sách liên kết + cây đỏ-đen, việc mở rộng dung lượng (resize) dùng để kiểm soát hệ số tải (load factor).
5. Nó phù hợp với các kịch bản tìm kiếm nhanh, đếm tần suất, loại bỏ trùng lặp, chỉ mục cache, nhưng sẽ tiêu tốn thêm không gian bộ nhớ.

Cách trả lời này sẽ vững vàng hơn nhiều trước các câu hỏi đào sâu so với việc chỉ nói "truy vấn bảng băm là O(1)", bởi vì nó đồng thời trình bày được nguyên lý, giới hạn độ phức tạp và điểm áp dụng trong kỹ thuật thực tế.

## Thứ tự đọc khuyến nghị

1. [Chi tiết về cấu trúc dữ liệu tuyến tính](./linear-data-structure.md): Nắm vững mảng, danh sách liên kết, ngăn xếp (stack), hàng đợi (queue), hiểu rõ lưu trữ tuần tự và lưu trữ liên kết.
2. [Tổng hợp câu hỏi phỏng vấn Bảng băm](./hash-table.md): Hiểu về hàm băm, xung đột băm, mở rộng dung lượng và liên kết với `HashMap`.
3. [Chi tiết về Cấu trúc cây](./tree.md): Nắm vững cây nhị phân, cây tìm kiếm nhị phân (BST), AVL, cây B, cây B+ và mối liên hệ với chỉ mục MySQL.
4. [Chi tiết về Heap](./heap.md): Hiểu về hàng đợi ưu tiên (Priority Queue), Top K, sắp xếp vun đống (Heap Sort) và `PriorityQueue`.
5. [Chi tiết về Đồ thị](./graph.md): Hiểu về cách lưu trữ đồ thị, DFS, BFS, sắp xếp tô-pô (Topological Sort) và nền tảng đường đi ngắn nhất.
6. [Tổng hợp câu hỏi phỏng vấn Cây tiền tố Trie](./trie.md), [Tổng hợp câu hỏi phỏng vấn Union-Find](./union-find.md): Bổ sung kiến thức về tập hợp chuỗi và bài toán tính liên thông.
7. [Tổng hợp câu hỏi phỏng vấn Bảng nhảy (Skip List)](./skip-list.md), [Chi tiết về Cây đỏ-đen](./red-black-tree.md), [Chi tiết về Bloom Filter](./bloom-filter.md), [Tổng hợp câu hỏi phỏng vấn Bộ nhớ đệm LRU](./lru-cache.md): Tổng kết chuyên sâu cho các kịch bản Java Collections, Redis, cache và cơ sở dữ liệu.

## Các bài viết cốt lõi

| Bài viết | Trọng tâm | Liên kết thường gặp |
| -------- | --------- | ------------------- |
| [Chi tiết về cấu trúc dữ liệu tuyến tính](./linear-data-structure.md) | Mảng, danh sách liên kết, stack, queue | `ArrayList`, `LinkedList`, hàng đợi thông điệp |
| [Tổng hợp câu hỏi phỏng vấn Bảng băm](./hash-table.md) | Hàm băm, xung đột, mở rộng dung lượng | `HashMap`, cache, khử trùng lặp |
| [Chi tiết về Cấu trúc cây](./tree.md) | Cây nhị phân, BST, AVL, cây B, cây B+ | Chỉ mục MySQL, cây biểu thức |
| [Chi tiết về Đồ thị](./graph.md) | Danh sách kề, ma trận kề, DFS, BFS | Mối quan hệ phụ thuộc, định tuyến, quan hệ gợi ý |
| [Chi tiết về Heap](./heap.md) | Max Heap, Min Heap, Heap Sort | `PriorityQueue`, Top K, hàng đợi trễ |
| [Chi tiết về Cây đỏ-đen](./red-black-tree.md) | Cân bằng xấp xỉ, phép quay, đổi màu | `TreeMap`, biến đổi thành cây (`treeify`) trong `HashMap` |
| [Chi tiết về Bloom Filter](./bloom-filter.md) | Mảng bit, băm, phán đoán sai | Tránh thủng cache (cache penetration), khử trùng, danh sách đen |
| [Tổng hợp câu hỏi phỏng vấn Bảng nhảy (Skip List)](./skip-list.md) | Chỉ mục đa cấp, truy vấn theo dải | Redis ZSet |
| [Tổng hợp câu hỏi phỏng vấn Bộ nhớ đệm LRU](./lru-cache.md) | Bảng băm + danh sách liên kết đôi | Local cache, thay thế trang bộ nhớ |

## Tra cứu nhanh lựa chọn cấu trúc dữ liệu

Nhiều câu hỏi về cấu trúc dữ liệu thực chất là đang hỏi: "Tại sao kịch bản này lại chọn nó mà không phải cấu trúc khác?". Bảng dưới đây rất thích hợp để ôn tập nhanh trước buổi phỏng vấn:

| Kịch bản | Lựa chọn ưu tiên | Điểm đánh đổi |
| -------- | ---------------- | ------------- |
| Truy cập ngẫu nhiên thường xuyên theo chỉ số | Mảng, `ArrayList` | Truy vấn nhanh; chi phí chèn/xóa phần tử ở giữa cao |
| Thường xuyên chèn/xóa ở cả hai đầu | Hàng đợi hai đầu (Deque), danh sách liên kết | Thao tác con trỏ linh hoạt; truy cập ngẫu nhiên chậm |
| Phán đoán nhanh sự tồn tại của phần tử | Bảng băm, Bloom filter | Bảng băm chính xác nhưng tốn bộ nhớ; Bloom filter tiết kiệm bộ nhớ nhưng có thể phán đoán sai |
| Duy trì tập hợp có thứ tự và truy vấn theo dải | Cây đỏ-đen, Skip List, cây B+ | Cây đỏ-đen phù hợp tập hợp có thứ tự trong bộ nhớ; Skip List phù hợp truy vấn dải và dễ cài đặt |
| Xử lý giá trị lớn nhất, nhỏ nhất, Top K | Heap, Hàng đợi ưu tiên | Chỉ quan tâm đến giá trị cực trị cục bộ; không phù hợp để duyệt toàn bộ theo thứ tự |
| Phán đoán tính liên thông và phân nhóm | Union-Find | Hợp nhất và truy vấn rất nhanh; không phù hợp với việc xóa quan hệ thường xuyên |
| Khớp tiền tố, gợi ý tìm kiếm | Trie | Truy vấn phụ thuộc vào độ dài chuỗi; số lượng node có thể lớn |
| Chiến lược loại bỏ bộ nhớ đệm (Cache Eviction) | LRU, LFU | LRU dựa vào thời gian truy cập gần nhất; LFU dựa vào tần suất truy cập |

Khi ôn tập, bạn hãy tự hỏi ngược lại: Nếu không dùng cấu trúc này thì sẽ chậm ở đâu? Sẽ tốn thêm bao nhiêu bộ nhớ? Điều kiện biên là gì? Khi đã thông suốt những câu hỏi này, bạn hoàn toàn có thể tự tin xử lý các câu hỏi đào sâu của người phỏng vấn.

## Lộ trình ôn tập 7 ngày

| Ngày | Trọng tâm | Hành động gợi ý |
| ---- | --------- | --------------- |
| Ngày 1 | Mảng, Danh sách liên kết | Lập bảng độ phức tạp; tự viết mã đảo ngược danh sách liên kết và xóa node |
| Ngày 2 | Stack, Queue, Bảng băm | Viết bài toán khớp ngoặc, cài đặt queue bằng stack, Two Sum |
| Ngày 3 | Cây | Viết các phép duyệt cây nhị phân, tổ tiên chung gần nhất (LCA), ôn tập cây B+ |
| Ngày 4 | Heap | Viết Top K, K phần tử xuất hiện nhiều nhất, hiểu rõ `PriorityQueue` |
| Ngày 5 | Đồ thị | Viết DFS/BFS, Số lượng đảo (Number of Islands), Lịch học (Course Schedule) |
| Ngày 6 | Cây đỏ-đen, Skip List, Bloom Filter | Tập trung chuẩn bị các câu hỏi tình huống kỹ thuật đào sâu |
| Ngày 7 | LRU và Tổng kết toàn diện | Tự viết LRU; tổng hợp độ phức tạp và kịch bản áp dụng của tất cả cấu trúc |

## Lộ trình ôn tập 30 ngày

| Giai đoạn | Thời gian | Mục tiêu |
| --------- | --------- | -------- |
| Giai đoạn 1 | Ngày 1 đến 6 | Cấu trúc tuyến tính và bảng băm; giải thích rõ ràng độ phức tạp và liên hệ với Java Collections |
| Giai đoạn 2 | Ngày 7 đến 13 | Cây, heap, đồ thị; kết hợp luyện đề với DFS/BFS và Top K |
| Giai đoạn 3 | Ngày 14 đến 20 | Trie, Union-Find, Skip List, cây đỏ-đen; bổ sung các cấu trúc nâng cao |
| Giai đoạn 4 | Ngày 21 đến 25 | Bloom filter, LRU, bài toán tình huống kỹ thuật; liên kết với Redis/MySQL/cache |
| Giai đoạn 5 | Ngày 26 đến 30 | Xem lại các câu làm sai và luyện tập trả lời phỏng vấn lưu loát; chuẩn bị 2 câu hỏi đào sâu cho mỗi cấu trúc |

## Tự kiểm tra câu hỏi tần suất cao

- Bố cục bộ nhớ của mảng và danh sách liên kết khác nhau như thế nào? Tại sao mảng truy cập ngẫu nhiên lại nhanh?
- Trong Java nên chọn `ArrayList` hay `LinkedList`?
- Stack và Queue lần lượt phù hợp với những kịch bản nào? Monotonic Stack, Monotonic Queue giải quyết bài toán gì?
- Có những cách nào để giải quyết xung đột băm? Tại sao `HashMap` lại cần mở rộng dung lượng (resize)?
- Cây tìm kiếm nhị phân (BST), cây AVL và cây đỏ-đen khác nhau như thế nào?
- Tại sao cây B và cây B+ lại thích hợp làm chỉ mục cơ sở dữ liệu?
- Heap khác gì so với cây nhị phân thông thường? Tại sao Top K thường dùng Heap?
- Danh sách kề và ma trận kề của đồ thị nên chọn thế nào? Độ phức tạp của DFS và BFS là bao nhiêu?
- Tại sao Skip List lại phù hợp cho truy vấn theo dải? Tại sao Redis lại sử dụng Skip List?
- Tại sao Bloom filter lại có thể phán đoán sai (false positive)? Tại sao thao tác xóa lại khó khăn?
- Tại sao LRU thường được cài đặt bằng bảng băm kết hợp với danh sách liên kết đôi?

## Chuyên đề liên quan

- [Hệ thống kiến thức Khoa học máy tính cơ bản](../)
- [Chuyên đề thuật toán](../algorithms/)
- [Gợi ý bài tập LeetCode kinh điển cho cấu trúc dữ liệu phổ biến](../algorithms/common-data-structures-leetcode-recommendations.md)
- [Java Collections](../../java/collection/java-collection-questions-01.md)
- [Chi tiết về MySQL Index](../../database/mysql/mysql-index.md)
- [Tổng hợp câu hỏi phỏng vấn Redis thường gặp](../../database/redis/redis-questions-01.md)
