---
title: Chi tiết về Đồ thị - Graph (DFS, BFS, Đường đi ngắn nhất)
description: Giới thiệu các khái niệm cơ bản và phương pháp biểu diễn đồ thị phổ biến, kết hợp các thuật toán cốt lõi như DFS/BFS với kịch bản ứng dụng, nắm vững kiến thức nhập môn lý thuyết đồ thị.
category: Kiến thức cơ sở máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Đồ thị,Graph,danh sách kề,ma trận kề,DFS,BFS,bậc,đồ thị có hướng,đồ thị vô hướng,tính liên thông
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/graph.md
---

# Đồ thị (Graph)

Đồ thị là một cấu trúc dữ liệu phi tuyến tính tương đối phức tạp. **Tại sao lại nói nó tương đối phức tạp?**

Dựa trên những nội dung đã tìm hiểu trước đó, chúng ta biết rằng:

- Các phần tử trong cấu trúc dữ liệu tuyến tính thỏa mãn một mối quan hệ tuyến tính duy nhất, mỗi phần tử (trừ phần tử đầu tiên và cuối cùng) chỉ có một phần tử đứng trước trực tiếp và một phần tử đứng sau trực tiếp.
- Các phần tử trong cấu trúc dữ liệu dạng cây có mối quan hệ phân cấp tầng bậc rõ ràng.

Tuy nhiên, mối quan hệ giữa các phần tử trong cấu trúc đồ thị lại hoàn toàn tùy ý.

**Vậy đồ thị là gì?** Nói một cách đơn giản, đồ thị là một tập hợp gồm một tập hợp hữu hạn, khác rỗng các đỉnh (vertices) và một tập hợp các cạnh (edges) nối giữa các đỉnh đó. Thường được ký hiệu là: **G(V, E)**, trong đó $G$ biểu thị một đồ thị, $V$ biểu thị tập hợp các đỉnh và $E$ biểu thị tập hợp các cạnh.

Hình minh họa dưới đây là một cấu trúc dữ liệu đồ thị, cụ thể hơn là một đồ thị có hướng.

![Đồ thị có hướng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/directed-graph-d75b319e.png)

Ví dụ về đồ thị trong cuộc sống hàng ngày của chúng ta rất nhiều! Chẳng hạn như mối quan hệ bạn bè trên các mạng xã hội hoàn toàn có thể biểu diễn bằng đồ thị.

## Các khái niệm cơ bản của đồ thị

### Đỉnh (Vertex)

Các phần tử dữ liệu trong đồ thị được gọi là đỉnh. Một đồ thị luôn có ít nhất một đỉnh (tập hữu hạn khác rỗng).

Chiếu theo đồ thị quan hệ bạn bè, mỗi người dùng đại diện cho một đỉnh.

### Cạnh (Edge)

Mối quan hệ giữa các đỉnh được biểu diễn bằng cạnh.

Chiếu theo đồ thị quan hệ bạn bè, nếu hai người dùng là bạn bè của nhau thì giữa họ sẽ tồn tại một cạnh nối.

### Bậc (Degree)

Bậc biểu thị một đỉnh liên kết với bao nhiêu cạnh. Trong đồ thị có hướng, bậc còn được chia thành bán bậc ra (out-degree) và bán bậc vào (in-degree). Bậc ra biểu thị số lượng cạnh đi ra từ đỉnh đó, còn bậc vào biểu thị số lượng cạnh đi vào đỉnh đó.

Chiếu theo đồ thị quan hệ bạn bè, bậc đại diện cho số lượng bạn bè của một người.

### Đồ thị vô hướng và Đồ thị có hướng

Cạnh thể hiện mối quan hệ giữa các đỉnh. Có những mối quan hệ mang tính hai chiều, ví dụ như quan hệ bạn học: A là bạn học của B thì chắc chắn B cũng là bạn học của A. Khi biểu diễn quan hệ giữa A và B, ta không cần quan tâm đến hướng, dùng một cạnh không có mũi tên để biểu diễn, đồ thị như vậy gọi là đồ thị vô hướng (undirected graph).

