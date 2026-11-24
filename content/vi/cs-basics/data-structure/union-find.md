---
title: "Tổng hợp câu hỏi phỏng vấn Union-Find (Tập hợp rời rạc): Nén đường đi, Tính liên thông và Java Template"
description: Tổng hợp câu hỏi phỏng vấn về Union-Find (Disjoint Set Union), giải thích find, union, nén đường đi, hợp nhất theo kích thước, tính liên thông, phát hiện chu trình, số lượng tỉnh thành và các bài LeetCode tần suất cao.
category: Kiến thức cơ sở máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Union-Find,tập hợp rời rạc,Disjoint Set Union,nén đường đi,hợp nhất theo kích thước,tính liên thông,thuật toán đồ thị,phát hiện chu trình,số lượng tỉnh thành,Java Union-Find,LeetCode
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/union-find.md
---

# Tổng hợp câu hỏi phỏng vấn Union-Find: Nén đường đi, Tính liên thông và Java Template

Union-Find (còn gọi là cấu trúc dữ liệu các tập hợp rời rạc - Disjoint Set Union) chuyên dùng để giải quyết các bài toán về "phân nhóm" và "tính liên thông". Liệu hai phần tử có thuộc cùng một nhóm hay không? Sau khi hợp nhất hai tập hợp thì còn lại bao nhiêu thành phần liên thông? Thêm một cạnh vào đồ thị có tạo thành chu trình hay không? Tất cả những bài toán này đều có thể giải quyết rất hiệu quả bằng Union-Find.

Trong các buổi phỏng vấn, mã nguồn cài đặt Union-Find không dài, nhưng nếu hàm `find` viết không chuẩn sẽ ảnh hưởng trực tiếp đến độ phức tạp thời gian.

Tổng quan nội dung bài viết:

1. Union-Find là gì?
2. Union-Find dùng mảng biểu diễn tập hợp như thế nào?
3. Các hàm `find`, `union`, `connected` thực hiện nhiệm vụ gì?
4. Tại sao nén đường đi (Path Compression) và hợp nhất theo kích thước (Union by Size) lại giúp tăng tốc độ?
5. Union-Find phù hợp với những bài toán liên thông nào?

![Cấu trúc rừng cây của Union-Find dùng con trỏ trỏ về node cha để biểu diễn các thành phần liên thông](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/union-find-9e44f9d8.png)

## Union-Find là gì?

Union-Find (Disjoint Set Union - DSU) duy trì một tập hợp các nhóm không giao nhau (rời rạc). Cấu trúc này làm tốt nhất hai thao tác:

1. **Truy vấn (Query)**: Hai phần tử hiện tại có thuộc về cùng một tập hợp hay không?
2. **Hợp nhất (Union)**: Hợp nhất hai tập hợp chứa hai phần tử tương ứng thành một tập hợp duy nhất.

Nó không quan tâm đến cấu trúc bên trong chi tiết của tập hợp, cũng không quan tâm giữa hai đỉnh cụ thể đi qua những cạnh nào. Ví dụ trong mạng xã hội, Union-Find có thể nhanh chóng cho bạn biết người A và người B có thuộc cùng một vòng kết nối hay không; nhưng nó không thể chỉ ra đường đi ngắn nhất từ A đến B là gì.

Đây cũng là điểm khác biệt cốt lõi giữa Union-Find và BFS/DFS: BFS/DFS duyệt tìm kiếm trực tiếp trên đồ thị theo thời gian thực mỗi khi cần; còn Union-Find thì liên tục duy trì mối quan hệ liên thông xuyên suốt quá trình hợp nhất, các truy vấn sau đó chỉ cần kiểm tra xem node đại diện (node gốc) của hai phần tử có trùng khớp hay không.

## Union-Find biểu diễn tập hợp như thế nào?

Union-Find thường sử dụng một mảng `parent` để biểu diễn một rừng gồm nhiều cây:

- `parent[x]` biểu thị node cha của phần tử `x`.
- Nếu `parent[x] == x`, điều đó có nghĩa `x` chính là node gốc (root node) của tập hợp chứa nó.
- Mỗi tập hợp chỉ cần lấy node gốc làm đại diện.

Khi khởi tạo, mỗi phần tử là một tập hợp độc lập, do đó node cha của mỗi phần tử trỏ về chính nó:

```text
parent[0] = 0
parent[1] = 1
parent[2] = 2
...
```

Sau khi thực hiện `union(0, 1)`, ta có thể gán node gốc của `1` treo vào bên dưới node gốc của `0`. Lúc này `0` và `1` đã thuộc cùng một tập hợp. Khi tiếp tục thực hiện `union(1, 2)`, dù tham số truyền vào là `1` và `2`, nhưng đối tượng thực sự được hợp nhất chính là node gốc của `1` và node gốc của `2`.

