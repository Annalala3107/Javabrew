---
title: Phân tích mã nguồn LinkedList
description: "Phân tích chuyên sâu mã nguồn LinkedList: mổ xẻ cấu trúc danh sách liên kết đôi, cài đặt interface Deque, độ phức tạp thời gian O(1) khi chèn/xóa ở đầu và cuối, so sánh hiệu năng với ArrayList và các kịch bản phù hợp."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/linkedlist-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn LinkedList,danh sách liên kết đôi,interface Deque,khác biệt giữa LinkedList và ArrayList,hiệu năng chèn xóa,cài đặt danh sách liên kết
---


## Giới thiệu về LinkedList

`LinkedList` là một lớp Collection được cài đặt dựa trên danh sách liên kết đôi (Doubly Linked List), và thường xuyên được đặt lên bàn cân so sánh với `ArrayList`. Về so sánh chi tiết giữa `LinkedList` và `ArrayList`, chúng ta đã trình bày kỹ trong bài [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Collections (Phần 1)](./java-collection-questions-01.md).

![Danh sách liên kết đôi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-linkedlist-a47e8dae.png)

Tuy nhiên, trong dự án thực tế chúng ta thường không dùng đến `LinkedList`; hầu như mọi kịch bản cần dùng `LinkedList` đều có thể thay thế bằng `ArrayList`, hơn nữa hiệu năng thường còn tốt hơn! Ngay cả chính tác giả của `LinkedList` là Joshua Bloch cũng từng nói rằng bản thân ông chưa bao giờ sử dụng `LinkedList`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redisimage-20220412110853807-8b87ce5d.png)

Ngoài ra, đừng mặc định theo quán tính rằng `LinkedList` là danh sách liên kết nên sẽ phù hợp nhất cho các kịch bản thêm/xóa phần tử. Như đã nói ở trên, `LinkedList` chỉ có độ phức tạp thời gian xấp xỉ O(1) khi chèn hoặc xóa phần tử ở đầu và cuối; trong các trường hợp khác, độ phức tạp thời gian trung bình cho thao tác thêm/xóa đều là O(n).

### Độ phức tạp thời gian khi chèn và xóa phần tử của LinkedList là bao nhiêu?

- Chèn/xóa ở đầu danh sách: Chỉ cần sửa con trỏ của nút đầu là hoàn thành thao tác chèn/xóa, do đó độ phức tạp thời gian là O(1).
- Chèn/xóa ở cuối danh sách: Chỉ cần sửa con trỏ của nút cuối là hoàn thành thao tác chèn/xóa, do đó độ phức tạp thời gian là O(1).
- Chèn/xóa tại vị trí chỉ định: Trước tiên cần di chuyển đến vị trí chỉ định rồi mới sửa con trỏ của nút tương ứng để hoàn thành chèn/xóa; tuy nhiên nhờ có con trỏ đầu và cuối nên có thể xuất phát từ đầu gần hơn, vì vậy trung bình cần duyệt qua n/4 phần tử, độ phức tạp thời gian là O(n).

### Tại sao LinkedList không thể triển khai interface RandomAccess?

`RandomAccess` là một marker interface, dùng để biểu thị lớp triển khai interface này hỗ trợ truy cập ngẫu nhiên (tức có thể truy cập nhanh phần tử thông qua chỉ số `index`). Vì cấu trúc dữ liệu tầng dưới của `LinkedList` là danh sách liên kết, địa chỉ bộ nhớ không liên tục mà chỉ có thể định vị thông qua con trỏ, không hỗ trợ truy cập ngẫu nhiên nhanh, nên không thể triển khai interface `RandomAccess`.

## Phân tích mã nguồn LinkedList

Ở đây lấy JDK 1.8 làm ví dụ để phân tích mã nguồn cốt lõi tầng dưới của `LinkedList`.

