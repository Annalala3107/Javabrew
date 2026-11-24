---
title: Tổng hợp tư tưởng thuật toán kinh điển (Kèm đề xuất bài tập LeetCode)
description: Tổng hợp các tư tưởng thuật toán tần suất cao như tìm kiếm nhị phân, hai con trỏ, sliding window, DFS/BFS, quay lui, quy hoạch động, tham lam, chia để trị, sắp xếp tô-pô, Disjoint Set Union (Union-Find) và thao tác bit, đồng thời cung cấp cách nhận diện dạng bài, template, bài toán tiêu biểu và trọng tâm ôn tập.
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
  - LeetCode
  - Phỏng vấn
head:
  - - meta
    - name: keywords
      content: tư tưởng thuật toán,tìm kiếm nhị phân,hai con trỏ,sliding window,DFS,BFS,quay lui,quy hoạch động,tham lam,chia để trị,sắp xếp tô-pô,Union-Find,thao tác bit,đề xuất bài tập LeetCode
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/classical-algorithm-problems-recommendations.md
---

Đừng học vẹt các tư tưởng thuật toán một cách cô lập. Trong phỏng vấn, câu hỏi thực sự hữu ích là: Dấu hiệu nào nhắc nhở mình nên dùng thuật toán này? Chỗ nào trong template là nơi dễ sai nhất? Nếu người phỏng vấn thay đổi điều kiện bài toán, mình nên bắt đầu điều chỉnh từ biến hoặc trạng thái nào?

Danh sách bài tập này được tổ chức theo các tư tưởng thuật toán, mỗi loại đều đưa ra: "Dấu hiệu nhận biết, Template thường dùng, Bài tập tiêu biểu, Trọng tâm ôn tập". Số lượng bài tập được giới hạn vừa đủ để đại diện cho các template chuẩn mực; việc hiểu sâu và trình bày rành mạch những bài toán này sẽ mang lại hiệu quả cao hơn nhiều so với việc cày cuốc số lượng bài tập một cách máy móc.

## Cách sử dụng danh sách bài tập này

Đừng vội lao vào cày hết toàn bộ bài tập theo thứ tự từ trên xuống dưới. Cách tiếp cận phù hợp nhất khi chuẩn bị phỏng vấn là: Đọc bài viết về template tương ứng trước để đảm bảo bạn có thể tự tay viết được mã nguồn cốt lõi, sau đó làm các "Bài tập bắt buộc", và cuối cùng dùng các "Bài tập nâng cao" để rà soát lại các trường hợp biên và biến thể.

| Mục tiêu | Hành động gợi ý |
| -------- | --------------- |
| Xây dựng nhanh các template | Đọc trước các bài viết template tần suất cao: [Tìm kiếm nhị phân](./binary-search.md), [Hai con trỏ và Sliding Window](./two-pointers-and-sliding-window.md), [DFS/BFS](./dfs-bfs.md) |
| Củng cố mảng tìm kiếm và DP | Đọc tiếp [Thuật toán quay lui (Backtracking)](./backtracking.md), [Quy hoạch động (Dynamic Programming)](./dynamic-programming.md), mỗi dạng tự tay viết code ít nhất 2 bài cơ bản |
| Rà soát lỗ hổng trước phỏng vấn | Dùng [Thuật toán tham lam (Greedy)](./greedy.md), [Bài toán Top K](./top-k.md), [Tập hợp rời rạc Union-Find](../data-structure/union-find.md) để bổ sung các biến thể thường gặp |
| Tự ôn tập lại câu trả lời | Với mỗi bài, hãy ghi lại dấu hiệu nhận biết dạng bài, ý nghĩa của các biến cốt lõi, độ phức tạp và các ca kiểm thử biên. Nếu không giải thích rõ được những điều này, nghĩa là bạn vẫn chưa thực sự làm chủ bài toán |

