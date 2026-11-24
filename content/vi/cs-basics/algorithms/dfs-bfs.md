---
title: "Tổng hợp câu hỏi phỏng vấn DFS & BFS: Cây, Đồ thị, Ma trận và Mẫu đường đi ngắn nhất"
description: "Tổng hợp câu hỏi phỏng vấn DFS và BFS, giải thích chi tiết về tìm kiếm theo chiều sâu (DFS), tìm kiếm theo chiều rộng (BFS), duyệt cây, duyệt đồ thị, tìm kiếm trên ma trận, duyệt theo mức (level-order), đường đi ngắn nhất và code mẫu Java chuẩn."
category: Kiến thức cơ sở
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: DFS,BFS,tìm kiếm theo chiều sâu,tìm kiếm theo chiều rộng,duyệt cây,duyệt đồ thị,tìm kiếm ma trận,duyệt theo mức,đường đi ngắn nhất,Java DFS,Java BFS,LeetCode
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/dfs-bfs.md
---

DFS (Depth-First Search - Tìm kiếm theo chiều sâu) và BFS (Breadth-First Search - Tìm kiếm theo chiều rộng) là nền tảng cốt lõi cho các bài toán về cây (Tree), đồ thị (Graph) và ma trận (Matrix). Trong các buổi phỏng vấn, nhà tuyển dụng không chỉ hỏi đơn thuần "DFS là gì", mà phổ biến hơn là đưa ra các bài toán thực tế như đếm số hòn đảo, ràng buộc môn học (Course Schedule), số bước ngắn nhất, hoặc duyệt cây nhị phân theo tầng, yêu cầu bạn lựa chọn giải thuật tìm kiếm phù hợp và xử lý chính xác các trường hợp biên.

Một quy tắc phán đoán đơn giản: Khi cần đi sâu tới tận cùng của một nhánh, vét cạn/liệt kê mọi đường đi hoặc xử lý các thành phần liên thông, hãy ưu tiên **DFS**. Khi cần duyệt theo từng tầng/mức hoặc tìm số bước đi ngắn nhất, hãy ưu tiên **BFS**.

## Trọng tâm đánh giá trong phỏng vấn

- Viết thành thạo DFS đệ quy và BFS dùng hàng đợi (`Queue`).
- Phân tích chính xác độ phức tạp thời gian và không gian khi tìm kiếm trên cây và đồ thị.
- Xử lý tốt cấu trúc `visited` để tránh duyệt lặp và vòng lặp vô tận (`infinite loop`).
- Phân biệt rõ giữa "duyệt qua toàn bộ các nút" và "tìm số bước ngắn nhất".
- Khả năng chuyển đổi bài toán ma trận thành bài toán tìm kiếm trên đồ thị.

## Khi nào nên chọn DFS, khi nào chọn BFS?

Cả DFS và BFS đều có khả năng duyệt qua tất cả các nút, nhưng mỗi giải thuật lại có thế mạnh tự nhiên riêng biệt.

| Mục tiêu | Lựa chọn phổ biến | Lý do |
| --- | --- | --- |
| Duyệt qua tất cả các nút | Cả DFS và BFS đều được | Miễn là không duyệt lặp lại các nút |
| Tìm diện tích thành phần liên thông | DFS tiện lợi hơn | Đệ quy mở rộng tới cùng, mã nguồn ngắn gọn |
| Tìm số bước ngắn nhất trong đồ thị vô hướng không trọng số | BFS | Lan tỏa theo từng mức, lần đầu tiên chạm tới đích chắc chắn là ngắn nhất |
| Liệt kê tất cả các đường đi | DFS | Đường đi được lưu trữ tự nhiên trong ngăn xếp đệ quy (`call stack`) |
| Duyệt cây nhị phân theo mức (Level-order) | BFS | Hàng đợi (`Queue`) xử lý tự nhiên theo từng tầng |

