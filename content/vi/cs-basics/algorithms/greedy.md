---
title: "Tổng hợp câu hỏi phỏng vấn thuật toán Tham lam (Greedy): Khoảng, Trò chơi nhảy và Phương pháp chứng minh"
description: "Tổng hợp câu hỏi phỏng vấn thuật toán tham lam (Greedy), nhận diện dạng bài, tham lam trên sắp xếp, bài toán xử lý khoảng (Intervals), Jump Game, phương pháp chứng minh tính đúng đắn và bài tập LeetCode thường gặp."
category: Kiến thức cơ sở
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: Thuật toán tham lam,Greedy template,Interval greedy,Sorting greedy,Jump game,Chứng minh tham lam,LeetCode greedy,Câu hỏi phỏng vấn thuật toán
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/greedy.md
---

Mã nguồn của thuật toán tham lam (Greedy) thường rất ngắn gọn; khó khăn thực sự nằm ở việc giải thích tại sao lựa chọn tối ưu cục bộ ở bước hiện tại không làm ảnh hưởng đến tính tối ưu toàn cục. Trong phỏng vấn, nếu bạn chỉ viết code mà không giải thích được chiến lược tham lam của mình, bạn sẽ rất dễ bị interviewer hỏi dồn đến mức bối rối.

Một quy tắc phán đoán trực quan: nếu một bài toán có thể sắp xếp hoặc duy trì một ranh giới tối ưu hiện tại, giúp ta đưa ra lựa chọn tối ưu cục bộ ở mỗi bước mà lựa chọn đó không phá vỡ nghiệm tối ưu ở các bước sau, thì bạn hoàn toàn có thể thử nghiệm hướng tiếp cận tham lam.

## Trọng tâm đánh giá trong phỏng vấn

- Tìm ra chiến lược tham lam (Greedy Choice Property) chính xác.
- Sử dụng phương pháp hoán đổi (exchange argument), phản chứng hoặc phân tích ranh giới trực quan để chứng minh tính hợp lý của chiến lược.
- Xử lý chính xác các điều kiện duyệt sau khi đã sắp xếp mảng.
- Phân biệt rạch ròi giữa thuật toán tham lam và Quy hoạch động (Dynamic Programming).

## Tư duy giải bài toán tham lam như thế nào?

Điều tối kỵ nhất trong bài toán tham lam là "chọn theo cảm tính". Trước khi bắt tay vào viết code, bạn cần giải thích rõ ràng ít nhất 2 điều:

1. **Ở mỗi bước, ta đang "tham lam" điều gì?** Ví dụ: chọn thời điểm kết thúc sớm nhất, vị trí có thể nhảy tới xa nhất, hoặc gom góp mọi mức lợi nhuận dương.
2. **Tại sao lựa chọn này lại không làm cho các bước phía sau bị tệ đi?**

Phép chứng minh không nhất thiết phải quá hàn lâm mang tính toán học thuần túy, nhưng phải làm rõ được sự đánh đổi. Ví dụ trong bài toán sắp xếp khoảng thời gian (Interval Scheduling), ta chọn khoảng có thời điểm kết thúc sớm nhất vì nó để lại không gian thời gian khả dụng lớn nhất cho các khoảng phía sau; chọn một khoảng kết thúc muộn hơn không bao giờ giúp ta có nhiều khoảng không chồng lấn hơn.

## Các dạng bài thường gặp

| Dạng bài | Chiến lược tham lam | Bài toán tiêu biểu (LeetCode) |
| --- | --- | --- |
| Phân phối tài nguyên | Ưu tiên đáp ứng đối tượng dễ thỏa mãn nhất trước | Phân phát bánh quy (Assign Cookies) |
| Mua bán cổ phiếu | Cộng dồn tất cả các khoản chênh lệch lợi nhuận dương | Thời điểm tốt nhất để mua và bán cổ phiếu II |
| Bài toán bước nhảy | Liên tục duy trì vị trí xa nhất có thể chạm tới | Trò chơi nhảy (Jump Game) |
| Xử lý khoảng (Intervals) | Sắp xếp theo điểm mút bên phải (hoặc bên trái) | Các khoảng không chồng lấn, Dùng ít tên nhất bắn bóng bay |
| Tái cấu trúc chuỗi | Duy trì số lần xuất hiện còn lại hoặc vị trí phủ xa nhất | Phân đoạn ký tự (Partition Labels) |

Thuật toán tham lam thường đi liền với sắp xếp, bởi vì sắp xếp giúp biến "lựa chọn tối ưu cục bộ hiện tại" trở nên rõ ràng và tường minh. Các bài toán khoảng thường sắp xếp theo đầu mút trái hoặc phải, còn các bài toán phân phối thường sắp xếp cả mảng nhu cầu lẫn tài nguyên rồi dùng kỹ thuật hai con trỏ (two pointers) để ghép cặp.