Định nghĩa lớp `LinkedList` như sau:

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
  //...
}
```

`LinkedList` kế thừa `AbstractSequentialList`, còn `AbstractSequentialList` lại kế thừa từ `AbstractList`.

Nếu bạn đã từng đọc mã nguồn của `ArrayList` thì sẽ biết `ArrayList` cũng kế thừa `AbstractList`, nên `LinkedList` có phần lớn các phương thức tương tự với `ArrayList`.

`LinkedList` triển khai các interface sau:

- `List`: Cho thấy đây là một danh sách, hỗ trợ các thao tác thêm, xóa, tìm kiếm, v.v., đồng thời có thể truy cập theo chỉ số (`index`).
- `Deque`: Kế thừa từ interface `Queue`, mang đặc tính của hàng đợi hai đầu (double-ended queue), hỗ trợ chèn và xóa phần tử từ cả hai đầu, rất thuận tiện để cài đặt các cấu trúc dữ liệu như ngăn xếp (Stack) và hàng đợi (Queue). Cần lưu ý rằng `Deque` được phát âm là "deck" [dɛk], từ này phần lớn mọi người đều đọc sai.
- `Cloneable`: Cho thấy nó có khả năng sao chép, có thể thực hiện thao tác sao chép sâu (Deep Copy) hoặc sao chép nông (Shallow Copy).
- `Serializable`: Cho thấy nó có thể thực hiện tuần tự hóa (`Serialization`), tức là chuyển đối tượng thành luồng byte để lưu trữ bền vững hoặc truyền qua mạng, rất thuận tiện.

![Sơ đồ lớp LinkedList](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedlist--class-diagram-7c8a9c71.png)

Các phần tử trong `LinkedList` được định nghĩa thông qua lớp `Node`:

```java
private static class Node<E> {
    E item; // Giá trị của nút
    Node<E> next; // Nút tiếp theo được trỏ tới (nút kế sau)
    Node<E> prev; // Nút trước đó được trỏ tới (nút tiền nhiệm)