Nếu bài toán xuất hiện các từ khóa như "ít bước nhất", "đường đi ngắn nhất", "lan tỏa ra toàn bộ các vị trí", hãy nghĩ đến **BFS** đầu tiên. Nếu bài toán yêu cầu "tất cả các phương án", "có tồn tại đường đi hay không", "kích thước thành phần liên thông", hãy nghĩ đến **DFS** đầu tiên.

## Mẫu code DFS (DFS Template)

Cách viết DFS phổ biến trên ma trận:

```java
void dfs(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) {
        return;
    }
    if (grid[i][j] != '1') {
        return;
    }
    grid[i][j] = '2';
    dfs(grid, i + 1, j);
    dfs(grid, i - 1, j);
    dfs(grid, i, j + 1);
    dfs(grid, i, j - 1);
}
```

Ở đây, chúng ta trực tiếp sửa các ô đất đã thăm thành `'2'`, tương đương với việc tận dụng trực tiếp mảng gốc làm cờ đánh dấu đã duyệt. Nếu bài toán không cho phép thay đổi dữ liệu đầu vào, bạn hãy tạo một mảng riêng biệt `boolean[][] visited`.

Hàm đệ quy DFS cần được định nghĩa ngữ nghĩa rõ ràng trước khi viết. Đoạn mã trên có thể giải thích là: *Xuất phát từ ô `(i, j)`, đánh dấu toàn bộ các ô đất liên thông với nó.*

Ngữ nghĩa này quyết định thứ tự thực thi trong code:

1. Trả về ngay nếu tọa độ vượt ra ngoài biên ma trận.
2. Trả về ngay nếu ô hiện tại không phải là đất (`'1'`).
3. Đánh dấu ô hiện tại đã thăm để tránh duyệt lặp lại.
4. Tiếp tục đệ quy thăm 4 hướng xung quanh (trên, dưới, trái, phải).

Rất nhiều lỗi (bug) khi viết DFS xuất phát từ việc thực hiện bước 3 quá muộn. Nếu bạn gọi đệ quy thăm các ô lân cận trước rồi mới đánh dấu ô hiện tại, hai ô liền kề có thể đệ quy qua lại lẫn nhau dẫn đến tràn bộ nhớ ngăn xếp.

## Mẫu code BFS (BFS Template)

BFS rất phù hợp cho duyệt theo mức và tìm đường đi ngắn nhất. Mẫu code dưới đây quy ước đầu vào là ma trận hình chữ nhật không rỗng, trong đó `0` đại diện cho ô có thể đi qua, `1` đại diện cho chướng ngại vật; hàm trả về số bước ngắn nhất từ điểm xuất phát tới đích, nếu tọa độ vượt biên hoặc không thể tới đích sẽ trả về `-1`:

```java
int bfs(int[][] grid, int startX, int startY, int targetX, int targetY) {
    if (grid == null || grid.length == 0 || grid[0].length == 0) {
        return -1;
    }
    int rows = grid.length;
    int columns = grid[0].length;
    if (startX < 0 || startX >= rows || startY < 0 || startY >= columns
            || targetX < 0 || targetX >= rows || targetY < 0 || targetY >= columns
            || grid[startX][startY] == 1 || grid[targetX][targetY] == 1) {
        return -1;
    }
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    Queue<int[]> queue = new ArrayDeque<>();
    queue.offer(new int[] {startX, startY});
    boolean[][] visited = new boolean[rows][columns];
    visited[startX][startY] = true;
    int step = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int k = 0; k < size; k++) {
            int[] cur = queue.poll();
            if (cur[0] == targetX && cur[1] == targetY) {
                return step;
            }
            for (int[] dir : dirs) {
                int x = cur[0] + dir[0];
                int y = cur[1] + dir[1];
                if (x < 0 || x >= rows || y < 0 || y >= columns
                        || visited[x][y] || grid[x][y] == 1) {
                    continue;
                }
                visited[x][y] = true;
                queue.offer(new int[] {x, y});
            }
        }
        step++;
    }
    return -1;
}
```