## Tìm kiếm nhị phân (Binary Search)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Mảng đã sắp xếp, điều kiện đơn điệu, tìm biên, tìm giá trị khả thi nhỏ nhất hoặc lớn nhất |
| Template thường dùng | Tìm kiếm nhị phân cơ bản, biên trái, biên phải, tìm kiếm nhị phân trên tập kết quả (binary search on answers) |
| Bài tập bắt buộc | [704. Binary Search (Tìm kiếm nhị phân)](https://leetcode.cn/problems/binary-search/), [34. Find First and Last Position of Element in Sorted Array (Tìm vị trí đầu và cuối của phần tử trong mảng đã sắp xếp)](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) |
| Bài tập nâng cao | [35. Search Insert Position (Vị trí chèn tìm kiếm)](https://leetcode.cn/problems/search-insert-position/), [875. Koko Eating Bananas (Koko ăn chuối)](https://leetcode.cn/problems/koko-eating-bananas/) |
| Trọng tâm ôn tập | Điều kiện vòng lặp, cách tính `mid`, cập nhật biên xem có nguy cơ lặp vô tận hay không |

## Hai con trỏ (Two Pointers)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Mảng đã sắp xếp, sửa đổi mảng tại chỗ (in-place), hai đầu co dần vào giữa, con trỏ nhanh-chậm đuổi nhau trong danh sách liên kết |
| Template thường dùng | Con trỏ trái-phải, con trỏ nhanh-chậm, con trỏ đọc-ghi |
| Bài tập bắt buộc | [26. Remove Duplicates from Sorted Array (Xóa phần tử trùng lặp trong mảng đã sắp xếp)](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/), [977. Squares of a Sorted Array (Bình phương mảng đã sắp xếp)](https://leetcode.cn/problems/squares-of-a-sorted-array/) |
| Bài tập nâng cao | [15. 3Sum (Tổng 3 số)](https://leetcode.cn/problems/3sum/), [142. Linked List Cycle II (Danh sách liên kết vòng II)](https://leetcode.cn/problems/linked-list-cycle-ii/) |
| Trọng tâm ôn tập | Cố định rõ ngữ nghĩa con trỏ, không bỏ sót điều kiện khử trùng lặp, bài danh sách liên kết nên vẽ trước 3 node để hình dung |

## Cửa sổ trượt (Sliding Window)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Mảng con liên tục, chuỗi con liên tục, dài nhất/ngắn nhất, trong cửa sổ thỏa mãn một điều kiện nhất định |
| Template thường dùng | Cửa sổ kích thước cố định, cửa sổ kích thước khả biến, Map đếm tần suất |
| Bài tập bắt buộc | [3. Longest Substring Without Repeating Characters (Chuỗi con không lặp dài nhất)](https://leetcode.cn/problems/longest-substring-without-repeating-characters/), [209. Minimum Size Subarray Sum (Mảng con có tổng nhỏ nhất)](https://leetcode.cn/problems/minimum-size-subarray-sum/) |
| Bài tập nâng cao | [76. Minimum Window Substring (Chuỗi con bao phủ nhỏ nhất)](https://leetcode.cn/problems/minimum-window-substring/), [438. Find All Anagrams in a String (Tìm tất cả các chuỗi đảo mẫu tự trong chuỗi)](https://leetcode.cn/problems/find-all-anagrams-in-a-string/) |
| Trọng tâm ôn tập | Khi nào mở rộng biên phải, khi nào thu hẹp biên trái, duy trì các biến bên trong cửa sổ như thế nào |

## DFS và BFS

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Duyệt cây, duyệt đồ thị, vùng liên thông trong ma trận, số bước ngắn nhất, duyệt theo tầng |
| Template thường dùng | DFS đệ quy, DFS mô phỏng bằng Stack, BFS dùng hàng đợi (Queue), BFS duyệt theo tầng |
| Bài tập bắt buộc | [102. Binary Tree Level Order Traversal (Duyệt cây nhị phân theo tầng)](https://leetcode.cn/problems/binary-tree-level-order-traversal/), [200. Number of Islands (Số lượng hòn đảo)](https://leetcode.cn/problems/number-of-islands/) |
| Bài tập nâng cao | [994. Rotting Oranges (Những quả cam thối)](https://leetcode.cn/problems/rotting-oranges/), [127. Word Ladder (Thang từ)](https://leetcode.cn/problems/word-ladder/) |
| Trọng tâm ôn tập | Đánh dấu các đỉnh đã thăm (`visited`), kiểm tra tràn biên, đếm số bước/số tầng trong BFS |

## Thuật toán quay lui (Backtracking)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Liệt kê tất cả các phương án khả thi, tìm đường đi, tổ hợp, hoán vị, tập con, ràng buộc trên bàn cờ |
| Template thường dùng | Trạng thái đường đi `path`, danh sách lựa chọn, tầng đệ quy, hoàn tác lựa chọn (backtrack) |
| Bài tập bắt buộc | [77. Combinations (Tổ hợp)](https://leetcode.cn/problems/combinations/), [78. Subsets (Tập con)](https://leetcode.cn/problems/subsets/) |
| Bài tập nâng cao | [39. Combination Sum (Tổng tổ hợp)](https://leetcode.cn/problems/combination-sum/), [51. N-Queens (Bài toán N quân hậu)](https://leetcode.cn/problems/n-queens/) |
| Trọng tâm ôn tập | Tham số đệ quy đại diện cho điều gì, điều kiện tỉa nhánh (pruning) nên đặt trước vòng lặp hay bên trong vòng lặp |

## Quy hoạch động (Dynamic Programming)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Tìm giá trị tối ưu (lớn nhất/nhỏ nhất), đếm số phương án, kiểm tra tính khả đạt, dãy con, bài toán cái túi (knapsack), hợp nhất khoảng |
| Template thường dùng | DP 1 chiều, DP 2 chiều, mảng cuộn (rolling array), DP cái túi (Knapsack DP) |
| Bài tập bắt buộc | [70. Climbing Stairs (Leo cầu thang)](https://leetcode.cn/problems/climbing-stairs/), [322. Coin Change (Đổi tiền xu)](https://leetcode.cn/problems/coin-change/) |
| Bài tập nâng cao | [300. Longest Increasing Subsequence (Dãy con tăng dài nhất)](https://leetcode.cn/problems/longest-increasing-subsequence/), [416. Partition Equal Subset Sum (Phân chia tập con có tổng bằng nhau)](https://leetcode.cn/problems/partition-equal-subset-sum/) |
| Trọng tâm ôn tập | Ý nghĩa ngữ nghĩa của `dp[i]`, khởi tạo giá trị cơ sở, thứ tự duyệt vòng lặp, khả năng tối ưu hóa không gian bộ nhớ |

## Thuật toán tham lam (Greedy)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Mỗi bước đều đưa ra lựa chọn tối ưu nhất ở thời điểm hiện tại; thường gắn liền với sắp xếp, khoảng thời gian, nhảy bước, mua bán |
| Template thường dùng | Sắp xếp rồi lựa chọn, duy trì biên xa nhất có thể đạt được, hợp nhất/bao phủ khoảng |
| Bài tập bắt buộc | [455. Assign Cookies (Chia bánh quy)](https://leetcode.cn/problems/assign-cookies/), [55. Jump Game (Trò chơi nhảy)](https://leetcode.cn/problems/jump-game/) |
| Bài tập nâng cao | [45. Jump Game II (Trò chơi nhảy II)](https://leetcode.cn/problems/jump-game-ii/), [435. Non-overlapping Intervals (Các khoảng không chồng lấn)](https://leetcode.cn/problems/non-overlapping-intervals/) |
| Trọng tâm ôn tập | Tại sao chiến lược tham lam không mắc sai lầm, liệu có ví dụ phản chứng nào bác bỏ chiến lược hiện tại không |

## Thuật toán chia để trị (Divide and Conquer)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Bài toán có thể chia nhỏ thành các bài toán con cùng loại, kết quả của các bài toán con có thể kết hợp/hợp nhất lại được |
| Template thường dùng | Chia nhỏ bằng đệ quy, giải quyết bài toán con, hợp nhất kết quả |
| Bài tập bắt buộc | [108. Convert Sorted Array to Binary Search Tree (Chuyển mảng đã sắp xếp thành cây tìm kiếm nhị phân)](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/), [148. Sort List (Sắp xếp danh sách liên kết)](https://leetcode.cn/problems/sort-list/) |
| Bài tập nâng cao | [23. Merge k Sorted Lists (Hợp nhất K danh sách liên kết đã sắp xếp)](https://leetcode.cn/problems/merge-k-sorted-lists/), [215. Kth Largest Element in an Array (Phần tử lớn thứ K trong mảng)](https://leetcode.cn/problems/kth-largest-element-in-an-array/) |
| Trọng tâm ôn tập | Điều kiện dừng đệ quy, khoảng trái và khoảng phải có bị chồng chéo hay không, độ phức tạp của bước hợp nhất |

## Sắp xếp tô-pô (Topological Sort)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Phụ thuộc khóa học, phụ thuộc tác vụ, đồ thị có hướng không chu trình (DAG), kiểm tra tính khả thi khi hoàn thành |
| Template thường dùng | Mảng bán bậc vào (in-degree array) + Hàng đợi (thuật toán Kahn), hoặc DFS đánh dấu 3 màu |
| Bài tập bắt buộc | [207. Course Schedule (Lịch học)](https://leetcode.cn/problems/course-schedule/) |
| Bài tập nâng cao | [210. Course Schedule II (Lịch học II)](https://leetcode.cn/problems/course-schedule-ii/), [269. Alien Dictionary (Từ điển người ngoài hành tinh)](https://leetcode.cn/problems/alien-dictionary/) |
| Trọng tâm ôn tập | Khi nào thì giảm bán bậc vào, số lượng node đã xử lý có bằng tổng số node trong đồ thị không |

## Tập hợp rời rạc (Union-Find)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Tính liên thông, phân nhóm, vòng tròn bạn bè, cạnh dư thừa, quan hệ đẳng thức |
| Template thường dùng | `find`, `union`, nén đường đi (path compression), hợp nhất theo kích thước/hạng (union by rank/size) |
| Bài tập bắt buộc | [547. Number of Provinces (Số lượng tỉnh thành)](https://leetcode.cn/problems/number-of-provinces/) |
| Bài tập nâng cao | [684. Redundant Connection (Liên kết dư thừa)](https://leetcode.cn/problems/redundant-connection/), [990. Satisfiability of Equality Equations (Tính thỏa mãn của hệ phương trình đẳng thức)](https://leetcode.cn/problems/satisfiability-of-equality-equations/) |
| Trọng tâm ôn tập | `find` có thực hiện nén đường đi không, kiểm tra xung đột tại thời điểm nào |

## Thao tác Bit (Bit Manipulation)

| Mục | Nội dung |
| --- | -------- |
| Dấu hiệu nhận biết | Tính chẵn lẻ, kiểm tra lũy thừa của 2, phần tử xuất hiện duy nhất một lần, nén trạng thái (bitmasking) |
| Template thường dùng | Phép XOR, phép AND xóa bit 1 thấp nhất `n & (n - 1)`, liệt kê mặt nạ bit |
| Bài tập bắt buộc | [136. Single Number (Con số xuất hiện một lần)](https://leetcode.cn/problems/single-number/), [231. Power of Two (Lũy thừa của 2)](https://leetcode.cn/problems/power-of-two/) |
| Bài tập nâng cao | [191. Number of 1 Bits (Số lượng bit 1)](https://leetcode.cn/problems/number-of-1-bits/), [78. Subsets (Tập con)](https://leetcode.cn/problems/subsets/) |
| Trọng tâm ôn tập | Tính chất đại số của XOR, ý nghĩa ngữ nghĩa của `n & (n - 1)`, biểu diễn nhị phân của số âm |

## Lộ trình ôn tập tham khảo

Bài viết này tập trung vào các dạng bài kinh điển và danh sách bài tập đề xuất. Lộ trình chạy nước rút 7 ngày và lộ trình hệ thống 30 ngày được duy trì thống nhất tại [Tổng quan ôn tập phỏng vấn thuật toán](./README.md). Sau này nếu có điều chỉnh nhịp độ ôn tập, chỉ cần cập nhật trang tổng quan trung tâm, tránh tình trạng thông tin lộ trình bị sai lệch giữa nhiều bài viết khác nhau.
