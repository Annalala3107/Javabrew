---
title: "Chi tiết về cấu trúc dữ liệu tuyến tính (Mảng, Danh sách liên kết, Ngăn xếp, Hàng đợi)"
description: "Tổng hợp các đặc tính và thao tác của mảng, danh sách liên kết, ngăn xếp (stack), hàng đợi (queue), kết hợp với phân tích độ phức tạp và ứng dụng điển hình để nắm vững việc lựa chọn và cài đặt cấu trúc tuyến tính."
category: Khoa học máy tính cơ bản
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Mảng,Danh sách liên kết,Stack,Queue,Deque,Phân tích độ phức tạp,Truy cập ngẫu nhiên,Chèn và xóa
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/linear-data-structure.md
---

# Cấu trúc dữ liệu tuyến tính

## 1. Mảng

**Mảng (Array)** là một cấu trúc dữ liệu rất phổ biến. Nó được tạo thành từ các phần tử (element) có cùng kiểu dữ liệu và sử dụng một khối bộ nhớ liên tục để lưu trữ.

Chúng ta có thể trực tiếp sử dụng chỉ số (index) của phần tử để tính toán địa chỉ lưu trữ tương ứng của phần tử đó trong bộ nhớ.

Đặc điểm nổi bật của mảng là: **hỗ trợ truy cập ngẫu nhiên (random access)** và có dung lượng giới hạn (cố định).

```java
// Giả sử mảng có độ dài n.
Truy cập: O(1) // Truy cập phần tử tại vị trí cụ thể
Chèn: O(n)     // Trường hợp xấu nhất xảy ra khi chèn vào đầu mảng và cần dịch chuyển tất cả phần tử
Xóa: O(n)      // Trường hợp xấu nhất xảy ra khi xóa ở đầu mảng và cần dịch chuyển tất cả phần tử phía sau
```

![Mảng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/array-02250d02.png)

## 2. Danh sách liên kết

### 2.1. Giới thiệu về Danh sách liên kết

Mặc dù **Danh sách liên kết (LinkedList)** là một cấu trúc tuyến tính, nhưng nó không lưu trữ dữ liệu theo thứ tự tuần tự trong bộ nhớ vật lý và không sử dụng không gian bộ nhớ liên tục.

Thao tác chèn và xóa trong danh sách liên kết có độ phức tạp thời gian là O(1), chỉ cần biết phần tử đứng trước vị trí mục tiêu. Tuy nhiên, khi tìm kiếm một node hoặc truy cập một node tại vị trí cụ thể, độ phức tạp sẽ là O(n).

Việc sử dụng cấu trúc danh sách liên kết có thể khắc phục nhược điểm của mảng là phải xác định trước kích thước dữ liệu. Cấu trúc này tận dụng tối đa không gian bộ nhớ máy tính và quản lý bộ nhớ động linh hoạt. Tuy nhiên, danh sách liên kết không tiết kiệm bộ nhớ; so với mảng, nó chiếm nhiều không gian hơn vì mỗi node ngoài việc lưu trữ dữ liệu còn phải lưu thêm con trỏ trỏ đến các node khác. Ngoài ra, danh sách liên kết không có ưu điểm truy cập ngẫu nhiên như mảng.

### 2.2. Phân loại Danh sách liên kết

**Các loại danh sách liên kết phổ biến:**

1. Danh sách liên kết đơn (Singly Linked List)
2. Danh sách liên kết đôi (Doubly Linked List)
3. Danh sách liên kết vòng (Circular Linked List)
4. Danh sách liên kết vòng đôi (Circular Doubly Linked List)

```java
// Giả sử danh sách liên kết có n phần tử.
Truy cập: O(n)            // Truy cập phần tử tại vị trí cụ thể
Chèn/Xóa: O(1)            // Cần phải biết trước vị trí của phần tử
```

#### 2.2.1. Danh sách liên kết đơn

**Danh sách liên kết đơn** chỉ có một chiều duy nhất. Mỗi node chỉ có một con trỏ kế tiếp (`next`) trỏ đến node phía sau. Do đó, cấu trúc dữ liệu này thường không liên tục trong bộ nhớ vật lý. Theo quy ước, chúng ta gọi node đầu tiên là node đầu (head). Danh sách liên kết thường có một node `head` không chứa giá trị, thông qua đó ta có thể duyệt qua toàn bộ danh sách liên kết. Node đuôi thường trỏ đến `null`.

