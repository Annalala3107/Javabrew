---
title: Tại sao Redis sử dụng Skip List để triển khai Sorted Set?
description: Giải thích chuyên sâu lý do Redis Sorted Set (ZSet) lựa chọn Skip List thay vì Red-Black Tree hay B+ Tree, trình bày chi tiết nguyên lý cấu trúc dữ liệu Skip List, phân tích độ phức tạp thời gian và triển khai trong Redis.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Skip List,SkipList,Sorted Set,Zset,Nguyên lý Skip List,So sánh cây cân bằng,Cấu trúc dữ liệu Redis
lang: vi
sourceRef: zh-ref/database/redis/redis-skiplist.md
---

## Lời mở đầu

Trong những năm gần đây, các buổi phỏng vấn về Redis thường đề cập đến thiết kế tầng dưới của các cấu trúc dữ liệu phổ biến, trong đó có một câu hỏi phỏng vấn rất thú vị: "Tại sao tầng dưới của Sorted Set trong Redis lại sử dụng Skip List mà không dùng cây cân bằng (Balanced Tree), cây đỏ-đen (Red-Black Tree) hay B+ Tree?"

Bài viết này sẽ lấy câu hỏi phỏng vấn thường gặp tại các công ty công nghệ lớn này làm điểm xuất phát, cùng bạn tìm hiểu chi tiết về cấu trúc dữ liệu Skip List.

Nếu bạn muốn nắm nhanh trước về index nhiều tầng, độ phức tạp truy vấn và khung trả lời phỏng vấn của Skip List, bạn có thể xem trước bài [Tổng hợp câu hỏi phỏng vấn về Skip List](../../cs-basics/data-structure/skip-list.md), sau đó quay lại bài viết này để tìm hiểu phần triển khai tầng dưới của Redis ZSet.

Mạch nội dung tổng thể của bài viết được minh họa như hình dưới đây. Tác giả sẽ đi từ cách sử dụng cơ bản của Sorted Set đến phân tích và triển khai Skip List, giúp bạn hiểu sâu sắc và nắm vững cơ chế Skip List ở tầng dưới của Redis Sorted Set.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005468-6a3fe807.png)

## Ứng dụng của Skip List trong Redis

Trước hết, chúng ta cần tìm hiểu cách sử dụng Sorted Set — cấu trúc dữ liệu có sử dụng Skip List trong Redis. Redis có một cấu trúc dữ liệu rất phổ biến gọi là **Sorted Set (tập hợp có thứ tự, viết tắt là `zset`)**. Đúng như tên gọi, đây là một tập hợp vừa đảm bảo thứ tự vừa đảm bảo tính duy nhất của phần tử, vì vậy nó thường được dùng cho bảng xếp hạng và các kịch bản cần thống kê, sắp xếp.

Dưới đây chúng ta minh họa cách triển khai bảng xếp hạng thông qua dòng lệnh Redis CLI. Có thể thấy tác giả lần lượt nhập vào 3 người dùng: **xiaoming**, **xiaohong**, **xiaowang** với các giá trị **score** lần lượt là 60, 80, 60, và cuối cùng kết quả được sắp xếp giảm dần theo điểm số.

```bash

127.0.0.1:6379> zadd rankList 60 xiaoming
(integer) 1
127.0.0.1:6379> zadd rankList 80 xiaohong
(integer) 1
127.0.0.1:6379> zadd rankList 60 xiaowang
(integer) 1

# Trả về các thành viên trong khoảng chỉ số được chỉ định của Sorted Set, điểm số từ cao xuống thấp
127.0.0.1:6379> ZREVRANGE rankList 0 100 WITHSCORES
1) "xiaohong"
2) "80"
3) "xiaowang"
4) "60"
5) "xiaoming"
6) "60"
```

Lúc này, khi dùng lệnh `object` để kiểm tra cấu trúc lưu trữ của `zset`, có thể thấy Sorted Set hiện tại vẫn đang được lưu trữ bằng **ziplist (danh sách nén)**.

```bash
127.0.0.1:6379> object encoding rankList
"ziplist"
```

Do các nhà thiết kế cân nhắc việc dữ liệu Redis được lưu trữ trên bộ nhớ RAM, nên để tiết kiệm không gian bộ nhớ quý giá, khi mỗi phần tử trong Sorted Set nhỏ hơn 64 byte và số lượng phần tử ít hơn 128, Redis sẽ sử dụng `ziplist`. Giá trị mặc định của hai ngưỡng này được thiết lập thông qua hai tham số cấu hình sau:

```bash
zset-max-ziplist-value 64
zset-max-ziplist-entries 128
```

Một khi bất kỳ phần tử nào hoặc số lượng phần tử trong Sorted Set vượt quá một trong hai ngưỡng này, nó sẽ chuyển sang **skiplist** (thực tế là `dict + skiplist`, đồng thời kết hợp thêm từ điển để nâng cao hiệu suất truy xuất trực tiếp một phần tử cụ thể).

Hãy thử thêm một phần tử có độ dài lớn hơn 64 byte, ta có thể thấy cấu trúc lưu trữ tầng dưới của Sorted Set đã chuyển sang `skiplist`:

```bash
127.0.0.1:6379> zadd rankList 90 yigemingzihuichaoguo64zijiedeyonghumingchengyongyuceshitiaobiaodeshijiyunyong
(integer) 1

# Vượt quá ngưỡng, chuyển sang Skip List
127.0.0.1:6379> object encoding rankList
"skiplist"
```

Nói cách khác, ZSet có hai cách triển khai khác nhau là `ziplist` và `skiplist`. Quy tắc quyết định cấu trúc lưu trữ cụ thể như sau:

- Khi đối tượng Sorted Set thỏa mãn đồng thời cả hai điều kiện sau thì sử dụng `ziplist`:
  1. Số lượng cặp key-value mà ZSet lưu trữ ít hơn 128;
  2. Độ dài của mỗi phần tử nhỏ hơn 64 byte.
- Nếu không thỏa mãn hai điều kiện trên thì sử dụng `skiplist`.

