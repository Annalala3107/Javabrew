---
title: Giải thích chi tiết về MySQL Index
description: "Giải thích chi tiết về MySQL Index, phân tích sâu cấu trúc chỉ mục B+ Tree, sự khác biệt giữa Clustered Index và Secondary Index, Composite Index cùng nguyên tắc tiền tố ngoài cùng bên trái (Leftmost Prefix), Covering Index và tối ưu hóa Index Condition Pushdown (ICP), cũng như các tình huống mất hiệu lực index thường gặp."
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Index,B+ Tree Index,Clustered Index,Covering Index,Composite Index,Index Condition Pushdown,Table Lookup,Mất hiệu lực Index,Leftmost Prefix
lang: vi
sourceRef: zh-ref/database/mysql/mysql-index.md
---

> Cảm ơn [WT-AHA](https://github.com/WT-AHA) đã hoàn thiện bài viết này, PR liên quan: <https://github.com/Snailclimb/JavaGuide/pull/1648>.

Bất kỳ ai từng trải qua vài buổi phỏng vấn đều hiểu rõ rằng kiến thức về index trong cơ sở dữ liệu xuất hiện trong phỏng vấn với tần suất cao đến khó tin.

Ngoài tầm quan trọng đối với việc chuẩn bị phỏng vấn, việc sử dụng thành thạo index giúp cải thiện hiệu năng SQL rất rõ rệt và là một phương pháp tối ưu SQL có tỷ lệ chi phí/hiệu quả rất cao.

## Giới thiệu về Index

**Index (chỉ mục) là một cấu trúc dữ liệu dùng để truy vấn và truy xuất dữ liệu nhanh chóng; về bản chất, có thể coi nó là một cấu trúc dữ liệu đã được sắp xếp.**

Vai trò của index giống như mục lục của một cuốn sách. Lấy ví dụ: khi tra từ điển, nếu không có mục lục thì chúng ta chỉ có thể lật từng trang một để tìm chữ cần tra, tốc độ rất chậm; nếu có mục lục rồi, chúng ta chỉ cần tìm vị trí của chữ đó trong mục lục trước, sau đó lật thẳng đến đúng trang đó là xong.

Cấu trúc dữ liệu nền tảng của index có rất nhiều loại, các cấu trúc index phổ biến gồm: B-Tree, B+ Tree, Hash và Red-Black Tree. Trong MySQL, cả InnoDB lẫn MyISAM đều sử dụng B+ Tree làm cấu trúc index.

## Ưu và nhược điểm của Index

**Ưu điểm của Index:**

1. **Tốc độ truy vấn tăng vọt (mục đích chính)**: Nhờ có index, cơ sở dữ liệu có thể **giảm đáng kể lượng dữ liệu cần quét**, định vị trực tiếp tới các bản ghi thỏa mãn điều kiện, qua đó tăng tốc truy xuất dữ liệu rõ rệt và giảm số lần Disk I/O.
2. **Đảm bảo tính duy nhất của dữ liệu**: Bằng cách tạo **Unique Index**, bạn có thể đảm bảo giá trị của một cột (hoặc tổ hợp nhiều cột) trong bảng là duy nhất, ví dụ như User ID, email, v.v. Bản thân khóa chính (Primary Key) cũng là một loại Unique Index.
3. **Tăng tốc sắp xếp và gom nhóm**: Nếu các cột trong mệnh đề `ORDER BY` hoặc `GROUP BY` của câu truy vấn đã được đánh index, cơ sở dữ liệu thường có thể tận dụng trực tiếp đặc tính đã được sắp xếp sẵn của index, tránh thao tác sắp xếp bổ sung và nâng cao hiệu năng.

**Nhược điểm của Index:**

1. **Tốn thời gian khởi tạo và bảo trì**: Việc tạo index tự thân đã tốn thời gian, đặc biệt khi thao tác trên bảng lớn. Quan trọng hơn, khi thực hiện các thao tác **thêm, xóa, sửa (DML)** trên dữ liệu bảng, không chỉ bản thân dữ liệu bị thay đổi mà các index liên quan cũng phải được cập nhật và bảo trì động, điều này sẽ **làm giảm hiệu suất thực thi của các thao tác DML**.
2. **Chiếm không gian lưu trữ**: Index về bản chất cũng là một cấu trúc dữ liệu, cần được lưu dưới dạng tệp vật lý (hoặc cấu trúc trong bộ nhớ), vì vậy nó sẽ **chiếm thêm dung lượng đĩa**. Càng nhiều index và kích thước index càng lớn thì dung lượng chiếm dụng càng nhiều.
3. **Có thể bị dùng sai hoặc mất hiệu lực**: Nếu thiết kế index không hợp lý hoặc câu truy vấn viết không tốt, bộ tối ưu hóa (Optimizer) của cơ sở dữ liệu có thể không chọn sử dụng index (hoặc chọn nhầm index), ngược lại còn làm giảm hiệu năng.

**Vậy có phải cứ dùng index là chắc chắn cải thiện được hiệu năng truy vấn không?**

**Không hẳn.** Trong đa số trường hợp, sử dụng index hợp lý thực sự nhanh hơn rất nhiều so với quét toàn bảng (Full Table Scan). Nhưng vẫn có ngoại lệ:

- **Lượng dữ liệu quá nhỏ**: Nếu bảng có rất ít dữ liệu (chẳng hạn chỉ vài trăm dòng), quét toàn bảng có thể nhanh hơn tìm qua index, vì bản thân việc duyệt index cũng có chi phí.
- **Tập kết quả truy vấn chiếm tỷ trọng quá lớn**: Nếu dữ liệu cần truy vấn chiếm phần lớn cả bảng (chẳng hạn vượt quá 20%–30%), Optimizer có thể nhận định rằng quét toàn bảng sẽ kinh tế hơn, bởi chi phí thực hiện nhiều lần quay lại bảng chính lấy dữ liệu (Table Lookup, tức I/O ngẫu nhiên) qua index có thể cao hơn một lần quét toàn bảng tuần tự.
- **Bảo trì index chưa tốt hoặc thông tin thống kê (statistics) bị lỗi thời**: Khiến Optimizer đưa ra phán đoán sai.

## Lựa chọn cấu trúc dữ liệu nền tảng cho Index

### Hash Table (Bảng băm)

Hash Table là tập hợp các cặp key-value, cho phép lấy nhanh value tương ứng thông qua key, nên Hash Table có thể truy xuất dữ liệu rất nhanh (xấp xỉ O(1)).

**Vì sao có thể lấy nhanh value thông qua key?** Nguyên nhân nằm ở **thuật toán băm (Hash Algorithm)**. Thông qua thuật toán băm, ta có thể tìm nhanh vị trí `index` tương ứng với `key`, tìm thấy `index` là tìm thấy `value` tương ứng.

```java
hash = hashfunc(key)
index = hash % array_size
```

![Tra cứu bảng băm](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210513092328171-4bc73353.png)

Tuy nhiên! Thuật toán băm tồn tại vấn đề **Xung đột băm (Hash Collision)**, tức là nhiều key khác nhau sau cùng lại cho ra cùng một `index`. Thông thường, cách giải quyết hay dùng là **phương pháp chuỗi liên kết (Separate Chaining)** — lưu các dữ liệu bị xung đột băm vào danh sách liên kết. Ví dụ, trước JDK 1.8, `HashMap` sử dụng phương pháp này để giải quyết xung đột băm. Tuy nhiên, từ JDK 1.8 trở đi, để cải thiện hiệu suất tìm kiếm khi danh sách liên kết quá dài, `HashMap` đã đưa vào sử dụng Red-Black Tree.

![Xử lý xung đột băm bằng Separate Chaining](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210513092224836-57f2e345.png)

Để giảm thiểu việc xảy ra xung đột băm, một hàm băm tốt cần phân bố dữ liệu "đồng đều" trên toàn bộ tập giá trị băm có thể có.

Storage Engine InnoDB của MySQL không hỗ trợ trực tiếp Hash Index thông thường, nhưng bên trong InnoDB có một cơ chế đặc biệt gọi là "Adaptive Hash Index" (chỉ mục băm thích ứng). Adaptive Hash Index không phải là Hash Index thuần túy theo nghĩa truyền thống, mà kết hợp đặc điểm của B+ Tree và Hash Index nhằm thích ứng tốt hơn với mô hình truy cập dữ liệu và yêu cầu hiệu năng trong thực tế. Mỗi hash bucket của Adaptive Hash Index thực chất là một cấu trúc B+ Tree nhỏ, có thể lưu nhiều cặp key-value thay vì chỉ một key duy nhất. Điều này giúp giảm độ dài chuỗi xung đột băm và nâng cao hiệu suất index. Để tìm hiểu chi tiết về Adaptive Hash Index, bạn có thể xem bài viết [Các loại "Buffer" của MySQL: Adaptive Hash Index](https://mp.weixin.qq.com/s/ra4v1XR5pzSWc-qtGO-dBg).

Nếu bảng băm nhanh như vậy, **tại sao MySQL lại không dùng nó làm cấu trúc dữ liệu cho index?** Nguyên nhân chủ yếu là vì Hash Index không hỗ trợ truy vấn tuần tự và truy vấn theo khoảng (range query). Giả sử chúng ta muốn sắp xếp dữ liệu trong bảng hoặc truy vấn theo khoảng thì Hash Index không làm được. Hơn nữa, mỗi lần I/O chỉ đọc được một phần tử.

Hãy thử hình dung tình huống sau:

```java
SELECT * FROM tb1 WHERE id < 500;
```

Trong kiểu truy vấn theo khoảng như thế này, lợi thế là cực kỳ lớn: chỉ cần duyệt trực tiếp các node lá nhỏ hơn 500 là đủ. Còn Hash Index định vị theo thuật toán băm — chẳng lẽ lại phải băm từng giá trị từ 1 đến 499 để định vị hay sao? Đó chính là nhược điểm lớn nhất của Hash Index.

### Cây tìm kiếm nhị phân (BST)

Cây tìm kiếm nhị phân (Binary Search Tree - BST) là một cấu trúc dữ liệu dựa trên cây nhị phân, có các đặc điểm sau:

1. Giá trị của mọi node ở cây con bên trái đều nhỏ hơn giá trị của node gốc.
2. Giá trị của mọi node ở cây con bên phải đều lớn hơn giá trị của node gốc.
3. Cây con bên trái và cây con bên phải cũng đều là cây tìm kiếm nhị phân.

Khi cây tìm kiếm nhị phân cân bằng — tức là độ sâu của cây con trái và cây con phải tại mỗi node chênh lệch không quá 1 — độ phức tạp thời gian truy vấn là O(log2(N)), đạt hiệu suất tương đối cao. Tuy nhiên, khi cây tìm kiếm nhị phân bị mất cân bằng, chẳng hạn trong trường hợp xấu nhất (chèn các node theo thứ tự tăng dần), cây sẽ thoái hóa thành danh sách liên kết tuyến tính (còn gọi là cây lệch - Skewed Tree), khiến hiệu suất truy vấn tụt dốc nghiêm trọng và độ phức tạp thời gian thoái hóa thành O(N).

![Cây lệch (Skewed Tree)](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/oblique-tree-db81ef30.png)

Nói cách khác, **hiệu năng của cây tìm kiếm nhị phân phụ thuộc quá nhiều vào mức độ cân bằng của nó, dẫn đến việc không phù hợp làm cấu trúc dữ liệu index nền tảng cho MySQL.**

Để giải quyết vấn đề này và nâng cao hiệu suất truy vấn, người ta đã phát minh ra nhiều cấu trúc dữ liệu cải tiến dựa trên cây tìm kiếm nhị phân, như cây nhị phân cân bằng, B-Tree, B+ Tree, v.v.

### Cây AVL

Cây AVL là cây tìm kiếm nhị phân tự cân bằng đầu tiên được phát minh trong khoa học máy tính, tên gọi xuất phát từ chữ viết tắt tên của hai tác giả G.M. Adelson-Velsky và E.M. Landis. Đặc điểm của cây AVL là đảm bảo hiệu chiều cao giữa cây con trái và cây con phải của bất kỳ node nào không vượt quá 1, nên còn được gọi là cây nhị phân cân bằng chiều cao. Độ phức tạp thời gian tìm kiếm, chèn và xóa của nó trong cả trường hợp trung bình lẫn xấu nhất đều là O(logn).

![Cây AVL](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/avl-tree-f1110dca.png)

Cây AVL sử dụng các phép xoay để duy trì sự cân bằng. Có bốn phép xoay chính: xoay LL, xoay RR, xoay LR và xoay RL. Trong đó, xoay LL và xoay RR xử lý mất cân bằng trái-trái và phải-phải, còn xoay LR và xoay RL xử lý mất cân bằng trái-phải và phải-trái.

Do cây AVL phải thực hiện xoay liên tục để duy trì cân bằng nghiêm ngặt nên chi phí tính toán khá lớn, từ đó làm giảm hiệu năng thao tác ghi của cơ sở dữ liệu. Ngoài ra, khi dùng cây AVL, mỗi node chỉ lưu một dữ liệu, mà mỗi lần Disk I/O chỉ đọc được dữ liệu của một node; nếu dữ liệu cần tìm nằm rải rác trên nhiều node thì cần nhiều lần Disk I/O. **Disk I/O là thao tác tốn rất nhiều thời gian; khi thiết kế index cơ sở dữ liệu, chúng ta phải ưu tiên xem xét cách giảm thiểu tối đa số lần thao tác Disk I/O.**

Trong ứng dụng thực tế, cây AVL không được sử dụng nhiều.

### Cây đỏ-đen (Red-Black Tree)

Cây đỏ-đen (Red-Black Tree) là một loại cây tìm kiếm nhị phân tự cân bằng, thông qua việc đổi màu và thực hiện các phép xoay khi chèn hoặc xóa node để giữ cây luôn ở trạng thái cân bằng, với các đặc điểm sau:

1. Mỗi node chỉ có thể là màu đỏ hoặc màu đen;
2. Node gốc luôn có màu đen;
3. Mỗi node lá đều là node rỗng màu đen (node NIL);
4. Nếu một node có màu đỏ thì các node con của nó bắt buộc phải có màu đen (chiều ngược lại không nhất thiết đúng);
5. Mọi đường đi từ một node bất kỳ đến các node lá hoặc node con rỗng của nó đều phải chứa cùng một số lượng node màu đen (tức có cùng chiều cao đen).

![Cây đỏ-đen (Red-Black Tree)](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-31d96234.png)

Khác với cây AVL, cây đỏ-đen không theo đuổi sự cân bằng tuyệt đối mà là sự cân bằng tương đối. Chính vì vậy, hiệu suất truy vấn của cây đỏ-đen giảm nhẹ một chút do tính cân bằng yếu hơn có thể làm chiều cao cây lớn hơn, dẫn đến một số dữ liệu cần nhiều lần Disk I/O mới tìm thấy — đây cũng là lý do chính khiến MySQL không chọn cây đỏ-đen. Nhưng bù lại, hiệu suất chèn và xóa của cây đỏ-đen được cải thiện vượt bậc, vì khi chèn hoặc xóa node, cây đỏ-đen chỉ cần O(1) lần xoay và đổi màu là có thể duy trì trạng thái cân bằng cơ bản, không cần O(logn) lần xoay như cây AVL.

**Cây đỏ-đen vẫn được ứng dụng rất rộng rãi: `TreeMap`, `TreeSet` và `HashMap` từ JDK 1.8 đều sử dụng cây đỏ-đen ở tầng dưới. Đối với các bài toán dữ liệu nằm hoàn toàn trong bộ nhớ, hiệu năng của cây đỏ-đen là rất xuất sắc.**

Về so sánh nền tảng giữa Cây tìm kiếm nhị phân, Cây AVL, Cây đỏ-đen, B-Tree và B+ Tree, bạn có thể xem trước [Giải thích chi tiết cấu trúc cây](../../cs-basics/data-structure/tree.md) và [Giải thích chi tiết Cây đỏ-đen](../../cs-basics/data-structure/red-black-tree.md).

### B-Tree & B+ Tree

B-Tree (hay B Tree) là viết tắt của **Cây tìm kiếm cân bằng đa nhánh (Balanced Multi-way Search Tree)**, còn B+ Tree là một biến thể của B-Tree. Chữ B trong B-Tree và B+ Tree mang nghĩa `Balanced` (cân bằng).

Hiện nay phần lớn các hệ quản trị cơ sở dữ liệu và hệ thống tệp đều dùng B-Tree hoặc biến thể B+ Tree làm cấu trúc index.

**B-Tree và B+ Tree có những điểm giống và khác nhau nào?**

- Tất cả các node của B-Tree đều lưu cả `key` và `data`, trong khi ở B+ Tree chỉ có các node lá mới lưu `key` và `data`, các node bên trong khác chỉ lưu `key`.
- Các node lá của B-Tree tách biệt độc lập với nhau; còn các node lá của B+ Tree có một chuỗi liên kết trỏ tới các node lá liền kề.
- Quá trình tìm kiếm trong B-Tree tương đương với việc tìm kiếm nhị phân trên các khóa của từng node dọc đường đi, có thể kết thúc trước khi xuống tới node lá. Trong khi đó, hiệu suất tìm kiếm của B+ Tree rất ổn định vì mọi lượt tìm kiếm đều đi từ node gốc xuống node lá, đồng thời việc duyệt tuần tự trên các node lá rất thuận tiện.
- Khi thực hiện truy vấn theo khoảng trên B-Tree, trước tiên phải tìm cận dưới rồi duyệt trung thứ tự (in-order traversal) trên B-Tree cho đến khi gặp cận trên; còn truy vấn theo khoảng trên B+ Tree chỉ cần duyệt danh sách liên kết ở tầng lá là xong.

Tóm lại, so với B-Tree, B+ Tree sở hữu các ưu điểm: ít số lần Disk I/O hơn, hiệu suất truy vấn ổn định hơn và phù hợp hơn với truy vấn theo khoảng.

Nếu chỉ muốn ôn nhanh B-Tree và B+ Tree dưới góc độ cấu trúc dữ liệu, bạn có thể quay lại phần ôn tập phỏng vấn trong bài [Giải thích chi tiết cấu trúc cây](../../cs-basics/data-structure/tree.md).

Trong MySQL, cả hai engine MyISAM và InnoDB đều sử dụng B+ Tree làm cấu trúc index, nhưng cách hiện thực của cả hai không giống nhau. (Nội dung dưới đây được tổng hợp từ sách *Con đường tu luyện của kỹ sư Java* / 《Java Con duong ren luyen cua ky su phan mem》.)

> Trong engine MyISAM, trường `data` ở node lá của B+ Tree lưu địa chỉ của bản ghi dữ liệu. Khi truy xuất qua index, đầu tiên hệ thống tìm kiếm trên index theo thuật toán B+ Tree; nếu Key chỉ định tồn tại thì lấy ra giá trị trong trường `data`, rồi dùng giá trị đó làm địa chỉ để đọc bản ghi dữ liệu tương ứng. Cơ chế này được gọi là "**Non-Clustered Index** (chỉ mục không gom cụm)".
>
> Trong engine InnoDB, bản thân tệp dữ liệu của bảng chính là tệp index. Khác với MyISAM (nơi tệp index và tệp dữ liệu tách rời nhau), bản thân tệp dữ liệu bảng của InnoDB là một cấu trúc index được tổ chức theo B+ Tree, trong đó trường `data` tại các node lá lưu toàn bộ bản ghi dữ liệu. Key của index này là khóa chính của bảng dữ liệu, vì vậy bản thân tệp dữ liệu bảng InnoDB chính là Primary Index. Cơ chế này được gọi là "**Clustered Index** (chỉ mục gom cụm)", còn toàn bộ các index khác đóng vai trò là **Secondary Index** (chỉ mục phụ). Trường `data` của Secondary Index lưu giá trị khóa chính của bản ghi tương ứng chứ không phải địa chỉ vật lý — đây cũng là điểm khác biệt với MyISAM. Khi tìm kiếm theo Primary Index, chỉ cần tìm đúng node chứa key là lấy được ngay dữ liệu; còn khi tìm kiếm theo Secondary Index, phải lấy ra giá trị khóa chính trước, rồi tra thêm một lượt qua Primary Index nữa. Do đó, khi thiết kế bảng, không nên dùng các trường quá dài hoặc không tăng đơn điệu làm khóa chính, vì điều đó sẽ khiến Primary Index bị tách trang (split) liên tục.

## Tổng hợp các loại Index

Phân loại theo cấu trúc dữ liệu:

- B-Tree Index: Loại index mặc định và được dùng phổ biến nhất trong MySQL. Chỉ node lá mới lưu `value`, các node không phải lá chỉ lưu con trỏ và `key`. Cả hai Storage Engine MyISAM và InnoDB đều triển khai B-Tree Index bằng B+ Tree, nhưng cách hiện thực bên dưới khác nhau (như đã trình bày ở trên).
- Hash Index: Tương tự dạng cặp key-value, định vị chỉ trong một bước.
- R-Tree Index: Hiếm khi dùng, chỉ hỗ trợ kiểu dữ liệu `geometry`. Thế mạnh là tìm kiếm theo phạm vi không gian nhưng hiệu suất khá thấp, thường được thay thế bằng các công cụ tìm kiếm như Elasticsearch.
- Full-Text Index: Tách từ (tokenization) nội dung văn bản để tìm kiếm. Hiện chỉ tạo được trên các cột `CHAR`, `VARCHAR`, `TEXT`. Hiếm khi dùng vì hiệu suất thấp, thường dùng các công cụ tìm kiếm như Elasticsearch để thay thế.

Phân loại theo góc độ lưu trữ bên dưới:

- Clustered Index (chỉ mục gom cụm): Index mà cấu trúc chỉ mục và dữ liệu được lưu trữ chung với nhau; Primary Key Index trong InnoDB thuộc loại Clustered Index.
- Non-Clustered Index (chỉ mục không gom cụm): Index mà cấu trúc chỉ mục và dữ liệu được lưu tách rời nhau; Secondary Index (chỉ mục phụ) thuộc loại Non-Clustered Index. Với engine MyISAM của MySQL, dù là khóa chính hay không phải khóa chính đều dùng Non-Clustered Index.

Phân loại theo mục đích ứng dụng:

- Primary Key Index (chỉ mục khóa chính): Tăng tốc truy vấn + giá trị cột duy nhất (không được chứa `NULL`) + mỗi bảng chỉ có một.
- Normal Index (chỉ mục thường): Chỉ dùng để tăng tốc truy vấn.
- Unique Index (chỉ mục duy nhất): Tăng tốc truy vấn + giá trị cột duy nhất (cho phép `NULL`).
- Covering Index (chỉ mục bao phủ): Một index chứa (hay bao phủ) toàn bộ giá trị của các trường cần truy vấn.
- Composite Index (chỉ mục kết hợp / liên hợp): Nhiều cột hợp thành một index, chuyên dùng cho tìm kiếm kết hợp nhiều điều kiện; hiệu suất cao hơn Index Merge.
- Full-Text Index (chỉ mục toàn văn): Tách từ nội dung văn bản để tìm kiếm. Hiện chỉ tạo được trên các cột `CHAR`, `VARCHAR`, `TEXT`. Hiếm khi dùng vì hiệu suất thấp, thường dùng Elasticsearch thay thế.
- Prefix Index (chỉ mục tiền tố): Tạo index trên vài ký tự đầu tiên của chuỗi văn bản; dữ liệu tạo ra nhỏ hơn so với Normal Index vì chỉ lấy vài ký tự đầu.

Các tính năng index mới trong MySQL 8.x:

- Invisible Index (chỉ mục ẩn): Còn gọi là chỉ mục không nhìn thấy; không được Optimizer sử dụng nhưng vẫn được duy trì cập nhật, thường dùng trong các kịch bản xóa mềm index và phát hành canary. Khóa chính không thể đặt thành ẩn (dù chỉ định tường minh hay ngầm định).
- Descending Index (chỉ mục giảm dần): Các phiên bản trước đã hỗ trợ chỉ định `DESC` khi tạo index, nhưng thực tế vẫn tạo index tăng dần thông thường. Phải đến phiên bản MySQL 8.x mới thực sự hỗ trợ Descending Index. Ngoài ra, từ MySQL 8.x, câu lệnh `GROUP BY` không còn tự động sắp xếp ngầm định nữa.
- Functional Index (chỉ mục hàm): Từ phiên bản MySQL 8.0.13 bắt đầu hỗ trợ sử dụng giá trị của hàm hoặc biểu thức trong index, tức là trong index có thể chứa hàm hoặc biểu thức.

## Primary Key Index (Chỉ mục khóa chính)

Cột khóa chính của bảng dữ liệu sử dụng chính là Primary Key Index.

Một bảng dữ liệu chỉ có thể có một khóa chính duy nhất, và khóa chính không được phép là `NULL` cũng như không được trùng lặp.

Trong bảng InnoDB của MySQL, khi không chỉ định tường minh khóa chính cho bảng, InnoDB sẽ tự động kiểm tra trước xem trong bảng có cột nào có Unique Index và không cho phép giá trị `NULL` hay không; nếu có thì chọn cột đó làm khóa chính mặc định, nếu không InnoDB sẽ tự động tạo ra một khóa chính tự tăng ẩn kích thước 6 Byte.

![Primary Key Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/cluster-index-a7e95938.png)

## Secondary Index (Chỉ mục phụ)

Node lá của Secondary Index lưu trữ giá trị của khóa chính, tức là thông qua Secondary Index có thể định vị được vị trí của khóa chính. Secondary Index còn được gọi là chỉ mục phụ trợ / chỉ mục không phải khóa chính.

Unique Index, Normal Index, Prefix Index, v.v. đều thuộc nhóm Secondary Index.

Tái bút: Bạn nào chưa hiểu rõ chỗ này có thể tạm giữ thắc mắc và đọc tiếp xuống dưới, phía sau sẽ có câu trả lời, hoặc cũng có thể tự tìm hiểu thêm.

1. **Unique Index (`Unique Key`)**: Unique Index cũng là một dạng ràng buộc. Dữ liệu trong cột thuộc tính của Unique Index không được trùng lặp nhưng cho phép giá trị `NULL`, và một bảng cho phép tạo nhiều Unique Index. Đa số trường hợp mục đích tạo Unique Index là để đảm bảo tính duy nhất dữ liệu cho cột thuộc tính đó chứ không hẳn vì tốc độ truy vấn.
2. **Normal Index (`Index`)**: Tác dụng duy nhất của Normal Index là giúp truy vấn dữ liệu nhanh. Một bảng cho phép tạo nhiều Normal Index, đồng thời cho phép dữ liệu trùng lặp và giá trị `NULL`.
3. **Prefix Index (`Prefix`)**: Prefix Index chỉ áp dụng cho dữ liệu kiểu chuỗi. Prefix Index tạo chỉ mục trên vài ký tự đầu tiên của văn bản, dữ liệu tạo thành nhỏ hơn so với Normal Index vì chỉ lấy vài ký tự đầu.
4. **Full-Text Index (`Full Text`)**: Full-Text Index chủ yếu dùng để truy xuất thông tin từ khóa trong dữ liệu văn bản lớn, là kỹ thuật được các cơ sở dữ liệu máy tìm kiếm sử dụng. Trước MySQL 5.6 chỉ có engine MyISAM hỗ trợ Full-Text Index, từ 5.6 trở đi InnoDB cũng đã hỗ trợ Full-Text Index.

Secondary Index:

![Secondary Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/no-cluster-index-8c58e1fd.png)

## Clustered Index và Non-Clustered Index

### Clustered Index (Chỉ mục gom cụm)

#### Giới thiệu về Clustered Index

Clustered Index là loại index mà cấu trúc chỉ mục và dữ liệu được lưu trữ chung với nhau, chứ không phải một loại index độc lập riêng biệt. Primary Key Index trong InnoDB chính là Clustered Index.

Trong MySQL, tệp `.ibd` của bảng dùng engine InnoDB chứa cả index lẫn dữ liệu của bảng đó. Với bảng engine InnoDB, mỗi node không phải lá của index (B+ Tree) lưu giá trị index, còn node lá lưu cả index lẫn dữ liệu tương ứng với index đó.

#### Ưu và nhược điểm của Clustered Index

**Ưu điểm**:

- **Tốc độ truy vấn cực nhanh**: Tốc độ truy vấn của Clustered Index rất nhanh vì toàn bộ B+ Tree bản thân nó là một cây cân bằng đa nhánh, các node lá cũng đã được sắp xếp theo thứ tự; định vị tới node của index đồng nghĩa với việc định vị tới dữ liệu. So với Non-Clustered Index, Clustered Index giảm được một lần I/O đọc dữ liệu.
- **Tối ưu cho tìm kiếm sắp xếp và tìm kiếm theo khoảng**: Clustered Index có tốc độ tìm kiếm theo thứ tự và tìm kiếm theo khoảng trên khóa chính rất nhanh.

**Nhược điểm**:

- **Phụ thuộc vào dữ liệu có thứ tự**: Vì B+ Tree là cây cân bằng đa nhánh, nếu dữ liệu của index không có thứ tự thì cần phải sắp xếp khi chèn. Nếu dữ liệu là kiểu số nguyên thì còn đỡ, chứ với những dữ liệu dài và khó so sánh như chuỗi ký tự hay UUID, tốc độ chèn hoặc tìm kiếm chắc chắn sẽ chậm hơn.
- **Chi phí cập nhật lớn**: Khi dữ liệu của cột đánh index bị chỉnh sửa thì index tương ứng cũng phải sửa theo, hơn nữa node lá của Clustered Index còn chứa cả dữ liệu bản ghi nên chi phí sửa đổi chắc chắn rất lớn. Vì vậy, đối với Primary Key Index, khóa chính thường không được phép thay đổi.

### Non-Clustered Index (Chỉ mục không gom cụm)

#### Giới thiệu về Non-Clustered Index

Non-Clustered Index là loại index mà cấu trúc chỉ mục và dữ liệu được lưu tách rời nhau, chứ không phải một loại index độc lập riêng biệt. Secondary Index (chỉ mục phụ) thuộc loại Non-Clustered Index. Với engine MyISAM của MySQL, dù là khóa chính hay không phải khóa chính đều dùng Non-Clustered Index.

Node lá của Non-Clustered Index không nhất thiết lưu con trỏ tới dữ liệu, bởi trong InnoDB, node lá của Secondary Index lưu giá trị khóa chính, sau đó dựa vào khóa chính để quay lại bảng chính tra cứu dữ liệu (table lookup / hồi bảng).

#### Ưu và nhược điểm của Non-Clustered Index

**Ưu điểm**:

Chi phí cập nhật nhỏ hơn so với Clustered Index. Chi phí cập nhật của Non-Clustered Index không lớn như Clustered Index vì node lá của Non-Clustered Index không lưu trữ dữ liệu bản ghi.

**Nhược điểm**:

- **Phụ thuộc vào dữ liệu có thứ tự**: Giống như Clustered Index, Non-Clustered Index cũng phụ thuộc vào dữ liệu có thứ tự.
- **Có thể phát sinh truy vấn lần hai (table lookup / hồi bảng)**: Đây có lẽ là nhược điểm lớn nhất của Non-Clustered Index. Sau khi tra được con trỏ hoặc khóa chính tương ứng với index, có thể vẫn cần dựa vào con trỏ hoặc khóa chính đó để truy vấn lại vào tệp dữ liệu hoặc bảng chính.

Đây là ảnh chụp các tệp bảng của MySQL:

![Các tệp bảng của MySQL](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210420165311654-a6455c73.png)

Clustered Index và Non-Clustered Index:

![Clustered Index và Non-Clustered Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210420165326946-c52cd37b.png)

#### Non-Clustered Index có luôn phải truy vấn lại bảng chính (table lookup) không (Covering Index)?

**Non-Clustered Index không phải lúc nào cũng phải truy vấn lại bảng chính.**

Thử xét một tình huống: người dùng chạy SQL truy vấn tên người dùng, mà cột `name` lại vừa hay đã được tạo index.

```sql
 SELECT name FROM table WHERE name='guang19';
```

Khi đó bản thân `key` của index chính là `name`, tìm thấy `name` tương ứng là trả về ngay được rồi, không cần quay lại bảng chính lấy dữ liệu nữa.

Ngay cả với MyISAM cũng vậy: tuy Primary Key Index của MyISAM đúng là cần tra ngược theo địa chỉ vì node lá của nó lưu con trỏ, nhưng **nếu câu SQL chỉ truy vấn đúng khóa chính thì sao?**

```sql
SELECT id FROM table WHERE id=1;
```

Bản thân `key` của Primary Key Index chính là khóa chính, tìm thấy là trả về luôn. Trường hợp như vậy được gọi là **Covering Index** (chỉ mục bao phủ).

## Covering Index và Composite Index

### Covering Index

Nếu một index chứa (hay nói cách khác là bao phủ) giá trị của tất cả các trường cần truy vấn, chúng ta gọi nó là **Covering Index**.

Trong Storage Engine InnoDB, node lá của index không phải khóa chính chứa giá trị của khóa chính. Điều này có nghĩa là khi dùng index không phải khóa chính để truy vấn dữ liệu, cơ sở dữ liệu sẽ tìm giá trị khóa chính tương ứng trước, rồi mới thông qua Primary Key Index để định vị và truy xuất toàn bộ dữ liệu dòng. Quá trình này được gọi là "table lookup" (hồi bảng).

**Covering Index nghĩa là các trường cần truy vấn lại chính là các trường nằm trong index; khi đó chỉ cần dựa trực tiếp vào index đó là đã lấy được dữ liệu rồi, không cần phải truy vấn ngược lại bảng chính nữa.**

> Ví dụ với Primary Key Index, nếu một câu SQL chỉ cần truy vấn khóa chính thì dựa thẳng vào Primary Key Index là lấy được khóa chính. Hay như với Normal Index, nếu một câu SQL cần truy vấn `name` và cột `name` đã có index, thì dựa thẳng vào index này là lấy được dữ liệu mà không cần truy vấn lại bảng chính.

![Covering Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210420165341868-1c1d4c30.png)

Dưới đây chúng ta sẽ minh họa nhanh hiệu quả của Covering Index.

1. Tạo một bảng tên là `cus_order` để thực nghiệm cách sắp xếp này. Để tiện kiểm thử, bảng `cus_order` chỉ có 3 trường là `id`, `score` và `name`.

```sql
CREATE TABLE `cus_order` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `score` int(11) NOT NULL,
  `name` varchar(11) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100000 DEFAULT CHARSET=utf8mb4;
```

2. Định nghĩa một Stored Procedure đơn giản (`PROCEDURE`) để chèn 1 triệu dòng dữ liệu kiểm thử.

```sql
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `BatchinsertDataToCusOder`(IN start_num INT,IN max_num INT)
BEGIN
      DECLARE i INT default start_num;
      WHILE i < max_num DO
          insert into `cus_order`(`id`, `score`, `name`)
          values (i,RAND() * 1000000,CONCAT('user', i));
          SET i = i + 1;
      END WHILE;
  END;;
DELIMITER ;
```

Sau khi định nghĩa xong Stored Procedure, ta chỉ việc thực thi nó!

```sql
CALL BatchinsertDataToCusOder(1, 1000000); # Chèn hơn 1 triệu dữ liệu ngẫu nhiên
```

Đợi một lát, 1 triệu dòng dữ liệu kiểm thử đã được chèn xong!

3. Tạo Covering Index và phân tích bằng lệnh `EXPLAIN`.

Để sắp xếp 1 triệu dòng dữ liệu này theo `score`, chúng ta cần thực thi câu lệnh SQL dưới đây.

```sql
# Sắp xếp giảm dần
SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
```

Dùng lệnh `EXPLAIN` phân tích câu SQL này, qua giá trị `Using filesort` ở cột `Extra`, ta thấy truy vấn chưa dùng được Covering Index.

![Kết quả EXPLAIN khi chưa có Covering Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/not-using-covering-index-demo-73bd79b3.png)

Tất nhiên điều này hoàn toàn dễ hiểu, vì lúc này chúng ta đã tạo index nào đâu!

Ở đây ta tạo một Composite Index trên hai trường `score` và `name`:

```sql
ALTER TABLE `cus_order` ADD INDEX id_score_name(score, name);
```

Tạo xong, dùng lại lệnh `EXPLAIN` để phân tích câu SQL này một lần nữa.

![Kết quả EXPLAIN khi dùng Covering Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/using-covering-index-demo-a7f0c456.png)

Thông qua `Using index` ở cột `Extra`, có thể thấy câu SQL này đã sử dụng thành công Covering Index.

Để xem giới thiệu chi tiết về lệnh `EXPLAIN`, vui lòng đọc bài viết: [Phân tích Execution Plan trong MySQL](./mysql-query-execution-plan.md).

### Composite Index (Chỉ mục kết hợp)

Việc sử dụng nhiều trường trong bảng để tạo thành một index chính là **Composite Index** (còn gọi là chỉ mục kết hợp hoặc chỉ mục nhiều cột).

Tạo Composite Index trên hai trường `score` và `name`:

```sql
ALTER TABLE `cus_order` ADD INDEX id_score_name(score, name);
```

### Nguyên tắc tiền tố ngoài cùng bên trái (Leftmost Prefix Matching)

Nguyên tắc tiền tố ngoài cùng bên trái (Leftmost Prefix Matching) chỉ ra rằng khi sử dụng Composite Index, MySQL sẽ dựa theo thứ tự các trường trong index, lần lượt khớp từ trái sang phải với các trường trong điều kiện truy vấn. Nếu điều kiện truy vấn khớp với trường ngoài cùng bên trái của index, MySQL sẽ sử dụng index đó để lọc dữ liệu, giúp nâng cao hiệu suất truy vấn.

Nguyên tắc khớp ngoài cùng bên trái sẽ tiếp tục khớp sang phải cho đến khi gặp truy vấn theo khoảng (như `>`, `<`). Đối với các truy vấn khoảng như `>=`, `<=`, `BETWEEN` và `LIKE` khớp tiền tố, việc khớp sẽ không bị dừng lại.

Giả sử có một Composite Index `(column1, column2, column3)`, toàn bộ các tiền tố từ trái sang phải của nó là `(column1)`, `(column1, column2)`, `(column1, column2, column3)` (tạo 1 Composite Index tương đương với việc tạo 3 index); mọi truy vấn chứa các nhóm cột tiền tố này đều sẽ đi qua index chứ không quét toàn bảng.

Khi dùng Composite Index, ta có thể đặt trường có độ phân biệt (selectivity) cao ở ngoài cùng bên trái, điều này cũng giúp lọc bỏ được nhiều dữ liệu hơn.

Dưới đây chúng ta minh họa nhanh hiệu quả của Leftmost Prefix Matching.

1. Tạo một bảng tên là `student`, bảng này chỉ có 3 trường là `id`, `name` và `class`.

```sql
CREATE TABLE `student` (
  `id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name_class_idx` (`name`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

2. Tiếp theo chúng ta lần lượt kiểm thử ba câu SQL khác nhau.

![Quy tắc khớp tiền tố ngoài cùng bên trái](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/leftmost-prefix-matching-rule-a8a5555c.png)

```sql
# Khớp được index
SELECT * FROM student WHERE name = 'Anne Henry';
EXPLAIN SELECT * FROM student WHERE name = 'Anne Henry' AND class = 'lIrm08RYVk';
# Không thể khớp index
SELECT * FROM student WHERE class = 'lIrm08RYVk';
```

Hãy xem thêm một câu hỏi phỏng vấn rất hay gặp: nếu có `Composite Index (a, b, c)`, thì truy vấn `a=1 AND c=1` có dùng index không? `c=1` thì sao? `b=1 AND c=1` thì sao? `b = 1 AND a = 1 AND  c = 1` thì sao?

Đừng vội xem đáp án bên dưới, hãy tự cho mình 3 phút để suy nghĩ.

1. Truy vấn `a=1 AND c=1`: Theo nguyên tắc tiền tố ngoài cùng bên trái, câu truy vấn có thể sử dụng phần tiền tố của index. Do đó, câu truy vấn này chỉ dùng index trên `a=1`, rồi mới lọc tiếp `c=1` trên kết quả thu được.
2. Truy vấn `c=1`: Do câu truy vấn không chứa cột ngoài cùng bên trái `a`, theo nguyên tắc tiền tố ngoài cùng bên trái thì toàn bộ index không thể sử dụng được.
3. Truy vấn `b=1 AND c=1`: Tương tự trường hợp thứ hai, hoàn toàn không sử dụng được index.
4. Truy vấn `b=1 AND a=1 AND c=1`: Câu truy vấn này **có thể** sử dụng được index. Khi Query Optimizer phân tích câu lệnh SQL với Composite Index, nó sẽ sắp xếp lại thứ tự các điều kiện truy vấn để tận dụng được index — sắp xếp lại `b=1` và `a=1` thành `a=1 AND b=1 AND c=1`.

Phiên bản MySQL 8.0.13 đã giới thiệu Index Skip Scan (gọi tắt là ISS), cho phép cải thiện hiệu suất truy vấn trong một số kịch bản truy vấn index nhất định. Trước khi có ISS, các truy vấn dùng Composite Index không thỏa mãn nguyên tắc tiền tố ngoài cùng bên trái sẽ thực hiện quét toàn bảng. ISS cho phép MySQL tránh quét toàn bảng trong một số trường hợp dù điều kiện truy vấn không khớp tiền tố ngoài cùng bên trái. Tuy nhiên tính năng này khá mờ nhạt, không thể so với bên Oracle, thậm chí MySQL 8.0.31 còn từng báo cáo một bug: [Bug #109145 Using index for skip scan cause incorrect result](https://bugs.mysql.com/bug.php?id=109145) (đã được sửa ở các bản sau). Cá nhân mình khuyên chỉ cần biết có sự tồn tại của tính năng này là đủ, không cần đào sâu, trong dự án thực tế cũng chưa chắc đã dùng tới.

## Index Condition Pushdown (Đẩy điều kiện xuống Index)

**Index Condition Pushdown (gọi tắt là ICP)** là một tính năng tối ưu index được cung cấp từ phiên bản **MySQL 5.6**. Nó cho phép Storage Engine trong quá trình duyệt index thực thi luôn một phần điều kiện kiểm tra của mệnh đề `WHERE`, lọc bỏ trực tiếp những bản ghi không thỏa mãn điều kiện, qua đó giảm số lần truy vấn lại bảng chính (table lookup) và nâng cao hiệu suất truy vấn.

Giả sử ta có một bảng tên `user` gồm 4 trường `id`, `username`, `zipcode` và `birthdate`, và tạo Composite Index `(zipcode, birthdate)`.

```sql
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `zipcode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `birthdate` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_zipcode_birthdate` (`zipcode`,`birthdate`) ) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8mb4;

# Truy vấn các user có zipcode là 431200 và sinh nhật vào tháng 3
SELECT * FROM user WHERE zipcode = '431200' AND MONTH(birthdate) = 3;
```

- Trước khi có Index Condition Pushdown, dù trường `zipcode` tận dụng được index để định vị nhanh các user có `zipcode = '431200'`, ta vẫn phải quay lại bảng chính lấy toàn bộ dữ liệu cho từng user tìm thấy, rồi mới kiểm tra `MONTH(birthdate) = 3`.
- Sau khi có Index Condition Pushdown, Storage Engine trong lúc dùng index `zipcode` tìm các user có `zipcode = '431200'` sẽ kiểm tra đồng thời `MONTH(birthdate) = 3`. Nhờ vậy chỉ những bản ghi thỏa mãn cả hai điều kiện mới cần quay lại bảng chính lấy dữ liệu đầy đủ, giảm đáng kể số lần table lookup.

![So sánh Index Condition Pushdown](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/index-condition-pushdown-783bf797.png)

![Minh họa trực quan Index Condition Pushdown](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/index-condition-pushdown-graphic-illustration-cbcca262.png)

Tiếp theo hãy nói về nguyên lý cụ thể của Index Condition Pushdown; trước tiên hãy xem sơ đồ kiến trúc tóm tắt của MySQL dưới đây.

![Sơ đồ kiến trúc tóm tắt MySQL](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

MySQL có thể chia đơn giản thành hai tầng: tầng Server và tầng Storage Engine. Tầng Server xử lý phân tích cú pháp, phân tích ngữ nghĩa, tối ưu hóa, cache và giao tiếp với client; còn tầng Storage Engine chịu trách nhiệm lưu trữ và đọc dữ liệu. MySQL hỗ trợ nhiều Storage Engine như InnoDB, MyISAM, Memory, v.v.

Chữ **Pushdown (đẩy xuống)** trong Index Condition Pushdown thực chất nghĩa là đẩy một phần công việc vốn thuộc trách nhiệm của tầng trên (tầng Server) xuống cho tầng dưới (tầng Storage Engine) xử lý.

Ở đây ta kết hợp nguyên lý Index Condition Pushdown để giải thích lại ví dụ đã nêu ở trên.

Trước khi có Index Condition Pushdown:

- Tầng Storage Engine trước tiên dựa vào trường index `zipcode` để tìm ra Primary Key ID của tất cả các user có `zipcode = '431200'`, sau đó thực hiện truy vấn lần hai vào bảng chính để lấy toàn bộ dữ liệu user;
- Tầng Storage Engine đẩy toàn bộ dữ liệu các user có `zipcode = '431200'` lên tầng Server, rồi tầng Server mới lọc tiếp theo điều kiện `MONTH(birthdate) = 3`.

Sau khi có Index Condition Pushdown:

- Tầng Storage Engine trước tiên dựa vào trường index `zipcode` tìm ra các user có `zipcode = '431200'`, sau đó kiểm tra trực tiếp `MONTH(birthdate) = 3` để lọc ra các Primary Key ID thỏa mãn điều kiện;
- Chỉ thực hiện truy vấn lại bảng chính dựa trên các Primary Key ID thỏa mãn điều kiện để lấy toàn bộ dữ liệu user;
- Tầng Storage Engine chỉ gửi dữ liệu của những user đạt điều kiện lên cho tầng Server.

Có thể thấy, **ngoài việc giảm số lần quay lại bảng chính (table lookup), Index Condition Pushdown còn giúp giảm lượng dữ liệu truyền tải giữa tầng Storage Engine và tầng Server.**

Cuối cùng, tổng kết phạm vi áp dụng của Index Condition Pushdown:

1. Áp dụng cho các truy vấn trên engine InnoDB và MyISAM.
2. Áp dụng cho các truy vấn phạm vi có kế hoạch thực thi (`type`) là `range`, `ref`, `eq_ref`, `ref_or_null`.
3. Đối với bảng InnoDB, chỉ áp dụng cho Non-Clustered Index. Mục tiêu của Index Condition Pushdown là giảm số lần đọc toàn bộ dòng dữ liệu, qua đó giảm thao tác I/O. Với Clustered Index của InnoDB, bản ghi đầy đủ đã được đọc vào InnoDB buffer, nên dùng ICP trong trường hợp này không giúp giảm thêm I/O.
4. Subquery (truy vấn con) không thể dùng ICP, vì subquery thường tạo bảng tạm để xử lý kết quả mà các bảng tạm này không có index.
5. Stored Procedure không thể dùng ICP, vì Storage Engine không thể gọi các stored function.

## Một số khuyến nghị sử dụng Index đúng cách

### Chọn trường phù hợp để tạo Index

- **Trường không mang giá trị `NULL`**: Dữ liệu của cột đánh index nên hạn chế tối đa giá trị `NULL`, vì cơ sở dữ liệu khó tối ưu cho các cột chứa `NULL`. Nếu một trường được truy vấn thường xuyên nhưng không thể tránh khỏi `NULL`, nên dùng các giá trị hoặc ký tự ngắn gọn, rõ ngữ nghĩa như `0`, `1`, `true`, `false` để thay thế.
- **Trường được truy vấn thường xuyên**: Những cột được tạo index phải là các cột có tần suất truy vấn rất cao.
- **Trường dùng làm điều kiện truy vấn**: Các cột xuất hiện trong điều kiện `WHERE` nên được cân nhắc đánh index.
- **Trường thường xuyên cần sắp xếp**: Index đã được sắp xếp sẵn, nên câu truy vấn có thể tận dụng thứ tự của index để tăng tốc thời gian sắp xếp.
- **Trường thường xuyên dùng để join**: Các cột thường dùng để join có thể là cột khóa ngoại (foreign key); với cột khóa ngoại không nhất thiết phải tạo ràng buộc khóa ngoại vật lý, chỉ nói rằng cột này liên quan đến quan hệ giữa các bảng. Với những cột thường xuyên tham gia truy vấn join, nên cân nhắc đánh index để tăng hiệu suất join nhiều bảng.

### Tránh làm mất hiệu lực Index

Mất hiệu lực index cũng là một trong những nguyên nhân chính gây ra truy vấn chậm (slow query). Các tình huống phổ biến khiến index mất hiệu lực gồm hai nhóm sau:

**1. Cách viết SQL xung đột với logic tầng dưới (phá vỡ tính có thứ tự của B+ Tree)**

Nhóm vấn đề này phổ biến nhất, bản chất là điều kiện truy vấn khiến B+ Tree bên dưới mất đi khả năng định vị nhanh kiểu "tìm kiếm nhị phân".

- **Vi phạm nguyên tắc Leftmost Prefix**: Bỏ qua cột đứng đầu trong Composite Index, hoặc gặp truy vấn khoảng (như `>`, `<`, `BETWEEN`, `LIKE "abc%"`) làm gián đoạn định vị chính xác cho các cột phía sau, bị hạ cấp xuống quét khoảng kết hợp lọc dữ liệu.
- **Thao tác biến đổi trên cột đánh index**: Thực hiện phép tính toán học hoặc áp dụng hàm lên cột index ở vế trái của `WHERE`, làm thay đổi giá trị logic ban đầu khiến dữ liệu trở nên mất thứ tự trên cây index.
- **Ép kiểu ngầm định (âm thầm nhưng cực kỳ nguy hiểm)**: Khi một "cột kiểu chuỗi" được so sánh với "giá trị kiểu số", MySQL sẽ mặc định bọc thêm hàm chuyển đổi kiểu dữ liệu lên cột đó, phá vỡ trực tiếp tính có thứ tự của cây index.
- **Ký tự đại diện đứng đầu trong truy vấn `LIKE` mờ**: Ví dụ `LIKE "%abc"`, tính bất định của các ký tự tiền tố khiến Optimizer không thể xác định điểm bắt đầu của khoảng quét.
- **Bẫy sắp xếp `ORDER BY`**: Cột sắp xếp không khớp index, chiều sắp xếp không nhất quán với cấu trúc index, v.v. sẽ kích hoạt thao tác sắp xếp bổ sung trên bộ nhớ hoặc đĩa (`Using filesort`).

**2. Quyết định dựa trên chi phí của Optimizer (thỏa hiệp theo chi phí I/O)**

Nhóm vấn đề này không phải do bản thân index không dùng được, mà do Query Optimizer của MySQL sau khi tính toán nhận thấy "không đi qua index thường" lại có tổng chi phí thấp hơn.

- **Dùng `SELECT *` bừa bãi khiến chi phí table lookup quá tải**: Khi truy vấn quá nhiều cột không được index bao phủ và lượng dữ liệu khớp lớn (thường trên 20%–30%), Optimizer sẽ phán đoán rằng I/O tuần tự của quét toàn bảng tốt hơn I/O ngẫu nhiên của việc quay lại bảng chính liên tục, từ đó chủ động từ bỏ index.
- **Điều kiện `OR` gây quét toàn bảng**: Chỉ cần một trong hai vế nối bởi `OR` không có index tương ứng là sẽ kích hoạt quét toàn bảng. Ngay cả khi cả hai vế đều có index, nếu chi phí dự kiến của Index Merge quá cao thì index vẫn bị bỏ qua.
- **Danh sách `IN` quá dài làm sai lệch ước lượng**: Khi độ dài danh sách `IN` vượt quá ngưỡng hệ thống (mặc định 200), Optimizer sẽ chuyển từ thăm dò chính xác (Index Dive) sang ước lượng thống kê sơ bộ, rất dễ dẫn đến tính sai chi phí thực thi nếu thông tin thống kê đã cũ.

Xem chi tiết: [Tổng hợp các tình huống mất hiệu lực Index trong MySQL](https://javaguide.cn/database/mysql/mysql-index-invalidation.html).

### Cân nhắc kỹ khi đánh Index cho các trường cập nhật thường xuyên

Dù index mang lại hiệu quả cho truy vấn nhưng chi phí bảo trì index cũng không hề nhỏ. Nếu một trường ít khi được truy vấn mà lại bị chỉnh sửa liên tục, thì càng không nên tạo index trên trường đó.

### Giới hạn số lượng Index trên mỗi bảng

Index không phải càng nhiều càng tốt; khuyến nghị mỗi bảng không quá 5 index! Index có thể tăng hiệu suất và cũng có thể làm giảm hiệu suất.

Index giúp tăng tốc truy vấn, nhưng đồng thời làm giảm tốc độ chèn và cập nhật, thậm chí trong một số trường hợp còn làm giảm hiệu suất truy vấn.

Bởi vì khi Query Optimizer lựa chọn phương án tối ưu hóa truy vấn, nó sẽ dựa trên thông tin thống kê để đánh giá từng index có khả năng dùng được nhằm tạo ra kế hoạch thực thi tốt nhất. Nếu có quá nhiều index đều có thể dùng cho truy vấn, thời gian Optimizer dùng để sinh kế hoạch thực thi sẽ tăng lên, đồng thời làm giảm hiệu năng truy vấn.

### Ưu tiên tạo Composite Index thay vì Single-Column Index

Vì index cần chiếm dụng dung lượng đĩa, có thể hiểu đơn giản là mỗi index tương ứng với một cây B+ Tree. Nếu một bảng có quá nhiều cột và quá nhiều index, khi dữ liệu đạt đến một quy mô nhất định, dung lượng đĩa mà các index chiếm dụng sẽ rất lớn và thời gian sửa đổi index cũng sẽ kéo dài. Nếu dùng Composite Index, nhiều trường nằm chung trong một index sẽ tiết kiệm được rất nhiều dung lượng đĩa và nâng cao hiệu suất thao tác chỉnh sửa dữ liệu.

### Chú ý tránh Index dư thừa (Redundant Index)

Index dư thừa là các index có chức năng giống nhau: nếu truy vấn khớp được index `(a, b)` thì chắc chắn khớp được index `(a)`, khi đó index `(a)` chính là index dư thừa. Ví dụ hai index `(name, city)` và `(name)` là dư thừa, vì bất kỳ truy vấn nào khớp được index trước đều chắc chắn khớp được index sau. Trong đa số trường hợp, nên cố gắng mở rộng index sẵn có thay vì tạo mới.

### Dùng Prefix Index thay cho Normal Index đối với các trường kiểu chuỗi

Prefix Index chỉ áp dụng với kiểu chuỗi và chiếm ít dung lượng hơn Normal Index, nên có thể cân nhắc dùng Prefix Index để thay thế Normal Index.

### Xóa bỏ các Index lâu ngày không sử dụng

Hãy xóa các index không dùng trong thời gian dài; sự tồn tại của các index không dùng tới sẽ gây hao tổn hiệu năng không cần thiết.

Từ MySQL 5.7 có thể truy vấn view `schema_unused_indexes` trong database `sys` để kiểm tra những index nào chưa từng được sử dụng.

### Biết cách phân tích xem câu SQL có sử dụng Index hay không

Chúng ta có thể dùng lệnh `EXPLAIN` để phân tích **Execution Plan (kế hoạch thực thi)** của SQL, từ đó biết được câu lệnh có dùng index hay không. Execution Plan là phương thức thực thi cụ thể của một câu lệnh SQL sau khi đã qua bước tối ưu hóa của Query Optimizer trong MySQL.

`EXPLAIN` không thực sự chạy câu lệnh liên quan, mà thông qua **Query Optimizer** phân tích câu lệnh, tìm ra phương án truy vấn tối ưu nhất và hiển thị các thông tin tương ứng.

Định dạng đầu ra của `EXPLAIN` như sau:

```sql
mysql> EXPLAIN SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | cus_order | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 997572 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

Ý nghĩa của từng cột như sau:

| **Tên cột** | **Ý nghĩa** |
| ------------- | ----------------------------------------------------------------- |
| id | Định danh thứ tự của truy vấn `SELECT` |
| select_type | Loại truy vấn tương ứng với từ khóa `SELECT` |
| table | Tên bảng được sử dụng |
| partitions | Phân vùng khớp; với bảng không phân vùng, giá trị là `NULL` |
| type | Phương thức truy cập bảng |
| possible_keys | Các index có khả năng được sử dụng |
| key | Index thực tế được sử dụng |
| key_len | Độ dài của index được chọn |
| ref | Cột hoặc hằng số được so sánh với index khi tra cứu bằng (`=`) |
| rows | Số dòng ước tính cần phải đọc |
| filtered | Tỷ lệ phần trăm số bản ghi còn lại sau khi lọc theo điều kiện bảng |
| Extra | Thông tin bổ sung |

Do giới hạn độ dài, ở đây mình chỉ giới thiệu sơ lược về Execution Plan trong MySQL; để xem chi tiết, vui lòng đọc bài viết: [Phân tích Execution Plan trong MySQL](./mysql-query-execution-plan.md).

## Đọc thêm về cấu trúc dữ liệu

Khi tìm hiểu về MySQL Index, bạn nên quay lại xem kỹ phần cấu trúc cây:

- [Giải thích chi tiết cấu trúc cây](../../cs-basics/data-structure/tree.md): So sánh Binary Search Tree, AVL, Red-Black Tree, B-Tree và B+ Tree.
- [Giải thích chi tiết Cây đỏ-đen](../../cs-basics/data-structure/red-black-tree.md): Hiểu sự đánh đổi của cây tìm kiếm tự cân bằng trong bộ nhớ, rồi đối chiếu vì sao B+ Tree phù hợp hơn cho index trên đĩa.
