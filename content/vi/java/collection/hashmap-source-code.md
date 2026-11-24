---
title: Phân tích mã nguồn HashMap
description: "Phân tích chuyên sâu mã nguồn HashMap: giải thích chi tiết sự khác biệt cấu trúc giữa JDK 1.7 và 1.8, hàm nhiễu hash (perturbation function), hệ số tải loadFactor 0.75, cơ chế resize/rehash, ngưỡng chuyển đổi danh sách liên kết sang cây đỏ-đen (Red-Black Tree) và các nguyên lý cốt lõi của HashMap."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/hashmap-source-code.md
head:
  - - meta
    - name: keywords
      content: Mã nguồn HashMap,Bảng băm,Cây đỏ-đen,Danh sách liên kết,Hàm nhiễu hash,Load Factor,Mở rộng HashMap,Xung đột băm,Tối ưu JDK 1.8
---


> Cảm ơn [changfubai](https://github.com/changfubai) đã đóng góp cải thiện bài viết này!

## Giới thiệu về HashMap

`HashMap` chủ yếu dùng để lưu trữ các cặp khóa-giá trị (key-value), là một triển khai của interface `Map` dựa trên bảng băm (hash table), một trong những Java Collection phổ biến nhất và **không** an toàn luồng (non-thread-safe).

`HashMap` có thể lưu trữ `key` và `value` có giá trị `null`, nhưng chỉ có thể có tối đa một `key` là `null`, còn `value` là `null` thì có thể có nhiều.

Trước JDK 1.8, `HashMap` được cấu thành từ mảng + danh sách liên kết: mảng là phần thân chính của `HashMap`, còn danh sách liên kết tồn tại chủ yếu để giải quyết xung đột băm (Hash Collision) theo phương pháp tách chuỗi ("separate chaining"). Từ JDK 1.8 trở đi, `HashMap` có sự thay đổi lớn trong việc xử lý xung đột băm: khi độ dài danh sách liên kết lớn hơn hoặc bằng ngưỡng (mặc định là 8) — trước khi chuyển sang cây đỏ-đen (Red-Black Tree), nó sẽ kiểm tra xem độ dài mảng hiện tại có nhỏ hơn 64 hay không; nếu nhỏ hơn 64, nó sẽ ưu tiên mở rộng dung lượng mảng (`resize`) thay vì chuyển thành cây đỏ-đen — thì danh sách liên kết sẽ được chuyển thành cây đỏ-đen để giảm thời gian tìm kiếm.

Kích thước khởi tạo mặc định của `HashMap` là 16. Sau đó mỗi lần mở rộng, dung lượng tăng gấp đôi (2 lần) so với ban đầu. Hơn nữa, `HashMap` luôn sử dụng lũy thừa của 2 làm kích thước của bảng băm.

## Phân tích cấu trúc dữ liệu tầng dưới

### Trước JDK 1.8

Trước JDK 1.8, tầng dưới của `HashMap` kết hợp **mảng và danh sách liên kết** — tức là **bảng băm kết hợp danh sách liên kết** (separate chaining).

`HashMap` đưa `hashCode` của `key` đi qua hàm nhiễu (perturbation function) để thu được giá trị `hash`, sau đó thông qua `(n - 1) & hash` xác định vị trí lưu trữ của phần tử hiện tại (`n` ở đây là độ dài của mảng). Nếu tại vị trí đó đã tồn tại phần tử, nó sẽ kiểm tra xem giá trị `hash` và `key` của phần tử hiện có có giống với phần tử chuẩn bị thêm vào hay không; nếu giống thì ghi đè trực tiếp, nếu không giống thì giải quyết xung đột bằng phương pháp tách chuỗi (separate chaining).

Hàm nhiễu được nhắc đến chính là phương thức `hash` của `HashMap`. Sử dụng phương thức `hash` (hàm nhiễu) là nhằm ngăn chặn một số cài đặt `hashCode()` kém chất lượng; nói cách khác, sau khi dùng hàm nhiễu thì có thể giảm bớt va chạm băm.

**Mã nguồn phương thức `hash` của `HashMap` trong JDK 1.8:**

So với JDK 1.7, phương thức `hash` của JDK 1.8 được tinh giản hơn nhiều nhưng nguyên lý vẫn giữ nguyên.

```java
    static final int hash(Object key) {
      int h;
      // key.hashCode(): trả về giá trị băm (hashCode)
      // ^: phép toán XOR theo bit
      // >>>: dịch phải không dấu, bỏ qua bit dấu và điền 0 vào các vị trí trống
      return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
  }
```

So sánh với mã nguồn phương thức `hash` của `HashMap` trong JDK 1.7:

```java
static int hash(int h) {
    // This function ensures that hashCodes that differ only by
    // constant multiples at each bit position have a bounded
    // number of collisions (approximately 8 at default load factor).

    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```

So với phương thức `hash` của JDK 1.8, hiệu năng của phương thức `hash` trong JDK 1.7 sẽ kém hơn một chút vì phải thực hiện tới 4 lần nhiễu bit.

**"Phương pháp tách chuỗi (separate chaining)"** là kết hợp danh sách liên kết và mảng: tạo một mảng các danh sách liên kết, mỗi ô trong mảng chứa một danh sách liên kết. Nếu gặp xung đột băm (Hash Collision), chỉ cần thêm giá trị bị xung đột vào danh sách liên kết đó là được.

![Cấu trúc bên trong của HashMap trước JDK 1.8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.7_hashmap-6222a2fe.png)

### Từ JDK 1.8 trở đi

So với các phiên bản trước, từ JDK 1.8 trở đi cách giải quyết xung đột băm đã có sự thay đổi lớn.

Khi độ dài danh sách liên kết vượt quá ngưỡng (mặc định là 8), phương thức `treeifyBin()` sẽ được gọi trước tiên. Phương thức này dựa vào kích thước mảng của `HashMap` để quyết định có chuyển thành cây đỏ-đen (Red-Black Tree) hay không. Chỉ khi độ dài mảng lớn hơn hoặc bằng 64 thì mới thực hiện chuyển đổi sang cây đỏ-đen nhằm giảm thời gian tìm kiếm. Ngược lại, nó chỉ gọi phương thức `resize()` để mở rộng mảng. Phần mã nguồn chi tiết ở đây không trích dẫn hết, bạn chỉ cần tập trung vào phương thức `treeifyBin()`!

![Cấu trúc bên trong của HashMap từ JDK 1.8 trở đi](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.8_hashmap-9d03cb2d.png)

**Các thuộc tính của lớp:**

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {
    // Số serialVersionUID
    private static final long serialVersionUID = 362498820763181265L;
    // Dung lượng khởi tạo mặc định là 16
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;
    // Dung lượng tối đa
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // Hệ số tải mặc định
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // Khi số lượng node trên một bucket >= giá trị này sẽ chuyển thành cây đỏ-đen
    static final int TREEIFY_THRESHOLD = 8;
    // Khi số lượng node trên một bucket <= giá trị này sẽ chuyển từ cây về danh sách liên kết
    static final int UNTREEIFY_THRESHOLD = 6;
    // Dung lượng tối thiểu của table để chuyển cấu trúc trong bucket thành cây đỏ-đen
    static final int MIN_TREEIFY_CAPACITY = 64;
    // Mảng lưu trữ phần tử, luôn là lũy thừa của 2
    transient Node<k,v>[] table;
    // Tập hợp view chứa toàn bộ các cặp key-value trong Map
    transient Set<map.entry<k,v>> entrySet;
    // Số lượng phần tử đang lưu, lưu ý giá trị này không bằng độ dài mảng
    transient int size;
    // Bộ đếm cho mỗi lần mở rộng dung lượng và thay đổi cấu trúc map
    transient int modCount;
    // Ngưỡng (dung lượng * hệ số tải); khi kích thước thực tế vượt ngưỡng sẽ thực hiện resize
    int threshold;
    // Hệ số tải (load factor)
    final float loadFactor;
}
```

- **Hệ số tải `loadFactor`**

  `loadFactor` (hệ số tải) kiểm soát mức độ dày đặc của dữ liệu lưu trong mảng: `loadFactor` càng tiến gần về 1 thì lượng dữ liệu (`entry`) lưu trong mảng càng nhiều và càng dày, dẫn đến độ dài danh sách liên kết tăng lên; ngược lại, `loadFactor` càng nhỏ (tiến gần về 0) thì dữ liệu (`entry`) lưu trong mảng càng ít và càng thưa thớt.

  **`loadFactor` quá lớn sẽ khiến hiệu quả tìm kiếm phần tử giảm, còn quá nhỏ sẽ làm tỷ lệ sử dụng mảng thấp do dữ liệu phân tán thưa thớt. Giá trị mặc định `0.75f` của `loadFactor` là một ngưỡng cân bằng khá tốt do tác giả JDK đưa ra.**

  Với dung lượng mặc định là 16 và hệ số tải là 0.75, trong quá trình sử dụng `Map` và liên tục thêm dữ liệu vào, khi số lượng vượt quá `16 * 0.75 = 12` thì cần mở rộng dung lượng 16 hiện tại; quá trình mở rộng này phải tạo mảng mới và di chuyển các node, do đó rất tốn kém hiệu năng.

- **`threshold`**

  **threshold = capacity \* loadFactor**. Khi `size > threshold`, cần tính đến việc mở rộng mảng; nói cách khác, ý nghĩa của nó chính là **tiêu chuẩn để đánh giá xem mảng có cần mở rộng hay không**.

**Mã nguồn lớp `Node`:**

```java
// Kế thừa từ Map.Entry<K,V>
static class Node<K,V> implements Map.Entry<K,V> {
       final int hash;// Giá trị hash, dùng để so sánh với giá trị hash của các phần tử khác khi lưu vào HashMap
       final K key;// Khóa
       V value;// Giá trị
       // Trỏ tới node tiếp theo
       Node<K,V> next;
       Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }
        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }
        // Ghi đè phương thức hashCode()
        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }
        // Ghi đè phương thức equals()
        public final boolean equals(Object o) {
            if (o == this)
                return true;
            if (o instanceof Map.Entry) {
                Map.Entry<?,?> e = (Map.Entry<?,?>)o;
                if (Objects.equals(key, e.getKey()) &&
                    Objects.equals(value, e.getValue()))
                    return true;
            }
            return false;
        }
}
```

**Mã nguồn lớp `TreeNode`:**

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        TreeNode<K,V> parent;  // Node cha
        TreeNode<K,V> left;    // Node con trái
        TreeNode<K,V> right;   // Node con phải
        TreeNode<K,V> prev;    // needed to unlink next upon deletion
        boolean red;           // Cờ xác định màu đỏ/đen
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }
        // Trả về node gốc
        final TreeNode<K,V> root() {
            for (TreeNode<K,V> r = this, p;;) {
                if ((p = r.parent) == null)
                    return r;
                r = p;
       }
```