## Tự tay cài đặt một Skip List

Để trả lời tốt hơn câu hỏi phỏng vấn nêu trên cũng như hiểu và nắm vững Skip List sâu sắc hơn, chúng ta có thể tự tay viết một Skip List đơn giản để hình dung rõ cấu trúc dữ liệu này.

Như chúng ta đã biết, danh sách liên kết có thứ tự có độ phức tạp thời gian trung bình cho thao tác thêm, tìm kiếm, xóa là **O(n)** (tăng trưởng tuyến tính), do đó một khi số lượng node đạt tới quy mô nhất định thì hiệu năng sẽ rất kém. Còn Skip List có thể được hiểu đơn giản là xây dựng thêm các tầng index (chỉ mục) trên nền danh sách liên kết gốc; thông qua việc tìm kiếm và định vị qua các tầng index này, độ phức tạp thời gian của các thao tác thêm, xóa, sửa, tìm kiếm được đưa về **O(log n)**.

Nói suông có thể hơi trừu tượng, hãy xem một ví dụ. Lấy Skip List ở hình dưới đây làm ví dụ: danh sách liên kết gốc lưu trữ có thứ tự các giá trị từ 1–10, có 2 tầng index, trong đó số lượng phần tử ở mỗi tầng index bằng một nửa số lượng phần tử ở tầng ngay bên dưới nó.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005436-095a198c.png)

Giả sử chúng ta cần tìm phần tử 6, quy trình thực hiện như sau:

1. Bắt đầu từ index tầng 2, trước tiên đi đến node 4.
2. Kiểm tra node kế tiếp của 4 là index tầng 2 của 8; giá trị này lớn hơn 6, chứng tỏ các index phía sau trên tầng 2 đều lớn hơn 6, không cần tìm tiếp sang phải nữa, ta hạ xuống tầng index bên dưới.
3. Đi xuống index tầng 1 của 4, so sánh thấy node kế tiếp của nó là 6, tìm kiếm kết thúc.

So với danh sách liên kết có thứ tự ban đầu cần tới 6 bước, Skip List nhờ xây dựng index nhiều tầng nên chúng ta chỉ mất 2 bước đã định vị trực tiếp được phần tử mục tiêu, giúp tối ưu hóa độ phức tạp tìm kiếm xuống **O(log n)**.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005524-d66751de.png)

Thao tác thêm phần tử cũng theo nguyên lý tương tự. Giả sử ta cần thêm phần tử 7 vào tập hợp có thứ tự này, khi đó ta cần thông qua Skip List tìm **giá trị lớn nhất nhỏ hơn phần tử 7** — chính là vị trí phần tử 6 trong hình dưới — chèn vào sau phần tử 6 và cập nhật liên kết cho phù hợp. Quy trình thực hiện như sau:

1. Bắt đầu từ index tầng 2, định vị đến index của phần tử 4.
2. Kiểm tra index kế tiếp của 4 là 8, hạ con trỏ index xuống tầng dưới.
3. Đến index tầng 1, thấy index kế tiếp của 4 là 6 (nhỏ hơn phần tử cần chèn 7), đẩy con trỏ tiến tới vị trí index 6.
4. Tiếp tục so sánh node kế tiếp của 6 là index 8 (lớn hơn phần tử 7), tiếp tục hạ index xuống tầng dưới.
5. Cuối cùng, ta đi đến node gốc 6, kiểm tra vị trí kế tiếp của nó (vị trí của phần tử 7 vì con trỏ không còn tầng thấp hơn để hạ xuống nữa); từ đó xác định được phần tử 6 chính là giá trị lớn nhất nhỏ hơn phần tử 7, rồi tiến hành chèn phần tử 7 vào.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005480-351cc69a.png)

Lúc này ta lại gặp một câu hỏi nữa: có cần xây dựng index cho phần tử 7 không, và độ cao của index nên là bao nhiêu?

Như đã đề cập ở trên, trường hợp lý tưởng là mỗi tầng index có số phần tử bằng một nửa tầng ngay bên dưới. Giả sử tổng cộng ta có 16 phần tử thì số lượng phần tử tương ứng ở từng tầng index sẽ là:

```bash
1. Index tầng 1: 16/2=8
2. Index tầng 2: 8/2 =4
3. Index tầng 3: 4/2=2
```

Từ đó bằng phương pháp quy nạp toán học ta suy ra:

```bash
1. Index tầng 1: 16/2=16/2^1=8
2. Index tầng 2: 8/2 => 16/2^2 =4
3. Index tầng 3: 4/2=>16/2^3=2
```

Giả sử số lượng phần tử là `n`, khi đó công thức tính số lượng phần tử `r` ở tầng index thứ `k` là:

```bash
r=n/2^k
```

Tương tự, hãy suy luận độ cao tối đa của index. Thông thường tầng index cao nhất có 2 phần tử; đặt tổng số phần tử là `n` và độ cao index là `h`, thay vào công thức trên ta có:

```bash
2= n/2^h
=> 2*2^h=n
=> 2^(h+1)=n
=> h+1=log2^n
=> h=log2^n -1
```

Vì Redis là cơ sở dữ liệu trên bộ nhớ (in-memory database), giả sử số lượng phần tử tối đa là **65536**, thay **65536** vào công thức trên ta thu được độ cao tối đa là 16. Do đó, ta nên giới hạn độ cao index tạo cho một phần tử mới được thêm vào không vượt quá 16.

Do ta muốn đảm bảo càng sát càng tốt việc mỗi tầng index phía trên có số phần tử bằng một nửa tầng bên dưới, khi cài đặt thuật toán sinh độ cao ta có thể thiết kế như sau:

1. Việc tính độ cao của Skip List bắt đầu từ danh sách liên kết gốc, tức là mặc định khi chèn một phần tử thì độ cao là 1 — nghĩa là chưa có tầng index nào, chỉ có bản thân node dữ liệu.
2. Thiết kế một phương thức sinh độ cao index `level` cho node được chèn.
3. Thực hiện một phép tính ngẫu nhiên tạo giá trị trong khoảng từ 0 đến 1.
4. Nếu số ngẫu nhiên lớn hơn 0.5 thì nâng thêm một tầng index cho phần tử hiện tại; nhờ đó ta đảm bảo xác suất tạo index tầng 1 là **50%**, đồng nghĩa trong trường hợp lý tưởng chỉ một nửa số phần tử được tạo index tầng 1.
5. Tương tự, ở các lần tung ngẫu nhiên tiếp theo, hễ giá trị lớn hơn 0.5 thì tăng độ cao index thêm 1; như vậy có thể đảm bảo xác suất tạo index tầng 2 là **25%**, tầng 3 là **12.5%**...

Quay lại ví dụ vừa rồi: sau khi chèn phần tử 7, giả sử thuật toán ngẫu nhiên trả về 2, tức là ta cần xây dựng cho nó 1 tầng index (index tầng 1):

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005505-9afaa2bb.png)

Cuối cùng là thao tác xóa. Giả sử ở đây ta muốn xóa phần tử 10, ta bắt buộc phải định vị được giá trị lớn nhất nhỏ hơn 10 ở **từng tầng** của Skip List hiện tại, vì vậy các bước thực hiện là:

1. Ở index tầng 2, node kế tiếp của 4 là 8, đẩy con trỏ tiến lên.
2. Index 8 không có node kế tiếp, tầng này không có phần tử cần xóa, hạ con trỏ trực tiếp xuống dưới.
3. Ở index tầng 1, node kế tiếp của index 8 là 10, chứng tỏ khi xóa, index tầng 1 của 8 cần ngắt liên kết con trỏ với index tầng 1 của 10 để gỡ bỏ 10.
4. Sau khi định vị xong ở index tầng 1 thì hạ con trỏ xuống dưới, gặp node kế tiếp là 9, đẩy con trỏ tiến tới 9.
5. Node kế tiếp của 9 là 10, tương tự cho nó trỏ tới `null` để xóa 10.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005503-97e7628d.png)

### Định nghĩa mẫu Node

Sau khi đã nắm được ý tưởng tổng thể, ta có thể bắt đầu cài đặt một Skip List. Trước tiên hãy định nghĩa **Node** trong Skip List. Từ phần minh họa ở trên, có thể thấy mỗi **Node** bao gồm các thành phần sau:

1. Giá trị **value** được lưu trữ.
2. Địa chỉ của node kế tiếp.
3. Các tầng index (chỉ mục đa tầng).

Để quản lý thống nhất địa chỉ node kế tiếp của **Node** và địa chỉ mà các tầng index trỏ tới, tác giả khai báo một mảng **forwards** bên trong **Node**, dùng để lưu trữ con trỏ tới node kế tiếp ở danh sách liên kết gốc cũng như ở từng tầng index.

Lấy hình dưới đây làm ví dụ: mảng **forwards** của chúng ta có độ dài là 5, trong đó **chỉ số 0** lưu địa chỉ node kế tiếp trong danh sách liên kết gốc, còn các phần tử còn lại từ dưới lên trên biểu thị con trỏ kế tiếp từ index tầng 1 đến index tầng 4.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005347-71f13c21.png)

Từ đó ta có định nghĩa mã nguồn như sau. Có thể thấy tác giả đặt độ dài cố định của mảng là 16 **(khớp với mức khuyến nghị độ cao tối đa là 16 đã tính ở trên)**, mặc định `data` bằng `-1`, độ cao tối đa `maxLevel` của node được khởi tạo bằng 1 (lưu ý giá trị `maxLevel` này biểu thị tổng độ cao của danh sách liên kết gốc cộng với các tầng index).

```java
/**
 * Độ cao tối đa của index trong Skip List là 16
 */
private static final int MAX_LEVEL = 16;

class Node {
    private int data = -1;
    private Node[] forwards = new Node[MAX_LEVEL];
    private int maxLevel = 0;

}
```

### Thêm phần tử

Sau khi định nghĩa xong Node, trước hết ta cài đặt thao tác thêm phần tử. Khi thêm phần tử, bước đầu tiên dĩ nhiên là gán **data** — ở bước này ta chỉ cần gán trực tiếp **value** truyền vào cho **data** là được.

Tiếp theo là thiết lập độ cao **maxLevel**. Ở phần trên ta đã đưa ra ý tưởng: độ cao mặc định là 1 (tức chỉ có một node ở danh sách liên kết gốc), thông qua thuật toán ngẫu nhiên cứ mỗi lần giá trị ngẫu nhiên lớn hơn 0.5 thì tăng độ cao index thêm 1, từ đó ta thu được phương thức tính độ cao `randomLevel()`:

```java
/**
 * Về mặt lý thuyết, số phần tử ở index tầng 1 nên chiếm 50% dữ liệu gốc,
 * index tầng 2 chiếm 25%, tầng 3 chiếm 12.5%, cho tới tầng cao nhất.
 * Vì xác suất thăng cấp ở mỗi tầng là 50%, nên với mỗi node mới chèn vào,
 * đều cần gọi randomLevel để sinh một số tầng hợp lý.
 * Phương thức randomLevel này sẽ sinh ngẫu nhiên một số trong khoảng 1~MAX_LEVEL, trong đó:
 * 50% xác suất trả về 1
 * 25% xác suất trả về 2
 * 12.5% xác suất trả về 3 ...
 * @return
 */
private int randomLevel() {
    int level = 1;
    while (Math.random() > PROB && level < MAX_LEVEL) {
        ++level;
    }
    return level;
}
```

Sau đó là thiết lập con trỏ kế tiếp cho **Node** sắp chèn và các tầng index của nó. Bước này phức tạp hơn một chút: giả sử độ cao của node hiện tại là 4 (tức 1 node gốc cộng 3 tầng index), ta tạo một mảng **maxOfMinArr** có độ dài 4 để duyệt và ghi nhận các node lớn nhất nhỏ hơn giá trị **value** hiện tại ở từng tầng index.

