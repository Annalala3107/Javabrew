---
title: Một số bài toán thuật toán danh sách liên kết thường gặp
description: Tuyển chọn tư duy và hiện thực cho các bài toán danh sách liên kết tần suất cao, bao gồm cộng hai số, đảo ngược, phát hiện chu trình, nhấn mạnh xử lý trường hợp biên và phân tích độ phức tạp.
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: thuật toán danh sách liên kết,cộng hai số,đảo ngược danh sách liên kết,phát hiện chu trình,hợp nhất danh sách liên kết,phân tích độ phức tạp
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/linkedlist-algorithm-problems.md
---

<!-- markdownlint-disable MD024 -->

## 1. Cộng hai số (Add Two Numbers)

### Mô tả bài toán

> LeetCode: Cho hai danh sách liên kết không rỗng đại diện cho hai số nguyên không âm. Các chữ số được lưu trữ theo thứ tự đảo ngược, và mỗi node chỉ chứa một chữ số duy nhất. Hãy cộng hai số này và trả về kết quả dưới dạng một danh sách liên kết mới.
>
> Bạn có thể giả định rằng ngoài số 0, cả hai số đều không bắt đầu bằng số 0.

Ví dụ:

```plain
Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)
Output: 7 -> 0 -> 8
Giải thích: 342 + 465 = 807
```

### Phân tích bài toán

Đường dẫn lời giải chi tiết chính thức trên LeetCode:

<https://leetcode-cn.com/problems/add-two-numbers/solution/>

> Khi cần thao tác trên node đầu (head node), hãy cân nhắc tạo một node giả lập (dummy node), sử dụng `dummy->next` để đại diện cho head node thực sự. Cách làm này giúp tránh phải xử lý trường hợp biên phức tạp khi head node bị null.

Chúng ta sử dụng một biến để theo dõi số nhớ (carry), và bắt đầu mô phỏng quá trình cộng từng chữ số từ đầu danh sách liên kết chứa các chữ số có trọng số nhỏ nhất (chữ số hàng đơn vị).

![Hình 1, Trực quan hóa phương pháp cộng hai số: 342 + 465 = 807, mỗi node chứa một chữ số và các chữ số được lưu theo thứ tự đảo ngược.](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/34910956-b0579be2.png)

### Lời giải (Solution)

**Trước tiên chúng ta bắt đầu cộng từ các chữ số có trọng số thấp nhất, tức là phần đầu của danh sách l1 và l2. Lưu ý cần phải tính đến trường hợp có nhớ!**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
 //https://leetcode-cn.com/problems/add-two-numbers/description/
class Solution {
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummyHead = new ListNode(0);
    ListNode p = l1, q = l2, curr = dummyHead;
    // carry biểu thị số nhớ
    int carry = 0;
    while (p != null || q != null) {
        int x = (p != null) ? p.val : 0;
        int y = (q != null) ? q.val : 0;
        int sum = carry + x + y;
        // Số nhớ
        carry = sum / 10;
        // Giá trị của node mới là sum % 10
        curr.next = new ListNode(sum % 10);
        curr = curr.next;
        if (p != null) p = p.next;
        if (q != null) q = q.next;
    }
    if (carry > 0) {
        curr.next = new ListNode(carry);
    }
    return dummyHead.next;
}
}
```

## 2. Đảo ngược danh sách liên kết (Reverse Linked List)

### Mô tả bài toán

> Kiếm chỉ Offer: Nhập vào một danh sách liên kết, sau khi đảo ngược danh sách liên kết đó, hãy in ra toàn bộ phần tử của danh sách.

![Đảo ngược danh sách liên kết](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/81431871-2a45237b.png)

### Phân tích bài toán

Bài toán thuật toán này, nói một cách dễ hiểu: làm thế nào để node phía sau trỏ ngược lại node phía trước! Trong đoạn mã bên dưới, một node `next` được định nghĩa để lưu trữ node chuẩn bị được đảo ngược lên đầu danh sách, nhằm ngăn danh sách liên kết bị "đứt gãy".

### Lời giải (Solution)

```java
public class ListNode {
  int val;
  ListNode next = null;

  ListNode(int val) {
    this.val = val;
  }
}
```

```java
/**
 *
 * @author Snailclimb
 * @date 19 tháng 9, 2018
 * @Description: Đảo ngược danh sách liên kết đơn
 */
