---
title: "Tổng hợp câu hỏi phỏng vấn Hai con trỏ và Cửa sổ trượt: Template tần suất cao cho Mảng, Danh sách liên kết và Chuỗi"
description: "Tổng hợp câu hỏi phỏng vấn về hai con trỏ (Two Pointers) và cửa sổ trượt (Sliding Window), giải thích chi tiết con trỏ trái phải, con trỏ nhanh chậm, con trỏ đọc ghi, cửa sổ cố định, cửa sổ khả biến, template Java và bài tập LeetCode tần suất cao."
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: hai con trỏ,cửa sổ trượt,con trỏ nhanh chậm,con trỏ trái phải,con trỏ đọc ghi,cửa sổ cố định,cửa sổ khả biến,thuật toán mảng,thuật toán danh sách liên kết,thuật toán chuỗi,LeetCode
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/two-pointers-and-sliding-window.md
---

Hai con trỏ (Two Pointers) và cửa sổ trượt (Sliding Window) thường được xếp chung trong quá trình ôn tập, nhưng bản chất bài toán mà chúng giải quyết không hoàn toàn giống nhau. Hai con trỏ thiên về một chiến lược di chuyển con trỏ, trong khi cửa sổ trượt nhấn mạnh vào việc duy trì một tập trạng thái bên trong một khoảng liên tục.

Một quy tắc phán đoán thực chiến: Nếu bài toán quan tâm đến mối quan hệ giữa hai vị trí cụ thể, hãy nghĩ đến hai con trỏ trước; nếu bài toán quan tâm đến mảng con liên tục hoặc chuỗi con liên tục và bên trong cửa sổ có điều kiện cần duy trì, hãy nghĩ đến cửa sổ trượt trước.

## Trọng tâm đánh giá trong phỏng vấn

- Phân biệt rõ ràng giữa con trỏ trái phải (đối hướng), con trỏ nhanh chậm và con trỏ đọc ghi.
- Duy trì chuẩn xác các trạng thái bên trong cửa sổ trượt như đếm tần suất, tổng tích lũy, giá trị lớn nhất/nhỏ nhất hoặc số lượng điều kiện khớp.
- Giải thích được tại sao các con trỏ chỉ di chuyển đơn điệu theo một chiều và độ phức tạp thời gian tổng thể là `O(n)`.
- Xử lý trơn tru các trường hợp mảng rỗng, mảng một phần tử, phần tử trùng lặp và điều kiện biên khi thu hẹp cửa sổ.

## Hai kỹ thuật này thực chất khác nhau như thế nào?

Hai con trỏ là một khái niệm rộng hơn: chỉ cần sử dụng hai con trỏ cùng phối hợp để duyệt qua dữ liệu thì đều có thể gọi là kỹ thuật hai con trỏ. Cửa sổ trượt mang tính cụ thể hơn: nó duy trì một khoảng liên tục `[left, right]`, và bên trong khoảng đó thường lưu trữ một tập trạng thái động như bảng đếm ký tự, tổng các phần tử, giá trị lớn nhất hay số lượng điều kiện đã thỏa mãn.

| Đặc trưng của bài toán | Kỹ thuật ưu tiên sử dụng |
| ---------------------- | ------------------------ |
| Tìm hai số trong mảng đã sắp xếp | Con trỏ trái phải (đối hướng) |
| Tìm chu trình, tìm trung điểm, tìm node thứ K từ cuối trong danh sách liên kết | Con trỏ nhanh chậm (Fast-Slow) |
| Xóa hoặc ghi đè phần tử tại chỗ (in-place) trên mảng | Con trỏ đọc ghi (Read-Write) |
| Tìm mảng con/chuỗi con liên tục dài nhất, ngắn nhất, hoặc đếm số lượng | Cửa sổ trượt (Sliding Window) |

Trong phỏng vấn, việc định nghĩa rõ ràng ý nghĩa của từng con trỏ trước khi viết code sẽ giúp bạn tự tin hơn rất nhiều. Ví dụ: "`left` biểu thị biên trái của cửa sổ, `right` biểu thị ký tự đang được mở rộng đưa vào cửa sổ", như vậy quá trình co hẹp cửa sổ sau đó sẽ không bao giờ bị rối loạn.

## Con trỏ trái phải (Hai con trỏ đối hướng)

Con trỏ trái phải thường được áp dụng cho mảng đã sắp xếp hoặc các bài toán cần co hẹp từ hai đầu vào giữa:

```java
int[] twoSumSorted(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) {
            return new int[] {left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[] {-1, -1};
}
```