Vì vậy, mấu chốt trong Union-Find không phải là "node cha trực tiếp của node hiện tại là ai", mà là "khi đi men theo các node cha ngược lên trên cùng, node gốc cuối cùng là ai". Hàm `find(x)` sinh ra chính là để làm việc này.

## Ba thao tác cốt lõi

Các thao tác thường dùng của Union-Find có thể tóm lược thành 3 phương thức:

| Thao tác | Tác dụng |
| -------- | -------- |
| `find(x)` | Tìm node đại diện (tức node gốc) của tập hợp chứa `x` |
| `union(a, b)` | Hợp nhất hai tập hợp chứa `a` và `b` |
| `connected(a, b)` | Kiểm tra xem node đại diện của `a` và `b` có trùng nhau hay không |

Nếu node gốc của hai phần tử giống nhau, chứng tỏ chúng đã thuộc cùng một tập hợp; nếu node gốc khác nhau, thao tác `union` sẽ treo một node gốc này xuống dưới node gốc kia.

## Trọng tâm kiểm tra phỏng vấn

- Viết chuẩn xác hai hàm `find` và `union`.
- Giải thích được vai trò và cơ chế của nén đường đi (Path Compression).
- Biết cách dùng Union-Find để đếm số lượng thành phần liên thông.
- Xử lý được các bài toán phát hiện chu trình trong đồ thị, vòng bạn bè, số lượng tỉnh thành, hệ phương trình đẳng thức.
- Nêu rõ được lý do vì sao Union-Find rất phù hợp cho hợp nhất động, nhưng không phù hợp cho việc xóa cạnh thường xuyên.

## Từ Quick Find đến Quick Union

Để hiểu sâu về Union-Find, trước tiên hãy nhìn vào hai phiên bản cực đoan:

- **Quick Find**: Mảng lưu trực tiếp mã số (ID) tập hợp của từng phần tử. Kiểm tra hai phần tử có cùng nhóm hay không rất nhanh ($O(1)$), nhưng khi hợp nhất hai tập hợp thì phải quét toàn bộ mảng để cập nhật lại mã số tập hợp ($O(n)$).
- **Quick Union**: Mảng lưu con trỏ trỏ tới node cha, đại diện tập hợp qua node gốc. Khi hợp nhất chỉ cần sửa con trỏ cha của một node gốc, nhưng nếu cây bị lệch và có chiều cao lớn, thao tác `find` sẽ bị chậm ($O(n)$).

Trong phỏng vấn và luyện thuật toán, phiên bản tối ưu thường được áp dụng là: **Nén đường đi (Path Compression) + Hợp nhất theo kích thước/hạng (Union by Size/Rank)**.

- **Nén đường đi**: Mỗi lần gọi `find(x)`, treo trực tiếp tất cả các node đi qua trên đường đi vào ngay dưới node gốc, giúp các lần truy vấn tiếp theo tới các node này diễn ra nhanh chóng.
- **Hợp nhất theo kích thước**: Khi hợp nhất hai tập hợp, treo cây nhỏ hơn vào dưới cây lớn hơn, hạn chế tối đa việc chiều cao cây tăng vọt.

Sự kết hợp của hai kỹ thuật tối ưu này giúp đưa chi phí trung bình của mỗi thao tác trong Union-Find tiệm cận tới thời gian hằng số.

## Template cơ bản

```java
class UnionFind {
    private final int[] parent;
    private final int[] size;
    private int count;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    boolean union(int a, int b) {
        int rootA = find(a);
        int rootB = find(b);
        if (rootA == rootB) {
            return false;
        }
        if (size[rootA] < size[rootB]) {
            parent[rootA] = rootB;
            size[rootB] += size[rootA];
        } else {
            parent[rootB] = rootA;
            size[rootA] += size[rootB];
        }
        count--;
        return true;
    }

    boolean connected(int a, int b) {
        return find(a) == find(b);
    }

    int count() {
        return count;
    }
}
```

`parent[x]` biểu thị node cha của `x`. Node cha của node gốc là chính nó. Thao tác nén đường đi giúp các node trên nhánh tìm kiếm trỏ thẳng vào node gốc, hỗ trợ các lần truy vấn sau nhanh hơn vượt bậc.

Trong template trên, có hai chi tiết rất đáng chú ý:

1. Câu lệnh `parent[x] = find(parent[x])` trong `find()` chính là cơ chế nén đường đi. Sau khi đệ quy trả về node gốc, tiện tay trỏ trực tiếp `x` vào node gốc đó.
2. Việc dùng `size` trong `union()` để quyết định cây nào treo vào cây nào chính là hợp nhất theo kích thước (Union by Size), giúp giảm thiểu sự gia tăng chiều cao cây.