Giả sử **value** cần chèn là 5, kết quả tìm kiếm vào mảng cho thấy node tiền nhiệm ở tầng gốc, index tầng 1 và index tầng 2 đều là 4, còn ở index tầng 3 thì rỗng (head).

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005299-d0c1aeff.png)

Tiếp đó, dựa trên mảng **maxOfMinArr** này, ta xác định các node kế tiếp ở từng tầng, cho phần tử 5 mới chèn trỏ tới các node kế tiếp đó, đồng thời cập nhật **maxOfMinArr** trỏ tới 5. Kết quả như hình dưới:

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005369-df8a1b7c.png)

Chuyển thành code thì có dạng như dưới đây, rất đơn giản phải không nào? Chúng ta tiếp tục nhé:

```java
/**
 * Độ cao mặc định là 1, tức chỉ có một node đầu (head)
 */
private int levelCount = 1;

/**
 * Node ở tầng thấp nhất của Skip List, tức node đầu (head)
 */
private Node h = new Node();

public void add(int value) {
    int level = randomLevel(); // Độ cao ngẫu nhiên cho node mới

    Node newNode = new Node();
    newNode.data = value;
    newNode.maxLevel = level;

    // Mảng dùng để ghi lại node tiền nhiệm ở mỗi tầng
    Node[] update = new Node[level];
    for (int i = 0; i < level; i++) {
        update[i] = h;
    }

    Node p = h;
    // Điểm sửa then chốt: bắt đầu tìm kiếm từ tầng cao nhất hiện tại của Skip List
    for (int i = levelCount - 1; i >= 0; i--) {
        while (p.forwards[i] != null && p.forwards[i].data < value) {
            p = p.forwards[i];
        }
        // Chỉ ghi nhận node tiền nhiệm cho những tầng cần cập nhật
        if (i < level) {
            update[i] = p;
        }
    }

    // Chèn node mới
    for (int i = 0; i < level; i++) {
        newNode.forwards[i] = update[i].forwards[i];
        update[i].forwards[i] = newNode;
    }

    // Cập nhật tổng độ cao của Skip List
    if (levelCount < level) {
        levelCount = level;
    }
}
```

### Truy vấn phần tử

Logic truy vấn tương đối đơn giản: bắt đầu từ tầng index cao nhất của Skip List để định vị giá trị lớn nhất nhỏ hơn `value` cần tìm. Lấy hình dưới làm ví dụ, ta muốn tìm kiếm node 8:

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005323-5ea607cd.png)

- **Bắt đầu từ tầng cao nhất (index tầng 3)**: Con trỏ tìm kiếm `p` xuất phát từ node đầu (`head`). Ở index tầng 3, node kế tiếp `forwards[2]` của `p` (giả sử có 3 tầng, chỉ số bắt đầu từ 0) trỏ tới node `5`. Vì `5 < 8`, con trỏ `p` di chuyển sang phải tới node `5`. Node `5` trên index tầng 3 có `forwards[2]` là `null` (hoặc trỏ tới một node lớn hơn `8`, không vẽ trong hình). Việc tìm kiếm sang phải ở tầng hiện tại kết thúc, con trỏ `p` dừng lại ở node `5` và **hạ xuống index tầng 2**.
- **Ở index tầng 2**: Con trỏ `p` hiện đang ở node `5`. Node kế tiếp `forwards[1]` của `p` trỏ tới node `8`. Vì `8` không nhỏ hơn `8` (tức `8 < 8` là `false`), việc tìm kiếm sang phải ở tầng hiện tại kết thúc (`p` không dịch chuyển sang node `8`). Con trỏ `p` giữ nguyên ở node `5` và **hạ xuống index tầng 1**.
- **Ở index tầng 1**: Con trỏ `p` hiện đang ở node `5`. Node kế tiếp `forwards[0]` của `p` trỏ tới node `5` ở tầng thấp nhất. Vì `5 < 8`, con trỏ `p` dịch chuyển sang phải tới node `5` ở tầng thấp nhất. Lúc này `p` là node `5` ở tầng thấp nhất, `forwards[0]` của nó trỏ tới node `6` ở tầng thấp nhất. Vì `6 < 8`, con trỏ `p` dịch chuyển sang phải tới node `6` ở tầng thấp nhất. Lúc này `p` là node `6` ở tầng thấp nhất, `forwards[0]` của nó trỏ tới node `7` ở tầng thấp nhất. Vì `7 < 8`, con trỏ `p` dịch chuyển sang phải tới node `7` ở tầng thấp nhất. Lúc này `p` là node `7` ở tầng thấp nhất, `forwards[0]` của nó trỏ tới node `8` ở tầng thấp nhất. Vì `8` không nhỏ hơn `8` (tức `8 < 8` là `false`), việc tìm kiếm sang phải ở tầng hiện tại kết thúc. Lúc này đã duyệt xong tất cả các tầng và vòng lặp `for` kết thúc.
- **Định vị cuối cùng và kiểm tra**: Sau khi tìm kiếm qua mọi tầng, con trỏ `p` cuối cùng dừng tại node `7` ở tầng thấp nhất (index tầng 0). Đây chính là node có giá trị lớn nhất trong toàn bộ Skip List nhưng nhỏ hơn giá trị mục tiêu `8`. Kiểm tra **node kế tiếp** của node `7` (tức `p.forwards[0]`): `p.forwards[0]` trỏ tới node `8`. Kiểm tra xem `p.forwards[0].data` (giá trị của node `8`) có bằng giá trị mục tiêu `8` hay không. Điều kiện thỏa mãn (`8 == 8`), **tìm kiếm thành công, đã tìm thấy node `8`**.

Do đó, phần cài đặt code của chúng ta cũng gần như tương đồng với các bước trên: bắt đầu tìm từ tầng index cao nhất về phía trước; nếu không rỗng và nhỏ hơn giá trị cần tìm thì tiếp tục dò sang phải; gặp node không nhỏ hơn thì hạ xuống tầng dưới; cứ lặp lại như vậy cho tới khi thu được node lớn nhất trong Skip List nhỏ hơn giá trị cần tìm, rồi kiểm tra node kế tiếp của nó (`p.forwards[0]`) có bằng giá trị cần tìm hay không:

```java
public Node get(int value) {
    Node p = h; // Bắt đầu từ node đầu (head)

    // Bắt đầu từ tầng index cao nhất, hạ dần từng tầng
    for (int i = levelCount - 1; i >= 0; i--) {
        // Tìm sang phải ở tầng hiện tại cho đến khi p.forwards[i] là null
        // hoặc p.forwards[i].data lớn hơn hoặc bằng giá trị mục tiêu value
        while (p.forwards[i] != null && p.forwards[i].data < value) {
            p = p.forwards[i]; // Dịch chuyển sang phải
        }
        // Lúc này p.forwards[i] là null, hoặc p.forwards[i].data >= value
        // tức là p là node lớn nhất ở tầng hiện tại nhỏ hơn value (nếu tồn tại node như vậy)
    }

    // Sau khi tìm qua mọi tầng, p hiện là node trong danh sách liên kết gốc (index tầng 0)
    // lớn nhất mà nhỏ hơn giá trị mục tiêu value (hoặc là node head nếu mọi phần tử đều >= value)

    // Kiểm tra xem node tiếp theo của p trong danh sách liên kết gốc có phải giá trị mục tiêu không
    if (p.forwards[0] != null && p.forwards[0].data == value) {
        return p.forwards[0]; // Đã tìm thấy, trả về node đó
    }

    return null; // Không tìm thấy
}
```

### Xóa phần tử

Cuối cùng là logic xóa: ta cần tìm node lớn nhất nhỏ hơn node cần xóa ở tất cả các tầng. Giả sử ta muốn xóa 10:

1. Index tầng 3 tìm được giá trị lớn nhất nhỏ hơn 10 là 5, tiếp tục hạ xuống dưới.
2. Index tầng 2 bắt đầu tìm từ index 5, thấy giá trị lớn nhất nhỏ hơn 10 là 8, tiếp tục hạ xuống dưới.
3. Tương tự ở index tầng 1 thu được 8, tiếp tục hạ xuống dưới.
4. Ở tầng node gốc tìm được 9.
5. Bắt đầu từ tầng index cao nhất, kiểm tra từng node nhỏ hơn 10 xem node kế tiếp của nó có phải là 10 không; nếu bằng 10 thì cho node đó trỏ tới node kế tiếp của 10, để node 10 cùng các tham chiếu index của nó được GC thu hồi.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005350-e88ca7ec.png)

```java
/**
 * Xóa
 *
 * @param value
 */
public void delete(int value) {
    Node p = h;
    // Tìm node lớn nhất nhỏ hơn value ở từng tầng
    Node[] updateArr = new Node[levelCount];
    for (int i = levelCount - 1; i >= 0; i--) {
        while (p.forwards[i] != null && p.forwards[i].data < value) {
            p = p.forwards[i];
        }
        updateArr[i] = p;
    }
    // Kiểm tra node tiếp theo ở tầng gốc có bằng value không; nếu bằng tức là tồn tại giá trị cần xóa
    if (p.forwards[0] != null && p.forwards[0].data == value) {
        // Bắt đầu từ tầng index cao nhất, kiểm tra node kế tiếp có bằng value không; nếu bằng thì trỏ sang node kế tiếp của value
        for (int i = levelCount - 1; i >= 0; i--) {
            if (updateArr[i].forwards[i] != null && updateArr[i].forwards[i].data == value) {
                updateArr[i].forwards[i] = updateArr[i].forwards[i].forwards[i];
            }
        }
    }

    // Kiểm tra từ tầng cao nhất xem có tầng index nào rỗng không; nếu rỗng thì giảm số tầng đi 1
    while (levelCount > 1 && h.forwards[levelCount - 1] == null) {
        levelCount--;
    }

}
```

### Mã nguồn đầy đủ và kiểm thử

Mã nguồn hoàn chỉnh như sau, bạn đọc có thể tự tham khảo:

```java
public class SkipList {

    /**
     * Độ cao tối đa của index trong Skip List là 16
     */
    private static final int MAX_LEVEL = 16;

    /**
     * Xác suất mỗi node được thêm một tầng index là 1/2
     */
    private static final float PROB = 0.5f;

    /**
     * Độ cao mặc định là 1, tức chỉ có một node đầu (head)
     */
    private int levelCount = 1;

    /**
     * Node ở tầng thấp nhất của Skip List, tức node đầu (head)
     */
    private Node h = new Node();

    public SkipList() {
    }

    public class Node {

        private int data = -1;
        /**
         *
         */
        private Node[] forwards = new Node[MAX_LEVEL];
        private int maxLevel = 0;

        @Override
        public String toString() {
            return "Node{"
                    + "data=" + data
                    + ", maxLevel=" + maxLevel
                    + '}';
        }
    }

    public void add(int value) {
        int level = randomLevel(); // Độ cao ngẫu nhiên cho node mới

        Node newNode = new Node();
        newNode.data = value;
        newNode.maxLevel = level;

        // Mảng dùng để ghi lại node tiền nhiệm ở mỗi tầng
        Node[] update = new Node[level];
        for (int i = 0; i < level; i++) {
            update[i] = h;
        }

        Node p = h;
        // Điểm sửa then chốt: bắt đầu tìm kiếm từ tầng cao nhất hiện tại của Skip List
        for (int i = levelCount - 1; i >= 0; i--) {
            while (p.forwards[i] != null && p.forwards[i].data < value) {
                p = p.forwards[i];
            }
            // Chỉ ghi nhận node tiền nhiệm cho những tầng cần cập nhật
            if (i < level) {
                update[i] = p;
            }
        }

        // Chèn node mới
        for (int i = 0; i < level; i++) {
            newNode.forwards[i] = update[i].forwards[i];
            update[i].forwards[i] = newNode;
        }

        // Cập nhật tổng độ cao của Skip List
        if (levelCount < level) {
            levelCount = level;
        }
    }

    /**
     * Về mặt lý thuyết, số phần tử ở index tầng 1 nên chiếm 50% dữ liệu gốc,
     * index tầng 2 chiếm 25%, tầng 3 chiếm 12.5%, cho tới tầng cao nhất.
     * Vì xác suất thăng cấp ở mỗi tầng là 50%, nên với mỗi node mới chèn vào,
     * đều cần gọi randomLevel để sinh một số tầng hợp lý. Phương thức randomLevel
     * này sẽ sinh ngẫu nhiên một số trong khoảng 1~MAX_LEVEL, trong đó:
     * 50% xác suất trả về 1, 25% xác suất trả về 2, 12.5% xác suất trả về 3 ...
     *
     * @return
     */
    private int randomLevel() {
        int level = 1;
        while (Math.random() > PROB && level < MAX_LEVEL) {
            ++level;
        }
        return level;
    }

    public Node get(int value) {
        Node p = h;
        // Tìm node lớn nhất nhỏ hơn value
        for (int i = levelCount - 1; i >= 0; i--) {
            while (p.forwards[i] != null && p.forwards[i].data < value) {
                p = p.forwards[i];
            }
        }
        // Nếu node tiếp theo của p bằng value thì trả về trực tiếp
        if (p.forwards[0] != null && p.forwards[0].data == value) {
            return p.forwards[0];
        }

        return null;
    }

    /**
     * Xóa
     *
     * @param value
     */
    public void delete(int value) {
        Node p = h;
        // Tìm node lớn nhất nhỏ hơn value ở từng tầng
        Node[] updateArr = new Node[levelCount];
        for (int i = levelCount - 1; i >= 0; i--) {
            while (p.forwards[i] != null && p.forwards[i].data < value) {
                p = p.forwards[i];
            }
            updateArr[i] = p;
        }
        // Kiểm tra node tiếp theo ở tầng gốc có bằng value không; nếu bằng tức là tồn tại giá trị cần xóa
        if (p.forwards[0] != null && p.forwards[0].data == value) {
            // Bắt đầu từ tầng index cao nhất, kiểm tra node kế tiếp có bằng value không; nếu bằng thì trỏ sang node kế tiếp của value
            for (int i = levelCount - 1; i >= 0; i--) {
                if (updateArr[i].forwards[i] != null && updateArr[i].forwards[i].data == value) {
                    updateArr[i].forwards[i] = updateArr[i].forwards[i].forwards[i];
                }
            }
        }

        // Kiểm tra từ tầng cao nhất xem có tầng index nào rỗng không; nếu rỗng thì giảm số tầng đi 1
        while (levelCount > 1 && h.forwards[levelCount - 1] == null) {
            levelCount--;
        }

    }

    public void printAll() {
        Node p = h;
        // Duyệt dựa trên tầng thấp nhất không phải index; chừng nào node kế tiếp khác null thì in ra node hiện tại và tiến tới node kế tiếp
        while (p.forwards[0] != null) {
            System.out.println(p.forwards[0]);
            p = p.forwards[0];
        }

    }
}

```

Mã kiểm thử:

```java
public static void main(String[] args) {
        SkipList skipList = new SkipList();
        for (int i = 0; i < 24; i++) {
            skipList.add(i);
        }

        System.out.println("********** Kết quả thêm **********");
        skipList.printAll();

        SkipList.Node node = skipList.get(22);
        System.out.println("********** Kết quả truy vấn:" + node+" **********");

        skipList.delete(22);
        System.out.println("********** Kết quả xóa **********");
        skipList.printAll();


    }
```

**Đặc điểm của Skip List trong Redis**:

1. Sử dụng **danh sách liên kết đôi (Doubly Linked List)** — khác với ví dụ ở trên, nó có thêm một con trỏ lùi (`backward pointer`). Chủ yếu dùng để đơn giản hóa thao tác; ví dụ khi xóa một phần tử cũng cần tìm node tiền nhiệm của phần tử đó, có con trỏ lùi sẽ rất thuận tiện.
2. Giá trị `score` có thể trùng lặp; nếu `score` giống nhau thì sắp xếp theo thứ tự từ điển dựa vào `ele` (giá trị lưu trong node, có kiểu `sds`).
3. Số tầng tối đa mặc định mà Skip List trong Redis cho phép là 32, được định nghĩa trong mã nguồn qua hằng số `ZSKIPLIST_MAXLEVEL`.

## So sánh với ba cấu trúc dữ liệu còn lại

Cuối cùng, hãy quay lại trả lời câu hỏi phỏng vấn ở đầu bài viết: "Tại sao tầng dưới của Sorted Set trong Redis lại sử dụng Skip List mà không dùng cây cân bằng (Balanced Tree), cây đỏ-đen (Red-Black Tree) hay B+ Tree?"

### Cây cân bằng vs. Skip List

Trước hết hãy nói về phép so sánh với cây cân bằng, thường được gọi là **cây AVL (AVL Tree)**. Đây là một cây nhị phân cân bằng chặt chẽ, bắt buộc phải thỏa mãn điều kiện cân bằng (chênh lệch chiều cao giữa cây con trái và cây con phải của mọi node không vượt quá 1, tức hệ số cân bằng nằm trong khoảng `[-1, 1]`). Độ phức tạp thời gian cho thêm, xóa và tìm kiếm của cây cân bằng cũng giống Skip List đều là **O(log n)**.

Đối với truy vấn theo khoảng (range query), cây AVL cũng có thể dùng cách duyệt trung thứ tự (in-order traversal) để đạt hiệu quả tương đương Skip List. Tuy nhiên, mỗi thao tác thêm hoặc xóa trên cây AVL đều phải đảm bảo sự cân bằng tuyệt đối giữa các nhánh trái và phải của toàn bộ cây — cứ hễ mất cân bằng là phải thực hiện các phép xoay để duy trì cân bằng, quá trình này khá tốn thời gian.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005312-838df80e.png)