Nếu mảng ban đầu chưa sắp xếp, thông thường ta cần sắp xếp mảng trước rồi mới áp dụng con trỏ trái phải. Hãy luôn nhớ rằng sau khi sắp xếp, độ phức tạp thời gian sẽ chuyển thành `O(nlogn)`.

Nguyên lý giúp con trỏ trái phải hoạt động chính xác là sau mỗi lần so sánh, ta có thể loại bỏ an toàn một tập hợp các nghiệm tiềm năng. Lấy bài toán Two Sum trên mảng đã sắp xếp làm ví dụ:

- Nếu tổng hiện tại quá nhỏ, điều đó chứng tỏ giá trị tại con trỏ trái quá nhỏ; nếu dịch con trỏ phải sang trái thì tổng chỉ càng nhỏ hơn nữa, vì vậy lựa chọn duy nhất là tăng con trỏ trái `left++`.
- Nếu tổng hiện tại quá lớn, điều đó chứng tỏ giá trị tại con trỏ phải quá lớn; nếu dịch con trỏ trái sang phải thì tổng chỉ càng lớn hơn nữa, vì vậy lựa chọn duy nhất là giảm con trỏ phải `right--`.

Bài toán 3Sum (Tìm bộ ba số có tổng bằng 0) cũng dựa trên cùng một ý tưởng: cố định một số trước, sau đó áp dụng Two Sum trên đoạn mảng còn lại. Điểm khó nhất của 3Sum nằm ở khâu khử trùng lặp (deduplication): số cố định cần khử trùng lặp, và sau khi hai con trỏ tìm được một bộ nghiệm hợp lệ cũng phải bỏ qua các giá trị trùng lặp tiếp theo.

## Con trỏ nhanh chậm (Fast-Slow Pointers)

Con trỏ nhanh chậm được sử dụng cực kỳ phổ biến trong danh sách liên kết:

```java
boolean hasCycle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            return true;
        }
    }
    return false;
}
```

Điểm cốt lõi của các bài toán danh sách liên kết không nằm ở độ dài dòng code mà nằm ở tính bất biến của ngữ nghĩa con trỏ. Thứ tự kiểm tra `fast != null && fast.next != null` tuyệt đối không được đảo ngược.

Con trỏ nhanh chậm thường có hai dạng chênh lệch tốc độ phổ biến:

- `fast` mỗi lần đi 2 bước, `slow` mỗi lần đi 1 bước: Dùng để phát hiện chu trình (cycle detection) và tìm node trung điểm của danh sách liên kết.
- Một con trỏ đi trước `k` bước, sau đó cả hai con trỏ cùng tiến với vận tốc 1 bước: Dùng để tìm node thứ `k` tính từ cuối danh sách lên.

Khi tìm node thứ `k` từ cuối lên, việc duy trì khoảng cách cố định `k` node giữa hai con trỏ đảm bảo rằng khi con trỏ dẫn đầu chạm tới cuối danh sách, con trỏ phía sau sẽ dừng lại chính xác tại node mục tiêu. Khi xóa node thứ `N` từ cuối lên, người ta thường dùng thêm một node giả (dummy head) ở đầu danh sách để tránh phải viết logic rẽ nhánh riêng khi xóa chính node đầu tiên.

## Con trỏ đọc ghi (Read-Write Pointers)

Con trỏ đọc ghi thường được áp dụng khi cần sửa đổi mảng tại chỗ (in-place):

```java
int removeDuplicates(int[] nums) {
    if (nums.length == 0) {
        return 0;
    }
    int write = 1;
    for (int read = 1; read < nums.length; read++) {
        if (nums[read] != nums[read - 1]) {
            nums[write] = nums[read];
            write++;
        }
    }
    return write;
}
```

`read` chịu trách nhiệm quét qua mảng gốc, trong khi `write` trỏ tới vị trí hợp lệ tiếp theo có thể ghi đè phần tử cần giữ lại. Trong phỏng vấn, bạn nên nêu rõ vai trò của hai biến này ngay từ đầu.

Tư tưởng cốt lõi của con trỏ đọc ghi là: "Duyệt qua toàn bộ mảng, nhưng chỉ ghi đè lại những phần tử cần giữ lại vào phần đầu của mảng". Dạng bài này thường yêu cầu thao tác tại chỗ và trả về độ dài mới của mảng mà không cấp phát mảng phụ.

