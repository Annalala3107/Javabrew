---
title: "Tổng hợp câu hỏi phỏng vấn Tìm kiếm nhị phân: Biên trái, biên phải, Binary Search trên kết quả và Template Java"
description: "Tổng hợp câu hỏi phỏng vấn về tìm kiếm nhị phân (Binary Search), giải thích chi tiết binary search cơ bản, biên trái, biên phải, binary search trên tập kết quả, template viết tay bằng Java, phân tích độ phức tạp và bài tập LeetCode tần suất cao."
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: tìm kiếm nhị phân,template binary search,biên trái biên phải,binary search trên kết quả,Java binary search,LeetCode binary search,câu hỏi phỏng vấn thuật toán
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/binary-search.md
---

Điểm khiến nhiều người dễ "ngã ngựa" nhất trong tìm kiếm nhị phân (Binary Search) không nằm ở tư tưởng thuật toán mà nằm ở các điều kiện biên. Chỉ cần một trong các yếu tố như `left`, `right`, `mid`, điều kiện vòng lặp hay giá trị trả về chưa được xác định rõ ràng về mặt ngữ nghĩa, bạn sẽ rất dễ viết ra một vòng lặp vô tận hoặc bỏ sót đáp án chính xác.

Trong phỏng vấn, để xác định xem một bài toán có thể áp dụng tìm kiếm nhị phân hay không, hãy ghi nhớ nguyên tắc cốt lõi: **Không gian chứa đáp án có tính đơn điệu (monotonicity) hay không?** Mảng đã được sắp xếp tăng dần chỉ là trường hợp trực quan nhất; các bài toán tìm vận tốc nhỏ nhất, dung tích nhỏ nhất hay số ngày ít nhất đều có thể thực hiện tìm kiếm nhị phân trên chính miền giá trị của kết quả.

## Trọng tâm đánh giá trong phỏng vấn

- Viết trơn tru template tìm kiếm nhị phân cơ bản mà không gặp lỗi cú pháp hay lỗi logic.
- Xử lý chuẩn xác các bài toán tìm biên trái (left boundary) và biên phải (right boundary).
- Nhận diện bài toán tìm kiếm nhị phân trên tập kết quả (binary search on answers), thay vì chỉ biết tìm phần tử trong một mảng có sẵn.
- Giải thích được tại sao vòng lặp chắc chắn sẽ kết thúc và tại sao thuật toán không bao giờ bỏ sót nghiệm.
- Nêu rõ độ phức tạp thời gian là `O(logn)` và độ phức tạp không gian thông thường là `O(1)`.

## Khi nào nên nghĩ đến tìm kiếm nhị phân?

Đừng bao giờ thu hẹp phạm vi của tìm kiếm nhị phân thành "chỉ dùng để tìm một con số trong mảng đã sắp xếp". Điều kiện tiên quyết thực sự của thuật toán này là **tính đơn điệu**.

Tính đơn điệu thường xuất hiện dưới hai dạng phổ biến:

| Phân loại | Ví dụ | Cơ sở phán đoán |
| --------- | ----- | --------------- |
| Đơn điệu trên mảng | Tìm `target` trong mảng đã sắp xếp | So sánh `nums[mid]` với `target` cho phép loại bỏ ngay một nửa không gian tìm kiếm |
| Đơn điệu trên tập kết quả | Tìm vận tốc tối thiểu, dung tích nhỏ nhất, số ngày ít nhất | Khi một giá trị đáp án khả thi thì các giá trị lớn hơn cũng khả thi, hoặc ngược lại |

Ví dụ trong bài toán "Koko ăn chuối" (Koko Eating Bananas), tốc độ ăn càng nhanh thì Koko càng dễ ăn hết chuối trong khoảng thời gian quy định. Ở đây bản thân mảng chuối không cần sắp xếp; điều mang tính đơn điệu chính là mối quan hệ giữa "tốc độ ăn" và "khả năng ăn xong đúng hạn".