    // Thứ tự tham số khởi tạo lần lượt là: nút trước, giá trị nút hiện tại, nút sau
    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

### Khởi tạo

`LinkedList` có một hàm tạo không tham số và một hàm tạo có tham số.

```java
// Tạo một đối tượng danh sách liên kết rỗng
public LinkedList() {
}

// Nhận một đối tượng Collection làm tham số, tạo ra một danh sách liên kết có cùng các phần tử với Collection truyền vào
public LinkedList(Collection<? extends E> c) {
    this();
    addAll(c);
}
```

### Chèn phần tử

Ngoài các phương thức liên quan đến interface `List`, `LinkedList` còn triển khai rất nhiều phương thức của interface `Deque`, vì vậy chúng ta có nhiều cách để chèn phần tử.

Ở đây chúng ta lấy các phương thức chèn liên quan trong interface `List` làm ví dụ để phân tích mã nguồn, tương ứng với phương thức `add()`.

Phương thức `add()` có hai phiên bản:

- `add(E e)`: Dùng để chèn phần tử vào cuối `LinkedList`, tức đưa phần tử mới trở thành phần tử cuối cùng của danh sách liên kết, độ phức tạp thời gian là O(1).
- `add(int index, E element)`: Dùng để chèn phần tử vào vị trí chỉ định. Cách chèn này trước tiên cần di chuyển tới vị trí chỉ định, rồi sửa con trỏ của nút tương ứng để hoàn thành chèn/xóa, do đó trung bình cần duyệt qua n/4 phần tử, độ phức tạp thời gian là O(n).

```java
// Chèn phần tử vào cuối danh sách liên kết
public boolean add(E e) {
    linkLast(e);
    return true;
}

// Chèn phần tử vào vị trí chỉ định trong danh sách liên kết
public void add(int index, E element) {
    // Kiểm tra vượt biên chỉ số
    checkPositionIndex(index);

    // Kiểm tra xem index có phải vị trí cuối danh sách không
    if (index == size)
        // Nếu đúng thì gọi trực tiếp linkLast để chèn nút phần tử vào cuối danh sách
        linkLast(element);
    else
        // Nếu không thì gọi linkBefore để chèn nó vào trước phần tử chỉ định
        linkBefore(element, node(index));
}

// Chèn nút phần tử vào cuối danh sách liên kết
void linkLast(E e) {
    // Gán tham chiếu nút cuối cùng cho biến l
    final Node<E> l = last;
    // Tạo nút mới với nút trước là nút cuối last, còn tham chiếu nút sau là null
    final Node<E> newNode = new Node<>(l, e, null);
    // Cho tham chiếu last trỏ tới nút mới
    last = newNode;
    // Kiểm tra nút cuối cũ có null không
    // Nếu l là null nghĩa là đây là lần đầu tiên thêm phần tử
    if (l == null)
        // Nếu là lần đầu thêm, gán first bằng nút mới; lúc này danh sách chỉ có một phần tử
        first = newNode;
    else
        // Nếu không phải lần đầu thêm, gán next của l (phần tử cuối trước khi thêm) bằng nút mới
        l.next = newNode;
    size++;
    modCount++;
}

// Chèn phần tử vào trước phần tử chỉ định succ
void linkBefore(E e, Node<E> succ) {
    // assert succ != null; khẳng định succ khác null
    // Khai báo nút pred lưu tham chiếu prev của succ (tức nút đứng ngay trước nó)
    final Node<E> pred = succ.prev;
    // Khởi tạo nút mới và chỉ rõ nút trước, nút sau
    final Node<E> newNode = new Node<>(pred, e, succ);
    // Cho tham chiếu prev của nút succ trỏ tới nút mới
    succ.prev = newNode;
    // Kiểm tra nút trước có null không; nếu null chứng tỏ succ từng là nút đầu tiên
    if (pred == null)
        // Nút mới trở thành nút đầu tiên
        first = newNode;
    else
        // Tham chiếu next của nút trước succ trỏ tới nút mới
        pred.next = newNode;
    size++;
    modCount++;
}
```

### Lấy phần tử

Các phương thức liên quan đến lấy phần tử của `LinkedList` có tổng cộng 3 phương thức:

1. `getFirst()`: Lấy phần tử đầu tiên của danh sách liên kết.
2. `getLast()`: Lấy phần tử cuối cùng của danh sách liên kết.
3. `get(int index)`: Lấy phần tử tại vị trí chỉ định của danh sách liên kết.

```java
// Lấy phần tử đầu tiên của danh sách liên kết
public E getFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return f.item;
}

// Lấy phần tử cuối cùng của danh sách liên kết
public E getLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return l.item;
}

// Lấy phần tử tại vị trí chỉ định của danh sách liên kết
public E get(int index) {
  // Kiểm tra vượt biên chỉ số, nếu vượt biên sẽ ném ngoại lệ
  checkElementIndex(index);
  // Trả về phần tử ứng với chỉ số trong danh sách liên kết
  return node(index).item;
}
```

Cốt lõi ở đây nằm ở phương thức `node(int index)`:

```java
// Trả về nút khác null tại chỉ số chỉ định
Node<E> node(int index) {
    // Khẳng định chỉ số chưa vượt biên
    // assert isElementIndex(index);
    // Nếu index nhỏ hơn một nửa size thì tìm từ đầu (duyệt xuôi); ngược lại tìm từ cuối (duyệt ngược)
    if (index < (size >> 1)) {
        Node<E> x = first;
        // Duyệt lặp xuôi về phía sau cho tới khi i == index
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

Các phương thức như `get(int index)` hay `remove(int index)` bên trong đều gọi tới phương thức này để lấy ra nút tương ứng.

Từ mã nguồn phương thức này có thể thấy nó so sánh giá trị chỉ số với một nửa kích thước `size` của danh sách liên kết để quyết định bắt đầu duyệt từ đầu hay từ cuối. Nếu giá trị chỉ số nhỏ hơn một nửa `size` thì duyệt từ đầu danh sách, ngược lại duyệt từ cuối danh sách. Nhờ đó có thể tìm thấy nút mục tiêu trong thời gian ngắn hơn, tận dụng triệt để đặc tính của danh sách liên kết đôi nhằm nâng cao hiệu quả.

### Xóa phần tử

Các phương thức liên quan đến xóa phần tử của `LinkedList` có tổng cộng 5 phương thức:

1. `removeFirst()`: Xóa và trả về phần tử đầu tiên của danh sách liên kết.
2. `removeLast()`: Xóa và trả về phần tử cuối cùng của danh sách liên kết.
3. `remove(E e)`: Xóa phần tử được chỉ định xuất hiện đầu tiên trong danh sách liên kết; nếu không tồn tại thì trả về `false`.
4. `remove(int index)`: Xóa phần tử tại chỉ số chỉ định và trả về giá trị của phần tử đó.
5. `void clear()`: Xóa bỏ tất cả các phần tử trong danh sách liên kết này.

```java
// Xóa và trả về phần tử đầu tiên của danh sách liên kết
public E removeFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return unlinkFirst(f);
}

// Xóa và trả về phần tử cuối cùng của danh sách liên kết
public E removeLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return unlinkLast(l);
}

// Xóa phần tử chỉ định xuất hiện đầu tiên trong danh sách; trả về false nếu không tồn tại
public boolean remove(Object o) {
    // Nếu phần tử chỉ định là null, duyệt danh sách tìm phần tử null đầu tiên để xóa
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        // Nếu khác null, duyệt danh sách tìm nút cần xóa
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}