Để xác định thời điểm ghi, hãy tự đặt câu hỏi: Phần tử hiện tại mà `read` đang trỏ tới có thuộc diện cần giữ lại hay không? Nếu cần giữ, ta ghi nó vào chỉ số `write` rồi tăng `write++`; nếu không cần giữ, ta chỉ tăng con trỏ `read`.

## Cửa sổ trượt khả biến (Variable-Size Sliding Window)

Lấy bài toán "Chuỗi con không lặp dài nhất" (Longest Substring Without Repeating Characters) làm ví dụ:

```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> count = new HashMap<>();
    int left = 0;
    int ans = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        count.put(c, count.getOrDefault(c, 0) + 1);
        while (count.get(c) > 1) {
            char d = s.charAt(left);
            count.put(d, count.get(d) - 1);
            left++;
        }
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
}
```

Trong template này, con trỏ phải chịu trách nhiệm mở rộng cửa sổ, còn con trỏ trái chịu trách nhiệm thu hẹp cửa sổ mỗi khi trạng thái bên trong không còn hợp lệ. Vì mỗi ký tự chỉ vào cửa sổ tối đa một lần và ra khỏi cửa sổ tối đa một lần, độ phức tạp thời gian hoàn toàn là `O(n)`.

Cửa sổ trượt khả biến thường tuân theo một nhịp điệu cố định gồm 3 bước:

1. Con trỏ phải thêm phần tử mới vào và cập nhật trạng thái cửa sổ.
2. Khi trạng thái cửa sổ vi phạm điều kiện của bài toán, liên tục di chuyển con trỏ trái để co hẹp cửa sổ, đồng thời đồng bộ cập nhật lại trạng thái.
3. Cập nhật kết quả tối ưu tại thời điểm cửa sổ đã thỏa mãn yêu cầu đề bài.

Thời điểm cập nhật kết quả giữa bài toán tìm dài nhất và ngắn nhất có sự khác biệt rõ rệt:

- Tìm cửa sổ hợp lệ dài nhất: Thường cập nhật đáp án sau khi cửa sổ đã được khôi phục về trạng thái hợp lệ.
- Tìm cửa sổ thỏa mãn ngắn nhất: Thường cập nhật đáp án ngay khi cửa sổ vừa thỏa mãn điều kiện, sau đó tiếp tục thu hẹp biên trái để tìm kiếm độ dài ngắn hơn nữa.

Ví dụ, trong bài toán "Chuỗi con bao phủ nhỏ nhất" (Minimum Window Substring), ngay khi cửa sổ bao phủ đủ các ký tự yêu cầu, ta phải cập nhật đáp án trước rồi mới co hẹp cửa sổ; còn trong bài "Chuỗi con không lặp dài nhất", khi phát hiện ký tự trùng lặp, ta phải co hẹp cho đến khi cửa sổ hợp lệ trở lại rồi mới cập nhật độ dài lớn nhất.

## Cửa sổ trượt cố định (Fixed-Size Sliding Window)

Cửa sổ cố định phù hợp với các yêu cầu dạng "mảng con hoặc chuỗi con có độ dài đúng bằng k":

```java
int maxSum(int[] nums, int k) {
    int window = 0;
    for (int i = 0; i < k; i++) {
        window += nums[i];
    }
    int ans = window;
    for (int right = k; right < nums.length; right++) {
        window += nums[right];
        window -= nums[right - k];
        ans = Math.max(ans, window);
    }
    return ans;
}
```

Điểm then chốt của cửa sổ cố định là: mỗi khi phía bên phải nạp thêm một phần tử thì phía bên trái lập tức loại bỏ đi đúng một phần tử.

Cửa sổ cố định không cần dùng vòng lặp `while` để thu hẹp, vì độ dài cửa sổ luôn luôn giữ nguyên. Nó hoạt động giống như một phép thống kê trượt (rolling calculation):

- Phần tử mới đi vào cửa sổ.
- Phần tử cũ vượt ra ngoài cửa sổ bị loại bỏ.
- Cập nhật kết quả cho cửa sổ hiện tại.

Nếu bên trong cửa sổ cần theo dõi giá trị lớn nhất hoặc nhỏ nhất tức thời, các biến đơn thuần sẽ không đủ đáp ứng, khi đó ta thường dùng đến hàng đợi đơn điệu (monotonic queue). Ví dụ trong bài "Giá trị lớn nhất trong cửa sổ trượt", hàng đợi lưu trữ các chỉ số của những ứng viên tiềm năng có thể trở thành giá trị lớn nhất, và phần tử đầu hàng đợi luôn là giá trị lớn nhất của cửa sổ hiện tại.