![Danh sách liên kết đơn](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/single-linkedlist-43224706.png)

#### 2.2.2. Danh sách liên kết vòng

**Danh sách liên kết vòng** thực chất là một dạng đặc biệt của danh sách liên kết đơn. Điểm khác biệt là node đuôi của danh sách liên kết vòng không trỏ đến `null`, mà trỏ ngược lại node `head` của danh sách.

![Danh sách liên kết vòng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/circular-linkedlist-6d008def.png)

#### 2.2.3. Danh sách liên kết đôi

**Danh sách liên kết đôi** chứa hai con trỏ: con trỏ `prev` trỏ đến node đứng trước và con trỏ `next` trỏ đến node đứng sau.

![Danh sách liên kết đôi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-linkedlist-a47e8dae.png)

#### 2.2.4. Danh sách liên kết vòng đôi

Trong **Danh sách liên kết vòng đôi**, con trỏ `next` của node cuối cùng trỏ đến `head`, còn con trỏ `prev` của `head` trỏ ngược lại node cuối cùng, tạo thành một vòng tròn khép kín.

![Danh sách liên kết vòng đôi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-circular-linkedlist-236d879c.png)

### 2.3. Kịch bản áp dụng

- Nếu cần hỗ trợ truy cập ngẫu nhiên, danh sách liên kết không thể đáp ứng.
- Nếu số lượng phần tử cần lưu trữ chưa xác định trước và cần thường xuyên thêm, xóa dữ liệu, sử dụng danh sách liên kết sẽ phù hợp hơn.
- Nếu số lượng phần tử cần lưu trữ đã xác định cố định và không cần thường xuyên thêm, xóa dữ liệu, sử dụng mảng sẽ phù hợp hơn.

### 2.4. Mảng vs Danh sách liên kết

- Mảng hỗ trợ truy cập ngẫu nhiên, trong khi danh sách liên kết thì không.
- Mảng sử dụng không gian bộ nhớ liên tục nên rất thân thiện với cơ chế CPU cache; danh sách liên kết thì ngược lại.
- Kích thước của mảng là cố định, trong khi danh sách liên kết hỗ trợ mở rộng động một cách tự nhiên. Nếu khai báo mảng quá nhỏ, chương trình sẽ phải cấp phát một vùng nhớ lớn hơn và sao chép toàn bộ phần tử mảng cũ sang, thao tác này tiêu tốn khá nhiều tài nguyên!

## 3. Ngăn xếp (Stack)

### 3.1. Giới thiệu về Stack

**Ngăn xếp (Stack)** chỉ cho phép thêm dữ liệu (`push`) và loại bỏ dữ liệu (`pop`) tại một đầu duy nhất của tập dữ liệu tuyến tính có thứ tự (gọi là đỉnh stack - `top`). Do đó, nó hoạt động theo nguyên lý **Vào sau, Ra trước (LIFO, Last In First Out)**. **Trong stack, cả thao tác push và pop đều diễn ra tại đỉnh stack.**

Stack thường được cài đặt bằng mảng một chiều hoặc danh sách liên kết. Stack cài đặt bằng mảng gọi là **stack tuần tự (Sequential Stack)**, còn stack cài đặt bằng danh sách liên kết gọi là **stack liên kết (Linked Stack)**.

```java
// Giả sử trong stack có n phần tử.
Truy cập: O(n) // Trường hợp xấu nhất
Chèn/Xóa: O(1) // Chèn và xóa phần tử tại đỉnh stack
```

![Sơ đồ cấu trúc Vào sau Ra trước của Stack](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/stack-d5d8374d.png)

### 3.2. Các kịch bản ứng dụng phổ biến của Stack

Khi dữ liệu cần xử lý chỉ liên quan đến việc chèn và xóa ở một đầu duy nhất và thỏa mãn đặc tính **Vào sau, Ra trước (LIFO)**, chúng ta có thể sử dụng cấu trúc dữ liệu Stack.

