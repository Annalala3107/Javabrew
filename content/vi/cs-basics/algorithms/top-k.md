---
title: "Tổng hợp câu hỏi phỏng vấn bài toán Top K: Heap, Phân vùng Quickselect, Đếm theo thùng và Luồng dữ liệu"
description: "Tổng hợp câu hỏi phỏng vấn về bài toán Top K, giải thích phần tử lớn thứ K, top K phần tử có tần suất cao nhất, min-heap, phân vùng quickselect, đếm theo thùng, trung vị trong luồng dữ liệu, PriorityQueue và các bài toán LeetCode thường gặp."
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: TopK,Top K,lớn thứ K,top K tần suất cao,heap,min-heap,phân vùng quickselect,đếm theo thùng,PriorityQueue,trung vị luồng dữ liệu,LeetCode
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/top-k.md
---

Bài toán Top K xuất hiện rất thường xuyên trong các buổi phỏng vấn backend, bởi vì dạng bài này vừa kiểm tra được tư duy thuật toán, vừa dễ dàng mở rộng sang các bài toán kỹ thuật thực tế: bảng xếp hạng (leaderboard), thống kê từ khóa hot, tìm số trung vị trong luồng dữ liệu (data stream), tìm mã lỗi xuất hiện nhiều nhất trong log hệ thống, tất cả đều quy về bài toán Top K.

Đối với dạng bài này, đừng chỉ học thuộc duy nhất một cách viết. Người phỏng vấn rất hay hỏi mở rộng: Nếu lượng dữ liệu cực lớn thì xử lý ra sao? Nếu dữ liệu là luồng liên tục (data stream) thì làm thế nào? Nếu yêu cầu tìm top K phần tử xuất hiện nhiều nhất thì giải quyết ra sao? Trong mỗi điều kiện ràng buộc khác nhau, phương án tối ưu sẽ thay đổi tương ứng.

## Trọng tâm phỏng vấn

- Biết dùng Heap để giải bài toán tìm phần tử lớn thứ K và top K phần tử có tần suất cao nhất.
- Giải thích rõ ràng khi nào nên chọn Min-heap và khi nào chọn Max-heap.
- So sánh được độ phức tạp giữa Heap, phân vùng Quickselect và đếm theo thùng (Bucket Counting).
- Xử lý được các kịch bản với luồng dữ liệu (Data Stream).
- Tự viết được bộ so sánh (Comparator) tùy chỉnh cho `PriorityQueue` trong Java.

## Chọn phương án xử lý bài toán Top K như thế nào?

Trước hết hãy xem xét 3 điều kiện:

1. Đề bài chỉ yêu cầu duy nhất phần tử thứ K, hay cần lấy toàn bộ tập hợp top K phần tử?
2. Dữ liệu được cung cấp đầy đủ một lần, hay liên tục đổ về dưới dạng luồng dữ liệu (data stream)?
3. Kết quả trả về có cần được sắp xếp theo thứ tự hay không?

Nếu chỉ cần tìm phần tử lớn thứ K trong một mảng tĩnh một lần, phân vùng Quickselect trung bình sẽ chạy nhanh hơn; nếu dữ liệu liên tục đổ về, việc duy trì một Heap có kích thước K sẽ tự nhiên và hợp lý hơn; nếu đề bài hỏi top K phần tử có tần suất cao nhất, trước tiên cần thống kê tần suất, sau đó mới áp dụng Top K trên bảng tần suất đó.

## So sánh các phương án

| Phương án | Kịch bản phù hợp | Độ phức tạp thời gian | Độ phức tạp không gian |
| --- | --- | --- | --- |
| Sắp xếp (Sorting) | Lượng dữ liệu không lớn, ưu tiên code đơn giản | `O(nlogn)` | Phụ thuộc vào thuật toán sắp xếp |
| Min-heap | Tìm top K phần tử lớn nhất hoặc phần tử lớn thứ K | `O(nlogk)` | `O(k)` |
| Phân vùng Quickselect | Tìm phần tử lớn thứ K, hiệu năng trung bình cao | Trung bình `O(n)` | `O(1)` đến `O(logn)` |
| Đếm theo thùng (Bucket Counting) | Dải tần suất hữu hạn, tìm top K tần suất cao | `O(n)` | `O(n)` |
| Cặp đống (Dual Heaps) | Tìm số trung vị trong luồng dữ liệu (Data Stream) | Mỗi lần chèn `O(logn)` | `O(n)` |

Trong phỏng vấn, bạn có thể giải thích sự đánh đổi (trade-offs) như sau:

- Sắp xếp là phương án đơn giản nhất, phù hợp khi dữ liệu không quá lớn hoặc không yêu cầu tối ưu độ phức tạp đến mức tối đa.
- Heap phù hợp cho các kịch bản mà K nhỏ hơn n rất nhiều, không gian bộ nhớ chỉ tiêu tốn `O(k)`.
- Phân vùng Quickselect phù hợp tìm phần tử lớn thứ K trên tập dữ liệu có sẵn một lần, thời gian trung bình là `O(n)`, nhưng trường hợp xấu nhất có thể bị thoái hóa.
- Đếm theo thùng (Bucket Counting) cực kỳ thích hợp cho các bài toán tần suất, đặc biệt là khi tần suất không vượt quá `n`.

