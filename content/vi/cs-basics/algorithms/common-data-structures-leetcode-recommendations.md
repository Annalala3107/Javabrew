---
title: Đề xuất bài tập LeetCode kinh điển cho các cấu trúc dữ liệu phổ biến
description: Tổng hợp các bài toán LeetCode tần suất cao theo từng cấu trúc dữ liệu: mảng, danh sách liên kết, stack, queue, bảng băm, cây, đồ thị, heap, Trie, Union-Find, cung cấp dạng bài, template, giá trị phỏng vấn và trọng tâm ôn tập.
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
  - Cấu trúc dữ liệu
  - LeetCode
head:
  - - meta
    - name: keywords
      content: LeetCode,cấu trúc dữ liệu,mảng,danh sách liên kết,stack,queue,bảng băm,cây nhị phân,đồ thị,heap,Trie,Union-Find,đề xuất bài tập,lộ trình luyện thuật toán
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/common-data-structures-leetcode-recommendations.md
---

Khi luyện tập các bài toán cấu trúc dữ liệu, không nên chỉ cày cuốc đơn thuần theo độ khó từ Easy đến Hard. Cách tiếp cận vững chắc hơn là xây dựng dạng bài theo từng cấu trúc dữ liệu cụ thể: mảng chú trọng chỉ số và khoảng, danh sách liên kết chú trọng con trỏ, stack/queue chú trọng ràng buộc thứ tự, cây và đồ thị chú trọng cách duyệt, heap chú trọng độ ưu tiên, còn bảng băm chú trọng việc định vị và tra cứu nhanh.

Danh sách bài tập dưới đây được tinh gọn trong phạm vi các câu hỏi tần suất cao trong phỏng vấn và các bài toán đại diện cho template. Với mỗi loại cấu trúc dữ liệu, hãy làm trước các "Bài tập bắt buộc", sau đó mới làm các "Bài tập nâng cao". Sau khi làm xong mỗi bài, ít nhất hãy ghi lại độ phức tạp, các ca kiểm thử biên và xác định bài toán đó thuộc về template nào.

## Cách sử dụng danh sách bài tập này

Đối với các bài toán cấu trúc dữ liệu, đừng chỉ ghi nhớ kết luận một cách thụ động. Mỗi khi luyện một nhóm bài, trước tiên hãy quay lại cấu trúc dữ liệu tương ứng để xem lại một lượt: "Cách thức lưu trữ, Các thao tác cốt lõi, Độ phức tạp", rồi mới bắt tay vào viết code. Làm như vậy thì khi người phỏng vấn hỏi sâu về Java Collections, Redis, MySQL Index hay các kịch bản lưu cache thực tế, câu trả lời của bạn sẽ không chỉ dừng lại ở góc độ giải một bài toán đơn thuần.

| Cấu trúc dữ liệu | Đọc tài liệu nào trước | Trọng tâm cần chú ý khi làm bài |
| ---------------- | ---------------------- | ------------------------------- |
| Mảng, Danh sách liên kết, Stack & Queue | [Chi tiết về cấu trúc dữ liệu tuyến tính](../data-structure/linear-data-structure.md), [Hai con trỏ và Sliding Window](./two-pointers-and-sliding-window.md) | Chỉ số (index), cập nhật con trỏ, thời điểm push/pop stack |
| Bảng băm (Hash Table) | [Tổng hợp câu hỏi phỏng vấn Bảng băm](../data-structure/hash-table.md) | Thiết kế key, thời điểm đếm tần suất, xung đột băm và cơ chế mở rộng dung lượng (resize) |
| Cây và Đồ thị | [Chi tiết về cấu trúc Cây](../data-structure/tree.md), [Chi tiết về Đồ thị](../data-structure/graph.md), [DFS và BFS](./dfs-bfs.md) | Giá trị trả về của đệ quy, đánh dấu đỉnh đã thăm (`visited`), đếm số tầng trong BFS |
| Heap và Top K | [Chi tiết về Heap](../data-structure/heap.md), [Tổng hợp câu hỏi phỏng vấn bài toán Top K](./top-k.md) | Kích thước heap, cách viết Comparator so sánh, xử lý luồng dữ liệu (data stream) |
| Trie và Union-Find | [Tổng hợp câu hỏi phỏng vấn Cây tiền tố Trie](../data-structure/trie.md), [Tổng hợp câu hỏi phỏng vấn Tập hợp rời rạc Union-Find](../data-structure/union-find.md) | Cấu trúc node, cờ đánh dấu kết thúc từ, nén đường đi, kiểm tra tính liên thông |
| LRU | [Tổng hợp câu hỏi phỏng vấn Bộ nhớ đệm LRU Cache](../data-structure/lru-cache.md) | Cách bảng băm và danh sách liên kết đôi phối hợp để duy trì thao tác O(1) |

