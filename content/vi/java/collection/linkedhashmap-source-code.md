---
title: Phân tích mã nguồn LinkedHashMap
description: "Phân tích chuyên sâu mã nguồn LinkedHashMap: giải thích chi tiết cách LinkedHashMap duy trì danh sách liên kết đôi để đảm bảo thứ tự chèn/truy cập, cài đặt LRU Cache, sự khác biệt với HashMap và tối ưu hiệu năng duyệt phần tử."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/linkedhashmap-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn LinkedHashMap,thứ tự chèn,thứ tự truy cập,LRU Cache,danh sách liên kết đôi,Map có thứ tự,nguyên lý triển khai LinkedHashMap
---

## Giới thiệu về LinkedHashMap

`LinkedHashMap` là một lớp collection do Java cung cấp, kế thừa từ `HashMap` và duy trì thêm một danh sách liên kết đôi (doubly linked list) trên nền tảng `HashMap`, mang lại các đặc tính sau:

1. Hỗ trợ duyệt theo thứ tự chèn (insertion order) một cách có trật tự.
2. Hỗ trợ sắp xếp theo thứ tự truy cập phần tử (access order), phù hợp để đóng gói công cụ LRU Cache.
3. Do bên trong sử dụng danh sách liên kết đôi để quản lý từng node, hiệu năng duyệt tỉ lệ thuận với số lượng phần tử thực tế; so với `HashMap` (tỉ lệ thuận với dung lượng mảng bucket), hiệu năng duyệt của `LinkedHashMap` cao hơn nhiều.

Cấu trúc logic của `LinkedHashMap` như hình dưới đây. Dựa trên nền tảng của `HashMap`, nó duy trì một danh sách liên kết đôi nối giữa các node, giúp các node, danh sách liên kết và Cây đỏ-đen (Red-Black Tree) vốn phân tán ở các bucket khác nhau được liên kết với nhau theo đúng thứ tự.

![Cấu trúc logic của LinkedHashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkhashmap-structure-overview-f60836d3.png)

## Ví dụ sử dụng LinkedHashMap

### Duyệt theo thứ tự chèn (Insertion Order)

Như ví dụ dưới đây, chúng ta thêm các phần tử vào `LinkedHashMap` theo thứ tự rồi tiến hành duyệt.

```java
HashMap < String, String > map = new LinkedHashMap < > ();
map.put("a", "2");
map.put("g", "3");
map.put("r", "1");
map.put("e", "23");

for (Map.Entry < String, String > entry: map.entrySet()) {
    System.out.println(entry.getKey() + ":" + entry.getValue());
}
```

Kết quả đầu ra:

```java
a:2
g:3
r:1
e:23
```

Có thể thấy thứ tự duyệt của `LinkedHashMap` trùng khớp với thứ tự chèn — đây là tính năng mà `HashMap` không có.

### Duyệt theo thứ tự truy cập (Access Order)

`LinkedHashMap` định nghĩa chế độ sắp xếp `accessOrder` (kiểu `boolean`, mặc định là `false`): `true` là theo thứ tự truy cập, `false` là theo thứ tự chèn.

Để thực hiện duyệt theo thứ tự truy cập, chúng ta có thể dùng hàm khởi tạo của `LinkedHashMap` có truyền tham số `accessOrder` và đặt `accessOrder` bằng `true`, biểu thị rằng nó duy trì thứ tự theo lần truy cập.

```java
LinkedHashMap<Integer, String> map = new LinkedHashMap<>(16, 0.75f, true);
map.put(1, "one");
map.put(2, "two");
map.put(3, "three");
map.put(4, "four");
map.put(5, "five");
// Truy cập phần tử 2, phần tử này sẽ được di chuyển về cuối danh sách liên kết
map.get(2);
// Truy cập phần tử 3, phần tử này sẽ được di chuyển về cuối danh sách liên kết
map.get(3);
for (Map.Entry<Integer, String> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " : " + entry.getValue());
}
```

Kết quả đầu ra:

```java
1 : one
4 : four
5 : five
2 : two
3 : three
```

Có thể thấy thứ tự duyệt của `LinkedHashMap` trùng khớp với thứ tự truy cập.

### LRU Cache

Từ ví dụ trên, chúng ta có thể thấy thông qua `LinkedHashMap`, ta dễ dàng đóng gói một phiên bản đơn giản của LRU (**L**east **R**ecently **U**sed — ít được sử dụng gần đây nhất) Cache, đảm bảo khi số phần tử lưu trữ vượt quá dung lượng của container thì phần tử ít được truy cập nhất gần đây sẽ bị loại bỏ.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/lru-cache-34d62be1.png)

Ý tưởng triển khai cụ thể như sau:

- Kế thừa `LinkedHashMap`;
- Trong hàm khởi tạo chỉ định `accessOrder` là `true`, nhờ vậy khi truy cập phần tử, phần tử đó sẽ được đưa về cuối danh sách liên kết, còn phần tử đầu danh sách chính là phần tử ít được truy cập nhất gần đây;
- Ghi đè (`Override`) phương thức `removeEldestEntry`; phương thức này trả về một giá trị `boolean` cho `LinkedHashMap` biết có cần xóa phần tử đầu danh sách liên kết hay không (do dung lượng cache có hạn).

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    /**
     * Trả về true khi size vượt quá dung lượng, báo cho LinkedHashMap xóa mục cache cũ nhất (phần tử đầu danh sách)
     */
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}
```

Mã kiểm thử như sau: tác giả khởi tạo dung lượng cache là 3, sau đó lần lượt thêm vào 4 phần tử:

```java
LRUCache<Integer, String> cache = new LRUCache<>(3);
cache.put(1, "one");
cache.put(2, "two");
cache.put(3, "three");
cache.put(4, "four");
cache.put(5, "five");
for (int i = 1; i <= 5; i++) {
    System.out.println(cache.get(i));
}
```

Kết quả đầu ra:

```java
null
null
three
four
five
```

Từ kết quả đầu ra có thể thấy, vì dung lượng cache là 3 nên khi thêm phần tử thứ 4 thì phần tử thứ 1 bị xóa, và khi thêm phần tử thứ 5 thì phần tử thứ 2 bị xóa.

## Phân tích mã nguồn LinkedHashMap

### Thiết kế của Node

Trước khi đi sâu vào `LinkedHashMap`, hãy nói qua về thiết kế của lớp node `Entry` trong `LinkedHashMap`. Chúng ta đều biết các node trong một bucket của `HashMap` vì xung đột mà chuyển thành danh sách liên kết sẽ được chuyển đổi sang Cây đỏ-đen (Red-Black Tree) khi thỏa mãn đồng thời hai điều kiện sau:

1. ~~Số lượng node trong danh sách liên kết đạt tới ngưỡng cây hóa là 7, tức `TREEIFY_THRESHOLD - 1`.~~
2. Dung lượng của mảng bucket đạt mức dung lượng cây hóa tối thiểu là `MIN_TREEIFY_CAPACITY`.

> **🐛 Đính chính (xem thêm: [issue#2147](https://github.com/Snailclimb/JavaGuide/issues/2147))**:
>
> Ngưỡng cây hóa cho số lượng node trên danh sách liên kết là 8 chứ không phải 7. Vì mã nguồn duyệt từ phần tử đầu tiên với chỉ số bắt đầu từ 0, nên điều kiện kiểm tra được đặt là `8 - 1 = 7`, thực chất là khi duyệt tới phần tử cuối cùng mới kiểm tra xem tổng chiều dài danh sách liên kết có lớn hơn hoặc bằng 8 hay không rồi mới thực hiện cây hóa.
>
> ![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/LinkedHashMap-putval-TREEIFY-87952fa6.png)

Trong khi đó, `LinkedHashMap` xây dựng một danh sách liên kết đôi cho mọi node trên nền `HashMap`. Điều này đòi hỏi các node cây sau khi chuyển sang Cây đỏ-đen cũng phải có đặc tính của node danh sách liên kết đôi, tức là mỗi node cây đều cần sở hữu hai tham chiếu lưu địa chỉ của node trước (predecessor) và node sau (successor). Vì vậy, việc thiết kế lớp node cây `TreeNode` là một bài toán khá hóc búa.

Hãy xem biểu đồ lớp (class diagram) giữa các lớp node của hai bên, có thể thấy:

1. Lớp nội bộ `Entry` của `LinkedHashMap` dựa trên nền tảng của `HashMap`, bổ sung hai con trỏ `before` và `after` để node có đặc tính của danh sách liên kết đôi.
2. Node cây `TreeNode` của `HashMap` kế thừa từ `Entry` của `LinkedHashMap` vốn đã có đặc tính danh sách liên kết đôi.

![Mối quan hệ giữa LinkedHashMap và HashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/map-hashmap-linkedhashmap-e0970ec7.png)

Nhiều bạn đọc lúc này sẽ có thắc mắc: tại sao `TreeNode` của `HashMap` lại phải kế thừa đặc tính danh sách liên kết đôi thông qua `LinkedHashMap`? Tại sao không cài đặt thẳng con trỏ trước và sau ngay trên `Node`?

Hãy trả lời câu hỏi thứ nhất trước. Chúng ta đều biết `LinkedHashMap` bổ sung con trỏ hai chiều cho node trên nền `HashMap` để hiện thực hóa danh sách liên kết đôi, nên khi danh sách liên kết bên trong `LinkedHashMap` chuyển sang Cây đỏ-đen, các node tương ứng sẽ chuyển thành `TreeNode`. Để đảm bảo khi dùng `LinkedHashMap` thì node cây vẫn có đặc tính danh sách liên kết đôi, `TreeNode` cần phải kế thừa `Entry` của `LinkedHashMap`.

Tiếp theo nói về câu hỏi thứ hai: tại sao không cài đặt thẳng con trỏ trước và sau lên `Node` của `HashMap`, rồi để `TreeNode` kế thừa trực tiếp `Node` lấy đặc tính danh sách liên kết đôi? Thực tế làm vậy vẫn được. Chỉ có điều cách làm này sẽ khiến lớp `Node` dùng để lưu cặp key-value khi sử dụng `HashMap` thuần bị dư ra hai tham chiếu không cần thiết, chiếm dụng bộ nhớ một cách lãng phí.

Do đó, để đảm bảo lớp `Node` tầng dưới của `HashMap` không có tham chiếu dư thừa, đồng thời vẫn đảm bảo lớp `Entry` của `LinkedHashMap` có tham chiếu lưu danh sách liên kết, các tác giả thiết kế đã để `Entry` của `LinkedHashMap` kế thừa `Node` và bổ sung thêm hai tham chiếu `before`, `after`, chỉ những node nào cần đặc tính danh sách liên kết mới mang thêm phần logic đó. Sau đó `TreeNode` kế thừa lại `Entry` để có được hai con trỏ `before` và `after`.

```java
static class Entry<K,V> extends HashMap.Node<K,V> {
        Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }
```

Nhưng làm như vậy chẳng phải cũng khiến `TreeNode` khi dùng trong `HashMap` bị dư ra hai tham chiếu không cần thiết sao? Đây chẳng phải cũng là một sự lãng phí bộ nhớ hay sao?

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
  // lược bỏ

}
```

Đối với vấn đề này, hãy trích dẫn một đoạn chú thích của chính các tác giả JDK: họ cho rằng khi thuật toán `hashCode` phân bố tốt, xác suất `HashMap` chuyển sang Cây đỏ-đen là không lớn. Ngay cả khi đã chuyển thành Cây đỏ-đen với `TreeNode`, về sau do xóa phần tử hoặc mở rộng dung lượng (`resize`) thì `TreeNode` cũng có thể chuyển ngược lại thành `Node`, nên tần suất sử dụng `TreeNode` không cao; sự lãng phí không gian tài nguyên nhỏ này là hoàn toàn chấp nhận được.

```bash
Because TreeNodes are about twice the size of regular nodes, we
use them only when bins contain enough nodes to warrant use
(see TREEIFY_THRESHOLD). And when they become too small (due to
removal or resizing) they are converted back to plain bins.  In
usages with well-distributed user hashCodes, tree bins are
rarely used.  Ideally, under random hashCodes, the frequency of
nodes in bins follows a Poisson distribution
```

### Các hàm khởi tạo (Constructors)

`LinkedHashMap` có 4 hàm khởi tạo được cài đặt khá đơn giản, gọi thẳng hàm khởi tạo của lớp cha `HashMap` để hoàn tất khởi tạo.

```java
public LinkedHashMap() {
    super();
    accessOrder = false;
}

public LinkedHashMap(int initialCapacity) {
    super(initialCapacity);
    accessOrder = false;
}

public LinkedHashMap(int initialCapacity, float loadFactor) {
    super(initialCapacity, loadFactor);
    accessOrder = false;
}

public LinkedHashMap(int initialCapacity,
    float loadFactor,
    boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```

Như đã đề cập ở trên, mặc định `accessOrder` là `false`. Nếu muốn `LinkedHashMap` sắp xếp các cặp key-value theo thứ tự truy cập (tức đưa các phần tử lâu chưa truy cập lên đầu danh sách liên kết và đẩy các phần tử mới truy cập xuống cuối danh sách), cần gọi hàm khởi tạo thứ 4 để đặt `accessOrder` thành `true`.

### Phương thức `get`

`get` là phương thức duy nhất trong các thao tác CRUD được `LinkedHashMap` ghi đè (`Override`). Khi `accessOrder` là `true`, sau khi truy vấn xong phần tử, nó sẽ di chuyển phần tử vừa truy cập xuống cuối danh sách liên kết.

```java
public V get(Object key) {
     Node < K, V > e;
     // Lấy cặp key-value theo key, nếu null thì trả về luôn
     if ((e = getNode(hash(key), key)) == null)
         return null;
     // Nếu accessOrder là true, gọi afterNodeAccess để chuyển phần tử hiện tại về cuối danh sách
     if (accessOrder)
         afterNodeAccess(e);
     // Trả về giá trị của cặp key-value
     return e.value;
 }
```