// Xóa phần tử tại vị trí chỉ định trong danh sách liên kết
public E remove(int index) {
    // Kiểm tra vượt biên chỉ số, nếu vượt biên sẽ ném ngoại lệ
    checkElementIndex(index);
    return unlink(node(index));
}
```

Cốt lõi ở đây nằm ở phương thức `unlink(Node<E> x)`:

```java
E unlink(Node<E> x) {
    // Khẳng định x khác null
    // assert x != null;
    // Lấy giá trị phần tử của nút hiện tại (tức nút cần xóa)
    final E element = x.item;
    // Lấy nút tiếp theo của nút hiện tại
    final Node<E> next = x.next;
    // Lấy nút trước đó của nút hiện tại
    final Node<E> prev = x.prev;

    // Nếu nút trước rỗng, chứng tỏ nút hiện tại là nút đầu
    if (prev == null) {
        // Cho đầu danh sách trỏ thẳng tới nút tiếp theo của nút hiện tại
        first = next;
    } else { // Nếu nút trước không rỗng
        // Cho con trỏ next của nút trước trỏ tới nút tiếp theo của nút hiện tại
        prev.next = next;
        // Đặt con trỏ prev của nút hiện tại về null để GC dễ thu hồi
        x.prev = null;
    }

    // Nếu nút sau rỗng, chứng tỏ nút hiện tại là nút cuối
    if (next == null) {
        // Cho cuối danh sách trỏ thẳng tới nút trước của nút hiện tại
        last = prev;
    } else { // Nếu nút sau không rỗng
        // Cho con trỏ prev của nút sau trỏ tới nút trước của nút hiện tại
        next.prev = prev;
        // Đặt con trỏ next của nút hiện tại về null để GC dễ thu hồi
        x.next = null;
    }

    // Đặt item của nút hiện tại về null để GC dễ thu hồi
    x.item = null;
    size--;
    modCount++;
    return element;
}
```

Logic của phương thức `unlink()` như sau:

1. Trước tiên lấy ra nút trước (`prev`) và nút sau (`next`) của nút `x` cần xóa;
2. Kiểm tra nút `x` cần xóa có phải nút đầu hoặc nút cuối hay không:
   - Nếu `x` là nút đầu, cho `first` trỏ tới nút sau `next` của `x`
   - Nếu `x` là nút cuối, cho `last` trỏ tới nút trước `prev` của `x`
   - Nếu `x` không phải nút đầu cũng không phải nút cuối, thực hiện các bước tiếp theo
3. Cho tham chiếu kế tiếp của nút đứng trước `x` trỏ tới nút sau `next`, ngắt liên kết giữa `x` và `x.prev`;
4. Cho tham chiếu tiền nhiệm của nút đứng sau `x` trỏ tới nút trước `prev`, ngắt liên kết giữa `x` và `x.next`;
5. Đặt giá trị phần tử của nút `x` về `null`, cập nhật độ dài danh sách liên kết.

Có thể tham khảo hình minh họa dưới đây để dễ hiểu (nguồn hình: [Phân tích mã nguồn LinkedList (JDK 1.8)](https://www.tianxiaobo.com/2018/01/31/LinkedList-%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90-JDK-1-8/)):

![Logic phương thức unlink](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedlist-unlink-e57a9bf4.jpg)

### Duyệt danh sách liên kết

Khuyến nghị sử dụng vòng lặp `for-each` để duyệt các phần tử trong `LinkedList`; vòng lặp `for-each` cuối cùng sẽ được chuyển đổi sang dạng Iterator.

```java
LinkedList<String> list = new LinkedList<>();
list.add("apple");
list.add("banana");
list.add("pear");

for (String fruit : list) {
    System.out.println(fruit);
}
```

Cốt lõi việc duyệt `LinkedList` chính là cài đặt Iterator của nó.

```java
// Iterator hai chiều
private class ListItr implements ListIterator<E> {
    // Biểu thị nút vừa đi qua ở lần gọi next() hoặc previous() gần nhất;
    private Node<E> lastReturned;
    // Biểu thị nút tiếp theo sẽ được duyệt;
    private Node<E> next;
    // Biểu thị chỉ số của nút tiếp theo sẽ duyệt, tức là chỉ số của nút sau nút hiện tại;
    private int nextIndex;
    // Biểu thị giá trị bộ đếm sửa đổi kỳ vọng cho lần duyệt hiện tại, dùng để so sánh với modCount của LinkedList nhằm phát hiện danh sách có bị Thread khác sửa đổi hay không.
    private int expectedModCount = modCount;
    ......
}
```

Dưới đây chúng ta cùng đi sâu vào các phương thức cốt lõi trong Iterator `ListItr`.

Trước tiên xem chiều duyệt từ đầu đến cuối:

```java
// Kiểm tra còn nút tiếp theo hay không
public boolean hasNext() {
    // Kiểm tra chỉ số của nút tiếp theo có nhỏ hơn kích thước danh sách không; nếu đúng nghĩa là vẫn còn phần tử tiếp theo để duyệt
    return nextIndex < size;
}
// Lấy nút tiếp theo
public E next() {
    // Kiểm tra xem trong quá trình duyệt danh sách có bị sửa đổi không
    checkForComodification();
    // Kiểm tra còn nút tiếp theo để duyệt không; nếu không thì ném ngoại lệ NoSuchElementException
    if (!hasNext())
        throw new NoSuchElementException();
    // Cho lastReturned trỏ tới nút hiện tại
    lastReturned = next;
    // Cho next trỏ tới nút kế tiếp
    next = next.next;
    nextIndex++;
    return lastReturned.item;
}
```

Tiếp theo xem chiều duyệt từ cuối lên đầu:

```java
// Kiểm tra còn nút đứng trước hay không
public boolean hasPrevious() {
    return nextIndex > 0;
}