## Mẫu bài toán Trò chơi nhảy (Jump Game)

```java
boolean canJump(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) {
            return false;
        }
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}
```

Biến `farthest` thể hiện vị trí xa nhất có thể đi tới tính đến thời điểm hiện tại. Khi duyệt tới vị trí `i`, nếu `i > farthest`, điều đó chứng tỏ vị trí hiện tại vốn dĩ không thể nào chạm tới được, trả về `false` ngay lập tức.

Điểm tham lam cốt lõi của bài này là: ta không cần quan tâm cụ thể đã nhảy từ vị trí nào để tới được `i`, mà chỉ quan tâm đến phạm vi xa nhất có thể bao phủ được. Miễn là vị trí `i` nằm trong phạm vi đã bao phủ, ta có thể dùng chính nó để tiếp tục mở rộng phạm vi ra xa hơn.

Bài toán "Jump Game II" (Trò chơi nhảy II) yêu cầu tìm số bước nhảy ít nhất. Thuật toán sẽ duy trì hai ranh giới:

- `curEnd`: Vị trí xa nhất có thể chạm tới với số bước nhảy hiện tại.
- `farthest`: Vị trí xa nhất có thể đạt được nếu nhảy thêm một bước nữa từ bất kỳ điểm nào trong phạm vi `curEnd`.

Khi con trỏ duyệt chạm tới `curEnd`, điều đó đồng nghĩa với việc phạm vi của số bước nhảy hiện tại đã dùng hết, bắt buộc phải nhảy thêm 1 bước và cập nhật `curEnd = farthest`.

## Mẫu bài toán Tham lam trên khoảng (Interval Greedy)

Lấy bài toán Các khoảng không chồng lấn (Non-overlapping Intervals) làm ví dụ, ta sắp xếp các khoảng theo chiều tăng dần của điểm mút bên phải, mỗi lần luôn giữ lại khoảng kết thúc sớm nhất:

```java
int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) {
        return 0;
    }
    Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));
    int count = 1;
    int end = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) {
            count++;
            end = intervals[i][1];
        }
    }
    return intervals.length - count;
}
```

Kết thúc càng sớm thì không gian để lại cho các khoảng phía sau càng lớn, đây chính là tư duy tham lam cốt lõi của dạng bài này.

Điểm dễ sai sót nhất của bài toán khoảng nằm ở việc chọn trường để sắp xếp. Một số quy tắc chuẩn:

- Muốn chọn được nhiều khoảng không chồng lấn nhất: Sắp xếp theo đầu mút phải tăng dần.
- Muốn hợp nhất các khoảng chồng lấn: Sắp xếp theo đầu mút trái tăng dần.
- Dùng ít mũi tên nhất để bắn nổ bóng bay: Sắp xếp theo đầu mút phải tăng dần, cố gắng dùng mũi tên hiện tại bắn xuyên nhiều bóng nhất có thể.

Nếu một chiến lược tham lam khó giải thích, hãy thử tìm phản ví dụ bằng các trường hợp nhỏ. Ví dụ chiến lược "mỗi lần chọn khoảng có độ dài ngắn nhất" nghe có vẻ hợp lý, nhưng thực tế không hề đảm bảo chọn ra được nhiều khoảng không chồng lấn nhất.

## Phân tích bài toán tiêu biểu: Dùng ít tên nhất bắn bóng bay