## Trình tự viết code tay trong phỏng vấn

Với các bài toán hai con trỏ và cửa sổ trượt, điều đáng sợ nhất trong phỏng vấn là đang viết dở thì ý nghĩa ngữ nghĩa của con trỏ bị trôi hoặc thay đổi. Hãy tuân thủ trình tự sau:

1. Xác định dạng bài: Co hẹp hai đầu, nhanh chậm đuổi bắt, đọc ghi ghi đè tại chỗ, hay cửa sổ trượt liên tục.
2. Làm rõ ngữ nghĩa của từng con trỏ: `left`, `right`, `slow`, `fast`, `write` trỏ tới vị trí nào.
3. Xác định trạng thái của cửa sổ: Bên trong cửa sổ đang theo dõi tổng, bảng tần suất, giá trị cực trị hay số lượng điều kiện khớp.
4. Xác định điều kiện di chuyển: Khi nào con trỏ phải mở rộng, khi nào con trỏ trái co hẹp.
5. Xác định thời điểm cập nhật kết quả: Cập nhật dài nhất sau khi cửa sổ đã hợp lệ; cập nhật ngắn nhất khi điều kiện vừa được thỏa mãn.

Một câu đúc kết để phân biệt nhanh: **Bài toán tìm dài nhất thường sửa chữa cửa sổ cho hợp lệ rồi mới cập nhật đáp án; bài toán tìm ngắn nhất thường ghi nhận đáp án rồi mới tiếp tục co hẹp cửa sổ.**

## Phân tích bài toán tiêu biểu: Chuỗi con bao phủ nhỏ nhất