Trong buổi phỏng vấn, bạn có thể tự kiểm tra qua 3 câu hỏi sau:

1. Đề bài có đang yêu cầu tìm một vị trí, một ranh giới, hay một giá trị khả thi nhỏ nhất / lớn nhất không?
2. Nếu ta đoán thử một đáp án `x`, liệu ta có thể kiểm tra xem `x` có khả thi hay không với độ phức tạp `O(n)` hoặc thấp hơn không?
3. Khi `x` tăng lên hoặc giảm đi, tính khả thi có biến thiên một cách đơn điệu không?

Nếu cả ba câu hỏi trên đều có câu trả lời khẳng định, bạn gần như chắc chắn có thể áp dụng tìm kiếm nhị phân.

## Template tìm kiếm nhị phân cơ bản

Phù hợp nhất khi tìm kiếm một giá trị xác định trong mảng đã sắp xếp:

```java
int binarySearch(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}
```

Trong template này, khoảng tìm kiếm là đoạn đóng `[left, right]`, do đó điều kiện vòng lặp là `left <= right`. Mỗi lần kiểm tra ta đã loại trừ `mid`, vì vậy cập nhật biên thành `mid + 1` hoặc `mid - 1`.

Hãy ghi nhớ template này bằng một câu ngắn gọn: **Mọi vị trí trong khoảng đều có thể là đáp án; khi vòng lặp kết thúc, khoảng tìm kiếm trở nên rỗng.**

Ví dụ, tìm giá trị `7` trong mảng `[1, 3, 5, 7, 9]`:

1. `left = 0`, `right = 4`, `mid = 2`, `nums[mid] = 5`, mục tiêu nằm ở nửa bên phải.
2. Cập nhật `left = mid + 1 = 3`.
3. `mid = 3`, `nums[mid] = 7`, tìm thấy mục tiêu.

Nếu tìm giá trị `6`, cuối cùng sẽ xảy ra điều kiện `left > right`, cho thấy khoảng đóng đã bị loại trừ hoàn toàn, trả về `-1`.

## Template biên trái (Lower Bound)

Tìm vị trí đầu tiên có giá trị lớn hơn hoặc bằng `target`:

```java
int lowerBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}
```

Khoảng tìm kiếm của template này là nửa đóng nửa mở `[left, right)`. `right` được khởi tạo bằng `nums.length`, và giá trị trả về có thể bằng `nums.length`, biểu thị rằng trong mảng không có phần tử nào lớn hơn hoặc bằng `target`.

Mấu chốt của template biên trái không phải là "tìm thấy target", mà là "tìm vị trí đầu tiên thỏa mãn điều kiện". Cách viết này xử lý một cách tự nhiên trường hợp mục tiêu không tồn tại trong mảng.

Ví dụ trong mảng `[1, 2, 2, 2, 4]`, tìm vị trí đầu tiên có giá trị `>= 2`:

- Khi `nums[mid] >= 2`, bản thân `mid` có thể chính là đáp án, do đó không thể loại trừ `mid`, ta cập nhật `right = mid`.
- Khi `nums[mid] < 2`, `mid` và tất cả các vị trí bên trái nó chắc chắn không thể là đáp án, cập nhật `left = mid + 1`.

Khi vòng lặp kết thúc, `left == right`, và vị trí này chính là vị trí đầu tiên thỏa mãn điều kiện.

## Template biên phải (Upper Bound)

Để tìm vị trí cuối cùng có giá trị nhỏ hơn hoặc bằng `target`, ta có thể tìm vị trí đầu tiên lớn hơn `target`, rồi lấy kết quả trừ đi 1:

```java
int upperBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left - 1;
}
```

Ưu điểm của cách viết này là bạn chỉ cần ghi nhớ duy nhất một mạch tư duy cho cả biên trái lẫn biên phải: tìm vị trí đầu tiên thỏa mãn điều kiện.

