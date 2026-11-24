---
title: "Chi tiết về Cấu trúc cây (Cây nhị phân, AVL, Cây B/B+)"
description: "Giải thích hệ thống các khái niệm cốt lõi và phương pháp duyệt cây và cây nhị phân, kết hợp với các chỉ số như chiều cao, độ sâu để củng cố nền tảng cấu trúc dữ liệu và tư duy thuật toán."
category: Khoa học máy tính cơ bản
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Cây,Cây nhị phân,Cây tìm kiếm nhị phân,Cây cân bằng,Duyệt cây,Tiền thứ tự,Trung thứ tự,Hậu thứ tự,Duyệt theo tầng,Chiều cao,Độ sâu
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/tree.md
---

Cây là một cấu trúc dữ liệu tương tự như một cái cây ngoài đời thực nhưng lộn ngược lại (cây đảo ngược). Bất kỳ một cây không rỗng nào cũng chỉ có duy nhất một node gốc (root).

Một cây có các đặc tính sau:

1. Giữa hai node bất kỳ trong một cây luôn luôn tồn tại duy nhất một đường đi kết nối chúng.
2. Nếu một cây có n node, thì cây đó chắc chắn có đúng n - 1 cạnh.
3. Một cây không bao giờ chứa chu trình (vòng lặp).

Hình dưới đây là một cây, và cụ thể là một cây nhị phân.

![Cây nhị phân](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/2-fb8dd0b3.png)

Như minh họa ở hình trên, chúng ta cùng làm rõ các khái niệm thường dùng trong cấu trúc cây:

- **Node (Nút)**: Mỗi phần tử trong cây đều được gọi chung là node.
- **Node gốc (Root node)**: Node ở tầng cao nhất, hay nói cách khác là node không có cha. Trong hình trên, node A chính là node gốc.
- **Node cha (Parent node)**: Nếu một node có các node con thì node đó được gọi là node cha của các con nó. Trong hình trên, node B là cha của node D và node E.
- **Node con (Child node)**: Node gốc của cây con thuộc về một node được gọi là node con của node đó. Trong hình trên, node D và E là các node con của node B.
- **Node anh em (Sibling node)**: Các node có cùng một node cha được gọi là node anh em. Trong hình trên, node D và E có chung cha là B, nên D và E là hai node anh em.
- **Node lá (Leaf node)**: Node không có node con nào. Trong hình trên, D, F, H, I đều là các node lá.
- **Chiều cao của node (Height)**: Số cạnh trên đường đi dài nhất từ node đó xuống một node lá.
- **Độ sâu của node (Depth)**: Số cạnh trên đường đi từ node gốc đến node đó.
- **Tầng của node (Level)**: Bằng độ sâu của node + 1.
- **Chiều cao của cây (Tree Height)**: Bằng chiều cao của node gốc.

