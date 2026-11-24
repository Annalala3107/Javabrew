---
title: "Cẩm nang phỏng vấn về Độ phức tạp Thời gian và Không gian: Big O, Độ phức tạp Đệ quy và Những hiểu lầm thường gặp"
description: "Cẩm nang phỏng vấn toàn diện về độ phức tạp thời gian và không gian, giải thích có hệ thống về Big O, độ phức tạp vòng lặp, độ phức tạp đệ quy, không gian phụ nhớ, suy đoán quy mô đầu vào và các sai lầm phổ biến."
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: độ phức tạp thời gian,độ phức tạp không gian,Big O,độ phức tạp đệ quy,độ phức tạp vòng lặp,độ phức tạp thuật toán,phân tích độ phức tạp,câu hỏi phỏng vấn thuật toán,độ phức tạp LeetCode
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/complexity-analysis.md
---

Phân tích độ phức tạp là ngưỡng cửa đầu tiên trong mọi cuộc phỏng vấn thuật toán. Người phỏng vấn không nhất thiết đòi hỏi bạn phải viết ra các bước chứng minh toán học thật chặt chẽ, nhưng kỳ vọng bạn có thể giải thích rõ ràng: đoạn mã này chạy bao nhiêu vòng, tiêu tốn bao nhiêu bộ nhớ phụ, và điều gì sẽ xảy ra khi quy mô đầu vào tăng lên rất lớn.

Trước hết, hãy làm rõ một ranh giới quan trọng: phân tích độ phức tạp thường đánh giá xu hướng tăng trưởng tiệm cận khi quy mô dữ liệu đầu vào tiến dần đến vô cùng, chứ không phải thời gian chạy chính xác trên đồng hồ (wall-clock time). `O(n)` không có nghĩa là luôn luôn chạy nhanh hơn `O(nlogn)` trong mọi trường hợp; hằng số ẩn, quy mô dữ liệu thực tế, tính cục bộ của bộ nhớ đệm (cache locality) và chi tiết triển khai mã nguồn đều ảnh hưởng trực tiếp đến thời gian thực thi. Dù vậy, trong phỏng vấn, trước hết bạn chỉ cần dựa vào Big O để nói rõ cấp độ tăng trưởng, sau đó bổ sung thêm một câu về các giới hạn trong tình huống thực tế là đã hoàn toàn đạt yêu cầu.

## Trọng tâm đánh giá trong phỏng vấn

- Có khả năng xác định chính xác độ phức tạp thời gian dựa trên các cấu trúc vòng lặp, đệ quy và thao tác trên cấu trúc dữ liệu.
- Phân biệt rõ ràng giữa không gian bộ nhớ phụ trợ (auxiliary space) và không gian do chính dữ liệu đầu vào chiếm dụng.
- Giải thích rành mạch độ phức tạp tốt nhất (best case), xấu nhất (worst case) và trung bình (average case) áp dụng cho những thuật toán nào.
- Khi gặp mã đệ quy, biết cách sử dụng cây đệ quy (recursion tree) hoặc phân tích sự thu hẹp quy mô của các bài toán con (subproblems).
- Không mặc định coi các thao tác trên `HashMap`, sắp xếp hay heap đều là `O(1)`.

## Làm thế nào để trình bày độ phức tạp trong phỏng vấn?

Khi trả lời về độ phức tạp, đừng chỉ thông báo cộc lốc một kết luận. Cách diễn đạt chuyên nghiệp và thuyết phục hơn là trình bày "đoạn code đã thực hiện những thao tác gì, và vì sao lại dẫn đến độ phức tạp đó".

Lấy bài toán Two Sum làm ví dụ:

```text
Mảng được duyệt qua một lần duy nhất. Với mỗi phần tử, ta thực hiện một lần tra cứu và một lần chèn vào HashMap. Thao tác trên bảng băm có chi phí trung bình là O(1), do đó độ phức tạp thời gian là O(n). Thuật toán sử dụng thêm một HashMap để lưu ánh xạ từ giá trị phần tử sang chỉ số mảng, trong trường hợp xấu nhất sẽ lưu trữ n phần tử, vì vậy độ phức tạp không gian là O(n).
```

Câu trả lời này chắc chắn hơn rất nhiều so với việc chỉ nói `O(n)`, bởi vì bạn đã thể hiện rõ ràng toàn bộ quá trình suy luận. Nếu người phỏng vấn tiếp tục hỏi xoáy vào trường hợp xấu nhất khi xảy ra xung đột băm (hash collision), bạn cũng có sẵn không gian để mở rộng câu trả lời.

## Các cấp độ phức tạp thường gặp