## Phân tích mã nguồn HashMap

### Các hàm khởi tạo (Constructors)

`HashMap` có bốn hàm khởi tạo, cụ thể như sau:

```java
    // Hàm khởi tạo mặc định
    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR; // all   other fields defaulted
     }

     // Hàm khởi tạo nhận vào một Map khác
     public HashMap(Map<? extends K, ? extends V> m) {
         this.loadFactor = DEFAULT_LOAD_FACTOR;
         putMapEntries(m, false);// Sẽ phân tích phương thức này bên dưới
     }

     // Hàm khởi tạo chỉ định dung lượng ban đầu
     public HashMap(int initialCapacity) {
         this(initialCapacity, DEFAULT_LOAD_FACTOR);
     }

     // Hàm khởi tạo chỉ định dung lượng ban đầu và hệ số tải
     public HashMap(int initialCapacity, float loadFactor) {
         if (initialCapacity < 0)
             throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
         if (initialCapacity > MAXIMUM_CAPACITY)
             initialCapacity = MAXIMUM_CAPACITY;
         if (loadFactor <= 0 || Float.isNaN(loadFactor))
             throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
         this.loadFactor = loadFactor;
         // Tạm thời lưu dung lượng khởi tạo vào threshold, sau đó trong resize() mới gán cho newCap để khởi tạo table
         this.threshold = tableSizeFor(initialCapacity);
     }
```