#### 3.2.1. Cài đặt tính năng Back và Forward của trình duyệt

Chúng ta chỉ cần sử dụng hai stack (Stack1 và Stack2) là có thể hiện thực hóa tính năng này. Giả sử bạn truy cập lần lượt 4 trang 1, 2, 3, 4; chúng ta lần lượt đẩy (push) 4 trang này vào Stack1. Khi bạn muốn quay lại trang 2, bạn nhấn nút Back, hệ thống sẽ lần lượt lấy (pop) hai trang 4, 3 ra khỏi Stack1 rồi đẩy vào Stack2. Nếu bạn lại muốn đi tiếp tới trang 3, bạn nhấn nút Forward, hệ thống sẽ pop trang 3 từ Stack2 rồi đẩy vào Stack1. Sơ đồ minh họa như sau:

![Sử dụng hai stack để cài đặt tính năng Back và Forward của trình duyệt](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/stack-browser-back-forward-91296277.png)

#### 3.2.2. Kiểm tra dấu ngoặc hợp lệ (đóng mở theo cặp)

> Cho một chuỗi chỉ chứa các ký tự `'('`, `')'`, `'{'`, `'}'`, `'['`, `']'`, hãy xác định xem chuỗi đó có hợp lệ hay không.
>
> Chuỗi hợp lệ cần thỏa mãn:
>
> 1. Dấu ngoặc mở phải được đóng bằng dấu ngoặc cùng loại.
> 2. Dấu ngoặc mở phải được đóng theo đúng thứ tự.
>
> Ví dụ "()", "()[]{}" và "{[]}" đều là các chuỗi hợp lệ, trong khi "(]" và "([)]" thì không.

Vấn đề này thực chất là một bài toán kinh điển trên LeetCode, chúng ta có thể tận dụng `Stack` để giải quyết.

1. Đầu tiên, lưu quy tắc tương ứng giữa các dấu ngoặc vào `Map`;
2. Khởi tạo một stack. Duyệt qua chuỗi, nếu ký tự là ngoặc mở thì đẩy trực tiếp vào `stack`, ngược lại lấy phần tử ở đỉnh `stack` so sánh với ngoặc đóng tương ứng này, nếu không khớp thì trả về `false` ngay lập tức. Sau khi duyệt xong, nếu `stack` rỗng thì trả về `true`.

```java
public boolean isValid(String s){
    // Quy tắc tương ứng giữa các dấu ngoặc
    HashMap<Character, Character> mappings = new HashMap<Character, Character>();
    mappings.put(')', '(');
    mappings.put('}', '{');
    mappings.put(']', '[');
    Stack<Character> stack = new Stack<Character>();
    char[] chars = s.toCharArray();
    for (int i = 0; i < chars.length; i++) {
        if (mappings.containsKey(chars[i])) {
            char topElement = stack.empty() ? '#' : stack.pop();
            if (topElement != mappings.get(chars[i])) {
                return false;
            }
        } else {
            stack.push(chars[i]);
        }
    }
    return stack.isEmpty();
}
```

#### 3.2.3. Đảo ngược chuỗi

Đẩy lần lượt từng ký tự của chuỗi vào stack rồi pop ra là xong.

#### 3.2.4. Quản lý ngăn xếp lời gọi hàm (Call Stack)

Hàm được gọi cuối cùng phải hoàn thành việc thực thi trước, điều này hoàn toàn trùng khớp với đặc tính **Vào sau, Ra trước (LIFO)** của stack.
Ví dụ, các lệnh gọi hàm đệ quy có thể được cài đặt thông qua stack, mỗi lần gọi đệ quy sẽ đẩy tham số và địa chỉ trả về vào stack.

#### 3.2.5. Tìm kiếm theo chiều sâu (DFS)

Trong quá trình duyệt theo chiều sâu, stack được dùng để lưu trữ đường đi tìm kiếm nhằm phục vụ cho thao tác quay lui (backtracking) về tầng trước đó.

### 3.3. Cài đặt Stack

Stack có thể được cài đặt bằng mảng hoặc danh sách liên kết. Dù dựa trên mảng hay danh sách liên kết, độ phức tạp thời gian của các thao tác push và pop đều là O(1).