Có những mối quan hệ lại mang tính một chiều (có hướng), ví dụ quan hệ cha con, thầy trò, hoặc quan hệ theo dõi (follow) trên mạng xã hội: A là cha của B nhưng B chắc chắn không phải cha của A; A theo dõi B nhưng B chưa chắc đã theo dõi A. Trong trường hợp này, ta sử dụng cạnh có mũi tên để chỉ rõ chiều của mối quan hệ, đồ thị như vậy gọi là đồ thị có hướng (directed graph).

### Đồ thị không trọng số và Đồ thị có trọng số

Đối với một mối quan hệ, nếu ta chỉ quan tâm đến việc mối quan hệ đó có tồn tại hay không mà không quan tâm độ mạnh yếu ra sao, ta có thể dùng đồ thị không trọng số (unweighted graph) để biểu diễn.

Nếu ta vừa quan tâm đến sự tồn tại của mối quan hệ, vừa quan tâm đến cường độ hoặc chi phí của nó—ví dụ mô tả khoảng cách giữa hai thành phố trên bản đồ—khi đó ta dùng đồ thị có trọng số (weighted graph). Mỗi cạnh trong đồ thị có trọng số đi kèm một giá trị số gọi là trọng số (weight), đại diện cho độ lớn hoặc chi phí của mối quan hệ.

Hình dưới đây là một đồ thị có hướng có trọng số.

![Đồ thị có hướng có trọng số](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/weighted-directed-graph-2a8ed8da.png)

## Lưu trữ và biểu diễn đồ thị

### Lưu trữ bằng Ma trận kề (Adjacency Matrix)

Ma trận kề lưu trữ đồ thị bằng một ma trận hai chiều, là một phương thức biểu diễn trực quan và dễ hiểu.

Nếu đỉnh thứ $i$ và đỉnh thứ $j$ có mối quan hệ với trọng số là $n$, thì `A[i][j] = n`.

Trong đồ thị không trọng số, ta chỉ quan tâm có hay không có quan hệ. Do đó, khi đỉnh $i$ và đỉnh $j$ có quan hệ, `A[i][j] = 1`; khi không có quan hệ, `A[i][j] = 0`. Như minh họa dưới đây:

![Lưu trữ đồ thị vô hướng bằng ma trận kề](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-matrix-representation-of-undirected-gr-ad668687.png)

Cần lưu ý rằng: **Ma trận kề của đồ thị vô hướng luôn là một ma trận đối xứng, bởi vì trong đồ thị vô hướng, nếu đỉnh $i$ nối với đỉnh $j$ thì chắc chắn đỉnh $j$ cũng nối với đỉnh $i$.**

![Lưu trữ đồ thị có hướng bằng ma trận kề](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-matrix-representation-of-directed-grap-c5354aee.png)

Ưu điểm của cách lưu trữ bằng ma trận kề là đơn giản, trực quan (chỉ cần dùng một mảng 2 chiều), đồng thời việc truy vấn mối quan hệ giữa hai đỉnh bất kỳ diễn ra cực kỳ nhanh chóng ($O(1)$ thông qua chỉ số mảng). Tuy nhiên, nhược điểm cũng rất rõ ràng: rất tốn bộ nhớ ($O(V^2)$).

### Lưu trữ bằng Danh sách kề (Adjacency List)

Để giải quyết vấn đề lãng phí không gian bộ nhớ của ma trận kề, một phương thức lưu trữ đồ thị khác đã ra đời—đó là **danh sách kề (Adjacency List)**.

Danh sách kề sử dụng danh sách liên kết (hoặc mảng động) để lưu trữ tất cả các đỉnh kề liền sau của một đỉnh nhất định. Đối với mỗi đỉnh $V_i$ trong đồ thị, tất cả các đỉnh $V_j$ liền kề với nó được liên kết thành một danh sách đơn, danh sách này được gọi là **danh sách kề** của đỉnh $V_i$. Như hình dưới đây:

![Lưu trữ đồ thị vô hướng bằng danh sách kề](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-list-representation-of-undirected-grap-362f0a39.png)

![Lưu trữ đồ thị có hướng bằng danh sách kề](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-list-representation-of-directed-graph-36413ea5.png)

Bạn có thể đếm số lượng phần tử được lưu trữ trong danh sách kề và so sánh với số lượng cạnh trong đồ thị, bạn sẽ thấy rằng:

- Trong đồ thị vô hướng, tổng số phần tử trong danh sách kề bằng 2 lần số cạnh. Ví dụ ở đồ thị vô hướng bên trái, số cạnh là 7, và danh sách kề lưu trữ tổng cộng 14 phần tử.
- Trong đồ thị có hướng, tổng số phần tử trong danh sách kề đúng bằng số cạnh. Ví dụ ở đồ thị có hướng bên phải, số cạnh là 8, và danh sách kề lưu trữ đúng 8 phần tử.

## Thuật toán tìm kiếm trên đồ thị

### Tìm kiếm theo chiều rộng (BFS - Breadth-First Search)

Tìm kiếm theo chiều rộng lan tỏa ra từng tầng từng lớp tương tự như những gợn sóng lan tỏa trên mặt nước, như minh họa dưới đây:

![Minh họa tìm kiếm theo chiều rộng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search-9bb83b6f.png)

**Cách cài đặt cụ thể của tìm kiếm theo chiều rộng sử dụng một cấu trúc dữ liệu tuyến tính chúng ta đã học—Hàng đợi (Queue)**. Quá trình cụ thể diễn ra như sau:

**Bước 1:**

![Tìm kiếm theo chiều rộng 1](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search1-0fd57731.png)

**Bước 2:**

![Tìm kiếm theo chiều rộng 2](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search2-f6d81cda.png)

**Bước 3:**

![Tìm kiếm theo chiều rộng 3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search3-42dff9dd.png)

**Bước 4:**

![Tìm kiếm theo chiều rộng 4](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search4-8a6a4d74.png)

**Bước 5:**

![Tìm kiếm theo chiều rộng 5](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search5-06b3e491.png)

**Bước 6:**

![Tìm kiếm theo chiều rộng 6](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search6-d79eb983.png)

### Tìm kiếm theo chiều sâu (DFS - Depth-First Search)

Tìm kiếm theo chiều sâu là chiến lược "đi một mạch tới ngõ cụt": xuất phát từ đỉnh nguồn, tiếp tục đi sâu mãi cho đến khi không còn đỉnh kế tiếp chưa thăm nào mới quay lui (backtrack) về đỉnh trước đó, rồi lại tiếp tục đi sâu theo nhánh khác, như hình dưới:

![Minh họa tìm kiếm theo chiều sâu](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search-b6825db5.png)

**Tương tự như BFS, việc cài đặt tìm kiếm theo chiều sâu sử dụng một cấu trúc dữ liệu tuyến tính khác—Ngăn xếp (Stack, hoặc ngăn xếp lời gọi hàm đệ quy)**. Quá trình cụ thể như sau:

**Bước 1:**

![Tìm kiếm theo chiều sâu 1](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search1-09d637ad.png)

**Bước 2:**

![Tìm kiếm theo chiều sâu 2](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search2-6a9b4e69.png)

**Bước 3:**

![Tìm kiếm theo chiều sâu 3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search3-b4617d69.png)

**Bước 4:**

![Tìm kiếm theo chiều sâu 4](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search4-7c5d3055.png)

**Bước 5:**

![Tìm kiếm theo chiều sâu 5](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search5-f0904aff.png)

**Bước 6:**

![Tìm kiếm theo chiều sâu 6](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search6-984f3ff6.png)

## Trọng tâm ôn tập phỏng vấn

Khi giải quyết các bài toán về đồ thị, hãy chọn phương thức lưu trữ trước, sau đó mới chọn thuật toán duyệt. Bốn dạng bài tập đồ thị thường gặp nhất trong phỏng vấn là: thành phần liên thông, số bước ngắn nhất, quan hệ phụ thuộc và phát hiện chu trình.

| Phương thức lưu trữ | Độ phức tạp không gian | Kiểm tra hai đỉnh kề nhau | Duyệt các đỉnh kề của một đỉnh | Kịch bản phù hợp |
| ------------------- | ---------------------- | ------------------------- | ------------------------------ | ---------------- |
| Ma trận kề | $O(V^2)$ | $O(1)$ | $O(V)$ | Đồ thị dày (dense graph), số đỉnh ít |
| Danh sách kề | $O(V + E)$ | Phụ thuộc vào cấu trúc danh sách kề | Phụ thuộc vào bậc của đỉnh | Đồ thị thưa (sparse graph), bài toán thuật toán thường dùng |