## Mảng (Arrays)

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Tìm kiếm nhị phân | [704. Binary Search (Tìm kiếm nhị phân)](https://leetcode.cn/problems/binary-search/) | [34. Find First and Last Position of Element in Sorted Array (Tìm vị trí đầu và cuối của phần tử trong mảng đã sắp xếp)](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) | Kiểm tra điều kiện vòng lặp và ranh giới biên | `left <= right`, cập nhật biên trái/phải |
| Sửa đổi tại chỗ (In-Place) | [26. Remove Duplicates from Sorted Array (Xóa phần tử trùng lặp trong mảng đã sắp xếp)](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/) | [80. Remove Duplicates from Sorted Array II (Xóa phần tử trùng lặp trong mảng đã sắp xếp II)](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/) | Kiểm tra kỹ năng viết hai con trỏ | Ngữ nghĩa con trỏ chậm, thời điểm ghi đè dữ liệu |
| Hai con trỏ | [977. Squares of a Sorted Array (Bình phương mảng đã sắp xếp)](https://leetcode.cn/problems/squares-of-a-sorted-array/) | [15. 3Sum (Tổng 3 số)](https://leetcode.cn/problems/3sum/) | Bài tập mảng tần suất cao | Sắp xếp rồi khử trùng lặp, di chuyển con trỏ trái/phải |
| Tổng tiền tố (Prefix Sum) | [303. Range Sum Query - Immutable (Truy vấn tổng đoạn - Mảng bất biến)](https://leetcode.cn/problems/range-sum-query-immutable/) | [560. Subarray Sum Equals K (Mảng con có tổng bằng K)](https://leetcode.cn/problems/subarray-sum-equals-k/) | Nền tảng cho các bài toán mảng con | Ngữ nghĩa tổng tiền tố, đếm tần suất bằng bảng băm |

## Danh sách liên kết (Linked Lists)

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Thao tác cơ bản | [707. Design Linked List (Thiết kế danh sách liên kết)](https://leetcode.cn/problems/design-linked-list/) | [24. Swap Nodes in Pairs (Đổi chỗ từng cặp node trong danh sách liên kết)](https://leetcode.cn/problems/swap-nodes-in-pairs/) | Kiểm tra kỹ năng cơ bản thao tác node | Node giả lập (Dummy head), thứ tự chèn và xóa |
| Đảo ngược danh sách | [206. Reverse Linked List (Đảo ngược danh sách liên kết)](https://leetcode.cn/problems/reverse-linked-list/) | [92. Reverse Linked List II (Đảo ngược danh sách liên kết II)](https://leetcode.cn/problems/reverse-linked-list-ii/) | Dạng bài viết tay tần suất cực cao | Thứ tự cập nhật các con trỏ `prev`, `cur`, `next` |
| Con trỏ nhanh-chậm | [141. Linked List Cycle (Danh sách liên kết vòng)](https://leetcode.cn/problems/linked-list-cycle/) | [142. Linked List Cycle II (Danh sách liên kết vòng II)](https://leetcode.cn/problems/linked-list-cycle-ii/) | Câu hỏi mở rộng thường gặp | Chứng minh toán học điểm gặp nhau và điểm bắt đầu vào vòng |
| Xóa node | [19. Remove Nth Node From End of List (Xóa node thứ N từ cuối danh sách)](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) | [61. Rotate List (Xoay danh sách liên kết)](https://leetcode.cn/problems/rotate-list/) | Kiểm tra xử lý trường hợp biên | Độ dài danh sách, trường hợp head node bị xóa |

## Ngăn xếp và Hàng đợi (Stacks & Queues)

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Mô phỏng cấu trúc | [232. Implement Queue using Stacks (Dùng Stack cài đặt Queue)](https://leetcode.cn/problems/implement-queue-using-stacks/) | [225. Implement Stack using Queues (Dùng Queue cài đặt Stack)](https://leetcode.cn/problems/implement-stack-using-queues/) | Kiểm tra hiểu biết về cơ chế cấu trúc | Phân định trách nhiệm giữa stack vào và stack ra |
| Khớp dấu ngoặc | [20. Valid Parentheses (Dấu ngoặc hợp lệ)](https://leetcode.cn/problems/valid-parentheses/) | [394. Decode String (Giải mã chuỗi)](https://leetcode.cn/problems/decode-string/) | Nền tảng cho các bài chuỗi dùng Stack | Khi nào đẩy vào stack, khi nào pop khỏi stack |
| Stack đơn điệu (Monotonic Stack) | [739. Daily Temperatures (Nhiệt độ hàng ngày)](https://leetcode.cn/problems/daily-temperatures/) | [84. Largest Rectangle in Histogram (Hình chữ nhật lớn nhất trong biểu đồ cột)](https://leetcode.cn/problems/largest-rectangle-in-histogram/) | Dạng bài tần suất trung bình đến cao | Duy trì stack tăng đơn điệu hay giảm đơn điệu |
| Hàng đợi đơn điệu (Monotonic Queue) | [239. Sliding Window Maximum (Giá trị lớn nhất trong cửa sổ trượt)](https://leetcode.cn/problems/sliding-window-maximum/) | [862. Shortest Subarray with Sum at Least K (Mảng con ngắn nhất có tổng ít nhất bằng K)](https://leetcode.cn/problems/shortest-subarray-with-sum-at-least-k/) | Template thường gặp cho bài mức độ Hard | Phần tử đầu hàng đợi hết hạn, phần tử cuối duy trì tính đơn điệu |

## Bảng băm (Hash Tables)

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Tra cứu nhanh | [1. Two Sum (Tổng hai số)](https://leetcode.cn/problems/two-sum/) | [49. Group Anagrams (Nhóm các chuỗi đảo mẫu tự)](https://leetcode.cn/problems/group-anagrams/) | Bài toán vỡ lòng về bảng băm | Thiết kế key |
| Đếm tần suất | [242. Valid Anagram (Chuỗi đảo mẫu tự hợp lệ)](https://leetcode.cn/problems/valid-anagram/) | [347. Top K Frequent Elements (K phần tử xuất hiện thường xuyên nhất)](https://leetcode.cn/problems/top-k-frequent-elements/) | Bài toán thống kê tần suất cao | Lựa chọn giữa mảng đếm tần suất và Map đếm tần suất |
| Tổng tiền tố + Bảng băm | [560. Subarray Sum Equals K (Mảng con có tổng bằng K)](https://leetcode.cn/problems/subarray-sum-equals-k/) | [974. Subarray Sums Divisible by K (Mảng con có tổng chia hết cho K)](https://leetcode.cn/problems/subarray-sums-divisible-by-k/) | Rất hay gặp trong các bài toán mảng con | Tra cứu trước rồi mới thêm vào Map, tránh tính cả tiền tố hiện tại |
| Cấu trúc bộ nhớ đệm (Cache) | [146. LRU Cache (Bộ nhớ đệm LRU)](https://leetcode.cn/problems/lru-cache/) | [460. LFU Cache (Bộ nhớ đệm LFU)](https://leetcode.cn/problems/lfu-cache/) | Bài toán thiết kế viết tay | Phối hợp nhịp nhàng giữa bảng băm và danh sách liên kết đôi |

## Cây nhị phân (Binary Trees)

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Duyệt cây | [144. Binary Tree Preorder Traversal (Duyệt tiền thứ tự cây nhị phân)](https://leetcode.cn/problems/binary-tree-preorder-traversal/) | [102. Binary Tree Level Order Traversal (Duyệt cây nhị phân theo tầng)](https://leetcode.cn/problems/binary-tree-level-order-traversal/) | Nền tảng của các bài toán cây | Ranh giới dừng đệ quy, đếm số tầng bằng hàng đợi |
| Bài toán đường đi | [112. Path Sum (Tổng đường đi)](https://leetcode.cn/problems/path-sum/) | [124. Binary Tree Maximum Path Sum (Đường đi có tổng lớn nhất trong cây nhị phân)](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) | DFS tần suất cao | Tách biệt giữa giá trị trả về của hàm và kết quả toàn cục |
| Dựng cây | [105. Construct Binary Tree from Preorder and Inorder Traversal (Dựng cây từ tiền thứ tự và trung thứ tự)](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | [106. Construct Binary Tree from Inorder and Postorder Traversal (Dựng cây từ trung thứ tự và hậu thứ tự)](https://leetcode.cn/problems/construct-binary-tree-from-inorder-and-postorder-traversal/) | Kiểm tra phạm vi đệ quy | Không để nhầm lẫn các khoảng chỉ số (index) |
| Tổ tiên chung gần nhất (LCA) | [236. Lowest Common Ancestor of a Binary Tree (Tổ tiên chung gần nhất trong cây nhị phân)](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/) | [235. Lowest Common Ancestor of a Binary Search Tree (Tổ tiên chung gần nhất trong cây tìm kiếm nhị phân)](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-search-tree/) | Câu hỏi mở rộng thường gặp | Khác biệt giải thuật giữa cây nhị phân thông thường và BST |

## Đồ thị (Graphs)

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| DFS/BFS trên lưới | [200. Number of Islands (Số lượng hòn đảo)](https://leetcode.cn/problems/number-of-islands/) | [695. Max Area of Island (Diện tích lớn nhất của hòn đảo)](https://leetcode.cn/problems/max-area-of-island/) | Nhập môn tìm kiếm trên đồ thị | Kiểm tra tràn biên ma trận, đánh dấu các ô đã thăm |
| Sắp xếp tô-pô | [207. Course Schedule (Lịch học)](https://leetcode.cn/problems/course-schedule/) | [210. Course Schedule II (Lịch học II)](https://leetcode.cn/problems/course-schedule-ii/) | Dạng bài quan hệ phụ thuộc | Mảng bán bậc vào (in-degree), hàng đợi |
| Đường đi ngắn nhất | [994. Rotting Oranges (Những quả cam thối)](https://leetcode.cn/problems/rotting-oranges/) | [127. Word Ladder (Thang từ)](https://leetcode.cn/problems/word-ladder/) | Ứng dụng BFS duyệt theo tầng | Thống kê số bước theo từng tầng |
| Tính liên thông | [547. Number of Provinces (Số lượng tỉnh thành)](https://leetcode.cn/problems/number-of-provinces/) | [684. Redundant Connection (Liên kết dư thừa)](https://leetcode.cn/problems/redundant-connection/) | Nền tảng Union-Find | Template hàm `find` và `union` |

## Heap

| Dạng bài | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Phần tử lớn thứ K | [215. Kth Largest Element in an Array (Phần tử lớn thứ K trong mảng)](https://leetcode.cn/problems/kth-largest-element-in-an-array/) | [703. Kth Largest Element in a Stream (Phần tử lớn thứ K trong luồng dữ liệu)](https://leetcode.cn/problems/kth-largest-element-in-a-stream/) | Bài toán Top K tần suất cao | Duy trì kích thước Min-Heap luôn bằng K |
| Thống kê tần suất | [347. Top K Frequent Elements (K phần tử xuất hiện thường xuyên nhất)](https://leetcode.cn/problems/top-k-frequent-elements/) | [692. Top K Frequent Words (K từ xuất hiện thường xuyên nhất)](https://leetcode.cn/problems/top-k-frequent-words/) | Bảng băm kết hợp Heap | Cách viết Comparator so sánh |
| Dual Heaps (Hai Heap) | [295. Find Median from Data Stream (Tìm trung vị từ luồng dữ liệu)](https://leetcode.cn/problems/find-median-from-data-stream/) | [480. Sliding Window Median (Trung vị trong cửa sổ trượt)](https://leetcode.cn/problems/sliding-window-median/) | Dạng bài thiết kế nâng cao | Cân bằng kích thước giữa Max-Heap và Min-Heap |

## Trie và Union-Find

| Cấu trúc | Bài tập bắt buộc | Bài tập nâng cao | Giá trị phỏng vấn | Trọng tâm ôn tập |
| -------- | ---------------- | ---------------- | ----------------- | ---------------- |
| Trie | [208. Implement Trie (Prefix Tree) (Cài đặt cây tiền tố Trie)](https://leetcode.cn/problems/implement-trie-prefix-tree/) | [211. Design Add and Search Words Data Structure (Thiết kế cấu trúc dữ liệu thêm và tìm kiếm từ)](https://leetcode.cn/problems/design-add-and-search-words-data-structure/) | Dạng bài tập hợp chuỗi | Cấu trúc node, cờ đánh dấu kết thúc từ |
| Trie + DFS | [212. Word Search II (Tìm kiếm từ II)](https://leetcode.cn/problems/word-search-ii/) | [648. Replace Words (Thay thế từ)](https://leetcode.cn/problems/replace-words/) | Dạng bài tần suất trung bình đến cao | Tỉa nhánh tiền tố (Prefix pruning) |
| Union-Find | [547. Number of Provinces (Số lượng tỉnh thành)](https://leetcode.cn/problems/number-of-provinces/) | [1319. Number of Operations to Make Network Connected (Số thao tác để làm mạng liên thông)](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/) | Template kiểm tra tính liên thông | Nén đường đi (Path compression) |
| Union-Find phát hiện chu trình | [684. Redundant Connection (Liên kết dư thừa)](https://leetcode.cn/problems/redundant-connection/) | [990. Satisfiability of Equality Equations (Tính thỏa mãn của hệ phương trình đẳng thức)](https://leetcode.cn/problems/satisfiability-of-equality-equations/) | Biến thể đồ thị phổ biến | Hợp nhất các đẳng thức trước, sau đó mới kiểm tra xung đột |

## Lộ trình ôn tập tham khảo

Bài viết này chỉ tập trung vào danh sách bài tập liên quan đến cấu trúc dữ liệu. Lộ trình ôn tập 7 ngày và lộ trình ôn tập 30 ngày được duy trì thống nhất tại [Tổng quan ôn tập cấu trúc dữ liệu](../data-structure/README.md), tránh việc bài viết đề xuất và trang tổng quan phải cập nhật trùng lặp cùng một lộ trình.