Dưới đây, chúng ta dùng mảng để cài đặt một stack với các phương thức cơ bản: `push()`, `pop()` (lấy phần tử đỉnh ra và xóa khỏi stack), `peek()` (xem phần tử đỉnh mà không xóa), `isEmpty()`, và `size()`.

> Gợi ý: Mỗi lần push, hãy kiểm tra dung lượng của stack có đủ hay không; nếu không đủ thì dùng `Arrays.copyOf()` để mở rộng dung lượng.

```java
public class MyStack {
    private int[] storage; // Mảng lưu trữ các phần tử trong stack
    private int capacity;  // Dung lượng của stack
    private int count;     // Số lượng phần tử hiện có trong stack
    private static final int GROW_FACTOR = 2;

    // Constructor không tham số với dung lượng mặc định là 8
    public MyStack() {
        this.capacity = 8;
        this.storage = new int[8];
        this.count = 0;
    }

    // Constructor có truyền vào dung lượng khởi tạo ban đầu
    public MyStack(int initialCapacity) {
        if (initialCapacity < 1)
            throw new IllegalArgumentException("Capacity too small.");

        this.capacity = initialCapacity;
        this.storage = new int[initialCapacity];
        this.count = 0;
    }

    // Đẩy phần tử vào stack
    public void push(int value) {
        if (count == capacity) {
            ensureCapacity();
        }
        storage[count++] = value;
    }

    // Đảm bảo đủ dung lượng
    private void ensureCapacity() {
        int newCapacity = capacity * GROW_FACTOR;
        storage = Arrays.copyOf(storage, newCapacity);
        capacity = newCapacity;
    }

    // Lấy phần tử đỉnh ra và xóa khỏi stack
    public int pop() {
        if (count == 0)
            throw new IllegalArgumentException("Stack is empty.");
        count--;
        return storage[count];
    }

    // Xem phần tử đỉnh mà không xóa khỏi stack
    public int peek() {
        if (count == 0){
            throw new IllegalArgumentException("Stack is empty.");
        } else {
            return storage[count - 1];
        }
    }

    // Kiểm tra stack có rỗng không
    public boolean isEmpty() {
        return count == 0;
    }

    // Trả về số lượng phần tử trong stack
    public int size() {
        return count;
    }

}
```

Kiểm thử:

```java
MyStack myStack = new MyStack(3);
myStack.push(1);
myStack.push(2);
myStack.push(3);
myStack.push(4);
myStack.push(5);
myStack.push(6);
myStack.push(7);
myStack.push(8);
System.out.println(myStack.peek()); // 8
System.out.println(myStack.size()); // 8
for (int i = 0; i < 8; i++) {
    System.out.println(myStack.pop());
}
System.out.println(myStack.isEmpty()); // true
myStack.pop(); // Báo lỗi: java.lang.IllegalArgumentException: Stack is empty.
```

## 4. Hàng đợi (Queue)

### 4.1. Giới thiệu về Queue

**Hàng đợi (Queue)** là danh sách tuyến tính hoạt động theo cơ chế **Vào trước, Ra trước (FIFO, First In, First Out)**. Trong thực tế ứng dụng, queue thường được cài đặt bằng danh sách liên kết hoặc mảng. Queue cài đặt bằng mảng gọi là **queue tuần tự (Sequential Queue)**, queue cài đặt bằng danh sách liên kết gọi là **queue liên kết (Linked Queue)**. **Queue chỉ cho phép thêm phần tử ở phía sau (rear) gọi là enqueue (vào hàng đợi), và xóa phần tử ở phía trước (front) gọi là dequeue (ra khỏi hàng đợi).**

Thao tác của queue tương tự như stack, điểm khác biệt duy nhất là queue chỉ cho phép thêm dữ liệu mới ở phía sau.

```java
// Giả sử trong queue có n phần tử.
Truy cập: O(n) // Trường hợp xấu nhất
Chèn/Xóa: O(1) // Chèn ở đuôi và xóa ở đầu
```

![Hàng đợi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/queue-169f6d44.png)

### 4.2. Phân loại Queue

#### 4.2.1. Hàng đợi đơn (Simple Queue)