Đoạn code này trả về số tầng hiện tại (`step`) ngay khi nút mục tiêu được lấy ra khỏi hàng đợi lần đầu tiên, thay vì đợi đến khi hàng đợi rỗng. Tùy theo từng đề bài cụ thể, điều kiện đi qua có thể không phải là `0` và `1`, cần linh hoạt điều chỉnh theo yêu cầu.

Điểm mấu chốt của BFS là **xử lý theo từng tầng (level-by-level)**. Ban đầu trong hàng đợi là các nút thuộc tầng 0, mỗi vòng lặp lấy ra kích thước hiện tại của hàng đợi (`size`) và chỉ xử lý các nút thuộc đúng tầng đó; các nút mới hợp lệ được mở rộng ra sẽ thuộc về tầng tiếp theo.

Vì sao BFS trên đồ thị không trọng số lại tìm được đường đi ngắn nhất? Vì chi phí đi qua mỗi cạnh là như nhau. Khi BFS chạm tới một nút lần đầu tiên, chắc chắn số cạnh đã đi qua là ít nhất. Về sau, dù có đi tới nút đó lần nữa thì số cạnh cũng không thể ngắn hơn, vì thế ta có thể yên tâm đánh dấu đã duyệt ngay từ đầu.

BFS đa nguồn (Multi-source BFS) cũng rất phổ biến. Ví dụ trong bài toán "Rotting Oranges" (Những quả cam thối), tất cả các quả cam thối ban đầu đều đồng thời bắt đầu lan tỏa sang các quả cam tươi xung quanh. Cách làm là đưa toàn bộ các quả cam thối ban đầu vào hàng đợi ngay từ đầu, sau đó lan tỏa theo từng tầng.

## Điểm khác biệt giữa tìm kiếm trên Cây và Đồ thị

Cây không có chu trình (cycle), vì thế trong nhiều trường hợp không cần dùng đến `visited`. Đồ thị có thể chứa chu trình, do đó bắt buộc phải xem xét việc duyệt lặp lại.

| Tình huống | Thường có cần `visited` không? | Giải thích |
| --- | --- | --- |
| Đệ quy duyệt cây nhị phân | Thường không cần | Các nút không có cạnh quay ngược lại nút cha |
| Duyệt đồ thị vô hướng | Bắt buộc cần | Nếu không hai nút liền kề sẽ duyệt qua lại lẫn nhau |
| Duyệt đồ thị có hướng | Thường cần | Có thể tồn tại chu trình có hướng |
| Tìm kiếm trên ma trận | Bắt buộc cần | Các hướng trên, dưới, trái, phải có thể đi vòng lại điểm cũ |

## Độ phức tạp (Complexity)

Trong tìm kiếm đồ thị, người ta thường dùng `V` để chỉ số đỉnh (vertices) và `E` để chỉ số cạnh (edges). Khi lưu trữ bằng danh sách kề (adjacency list), độ phức tạp thời gian của DFS và BFS thường là `O(V + E)`, và độ phức tạp không gian là `O(V)`.

Đối với tìm kiếm trên ma trận kích thước `m * n`, mỗi ô được duyệt tối đa một lần, nên độ phức tạp thời gian là `O(m * n)`. Không gian dùng cho mảng đánh dấu hoặc hàng đợi trong trường hợp xấu nhất cũng là `O(m * n)`.

## Làm thế nào để chuyển bài toán ma trận thành đồ thị?

Mỗi ô trong ma trận đều có thể coi là một đỉnh trong đồ thị. Bốn hướng di chuyển (trên, dưới, trái, phải) chính là các cạnh nối ra từ đỉnh đó.

Mảng hướng di chuyển thường dùng:

```java
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
```

Khi duyệt các ô lân cận, bạn chỉ cần thực hiện 3 việc:

1. Tính toán tọa độ mới.
2. Kiểm tra tọa độ mới có vượt biên hay không.
3. Kiểm tra ô mới đã được thăm chưa, hoặc có thỏa mãn điều kiện đề bài hay không.