> Cần đặc biệt lưu ý: `initialCapacity` truyền vào không phải là dung lượng mảng cuối cùng. `HashMap` sẽ gọi `tableSizeFor()` để **làm tròn lên thành lũy thừa của 2 nhỏ nhất lớn hơn hoặc bằng giá trị đó**, rồi tạm thời lưu vào trường `threshold`. Mảng `table` thực sự chỉ được khởi tạo với kích thước này trong lần mở rộng dung lượng (`resize()`) đầu tiên.
>
> Ví dụ: `initialCapacity = 9` → `threshold = 16` → độ dài cuối cùng của `table` là `16`.

**Phương thức `putMapEntries`:**

```java
final void putMapEntries(Map<? extends K, ? extends V> m, boolean evict) {
    int s = m.size();
    if (s > 0) {
        // Kiểm tra table đã được khởi tạo hay chưa
        if (table == null) { // pre-size
            /*
             * Chưa khởi tạo: s là số phần tử thực tế của m, ft = s / loadFactor => s = ft * loadFactor,
             * giống công thức ngưỡng = dung lượng * hệ số tải đã nêu; ft là dung lượng tối thiểu cần để thêm s phần tử
             */
            float ft = ((float)s / loadFactor) + 1.0F;
            int t = ((ft < (float)MAXIMUM_CAPACITY) ?
                    (int)ft : MAXIMUM_CAPACITY);
            /*
             * Theo hàm khởi tạo, khi table chưa khởi tạo thì threshold thực chất đang lưu dung lượng ban đầu.
             * Nếu dung lượng tối thiểu cần cho s phần tử lớn hơn dung lượng khởi tạo, nâng lên lũy thừa của 2 gần nhất để làm kích thước khởi tạo.
             * Lưu ý đây không phải là khởi tạo giá trị threshold.
             */
            if (t > threshold)
                threshold = tableSizeFor(t);
        }
        // Đã khởi tạo và số phần tử của m lớn hơn ngưỡng, tiến hành resize
        else if (s > threshold)
            resize();
        // Thêm toàn bộ phần tử trong m vào HashMap; nếu table chưa khởi tạo, putVal sẽ gọi resize để khởi tạo hoặc mở rộng
        for (Map.Entry<? extends K, ? extends V> e : m.entrySet()) {
            K key = e.getKey();
            V value = e.getValue();
            putVal(hash(key), key, value, false, evict);
        }
    }
}
```