Hàng đợi đơn là loại queue thông thường mà mỗi lần thêm phần tử đều thêm vào cuối hàng đợi. Queue đơn lại được chia thành **queue tuần tự (cài đặt bằng mảng)** và **queue liên kết (cài đặt bằng danh sách liên kết)**.

**Queue tuần tự tồn tại vấn đề "tràn giả" (false overflow), tức là mảng vẫn còn chỗ trống nhưng không thể thêm phần tử vào.**

Giả sử hình dưới đây là một queue tuần tự, chúng ta cho hai phần tử đầu tiên 1, 2 ra khỏi hàng đợi (dequeue) và thêm vào hai phần tử 7, 8 (enqueue). Khi thực hiện các thao tác enqueue và dequeue, cả con trỏ `front` và `rear` đều liên tục dịch chuyển về phía sau. Khi `rear` dịch chuyển đến vị trí cuối cùng của mảng, chúng ta không thể thêm dữ liệu vào queue được nữa dù phía trước mảng vẫn còn các vị trí trống. Hiện tượng này gọi là **"tràn giả"**. Ngoài vấn đề tràn giả, như hình bên dưới cho thấy, khi thêm phần tử 8, con trỏ `rear` sẽ dịch chuyển ra ngoài phạm vi mảng (vượt biên / out of bounds).

> Để tránh việc khi chỉ còn một phần tử duy nhất, đầu hàng đợi và cuối hàng đợi trùng nhau gây khó khăn cho việc xử lý, người ta đưa vào hai con trỏ: con trỏ front trỏ vào phần tử đầu hàng đợi, con trỏ rear trỏ vào vị trí tiếp theo của phần tử cuối cùng trong hàng đợi. Nhờ đó, khi front bằng rear, hàng đợi không phải còn lại một phần tử, mà là hàng đợi rỗng. — Trích từ sách 《Đại thoại Cấu trúc dữ liệu》

![Hiện tượng tràn giả trong queue tuần tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/seq-queue-false-overflow-b31f2974.png)

#### 4.2.2. Hàng đợi vòng (Circular Queue)

Hàng đợi vòng có thể giải quyết triệt để vấn đề tràn giả và lỗi vượt biên của queue tuần tự. Cách giải quyết là: quay lại từ đầu mảng, từ đó hình thành một vòng tròn nối đầu và đuôi, đây cũng là nguồn gốc tên gọi của hàng đợi vòng.

Vẫn sử dụng hình ảnh trên, nếu chúng ta cho con trỏ `rear` trỏ về vị trí chỉ số 0 của mảng thì sẽ không còn vấn đề vượt biên nữa. Khi chúng ta tiếp tục thêm phần tử vào hàng đợi, con trỏ `rear` sẽ dịch chuyển dần về phía sau.

![Hàng đợi vòng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/circular-queue-739efe49.png)

Trong queue tuần tự, chúng ta nói khi `front == rear` thì hàng đợi rỗng; nhưng trong queue vòng thì khác, `front == rear` cũng có thể là hàng đợi đã đầy, như hình trên minh họa. Có hai giải pháp xử lý:

1. Thiết lập một biến cờ `flag`: khi `front == rear` và `flag == 0` thì hàng đợi rỗng; khi `front == rear` và `flag == 1` thì hàng đợi đầy.
2. Hàng đợi rỗng khi `front == rear`. Khi hàng đợi đầy, chúng ta quy ước giữ lại một vị trí trống trong mảng và để `rear` trỏ vào vị trí trống này như hình vẽ. Khi đó, điều kiện để kiểm tra hàng đợi đầy sẽ là: `(rear + 1) % QueueSize == front`.

#### 4.2.3. Hàng đợi hai đầu (Deque)

**Hàng đợi hai đầu (Deque - Double-Ended Queue)** là cấu trúc hàng đợi cho phép thực hiện thao tác chèn và xóa ở cả hai đầu, linh hoạt hơn nhiều so với hàng đợi đơn.

Thông thường, chúng ta có thể thực hiện các thao tác `addFirst`, `addLast`, `removeFirst` và `removeLast` trên một deque.

#### 4.2.4. Hàng đợi ưu tiên (Priority Queue)