[452. Minimum Number of Arrows to Burst Balloons (Số lượng mũi tên tối thiểu để bắn nổ bóng bay)](https://leetcode.cn/problems/minimum-number-of-arrows-to-burst-balloons/) là bài toán tham lam trên khoảng kinh điển. Đề bài cho một tập hợp các khoảng bóng bay `[start, end]`. Khi bắn một mũi tên tại tọa độ `x`, tất cả các bóng bay thỏa mãn `start <= x <= end` sẽ bị bắn nổ cùng lúc. Yêu cầu tìm số lượng mũi tên ít nhất để bắn nổ toàn bộ bóng bay.

Ý tưởng tham lam: **Mỗi lần bắn, luôn bắn mũi tên tại ranh giới ngoài cùng bên phải của khoảng đang xét**. Trước tiên, sắp xếp các khoảng theo đầu mút phải tăng dần. Mũi tên đầu tiên được đặt tại điểm mút phải của quả bóng bay đầu tiên. Với các quả bóng tiếp theo, nếu mút trái `<= arrow`, mũi tên hiện tại vẫn có thể bắn trúng nó; nếu mút trái `> arrow`, mũi tên hiện tại không thể với tới được nữa, bắt buộc phải bắn thêm một mũi tên mới và đặt tại điểm mút phải của quả bóng này.

Cần lưu ý hai trường hợp biên trong code: mảng rỗng thì trả về `0`; bộ so sánh sắp xếp không nên viết dạng trừ `a[1] - b[1]` vì có thể gây tràn số nguyên (integer overflow) với tọa độ cực đại/cực tiểu.

```java
int findMinArrowShots(int[][] points) {
    if (points.length == 0) {
        return 0;
    }
    Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
    int arrows = 1;
    int arrow = points[0][1];
    for (int i = 1; i < points.length; i++) {
        if (points[i][0] > arrow) {
            arrows++;
            arrow = points[i][1];
        }
    }
    return arrows;
}
```

Giả sử dữ liệu mẫu là `[[10,16],[2,8],[1,6],[7,12]]`, sau khi sắp xếp theo mút phải ta được: `[1,6]`, `[2,8]`, `[7,12]`, `[10,16]`. Mũi tên đầu tiên đặt tại `6`, bắn xuyên được 2 khoảng đầu tiên. Khi duyệt tới `[7,12]`, mút trái đã lớn hơn `6`, bắt buộc phải tăng thêm một mũi tên mới đặt tại `12`, và mũi tên này cũng sẽ bắn nổ luôn `[10,16]`. Kết quả cuối cùng là `2`.

## Phân biệt giữa thuật toán Tham lam và Quy hoạch động

| Tiêu chí | Tham lam (Greedy) | Quy hoạch động (DP) |
| --- | --- | --- |
| Cơ chế ra quyết định | Ra quyết định dứt khoát ngay tại bước hiện tại | Đánh giá và tổng hợp từ nhiều trạng thái bài toán con trước đó |
| Xem lại lịch sử | Thường không xem lại quá khứ | Bắt buộc phải chuyển trạng thái từ các kết quả trước |
| Trọng tâm chứng minh | Lựa chọn cục bộ hiện tại không phá vỡ tính tối ưu toàn cục | Cấu trúc con tối ưu và các bài toán con gối nhau |
| Dạng bài thường gặp | Xử lý khoảng, Bước nhảy, Phân phối tài nguyên | Ba lô, Dãy con, Đường đi trên lưới |

Nếu một lựa chọn ở bước hiện tại trông có vẻ hợp lý nhưng khi đưa ra phản ví dụ nhỏ lại bị sai, bài toán đó nhiều khả năng phải giải bằng DP hoặc tìm kiếm vét cạn.

## Các lỗi thường gặp (Common Pitfalls)

- Thuật toán tham lam thường cần sắp xếp mảng trước; sắp xếp nhầm tiêu chí sẽ dẫn tới kết quả sai hoàn toàn.
- Với bài toán khoảng, cần chú ý xem hai khoảng chạm nhau tại điểm mút có tính là chồng lấn hay không (ví dụ `[1,2]` và `[2,3]`).
- Trong Jump Game II, thời điểm tăng biến đếm số bước nhảy gắn liền chặt chẽ với ranh giới bao phủ hiện tại (`curEnd`).
- Chiến lược tham lam phải giải thích được bản chất bằng lý lẽ, không nên chỉ nói chung chung là "mỗi lần đều chọn phương án tốt nhất".

## Câu hỏi tự kiểm tra thường gặp trong phỏng vấn

- Làm thế nào để phân biệt bài toán nên dùng Tham lam hay Quy hoạch động?
- Vì sao các bài toán khoảng thường sắp xếp theo điểm mút bên phải?
- Trong bài toán Trò chơi nhảy (Jump Game), vì sao chỉ cần duy trì vị trí xa nhất có thể tới là đủ?
- Trong bài toán tham lam, làm thế nào để dùng phương pháp hoán đổi hoặc phản chứng để chứng minh tính đúng đắn?
- Khi ranh giới của các khoảng được phép trùng nhau, điều kiện so sánh trong code nên viết thế nào?

## Bài tập rèn luyện đề xuất

- [455. Assign Cookies (Phân phát bánh quy)](https://leetcode.cn/problems/assign-cookies/)
- [122. Best Time to Buy and Sell Stock II (Thời điểm tốt nhất để mua và bán cổ phiếu II)](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-ii/)
- [55. Jump Game (Trò chơi nhảy)](https://leetcode.cn/problems/jump-game/)
- [45. Jump Game II (Trò chơi nhảy II)](https://leetcode.cn/problems/jump-game-ii/)
- [435. Non-overlapping Intervals (Các khoảng không chồng lấn)](https://leetcode.cn/problems/non-overlapping-intervals/)
- [763. Partition Labels (Phân đoạn ký tự)](https://leetcode.cn/problems/partition-labels/)