| Độ phức tạp | Tình huống thường gặp | Ghi chú phỏng vấn |
| ----------- | --------------------- | ----------------- |
| `O(1)` | Truy cập mảng theo chỉ số, thao tác đỉnh ngăn xếp (stack), tra cứu bảng băm trung bình | Bảng băm có thể bị suy biến trong trường hợp xấu nhất |
| `O(logn)` | Tìm kiếm nhị phân (Binary Search), sift-up/sift-down trên Heap, tra cứu cây cân bằng | Mỗi vòng lặp thu nhỏ quy mô bài toán theo một tỷ lệ |
| `O(n)` | Duyệt qua mảng, danh sách liên kết, chuỗi đúng một lần | Cần kiểm tra xem có thực sự chỉ quét đúng một lượt không |
| `O(nlogn)` | Quicksort (trung bình), Mergesort, Heapsort | Cấp độ phổ biến nhất đối với các bài toán sắp xếp |
| `O(n^2)` | Vòng lặp lồng nhau, duyệt từng cặp hai phần tử | Trong phỏng vấn cần cảnh giác xem có tối ưu được không |
| `O(2^n)` | Liệt kê tập con (subsets), một số bài toán quay lui | Không gian tìm kiếm tăng theo hàm mũ |
| `O(n!)` | Hoán vị toàn phần (permutations), vét cạn bài toán người du lịch | Chỉ phù hợp với quy mô dữ liệu đầu vào cực nhỏ |

Thông thường, quy mô dữ liệu đầu vào trong đề bài sẽ ngầm gợi ý độ phức tạp chấp nhận được:

| Quy mô đầu vào | Độ phức tạp thường được chấp nhận |
| -------------- | --------------------------------- |
| `n <= 20` | Hàm mũ, quay lui (backtracking), quy hoạch động nén trạng thái (bitmask DP) |
| `n <= 100` | Đôi khi chấp nhận `O(n^3)` |
| `n <= 1000` | Thường gặp `O(n^2)` |
| `n <= 10^5` | `O(nlogn)` hoặc `O(n)` |
| `n >= 10^6` | Thường đòi hỏi tiệm cận `O(n)` |

Đây không phải là quy tắc cứng nhắc, nhưng là kinh nghiệm thực chiến giúp bạn phán đoán ngay xem lời giải vét cạn (brute-force) có bị quá thời gian chạy (Time Limit Exceeded - TLE) hay không.

## Xác định độ phức tạp của vòng lặp như thế nào?

Với vòng lặp đơn thuần, ta quan sát số lần thực thi của biến điều khiển:

```java
for (int i = 0; i < n; i++) {
    // O(1)
}
```

Đoạn mã này có độ phức tạp là `O(n)`.

Với các vòng lặp lồng nhau, không thể chỉ đếm số tầng lồng, mà phải phân tích số lần chạy thực tế ở mỗi tầng:

```java
for (int i = 0; i < n; i++) {
    for (int j = i; j < n; j++) {
        // O(1)
    }
}
```

Số lần chạy của vòng lặp bên trong là tổng `n + (n - 1) + ... + 1`, tức là `n(n + 1) / 2`, do đó độ phức tạp là `O(n^2)`.

Nếu biến vòng lặp nhân đôi hoặc chia đôi sau mỗi lần lặp, thông thường độ phức tạp là `O(logn)`:

```java
for (int i = 1; i < n; i *= 2) {
    // O(1)
}
```

Một trường hợp khác rất dễ bị phán đoán nhầm là kỹ thuật hai con trỏ (two pointers):

```java
while (left < n && right < n) {
    if (needMoveRight()) {
        right++;
    } else {
        left++;
    }
}
```

Mặc dù bên trong vòng lặp `while` có chứa điều kiện rẽ nhánh, nhưng cả `left` và `right` đều chỉ tăng đơn điệu và mỗi con trỏ di chuyển tối đa `n` lần. Vì vậy độ phức tạp tổng thể là `O(n)`, hoàn toàn không phải `O(n^2)`.

## Xác định độ phức tạp đệ quy như thế nào?

Để xác định độ phức tạp của một hàm đệ quy, trước tiên hãy trả lời 2 câu hỏi:

1. Mỗi tầng đệ quy phân nhánh thành bao nhiêu bài toán con?
2. Ngoài lời gọi đệ quy, mỗi tầng phải thực hiện thêm bao nhiêu khối lượng công việc?

Trong tìm kiếm nhị phân, mỗi bước chỉ đi vào đúng một bài toán con với quy mô giảm một nửa:

```java
int binarySearch(int[] nums, int target, int left, int right) {
    if (left > right) {
        return -1;
    }
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) {
        return mid;
    }
    if (nums[mid] < target) {
        return binarySearch(nums, target, mid + 1, right);
    }
    return binarySearch(nums, target, left, mid - 1);
}
```

Độ sâu đệ quy là `logn`, và mỗi tầng chỉ thực hiện công việc với chi phí `O(1)`. Do đó độ phức tạp thời gian là `O(logn)`, và không gian ngăn xếp đệ quy (call stack) là `O(logn)`.