## Dùng Min-Heap tìm phần tử lớn thứ K

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int num : nums) {
        heap.offer(num);
        if (heap.size() > k) {
            heap.poll();
        }
    }
    return heap.peek();
}
```

Trong heap luôn duy trì K số lớn nhất hiện tại; đỉnh heap chính là phần tử nhỏ nhất trong số K phần tử này, tức là phần tử lớn thứ K của toàn bộ mảng.

Vì sao lại dùng Min-heap? Bởi vì mục tiêu là giữ lại K phần tử lớn nhất. Khi một phần tử mới được thêm vào, nếu kích thước heap vượt quá K, ta cần loại bỏ phần tử nhỏ nhất trong số K + 1 phần tử này. Đỉnh của Min-heap chính là giá trị nhỏ nhất cần loại bỏ.

Nếu đề bài yêu cầu tìm phần tử nhỏ thứ K, tư duy sẽ ngược lại: duy trì một Max-heap kích thước K, khi vượt quá K thì loại bỏ phần tử lớn nhất ở đỉnh đống.

## Phân tích bài toán tiêu biểu: Top K phần tử có tần suất cao nhất

[347. Top K Frequent Elements (LeetCode 347: Top K Frequent Elements)](https://leetcode.cn/problems/top-k-frequent-elements/) là bài toán tần suất phổ biến nhất trong nhóm Top K. Đề bài cho một mảng số nguyên và một số nguyên `k`, yêu cầu trả về `k` phần tử có tần suất xuất hiện cao nhất, thứ tự kết quả thường không bắt buộc.

Bài này không nên sắp xếp trực tiếp mảng ban đầu, bởi vì thứ cần so sánh là "tần suất", chứ không phải giá trị của phần tử. Cách tiếp cận chuẩn xác gồm hai bước:

1. Dùng `HashMap` để đếm số lần xuất hiện của từng phần tử.
2. Duy trì một Min-heap sắp xếp theo tần suất tăng dần, heap chỉ lưu giữ `k` phần tử có tần suất cao nhất hiện tại.

Vì sao ở đây vẫn dùng Min-heap? Bởi vì khi heap đã đầy, mỗi khi phần tử mới làm kích thước heap vượt quá `k`, phần tử có tần suất thấp nhất sẽ bị đẩy ra ngoài. Nhờ vậy sau khi duyệt hết tất cả các phần tử phân biệt, những phần tử còn lại trong heap chính là top `k` phần tử có tần suất cao nhất.

```java
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.put(num, freq.getOrDefault(num, 0) + 1);
    }
    PriorityQueue<int[]> heap = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
        heap.offer(new int[] {entry.getKey(), entry.getValue()});
        if (heap.size() > k) {
            heap.poll();
        }
    }
    int[] ans = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        ans[i] = heap.poll()[0];
    }
    return ans;
}
```

Tại đây heap được sắp xếp tăng dần theo tần suất, khi kích thước heap vượt quá K sẽ loại bỏ phần tử có tần suất nhỏ nhất.

Lấy ví dụ `nums = [1,1,1,2,2,3]`, `k = 2`: bảng tần suất là `{1=3, 2=2, 3=1}`. Heap trước tiên nạp `1` và `2`, khi nạp tiếp `3` thì kích thước vượt quá 2, do đó sẽ loại phần tử có tần suất thấp nhất là `3`, cuối cùng giữ lại `1` và `2`.

Nếu `k` bằng đúng số lượng phần tử phân biệt, heap cuối cùng sẽ giữ lại toàn bộ phần tử; nếu người phỏng vấn yêu cầu kết quả đầu ra phải sắp xếp giảm dần theo tần suất, bạn cần sắp xếp thêm một lượt trước khi trả về.

Nếu người phỏng vấn yêu cầu khi tần suất bằng nhau thì sắp xếp theo giá trị hoặc thứ tự từ điển, bộ so sánh (comparator) cần bổ sung quy tắc sắp xếp thứ hai. Ví dụ bài toán Top K từ có tần suất cao nhất thường yêu cầu từ có tần suất cao đứng trước, nếu cùng tần suất thì từ có thứ tự từ điển nhỏ hơn đứng trước.

## Tư tưởng phân vùng Quickselect

Phân vùng Quickselect phù hợp để tìm phần tử lớn thứ K khi không yêu cầu trả về trọn vẹn danh sách top K có thứ tự. Tư tưởng là mỗi bước phân chia mảng xung quanh một pivot, căn cứ vào thứ hạng của pivot để quyết định tiếp tục tìm kiếm ở nửa bên nào. Độ phức tạp thời gian trung bình là `O(n)`, nhưng trường hợp xấu nhất có thể thoái hóa về `O(n^2)`; trong thực tế thường sẽ chọn pivot ngẫu nhiên.

Ưu điểm của phân vùng Quickselect là không cần duy trì heap và đạt độ phức tạp trung bình thấp; hạn chế là nó phù hợp nhất với dữ liệu nạp sẵn một lần trong bộ nhớ. Nếu dữ liệu liên tục đổ về theo luồng, hoặc dữ liệu quá lớn không thể nạp hết vào RAM cùng lúc, giải pháp dùng Heap sẽ dễ triển khai hơn nhiều.

## Kịch bản luồng dữ liệu (Data Stream)

Với dạng bài luồng dữ liệu, không thể mỗi khi có một phần tử mới tới lại đi sắp xếp lại toàn bộ. Cách làm phổ biến là liên tục duy trì một cấu trúc dữ liệu động:

- **Phần tử lớn thứ K trong luồng dữ liệu:** Duy trì một Min-heap kích thước K.
- **Trung vị trong luồng dữ liệu:** Duy trì hai heap: bên trái là Max-heap chứa nửa các phần tử nhỏ hơn, bên phải là Min-heap chứa nửa các phần tử lớn hơn.
- **Trung vị trong cửa sổ trượt (sliding window):** Cần xử lý thêm các phần tử hết hạn khỏi cửa sổ; do heap thông thường không hỗ trợ xóa phần tử bất kỳ một cách hiệu quả nên thường cần kỹ thuật xóa lười (lazy deletion) hoặc cấu trúc tập hợp có thứ tự (ordered collection).

## Minh họa quy trình và các ca biên (edge cases)

Lấy mảng `[3, 2, 1, 5, 6, 4]` để tìm phần tử lớn thứ 2 làm ví dụ, duy trì một Min-heap kích thước 2. Trong bảng dưới đây, để thuận tiện theo dõi, các phần tử trong heap được hiển thị theo thứ tự tăng dần, điều này không phản ánh thứ tự mảng nội bộ của `PriorityQueue` trong Java.

| Phần tử đọc vào | Phần tử ứng viên | Xử lý khi vượt quá K |
| --- | --- | --- |
| 3 | `[3]` | Không xử lý |
| 2 | `[2, 3]` | Không xử lý |
| 1 | `[1, 2, 3]` | Loại 1, giữ `[2, 3]` |
| 5 | `[2, 3, 5]` | Loại 2, giữ `[3, 5]` |
| 6 | `[3, 5, 6]` | Loại 3, giữ `[5, 6]` |
| 4 | `[4, 5, 6]` | Loại 4, giữ `[5, 6]` |

Cuối cùng, đỉnh heap là `5`, chính là phần tử lớn thứ 2.

Cách viết sai thường gặp:

```java
PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> b - a);
```

Bộ so sánh này có nguy cơ tràn số nguyên (integer overflow) khi gặp các giá trị âm/dương cực hạn. Cách viết an toàn hơn là:

```java
PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
```

## Các điểm dễ mắc lỗi

- Tìm top K lớn nhất thường dùng Min-heap, tìm top K nhỏ nhất thường dùng Max-heap.
- `PriorityQueue` mặc định trong Java là Min-heap.
- Bài toán top K tần suất cao nhất cần đếm tần suất trước, sau đó mới áp dụng Top K trên tần suất.
- Nếu cần xuất kết quả có thứ tự, sau khi dùng Heap hoặc Quickselect phân vùng vẫn cần sắp xếp bổ sung.
- Trong kịch bản luồng dữ liệu, không được sắp xếp lại toàn bộ dữ liệu lịch sử mỗi khi có phần tử mới.

## Tự kiểm tra câu hỏi tần suất cao

- Vì sao để tìm phần tử lớn thứ K thường duy trì một Min-heap kích thước K?
- Min-heap và Max-heap lần lượt phù hợp với những kịch bản Top K nào?
- Sự khác biệt về độ phức tạp thời gian và không gian giữa phương án dùng Heap và phân vùng Quickselect là gì?
- Vì sao bài toán top K phần tử có tần suất cao nhất phải thống kê tần suất trước?
- Vì sao bài toán tìm trung vị trong luồng dữ liệu lại thích hợp duy trì bằng hai heap?

## Bài tập rèn luyện đề xuất

- [215. Kth Largest Element in an Array (Phần tử lớn thứ K trong mảng)](https://leetcode.cn/problems/kth-largest-element-in-an-array/)
- [347. Top K Frequent Elements (Top K phần tử có tần suất cao nhất)](https://leetcode.cn/problems/top-k-frequent-elements/)
- [692. Top K Frequent Words (Top K từ có tần suất cao nhất)](https://leetcode.cn/problems/top-k-frequent-words/)
- [703. Kth Largest Element in a Stream (Phần tử lớn thứ K trong luồng)](https://leetcode.cn/problems/kth-largest-element-in-a-stream/)
- [295. Find Median from Data Stream (Tìm số trung vị trong luồng dữ liệu)](https://leetcode.cn/problems/find-median-from-data-stream/)
