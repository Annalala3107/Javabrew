---
title: "Tổng hợp câu hỏi phỏng vấn Quy hoạch động (Dynamic Programming): Chuyển trạng thái, Ba lô, Dãy con và Mẫu Java"
description: "Tổng hợp câu hỏi phỏng vấn quy hoạch động (DP), giải thích định nghĩa trạng thái, công thức chuyển trạng thái, khởi tạo, thứ tự duyệt, bài toán ba lô 0-1 (0-1 Knapsack), ba lô không giới hạn (Unbounded Knapsack), dãy con, DP đoạn và bài tập LeetCode thường gặp."
category: Kiến thức cơ sở
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: Quy hoạch động,DP,chuyển trạng thái,bài toán ba lô,0-1 knapsack,unbounded knapsack,dãy con,interval DP,Java dynamic programming,LeetCode dynamic programming
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/dynamic-programming.md
---

Quy hoạch động (Dynamic Programming - DP) khó không phải vì code dài, mà vì một khi định nghĩa trạng thái bị sai thì toàn bộ phương trình chuyển trạng thái, bước khởi tạo và thứ tự duyệt vòng lặp phía sau đều sẽ sai theo.

Trong phỏng vấn, đừng vội vàng học vẹt các mẫu code có sẵn. Trước hết, hãy tự hỏi bản thân hai câu hỏi: Bài toán này có thể chia nhỏ thành các bài toán con hay không? Đáp án của trạng thái hiện tại có phụ thuộc vào các bài toán con đã được tính toán trước đó hay không? Nếu cả hai điều kiện này đều thỏa mãn, lúc đó mới nghĩ đến việc áp dụng DP.

## Trọng tâm đánh giá trong phỏng vấn

- Trình bày rõ ràng và chính xác ý nghĩa ngữ nghĩa của `dp[i]` hoặc `dp[i][j]`.
- Thiết lập và viết đúng phương trình chuyển trạng thái (state transition equation).
- Xử lý chính xác giá trị khởi tạo (base cases) và thứ tự duyệt vòng lặp.
- Nhận biết bài toán có thể tối ưu không gian bộ nhớ (nén mảng) hay không.
- Phân biệt thành thạo các dạng bài DP kinh điển: Ba lô (Knapsack), Dãy con (Subsequence), Khoảng/Đoạn (Interval DP), Đường đi trên lưới (Grid Paths).

## Khi nào nên nghĩ đến Quy hoạch động?

DP không phải là cứ thấy đề bài hỏi "giá trị lớn nhất/nhỏ nhất" là áp dụng bừa. Dấu hiệu nhận biết đáng tin cậy hơn dựa trên hai đặc tính:

1. **Cấu trúc con tối ưu (Optimal Substructure):** Bài toán có thể chia thành các bài toán con cùng loại có quy mô nhỏ hơn.
2. **Các bài toán con gối nhau (Overlapping Subproblems):** Các bài toán con bị lặp lại và tính toán nhiều lần trong quá trình đệ quy.

Lấy dãy Fibonacci làm ví dụ cơ bản: `f(n)` phụ thuộc vào `f(n - 1)` và `f(n - 2)`, trong khi `f(n - 2)` sẽ bị tính đi tính lại nhiều lần trong cây đệ quy. Việc lưu trữ lại các kết quả trung gian này chính là bản chất của DP.

Trong phỏng vấn, bạn nên bắt đầu trình bày từ phương pháp đệ quy vét cạn (brute-force recursion), chỉ ra vị trí nào xảy ra tính toán lặp lại, rồi mới nâng cấp thành đệ quy có nhớ (Memoization) hoặc quy hoạch động điền bảng (Tabulation). Quá trình tư duy từng bước này sẽ thuyết phục người phỏng vấn rằng bạn thực sự hiểu sâu bản chất vấn đề thay vì chỉ học vẹt mảng `dp`.

## Phương pháp 5 bước giải bài toán DP