Biên phải rất dễ viết sai điều kiện biên, do đó quy đổi về bài toán biên trái là phương pháp tối ưu:

- Vị trí cuối cùng `<= target` = Vị trí đầu tiên `> target` - 1.
- Vị trí cuối cùng `< target` = Vị trí đầu tiên `>= target` - 1.

Cách làm này giúp bạn không phải nhớ hai bộ template khác nhau, viết code tay trong phỏng vấn sẽ vững vàng hơn nhiều.

## Binary Search trên tập kết quả (Binary Search on Answer)

Tìm kiếm nhị phân trên tập kết quả không tìm kiếm một phần tử có sẵn trong mảng, mà tìm kiếm giá trị khả thi nhỏ nhất hoặc lớn nhất trong toàn bộ miền giá trị của đáp án.

Bài toán điển hình: Cho các đống chuối và tổng thời gian `h`, tìm tốc độ ăn chuối tối thiểu. Tốc độ càng nhanh thì càng dễ ăn hết trong `h` giờ — đây chính là tính đơn điệu.

Dạng bài này thường chia thành 2 bước:

1. Xác định phạm vi của đáp án. Ví dụ tốc độ tối thiểu là `1`, tối đa không vượt quá số chuối của đống lớn nhất.
2. Viết hàm kiểm tra `check`. Cho trước một tốc độ, kiểm tra xem có thể ăn hết chuối trong `h` giờ hay không.

Cận trên này hợp lệ dựa vào ràng buộc của đề bài: `h >= piles.length`. Vì khi tốc độ bằng đống chuối lớn nhất, mỗi đống mất tối đa 1 giờ, tổng thời gian sẽ không vượt quá số đống chuối.

```java
int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = 0;
    for (int pile : piles) {
        right = Math.max(right, pile);
    }
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canFinish(piles, h, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

boolean canFinish(int[] piles, int h, int speed) {
    long hours = 0;
    for (int pile : piles) {
        hours += (pile + speed - 1) / speed;
    }
    return hours <= h;
}
```

Tại sao ở đây lại trả về `left`? Bởi vì vòng lặp liên tục tìm kiếm "tốc độ khả thi đầu tiên". Khi `canFinish(mid)` trả về true, điều đó chứng tỏ `mid` khả thi, nhưng có thể vẫn còn tốc độ nhỏ hơn nữa cũng khả thi, do đó ta thu hẹp biên phải. Cuối cùng, vị trí hai biên trùng nhau chính là tốc độ khả thi nhỏ nhất.

Hàm `check` trong tìm kiếm nhị phân trên kết quả thường đóng vai trò then chốt hơn cả khung nhị phân bên ngoài. Trong phỏng vấn, bạn nên giải thích rõ ý nghĩa và cách hoạt động của hàm `check` trước khi đặt bút viết khung nhị phân.

## Lựa chọn giữa ba dạng tìm kiếm nhị phân như thế nào?

| Mục tiêu | Template khuyến nghị | Giá trị trả về |
| -------- | -------------------- | -------------- |
| Tìm một chỉ số có giá trị bằng `target` | Binary search cơ bản | Tìm thấy trả về chỉ số, không thấy trả về `-1` |
| Tìm vị trí đầu tiên thỏa mãn điều kiện | Biên trái (lowerBound) | Trả về `left`, có thể bằng độ dài mảng |
| Tìm đáp án khả thi nhỏ nhất | Binary search trên kết quả | Trả về giá trị `left` cuối cùng |

Nếu đề bài có các từ khóa như "đầu tiên", "cuối cùng", "khả thi nhỏ nhất", "khả thi lớn nhất", đừng vội vàng viết template nhị phân cơ bản mà hãy xác định xem đây có phải là bài toán tìm biên hay không.

## Trình tự viết code tay trong phỏng vấn