Bài toán [76. Minimum Window Substring (Chuỗi con bao phủ nhỏ nhất)](https://leetcode.cn/problems/minimum-window-substring/) là bài toán toàn diện và thử thách chi tiết nhất về kỹ thuật cửa sổ trượt. Đề bài yêu cầu tìm chuỗi con ngắn nhất trong `s` sao cho nó chứa toàn bộ các ký tự trong `t` với đúng tần suất xuất hiện tương ứng.

Mấu chốt của bài này không phải là biết di chuyển con trỏ, mà là quản lý rành mạch ba cấu trúc theo dõi:

- `need`: Bảng lưu số lượng từng ký tự mà chuỗi mục tiêu `t` yêu cầu.
- `window`: Bảng lưu số lượng từng ký tự hiện đang có trong cửa sổ.
- `valid`: Biến đếm số lượng loại ký tự đã đạt đủ tần suất yêu cầu.

Khi `valid == need.size()`, cửa sổ hiện tại đã bao phủ hoàn toàn chuỗi `t`. Lúc này ta cập nhật đáp án ngắn nhất và bắt đầu co hẹp biên trái.

```java
String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    Map<Character, Integer> window = new HashMap<>();
    for (char c : t.toCharArray()) {
        need.put(c, need.getOrDefault(c, 0) + 1);
    }

    int left = 0;
    int valid = 0;
    int start = 0;
    int minLen = Integer.MAX_VALUE;

    for (int right = 0; right < s.length(); right++) {
        char in = s.charAt(right);
        if (need.containsKey(in)) {
            window.put(in, window.getOrDefault(in, 0) + 1);
            if (window.get(in).equals(need.get(in))) {
                valid++;
            }
        }

        while (valid == need.size()) {
            if (right - left + 1 < minLen) {
                start = left;
                minLen = right - left + 1;
            }
            char out = s.charAt(left);
            left++;
            if (need.containsKey(out)) {
                if (window.get(out).equals(need.get(out))) {
                    valid--;
                }
                window.put(out, window.get(out) - 1);
            }
        }
    }

    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}
```

Ở đây có hai chi tiết cực kỳ dễ mắc lỗi:

- Thao tác `valid--` phải thực hiện trước khi giảm giá trị `window.get(out)`, bởi vì chính tại thời điểm đó cửa sổ vừa chuyển từ trạng thái thỏa mãn sang không còn thỏa mãn nữa.
- Lệnh cập nhật kết quả phải đặt bên trong vòng lặp `while (valid == need.size())`, vì chỉ khi cửa sổ hiện tại thực sự bao phủ được `t` thì nó mới có tư cách tham gia so sánh tìm độ dài nhỏ nhất.

## Minh họa quá trình thực thi và các ca kiểm thử biên

Lấy bài toán "Chuỗi con không lặp dài nhất" làm ví dụ, với chuỗi đầu vào `abba`, sự thay đổi của cửa sổ diễn ra như sau:

| Ký tự con trỏ phải | Cửa sổ sau khi thêm | Hợp lệ? | Con trỏ trái di chuyển thế nào | Độ dài lớn nhất hiện tại |
| ------------------ | ------------------- | ------- | ------------------------------ | ------------------------ |
| `a` | `a` | Hợp lệ | Đứng yên | 1 |
| `b` | `ab` | Hợp lệ | Đứng yên | 2 |
| `b` | `abb` | Không hợp lệ | Loại bỏ `a` (vẫn chưa hợp lệ), sau đó loại bỏ tiếp `b` đầu tiên | 2 |
| `a` | `ba` | Hợp lệ | Đứng yên | 2 |

Các ca kiểm thử biên cần kiểm tra kỹ với kỹ thuật cửa sổ trượt:

| Dữ liệu vào | Trọng tâm kiểm tra |
| ----------- | ------------------ |
| Chuỗi rỗng hoặc mảng rỗng | Kiểm tra xem có trả về 0 ngay lập tức không |
| Toàn bộ ký tự giống hệt nhau | Biên trái có liên tục thu hẹp chính xác không |
| Không có ký tự nào bị trùng lặp | Kết quả có cập nhật được đến toàn bộ độ dài chuỗi không |
| Cửa sổ tối ưu nằm ở vị trí đầu tiên hoặc cuối cùng | Thời điểm cập nhật kết quả có bỏ sót trường hợp biên không |

Cách viết sai phổ biến:

```java
if (count.get(c) > 1) {
    left++; // Sai: chỉ dịch chuyển một lần chưa chắc đã khôi phục được cửa sổ hợp lệ
}
```

Khi thu hẹp cửa sổ khả biến, thông thường bắt buộc phải dùng vòng lặp `while` cho tới khi cửa sổ thỏa mãn lại điều kiện hợp lệ. Nếu chỉ dịch chuyển một bước bằng `if`, khi gặp các chuỗi như `abba` hay `aaabc` thuật toán sẽ lập tức cho ra kết quả sai.

## Các điểm sai lầm thường gặp

- Với bài toán hai con trỏ, luôn xác định rõ ý nghĩa của hai con trỏ trước khi code, không vừa viết vừa đoán mò.
- Trong cửa sổ trượt, thời điểm cập nhật đáp án phụ thuộc vào việc bài toán yêu cầu tìm cửa sổ dài nhất hay ngắn nhất.
- Khi thu hẹp cửa sổ, các biến trạng thái như bảng đếm, tổng, số điều kiện khớp đều phải được đồng bộ cập nhật đầy đủ.
- Với con trỏ nhanh chậm trên danh sách liên kết, luôn luôn kiểm tra `fast != null && fast.next != null`.
- Trong các bài như 3Sum, việc khử trùng lặp sau khi sắp xếp mảng phải được xử lý độc lập và triệt để.

## Bộ câu hỏi tự kiểm tra tần suất cao

- Tại sao các bài toán dùng hai con trỏ thường đạt độ phức tạp `O(n)` chứ không phải `O(n^2)` như hai vòng lặp lồng nhau?
- Tại sao bài toán 3Sum lại bắt buộc phải sắp xếp mảng trước? Quá trình khử trùng lặp diễn ra ở những vị trí cụ thể nào?
- Khi dùng con trỏ nhanh chậm tìm trung điểm danh sách liên kết, nếu danh sách có độ dài chẵn thì kết quả trả về trung điểm thứ nhất hay thứ hai?
- Trong cửa sổ trượt, khi nào dùng `if` để co hẹp và khi nào bắt buộc phải dùng `while`?
- Sự khác biệt về thời điểm cập nhật kết quả giữa bài toán tìm cửa sổ dài nhất và ngắn nhất là gì?

## Bài tập thực hành khuyến nghị

- [26. Remove Duplicates from Sorted Array (Xóa phần tử trùng lặp khỏi mảng đã sắp xếp)](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/)
- [15. 3Sum (Tổng ba số)](https://leetcode.cn/problems/3sum/)
- [141. Linked List Cycle (Phát hiện chu trình trong danh sách liên kết)](https://leetcode.cn/problems/linked-list-cycle/)
- [3. Longest Substring Without Repeating Characters (Chuỗi con không lặp dài nhất)](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)
- [76. Minimum Window Substring (Chuỗi con bao phủ nhỏ nhất)](https://leetcode.cn/problems/minimum-window-substring/)