Nếu bài toán cho phép di chuyển theo đường chéo, chỉ cần mở rộng mảng hướng thành 8 hướng. Tuyệt đối không nên viết 4 khối đệ quy gần như y hệt nhau một cách thủ công trong code; việc dùng mảng hướng sẽ giúp code gọn gàng và tránh bỏ sót điều kiện.

## Minh họa quy trình và các ca kiểm thử biên (Boundary Cases)

Lấy bài toán "Số lượng hòn đảo" (Number of Islands) làm ví dụ: khi gặp một ô đất chưa được thăm, ta bắt đầu chạy DFS/BFS từ ô đó để đánh dấu toàn bộ hòn đảo liên thông.

| Bước | Thao tác | Mục đích |
| --- | --- | --- |
| 1 | Quét qua ma trận, tìm ô `'1'` | Phát hiện một hòn đảo mới |
| 2 | Tăng số lượng đảo lên 1 | Ghi nhận thành phần liên thông |
| 3 | Chạy DFS/BFS từ ô hiện tại | Đánh dấu toàn bộ các ô đất của hòn đảo này |
| 4 | Tiếp tục quét các ô tiếp theo | Tránh đếm trùng lặp cùng một hòn đảo |

Các trường hợp biên cần kiểm tra khi tìm kiếm trên ma trận:

| Dữ liệu đầu vào | Trọng tâm kiểm tra |
| --- | --- |
| Ma trận rỗng | Đã kiểm tra độ dài hàng và cột trước khi xử lý chưa |
| Toàn bộ là nước | Kết quả phải bằng 0 |
| Toàn bộ là đất liền | Chỉ được tính là 1 thành phần liên thông duy nhất |
| Chỉ liền kề theo đường chéo | Nếu đề bài chỉ cho phép 4 hướng trên/dưới/trái/phải thì không được tính là liên thông |

Cách viết sai thường gặp:

```java
void dfs(char[][] grid, int i, int j) {
    dfs(grid, i + 1, j);
    grid[i][j] = '2'; // Sai: đánh dấu quá trễ, có thể dẫn đến đệ quy qua lại vô tận
}
```

Việc đánh dấu đã thăm phải được hoàn thành **trước** khi gọi đệ quy mở rộng sang các ô lân cận. Trong đồ thị và ma trận, chỉ cần tồn tại cạnh quay lui hoặc các ô liền kề qua lại, việc đánh dấu trễ sẽ dẫn đến duyệt lặp hoặc tràn ngăn xếp (`StackOverflowError`).

## Các lỗi thường gặp (Common Pitfalls)

- Trong BFS, hãy đánh dấu đã thăm **ngay khi đưa vào hàng đợi (`offer`)**, tránh việc cùng một nút bị thêm vào hàng đợi nhiều lần.
- Độ sâu đệ quy của DFS quá lớn có thể gây ra `StackOverflowError`; trong phỏng vấn, bạn có thể nêu rõ hướng tối ưu là chuyển sang dùng ngăn xếp tường minh (explicit stack).
- Trong bài toán ma trận, luôn kiểm tra điều kiện vượt biên trước khi truy cập vào phần tử mảng.
- Với đồ thị vô hướng, cần đặc biệt lưu ý tránh việc từ nút con duyệt quay ngược lại nút cha.
- Khi tính số bước ngắn nhất trong BFS, biến đếm tầng phải được đồng bộ chính xác với kích thước hàng đợi tại tầng đó (`queue.size()`).

## Bài tập rèn luyện đề xuất

- [102. Binary Tree Level Order Traversal (Duyệt cây nhị phân theo tầng)](https://leetcode.cn/problems/binary-tree-level-order-traversal/)
- [200. Number of Islands (Số lượng hòn đảo)](https://leetcode.cn/problems/number-of-islands/)
- [695. Max Area of Island (Diện tích đảo lớn nhất)](https://leetcode.cn/problems/max-area-of-island/)
- [994. Rotting Oranges (Những quả cam thối)](https://leetcode.cn/problems/rotting-oranges/)
- [207. Course Schedule (Lịch học / Sắp xếp khóa học)](https://leetcode.cn/problems/course-schedule/)
