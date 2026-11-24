---
title: "Chuyên đề Thuật toán: Lộ trình luyện đề phỏng vấn, Template cốt lõi và bài tập LeetCode tần suất cao"
description: "Lộ trình ôn tập thuật toán phỏng vấn, bao quát phân tích độ phức tạp, binary search, two pointers, sliding window, DFS/BFS, backtracking, dynamic programming, greedy, Top K, chuỗi, danh sách liên kết, sắp xếp và bộ đề LeetCode tần suất cao."
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
  - LeetCode
  - Phỏng vấn
sidebar: false
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: thuật toán,câu hỏi phỏng vấn thuật toán,LeetCode,lộ trình luyện đề,tìm kiếm nhị phân,hai con trỏ,cửa sổ trượt,DFS,BFS,quay lui,quy hoạch động,tham lam,TopK,thuật toán sắp xếp,thuật toán chuỗi,thuật toán danh sách liên kết,phỏng vấn backend
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/README.md
---

Bộ **Chuyên đề Thuật toán** này không sắp xếp kiến thức theo kiểu liệt kê lý thuyết giáo trình, mà được tổ chức theo đúng lộ trình luyện đề phỏng vấn thực tế: trước tiên nắm chắc phân tích độ phức tạp, sau đó làm chủ các template tần suất cao như binary search (tìm kiếm nhị phân), two pointers (hai con trỏ), sliding window (cửa sổ trượt), DFS/BFS, backtracking (quay lui), dynamic programming (quy hoạch động), greedy (tham lam), Top K, và cuối cùng tổng kết, củng cố qua các chủ đề chuỗi (string), danh sách liên kết (linked list), thuật toán sắp xếp (sorting) cùng danh sách bài tập LeetCode trọng điểm.

Khi ôn luyện thuật toán đến một giai đoạn nhất định, rất nhiều người rơi vào tình trạng: làm không ít bài, nhưng chỉ cần đề bài thay đổi một điều kiện nhỏ là lập tức bị tắc nghẽn. Nguyên nhân thường không phải do số lượng bài giải chưa đủ, mà là do chưa quy nạp bài toán về các dạng template cốt lõi. Điều thực sự hữu ích khi bước vào phòng phỏng vấn là: ngay khi đọc đề, bạn có thể nhận diện bài toán thuộc dạng nào, viết ra phiên bản chạy được trước, sau đó giải thích rõ ràng độ phức tạp và cách xử lý các trường hợp biên (edge cases).

## Phù hợp với ai

- Ứng viên đang chuẩn bị phỏng vấn thuật toán (Campus / Tuyển dụng có kinh nghiệm), mong muốn luyện LeetCode một cách có hệ thống theo từng dạng bài.
- Người đã giải được một số lượng bài nhất định nhưng khi review lại không giải thích mạch lạc được "tại sao bài này lại giải như vậy".
- Backend developer đã có nền tảng cấu trúc dữ liệu tương đối ổn định nhưng còn thiếu các template thuật toán chuẩn và kinh nghiệm xử lý điều kiện biên.
- Kỹ sư chỉ còn 7 đến 30 ngày trước kỳ phỏng vấn, cần nhanh chóng lấy lại cảm giác viết code (coding flow).

## Phỏng vấn thuật toán đánh giá điều gì?

Phỏng vấn thuật toán thường không chỉ đánh giá việc bạn có thể AC (Accept) một bài toán hay không, mà quan trọng hơn là xem xét 4 yếu tố:

| Tiêu chí đánh giá | Biểu hiện cụ thể trong phỏng vấn | Cần làm gì khi ôn tập |
| ----------------- | --------------------------------- | --------------------- |
| Nhận diện dạng bài | Xác định bài này dùng binary search, sliding window, backtracking hay DP | Luyện theo từng dạng bài, không giải đề ngẫu nhiên vô định |
| Độ ổn định của mã nguồn | Điều kiện biên, null pointer, chỉ số mảng (index), điều kiện vòng lặp có tin cậy không | Mỗi template cần chuẩn bị trước 2 đến 3 ca kiểm thử biên (test cases) |
| Diễn đạt độ phức tạp | Có giải thích mạch lạc được Time Complexity và Space Complexity hay không | Viết phân tích độ phức tạp ngay sau khi hoàn thành mỗi bài |
| Khả năng mở rộng / biến thể | Khi bài toán thay đổi điều kiện, có linh hoạt sửa lại template được không | Với mỗi dạng bài, cần giải tối thiểu bài cơ bản và các bài biến thể |

Nếu chỉ cần ghi nhớ một câu: **Xây dựng template theo dạng bài trước, sau đó dùng bài toán tiêu biểu để rèn luyện khả năng biến chuyển.**