// Lấy nút đứng trước
public E previous() {
    // Kiểm tra xem trong quá trình duyệt danh sách có bị sửa đổi không
    checkForComodification();
    // Nếu không còn nút đứng trước thì ném ngoại lệ
    if (!hasPrevious())
        throw new NoSuchElementException();
    // Cho hai con trỏ lastReturned và next trỏ tới nút đứng trước
    lastReturned = next = (next == null) ? last : next.prev;
    nextIndex--;
    return lastReturned.item;
}
```

Nếu cần xóa hoặc chèn phần tử, bạn cũng có thể thao tác thông qua Iterator.

```java
LinkedList<String> list = new LinkedList<>();
list.add("apple");
list.add(null);
list.add("banana");

// Phương thức removeIf của interface Collection ở tầng dưới vẫn dựa trên Iterator
list.removeIf(Objects::isNull);

for (String fruit : list) {
    System.out.println(fruit);
}
```

Phương thức xóa phần tử tương ứng của Iterator như sau:

```java
// Xóa khỏi danh sách phần tử vừa được trả về ở lần duyệt gần nhất
public void remove() {
    // Kiểm tra xem trong quá trình duyệt danh sách có bị sửa đổi không
    checkForComodification();
    // Nếu nút trả về lần trước là null thì ném ngoại lệ
    if (lastReturned == null)
        throw new IllegalStateException();

    // Lấy nút đứng sau nút hiện tại
    Node<E> lastNext = lastReturned.next;
    // Xóa nút vừa được trả về khỏi danh sách liên kết
    unlink(lastReturned);
    // Cập nhật con trỏ
    if (next == lastReturned)
        next = lastNext;
    else
        nextIndex--;
    // Đặt tham chiếu nút vừa trả về về null để GC dễ thu hồi
    lastReturned = null;
    expectedModCount++;
}
```

## Kiểm thử các phương thức thường dùng của LinkedList

Mã nguồn:

```java
// Tạo một đối tượng LinkedList
LinkedList<String> list = new LinkedList<>();

// Thêm phần tử vào cuối danh sách liên kết
list.add("apple");
list.add("banana");
list.add("pear");
System.out.println("Nội dung danh sách: " + list);

// Chèn phần tử vào vị trí chỉ định
list.add(1, "orange");
System.out.println("Nội dung danh sách: " + list);

// Lấy phần tử tại vị trí chỉ định
String fruit = list.get(2);
System.out.println("Phần tử tại chỉ số 2: " + fruit);

// Sửa phần tử tại vị trí chỉ định
list.set(3, "grape");
System.out.println("Nội dung danh sách: " + list);

// Xóa phần tử tại vị trí chỉ định
list.remove(0);
System.out.println("Nội dung danh sách: " + list);

// Xóa phần tử chỉ định xuất hiện đầu tiên
list.remove("banana");
System.out.println("Nội dung danh sách: " + list);

// Lấy độ dài danh sách liên kết
int size = list.size();
System.out.println("Độ dài danh sách: " + size);

// Xóa sạch danh sách liên kết
list.clear();
System.out.println("Danh sách sau khi xóa sạch: " + list);
```

Kết quả đầu ra:

```plain
Phần tử tại chỉ số 2: banana
Nội dung danh sách: [apple, orange, banana, grape]
Nội dung danh sách: [orange, banana, grape]
Nội dung danh sách: [orange, grape]
Độ dài danh sách: 2
Danh sách sau khi xóa sạch: []
```