Từ mã nguồn có thể thấy các bước thực thi của `get` rất đơn giản:

1. Gọi `getNode` của lớp cha `HashMap` để lấy cặp key-value; nếu null thì trả về ngay.
2. Kiểm tra `accessOrder` có là `true` không; nếu là `true` chứng tỏ `LinkedHashMap` cần đảm bảo tính thứ tự truy cập của danh sách liên kết, thực hiện bước 3.
3. Gọi phương thức `afterNodeAccess` do `LinkedHashMap` ghi đè để đưa phần tử hiện tại xuống cuối danh sách liên kết.

Điểm mấu chốt nằm ở cách triển khai phương thức `afterNodeAccess`, phương thức chịu trách nhiệm di chuyển phần tử xuống cuối danh sách liên kết.

```java
void afterNodeAccess(Node < K, V > e) { // move node to last
    LinkedHashMap.Entry < K, V > last;
    // Nếu accessOrder là true và node hiện tại chưa phải là node cuối của danh sách
    if (accessOrder && (last = tail) != e) {

        // Lấy node hiện tại p, cùng node trước b và node sau a của nó
        LinkedHashMap.Entry < K, V > p =
            (LinkedHashMap.Entry < K, V > ) e, b = p.before, a = p.after;

        // Cho con trỏ sau của p trỏ tới null, ngắt kết nối với node sau
        p.after = null;

        // Nếu node trước là null, tức p là node đầu, đặt node sau a làm node đầu mới
        if (b == null)
            head = a;
        else
            // Nếu node trước không null, cho node trước trỏ tới node sau
            b.after = a;

        // Nếu node sau không null, cho node sau trỏ ngược về node trước
        if (a != null)
            a.before = b;
        else
            // Nếu node sau null, cho last trỏ tới node trước (nhánh else này thực chất không có ý nghĩa vì if ở đầu đã đảm bảo p không phải node cuối nên after không thể là null)
            last = b;

        // Nếu last là null, tức danh sách chỉ có một node p, cho head trỏ tới p
        if (last == null)
            head = p;
        else {
            // Ngược lại cho con trỏ before của p trỏ tới node cuối, và con trỏ after của node cuối trỏ tới p
            p.before = last;
            last.after = p;
        }
        // tail trỏ tới p, hoàn tất việc chuyển node p về cuối danh sách liên kết
        tail = p;

        ++modCount;
    }
}
```

Từ mã nguồn có thể thấy `afterNodeAccess` đã hoàn thành các thao tác sau:

1. Nếu `accessOrder` là `true` và đuôi danh sách liên kết không phải là node hiện tại `p`, ta cần di chuyển node hiện tại xuống cuối danh sách.
2. Lấy node hiện tại `p`, cùng node trước `b` và node sau `a` của nó.
3. Đặt con trỏ sau của node `p` thành `null`, ngắt liên kết giữa nó với node kế tiếp.
4. Thử nối node trước `b` trỏ tới node sau `a`; nếu node trước bị null, chứng tỏ node hiện tại `p` chính là node đầu danh sách, nên đặt trực tiếp node sau `a` làm node đầu, sau đó mới nối `p` ra sau `a`.
5. Tiếp theo cho node sau `a` trỏ ngược về node trước `b`.
6. Các thao tác trên đã nối xong node trước với node sau và tách riêng được node `p` ra; bước này sẽ nối `p` vào cuối danh sách liên kết. Nếu phần cuối danh sách (`last`) bị null, chứng tỏ danh sách hiện tại chỉ có một node `p`, nên chỉ cần cho `head` trỏ tới `p`.
7. Sau khi đưa được `p` xuống cuối danh sách, cuối cùng cập nhật con trỏ `tail` (con trỏ trỏ tới cuối danh sách) sang `p`.

Bạn có thể kết hợp với hình minh họa dưới đây, cho thấy phần tử có `key` là `13` được di chuyển xuống cuối danh sách liên kết.

![LinkedHashMap di chuyển phần tử 13 về cuối danh sách liên kết](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-get-872c9ba9.png)

Chưa hiểu hết ngay cũng không sao, chỉ cần biết tác dụng của phương thức này là đủ, sau này có thời gian có thể nghiền ngẫm dần.

### `newNode` — Chèn node mới vào cuối danh sách liên kết

Phần trên đã trình bày cách `afterNodeAccess` di chuyển **node đã tồn tại** xuống cuối danh sách liên kết; vậy **node mới được chèn vào** được thêm vào danh sách liên kết như thế nào?

Câu trả lời nằm ở việc `LinkedHashMap` ghi đè phương thức `newNode` của `HashMap`. Khi `HashMap` chèn một cặp key-value mới, nó sẽ gọi `newNode` để tạo đối tượng node. Trong phương thức ghi đè của mình, `LinkedHashMap` không chỉ tạo node `Entry` mà còn gọi thêm `linkNodeLast` để nối node đó vào cuối danh sách liên kết đôi:

```java
// newNode của HashMap là cài đặt thông thường
Node<K,V> newNode(int hash, K key, V value, Node<K,V> next) {
    return new Node<>(hash, key, value, next);
}

// LinkedHashMap ghi đè newNode, gọi thêm linkNodeLast
Node<K,V> newNode(int hash, K key, V value, Node<K,V> e) {
    LinkedHashMap.Entry<K,V> p =
        new LinkedHashMap.Entry<>(hash, key, value, e);
    linkNodeLast(p);  // Điểm mấu chốt: nối node mới vào cuối danh sách liên kết
    return p;
}
```

Cách triển khai của phương thức `linkNodeLast` như sau:

```java
// Nối node vào cuối danh sách liên kết đôi
private void linkNodeLast(LinkedHashMap.Entry<K,V> p) {
    LinkedHashMap.Entry<K,V> last = tail;
    tail = p;  // tail trỏ tới node mới
    if (last == null)
        head = p;  // Danh sách đang rỗng, head cũng trỏ tới node mới
    else {
        p.before = last;  // Node trước của node mới trỏ tới node cuối cũ
        last.after = p;   // Node sau của node cuối cũ trỏ tới node mới
    }
}
```

**Đây chính là cơ chế cốt lõi giúp `LinkedHashMap` duy trì thứ tự chèn**: mỗi khi chèn node mới, thông qua việc ghi đè `newNode` và gọi `linkNodeLast`, node mới được nối thêm vào cuối danh sách liên kết đôi. Nhờ vậy khi duyệt từ node đầu `head` theo con trỏ `after`, ta có thể lấy ra toàn bộ phần tử đúng theo thứ tự chèn.

Tương tự, `LinkedHashMap` cũng ghi đè phương thức `newTreeNode` để đảm bảo node cây khi được chèn vào cũng sẽ được nối vào cuối danh sách liên kết:

```java
TreeNode<K,V> newTreeNode(int hash, K key, V value, Node<K,V> next) {
    TreeNode<K,V> p = new TreeNode<K,V>(hash, key, value, next);
    linkNodeLast(p);
    return p;
}
```

### Thao tác hậu xử lý của `remove` — `afterNodeRemoval`

`LinkedHashMap` không ghi đè phương thức `remove` mà kế thừa trực tiếp phương thức `remove` của `HashMap`. Để đảm bảo sau khi cặp key-value bị xóa thì node trong danh sách liên kết đôi cũng được gỡ bỏ đồng bộ, `LinkedHashMap` đã ghi đè phương thức rỗng `afterNodeRemoval` của `HashMap`.

```java
final Node<K,V> removeNode(int hash, Object key, Object value,
                               boolean matchValue, boolean movable) {
        // lược bỏ
            if (node != null && (!matchValue || (v = node.value) == value ||
                                 (value != null && value.equals(v)))) {
                if (node instanceof TreeNode)
                    ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
                else if (node == p)
                    tab[index] = node.next;
                else
                    p.next = node.next;
                ++modCount;
                --size;
                // Sau khi removeNode của HashMap xóa phần tử xong, gọi afterNodeRemoval để xử lý hậu xóa
                afterNodeRemoval(node);
                return node;
            }
        }
        return null;
    }
// Cài đặt rỗng
void afterNodeRemoval(Node<K,V> p) { }
```

Ta có thể thấy phương thức `removeNode` được gọi bên trong phương thức `remove` kế thừa từ `HashMap` sau khi xóa node khỏi bucket đã gọi tới `afterNodeRemoval`.

```java
void afterNodeRemoval(Node<K,V> e) { // unlink

    // Lấy node hiện tại p, cùng node trước b và node sau a của e
        LinkedHashMap.Entry<K,V> p =
            (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
    // Đặt cả con trỏ before và after của p về null, ngắt kết nối với node trước và sau
        p.before = p.after = null;

    // Nếu node trước là null, tức node p là đầu danh sách, cho con trỏ head trỏ tới node sau a
        if (b == null)
            head = a;
        else
        // Nếu node trước b không null, cho b trỏ trực tiếp tới node sau a
            b.after = a;

    // Nếu node sau là null, tức node p ở cuối danh sách, cho con trỏ tail trỏ trực tiếp tới node trước b
        if (a == null)
            tail = b;
        else
        // Ngược lại cho con trỏ before của node sau trỏ trực tiếp tới node trước b
            a.before = b;
    }
```

Từ mã nguồn có thể thấy toàn bộ thao tác của `afterNodeRemoval` là ngắt kết nối giữa node `p` với node trước và node sau của nó, chờ Garbage Collection thu gom; các bước tổng thể gồm:

1. Lấy node hiện tại `p`, cùng node trước `b` và node sau `a` của `p`.
2. Ngắt kết nối giữa node `p` với node trước và node sau của nó.
3. Thử cho node trước `b` trỏ tới node sau `a`; nếu `b` là null tức node `p` đang ở đầu danh sách, ta cho trực tiếp `head` trỏ tới node sau `a`.
4. Thử cho node sau `a` trỏ tới node trước `b`; nếu `a` là null tức node `p` đang ở cuối danh sách, nên cho trực tiếp con trỏ `tail` trỏ tới node trước `b`.

Bạn có thể kết hợp với hình dưới đây, minh họa phần tử có `key` bằng `13` bị xóa — tức bị gỡ bỏ khỏi danh sách liên kết.

![LinkedHashMap xóa phần tử 13](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-remove-2699abef.png)

Chưa hiểu hết ngay cũng không sao, chỉ cần nắm được vai trò của phương thức này là đủ, sau này có thời gian có thể đọc kỹ lại.

### Thao tác hậu xử lý của `put` — `afterNodeInsertion`

Tương tự, `LinkedHashMap` không tự cài đặt phương thức chèn mà kế thừa trực tiếp toàn bộ các phương thức chèn của `HashMap` cho người dùng sử dụng; nhưng để duy trì tính thứ tự truy cập của danh sách liên kết đôi, nó thực hiện hai việc:

1. Ghi đè `afterNodeAccess` (đã đề cập ở trên): nếu `key` đang được chèn đã tồn tại trong `map`, vì thao tác chèn của `LinkedHashMap` sẽ nối node mới vào cuối danh sách, nên với `key` đã tồn tại sẽ gọi `afterNodeAccess` để đưa nó xuống cuối danh sách liên kết.
2. Ghi đè phương thức `afterNodeInsertion` của `HashMap`: khi `removeEldestEntry` trả về `true`, nó sẽ xóa node đầu danh sách liên kết.

Ta có thể thấy rõ điều này trong phương thức cốt lõi `putVal` của `HashMap`.

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
          // lược bỏ
            if (e != null) { // đã tồn tại ánh xạ cho key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                 // Nếu key hiện tại đã tồn tại trong map, gọi afterNodeAccess
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
         // Gọi phương thức hậu chèn, phương thức này được LinkedHashMap ghi đè
        afterNodeInsertion(evict);
        return null;
    }
```

Các bước ở đoạn mã trên đã được giải thích trước đó, nên ở đây ta tập trung tìm hiểu quy trình hoạt động của `afterNodeInsertion`. Giả sử chúng ta đã ghi đè `removeEldestEntry` để trả về `true` khi `size` của danh sách vượt quá `capacity`.

```java
/**
 * Trả về true khi size vượt quá dung lượng, báo cho LinkedHashMap xóa mục cache cũ nhất (phần tử đầu danh sách)
 */
protected boolean removeEldestEntry(Map.Entry < K, V > eldest) {
    return size() > capacity;
}
```

Lấy hình dưới đây làm ví dụ: giả sử tác giả vừa chèn mới một node chưa tồn tại là `19`, và `capacity` bằng 4, nên `removeEldestEntry` trả về `true`, ta cần phải xóa node đầu của danh sách liên kết.

![Chèn phần tử mới 19 vào LinkedHashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-after-insert-1-4cd3c584.png)

Các bước xóa rất đơn giản: kiểm tra xem node đầu danh sách có tồn tại không; nếu có thì ngắt quan hệ giữa node đầu và node kế tiếp, đồng thời cho con trỏ `head` trỏ sang node tiếp theo. Nhờ đó con trỏ `head` trỏ tới `12`, còn node `10` trở thành đối tượng trống không còn tham chiếu nào trỏ tới, chờ GC thu gom.

![Chèn phần tử mới 19 vào LinkedHashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-after-insert-2-aca094bd.png)

```java
void afterNodeInsertion(boolean evict) { // có thể xóa phần tử cũ nhất
        LinkedHashMap.Entry<K,V> first;
        // Nếu evict là true, phần tử đầu không null và removeEldestEntry trả về true, tức cần xóa phần tử cũ nhất (ở đầu danh sách)
        if (evict && (first = head) != null && removeEldestEntry(first)) {
          // Lấy key của cặp key-value ở đầu danh sách
            K key = first.key;
            // Gọi removeNode xóa phần tử khỏi bucket của HashMap, đồng thời ngắt khỏi danh sách liên kết đôi của LinkedHashMap để chờ GC thu gom
            removeNode(hash(key), key, null, false, true);
        }
    }