## Thứ tự đọc khuyến nghị

1. [Cẩm nang phỏng vấn về Độ phức tạp Thời gian và Không gian](./complexity-analysis.md): Làm rõ Big O, độ phức tạp của đệ quy và những hiểu lầm thường gặp trước tiên.
2. [Tổng hợp câu hỏi phỏng vấn Tìm kiếm nhị phân (Binary Search)](./binary-search.md): Rèn luyện binary search cơ bản, biên trái, biên phải và binary search trên tập kết quả (answers).
3. [Tổng hợp câu hỏi phỏng vấn Hai con trỏ (Two Pointers) và Cửa sổ trượt (Sliding Window)](./two-pointers-and-sliding-window.md): Giải quyết các bài toán tần suất cao trên mảng, chuỗi và danh sách liên kết.
4. [Tổng hợp câu hỏi phỏng vấn DFS và BFS](./dfs-bfs.md): Nắm vững tìm kiếm trên cây, đồ thị, ma trận và duyệt theo tầng (level-order).
5. [Tổng hợp câu hỏi phỏng vấn Thuật toán Quay lui (Backtracking)](./backtracking.md): Tập trung xử lý các bài toán tổ hợp, hoán vị, tập con và ràng buộc bàn cờ.
6. [Tổng hợp câu hỏi phỏng vấn Quy hoạch động (Dynamic Programming)](./dynamic-programming.md): Tiếp cận từ định nghĩa trạng thái và phương trình chuyển trạng thái, không học vẹt lời giải.
7. [Tổng hợp câu hỏi phỏng vấn Thuật toán Tham lam (Greedy)](./greedy.md) và [Tổng hợp câu hỏi phỏng vấn Bài toán Top K](./top-k.md): Bổ sung kỹ thuật tham lam kết hợp sắp xếp, heap, phân vùng quickselect và đếm thùng (bucket counting).
8. [Một số bài toán thuật toán chuỗi thường gặp](./string-algorithm-problems.md), [Một số bài toán thuật toán danh sách liên kết thường gặp](./linkedlist-algorithm-problems.md), [Tổng hợp 10 thuật toán sắp xếp kinh điển](./10-classical-sorting-algorithms.md): Ôn tập tổng hợp theo từng chủ đề trước kỳ phỏng vấn.

## Template cốt lõi

| Template | Dấu hiệu nhận diện | Bài viết trọng tâm |
| -------- | ------------------- | ------------------- |
| Binary Search | Đã sắp xếp, có tính đơn điệu, giá trị khả thi nhỏ nhất, giá trị khả thi lớn nhất | [Tổng hợp câu hỏi phỏng vấn Tìm kiếm nhị phân](./binary-search.md) |
| Two Pointers | Chỉnh sửa tại chỗ (in-place), co hẹp từ hai đầu, con trỏ nhanh chậm đuổi bắt, định vị danh sách liên kết | [Tổng hợp câu hỏi phỏng vấn Hai con trỏ và Cửa sổ trượt](./two-pointers-and-sliding-window.md) |
| Sliding Window | Mảng con liên tục, chuỗi con liên tục, cửa sổ dài nhất / ngắn nhất | [Tổng hợp câu hỏi phỏng vấn Hai con trỏ và Cửa sổ trượt](./two-pointers-and-sliding-window.md) |
| DFS/BFS | Duyệt cây, duyệt đồ thị, miền liên thông trên ma trận, số bước ngắn nhất theo tầng | [Tổng hợp câu hỏi phỏng vấn DFS và BFS](./dfs-bfs.md) |
| Backtracking | Liệt kê tất cả các phương án hợp lệ, chọn đường đi, tổ hợp hoán vị, ràng buộc bàn cờ | [Tổng hợp câu hỏi phỏng vấn Thuật toán Quay lui](./backtracking.md) |
| Dynamic Programming | Giá trị tối ưu, bài toán đếm số cách, tính khả đạt, dãy con, bài toán cái túi (knapsack) | [Tổng hợp câu hỏi phỏng vấn Quy hoạch động](./dynamic-programming.md) |
| Greedy | Ở mỗi bước chọn đối tượng tối ưu nhất hiện tại, thường kết hợp với sắp xếp | [Tổng hợp câu hỏi phỏng vấn Thuật toán Tham lam](./greedy.md) |
| Top K | Phần tử lớn thứ K, Top K phần tử xuất hiện nhiều nhất, luồng dữ liệu (data stream), hàng đợi ưu tiên | [Tổng hợp câu hỏi phỏng vấn Bài toán Top K](./top-k.md) |

## Lộ trình cấp tốc 7 ngày