Về khung mẫu DFS/BFS, bạn có thể tham khảo [Tổng hợp câu hỏi phỏng vấn DFS và BFS](../algorithms/dfs-bfs.md). Dưới đây là một số ý chính cần nắm khi trả lời phỏng vấn:

- Khi dùng danh sách kề, độ phức tạp thời gian của DFS và BFS thông thường là $O(V + E)$.
- Đồ thị không trọng số muốn tìm số bước ngắn nhất thì ưu tiên hàng đầu luôn là BFS.
- Mối quan hệ phụ thuộc trong đồ thị có hướng thường giải quyết bằng sắp xếp topo (Topological Sort), bài toán kinh điển là "Lịch học các khóa học" (Course Schedule).
- Tính liên thông và phát hiện chu trình trên đồ thị vô hướng có thể dùng DFS/BFS hoặc Union-Find (tập hợp rời rạc).
- Tìm đường đi ngắn nhất có trọng số không dùng BFS thông thường; các thuật toán phổ biến gồm Dijkstra, Bellman-Ford, Floyd-Warshall, lựa chọn tùy theo điều kiện và giới hạn của đề bài.

## Template mã nguồn Java

Trong các bài toán thuật toán, danh sách kề được sử dụng phổ biến nhất. Các đỉnh thường được đánh số từ `0` đến `n - 1`, có thể biểu diễn bằng mảng danh sách `List<Integer>[]`.

```java
List<Integer>[] buildGraph(int n, int[][] edges) {
    List<Integer>[] graph = new ArrayList[n];
    for (int i = 0; i < n; i++) {
        graph[i] = new ArrayList<>();
    }
    for (int[] edge : edges) {
        int from = edge[0];
        int to = edge[1];
        graph[from].add(to);
        // Đồ thị vô hướng cần thêm một cạnh ngược lại:
        // graph[to].add(from);
    }
    return graph;
}
```

BFS rất phù hợp để tìm số bước ngắn nhất trong đồ thị không trọng số:

```java
int bfs(List<Integer>[] graph, int start, int target) {
    boolean[] visited = new boolean[graph.length];
    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    visited[start] = true;
    int step = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int cur = queue.poll();
            if (cur == target) {
                return step;
            }
            for (int next : graph[cur]) {
                if (!visited[next]) {
                    visited[next] = true;
                    queue.offer(next);
                }
            }
        }
        step++;
    }
    return -1;
}
```

## Minh họa tiến trình và các ca biên (Edge Cases)

Lấy bài toán tìm đường đi ngắn nhất trên đồ thị không trọng số làm ví dụ, quá trình lan tỏa theo từng tầng của BFS có thể hiểu như sau:

```text
Tầng 0: start
Tầng 1: tất cả các đỉnh kề chưa thăm của start
Tầng 2: tất cả các đỉnh kề chưa thăm của các đỉnh ở Tầng 1
...
Khi gặp target lần đầu tiên, số tầng hiện tại chính là số bước ngắn nhất.
```

Một số trường hợp biên nên kiểm tra kỹ trước khi nộp bài:

- `start == target`: kết quả trả về phải là `0`.
- Đồ thị không liên thông, đỉnh mục tiêu không thể tiếp cận: kết quả phải là `-1`.
- Khi dựng đồ thị vô hướng, quên thêm cạnh ngược lại sẽ khiến đồ thị liên thông bị phán đoán nhầm thành không liên thông.
- Đồ thị có chu trình nếu không đánh dấu `visited` thì BFS/DFS sẽ duyệt lặp đi lặp lại dẫn đến vòng lặp vô tận.

## Bài tập đề xuất rèn luyện

- [200. Số lượng hòn đảo (Number of Islands)](https://leetcode.cn/problems/number-of-islands/)
- [695. Diện tích lớn nhất của đảo (Max Area of Island)](https://leetcode.cn/problems/max-area-of-island/)
- [994. Cam thối (Rotting Oranges)](https://leetcode.cn/problems/rotting-oranges/)
- [207. Lịch học khóa học (Course Schedule)](https://leetcode.cn/problems/course-schedule/)
- [547. Số lượng tỉnh thành (Number of Provinces)](https://leetcode.cn/problems/number-of-provinces/)
