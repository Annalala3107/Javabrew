---
title: Chi tiết về Cây đỏ-đen - Red-Black Tree (Đặc tính, Phép xoay, Ứng dụng)
description: Giải thích chuyên sâu về 5 đặc tính cốt lõi và quá trình xoay tái cân bằng của cây đỏ-đen (Red-Black Tree), thấu hiểu cơ chế tự cân bằng và ứng dụng trong thư viện chuẩn cùng cấu trúc chỉ mục.
category: Kiến thức cơ sở máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Red-Black Tree,cây đỏ đen,tự cân bằng,phép xoay,chèn và xóa,đặc tính,chiều cao đen,độ phức tạp thời gian
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/red-black-tree.md
---

# Cây đỏ-đen (Red-Black Tree)

## Giới thiệu về Red-Black Tree

Cây đỏ-đen (Red-Black Tree) là một loại cây tìm kiếm nhị phân tự cân bằng (self-balancing binary search tree). Cấu trúc này được phát minh vào năm 1972 bởi Rudolf Bayer, thời điểm đó được gọi là "cây B nhị phân đối xứng" (symmetric binary B-trees). Sau đó, vào năm 1978, Leo J. Guibas và Robert Sedgewick đã cải tiến và đổi tên thành "Red-Black Tree" như ngày nay.

Nhờ đặc tính tự cân bằng, Red-Black Tree đảm bảo trong trường hợp xấu nhất, các thao tác tìm kiếm, thêm mới và xóa phần tử đều hoàn thành trong độ phức tạp thời gian $O(\log n)$, mang lại hiệu năng rất ổn định.

Trong JDK, `TreeMap`, `TreeSet` cũng như cấu trúc bên dưới của `HashMap` từ JDK 1.8 trở đi đều sử dụng Red-Black Tree.

## Tại sao cần Red-Black Tree?

Red-Black Tree ra đời nhằm giải quyết nhược điểm cố hữu của cây tìm kiếm nhị phân thông thường (Binary Search Tree - BST).

Cây tìm kiếm nhị phân là một cấu trúc dữ liệu dựa trên so sánh, mỗi node có một giá trị khóa (key), trong đó khóa của node con bên trái luôn nhỏ hơn khóa của node cha, còn khóa của node con bên phải luôn lớn hơn khóa của node cha. Cấu trúc này giúp các thao tác tìm kiếm, chèn và xóa diễn ra rất thuận tiện, vì chỉ cần so sánh giá trị khóa là có thể xác định được vị trí của node mục tiêu. Tuy nhiên, cây tìm kiếm nhị phân tồn tại một vấn đề lớn: hình dạng của cây phụ thuộc hoàn toàn vào thứ tự chèn các node. Nếu các node được chèn theo thứ tự tăng dần hoặc giảm dần liên tiếp, cây tìm kiếm nhị phân sẽ bị thoái hóa thành một cấu trúc tuyến tính—tức là một danh sách liên kết (linked list). Khi đó, hiệu năng của cây tìm kiếm nhị phân sẽ suy giảm nghiêm trọng, độ phức tạp thời gian bị đẩy từ $O(\log n)$ xuống thành $O(n)$.

Sự ra đời của Red-Black Tree chính là nhằm khắc phục nhược điểm này của cây tìm kiếm nhị phân, ngăn không cho cây bị thoái hóa thành cấu trúc tuyến tính trong những trường hợp chèn dữ liệu bất lợi.

## Đặc điểm của Red-Black Tree

1. Mỗi node chỉ có thể là màu đỏ hoặc màu đen.
2. Node gốc (root) luôn luôn là màu đen.
3. Mỗi liên kết con rỗng (null) đều được xem là một node lá NIL màu đen.
4. Nếu một node có màu đỏ thì hai node con của nó bắt buộc phải là màu đen, tức là không bao giờ xuất hiện hai node màu đỏ nằm liền kề nhau trên cùng một nhánh.
5. Từ một node bất kỳ, mọi đường đi đến các node lá NIL hậu duệ của nó đều chứa cùng một số lượng node màu đen, tức là có cùng chiều cao đen (black height).

Trong mối quan hệ tương ứng giữa Red-Black Tree và cây 2-3 (2-3 Tree), một node đen cùng với các node đỏ liên kết với nó có thể cùng nhau biểu diễn một node đa khóa (multi-key node). Đây chỉ là một phép ánh xạ về mặt cấu trúc; bản thân mỗi node trong Red-Black Tree luôn có tối đa hai node con.

Chính những đặc tính nghiêm ngặt trên đã bảo đảm tính cân bằng của Red-Black Tree, giúp chiều cao của cây không bao giờ vượt quá $2\log(n+1)$.

## Cấu trúc dữ liệu Red-Black Tree