### Phương thức `put`

`HashMap` chỉ cung cấp phương thức `put` để thêm phần tử; `putVal` chỉ là phương thức nội bộ được `put` gọi tới chứ không cung cấp cho người dùng gọi trực tiếp.

**Phân tích quá trình thêm phần tử của phương thức `putVal` như sau:**

1. Nếu vị trí mảng được định vị chưa có phần tử thì chèn trực tiếp.
2. Nếu vị trí mảng được định vị đã có phần tử, tiến hành so sánh với `key` cần chèn: nếu `key` giống nhau thì ghi đè trực tiếp; nếu `key` khác nhau, kiểm tra `p` có phải là `TreeNode` hay không — nếu đúng thì gọi `e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value)` để thêm vào cây; nếu không thì duyệt danh sách liên kết để chèn (chèn vào cuối danh sách liên kết).

![ ](/media/jg/ext/oss.javaguide.cn/javaguide/database/sql/put-cf8095b4.png)

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    // Nếu table chưa khởi tạo hoặc độ dài bằng 0, tiến hành resize
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    // (n - 1) & hash xác định bucket; nếu bucket rỗng, tạo node mới đưa vào bucket (lúc này node nằm trực tiếp trong mảng)
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    // Bucket đã có phần tử (xử lý xung đột hash)
    else {
        Node<K,V> e; K k;
        // Kiểm tra nhanh key của node đầu tiên table[i] có trùng với key cần chèn không; nếu trùng, gán p vào e để thay thế giá trị cũ
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
        // Kiểm tra xem node có phải là node cây đỏ-đen không
        else if (p instanceof TreeNode)
            // Chèn vào cây
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        // Không phải TreeNode thì là node danh sách liên kết
        else {
            // Chèn vào cuối danh sách liên kết
            for (int binCount = 0; ; ++binCount) {
                // Đã đến cuối danh sách liên kết
                if ((e = p.next) == null) {
                    // Chèn node mới vào cuối danh sách
                    p.next = newNode(hash, key, value, null);
                    // Số node đạt ngưỡng (mặc định là 8), thực thi phương thức treeifyBin
                    // Phương thức này sẽ dựa vào kích thước mảng HashMap để quyết định có chuyển thành cây đỏ-đen hay không.
                    // Chỉ khi độ dài mảng >= 64 mới thực hiện chuyển sang cây đỏ-đen nhằm giảm thời gian tìm kiếm; ngược lại chỉ mở rộng mảng.
                    if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                        treeifyBin(tab, hash);
                    // Thoát vòng lặp
                    break;
                }
                // Kiểm tra key của node trong danh sách liên kết có bằng key của phần tử cần chèn không
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    // Bằng nhau thì thoát vòng lặp
                    break;
                // Dùng để duyệt danh sách liên kết trong bucket, kết hợp với e = p.next phía trên
                p = e;
            }
        }
        // Tìm thấy node trong bucket có key và hash trùng với phần tử cần chèn
        if (e != null) {
            // Lưu lại giá trị cũ của e
            V oldValue = e.value;
            // onlyIfAbsent là false hoặc giá trị cũ là null
            if (!onlyIfAbsent || oldValue == null)
                // Thay thế giá trị cũ bằng giá trị mới
                e.value = value;
            // Callback sau khi truy cập
            afterNodeAccess(e);
            // Trả về giá trị cũ
            return oldValue;
        }
    }
    // Thay đổi cấu trúc
    ++modCount;
    // Kích thước thực tế vượt quá ngưỡng thì resize
    if (++size > threshold)
        resize();
    // Callback sau khi chèn
    afterNodeInsertion(evict);
    return null;
}
```

**Chúng ta cùng đối chiếu lại với mã nguồn phương thức `put` trong JDK 1.7**

**Phân tích phương thức `put` trong JDK 1.7:**

- ① Nếu vị trí mảng được định vị chưa có phần tử thì chèn trực tiếp.
- ② Nếu vị trí mảng được định vị đã có phần tử, duyệt danh sách liên kết lấy phần tử đó làm node đầu, lần lượt so sánh với `key` cần chèn; nếu `key` giống nhau thì ghi đè trực tiếp, nếu khác thì dùng phương pháp chèn đầu (head insertion) để chèn phần tử.

```java
public V put(K key, V value)
    if (table == EMPTY_TABLE) {
    inflateTable(threshold);
}
    if (key == null)
        return putForNullKey(value);
    int hash = hash(key);
    int i = indexFor(hash, table.length);
    for (Entry<K,V> e = table[i]; e != null; e = e.next) { // Duyệt trước
        Object k;
        if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }

    modCount++;
    addEntry(hash, key, value, i);  // Rồi mới chèn
    return null;
}
```

### Phương thức `get`

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}

final Node<K,V> getNode(int hash, Object key) {
    Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (first = tab[(n - 1) & hash]) != null) {
        // Phần tử đầu trong mảng khớp
        if (first.hash == hash && // always check first node
            ((k = first.key) == key || (key != null && key.equals(k))))
            return first;
        // Trong bucket có nhiều hơn một node
        if ((e = first.next) != null) {
            // Tìm kiếm trong cây đỏ-đen
            if (first instanceof TreeNode)
                return ((TreeNode<K,V>)first).getTreeNode(hash, key);
            // Tìm kiếm trong danh sách liên kết
            do {
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    return e;
            } while ((e = e.next) != null);
        }
    }
    return null;
}
```

