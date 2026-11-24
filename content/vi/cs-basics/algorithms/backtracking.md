---
title: "Tổng hợp câu hỏi phỏng vấn thuật toán Quay lui (Backtracking): Tổ hợp, Hoán vị, Tập con, Cắt tỉa nhánh và Mẫu Java"
description: "Tổng hợp câu hỏi phỏng vấn thuật toán quay lui (Backtracking), nhận diện dạng bài, code mẫu cho tổ hợp (Combinations), hoán vị (Permutations), tập con (Subsets), kỹ thuật khử trùng lặp và cắt tỉa nhánh (Pruning), phân tích độ phức tạp và bài tập LeetCode thường gặp."
category: Kiến thức cơ sở
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: Thuật toán quay lui,Backtracking template,Tổ hợp,Hoán vị,Tập con,N-Queens,Cắt tỉa nhánh,Java backtracking,LeetCode backtracking,Câu hỏi phỏng vấn thuật toán
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/backtracking.md
---

Đặc điểm của các bài toán quay lui (Backtracking) rất rõ ràng: đề bài thường yêu cầu bạn tìm tất cả các phương án khả dĩ, tất cả các đường đi, tất cả các tổ hợp, hoặc thử nghiệm qua một tập hợp các lựa chọn. Bản chất của quay lui rất giống với DFS, nhưng điểm khác biệt nằm ở chỗ quay lui nhấn mạnh vào chu trình: **"Lựa chọn -> Đệ quy -> Thu hồi lựa chọn (Backtrack)"**.

Khi giải bài toán quay lui trong phỏng vấn, điều quan trọng nhất là phải định nghĩa rõ ràng ý nghĩa ngữ nghĩa của hàm đệ quy. Một khi ý nghĩa của hàm đã vững, các tham số truyền vào, điều kiện dừng và bước thu hồi lựa chọn sẽ rất mạch lạc, khó bị nhầm lẫn.

## Trọng tâm đánh giá trong phỏng vấn

- Viết thành thạo 3 mẫu kinh điển: Tổ hợp (Combinations), Hoán vị (Permutations), và Tập con (Subsets).
- Giải thích được cặn kẽ vai trò của `path`, `startIndex` và mảng `used`.
- Nhận biết chính xác bài toán có cần khử trùng lặp (deduplication) hay không.
- Thực hiện cắt tỉa nhánh (pruning) đơn giản nhằm loại bỏ các nhánh tìm kiếm vô ích.
- Nắm rõ độ phức tạp tính toán phụ thuộc trực tiếp vào quy mô của tập kết quả.

## Tư duy giải bài toán quay lui như thế nào?

Bài toán quay lui có thể được hình dung như một "cây quyết định" (decision tree). Mỗi tầng trên cây đại diện cho một lần đưa ra lựa chọn, nút gốc đại diện cho trạng thái ban đầu chưa chọn gì, và mỗi nút lá đại diện cho một phương án hoàn chỉnh.

Trước khi bắt tay vào viết code, hãy trả lời 4 câu hỏi cốt lõi:

1. **Đường đi (`path`) là gì?** Thường là danh sách các phần tử đã được chọn tính đến thời điểm hiện tại, trong code thường đặt tên là `path`.
2. **Danh sách lựa chọn là gì?** Tại thời điểm hiện tại ta còn có thể chọn những phần tử nào?
3. **Điều kiện kết thúc là gì?** Khi nào thì hoàn thành một phương án để đưa `path` vào tập kết quả `ans`?
4. **Có cần cắt tỉa nhánh (`pruning`) không?** Những lựa chọn nào chắc chắn không thể tạo ra kết quả hợp lệ để dừng sớm?

Thao tác "thu hồi lựa chọn" (undo choice) trong mẫu quay lui hoàn toàn không phải là hình thức. Vì đối tượng `path` được tái sử dụng qua nhiều nhánh đệ quy, sau khi nhánh hiện tại thử nghiệm xong bắt buộc phải khôi phục lại trạng thái ban đầu để nhánh tiếp theo có thể sử dụng.