Khi thời gian gấp rút, không nên bắt đầu ngay từ những bài quá khó. Mục tiêu của lộ trình 7 ngày là khôi phục sự quen thuộc với template và độ chính xác khi viết code tay:

| Ngày | Trọng tâm | Hành động khuyến nghị |
| ---- | --------- | --------------------- |
| Ngày 1 | Độ phức tạp + Sắp xếp | Ôn lại Big O, Quicksort, Mergesort, Heapsort và tính ổn định (stability) |
| Ngày 2 | Binary Search + Two Pointers | Viết template biên trái/phải, Two Sum, 3Sum, Xóa phần tử trùng lặp |
| Ngày 3 | Sliding Window + Chuỗi | Viết Chuỗi con không lặp dài nhất, Chuỗi con bao phủ nhỏ nhất, các bài toán Palindrome |
| Ngày 4 | Danh sách liên kết | Viết Đảo ngược danh sách liên kết, Phát hiện chu trình, Xóa node thứ N từ cuối |
| Ngày 5 | Cây và BFS | Viết duyệt tiền thứ tự / trung thứ tự / hậu thứ tự, duyệt theo tầng, Tổ tiên chung gần nhất (LCA) |
| Ngày 6 | Backtracking + DP | Viết Tập con (Subsets), Tổ hợp (Combinations), Đổi tiền xu (Coin Change), Dãy con tăng dài nhất (LIS) |
| Ngày 7 | Top K + Tổng kết | Viết Phần tử lớn thứ K, Top K tần suất cao, tổng kết các lỗi sai và test cases biên |

## Lộ trình bài bản 30 ngày

Lộ trình 30 ngày không hướng tới việc cày thật nhiều bài mỗi ngày. Nhịp độ hiệu quả hơn là: mỗi ngày giải 1 đến 3 bài tiêu biểu, sau khi làm xong viết 5 dòng tổng kết đúc rút.

| Giai đoạn | Thời gian | Mục tiêu |
| --------- | --------- | -------- |
| Giai đoạn 1 | Ngày 1 đến 5 | Độ phức tạp, mảng, danh sách liên kết, stack, queue; đảm bảo viết tay thuần thục các template cơ bản |
| Giai đoạn 2 | Ngày 6 đến 12 | Binary search, two pointers, sliding window, chuỗi; trọng tâm rèn luyện xử lý điều kiện biên |
| Giai đoạn 3 | Ngày 13 đến 18 | Cây, đồ thị, DFS/BFS, Union-Find; thiết lập khung tư duy cho các bài toán tìm kiếm |
| Giai đoạn 4 | Ngày 19 đến 24 | Quay lui, quy hoạch động, tham lam; trọng tâm rèn luyện định nghĩa trạng thái và cắt tỉa nhánh (pruning) |
| Giai đoạn 5 | Ngày 25 đến 30 | Top K, sắp xếp, bài toán tổng hợp và review các câu làm sai; chuẩn bị kỹ năng trình bày phỏng vấn |

## Bộ câu hỏi tự kiểm tra tần suất cao

- Tại sao phân tích độ phức tạp thời gian thường chỉ xét bậc cao nhất? Độ phức tạp của thuật toán đệ quy được tính như thế nào?
- Trong tìm kiếm nhị phân, khi nào chọn `left < right` và khi nào chọn `left <= right`?
- Two pointers và sliding window khác nhau như thế nào?
- DFS và BFS lần lượt phù hợp với những dạng bài toán nào? Khi nào cần dùng `visited`?
- Mối quan hệ giữa backtracking và DFS là gì? Nên đặt điều kiện cắt tỉa (pruning) ở vị trí nào?
- Tại sao quy hoạch động lại khó? Làm thế nào xác định định nghĩa trạng thái và thứ tự duyệt?
- Tại sao thuật toán tham lam cần chứng minh tính đúng đắn? Trong phỏng vấn cần giải thích đến mức độ nào là đạt?
- Với bài toán Top K, khi nào nên chọn Heap, phân vùng Quickselect hay Đếm thùng (bucket counting)?
- Tính ổn định (stability), sắp xếp tại chỗ (in-place) và độ phức tạp trường hợp tốt nhất / xấu nhất của thuật toán sắp xếp là gì?

## Chuyên đề liên quan

- [Hệ thống Kiến thức Cơ sở Máy tính](../)
- [Chuyên đề Cấu trúc Dữ liệu](../data-structure/)
- [Gợi ý bài tập LeetCode kinh điển cho các cấu trúc dữ liệu thường gặp](./common-data-structures-leetcode-recommendations.md)
- [Tổng kết các tư tưởng thuật toán kinh điển](./classical-algorithm-problems-recommendations.md)
- [Java Collections](../../java/collection/java-collection-questions-01.md)