### Phương thức `resize`

Khi mở rộng dung lượng, `HashMap` sẽ duyệt các phần tử trong bảng băm và tận dụng giá trị `hash` sẵn có của node cùng dung lượng cũ để xác định vị trí của node trong mảng mới — thao tác này rất tốn thời gian. Khi lập trình, cần hạn chế tối đa việc xảy ra `resize`. Thực tế phương thức `resize` đã gộp việc khởi tạo `table` và mở rộng `table` làm một, hành vi ở tầng dưới đều là gán một mảng mới cho `table`.

```java
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;
    if (oldCap > 0) {
        // Vượt quá giá trị tối đa thì không mở rộng nữa, chấp nhận va chạm
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        // Chưa vượt giá trị tối đa thì mở rộng gấp 2 lần
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY && oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1; // double threshold
    }
    else if (oldThr > 0) // initial capacity was placed in threshold
        // Dung lượng khởi tạo khi tạo đối tượng được lưu tạm trong threshold, lúc này chỉ cần dùng nó làm dung lượng mảng mới
        newCap = oldThr;
    else {
        // signifies using defaults; đối tượng tạo bằng hàm khởi tạo không tham số sẽ tính dung lượng và ngưỡng tại đây
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }
    if (newThr == 0) {
        // Khi khởi tạo có chỉ định dung lượng ban đầu hoặc hệ số tải, ngưỡng được khởi tạo tại đây,
    	// hoặc khi dung lượng cũ trước khi resize nhỏ hơn 16 thì tính ngưỡng resize mới tại đây
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ? (int)ft : Integer.MAX_VALUE);
    }
    threshold = newThr;
    @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;
    if (oldTab != null) {
        // Di chuyển từng bucket sang mảng buckets mới
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                if (e.next == null)
                    // Chỉ có một node, tính trực tiếp vị trí mới của phần tử
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)
                    // Tách cây đỏ-đen thành 2 cây con; nếu số node của cây con <= UNTREEIFY_THRESHOLD (mặc định là 6), chuyển cây con về danh sách liên kết.
                    // Nếu số node của cây con > UNTREEIFY_THRESHOLD, giữ nguyên cấu trúc cây.
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else {
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        // Chỉ số gốc (giữ nguyên vị trí)
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null)
                                loHead = e;
                            else
                                loTail.next = e;
                            loTail = e;
                        }
                        // Chỉ số gốc + oldCap
                        else {
                            if (hiTail == null)
                                hiHead = e;
                            else
                                hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    // Đặt vào bucket tại chỉ số gốc
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    // Đặt vào bucket tại chỉ số gốc + oldCap
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

## Thử nghiệm các phương thức phổ biến của HashMap

```java
package map;