1. **Định nghĩa trạng thái:** `dp[i]` rốt cuộc mang ý nghĩa gì?
2. **Thiết lập công thức chuyển trạng thái:** Trạng thái hiện tại được suy ra từ những trạng thái nào trước đó?
3. **Khởi tạo trạng thái cơ sở (Base cases):** Khi chưa có trạng thái trước đó thì đáp án ban đầu là gì?
4. **Xác định thứ tự duyệt:** Trạng thái nào cần tính toán trước, trạng thái nào tính sau?
5. **Kiểm tra ca mẫu (Dry run):** Dùng một bộ dữ liệu đầu vào nhỏ để chạy thử từng bước trên mảng bằng tay.

Trong đó, bước 1 là quan trọng nhất. Nếu ý nghĩa của `dp[i]` còn mơ hồ thì phần code phía sau sẽ hoàn toàn biến thành việc thử - sai đầy may rủi.

Một định nghĩa trạng thái tốt thường thỏa mãn:

- Bao hàm hoặc trực tiếp suy ra đáp án mà đề bài yêu cầu.
- Có thể suy ra một cách tự nhiên từ các trạng thái nhỏ hơn.
- Số chiều càng ít càng tốt, nhưng không vì cố nén không gian mà làm tối nghĩa định nghĩa trạng thái.

## Ví dụ DP 1 chiều: Bài toán Leo cầu thang

Bài toán leo cầu thang (Climbing Stairs):