Với Mergesort (sắp xếp trộn), mỗi tầng chia thành 2 bài toán con, tổng chi phí thao tác trộn (merge) ở mỗi tầng là `O(n)`, số tầng cây đệ quy là `logn`. Do vậy độ phức tạp thời gian là `O(nlogn)`, và không gian mảng phụ trợ là `O(n)`.

Hãy xem thêm một phản ví dụ điển hình: tính số Fibonacci bằng đệ quy ngây thơ (naive recursion).

```java
int fib(int n) {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}
```

Đoạn mã này không phải là `O(n)`. Vì mỗi lời gọi hàm lại phân nhánh thành hai lời gọi đệ quy mới, rất nhiều bài toán con bị tính toán lặp đi lặp lại nhiều lần, khiến độ phức tạp thời gian tiệm cận `O(2^n)`. Nếu ta bổ sung mảng ghi nhớ (memoization) để mỗi trạng thái chỉ được tính một lần duy nhất, độ phức tạp thời gian sẽ giảm xuống `O(n)`, và độ phức tạp không gian cũng là `O(n)`.

## Cần xem xét những gì khi đánh giá độ phức tạp không gian?

Độ phức tạp không gian đo lường lượng bộ nhớ phụ trợ tiêu tốn thêm trong suốt quá trình thuật toán thực thi. Các nguồn tiêu thụ bộ nhớ phổ biến gồm:

- Cấp phát mảng mới, bảng băm (HashMap/HashSet), hàng đợi (queue), ngăn xếp (stack).
- Ngăn xếp lời gọi đệ quy (call stack).
- Vùng nhớ đệm phụ trợ trong quá trình sắp xếp hoặc trộn mảng.
- Việc tập dữ liệu kết quả trả về có được tính vào bộ nhớ phụ hay không phụ thuộc vào yêu cầu của đề bài. Trong phỏng vấn, bạn có thể chủ động nêu rõ quy ước này với người phỏng vấn.

Ví dụ, cách viết lặp (iterative) khi đảo ngược danh sách liên kết chỉ sử dụng vài con trỏ đơn giản nên độ phức tạp không gian là `O(1)`. Ngược lại, nếu dùng đệ quy, tuy không tạo mảng tường minh nào nhưng độ sâu ngăn xếp đệ quy là `n`, do đó độ phức tạp không gian sẽ là `O(n)`.

## Các điểm sai lầm thường gặp

- Sắp xếp không bao giờ là "miễn phí". Việc sắp xếp mảng trước khi dùng hai con trỏ thường khiến độ phức tạp thời gian tối thiểu phải là `O(nlogn)`.
- Tra cứu trong `HashMap` có chi phí trung bình là `O(1)`, nhưng trong trường hợp xấu nhất (xung đột băm nghiêm trọng) thì không còn là `O(1)`.
- Hàm đệ quy dù không cấp phát cấu trúc dữ liệu mới vẫn tiêu tốn bộ nhớ ngăn xếp đệ quy.
- Duyệt qua ma trận 2 chiều kích thước `m x n` có độ phức tạp là `O(mn)`, không nên viết vội vàng thành `O(n)`.
- Hàng đợi trong thuật toán BFS không chiếm không gian hằng số; trong trường hợp xấu nhất nó phải lưu trữ một lượng lớn các node cùng một tầng.
- Độ phức tạp trong các bài toán quay lui thường liên quan trực tiếp đến số lượng kết quả hợp lệ sinh ra, không thể chỉ nhìn vào độ sâu đệ quy.

## Bộ câu hỏi tự kiểm tra tần suất cao

- Tại sao khi phân tích độ phức tạp người ta thường bỏ qua hằng số nhân và các số hạng bậc thấp?
- Liệu thuật toán có độ phức tạp `O(n)` có luôn luôn chạy nhanh hơn thuật toán `O(nlogn)` không?
- Độ phức tạp thời gian trung bình và xấu nhất của Quicksort lần lượt là bao nhiêu?
- Độ phức tạp không gian của một thuật toán đệ quy được tính toán như thế nào?
- Tại sao độ phức tạp thời gian của DFS và BFS trên đồ thị thường là `O(V + E)`?
- Tại sao thao tác tra cứu trên bảng băm (hash table) lại đạt chi phí trung bình là `O(1)`?

## Bài tập thực hành khuyến nghị

- [704. Binary Search (Tìm kiếm nhị phân)](https://leetcode.cn/problems/binary-search/)
- [912. Sort an Array (Sắp xếp mảng)](https://leetcode.cn/problems/sort-an-array/)
- [206. Reverse Linked List (Đảo ngược danh sách liên kết)](https://leetcode.cn/problems/reverse-linked-list/)
- [200. Number of Islands (Số lượng hòn đảo)](https://leetcode.cn/problems/number-of-islands/)