public class Solution {

  public ListNode ReverseList(ListNode head) {

    ListNode next = null;
    ListNode pre = null;

    while (head != null) {
      // Lưu lại node sắp được đảo ngược lên đầu
      next = head.next;
      // Trỏ node sắp đảo ngược về node phía trước đã được đảo ngược (Ghi chú: lần đảo ngược đầu tiên sẽ trỏ về null)
      head.next = pre;
      // Node trước đó đã được đảo ngược lên phần đầu
      pre = head;
      // Tiếp tục đi về phía đuôi danh sách liên kết
      head = next;
    }
    return pre;
  }

}
```

Phương thức kiểm thử:

```java
  public static void main(String[] args) {

    ListNode a = new ListNode(1);
    ListNode b = new ListNode(2);
    ListNode c = new ListNode(3);
    ListNode d = new ListNode(4);
    ListNode e = new ListNode(5);
    a.next = b;
    b.next = c;
    c.next = d;
    d.next = e;
    new Solution().ReverseList(a);
    while (e != null) {
      System.out.println(e.val);
      e = e.next;
    }
  }
```

Đầu ra:

```plain
5
4
3
2
1
```

## 3. Node thứ k tính từ cuối danh sách liên kết (Kth Node From End of List)

### Mô tả bài toán

> Kiếm chỉ Offer: Nhập vào một danh sách liên kết, in ra node thứ k tính từ cuối danh sách liên kết đó.

### Phân tích bài toán

> **Node thứ k tính từ cuối danh sách liên kết chính là node thứ (L - K + 1) tính từ đầu danh sách; nắm được điểm mấu chốt này, bài toán cơ bản coi như đã giải quyết xong!**

Đầu tiên dùng hai node/con trỏ: một con trỏ `node1` chạy trước, sau khi `node1` chạy được `k - 1` node thì con trỏ `node2` bắt đầu chạy. Khi `node1` chạy đến node cuối cùng thì vị trí mà `node2` đang trỏ tới chính là node thứ k tính từ cuối, tức là node thứ (L - K + 1) tính từ đầu.

### Lời giải (Solution)

```java
/*
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/

// Độ phức tạp thời gian O(n), chỉ cần duyệt một lần
// https://www.nowcoder.com/practice/529d3ae5a407492994ad2a246518148a?tpId=13&tqId=11167&tPage=1&rp=1&ru=/ta/coding-interviews&qru=/ta/coding-interviews/question-ranking
public class Solution {
  public ListNode FindKthToTail(ListNode head, int k) {
    // Nếu danh sách liên kết rỗng hoặc k nhỏ hơn bằng 0
    if (head == null || k <= 0) {
      return null;
    }
    // Khai báo hai node cùng trỏ tới head node
    ListNode node1 = head, node2 = head;
    // Ghi nhận số lượng node
    int count = 0;
    // Ghi nhận giá trị k, sẽ dùng ở phía sau
    int index = k;
    // Con trỏ node1 chạy trước và đếm số node; sau khi node1 chạy được k - 1 node, node2 bắt đầu chạy
    // Khi node1 chạy tới cuối cùng, node2 sẽ trỏ tới node thứ k tính từ cuối
    while (node1 != null) {
      node1 = node1.next;
      count++;
      if (k < 1) {
        node2 = node2.next;
      }
      k--;
    }
    // Nếu tổng số node nhỏ hơn vị trí thứ k tính từ cuối cần tìm, trả về null
    if (count < index)
      return null;
    return node2;

  }
}
```

## 4. Xóa node thứ N tính từ cuối danh sách liên kết (Remove Nth Node From End of List)

> LeetCode: Cho một danh sách liên kết, xóa node thứ n tính từ cuối danh sách và trả về head node của danh sách liên kết.

**Ví dụ:**

```plain
Cho danh sách liên kết: 1->2->3->4->5, và n = 2.

Sau khi xóa node thứ hai tính từ cuối, danh sách liên kết trở thành 1->2->3->5.

```

**Ghi chú:**

Đảm bảo giá trị `n` đưa vào luôn hợp lệ.

**Nâng cao:**

Bạn có thể thử hiện thực giải thuật chỉ với một lượt quét (one-pass) không?

Bài toán này có lời giải chi tiết trên LeetCode, có thể tham khảo trực tiếp trên LeetCode.

### Phân tích bài toán

Chúng ta nhận thấy vấn đề này có thể đơn giản hóa thành một bài toán khác: xóa node thứ (L - n + 1) tính từ đầu danh sách, trong đó L là độ dài của danh sách liên kết. Chỉ cần tìm được độ dài L của danh sách, vấn đề này sẽ được giải quyết rất dễ dàng.

![Hình 1. Xóa phần tử thứ L - n + 1 trong danh sách liên kết](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/94354387-f7f7748c.png)

### Lời giải (Solution)

**Phương pháp duyệt hai lần (Two-pass):**

Đầu tiên chúng ta thêm một **node giả lập (dummy node)** làm node bổ trợ ở đầu danh sách. Node giả lập giúp đơn giản hóa các trường hợp biên đặc biệt, ví dụ như danh sách chỉ có đúng một node, hoặc cần xóa chính head node. Trong lượt duyệt đầu tiên, ta tìm độ dài L của danh sách. Sau đó thiết lập một con trỏ trỏ tới node giả lập và di chuyển nó duyệt danh sách cho đến khi tới node thứ (L - n). **Chúng ta liên kết lại con trỏ `next` của node thứ (L - n) trỏ tới node thứ (L - n + 2) để hoàn tất thuật toán.**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
// https://leetcode-cn.com/problems/remove-nth-node-from-end-of-list/description/
public class Solution {
  public ListNode removeNthFromEnd(ListNode head, int n) {
    // Node giả lập (dummy node), dùng để đơn giản hóa các trường hợp biên như danh sách chỉ có 1 node hoặc xóa head node
    ListNode dummy = new ListNode(0);
    // Node giả lập trỏ tới head node
    dummy.next = head;
    // Lưu độ dài danh sách liên kết
    int length = 0;
    ListNode len = head;
    while (len != null) {
      length++;
      len = len.next;
    }
    length = length - n;
    ListNode target = dummy;
    // Tìm node tại vị trí L - n
    while (length > 0) {
      target = target.next;
      length--;
    }
    // Nối con trỏ next của node thứ (L - n) sang node thứ (L - n + 2)
    target.next = target.next.next;
    return dummy.next;
  }
}
```

**Nâng cao — Phương pháp duyệt một lần (One-pass):**

> Node thứ N tính từ cuối danh sách liên kết chính là node thứ (L - n + 1) tính từ đầu danh sách.

Thực chất phương pháp này hoàn toàn đồng nhất với tư tưởng tìm "Node thứ k tính từ cuối danh sách liên kết" ở mục 3 phía trên. **Tư tưởng cơ bản là:** Khai báo hai node `node1`, `node2`; node `node1` chạy trước. Khi `node1` chạy đến node thứ n + 1 thì `node2` bắt đầu chạy. Khi `node1` chạy đến node cuối cùng, vị trí của `node2` sẽ chính là node thứ (L - n) (với L là tổng độ dài danh sách liên kết, tức là node thứ n + 1 tính từ cuối).

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
public class Solution {
  public ListNode removeNthFromEnd(ListNode head, int n) {

    ListNode dummy = new ListNode(0);
    dummy.next = head;
    // Khai báo hai node cùng trỏ tới dummy node
    ListNode node1 = dummy, node2 = dummy;

    // node1 chạy trước, khi node1 chạy đến node thứ n thì node2 bắt đầu chạy
    // Khi node1 chạy tới node cuối cùng, vị trí của node2 chính là node thứ (L - n), tức là node thứ n + 1 tính từ cuối (L là tổng độ dài danh sách)
    while (node1 != null) {
      node1 = node1.next;
      if (n < 1 && node1 != null) {
        node2 = node2.next;
      }
      n--;
    }

    node2.next = node2.next.next;

    return dummy.next;

  }
}
```

## 5. Hợp nhất hai danh sách liên kết đã sắp xếp (Merge Two Sorted Lists)

### Mô tả bài toán

> Kiếm chỉ Offer: Nhập vào hai danh sách liên kết đơn điệu tăng dần, hãy in ra danh sách liên kết sau khi hợp nhất. Tất nhiên danh sách liên kết sau khi hợp nhất vẫn phải đảm bảo tính chất đơn điệu không giảm.

### Phân tích bài toán

Chúng ta có thể phân tích như sau:

1. Giả sử ta có hai danh sách liên kết A và B;
2. So sánh giá trị của head node A1 của A với head node B1 của B; giả sử A1 nhỏ hơn thì A1 sẽ là head node;
3. Tiếp tục so sánh A2 với B1; giả sử B1 nhỏ hơn thì A1 trỏ tới B1;
4. Tiếp tục so sánh A2 với B2;
5. Cứ thế lặp đi lặp lại tuần hoàn, quy trình này tương đối dễ hiểu.

Cân nhắc hiện thực bằng phương pháp đệ quy!

### Lời giải (Solution)

**Phiên bản đệ quy:**

```java
/*
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/
//https://www.nowcoder.com/practice/d8b6b4358f774294a89de2a6ac4d9337?tpId=13&tqId=11169&tPage=1&rp=1&ru=/ta/coding-interviews&qru=/ta/coding-interviews/question-ranking
public class Solution {
  public ListNode Merge(ListNode list1, ListNode list2) {
    if (list1 == null) {
      return list2;
    }
    if (list2 == null) {
      return list1;
    }
    if (list1.val <= list2.val) {
      list1.next = Merge(list1.next, list2);
      return list1;
    } else {
      list2.next = Merge(list1, list2.next);
      return list2;
    }
  }
}
```

## Trọng tâm ôn tập phỏng vấn

Mã nguồn của các bài toán danh sách liên kết thường không dài, nhưng thứ tự cập nhật con trỏ rất dễ viết sai. Trước khi phỏng vấn, bạn cần nắm vững ít nhất 4 template: Node giả lập (Dummy Head Node), Đảo ngược danh sách liên kết, Con trỏ nhanh-chậm, và Hợp nhất danh sách liên kết.

| Template | Dạng bài áp dụng | Điểm then chốt |
| -------- | ---------------- | -------------- |
| Node giả lập (Dummy Head Node) | Xóa node, hợp nhất danh sách, head node có thể thay đổi | Trả về `dummy.next` |
| Đảo ngược danh sách liên kết | Đảo ngược toàn bộ, đảo ngược theo đoạn, đảo ngược theo nhóm K | Lưu lại `next`, sau đó mới cập nhật `cur.next` |
| Con trỏ nhanh-chậm | Phát hiện chu trình, tìm node thứ K từ cuối, tìm điểm giữa | Kiểm tra điều kiện `fast` và `fast.next` trước |
| Hợp nhất danh sách liên kết | Hai danh sách đã sắp xếp, K danh sách đã sắp xếp | Đệ quy hoặc lặp; chú ý nối phần danh sách còn lại vào đuôi |

Template lặp (iterative) để đảo ngược danh sách liên kết nên được học thuộc lòng:

```java
ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}
```

## Minh họa quá trình và các trường hợp biên

Khi đảo ngược danh sách liên kết, cốt lõi là lưu `next` trước, rồi mới sửa `cur.next`. Bạn có thể ghi nhớ sự biến đổi của các con trỏ như sau:

```text
Khởi tạo: prev = null, cur = head

Mỗi vòng lặp:
next = cur.next
cur.next = prev
prev = cur
cur = next

Kết thúc: cur == null, prev trỏ tới head node mới
```

Đối với các bài toán xóa node, hợp nhất danh sách, hãy ưu tiên dùng node giả lập:

```java
ListNode dummy = new ListNode(0);
dummy.next = head;
// Thao tác thống nhất trên danh sách liên kết phía sau dummy
return dummy.next;
```

Một số điểm rất dễ mắc bẫy:

- Khi xóa node thứ N tính từ cuối, node giả lập giúp xử lý đồng nhất trường hợp xóa chính head node.
- Khi đảo ngược một khoảng/đoạn, phải lưu lại node nằm trước đoạn cần đảo và node nằm ngay sau đoạn cần đảo.
- Khi kiểm tra danh sách có chu trình hay không, điều kiện vòng lặp là `fast != null && fast.next != null`.
- Hợp nhất danh sách liên kết bằng đệ quy cho code ngắn gọn, nhưng khi danh sách rất dài có nguy cơ tràn stack đệ quy (StackOverflowError).
- Danh sách liên kết rỗng, danh sách chỉ có 1 node, xóa head node, xóa tail node đều cần được kiểm thử riêng biệt.