Mục đích ban đầu khi Skip List ra đời chính là để khắc phục những nhược điểm của cây cân bằng, điều này được tác giả phát minh ra Skip List trình bày chi tiết trong bài báo [《Skip lists: a probabilistic alternative to balanced trees》](https://15721.courses.cs.cmu.edu/spring2018/papers/08-oltpindexes1/pugh-skiplists-cacm1990.pdf):

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/skiplist-a-probabilistic-alternative-to-balanced-98c9963d.png)

> Skip lists are a data structure that can be used in place of balanced trees. Skip lists use probabilistic balancing rather than strictly enforced balancing and as a result the algorithms for insertion and deletion in skip lists are much simpler and significantly faster than equivalent algorithms for balanced trees.
>
> Skip List là một cấu trúc dữ liệu có thể dùng để thay thế cho cây cân bằng. Skip List sử dụng cơ chế cân bằng theo xác suất thay vì cân bằng cưỡng chế chặt chẽ, nhờ vậy các thuật toán chèn và xóa trong Skip List đơn giản hơn nhiều và nhanh hơn đáng kể so với các thuật toán tương đương trên cây cân bằng.

Dưới đây tác giả cũng trích đoạn mã cốt lõi cho thao tác chèn của cây AVL. Có thể thấy mỗi lần thêm phần tử đều phải đệ quy để định vị vị trí chèn, sau đó lại phải quay lui ngược lên node gốc để kiểm tra xem từng node dọc đường đi có bị mất cân bằng hay không, rồi mới điều chỉnh thông qua việc xoay node.

```java
// Thêm phần tử mới (key, value) vào cây tìm kiếm nhị phân
public void add(K key, V value) {
    root = add(root, key, value);
}

// Chèn phần tử (key, value) vào cây tìm kiếm nhị phân có gốc tại node, thuật toán đệ quy
// Trả về gốc của cây tìm kiếm nhị phân sau khi chèn node mới
private Node add(Node node, K key, V value) {

    if (node == null) {
        size++;
        return new Node(key, value);
    }

    if (key.compareTo(node.key) < 0)
        node.left = add(node.left, key, value);
    else if (key.compareTo(node.key) > 0)
        node.right = add(node.right, key, value);
    else // key.compareTo(node.key) == 0
        node.value = value;

    node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));

    int balanceFactor = getBalanceFactor(node);

    // Dạng LL cần xoay phải
    if (balanceFactor > 1 && getBalanceFactor(node.left) >= 0) {
        return rightRotate(node);
    }

    // Mất cân bằng dạng RR cần xoay trái
    if (balanceFactor < -1 && getBalanceFactor(node.right) <= 0) {
        return leftRotate(node);
    }

    // Dạng LR cần xoay trái thành dạng LL trước, rồi mới xoay phải
    if (balanceFactor > 1 && getBalanceFactor(node.left) < 0) {
        node.left = leftRotate(node.left);
        return rightRotate(node);
    }

    // Dạng RL
    if (balanceFactor < -1 && getBalanceFactor(node.right) > 0) {
        node.right = rightRotate(node.right);
        return leftRotate(node);
    }
    return node;
}
```

### Cây đỏ-đen vs. Skip List

Cây đỏ-đen (Red-Black Tree) cũng là một cây tìm kiếm nhị phân tự cân bằng; hiệu năng tìm kiếm của nó hơi kém hơn cây AVL một chút, nhưng hiệu quả thêm và xóa lại cao hơn. Độ phức tạp thời gian cho thêm, xóa và tìm kiếm của cây đỏ-đen cũng giống Skip List đều là **O(log n)**.

Cây đỏ-đen là một **cây cân bằng đen**, tức là từ bất kỳ node nào đi tới bất kỳ node lá nào bên dưới nó, số lượng node đen đi qua là như nhau. Khi thực hiện thao tác chèn, cần thông qua phép xoay và tô màu (chuyển đổi đỏ-đen) để đảm bảo cân bằng đen. Tuy nhiên, chi phí duy trì cân bằng của nó nhỏ hơn so với cây AVL. Để tìm hiểu chi tiết về cây đỏ-đen, có thể xem bài viết này: [Cây đỏ-đen](https://javaguide.cn/cs-basics/data-structure/red-black-tree.html).

So với cây đỏ-đen, Skip List dễ cài đặt hơn. Hơn nữa, với thao tác tìm kiếm dữ liệu theo khoảng, hiệu năng của cây đỏ-đen không cao bằng Skip List.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005709-eef796b6.png)

Đoạn mã cốt lõi cho thao tác thêm phần tử của cây đỏ-đen như dưới đây, bạn đọc có thể tự tham khảo thêm:

```java
private Node < K, V > add(Node < K, V > node, K key, V val) {

    if (node == null) {
        size++;
        return new Node(key, val);

    }

    if (key.compareTo(node.key) < 0) {
        node.left = add(node.left, key, val);
    } else if (key.compareTo(node.key) > 0) {
        node.right = add(node.right, key, val);
    } else {
        node.val = val;
    }

    // Node con trái không đỏ, node con phải đỏ -> xoay trái
    if (isRed(node.right) && !isRed(node.left)) {
        node = leftRotate(node);
    }

    // Hai liên kết đỏ liên tiếp bên trái -> xoay phải
    if (isRed(node.left) && isRed(node.left.left)) {
        node = rightRotate(node);
    }

    // Đảo màu
    if (isRed(node.left) && isRed(node.right)) {
        flipColors(node);
    }

    return node;
}
```

### B+ Tree vs. Skip List

Chắc hẳn những ai đã sử dụng MySQL đều biết đến cấu trúc dữ liệu B+ Tree. B+ Tree là một cấu trúc dữ liệu phổ biến với các đặc điểm sau:

1. **Cấu trúc cây đa nhánh**: Đây là một cây đa nhánh, mỗi node có thể chứa nhiều node con, làm giảm chiều cao của cây và mang lại hiệu quả truy vấn cao.
2. **Hiệu quả lưu trữ cao**: Các node không phải node lá lưu nhiều key, còn node lá lưu value, giúp mỗi node chứa được nhiều key hơn và nâng cao hiệu quả khi truy vấn theo khoảng dựa trên index.
3. **Tính cân bằng**: Cây cân bằng tuyệt đối, tức là độ cao của các nhánh gần như đồng đều, đảm bảo độ phức tạp tìm kiếm và chèn là **O(log n)**.
4. **Truy cập tuần tự**: Các node lá được liên kết với nhau bằng con trỏ danh sách liên kết, cho hiệu năng vượt trội khi truy vấn theo khoảng.
5. **Phân bố dữ liệu đồng đều**: Khi chèn vào B+ Tree có thể dẫn đến tái phân bố dữ liệu, giúp dữ liệu phân bố đều trên toàn cây, đảm bảo hiệu quả truy vấn khoảng và xóa.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005649-d3798b6b.png)

Do đó, B+ Tree phù hợp hơn làm cấu trúc index thường dùng trong các hệ quản trị cơ sở dữ liệu và hệ thống tập tin trên đĩa, với tư tưởng cốt lõi là dùng ít thao tác I/O nhất có thể để định vị được nhiều chỉ mục nhất nhằm lấy dữ liệu truy vấn. Còn đối với một cơ sở dữ liệu trên bộ nhớ (in-memory database) như Redis, điều này không phải mối bận tâm chính: vì Redis lưu dữ liệu trên RAM nên không lưu khối lượng dữ liệu khổng lồ như lưu trên đĩa, do đó phần index không cần phải bảo trì nghiêm ngặt theo kiểu B+ Tree mà chỉ cần duy trì ngẫu nhiên theo xác suất là đủ, lại tiết kiệm bộ nhớ. Hơn nữa, khi triển khai `zset` bằng Skip List thì đơn giản hơn so với B+ Tree: lúc chèn chỉ cần đi theo index để đưa dữ liệu vào đúng vị trí trong danh sách liên kết rồi sinh ngẫu nhiên một độ cao index nhất định, không cần phải tách node (split) hay gộp node (merge) khi bị mất cân bằng như B+ Tree.

### Lý do được chính tác giả Redis đưa ra

Tất nhiên, chúng ta cũng có thể xem trực tiếp những lý do do chính tác giả của Redis đưa ra:

> There are a few reasons:
> 1. They are not very memory intensive. It's up to you basically. Changing parameters about the probability of a node to have a given number of levels will make then less memory intensive than btrees.
> 2. A sorted set is often target of many ZRANGE or ZREVRANGE operations, that is, traversing the skip list as a linked list. With this operation the cache locality of skip lists is at least as good as with other kind of balanced trees.
> 3. They are simpler to implement, debug, and so forth. For instance thanks to the skip list simplicity I received a patch (already in Redis master) with augmented skip lists implementing ZRANK in O(log(N)). It required little changes to the code.

Dịch sang tiếng Việt có nghĩa là:

> Có một vài lý do:
>
> 1. Chúng không quá tốn bộ nhớ. Điều này cơ bản tùy thuộc vào bạn. Việc thay đổi các tham số xác suất để một node có số tầng nhất định sẽ giúp chúng tiêu tốn ít bộ nhớ hơn B-Tree.
>
> 2. Sorted Set thường là mục tiêu của rất nhiều thao tác `ZRANGE` hoặc `ZREVRANGE`, tức là duyệt Skip List như một danh sách liên kết. Với thao tác này, tính cục bộ bộ nhớ đệm (cache locality) của Skip List ít nhất cũng tốt ngang với các loại cây cân bằng khác.
>
> 3. Chúng dễ cài đặt, dễ gỡ lỗi (debug) hơn và nhiều lợi ích khác. Ví dụ, nhờ sự đơn giản của Skip List, tôi đã nhận được một bản vá (đã được đưa vào nhánh chính của Redis) sử dụng Skip List mở rộng để triển khai `ZRANK` với độ phức tạp O(log(N)), và nó chỉ đòi hỏi sửa đổi rất ít mã nguồn.

## Tổng kết

Bài viết này đã dành nhiều dung lượng để giới thiệu nguyên lý hoạt động và cách cài đặt Skip List, giúp bạn đọc làm quen sâu hơn với ưu nhược điểm của cấu trúc dữ liệu Skip List, sau đó kết hợp so sánh đặc điểm thao tác của từng cấu trúc dữ liệu khác nhau nhằm giúp bạn trả lời tốt hơn câu hỏi phỏng vấn này. Khi học và tự cài đặt để hiểu Skip List, bạn nên kết hợp đặt bút mô phỏng trên giấy từng bước thêm, xóa, sửa và tìm kiếm để nắm vững quy trình chi tiết.

## Đọc thêm về cấu trúc dữ liệu

Nếu muốn ôn nhanh Skip List dưới góc độ phỏng vấn, bạn có thể xem [Tổng hợp câu hỏi phỏng vấn về Skip List](../../cs-basics/data-structure/skip-list.md). Nếu muốn so sánh thêm các cấu trúc khác phía sau Redis ZSet, bạn cũng có thể ôn lại [Giải thích chi tiết Cây đỏ-đen](../../cs-basics/data-structure/red-black-tree.md) và [Tổng hợp câu hỏi phỏng vấn về Hash Table](../../cs-basics/data-structure/hash-table.md).

## Tài liệu tham khảo

- Tại sao Redis sử dụng skiplist mà không dùng red-black tree?: <https://www.zhihu.com/question/20202931/answer/16086538>
- Skip List (Bài viết chi tiết về Skip List): <https://www.jianshu.com/p/9d8296562806>
- Giải thích chi tiết đối tượng Redis và cấu trúc dữ liệu tầng dưới: <https://blog.csdn.net/shark_chili3007/article/details/104171986>
- Redis Sorted Set: <https://www.runoob.com/redis/redis-sorted-sets.html>
- So sánh giữa Cây đỏ-đen và Skip List: <https://zhuanlan.zhihu.com/p/576984787>
- Tại sao ZSet của Redis dùng Skip List mà không dùng B+ Tree?: <https://blog.csdn.net/f80407515/article/details/129136998>