import java.util.Collection;
import java.util.HashMap;
import java.util.Set;

public class HashMapDemo {

    public static void main(String[] args) {
        HashMap<String, String> map = new HashMap<String, String>();
        // Key không được trùng lặp, value có thể trùng lặp
        map.put("san", "张三");
        map.put("si", "李四");
        map.put("wu", "王五");
        map.put("wang", "老王");
        map.put("wang", "老王2");// 老王 bị ghi đè
        map.put("lao", "老王");
        System.out.println("-------直接输出hashmap:-------");
        System.out.println(map);
        /**
         * Duyệt HashMap
         */
        // 1. Lấy tất cả các key trong Map
        System.out.println("-------foreach获取Map中所有的键:------");
        Set<String> keys = map.keySet();
        for (String key : keys) {
            System.out.print(key+"  ");
        }
        System.out.println();// Xuống dòng
        // 2. Lấy tất cả các value trong Map
        System.out.println("-------foreach获取Map中所有的值:------");
        Collection<String> values = map.values();
        for (String value : values) {
            System.out.print(value+"  ");
        }
        System.out.println();// Xuống dòng
        // 3. Lấy đồng thời giá trị key và value tương ứng với key đó
        System.out.println("-------得到key的值的同时得到key所对应的值:-------");
        Set<String> keys2 = map.keySet();
        for (String key : keys2) {
            System.out.print(key + "：" + map.get(key)+"   ");

        }
        /**
         * Nếu cần duyệt cả key lẫn value thì khuyến khích dùng cách này, vì nếu lấy keySet trước rồi mới gọi map.get(key),
         * bên trong map sẽ phải duyệt hai lần: một lần khi lấy keySet và một lần khi duyệt toàn bộ key.
         */
        // Khi gọi phương thức put(key, value), trước tiên key và value sẽ được đóng gói vào
        // đối tượng lớp nội bộ tĩnh Entry, sau đó đối tượng Entry được đưa vào mảng. Vì vậy,
        // khi muốn lấy toàn bộ cặp key-value trong map, ta chỉ cần lấy tất cả các đối tượng Entry trong mảng,
        // rồi gọi phương thức getKey() và getValue() trên đối tượng Entry là lấy được cặp key-value.
        Set<java.util.Map.Entry<String, String>> entrys = map.entrySet();
        for (java.util.Map.Entry<String, String> entry : entrys) {
            System.out.println(entry.getKey() + "--" + entry.getValue());
        }

        /**
         * Các phương thức phổ biến khác của HashMap
         */
        System.out.println("after map.size()："+map.size());
        System.out.println("after map.isEmpty()："+map.isEmpty());
        System.out.println(map.remove("san"));
        System.out.println("after map.remove()："+map);
        System.out.println("after map.get(si)："+map.get("si"));
        System.out.println("after map.containsKey(si)："+map.containsKey("si"));
        System.out.println("after containsValue(李四)："+map.containsValue("李四"));
        System.out.println(map.replace("si", "李四2"));
        System.out.println("after map.replace(si, 李四2):"+map);
    }

}
```