> Về định nghĩa độ sâu và chiều cao của cây, bạn có thể tham khảo thảo luận trên Stack Overflow: [What is the difference between tree depth and height?](https://stackoverflow.com/questions/2603692/what-is-the-difference-between-tree-depth-and-height).

## Phân loại cây nhị phân

**Cây nhị phân (Binary tree)** là cấu trúc cây mà mỗi node có tối đa hai nhánh (tức là không tồn tại node nào có bậc phân nhánh lớn hơn 2).

Hai nhánh của **cây nhị phân** thường được gọi là "**cây con bên trái (left subtree)**" và "**cây con bên phải (right subtree)**". Đồng thời, các nhánh của cây nhị phân có thứ tự trái phải rõ ràng, không thể tùy tiện đảo ngược.

Tầng thứ i của một **cây nhị phân** có tối đa `2^(i-1)` node. Theo quy ước của bài viết này là "node gốc có độ sâu bằng 0", cây nhị phân có độ sâu k sẽ có tối đa `2^(k+1)-1` node (trường hợp cây nhị phân đầy đủ) và có tối thiểu `k+1` node (trường hợp thoái hóa thành một danh sách liên kết đơn). Về định nghĩa độ sâu của node, tài liệu ở các nơi có thể có quy ước khác nhau; bài viết này sử dụng [định nghĩa độ sâu node của Wikipedia](<https://zh.wikipedia.org/wiki/%E6%A0%91_(%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84)#/%E6%9C%AF%E8%AF%AD>).

![Định nghĩa độ sâu node của Wikipedia](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220119112736158-63744f50.png)

### Cây nhị phân đầy đủ (Full/Perfect Binary Tree)

Một cây nhị phân mà số lượng node ở mọi tầng đều đạt giá trị tối đa thì gọi là **cây nhị phân đầy đủ** (Full/Perfect Binary Tree). Nói cách khác, nếu một cây nhị phân có K tầng và tổng số node là `2^K - 1`, thì đó chính là **cây nhị phân đầy đủ**, như hình dưới đây:

![Cây nhị phân đầy đủ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/full-binary-tree-eb6e9991.png)

### Cây nhị phân hoàn chỉnh (Complete Binary Tree)

Ngoại trừ tầng cuối cùng, nếu tất cả các tầng còn lại đều đầy và tầng cuối cùng hoặc là đầy hoặc bị khuyết một số node liên tục ở phía bên phải, thì cây nhị phân đó gọi là **cây nhị phân hoàn chỉnh (Complete Binary Tree)**.

Bạn có thể hình dung một cái cây bắt đầu mở rộng từ node gốc: phải mở rộng xong node con bên trái mới được mở rộng node con bên phải, và mở rộng đầy đủ một tầng mới được chuyển sang mở rộng tầng tiếp theo. Như hình minh họa dưới đây:

![Cây nhị phân hoàn chỉnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/complete-binary-tree-896f64b4.png)

Cây nhị phân hoàn chỉnh có một đặc tính rất hay: **Số thứ tự của node cha và node con có mối quan hệ tương ứng toán học xác định.**

Những bạn quan sát tinh ý có thể nhận ra, khi node gốc có giá trị chỉ số là 1, nếu node cha có chỉ số là i, thì con bên trái sẽ có chỉ số là 2i, và con bên phải có chỉ số là 2i + 1. Đặc tính này giúp cho cây nhị phân hoàn chỉnh khi lưu trữ bằng mảng có thể tiết kiệm không gian cực kỳ lớn, đồng thời tận dụng chỉ số để tìm kiếm cha và con của một node bất kỳ rất nhanh chóng. Phần lưu trữ cây nhị phân phía sau sẽ giới thiệu chi tiết hơn.

### Cây AVL (Cây tìm kiếm nhị phân cân bằng độ cao)

**Cây AVL** là một cây tìm kiếm nhị phân cân bằng độ cao và có các tính chất sau:

1. Có thể là một cây rỗng.
2. Nếu không rỗng, giá trị tuyệt đối của hiệu chiều cao giữa hai cây con trái và phải không vượt quá 1, và cả hai cây con trái, phải cũng đều là cây AVL.

Cây đỏ-đen, cây Scapegoat, cây cân bằng trọng số, v.v., cũng được dùng để tránh cho cây tìm kiếm nhị phân bị thoái hóa nghiêm trọng, nhưng điều kiện cân bằng của chúng không giống với điều kiện "chênh lệch chiều cao cây con trái phải không quá 1" của cây AVL. Cây Splay thì thông qua việc điều chỉnh sau mỗi lần truy cập để đạt được sự đảm bảo về độ phức tạp phân bổ dần (amortized).

Trước khi giới thiệu cây nhị phân cân bằng, mời bạn xem một cái cây như sau:

![Cây lệch](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/oblique-tree-db81ef30.png)

**Bạn gọi cái thứ này là cây á???**

Đúng vậy, cái này thực sự vẫn gọi là cây, chỉ có điều cây này đã bị thoái hóa hoàn toàn thành một danh sách liên kết rồi, chúng ta gọi nó là **cây lệch (skewed tree)**.

**Nếu thế thì sao tôi không dùng luôn danh sách liên kết cho xong?**

Chứ còn gì nữa!

Cây nhị phân thông thường về bản chất không hề đảm bảo việc truy vấn sẽ nhanh hơn danh sách liên kết. Chỉ khi tận dụng tính có thứ tự của cây tìm kiếm nhị phân hoặc các quan hệ chỉ mục khác thì cấu trúc cây mới giúp cho việc **tìm kiếm** và **chỉnh sửa** dữ liệu trở nên hiệu quả hơn; một cây tìm kiếm nhị phân chưa được cân bằng trong trường hợp xấu nhất vẫn sẽ bị thoái hóa thành `O(n)`.

Tuy nhiên, nếu cây tìm kiếm nhị phân thoái hóa thành một danh sách liên kết, ưu thế truy vấn do cấu trúc có thứ tự mang lại sẽ biến mất và hiệu suất giảm sút nghiêm trọng. Cây AVL sử dụng điều kiện cân bằng độ cao nghiêm ngặt hơn để ngăn chặn tình trạng này: chênh lệch chiều cao giữa cây con trái và phải của mỗi node tối đa chỉ bằng 1, như hình dưới đây:

![Cây nhị phân cân bằng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/balanced-binary-tree-8e0e5a16.png)

## Phương thức lưu trữ cây nhị phân

Lưu trữ cây nhị phân chủ yếu chia thành hai dạng: **Lưu trữ liên kết (Linked Storage)** và **Lưu trữ tuần tự (Sequential Storage)**:

### Lưu trữ liên kết

Tương tự như danh sách liên kết, việc lưu trữ liên kết của cây nhị phân dựa vào con trỏ/tham chiếu để xâu chuỗi các node lại với nhau, không đòi hỏi không gian bộ nhớ phải liên tục.

Mỗi node bao gồm ba thuộc tính:

- Dữ liệu `data`: `data` không nhất thiết chỉ là một giá trị đơn lẻ; tùy tình huống thực tế, nó có thể chứa nhiều trường dữ liệu với các kiểu khác nhau.
- Con trỏ node trái `left`.
- Con trỏ node phải `right`.

Khoan đã, JAVA đâu có con trỏ!

Thì dùng trực tiếp tham chiếu đối tượng chứ sao (đừng hỏi tôi tìm đối tượng/người yêu ở đâu nhé).

![Lưu trữ liên kết cây nhị phân](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/chain-store-binary-tree-1b311e10.png)

### Lưu trữ tuần tự

Lưu trữ tuần tự là việc tận dụng mảng để lưu trữ dữ liệu. Mỗi vị trí trong mảng chỉ lưu trữ phần `data` của node chứ không lưu con trỏ trái phải; chỉ số của các node con được tính toán hoàn toàn thông qua chỉ số mảng. Node gốc có số thứ tự là 1. Với mỗi node bất kỳ, giả sử nó được lưu ở vị trí chỉ số i trong mảng, thì node con bên trái của nó sẽ được lưu ở vị trí 2i, và node con bên phải sẽ được lưu ở vị trí 2i + 1.

Cách lưu trữ tuần tự bằng mảng cho một cây nhị phân hoàn chỉnh được minh họa như hình dưới:

![Lưu trữ tuần tự bằng mảng cho cây nhị phân hoàn chỉnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/sequential-storage-6b566b21.png)

Các bạn có thể thử điền mảng lưu trữ cho cây nhị phân dưới đây và so sánh xem nó khác biệt thế nào so với lưu trữ tuần tự của cây nhị phân hoàn chỉnh:

![Lưu trữ tuần tự bằng mảng cho cây nhị phân không hoàn chỉnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/sequential-storage2-e2781cc7.png)

Có thể thấy, nếu cây nhị phân cần lưu trữ không phải là cây nhị phân hoàn chỉnh, trong mảng sẽ xuất hiện các khoảng trống, dẫn đến việc lãng phí bộ nhớ và hiệu suất sử dụng bộ nhớ bị suy giảm.

## Các phép duyệt cây nhị phân

### Duyệt tiền thứ tự (Preorder Traversal)

![Duyệt tiền thứ tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/preorder-traversal-83a26c45.png)

Duyệt tiền thứ tự cây nhị phân là việc xuất giá trị của node gốc trước, sau đó duyệt cây con bên trái, cuối cùng duyệt cây con bên phải. Khi duyệt cây con trái và phải, quy tắc duyệt tiền thứ tự cũng được áp dụng một cách tương tự; điều đó có nghĩa là chúng ta có thể cài đặt duyệt tiền thứ tự bằng đệ quy.

Mã nguồn như sau:

```java
public void preOrder(TreeNode root){
    if(root == null){
        return;
    }
    System.out.println(root.data);
    preOrder(root.left);
    preOrder(root.right);
}
```

### Duyệt trung thứ tự (Inorder Traversal)

![Duyệt trung thứ tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/inorder-traversal-c654e3a9.png)

Duyệt trung thứ tự cây nhị phân là đệ quy duyệt trung thứ tự cây con bên trái trước, sau đó xuất giá trị node gốc, rồi đệ quy duyệt trung thứ tự cây con bên phải. Bạn có thể hình dung thao tác này giống như dùng một bàn tay ép dẹp cây xuống: node cha bị ép nằm kẹp giữa node con trái và node con phải, như minh họa ở hình bên dưới:

![Hình ảnh trực quan về duyệt trung thứ tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/inorder-traversal2-b24785bc.png)

Mã nguồn như sau:

```java
public void inOrder(TreeNode root){
    if(root == null){
        return;
    }
    inOrder(root.left);
    System.out.println(root.data);
    inOrder(root.right);
}
```

### Duyệt hậu thứ tự (Postorder Traversal)

![Duyệt hậu thứ tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/postorder-traversal-7f6c2d2d.png)

Duyệt hậu thứ tự cây nhị phân là đệ quy duyệt hậu thứ tự cây con bên trái trước, sau đó đệ quy duyệt hậu thứ tự cây con bên phải, cuối cùng mới xuất giá trị của node gốc.

Mã nguồn như sau:

```java
public void postOrder(TreeNode root){
    if(root == null){
        return;
    }
    postOrder(root.left);
    postOrder(root.right);
    System.out.println(root.data);
}
```

## Trọng tâm ôn tập phỏng vấn

Phỏng vấn về cấu trúc cây thường bắt đầu từ việc duyệt cây nhị phân, sau đó dần dần hỏi sâu vào cây tìm kiếm nhị phân (BST), cây cân bằng, cây B và cây B+.

| Cấu trúc | Đặc tính | Câu hỏi đào sâu thường gặp |
| -------- | -------- | -------------------------- |
| Cây nhị phân | Mỗi node có tối đa hai node con | Các phép duyệt, đường đi, tổ tiên chung gần nhất (LCA), dựng cây |
| Cây tìm kiếm nhị phân (BST) | Cây con trái < gốc, cây con phải > gốc | Duyệt trung thứ tự ra dãy tăng dần, thoái hóa thành danh sách liên kết |
| Cây AVL | Cân bằng độ cao nghiêm ngặt | Truy vấn nhanh, chèn/xóa phải thực hiện phép quay thường xuyên hơn |
| Cây đỏ-đen | Cân bằng xấp xỉ | `TreeMap` trong Java, biến đổi thành cây (`treeify`) trong `HashMap` |
| Cây B | Cây tìm kiếm cân bằng đa nhánh | Thân thiện với Disk I/O |
| Cây B+ | Dữ liệu chỉ nằm ở node lá, các node lá nối với nhau thành danh sách có thứ tự | Chỉ mục MySQL, truy vấn theo dải |

Template duyệt đệ quy DFS của cây nhị phân bắt buộc phải viết thành thạo:

```java
void dfs(TreeNode root) {
    if (root == null) {
        return;
    }
    // Vị trí tiền thứ tự (Preorder)
    dfs(root.left);
    // Vị trí trung thứ tự (Inorder)
    dfs(root.right);
    // Vị trí hậu thứ tự (Postorder)
}
```

Các câu trả lời điểm nhấn về BST:

- Duyệt trung thứ tự cây tìm kiếm nhị phân thu được dãy số tăng dần nghiêm ngặt.
- Nếu dữ liệu chèn vào vốn đã có thứ tự sẵn, cây BST thông thường sẽ bị thoái hóa thành danh sách liên kết.
- Cây AVL cân bằng nghiêm ngặt hơn cây đỏ-đen, cho kết quả truy vấn ổn định hơn; cây đỏ-đen nới lỏng điều kiện cân bằng hơn một chút nên chi phí xoay và điều chỉnh khi chèn/xóa sẽ thấp hơn.
- Cây B+ rất thích hợp làm chỉ mục cơ sở dữ liệu: một node chứa được nhiều key hơn giúp chiều cao của cây thấp hơn rất nhiều, các node lá tạo thành danh sách liên kết có thứ tự rất thuận lợi cho việc quét dải dữ liệu.

Các bài toán thuật toán cây nhị phân có thể phân loại theo "vai trò của node hiện tại trong hàm đệ quy":

- Dạng đường đi: Node hiện tại được thêm vào đường đi, sau khi đệ quy xong thì hoàn tác (backtracking); thường gặp trong bài toán tìm đường từ gốc đến lá và tính tổng đường đi.
- Dạng gom kết quả cây con: Cây con trái và phải trả về kết quả trước, node hiện tại mới tổng hợp lại; thường gặp trong tính chiều cao, đường kính và kiểm tra cây cân bằng.
- Dạng hội tụ phân nhánh: Cây con trái và phải tìm kiếm mục tiêu độc lập, node hiện tại phán đoán xem có phải điểm giao thoa hay không; thường gặp trong bài toán Tìm tổ tiên chung gần nhất (LCA).
- Dạng kiến tạo: Xác định node gốc trước, sau đó phân chia các khoảng phân đoạn cho cây con trái và phải; thường gặp trong bài toán dựng cây từ mảng tiền thứ tự + trung thứ tự.

## Template mã nguồn Java

Duyệt theo tầng (BFS) là template không đệ quy phổ biến nhất trong các buổi phỏng vấn về cây nhị phân; rất nhiều bài toán như "tìm giá trị lớn nhất mỗi hàng", "duyệt zic-zắc", "độ sâu nhỏ nhất" đều là các biến thể từ nó.

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> ans = new ArrayList<>();
    if (root == null) {
        return ans;
    }
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) {
                queue.offer(node.left);
            }
            if (node.right != null) {
                queue.offer(node.right);
            }
        }
        ans.add(level);
    }
    return ans;
}
```

Khi kiểm tra tính hợp lệ của cây BST, không được chỉ so sánh node hiện tại với hai node con trực tiếp bên cạnh. Cách làm chính xác là truyền cận trên và cận dưới hợp lệ xuống cho từng cây con:

```java
boolean isValidBST(TreeNode root) {
    return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean check(TreeNode node, long lower, long upper) {
    if (node == null) {
        return true;
    }
    if (node.val <= lower || node.val >= upper) {
        return false;
    }
    return check(node.left, lower, node.val) && check(node.right, node.val, upper);
}
```

Bài toán Tổ tiên chung gần nhất (LCA) có thể giải quyết theo tư duy hậu thứ tự: tìm các node mục tiêu trong cây con trái và phải trước, sau đó node hiện tại dựa vào giá trị trả về để phán đoán xem có phải điểm hội tụ hay không.

```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) {
        return root;
    }
    return left != null ? left : right;
}
```

Ý nghĩa của đoạn mã này là: nếu `p` và `q` lần lượt xuất hiện ở hai cây con trái và phải thì node hiện tại chính là tổ tiên chung gần nhất; nếu chỉ xuất hiện ở một phía thì tiếp tục chuyển kết quả phía đó lên tầng trên.

Khi dựng lại cây nhị phân từ mảng tiền thứ tự (preorder) và trung thứ tự (inorder), phần tử đầu tiên của mảng preorder chính là node gốc. Trong mảng inorder, các phần tử nằm bên trái node gốc thuộc về cây con trái, các phần tử bên phải thuộc về cây con phải. Để tránh việc phải tìm kiếm tuyến tính node gốc trên mảng inorder nhiều lần, người ta thường dùng bảng băm để lưu sẵn chỉ số của mảng inorder.

```java
TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> index = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) {
        index.put(inorder[i], i);
    }
    return build(preorder, 0, preorder.length - 1, 0, inorder.length - 1, index);
}