```

Từ mã nguồn có thể thấy `afterNodeInsertion` đã thực hiện các thao tác sau:

1. Kiểm tra xem `eldest` có là `true` hay không; chỉ khi là `true` mới có thể cần xóa cặp key-value cũ nhất (tức phần tử ở đầu danh sách liên kết). Để xác định chính xác có thực hiện xóa hay không, còn phải xác nhận danh sách có rỗng không (`(first = head) != null`) và phương thức `removeEldestEntry` có trả về `true` hay không. Chỉ khi cả hai đều thỏa mãn mới xác định được danh sách hiện tại không rỗng và cần tiến hành xóa phần tử.
2. Lấy `key` của phần tử đầu tiên trong danh sách liên kết.
3. Gọi phương thức `removeNode` của `HashMap`. Như đã đề cập ở trên, phương thức này sẽ xóa node khỏi bucket của `HashMap`, đồng thời `LinkedHashMap` cũng đã ghi đè `afterNodeRemoval` được gọi trong `removeNode`, nên bước này sẽ xóa phần tử khỏi bucket của `HashMap`, ngắt khỏi danh sách liên kết đôi của `LinkedHashMap` và chờ GC thu gom.

## So sánh hiệu năng duyệt giữa LinkedHashMap và HashMap

`LinkedHashMap` duy trì một danh sách liên kết đôi để ghi lại thứ tự chèn dữ liệu, do đó khi duyệt qua Iterator được tạo ra, nó duyệt trực tiếp theo đường đi của danh sách liên kết đôi. Điều này hiệu quả hơn nhiều so với cách duyệt toàn bộ mảng bucket của `HashMap`.

Điều này có thể kiểm chứng ngay từ Iterator của hai lớp. Trước hết hãy xem Iterator của `HashMap`: có thể thấy khi duyệt các cặp key-value, `HashMap` sử dụng phương thức `nextNode`, trả về phần tử kế tiếp mà `next` đang trỏ tới và từ `next` tiếp tục quét qua các bucket để tìm `Node` không rỗng tiếp theo trong mảng bucket.

```java
 final class EntryIterator extends HashIterator
 implements Iterator < Map.Entry < K, V >> {
     public final Map.Entry < K,
     V > next() {
         return nextNode();
     }
 }

 // Lấy Node tiếp theo
 final Node < K, V > nextNode() {
     Node < K, V > [] t;
     // Lấy phần tử kế tiếp next
     Node < K, V > e = next;
     if (modCount != expectedModCount)
         throw new ConcurrentModificationException();
     if (e == null)
         throw new NoSuchElementException();
     // Đưa next trỏ tới Node không rỗng tiếp theo trong bucket
     if ((next = (current = e).next) == null && (t = table) != null) {
         do {} while (index < t.length && (next = t[index++]) == null);
     }
     return e;
 }
```

So với đó, Iterator của `LinkedHashMap` sử dụng trực tiếp con trỏ `after` để định vị nhanh node kế tiếp của node hiện tại, gọn nhẹ và hiệu quả hơn hẳn.

```java
 final class LinkedEntryIterator extends LinkedHashIterator
 implements Iterator < Map.Entry < K, V >> {
     public final Map.Entry < K,
     V > next() {
         return nextNode();
     }
 }
 // Lấy Node tiếp theo
 final LinkedHashMap.Entry < K, V > nextNode() {
     // Lấy node kế tiếp next
     LinkedHashMap.Entry < K, V > e = next;
     if (modCount != expectedModCount)
         throw new ConcurrentModificationException();
     if (e == null)
         throw new NoSuchElementException();
     // Con trỏ current trỏ tới node hiện tại
     current = e;
     // next dùng thẳng con trỏ after của node hiện tại để định vị nhanh node tiếp theo
     next = e.after;
     return e;
 }
```

Để kiểm chứng nhận định của mình, tác giả đã tiến hành stress test trên hai container này, đo thời gian chèn 10 triệu bản ghi và duyệt 10 triệu bản ghi với đoạn mã sau:

```java
int count = 1000_0000;
Map<Integer, Integer> hashMap = new HashMap<>();
Map<Integer, Integer> linkedHashMap = new LinkedHashMap<>();

long start, end;

start = System.currentTimeMillis();
for (int i = 0; i < count; i++) {
    hashMap.put(ThreadLocalRandom.current().nextInt(1, count), ThreadLocalRandom.current().nextInt(0, count));
}
end = System.currentTimeMillis();
System.out.println("map time putVal: " + (end - start));

start = System.currentTimeMillis();
for (int i = 0; i < count; i++) {
    linkedHashMap.put(ThreadLocalRandom.current().nextInt(1, count), ThreadLocalRandom.current().nextInt(0, count));
}
end = System.currentTimeMillis();
System.out.println("linkedHashMap putVal time: " + (end - start));