Cả cây AVL và Red-Black Tree đều là cây tìm kiếm nhị phân tự cân bằng, trong khi cây 2-3 lại là cây tìm kiếm đa nhánh (multi-way search tree). Red-Black Tree có thể thiết lập mối tương quan cấu trúc với cây 2-3 hoặc cây 2-3-4, nhưng chúng không thể gọi chung đơn giản là cây B (B-tree). So với cây AVL, điều kiện cân bằng của Red-Black Tree thoải mái hơn; nó giới hạn chiều cao cây thông qua các quy tắc về màu sắc và ràng buộc chiều cao đen.

## Cài đặt cấu trúc Red-Black Tree

```java
public class Node {

    public Class<?> clazz;
    public Integer value;
    public Node parent;
    public Node left;
    public Node right;

    // Thuộc tính cần thiết cho cây AVL
    public int height;
    // Thuộc tính cần thiết cho Red-Black Tree
    public Color color = Color.RED;

}
```

### 1. Đổi màu lệch trái (Left-Leaning Recoloring)

![Sơ đồ đổi màu lệch trái của Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-1-ba1fe751.png)

- Khi đổi màu, dựa vào node ông (grandparent) của node hiện tại để tìm node chú/bác (uncle).
- Tiếp theo, đổi màu node cha và node chú/bác thành màu đen, còn node ông đổi thành màu đỏ. Tuy nhiên, việc đổi node ông sang màu đỏ chỉ mang tính tạm thời; sau khi hoàn tất các thao tác cân bằng chiều cao cây, node gốc sẽ luôn được nhuộm đen lại.

### 2. Đổi màu lệch phải (Right-Leaning Recoloring)

![Sơ đồ đổi màu lệch phải của Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-2-930178e0.png)

### 3. Cân bằng bằng phép xoay trái (Left Rotation)

#### 3.1 Một lần xoay trái

![Sơ đồ cân bằng bằng một lần xoay trái của Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-3-518f3fb1.png)

#### 3.2 Xoay phải + Xoay trái

![Sơ đồ cân bằng xoay phải kết hợp xoay trái của Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-4-25b343c7.png)

### 4. Cân bằng bằng phép xoay phải (Right Rotation)

#### 4.1 Một lần xoay phải

![Sơ đồ cân bằng bằng một lần xoay phải của Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-5-f3429fe3.png)

#### 4.2 Xoay trái + Xoay phải

![Sơ đồ cân bằng xoay trái kết hợp xoay phải của Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-6-bc294253.png)

## Trọng tâm ôn tập phỏng vấn

Trong các buổi phỏng vấn, người phỏng vấn thường sẽ không yêu cầu bạn tự tay viết toàn bộ mã nguồn xử lý chèn và xóa phức tạp của Red-Black Tree, mà chủ yếu kiểm tra xem bạn có nắm vững các đặc tính cốt lõi hay không, tại sao nó đạt được trạng thái cân bằng xấp xỉ, có điểm gì khác biệt so với cây AVL và được ứng dụng ở đâu trong Java.

| Điểm so sánh | Cây AVL | Red-Black Tree |
| ------------ | ------- | -------------- |
| Yêu cầu cân bằng | Khắt khe hơn | Tương đối thoải mái hơn |
| Hiệu năng truy vấn | Ổn định hơn | Vẫn duy trì mức $O(\log n)$ |
| Thao tác chèn và xóa | Điều chỉnh phép xoay có thể nhiều hơn | Số lần điều chỉnh thường ít hơn |
| Ứng dụng phổ biến | Cấu trúc tìm kiếm đọc nhiều ghi ít | `TreeMap`, `TreeSet`, cơ chế hóa cây (treeify) trong `HashMap` |

Khi trả lời phỏng vấn, bạn có thể tổ chức câu trả lời theo trình tự sau:

1. Cây tìm kiếm nhị phân thông thường khi được chèn các phần tử theo thứ tự sẽ bị thoái hóa thành một danh sách liên kết.
2. Red-Black Tree hạn chế chiều cao cây thông qua hệ thống quy tắc màu sắc, đảm bảo các thao tác tra cứu, chèn và xóa vẫn duy trì được độ phức tạp $O(\log n)$.
3. Cây không duy trì sự cân bằng tuyệt đối mà là cân bằng xấp xỉ, do đó chi phí điều chỉnh khi thực hiện chèn và xóa thấp hơn so với cây AVL.
4. Trong Java, `TreeMap` và `TreeSet` được xây dựng dựa trên Red-Black Tree; từ JDK 8 trở đi, khi danh sách liên kết trong `HashMap` quá dài, nó cũng sẽ được chuyển đổi cấu trúc (treeify) thành Red-Black Tree.

Cần lưu ý thêm rằng quá trình treeify trong `HashMap` còn phải thỏa mãn cả điều kiện về dung lượng mảng (capacity) tối thiểu, chứ không phải hễ độ dài danh sách liên kết chạm ngưỡng là bắt buộc biến thành cây ngay. Chi tiết tinh tế này rất hay được các nhà tuyển dụng hỏi xoáy sâu trong các buổi phỏng vấn về Java Collections.