## Mẫu bài toán Tổ hợp (Combinations)

Tổ hợp không quan tâm đến thứ tự của các phần tử, thông thường chúng ta dùng biến `startIndex` (hoặc `start`) để kiểm soát tầng tiếp theo sẽ bắt đầu chọn từ vị trí nào:

```java
List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> ans = new ArrayList<>();
    backtrack(1, n, k, new ArrayList<>(), ans);
    return ans;
}

void backtrack(int start, int n, int k, List<Integer> path, List<List<Integer>> ans) {
    if (path.size() == k) {
        ans.add(new ArrayList<>(path));
        return;
    }
    for (int i = start; i <= n; i++) {
        path.add(i);
        backtrack(i + 1, n, k, path, ans);
        path.remove(path.size() - 1);
    }
}
```

Do bài toán tổ hợp không phân biệt thứ tự, nên `[1, 2]` và `[2, 1]` là cùng một kết quả. Vai trò của `start` là đảm bảo các bước sau chỉ được phép chọn các số đứng sau vị trí hiện tại, tránh trùng lặp.

Nếu cần chọn `k` số trong khoảng `1..n`, ta có thể tối ưu bằng cách cắt tỉa nhánh:

```java
for (int i = start; i <= n - (k - path.size()) + 1; i++) {
    // ...
}
```

Ý nghĩa là: nếu tính từ vị trí `i`, số lượng phần tử còn lại không đủ để gom thành nhóm có độ dài `k`, thì không cần tiếp tục duyệt vòng lặp nữa.

## Mẫu bài toán Hoán vị (Permutations)

Hoán vị có phân biệt thứ tự, thông thường chúng ta sử dụng mảng boolean `used` để đánh dấu phần tử nào đã được chọn:

```java
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> ans = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(nums, used, new ArrayList<>(), ans);
    return ans;
}

void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> ans) {
    if (path.size() == nums.length) {
        ans.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) {
            continue;
        }
        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, used, path, ans);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

Do hoán vị quan tâm đến thứ tự, mỗi tầng đệ quy đều có thể duyệt qua toàn bộ các số trong mảng, chỉ cần không chọn lại số đã có trong `path`. Giá trị `used[i]` thể hiện liệu `nums[i]` đã có mặt trong đường đi hiện tại hay chưa.

Nếu mảng đầu vào chứa các phần tử trùng lặp, việc khử trùng lặp trong hoán vị dễ viết sai hơn so với tổ hợp. Cách làm chuẩn là sắp xếp mảng trước, sau đó ở cùng một tầng đệ quy bỏ qua trường hợp "phần tử trùng phía trước chưa được sử dụng":

```java
if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) {
    continue;
}
```

Câu lệnh này có tác dụng cố định thứ tự lựa chọn giữa các phần tử trùng nhau ở cùng một tầng, tránh tạo ra các hoán vị giống nhau.

## Mẫu bài toán Tập con (Subsets)

Trong bài toán tập hợp con, mỗi nút trên cây tìm kiếm đều là một kết quả hợp lệ:

```java
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> ans = new ArrayList<>();
    backtrack(0, nums, new ArrayList<>(), ans);
    return ans;
}