start = System.currentTimeMillis();
long num = 0;
for (Integer v : hashMap.values()) {
    num = num + v;
}
end = System.currentTimeMillis();
System.out.println("map get time: " + (end - start));

start = System.currentTimeMillis();
for (Integer v : linkedHashMap.values()) {
    num = num + v;
}
end = System.currentTimeMillis();
System.out.println("linkedHashMap get time: " + (end - start));
System.out.println(num);
```

Nhìn từ kết quả đầu ra, do `LinkedHashMap` phải duy trì danh sách liên kết đôi nên việc chèn phần tử tốn thời gian hơn so với `HashMap`; nhưng nhờ có mối liên hệ trước-sau rõ ràng của danh sách liên kết đôi nên hiệu năng duyệt cao hơn hẳn. Tuy nhiên nhìn chung sự chênh lệch không quá lớn khi xét trên lượng dữ liệu đồ sộ như vậy.

```bash
map time putVal: 5880
linkedHashMap putVal time: 7567
map get time: 143
linkedHashMap get time: 67
63208969074998
```

## Câu hỏi phỏng vấn thường gặp về LinkedHashMap

### LinkedHashMap là gì?

`LinkedHashMap` là một lớp con của `HashMap` trong Java Collections Framework. Nó kế thừa toàn bộ thuộc tính và phương thức của `HashMap`, đồng thời ghi đè các phương thức `afterNodeRemoval`, `afterNodeInsertion` và `afterNodeAccess` trên nền `HashMap`, giúp sở hữu đặc tính có thứ tự theo trình tự chèn và trình tự truy cập.

### LinkedHashMap duyệt phần tử theo thứ tự chèn như thế nào?

Duyệt phần tử theo thứ tự chèn là hành vi mặc định của `LinkedHashMap`. Bên trong `LinkedHashMap` duy trì một danh sách liên kết đôi dùng để ghi nhận thứ tự chèn của các phần tử. Do đó, khi sử dụng Iterator để duyệt phần tử, thứ tự của các phần tử sẽ giống hệt thứ tự chúng được chèn vào ban đầu.

### LinkedHashMap duyệt phần tử theo thứ tự truy cập như thế nào?

`LinkedHashMap` có thể chỉ định duyệt phần tử theo thứ tự truy cập thông qua tham số `accessOrder` trong hàm khởi tạo. Khi `accessOrder` là `true`, mỗi lần truy cập một phần tử, phần tử đó sẽ được di chuyển về cuối danh sách liên kết; do vậy trong lần duyệt tiếp theo, phần tử vừa truy cập sẽ nằm ở vị trí cuối cùng của danh sách, qua đó hiện thực hóa việc duyệt theo thứ tự truy cập.

### LinkedHashMap triển khai LRU Cache như thế nào?

Đặt `accessOrder` thành `true` và ghi đè phương thức `removeEldestEntry` để trả về `true` khi kích thước danh sách vượt quá dung lượng. Nhờ vậy mỗi lần truy cập một phần tử, phần tử đó sẽ được đưa về cuối danh sách liên kết. Một khi thao tác chèn làm `removeEldestEntry` trả về `true`, nghĩa là cache đã đầy, `LinkedHashMap` sẽ xóa phần tử đầu danh sách liên kết — từ đó chúng ta có thể triển khai một LRU Cache.

### Sự khác biệt giữa LinkedHashMap và HashMap là gì?

`LinkedHashMap` và `HashMap` đều là các lớp triển khai của interface `Map` trong Java Collections Framework. Sự khác biệt lớn nhất giữa chúng nằm ở thứ tự duyệt phần tử: thứ tự duyệt phần tử của `HashMap` là không xác định, trong khi `LinkedHashMap` cung cấp khả năng duyệt phần tử theo thứ tự chèn hoặc thứ tự truy cập. Ngoài ra, bên trong `LinkedHashMap` duy trì một danh sách liên kết đôi để ghi lại thứ tự chèn hoặc thứ tự truy cập, còn `HashMap` thì không có danh sách liên kết này. Vì vậy, hiệu năng chèn của `LinkedHashMap` có thể hơi thấp hơn một chút so với `HashMap`, nhưng nó cung cấp nhiều tính năng hơn và hiệu năng duyệt cũng cao hơn so với `HashMap`.

## Tài liệu tham khảo

- Phân tích chi tiết mã nguồn LinkedHashMap (JDK 1.8): <https://www.imooc.com/article/22931>
- HashMap và LinkedHashMap: <https://www.cnblogs.com/Spground/p/8536148.html>
- Bắt nguồn từ mã nguồn LinkedHashMap: <https://leetcode.cn/problems/lru-cache/solution/yuan-yu-linkedhashmapyuan-ma-by-jeromememory/>