TreeNode build(
    int[] preorder,
    int preLeft,
    int preRight,
    int inLeft,
    int inRight,
    Map<Integer, Integer> index
) {
    if (preLeft > preRight) {
        return null;
    }
    int rootVal = preorder[preLeft];
    int rootIndex = index.get(rootVal);
    int leftSize = rootIndex - inLeft;
    TreeNode root = new TreeNode(rootVal);
    root.left = build(preorder, preLeft + 1, preLeft + leftSize, inLeft, rootIndex - 1, index);
    root.right = build(preorder, preLeft + leftSize + 1, preRight, rootIndex + 1, inRight, index);
    return root;
}
```

Lỗi dễ mắc nhất trong bài toán dựng cây là việc tính toán biên của các khoảng chỉ số. Lời khuyên là hãy định nghĩa thật rõ ràng ý nghĩa của `preLeft/preRight` và `inLeft/inRight`, sau đó dựa vào kích thước cây con bên trái `leftSize` để phân đoạn mảng preorder một cách chuẩn xác.

## Trực quan hóa quy trình và các ca biên điển hình

Khi giải các bài toán về cây nhị phân, trước hết hãy xác định "node hiện tại cần làm gì", sau đó mới quyết định dùng tiền thứ tự, trung thứ tự, hậu thứ tự hay duyệt theo tầng.

```text
Tiền thứ tự: Xử lý node hiện tại trước, sau đó xử lý cây con trái và phải; thích hợp để sao chép cây, dựng đường đi.
Trung thứ tự: Trái -> Gốc -> Phải; duyệt trung thứ tự trên cây BST cho ra kết quả có thứ tự.
Hậu thứ tự: Xử lý hai cây con trái và phải trước, sau đó mới xử lý node hiện tại; thích hợp để tính chiều cao, đường kính, xóa node từ dưới lên.
Duyệt theo tầng: Mở rộng theo từng tầng; thích hợp để tìm độ sâu ngắn nhất, thống kê theo tầng, tuần tự hóa.
```

Một số trường hợp biên nên rà soát kỹ trước khi viết code:

- Cây rỗng: Rất nhiều bài toán yêu cầu trả về danh sách rỗng, `0` hoặc `true`.
- Cây chỉ có đúng 1 node: Điểm dừng đệ quy và hàng đợi duyệt theo tầng đều phải xử lý được.
- Cây lệch (thoái hóa thành danh sách liên kết): Độ sâu đệ quy có thể lên tới `n`, không được nhầm lẫn độ phức tạp là `O(logn)`.
- Giá trị trong cây BST có thể chứa `Integer.MIN_VALUE` / `Integer.MAX_VALUE`: Cận trên và cận dưới nên dùng kiểu `long`.
- Bài toán LCA mà một node mục tiêu lại chính là tổ tiên của node mục tiêu kia: Khi gặp một node mục tiêu, phải trả về ngay node hiện tại.
- Mảng đầu vào rỗng khi dựng cây: Khoảng đệ quy sẽ trở thành `preLeft > preRight`, cần trả về `null`.

## Đề xuất bài tập luyện tập

- [144. Duyệt cây nhị phân tiền thứ tự](https://leetcode.cn/problems/binary-tree-preorder-traversal/)
- [102. Duyệt cây nhị phân theo tầng](https://leetcode.cn/problems/binary-tree-level-order-traversal/)
- [98. Xác thực cây tìm kiếm nhị phân](https://leetcode.cn/problems/validate-binary-search-tree/)
- [236. Tổ tiên chung gần nhất của cây nhị phân](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)
- [105. Dựng cây nhị phân từ mảng duyệt tiền thứ tự và trung thứ tự](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