void backtrack(int start, int[] nums, List<Integer> path, List<List<Integer>> ans) {
    ans.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(i + 1, nums, path, ans);
        path.remove(path.size() - 1);
    }
}
```

Bài toán tập con rất giống bài toán tổ hợp, nhưng thay vì chỉ thu thập kết quả khi đạt một độ dài cố định, ta ghi nhận kết quả tại mỗi nút duyệt qua. Bởi vì một đường đi có độ dài bất kỳ đều là một tập con hợp lệ.

Nếu đề bài yêu cầu loại bỏ trùng lặp khi mảng có phần tử giống nhau (ví dụ mảng đầu vào là `[1, 2, 2]`), quy tắc vẫn là sắp xếp mảng trước, sau đó bỏ qua phần tử trùng lặp ở cùng một tầng:

```java
if (i > start && nums[i] == nums[i - 1]) {
    continue;
}
```

## Cách xử lý khử trùng lặp (Deduplication)

Khi đầu vào chứa các phần tử trùng lặp, thông thường ta cần sắp xếp mảng trước, sau đó lựa chọn chiến lược khử trùng tùy theo dạng bài:

- Với các bài toán chọn tiến về phía trước theo chỉ số như tập con hoặc tổ hợp, ta bỏ qua phần tử trùng lặp ở cùng tầng bằng điều kiện: `i > start && nums[i] == nums[i - 1]`.
- Với bài toán hoán vị toàn phần (nơi mỗi tầng đều có thể quét từ đầu mảng), ta cần kết hợp kiểm tra với mảng `used[]` để tránh việc dùng lại cùng một vị trí.
- Cần phân biệt rõ: **"chọn trùng lặp ở cùng một tầng (nhánh ngang)"** khác với **"sử dụng phần tử giống nhau trên cùng một đường đi (nhánh dọc)"**. Chọn trùng lặp ở cùng một tầng sẽ sinh ra các kết quả giống hệt nhau, trong khi chọn lặp trên cùng đường đi có thể chính là lựa chọn hợp lệ mà đề bài cho phép.

## Minh họa quy trình và các ca kiểm thử biên (Boundary Cases)

Lấy ví dụ bài toán tổ hợp với `n = 3, k = 2`, cây quyết định có thể được rút gọn như sau:

| Lựa chọn ở tầng 1 | Khả năng chọn ở tầng 2 | Kết quả sinh ra |
| --- | --- | --- |
| Chọn 1 | 2, 3 | `[1, 2]`, `[1, 3]` |
| Chọn 2 | 3 | `[2, 3]` |
| Chọn 3 | Không còn | Không đủ 2 số, bị cắt tỉa nhánh |

Các trường hợp biên cần chú ý khi làm bài toán quay lui:

| Dữ liệu đầu vào | Trọng tâm kiểm tra |
| --- | --- |
| Mảng rỗng | Bài toán tập con thường phải trả về `[[]]` |
| `k = 0` | Bài toán tổ hợp có trả về tổ hợp rỗng hay không |
| Chứa phần tử trùng lặp | Đã sắp xếp và khử trùng lặp ở cùng tầng chưa |
| Chỉ có một kết quả | Đã sao chép `path` đúng cách chưa |

Cách viết sai thường gặp:

```java
ans.add(path); // Sai: path sẽ tiếp tục bị thay đổi trong các bước tiếp theo
```

Bắt buộc phải viết thành:

```java
ans.add(new ArrayList<>(path));
```

Trong thuật toán quay lui, `path` là một đối tượng được tái sử dụng liên tục. Nếu không tạo bản sao độc lập, danh sách trong `ans` sẽ bị các thao tác đệ quy và thu hồi phía sau làm biến đổi hoàn toàn.

## Các lỗi thường gặp (Common Pitfalls)

- Khi thêm kết quả vào danh sách đáp án, bắt buộc phải tạo bản sao mới của `path`, tuyệt đối không lưu trực tiếp tham chiếu.
- Dùng `startIndex` cho tổ hợp và dùng `used` cho hoán vị, tránh dùng lẫn lộn.
- Muốn khử trùng lặp thì hầu như luôn phải sắp xếp mảng đầu vào trước.
- Điều kiện cắt tỉa nhánh tuyệt đối không được làm ảnh hưởng đến kết quả đúng.
- Độ phức tạp của thuật toán quay lui thường tương đương với số lượng kết quả sinh ra, không nên tùy tiện kết luận là `O(n)`.

## Bài tập rèn luyện đề xuất

- [77. Combinations (Tổ hợp)](https://leetcode.cn/problems/combinations/)
- [78. Subsets (Tập hợp con)](https://leetcode.cn/problems/subsets/)
- [46. Permutations (Hoán vị)](https://leetcode.cn/problems/permutations/)
- [39. Combination Sum (Tổng tổ hợp)](https://leetcode.cn/problems/combination-sum/)
- [51. N-Queens (Bài toán N quân hậu)](https://leetcode.cn/problems/n-queens/)