Biến `count` biểu thị số lượng thành phần liên thông hiện tại. Chỉ khi phương thức `union()` thực sự hợp nhất hai tập hợp vốn trước đó không liên thông với nhau thì `count` mới giảm 1; nếu hai phần tử vốn đã liên thông từ trước thì không được phép giảm trùng lặp.

## Độ phức tạp

Khi áp dụng đồng thời cả nén đường đi và hợp nhất theo kích thước, độ phức tạp khấu hao (amortized time complexity) cho mỗi thao tác đơn lẻ của Union-Find là $O(\alpha(n))$, trong đó $\alpha(n)$ là hàm Ackermann nghịch đảo, hàm này tăng trưởng cực kỳ chậm (với mọi $n$ thực tế trong vũ trụ thì $\alpha(n) \le 4$). Trong thực tế phỏng vấn, bạn chỉ cần trả lời là "xấp xỉ thời gian hằng số $O(1)$" là đủ.

Độ phức tạp không gian là $O(n)$, chủ yếu đến từ các mảng `parent` và `size`.

## Kịch bản điển hình

| Kịch bản | Cách xử lý |
| -------- | ---------- |
| Kiểm tra hai node có liên thông hay không | So sánh `find(a)` và `find(b)` |
| Hợp nhất hai tập hợp | Gọi `union(a, b)` |
| Đếm số lượng thành phần liên thông | Khởi tạo bằng `n`, mỗi lần hợp nhất thành công thì giảm đi 1 |
| Phát hiện chu trình trong đồ thị vô hướng | Nếu hai đầu của một cạnh đã liên thông từ trước, thêm cạnh này vào sẽ tạo thành chu trình |
| Hệ phương trình đẳng thức | Hợp nhất các quan hệ bằng nhau trước, sau đó kiểm tra xem các quan hệ khác nhau có bị xung đột không |

Union-Find đặc biệt thích hợp với các bài toán có dạng "quan hệ liên tục được hợp nhất, truy vấn xem có cùng nhóm hay không", ví dụ như Số lượng tỉnh thành (Number of Provinces), Kết nối dư thừa (Redundant Connection), Hợp nhất tài khoản (Accounts Merge), thuật toán Kruskal tìm cây khung nhỏ nhất (Minimum Spanning Tree), v.v.

Tuy nhiên, Union-Find không có khả năng xử lý tốt thao tác xóa mối quan hệ (xóa cạnh). Lý do là khi hai tập hợp đã được hợp nhất, thông tin về việc những cạnh cụ thể nào tạo nên liên thông thường đã bị nén mất. Sau khi xóa một cạnh, tập hợp có còn liên thông hay không không thể chỉ dựa vào việc sửa đổi mảng `parent` mà suy ra được.

## Các điểm dễ sai sót (Pitfalls)

- Trong `find`, phải trả về node gốc chứ không phải trả về node cha trực tiếp.
- Khi nén đường đi, không được bỏ quên việc gán lại giá trị trả về của đệ quy: `parent[x] = find(parent[x])`.
- Khi gọi `union`, chỉ khi hai tập hợp thực sự chưa liên thông với nhau thì số lượng thành phần liên thông mới được giảm đi 1.
- Union-Find chỉ phù hợp cho hợp nhất, không thể xử lý tốt bài toán xóa cạnh.
- Với các bài toán lưới 2 chiều (2D grid), cần ánh xạ tọa độ `(i, j)` thành số thứ tự 1 chiều, chẳng hạn `i * cols + j`.

## Bài tập đề xuất rèn luyện

- [547. Số lượng tỉnh thành (Number of Provinces)](https://leetcode.cn/problems/number-of-provinces/)
- [684. Kết nối dư thừa (Redundant Connection)](https://leetcode.cn/problems/redundant-connection/)
- [990. Tính thỏa mãn của hệ phương trình đẳng thức (Satisfiability of Equality Equations)](https://leetcode.cn/problems/satisfiability-of-equality-equations/)
- [1319. Số thao tác để làm mạng kết nối (Number of Operations to Make Network Connected)](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/)
- [200. Số lượng hòn đảo (Number of Islands)](https://leetcode.cn/problems/number-of-islands/)

## Tài liệu tham khảo

- [Algorithms, 4th Edition: Union-Find](https://algs4.cs.princeton.edu/15uf/)
- [Algorithms, 4th Edition: WeightedQuickUnionPathCompressionUF](https://algs4.cs.princeton.edu/15uf/WeightedQuickUnionPathCompressionUF.java.html)
- [CP-Algorithms: Disjoint Set Union](https://cp-algorithms.com/data_structures/disjoint_set_union.html)