Mã nguồn của các bài nhị phân thường không dài, vì vậy người phỏng vấn sẽ dễ dàng truy vấn lý do: "Tại sao bạn dám loại bỏ một nửa không gian tìm kiếm?". Khi viết tay, bạn nên trình bày theo trình tự sau:

1. Nêu rõ không gian tìm kiếm: Đang tìm kiếm trên chỉ số mảng hay tìm kiếm trên miền giá trị của đáp án.
2. Chứng minh tính đơn điệu: Tại sao hai phía trái/phải của `mid` có thể loại bỏ an toàn một bên.
3. Xác định rõ ngữ nghĩa của khoảng: Khoảng đóng `[left, right]` hay nửa đóng nửa mở `[left, right)`.
4. Viết quy tắc cập nhật biên: `mid` có còn khả năng là đáp án hay không; điều này quyết định viết `right = mid` hay `right = mid - 1`.
5. Giải thích giá trị trả về: Khi vòng lặp kết thúc, `left` và `right` lần lượt đại diện cho điều gì.

Một câu hỏi tự kiểm tra rất thực tế: **Khi `nums[mid]` vừa vặn thỏa mãn điều kiện, liệu mình có vô tình loại bỏ mất một đáp án tiềm năng không?** Trong tìm kiếm biên trái và tìm kiếm trên kết quả, `mid` thường vẫn có thể chính là đáp án, do đó tuyệt đối không được viết tùy tiện thành `right = mid - 1`.

## Phân tích bài toán tiêu biểu: Tìm vị trí đầu tiên và cuối cùng

Bài toán [34. Find First and Last Position of Element in Sorted Array (Tìm vị trí đầu tiên và cuối cùng của phần tử trong mảng đã sắp xếp)](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) là bài toán kinh điển nhất về tìm kiếm biên. Đề bài yêu cầu trả về vị trí bắt đầu và kết thúc của `target`, nếu không tìm thấy thì trả về `[-1, -1]`.

Với bài này, không nên viết theo kiểu "tìm thấy một target rồi quét tuyến tính sang hai bên". Mặc dù cách đó có thể vượt qua một vài test case, nhưng trong trường hợp xấu nhất (toàn bộ mảng chứa cùng một giá trị), thuật toán sẽ bị thoái hóa thành `O(n)`. Cách viết chuẩn mực và tối ưu là thực hiện tìm kiếm biên hai lần:

- Lần thứ nhất: Tìm vị trí đầu tiên lớn hơn hoặc bằng `target`.
- Lần thứ hai: Tìm vị trí đầu tiên lớn hơn `target`, rồi trừ đi 1.

Hai phương thức phụ trợ dưới đây hoàn toàn đồng nhất với template đã trình bày ở trên; mã nguồn đầy đủ được giữ lại để tiện đối chiếu trực tiếp giữa ngữ nghĩa giá trị trả về và logic chính:

```java
int[] searchRange(int[] nums, int target) {
    int left = lowerBound(nums, target);
    if (left == nums.length || nums[left] != target) {
        return new int[] {-1, -1};
    }
    int right = upperBound(nums, target) - 1;
    return new int[] {left, right};
}

int lowerBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

int upperBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}
```

Trong phỏng vấn, bài này thường có câu hỏi truy vấn thêm: Nếu trong mảng toàn bộ phần tử đều là `target` thì sao? Nếu `target` không tồn tại nhưng đáng lẽ phải chèn vào giữa mảng thì sao? Cả hai câu hỏi này thực chất đều kiểm tra xem bạn có hiểu đúng ngữ nghĩa của giá trị trả về hay không. `lowerBound` trả về vị trí đầu tiên thỏa mãn điều kiện, không đảm bảo giá trị tại vị trí đó chắc chắn bằng `target`, vì vậy trước khi trả về ta bắt buộc phải kiểm tra lại một lần nữa.

## Minh họa quá trình thực thi và các ca kiểm thử biên

Lấy template biên trái làm ví dụ, trong mảng `[1, 2, 2, 2, 4]` tìm vị trí đầu tiên `>= 2`:

| Vòng lặp | `left` | `right` | `mid` | Phán đoán điều kiện | Bước tiếp theo |
| -------- | ------ | ------- | ----- | ------------------- | -------------- |
| 1 | 0 | 5 | 2 | `nums[2] >= 2` | `right = 2` |
| 2 | 0 | 2 | 1 | `nums[1] >= 2` | `right = 1` |
| 3 | 0 | 1 | 0 | `nums[0] < 2` | `left = 1` |
| Kết thúc | 1 | 1 | - | `left == right` | Trả về 1 |

Một số ca kiểm thử biên (edge cases) nên nhẩm qua trước khi viết code tay:

| Dữ liệu vào | Mục tiêu | Kết quả kỳ vọng |
| ----------- | -------- | --------------- |
| `[]` | `1` | Trả về `-1` hoặc vị trí chèn `0`, tùy yêu cầu đề bài |
| `[1]` | `1` | Khớp chính xác phần tử duy nhất |
| `[1, 1, 1]` | Biên trái của `1` | Trả về `0` |
| `[1, 3, 5]` | Biên trái của `4` | Trả về `2` |
| `[1, 3, 5]` | Biên trái của `6` | Trả về `3` |

Cách viết sai phổ biến:

```java
while (left < right) {
    int mid = (left + right) / 2;
    if (nums[mid] >= target) {
        right = mid - 1; // Sai: mid có thể chính là biên trái, không thể loại trừ trực tiếp
    } else {
        left = mid + 1;
    }
}
```

Trong tìm kiếm biên trái, khi `nums[mid] >= target`, `mid` hoàn toàn có thể vẫn là đáp án đúng, do đó bắt buộc phải viết `right = mid`.

## Các điểm sai lầm thường gặp

- Biểu thức `mid = (left + right) / 2` có thể gây tràn số nguyên (integer overflow); luôn khuyến nghị viết `left + (right - left) / 2`.
- Không được dùng lẫn lộn quy tắc cập nhật của khoảng đóng và khoảng nửa đóng nửa mở.
- Khi tìm biên, sau khi khớp được mục tiêu thường không được trả về ngay mà phải tiếp tục thu hẹp khoảng.
- Tìm kiếm nhị phân trên kết quả cần chứng minh tính đơn điệu trước, không thể thấy yêu cầu "tìm giá trị nhỏ nhất" là áp dụng một cách khiên cưỡng.
- Trong các hàm kiểm tra như `canFinish`, biến tích lũy tổng số giờ thường cần kiểu `long` để tránh tràn số nguyên khi cộng dồn.

## Bộ câu hỏi tự kiểm tra tần suất cao

- Sự khác biệt giữa `left < right` và `left <= right` là gì?
- Tại sao tìm kiếm nhị phân lại có độ phức tạp thời gian là `O(logn)`?
- Khi tìm kiếm biên trái, tại sao khi điều kiện được thỏa mãn ta lại dịch chuyển `right`?
- Binary search trên tập kết quả là gì? Nó khác gì so với binary search thông thường?
- Tìm kiếm nhị phân có bắt buộc mảng gốc phải được sắp xếp hay không?

## Bài tập thực hành khuyến nghị

- [704. Binary Search (Tìm kiếm nhị phân)](https://leetcode.cn/problems/binary-search/)
- [35. Search Insert Position (Tìm vị trí chèn)](https://leetcode.cn/problems/search-insert-position/)
- [34. Find First and Last Position of Element in Sorted Array (Tìm vị trí đầu tiên và cuối cùng của phần tử trong mảng đã sắp xếp)](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)
- [875. Koko Eating Bananas (Koko ăn chuối)](https://leetcode.cn/problems/koko-eating-bananas/)
- [1011. Capacity To Ship Packages Within D Days (Khả năng vận chuyển hàng trong D ngày)](https://leetcode.cn/problems/capacity-to-ship-packages-within-d-days/)