Xét về mặt cấu trúc tầng dưới, **Hàng đợi ưu tiên (Priority Queue)** không phải là một cấu trúc dữ liệu tuyến tính, nó thường được cài đặt bằng Heap.

1. Mỗi khi một phần tử vào hàng đợi, priority queue sẽ chèn phần tử mới vào heap và tiến hành điều chỉnh heap (reheapify).
2. Khi lấy phần tử ở đầu hàng đợi ra, priority queue sẽ trả về phần tử ở đỉnh heap và điều chỉnh lại heap.

Về cách cài đặt chi tiết của heap, bạn có thể tham khảo mục [Heap](https://javaguide.cn/cs-basics/data-structure/heap.html).

Hàng đợi ưu tiên chỉ đảm bảo phần tử ở đầu hàng đợi là phần tử có độ ưu tiên cao nhất (hoặc thấp nhất) tại thời điểm đó, chứ không đảm bảo mảng tầng dưới, iterator hay toàn bộ tập hợp được sắp xếp toàn cục. Mỗi lần lấy phần tử đầu ra, phần tử có độ ưu tiên tiếp theo mới trở thành đầu hàng đợi mới.

Mặc dù hàng đợi ưu tiên thường được cài đặt bằng cấu trúc phi tuyến tính như heap, nhưng nó cung cấp khả năng lấy phần tử ra theo mức độ ưu tiên thông qua giao diện queue cho người dùng. Khái niệm "ưu tiên" ở đây chỉ mô tả thứ tự ra khỏi hàng đợi (dequeue), không thể hiểu lầm rằng toàn bộ các phần tử trong tập hợp sẽ tự động được sắp xếp theo thứ tự hoàn chỉnh.

### 4.3. Các kịch bản ứng dụng phổ biến của Queue

Khi cần xử lý dữ liệu theo một thứ tự nhất định, chúng ta có thể cân nhắc sử dụng cấu trúc dữ liệu queue.

- **Blocking Queue (Hàng đợi chặn):** Blocking queue có thể xem như queue được bổ sung thêm các thao tác chặn (blocking). Khi queue rỗng, thao tác lấy ra (dequeue) sẽ bị chặn; khi queue đầy, thao tác thêm vào (enqueue) sẽ bị chặn. Sử dụng blocking queue giúp chúng ta dễ dàng hiện thực hóa mô hình "Nhà sản xuất - Người tiêu dùng" (Producer - Consumer).
- **Hàng đợi yêu cầu / tác vụ trong Thread Pool:** Khi trong thread pool không còn thread nào rảnh rỗi, các yêu cầu tác vụ mới sẽ được xử lý ra sao? Câu trả lời là các tác vụ này sẽ được đưa vào hàng đợi tác vụ (task queue), chờ đến khi có thread trong pool rảnh để lấy ra thực thi. Task queue gồm hàng đợi không giới hạn (unbounded queue, cài đặt bằng danh sách liên kết) và hàng đợi có giới hạn (bounded queue, cài đặt bằng mảng). Đặc điểm của unbounded queue là dung lượng trên lý thuyết không bị giới hạn, các tác vụ có thể liên tục vào hàng đợi cho đến khi cạn kiệt tài nguyên hệ thống. Ví dụ: `FixedThreadPool` sử dụng blocking queue `LinkedBlockingQueue` với dung lượng mặc định là `Integer.MAX_VALUE`, do đó có thể coi là một "unbounded queue". Trong khi đó, bounded queue thì khác: khi queue đã đầy, nếu tiếp tục gửi thêm tác vụ mới, do queue không thể chứa thêm nên thread pool sẽ từ chối các tác vụ này và ném ra ngoại lệ `java.util.concurrent.RejectedExecutionException`.
- **Stack:** Hàng đợi hai đầu (Deque) có thể cài đặt toàn bộ chức năng của stack (`push`, `pop` và `peek`), và các phương thức liên quan đã được định nghĩa trong interface `Deque`. Mặc dù `Stack` không bị đánh dấu là deprecated, nhưng nó là lớp con kế thừa từ lớp cũ `Vector`, tài liệu chính thức của JDK khuyến nghị nên ưu tiên sử dụng `Deque` cùng các lớp hiện thực của nó (như `ArrayDeque`) để thực hiện các thao tác ngăn xếp.
- **Tìm kiếm theo chiều rộng (BFS):** Trong thuật toán tìm kiếm theo chiều rộng trên đồ thị, queue được dùng để lưu trữ các node đang chờ truy cập, đảm bảo duyệt qua các node của đồ thị theo từng tầng thứ tự.
- Hàng đợi tiến trình trong nhân Linux (xếp hàng theo độ ưu tiên).
- Xếp hàng trong đời thực, danh sách phát trên ứng dụng nghe nhạc.
- Hàng đợi thông điệp (Message Queue).
- V.v...

## Trọng tâm ôn tập phỏng vấn

Cấu trúc tuyến tính là nền tảng của các bài toán thuật toán và Java Collections. Trong phỏng vấn, mảng, danh sách liên kết, stack, queue thường được đặt cạnh nhau để so sánh.

| Cấu trúc | Truy vấn | Chèn / Xóa | Kiểu dữ liệu Java điển hình | Dạng bài tần suất cao |
| -------- | -------- | ---------- | --------------------------- | --------------------- |
| Mảng | Theo chỉ số `O(1)` | Vị trí ở giữa `O(n)` | Mảng tầng dưới của `ArrayList` | Tìm kiếm nhị phân, hai con trỏ, tiền tố tổng |
| Danh sách liên kết | `O(n)` | Khi đã biết trước node `O(1)` | `LinkedList` | Đảo ngược danh sách liên kết, con trỏ nhanh chậm, hợp nhất danh sách |
| Stack | Đỉnh stack `O(1)` | Đỉnh stack `O(1)` | `ArrayDeque` | Khớp dấu ngoặc, Monotonic Stack, DFS |
| Queue | Đầu queue `O(1)` | Enqueue / Dequeue `O(1)` | `ArrayDeque`, Blocking Queue | BFS, Producer-Consumer, xếp hàng tác vụ |

Một số điểm rất hữu ích khi trả lời câu hỏi phỏng vấn:

- Mảng truy cập ngẫu nhiên nhanh là do bộ nhớ liên tục, có thể tính toán trực tiếp địa chỉ thông qua địa chỉ gốc (base address) và chỉ số.
- Thao tác chèn và xóa của danh sách liên kết nhanh có điều kiện tiên quyết: đã nắm giữ con trỏ tới node tại vị trí cần thao tác; nếu vẫn phải tìm kiếm node đó trước thì độ phức tạp tổng thể vẫn là `O(n)`.
- Trong Java, không khuyến khích tiếp tục sử dụng `Stack`, lựa chọn phổ biến hơn là `Deque`, ví dụ như `ArrayDeque`.
- Trong thực tế kỹ thuật, queue không chỉ dùng cho thuật toán BFS, mà còn được áp dụng rộng rãi cho hàng đợi tác vụ của thread pool, message queue, giới hạn tốc độ (rate limiting) và san phẳng đỉnh lưu lượng (peak clipping).
- Điểm mấu chốt của hàng đợi vòng là phân biệt trạng thái rỗng và đầy; cách phổ biến là chấp nhận lãng phí một ô nhớ trống hoặc duy trì riêng một biến đếm số lượng phần tử.

## Đề xuất bài tập luyện tập

- Mảng: [704. Tìm kiếm nhị phân](https://leetcode.cn/problems/binary-search/), [26. Xóa phần tử trùng lặp trong mảng đã sắp xếp](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/)
- Danh sách liên kết: [206. Đảo ngược danh sách liên kết](https://leetcode.cn/problems/reverse-linked-list/), [19. Xóa node thứ N tính từ cuối danh sách](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)
- Stack: [20. Dấu ngoặc hợp lệ](https://leetcode.cn/problems/valid-parentheses/), [739. Nhiệt độ hàng ngày](https://leetcode.cn/problems/daily-temperatures/)
- Queue: [102. Duyệt cây nhị phân theo tầng](https://leetcode.cn/problems/binary-tree-level-order-traversal/), [239. Giá trị lớn nhất trong cửa sổ trượt](https://leetcode.cn/problems/sliding-window-maximum/)