```java
int climbStairs(int n) {
    if (n <= 2) {
        return n;
    }
    int prev2 = 1;
    int prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int cur = prev1 + prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

Ý nghĩa trạng thái: Số cách bước để đi lên đến bậc thứ `i`. Phương trình chuyển trạng thái: `dp[i] = dp[i - 1] + dp[i - 2]`.

Ý nghĩa này cũng có thể suy luận trực quan:

```text
Để bước lên bậc thứ i ở bước cuối cùng, ta chỉ có thể đi 1 bước từ bậc i - 1, hoặc đi 2 bước từ bậc i - 2.
```

Vì vậy `dp[i]` chỉ phụ thuộc vào hai trạng thái liền trước, ta hoàn toàn có thể nén mảng thành hai biến đơn. Tiền đề của việc tối ưu không gian là bạn chắc chắn các trạng thái cũ hơn sẽ không bao giờ được dùng lại nữa.

## Mẫu bài toán Ba lô 0-1 (0-1 Knapsack Template)

Mỗi đồ vật chỉ được chọn tối đa một lần:

```java
int knapsack01(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int j = capacity; j >= weights[i]; j--) {
            dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

Vòng lặp dung lượng ba lô bắt buộc phải **duyệt ngược**, nhằm tránh việc cùng một món đồ bị chọn lặp lại nhiều lần trong cùng một lượt duyệt đồ vật.

Thứ tự duyệt ngược là điểm thường xuyên bị các interviewer đào sâu trong bài toán ba lô 0-1. Nếu duyệt dung lượng theo thứ tự xuôi, khi tính toán `dp[j]` ta có thể vô tình sử dụng giá trị `dp[j - weight]` vừa mới được cập nhật ở chính lượt này, tương đương với việc món đồ hiện tại đã bị chọn nhiều lần — điều này sẽ biến bài toán thành ba lô không giới hạn (Unbounded Knapsack).

Cách ra đề của bài toán ba lô 0-1 không nhất thiết lúc nào cũng nhắc đến từ "ba lô". Ví dụ bài toán "Có thể chia một mảng thành hai tập con có tổng bằng nhau không?", thực chất được chuyển đổi thành: Liệu có thể chọn một số phần tử trong mảng sao cho tổng giá trị của chúng bằng đúng một nửa tổng mảng hay không?

## Mẫu bài toán Ba lô không giới hạn (Unbounded Knapsack Template)

Mỗi đồ vật có thể chọn số lần không giới hạn:

```java
int unboundedKnapsack(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int j = weights[i]; j <= capacity; j++) {
            dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

Vòng lặp dung lượng ba lô duyệt theo **thứ tự xuôi**, cho phép đồ vật hiện tại được tái sử dụng nhiều lần.

Trong ba lô hoàn toàn (unbounded knapsack), việc duyệt xuôi dung lượng chính là để cho phép đồ vật hiện tại được lặp lại. Chẳng hạn như bài toán đổi tiền xu (Coin Change), mỗi mệnh giá tiền xu đều có số lượng vô hạn; khi tính toán cho số tiền lớn hơn, ta có thể chuyển trạng thái dựa trên các trạng thái mà đồng xu hiện tại đã tham gia tính toán trước đó.

Nếu bài toán hỏi về "Số cách tổ hợp" hay "Số cách hoán vị", thứ tự vòng lặp cũng sẽ thay đổi:

- **Số cách tổ hợp (Combinations):** Thường duyệt đồ vật trước, sau đó duyệt dung lượng.
- **Số cách hoán vị (Permutations):** Thường duyệt dung lượng trước, sau đó duyệt đồ vật.

Điểm này có thể không phải lúc nào phỏng vấn cũng hỏi tới, nhưng lại mang tính quyết định khi gặp các bài như Coin Change II (Đổi tiền xu 2).

## Các dạng bài DP thường gặp

| Dạng bài | Thiết kế trạng thái | Bài toán tiêu biểu (LeetCode) |
| --- | --- | --- |
| Leo cầu thang / Trộm nhà | `dp[i]` thể hiện giá trị tối ưu của `i` vị trí đầu tiên | 70, 198 |
| Ba lô (Knapsack) | `dp[j]` thể hiện giá trị tối ưu hoặc số phương án khi dung lượng là `j` | 416, 518, 322 |
| Dãy con (Subsequence) | `dp[i]` hoặc `dp[i][j]` thể hiện kết quả kết thúc tại vị trí nào đó hoặc của hai tiền tố | 300, 1143 |
| Chuỗi đối xứng (Palindrome) | `dp[i][j]` thể hiện đoạn `[i, j]` có thỏa mãn đối xứng hoặc giá trị tối ưu hay không | 647, 516 |
| Đường đi trên lưới (Grid Paths) | `dp[i][j]` thể hiện đáp án khi đi tới ô `(i, j)` | 62, 64 |

## Lựa chọn giữa Đệ quy có nhớ (Memoization) và Điền bảng (Tabulation)

Cả hai cách đều lưu lại kết quả của các bài toán con để tránh tính toán lại.

| Cách viết | Đặc điểm | Tình huống phù hợp |
| --- | --- | --- |
| Đệ quy có nhớ (Memoization) | Đi từ trạng thái mục tiêu gọi đệ quy xuống, chỉ tính khi cần | Chuyển trạng thái phức tạp, tư duy đệ quy tự nhiên hơn |
| Điền bảng (Tabulation) | Điền bảng từ các trạng thái cơ sở nhỏ dần lên các trạng thái lớn | Thứ tự duyệt rõ ràng, thuận tiện tối ưu không gian bộ nhớ |

Nếu ban đầu chưa hình dung rõ thứ tự duyệt vòng lặp, bạn có thể viết đệ quy có nhớ trước. Khi mối quan hệ chuyển trạng thái đã hoàn toàn thông suốt, việc chuyển đổi sang điền bảng sẽ rất dễ dàng. Rất nhiều bài toán DP trên cây (Tree DP) hoặc DP trên đoạn (Interval DP) viết bằng đệ quy có nhớ sẽ ít bị nhầm lẫn hơn.

## Các bước trình bày khi viết code DP trong phỏng vấn

Với bài toán DP, bạn không nên lập tức cắm cúi viết code ngay. Trước khi viết, hãy trình bày rõ 4 luận điểm sau cho người phỏng vấn:

1. Ý nghĩa của mảng `dp` là gì, và kết quả cuối cùng sẽ nằm ở chỉ số nào.
2. Trạng thái hiện tại phụ thuộc vào những trạng thái cũ nào, và tại sao những trạng thái cũ đó chắc chắn đã được tính toán xong từ trước.
3. Vì sao lại khởi tạo như vậy, đặc biệt là giá trị `0`, `1`, hay dương vô cùng mang ý nghĩa gì.
4. Vì sao thứ tự duyệt đã chọn không làm dùng sớm trạng thái chưa tính hoặc làm dùng lặp lại trạng thái không được phép.

Nếu không giải thích rõ được 4 điều trên, đoạn code viết ra rất có thể chỉ là học thuộc lòng, và khi người phỏng vấn đưa ra biến thể đề bài bạn sẽ rất dễ bị bối rối.

## Phân tích bài toán tiêu biểu: Đổi tiền xu (Coin Change)

[322. Coin Change (Đổi tiền xu)](https://leetcode.cn/problems/coin-change/) là bài toán ba lô không giới hạn kinh điển cực kỳ hay gặp trong phỏng vấn. Đề bài cho danh sách mệnh giá các đồng xu và số tiền mục tiêu, yêu cầu tìm số lượng đồng xu ít nhất để đổi được số tiền đó, biết mỗi mệnh giá có thể dùng không giới hạn số lần.

Định nghĩa trạng thái:

```text
dp[j] biểu thị số lượng đồng xu ít nhất cần dùng để đổi được số tiền j.
```

Khởi tạo là mấu chốt của bài toán này. `dp[0] = 0`, biểu thị đổi số tiền 0 thì cần 0 đồng xu; các số tiền khác ban đầu được gán một giá trị lớn bất khả thi (như `amount + 1`), biểu thị trạng thái tạm thời chưa thể đạt tới.

Lưu ý: hàm `Arrays.fill` cần import `java.util.Arrays`.

```java
int coinChange(int[] coins, int amount) {
    int max = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, max);
    dp[0] = 0;

    for (int coin : coins) {
        for (int j = coin; j <= amount; j++) {
            dp[j] = Math.min(dp[j], dp[j - coin] + 1);
        }
    }

    return dp[amount] == max ? -1 : dp[amount];
}
```

Tại sao duyệt dung lượng theo thứ tự xuôi? Bởi vì mỗi đồng xu có thể dùng nhiều lần. Khi tính `dp[j]`, ta dùng `dp[j - coin]`. Nếu `dp[j - coin]` đã được cập nhật bởi chính đồng xu này trong lượt hiện tại, điều đó có nghĩa đồng xu này có thể tiếp tục được chọn thêm lần nữa, hoàn toàn khớp với bài toán ba lô không giới hạn.

Nếu đề bài đổi thành "mỗi mệnh giá chỉ được dùng 1 lần", dung lượng bắt buộc phải duyệt ngược. Hướng duyệt vòng lặp không phải vấn đề định dạng code, mà là công cụ trực tiếp kiểm soát xem một đồ vật có được tham gia chuyển trạng thái lặp lại hay không.

## So sánh các định nghĩa trạng thái dễ gây nhầm lẫn

Khó khăn khi làm bài DP thường không phải do không biết viết công thức chuyển, mà do chọn sai ý nghĩa của trạng thái. Các cặp trạng thái dưới đây nhìn qua tưởng như giống nhau, nhưng cách triển khai lại khác biệt hoàn toàn:

| Dạng bài | Ý nghĩa trạng thái | Trọng tâm chuyển trạng thái thường gặp |
| --- | --- | --- |
| Dãy con tăng dài nhất (LIS) | `dp[i]` biểu thị độ dài LIS **kết thúc tại** `nums[i]` | Bắt buộc phải chọn `nums[i]`, tìm phần tử nhỏ hơn ở phía trước |
| Trộm nhà (House Robber) | `dp[i]` biểu thị số tiền lớn nhất trộm được trong **`i` ngôi nhà đầu tiên** | Ngôi nhà thứ `i` chọn trộm hay không trộm |
| Dãy con chung dài nhất (LCS) | `dp[i][j]` biểu thị độ dài LCS của hai tiền tố | So sánh ký tự cuối cùng của hai tiền tố |
| Chuỗi con đối xứng | `dp[i][j]` biểu thị đoạn `[i, j]` có đối xứng hay không | Phụ thuộc vào tính đối xứng của đoạn con bên trong `[i + 1, j - 1]` |

Trong phỏng vấn, bạn nên chủ động nói rõ một câu: *"Ở đây `dp[i]` biểu thị dãy con kết thúc tại i, chứ không phải giá trị tối ưu trong i phần tử đầu tiên."* Câu nói này sẽ giúp bạn tránh được rất nhiều sai sót khi giải các bài toán về dãy con.

## Minh họa quy trình và các ca kiểm thử biên (Boundary Cases)

Lấy bài toán Leo cầu thang làm ví dụ, sự biến thiên trạng thái khi `n = 5` như sau:

| `i` | `dp[i - 2]` | `dp[i - 1]` | `dp[i]` |
| --- | --- | --- | --- |
| 3 | 1 | 2 | 3 |
| 4 | 2 | 3 | 5 |
| 5 | 3 | 5 | 8 |

Bảng này không chỉ nhằm theo dõi con số, mà cho thấy trạng thái chỉ phụ thuộc vào đúng hai vị trí liền trước, do đó ta hoàn toàn có thể nén bộ nhớ thành hai biến.

Các trường hợp biên cần kiểm tra khi làm bài toán DP:

| Dữ liệu đầu vào | Trọng tâm kiểm tra |
| --- | --- |
| `n = 0` hoặc mảng rỗng | Khởi tạo đã xử lý trường hợp này chưa |
| Mảng chỉ có 1 phần tử | Có bị lỗi truy cập mảng vượt biên như `dp[1]` không |
| Không thể tạo thành mục tiêu | Giá trị khởi tạo có thể hiện chính xác trạng thái "không thể đạt tới" không |
| Tính số phương án | Khởi tạo và thứ tự duyệt đã tránh đếm trùng chưa |

Cách viết sai thường gặp:

```java
for (int j = weights[i]; j <= capacity; j++) {
    dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]); // Sai đối với bài toán ba lô 0-1
}
```

Trong ba lô 0-1, dung lượng bắt buộc phải duyệt ngược. Nếu duyệt xuôi, trạng thái vừa được cập nhật ở lượt này sẽ bị dùng lại ngay sau đó, tương đương một món đồ bị chọn nhiều lần.

## Các lỗi thường gặp (Common Pitfalls)

- Giữ nguyên ý nghĩa của `dp` trong suốt quá trình suy luận, không thay đổi ngữ nghĩa giữa chừng.
- Khởi tạo mảng không phải lúc nào cũng điền 0, mà phải dựa đúng vào ý nghĩa trạng thái.
- Ba lô 0-1 duyệt dung lượng ngược, ba lô không giới hạn duyệt dung lượng xuôi.
- Khởi tạo khi tìm số phương án hoàn toàn khác với khi tìm giá trị tối ưu cực trị.
- Bài toán dãy con thường xuyên cần phân biệt rạch ròi giữa "kết thúc tại vị trí `i`" và "trong phạm vi `i` phần tử đầu tiên".

## Câu hỏi tự kiểm tra thường gặp trong phỏng vấn

- Vì sao bước đầu tiên của DP bắt buộc phải là định nghĩa trạng thái?
- Sự khác nhau giữa đệ quy có nhớ và điền bảng là gì? Khi nào nên viết đệ quy có nhớ trước?
- Vì sao trong ba lô 0-1 dung lượng phải duyệt ngược?
- Vì sao trong ba lô không giới hạn dung lượng lại có thể duyệt xuôi?
- Khi `dp[i]` mang ý nghĩa "kết thúc tại `i`" so với "trong `i` phần tử đầu tiên", công thức chuyển trạng thái khác nhau thế nào?
- Khi tìm số bước ít nhất, giá trị lớn nhất hay số cách tổ hợp, việc khởi tạo cần lưu ý điều gì?

## Bài tập rèn luyện đề xuất

- [70. Climbing Stairs (Leo cầu thang)](https://leetcode.cn/problems/climbing-stairs/)
- [198. House Robber (Trộm nhà)](https://leetcode.cn/problems/house-robber/)
- [322. Coin Change (Đổi tiền xu)](https://leetcode.cn/problems/coin-change/)
- [416. Partition Equal Subset Sum (Phân chia tập con tổng bằng nhau)](https://leetcode.cn/problems/partition-equal-subset-sum/)
- [300. Longest Increasing Subsequence (Dãy con tăng dài nhất - LIS)](https://leetcode.cn/problems/longest-increasing-subsequence/)
- [1143. Longest Common Subsequence (Dãy con chung dài nhất - LCS)](https://leetcode.cn/problems/longest-common-subsequence/)
