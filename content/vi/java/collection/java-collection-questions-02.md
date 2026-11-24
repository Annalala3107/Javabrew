---
title: Tổng hợp câu hỏi phỏng vấn thường gặp về Java Collections (Phần 2)
description: "Các câu hỏi phỏng vấn Java Collections tần suất cao: phân tích chuyên sâu nguyên lý nền tảng của HashMap, chuyển đổi cây đỏ-đen (Red-Black Tree), giải quyết xung đột băm (Hash Collision), cơ chế an toàn luồng của ConcurrentHashMap, sự khác biệt với Hashtable và các kiến thức cốt lõi khác."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/java-collection-questions-02.md
head:
  - - meta
    - name: keywords
      content: HashMap,ConcurrentHashMap,Hashtable,cây đỏ-đen,Red-Black Tree,xung đột băm,an toàn luồng,câu hỏi phỏng vấn collections
---


## Map (Quan trọng)

### ⭐️ Sự khác nhau giữa HashMap và Hashtable

- **An toàn luồng hay không:** `HashMap` không an toàn luồng (thread-safe), còn `Hashtable` an toàn luồng, vì các phương thức bên trong `Hashtable` về cơ bản đều được gắn từ khóa `synchronized`. (Nếu bạn muốn đảm bảo an toàn luồng thì hãy dùng `ConcurrentHashMap` nhé!)
- **Hiệu năng:** Do vấn đề đồng bộ hóa an toàn luồng, `HashMap` có hiệu năng cao hơn `Hashtable` một chút. Ngoài ra, `Hashtable` về cơ bản đã lỗi thời, đừng sử dụng nó trong mã nguồn nữa.
- **Hỗ trợ Null key và Null value:** `HashMap` có thể lưu trữ key `null` và value `null`, nhưng chỉ có thể có một key `null`, còn value `null` có thể có nhiều; `Hashtable` không cho phép key `null` và value `null`, nếu không sẽ ném ra `NullPointerException`.
- **Dung lượng khởi tạo ban đầu và kích thước mỗi lần mở rộng dung lượng:** ① Khi khởi tạo nếu không chỉ định giá trị dung lượng ban đầu, kích thước mặc định của `Hashtable` là 11, sau đó mỗi lần mở rộng dung lượng sẽ tăng thành `2n+1`. Kích thước khởi tạo mặc định của `HashMap` là 16, sau đó mỗi lần mở rộng dung lượng (`resize`) sẽ tăng gấp đôi (`2x`). ② Khi khởi tạo nếu truyền vào giá trị dung lượng ban đầu, `Hashtable` sẽ dùng trực tiếp kích thước bạn truyền vào, còn `HashMap` sẽ mở rộng nó thành lũy thừa của 2 (được đảm bảo bởi phương thức `tableSizeFor()` trong `HashMap`, mã nguồn được cung cấp bên dưới). Tức là `HashMap` luôn sử dụng lũy thừa của 2 làm kích thước của bảng băm — phần sau sẽ giải thích lý do tại sao phải là lũy thừa của 2.
- **Cấu trúc dữ liệu nền tảng:** `HashMap` từ JDK 1.8 trở đi có thay đổi lớn khi giải quyết xung đột băm (Hash Collision): khi độ dài danh sách liên kết lớn hơn ngưỡng (mặc định là 8), nó sẽ chuyển danh sách liên kết thành cây đỏ-đen (Red-Black Tree) (trước khi chuyển danh sách liên kết sang cây đỏ-đen sẽ kiểm tra xem độ dài mảng hiện tại có nhỏ hơn 64 hay không; nếu nhỏ hơn 64 thì ưu tiên mở rộng dung lượng mảng trước thay vì chuyển sang cây đỏ-đen) nhằm giảm thời gian tìm kiếm (ở phần sau tôi sẽ phân tích quá trình này kèm mã nguồn). `Hashtable` không có cơ chế như vậy.
- **Cách hiện thực hàm băm:** `HashMap` thực hiện trộn nhiễu bit cao và bit thấp trên giá trị băm để giảm xung đột, còn `Hashtable` sử dụng trực tiếp giá trị `hashCode()` của key.

**Hàm khởi tạo có dung lượng ban đầu trong `HashMap`:**

```java
    public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
    }
     public HashMap(int initialCapacity) {
        this(initialCapacity, DEFAULT_LOAD_FACTOR);
    }
```

Phương thức dưới đây đảm bảo `HashMap` luôn sử dụng lũy thừa của 2 làm kích thước của bảng băm.

```java
/**
 * Returns a power of two size for the given target capacity.
 */
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

### Sự khác nhau giữa HashMap và HashSet

Nếu bạn từng xem mã nguồn `HashSet`, bạn sẽ biết rằng: `HashSet` ở tầng dưới được hiện thực dựa trên `HashMap`. (Mã nguồn của `HashSet` rất rất ít, vì ngoài `clone()`, `writeObject()`, `readObject()` mà `HashSet` bắt buộc phải tự hiện thực ra, tất cả các phương thức khác đều gọi trực tiếp phương thức trong `HashMap`.)

|                     `HashMap`                     |                                                            `HashSet`                                                             |
| :-----------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: |
|            Hiện thực interface `Map`              |                                                 Hiện thực interface `Set`                                                        |
|               Lưu trữ cặp key-value               |                                                      Chỉ lưu trữ đối tượng                                                       |
|      Gọi `put()` để thêm phần tử vào map          |                                         Gọi phương thức `add()` để thêm phần tử vào `Set`                                        |
| `HashMap` dùng khóa (Key) để tính `hashcode`      | `HashSet` dùng đối tượng thành viên để tính `hashcode`; với hai đối tượng, `hashcode` có thể giống nhau nên `equals()` được dùng để xác định tính bằng nhau của đối tượng |

### ⭐️ Sự khác nhau giữa HashMap và TreeMap

Cả `TreeMap` và `HashMap` đều kế thừa từ `AbstractMap`, nhưng điều cần lưu ý là `TreeMap` còn hiện thực thêm interface `NavigableMap` và interface `SortedMap`.

![Sơ đồ quan hệ kế thừa của TreeMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/treemap_hierarchy-5b937ea2.png)

Việc hiện thực interface `NavigableMap` giúp `TreeMap` có khả năng tìm kiếm các phần tử bên trong collection.

Interface `NavigableMap` cung cấp các phương thức phong phú để duyệt tìm và thao tác trên các cặp khóa-giá trị:

1. **Tìm kiếm có định hướng:** Các phương thức như `ceilingEntry()`, `floorEntry()`, `higherEntry()` và `lowerEntry()` có thể dùng để định vị cặp khóa-giá trị gần nhất có khóa lớn hơn hoặc bằng, nhỏ hơn hoặc bằng, lớn hơn hẳn, hoặc nhỏ hơn hẳn khóa đã cho.
2. **Thao tác tập con:** Các phương thức `subMap()`, `headMap()` và `tailMap()` có thể tạo nhanh các góc nhìn tập con (subview) của collection gốc mà không cần sao chép toàn bộ collection.
3. **Góc nhìn đảo ngược:** Phương thức `descendingMap()` trả về một góc nhìn `NavigableMap` theo thứ tự ngược lại, giúp có thể duyệt ngược toàn bộ `TreeMap`.
4. **Thao tác biên:** Các phương thức `firstEntry()`, `lastEntry()`, `pollFirstEntry()` và `pollLastEntry()` giúp truy cập và xóa bỏ các phần tử ở hai đầu một cách thuận tiện.

Tất cả các phương thức này đều được hiện thực dựa trên đặc tính của cấu trúc dữ liệu cây đỏ-đen (Red-Black Tree). Cây đỏ-đen luôn duy trì trạng thái cân bằng, nhờ đó đảm bảo độ phức tạp thời gian của thao tác tìm kiếm là O(log n), biến `TreeMap` thành một công cụ mạnh mẽ để xử lý các bài toán tìm kiếm trên tập hợp có thứ tự.

Việc hiện thực interface `SortedMap` giúp `TreeMap` có khả năng sắp xếp các phần tử trong collection theo key. Mặc định sẽ sắp xếp theo thứ tự tăng dần của key, tuy nhiên chúng ta cũng có thể chỉ định bộ so sánh (`Comparator`) cho việc sắp xếp. Mã ví dụ như sau:

```java
/**
 * @author shuang.kou
 * @createTime 2020-06-15 17:02:00
 */
public class Person {
    private Integer age;

    public Person(Integer age) {
        this.age = age;
    }

    public Integer getAge() {
        return age;
    }


    public static void main(String[] args) {
        TreeMap<Person, String> treeMap = new TreeMap<>(new Comparator<Person>() {
            @Override
            public int compare(Person person1, Person person2) {
                int num = person1.getAge() - person2.getAge();
                return Integer.compare(num, 0);
            }
        });
        treeMap.put(new Person(3), "person1");
        treeMap.put(new Person(18), "person2");
        treeMap.put(new Person(35), "person3");
        treeMap.put(new Person(16), "person4");
        treeMap.entrySet().stream().forEach(personStringEntry -> {
            System.out.println(personStringEntry.getValue());
        });
    }
}
```

Kết quả đầu ra:

```plain
person1
person4
person2
person3
```

Có thể thấy, các phần tử trong `TreeMap` đã được sắp xếp theo thứ tự tăng dần của trường `age` trong `Person`.

Ở trên, chúng ta hiện thực bằng cách truyền vào một lớp ẩn danh (anonymous inner class); bạn có thể thay thế đoạn code này bằng biểu thức Lambda:

```java
TreeMap<Person, String> treeMap = new TreeMap<>((person1, person2) -> {
  int num = person1.getAge() - person2.getAge();
  return Integer.compare(num, 0);
});
```

**Tổng kết lại, so với `HashMap`, `TreeMap` chủ yếu có thêm khả năng sắp xếp các phần tử trong collection theo key cũng như khả năng tìm kiếm các phần tử bên trong collection.**

### HashSet kiểm tra trùng lặp như thế nào?

Nội dung dưới đây được trích từ cuốn sách nhập môn Java của tôi — *Head First Java* (ấn bản lần 2):

> Khi bạn thêm một đối tượng vào `HashSet`, `HashSet` sẽ tính giá trị `hashcode` của đối tượng trước để xác định vị trí thêm đối tượng vào, đồng thời so sánh với giá trị `hashcode` của các đối tượng khác đã được thêm vào trước đó. Nếu không có `hashcode` nào trùng khớp, `HashSet` sẽ mặc định rằng đối tượng chưa xuất hiện trùng lặp. Nhưng nếu phát hiện có đối tượng cùng giá trị `hashcode`, lúc này nó sẽ gọi phương thức `equals()` để kiểm tra xem các đối tượng có `hashcode` bằng nhau đó có thực sự giống nhau hay không. Nếu cả hai giống nhau, `HashSet` sẽ không cho thao tác thêm thành công.

Trong JDK 1.8, phương thức `add()` của `HashSet` chỉ đơn giản gọi phương thức `put()` của `HashMap` và kiểm tra giá trị trả về để đảm bảo không có phần tử trùng lặp. Hãy xem trực tiếp mã nguồn trong `HashSet`:

```java
// Returns: true if this set did not already contain the specified element
// Giá trị trả về: trả về true khi set chưa chứa phần tử được add
public boolean add(E e) {
        return map.put(e, PRESENT)==null;
}
```

Còn trong phương thức `putVal()` của `HashMap` cũng có thể thấy chú thích như sau:

```java
// Returns : previous value, or null if none
// Giá trị trả về: nếu vị trí chèn chưa có phần tử thì trả về null, ngược lại trả về giá trị trước đó
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
...
}
```

Nói cách khác, trong JDK 1.8, nếu trong `HashSet` đã tồn tại phần tử giống nhau, `HashMap` nền tảng sẽ giữ nguyên khóa cũ và `HashSet#add()` trả về `false`; chỉ khi chưa tồn tại thì mới thêm mới phần tử và trả về `true`.

### ⭐️ Hiện thực nền tảng của HashMap

#### Trước JDK 1.8

Trước JDK 1.8, `HashMap` ở tầng dưới kết hợp **mảng và danh sách liên kết** để sử dụng, tức là **bảng băm nối chuỗi (separate chaining)**. `HashMap` lấy `hashcode` của key đi qua hàm nhiễu (perturbation function) xử lý để thu được giá trị `hash`, sau đó dùng `(n - 1) & hash` để xác định vị trí lưu trữ của phần tử hiện tại (`n` ở đây là độ dài của mảng). Nếu tại vị trí hiện tại đã tồn tại phần tử, nó sẽ kiểm tra xem giá trị `hash` và `key` của phần tử đó có giống với phần tử cần lưu hay không: nếu giống nhau thì ghi đè trực tiếp, nếu không giống thì giải quyết xung đột bằng phương pháp nối chuỗi (separate chaining).

Hàm nhiễu (phương thức `hash`) trong `HashMap` được dùng để tối ưu sự phân bố của giá trị băm. Bằng cách xử lý bổ sung trên `hashCode()` gốc, hàm nhiễu có thể giảm bớt va chạm do hiện thực `hashCode()` kém gây ra, từ đó nâng cao độ đồng đều khi phân bố dữ liệu.

**Mã nguồn phương thức `hash` của HashMap trong JDK 1.8:**

Phương thức `hash` của JDK 1.8 so với phương thức `hash` của JDK 1.7 được đơn giản hóa hơn, nhưng nguyên lý không đổi.

```java
    static final int hash(Object key) {
      int h;
      // key.hashCode(): trả về giá trị băm tức là hashcode
      // ^: phép XOR theo từng bit
      // >>>: dịch phải không dấu, bỏ qua bit dấu, các vị trí trống đều điền bằng 0
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

So với phương thức `hash` của JDK 1.8, hiệu năng phương thức `hash` của JDK 1.7 kém hơn một chút vì phải thực hiện tới 4 lần trộn nhiễu bit.

Cái gọi là **"phương pháp nối chuỗi (separate chaining)"** chính là: kết hợp danh sách liên kết và mảng. Tức là tạo ra một mảng các danh sách liên kết, mỗi ô trong mảng là một danh sách liên kết. Nếu gặp xung đột băm (Hash Collision), chỉ việc thêm giá trị bị xung đột vào danh sách liên kết đó là được.

![Cấu trúc bên trong của HashMap trước JDK 1.8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.7_hashmap-6222a2fe.png)

#### Từ JDK 1.8 trở đi

So với các phiên bản trước, từ JDK 1.8 trở đi có thay đổi lớn khi giải quyết xung đột băm: khi độ dài danh sách liên kết lớn hơn ngưỡng (mặc định là 8) (trước khi chuyển danh sách liên kết sang cây đỏ-đen sẽ kiểm tra xem độ dài mảng hiện tại có nhỏ hơn 64 hay không; nếu nhỏ hơn 64 thì chọn mở rộng dung lượng mảng trước thay vì chuyển sang cây đỏ-đen), danh sách liên kết sẽ được chuyển thành cây đỏ-đen (Red-Black Tree).

Mục đích của việc này là giảm thời gian tìm kiếm: hiệu suất tìm kiếm của danh sách liên kết là O(n) (n là độ dài danh sách liên kết), còn cây đỏ-đen là một cây nhị phân tìm kiếm tự cân bằng có hiệu suất tìm kiếm là O(log n). Khi danh sách liên kết còn ngắn, chênh lệch hiệu năng giữa O(n) và O(log n) không rõ rệt. Nhưng khi danh sách liên kết trở nên dài, hiệu năng tìm kiếm sẽ suy giảm đáng kể.

![Cấu trúc bên trong của HashMap từ JDK 1.8 trở đi](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.8_hashmap-9d03cb2d.png)

**Tại sao ưu tiên mở rộng dung lượng thay vì chuyển thẳng sang cây đỏ-đen?**

Mở rộng dung lượng mảng giúp giảm xác suất xảy ra xung đột băm (tức phân tán lại các phần tử sang một mảng mới lớn hơn); trong đa số trường hợp cách này hiệu quả hơn việc chuyển thẳng thành cây đỏ-đen.

Cây đỏ-đen cần duy trì tính tự cân bằng nên chi phí bảo trì khá cao. Hơn nữa, việc đưa cây đỏ-đen vào quá sớm ngược lại sẽ làm tăng độ phức tạp.

**Tại sao chọn ngưỡng 8 và 64?**

1. Phân phối Poisson cho thấy xác suất để một danh sách liên kết đạt độ dài 8 là cực kỳ thấp (nhỏ hơn một phần mười triệu). Trong tuyệt đại đa số trường hợp, độ dài danh sách liên kết sẽ không vượt quá 8. Đặt ngưỡng bằng 8 có thể đảm bảo sự cân bằng giữa hiệu năng và hiệu quả không gian bộ nhớ.
2. Ngưỡng độ dài mảng 64 cũng là giá trị kinh nghiệm đã được kiểm chứng qua thực tế. Với mảng nhỏ, chi phí mở rộng dung lượng thấp, nên ưu tiên mở rộng để tránh đưa cây đỏ-đen vào quá sớm. Khi kích thước mảng đạt tới 64, xác suất xung đột cao hơn, lúc này ưu thế hiệu năng của cây đỏ-đen mới bắt đầu phát huy.

> `TreeMap`, `TreeSet` cũng như `HashMap` từ JDK 1.8 trở đi đều sử dụng cây đỏ-đen (Red-Black Tree) ở tầng dưới. Cây đỏ-đen ra đời nhằm khắc phục nhược điểm của cây nhị phân tìm kiếm, vì cây nhị phân tìm kiếm trong một số trường hợp có thể suy biến thành cấu trúc tuyến tính.

Hãy kết hợp mã nguồn để phân tích quá trình chuyển đổi từ danh sách liên kết sang cây đỏ-đen của `HashMap`.

**1. Logic kiểm tra thực hiện chuyển danh sách liên kết sang cây đỏ-đen trong phương thức `putVal`.**

Khi độ dài danh sách liên kết lớn hơn 8 thì thực thi logic `treeifyBin` (chuyển sang cây đỏ-đen).

```java
// Duyệt danh sách liên kết
for (int binCount = 0; ; ++binCount) {
    // Duyệt tới nút cuối cùng của danh sách liên kết
    if ((e = p.next) == null) {
        p.next = newNode(hash, key, value, null);
        // Nếu số phần tử trong danh sách liên kết đạt ngưỡng TREEIFY_THRESHOLD (8)
        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
            // Chuyển đổi sang cây đỏ-đen (chưa chắc đã chuyển thẳng ngay thành cây đỏ-đen)
            treeifyBin(tab, hash);
        break;
    }
    if (e.hash == hash &&
        ((k = e.key) == key || (key != null && key.equals(k))))
        break;
    p = e;
}
```

**2. Kiểm tra xem có thực sự chuyển sang cây đỏ-đen không trong phương thức `treeifyBin`.**

```java
final void treeifyBin(Node<K,V>[] tab, int hash) {
    int n, index; Node<K,V> e;
    // Kiểm tra xem độ dài mảng hiện tại có nhỏ hơn 64 hay không
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
        // Nếu độ dài mảng hiện tại nhỏ hơn 64 thì ưu tiên mở rộng dung lượng mảng trước
        resize();
    else if ((e = tab[index = (n - 1) & hash]) != null) {
        // Ngược lại mới chuyển danh sách liên kết thành cây đỏ-đen

        TreeNode<K,V> hd = null, tl = null;
        do {
            TreeNode<K,V> p = replacementTreeNode(e, null);
            if (tl == null)
                hd = p;
            else {
                p.prev = tl;
                tl.next = p;
            }
            tl = p;
        } while ((e = e.next) != null);
        if ((tab[index] = hd) != null)
            hd.treeify(tab);
    }
}
```

Trước khi chuyển danh sách liên kết sang cây đỏ-đen sẽ kiểm tra xem độ dài mảng hiện tại có nhỏ hơn 64 hay không; nếu nhỏ hơn 64 thì sẽ chọn mở rộng dung lượng mảng trước thay vì chuyển sang cây đỏ-đen.

### ⭐️ Tại sao độ dài của HashMap phải là lũy thừa của 2?

Để `HashMap` truy xuất hiệu quả và giảm va chạm, chúng ta cần đảm bảo dữ liệu được phân bố đều nhất có thể. Giá trị băm trong Java thường được biểu diễn bằng kiểu `int`, phạm vi là `-2147483648 ~ 2147483647` — cộng lại khoảng 4 tỷ giá trị trong không gian ánh xạ; chỉ cần hàm băm ánh xạ tương đối đồng đều và phân tán thì trong ứng dụng thông thường rất khó xảy ra va chạm. Tuy nhiên, vấn đề là một mảng có độ dài 4 tỷ phần tử thì bộ nhớ không thể chứa nổi. Vì vậy giá trị băm này không thể đem ra dùng trực tiếp ngay. Trước khi dùng còn phải thực hiện phép chia lấy dư theo độ dài mảng, phần dư thu được mới dùng để xác định vị trí lưu trữ tức là chỉ số mảng tương ứng.

**Thuật toán này nên thiết kế như thế nào?**

Trước tiên ta có thể nghĩ đến việc dùng phép toán chia lấy dư `%` để hiện thực. Đối với giá trị `hash` không âm, khi `length` là lũy thừa của 2 thì `hash % length` tương đương với `hash & (length - 1)`. `HashMap` sử dụng phép toán thứ hai để tính chỉ số mảng.

Ngoài việc phép toán bit hiệu quả hơn phép chia lấy dư như đã nói ở trên, tôi cho rằng một lý do quan trọng hơn nữa là: **độ dài là lũy thừa của 2 giúp `HashMap` phân bố phần tử đều hơn khi mở rộng dung lượng (`resize`)**. Ví dụ:

- Khi `length = 8`, biểu diễn nhị phân của `length - 1 = 7` là `0111`
- Khi `length = 16`, biểu diễn nhị phân của `length - 1 = 15` là `1111`

Lúc này các phần tử vốn đã nằm trong `HashMap` khi tính vị trí mảng mới bằng `hash&(length-1)`, tùy thuộc vào bit nhị phân thứ tư của `hash` (đếm từ phải sang), sẽ xảy ra hai trường hợp:

1. Bit nhị phân thứ tư bằng 0: vị trí mảng giữ nguyên, tức là vị trí của phần tử hiện tại trong mảng mới và mảng cũ giống nhau.
2. Bit nhị phân thứ tư bằng 1: vị trí mảng nằm ở phần nửa mới được mở rộng thêm của mảng mới.

Dưới đây là một ví dụ minh họa:

```plain
Giả sử có một phần tử mang giá trị băm là 10101100

Tính vị trí phần tử ở mảng cũ:
hash        = 10101100
length - 1  = 00000111
& -----------------
index       = 00000100  (4)

Tính vị trí phần tử ở mảng mới:
hash        = 10101100
length - 1  = 00001111
& -----------------
index       = 00001100  (12)

Xem bit thứ 4 (đếm từ phải sang):
1. Bit cao là 0: vị trí không đổi.
2. Bit cao là 1: di chuyển tới vị trí mới (vị trí chỉ số cũ + dung lượng cũ).
```

⚠️ Lưu ý: Kịch bản ví dụ ở đây xét bit nhị phân thứ 4, nói chính xác hơn là xét bit cao mới lộ ra (đếm từ phải sang); chẳng hạn khi `length = 32`, `length - 1 = 31`, dạng nhị phân là `11111`, lúc này ta sẽ xét bit nhị phân thứ 5.

Nói cách khác, sau khi mở rộng dung lượng, trong trường hợp giá trị `hash` của các phần tử ở mảng cũ tương đối đồng đều (còn giá trị `hash` có đều hay không phụ thuộc vào phương thức `hashcode()` của đối tượng và hàm nhiễu đã nêu trước đó), các phần tử ở mảng mới cũng sẽ được phân bố tương đối đồng đều — trường hợp lý tưởng nhất là một nửa nằm ở nửa đầu mảng mới và một nửa nằm ở nửa sau mảng mới.

Điều này cũng giúp cơ chế mở rộng dung lượng (`resize`) trở nên đơn giản và hiệu quả: sau khi mở rộng chỉ cần kiểm tra sự thay đổi của bit cao trong giá trị băm để quyết định vị trí mới của phần tử — hoặc giữ nguyên vị trí (bit cao bằng 0), hoặc chuyển sang vị trí mới (bit cao bằng 1, chỉ số cũ + dung lượng cũ).

Cuối cùng, tóm tắt ngắn gọn các lý do khiến độ dài của `HashMap` là lũy thừa của 2:

1. Phép toán bit hiệu quả hơn: Phép toán bit (`&`) có hiệu năng cao hơn phép chia lấy dư (`%`). Với `hash` không âm, khi độ dài là lũy thừa của 2, `hash % length` tương đương với `hash & (length - 1)`.
2. Đảm bảo phân bố đều hơn cho giá trị băm: Sau khi mở rộng dung lượng, nếu giá trị `hash` của các phần tử trong mảng cũ phân bố khá đều thì ở mảng mới chúng cũng sẽ được phân bố đều, trường hợp tốt nhất là một nửa ở nửa đầu và một nửa ở nửa sau mảng mới.
3. Cơ chế mở rộng dung lượng đơn giản và hiệu quả: Sau khi mở rộng chỉ cần kiểm tra sự thay đổi ở bit cao của giá trị băm để xác định vị trí mới của phần tử — hoặc giữ nguyên (bit cao bằng 0), hoặc dịch sang vị trí mới (bit cao bằng 1, chỉ số cũ + dung lượng cũ).

### ⭐️ Vấn đề vòng lặp vô hạn khi thao tác HashMap đa luồng

Ở các phiên bản `HashMap` từ JDK 1.7 trở về trước, thao tác mở rộng dung lượng (`resize`) trong môi trường đa luồng có thể tồn tại vấn đề vòng lặp vô hạn (infinite loop). Nguyên nhân là khi một bucket có nhiều phần tử cần được di chuyển khi mở rộng dung lượng, nhiều thread cùng thao tác trên danh sách liên kết bằng phương pháp chèn đầu (head insertion) có thể khiến các nút trong danh sách liên kết trỏ sai vị trí, từ đó tạo thành một danh sách liên kết vòng khép kín và làm cho thao tác tra cứu phần tử rơi vào vòng lặp vô hạn không thể kết thúc.

Để giải quyết vấn đề này, `HashMap` từ phiên bản JDK 1.8 đã áp dụng chèn đuôi (tail insertion) thay cho chèn đầu nhằm tránh đảo ngược danh sách liên kết, đảm bảo nút được chèn luôn nằm ở cuối danh sách liên kết và tránh cấu trúc vòng. Tuy nhiên vẫn không khuyến khích sử dụng `HashMap` trong môi trường đa luồng, vì dưới đa luồng dùng `HashMap` vẫn xảy ra vấn đề ghi đè dữ liệu. Trong môi trường đồng thời, khuyến nghị sử dụng `ConcurrentHashMap`.

Thông thường trong phỏng vấn trình bày đến mức này là đủ, không cần nhớ từng chi tiết nhỏ nhặt, cá nhân tôi cũng thấy không cần thiết phải học thuộc. Nếu muốn tìm hiểu chi tiết vấn đề vòng lặp vô hạn khi mở rộng dung lượng `HashMap`, bạn có thể đọc bài viết của chú Hào Tử (CoolShell): [Vòng lặp vô hạn của Java HashMap](https://coolshell.cn/articles/9606.html).

### ⭐️ Tại sao HashMap không an toàn luồng (thread-safe)?

`HashMap` không an toàn luồng. Khi thực hiện các thao tác ghi đồng thời trên `HashMap` trong môi trường đa luồng, có thể dẫn đến hai vấn đề chính:

1. **Mất dữ liệu:** Các thao tác `put` đồng thời có thể khiến dữ liệu ghi của một thread bị thread khác ghi đè lên.
2. **Vòng lặp vô hạn:** Ở JDK 7 trở về trước, khi mở rộng dung lượng đồng thời, do chèn đầu nên danh sách liên kết có thể tạo thành vòng lặp khép kín, từ đó gây ra vòng lặp vô hạn khi gọi `get` và đẩy CPU tăng vọt lên 100%.

Vấn đề mất dữ liệu tồn tại ở cả JDK 1.7 lẫn JDK 1.8; ở đây lấy JDK 1.8 làm ví dụ minh họa.

Từ JDK 1.8 trở đi, trong `HashMap`, nhiều cặp key-value có thể được phân bổ vào cùng một bucket và lưu trữ dưới dạng danh sách liên kết hoặc cây đỏ-đen. Việc nhiều thread cùng thực hiện thao tác `put` trên `HashMap` sẽ gây mất an toàn luồng, cụ thể là nguy cơ ghi đè dữ liệu.

Ví dụ minh họa:

- Hai thread 1 và 2 đồng thời thực hiện thao tác `put`, và xảy ra xung đột băm (chỉ số chèn được hàm băm tính ra là giống nhau).
- Các thread khác nhau có thể được cấp phát CPU (time slice) ở những thời điểm khác nhau. Giả sử thread 1 vừa thực hiện xong bước kiểm tra xung đột băm thì hết time slice nên bị tạm dừng. Thread 2 hoàn tất thao tác chèn trước.
- Sau đó, thread 1 nhận lại được time slice; vì trước đó đã kiểm tra xung đột băm xong rồi nên lúc này nó chèn thẳng luôn, dẫn đến dữ liệu mà thread 2 vừa chèn bị thread 1 ghi đè mất.

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    // ...
    // Kiểm tra xem có xảy ra xung đột băm hay không
    // (n - 1) & hash xác định phần tử lưu vào bucket nào; nếu bucket rỗng thì tạo nút mới đưa vào bucket (lúc này nút nằm trực tiếp trong mảng)
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    // Trong bucket đã tồn tại phần tử (xử lý xung đột băm)
    else {
    // ...
}
```

Một trường hợp khác là hai thread này cùng thực hiện thao tác `put` làm cho giá trị `size` bị sai:

1. Khi thread 1 thực hiện kiểm tra `if(++size > threshold)`, giả sử đọc được giá trị `size` là 10, do hết time slice nên bị tạm dừng.
2. Thread 2 cũng thực hiện kiểm tra `if(++size > threshold)`, cũng đọc được giá trị `size` là 10, chèn phần tử vào bucket và cập nhật giá trị `size` thành 11.
3. Sau đó, thread 1 nhận lại time slice, cũng đưa phần tử vào bucket và cập nhật giá trị `size` thành 11.
4. Cả thread 1 và 2 đều đã thực hiện một lần thao tác `put`, nhưng giá trị `size` chỉ tăng thêm 1. Lúc này bộ đếm đã bị mất cập nhật (lost update), nhưng không thể chỉ dựa vào kết quả của `size` để phán đoán thực tế đã chèn bao nhiêu phần tử.

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    // ...
    // Kích thước thực tế lớn hơn ngưỡng thì mở rộng dung lượng
    if (++size > threshold)
        resize();
    // Callback sau khi chèn
    afterNodeInsertion(evict);
    return null;
}
```

### Các cách duyệt HashMap phổ biến?

[7 cách duyệt HashMap và phân tích hiệu năng!](https://mp.weixin.qq.com/s/zQBN3UvJDhRTKP6SzcZFKw)

**🐛 Đính chính (xem: [issue#1411](https://github.com/Snailclimb/JavaGuide/issues/1411)):**

Bài viết trên có sai sót trong phần phân tích hiệu năng của cách duyệt bằng `parallelStream`. Xin nêu kết luận trước: **khi có tác vụ chặn (blocking), hiệu năng `parallelStream` cao nhất; khi không có tác vụ chặn, hiệu năng `parallelStream` thấp nhất.**

Khi việc duyệt không có tác vụ chặn, hiệu năng của `parallelStream` là thấp nhất:

```plain
Benchmark               Mode  Cnt     Score      Error  Units
Test.entrySet           avgt    5   288.651 ±   10.536  ns/op
Test.keySet             avgt    5   584.594 ±   21.431  ns/op
Test.lambda             avgt    5   221.791 ±   10.198  ns/op
Test.parallelStream     avgt    5  6919.163 ± 1116.139  ns/op
```

Sau khi thêm đoạn code gây chặn `Thread.sleep(10)`, hiệu năng của `parallelStream` mới là cao nhất:

```plain
Benchmark               Mode  Cnt           Score          Error  Units
Test.entrySet           avgt    5  1554828440.000 ± 23657748.653  ns/op
Test.keySet             avgt    5  1550612500.000 ±  6474562.858  ns/op
Test.lambda             avgt    5  1551065180.000 ± 19164407.426  ns/op
Test.parallelStream     avgt    5   186345456.667 ±  3210435.590  ns/op
```

### ⭐️ Sự khác nhau giữa ConcurrentHashMap và Hashtable

Sự khác biệt giữa `ConcurrentHashMap` và `Hashtable` chủ yếu thể hiện ở cách thức hiện thực tính an toàn luồng (thread-safety).

- **Cấu trúc dữ liệu nền tảng:** `ConcurrentHashMap` của JDK 1.7 ở tầng dưới sử dụng **mảng phân đoạn + danh sách liên kết**, trong JDK 1.8 sử dụng cấu trúc dữ liệu giống `HashMap` là mảng + danh sách liên kết / cây đỏ-đen (Red-Black Tree). `Hashtable` có cấu trúc dữ liệu nền tảng tương tự `HashMap` trước JDK 1.8, đều dùng dạng **mảng + danh sách liên kết**, trong đó mảng là thành phần chính còn danh sách liên kết tồn tại chủ yếu để giải quyết xung đột băm.
- **Cách hiện thực an toàn luồng (Quan trọng):**
  - Vào thời JDK 1.7, `ConcurrentHashMap` chia toàn bộ mảng bucket thành từng đoạn (`Segment`, khóa phân đoạn); mỗi khóa chỉ khóa một phần dữ liệu trong bộ chứa (có sơ đồ minh họa bên dưới). Khi nhiều thread truy cập dữ liệu ở các phân đoạn khác nhau trong bộ chứa thì không xảy ra tranh chấp khóa, nhờ đó nâng cao tỷ lệ truy cập đồng thời.
  - Sang JDK 1.8, `ConcurrentHashMap` đã loại bỏ khái niệm `Segment`, thay vào đó dùng trực tiếp cấu trúc dữ liệu mảng `Node` + danh sách liên kết + cây đỏ-đen, còn việc kiểm soát đồng thời sử dụng `synchronized` và CAS. (Từ JDK 1.6 trở đi khóa `synchronized` đã được tối ưu rất nhiều.) Nhìn tổng thể giống như một `HashMap` đã được tối ưu và an toàn luồng; mặc dù trong JDK 1.8 vẫn còn thấy cấu trúc dữ liệu `Segment`, nhưng các thuộc tính đã được tối giản hóa, chỉ giữ lại để tương thích với các phiên bản cũ.
  - **`Hashtable` (dùng chung một khóa duy nhất):** Dùng `synchronized` để đảm bảo an toàn luồng nên hiệu năng rất thấp. Khi một thread truy cập phương thức đồng bộ, các thread khác cũng truy cập phương thức đồng bộ sẽ có thể rơi vào trạng thái bị chặn (blocked) hoặc thăm dò (polling); chẳng hạn một thread đang dùng `put` để thêm phần tử thì thread khác không thể dùng `put` để thêm phần tử, cũng không thể dùng `get`, mức độ tranh chấp ngày càng gay gắt và hiệu năng càng thấp.

Dưới đây, hãy xem tiếp biểu đồ so sánh cấu trúc dữ liệu nền tảng của cả hai.

**Hashtable**:

![Cấu trúc bên trong của Hashtable](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.7_hashmap-6222a2fe.png)

<p style="text-align:right;font-size:13px;color:gray">https://www.cnblogs.com/chengxiao/p/6842045.html></p>

**ConcurrentHashMap của JDK 1.7**:

![Cấu trúc lưu trữ ConcurrentHashMap Java 7](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

`ConcurrentHashMap` được cấu tạo từ cấu trúc mảng `Segment` và cấu trúc mảng `HashEntry`.

Mỗi phần tử trong mảng `Segment` chứa một mảng `HashEntry`, và mỗi phần tử mảng `HashEntry` thuộc cấu trúc danh sách liên kết.

**ConcurrentHashMap của JDK 1.8**:

![Cấu trúc lưu trữ ConcurrentHashMap Java 8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

`ConcurrentHashMap` của JDK 1.8 không còn là **mảng Segment + mảng HashEntry + danh sách liên kết**, mà là **mảng Node + danh sách liên kết / cây đỏ-đen**. Tuy nhiên, `Node` chỉ dùng cho trường hợp danh sách liên kết, còn trường hợp cây đỏ-đen cần dùng **`TreeNode`**. Khi chuỗi xung đột đạt tới một độ dài nhất định, danh sách liên kết sẽ được chuyển thành cây đỏ-đen.

`TreeNode` dùng để lưu nút của cây đỏ-đen và được bao bọc bởi `TreeBin`. `TreeBin` duy trì nút gốc của cây đỏ-đen thông qua thuộc tính `root`, bởi vì khi cây đỏ-đen thực hiện xoay (rotation), nút gốc có thể bị thay thế bởi nút con ban đầu của nó; tại thời điểm đó nếu có thread khác muốn ghi vào cây đỏ-đen này sẽ phát sinh mất an toàn luồng, nên trong `ConcurrentHashMap`, `TreeBin` duy trì thông tin thread đang sử dụng cây đỏ-đen này thông qua thuộc tính `waiter` nhằm ngăn các thread khác đi vào.

```java
static final class TreeBin<K,V> extends Node<K,V> {
        TreeNode<K,V> root;
        volatile TreeNode<K,V> first;
        volatile Thread waiter;
        volatile int lockState;
        // values for lockState
        static final int WRITER = 1; // set while holding write lock
        static final int WAITER = 2; // set when waiting for write lock
        static final int READER = 4; // increment value for setting read lock
...
}
```

### ⭐️ Cách hiện thực an toàn luồng cụ thể / Hiện thực nền tảng của ConcurrentHashMap

#### Trước JDK 1.8

![Cấu trúc lưu trữ ConcurrentHashMap Java 7](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

Trước hết, dữ liệu được chia thành từng đoạn (mỗi "đoạn" này chính là `Segment`) để lưu trữ, sau đó cấp cho mỗi đoạn dữ liệu một chiếc khóa; khi một thread chiếm khóa để truy cập một đoạn dữ liệu trong đó, dữ liệu ở các đoạn khác vẫn có thể được các thread khác truy cập bình thường.

**`ConcurrentHashMap` được cấu tạo từ cấu trúc mảng `Segment` và cấu trúc mảng `HashEntry`**.

`Segment` kế thừa `ReentrantLock`, vì vậy `Segment` là một Reentrant Lock (khóa có thể tái nhập), đóng vai trò như một chiếc khóa. `HashEntry` dùng để lưu trữ dữ liệu cặp key-value.

```java
static class Segment<K,V> extends ReentrantLock implements Serializable {
}
```

Một `ConcurrentHashMap` chứa một mảng `Segment`, số lượng `Segment` một khi **đã khởi tạo thì không thể thay đổi**. Kích thước mặc định của mảng `Segment` là 16, tức là mặc định có thể hỗ trợ đồng thời 16 thread ghi song song.

Cấu trúc của `Segment` tương tự như `HashMap`, là cấu trúc mảng và danh sách liên kết: một `Segment` chứa một mảng `HashEntry`, mỗi `HashEntry` là một phần tử có cấu trúc danh sách liên kết, và mỗi `Segment` bảo vệ các phần tử trong một mảng `HashEntry`; khi muốn sửa đổi dữ liệu của mảng `HashEntry`, trước tiên phải giành được khóa của `Segment` tương ứng. Nói cách khác, các thao tác ghi đồng thời vào cùng một `Segment` sẽ bị chặn, còn thao tác ghi vào các `Segment` khác nhau có thể thực thi song song.

#### Từ JDK 1.8 trở đi

![Cấu trúc lưu trữ ConcurrentHashMap Java 8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

Java 8 gần như đã viết lại hoàn toàn `ConcurrentHashMap`: lượng mã nguồn từ hơn 1.000 dòng trong Java 7 đã tăng lên hơn 6.000 dòng như hiện nay.

`ConcurrentHashMap` hủy bỏ khóa phân đoạn `Segment`, áp dụng `Node + CAS + synchronized` để đảm bảo an toàn đồng thời. Cấu trúc dữ liệu tương tự `HashMap` 1.8 — mảng + danh sách liên kết / cây đỏ-đen. Khi độ dài danh sách liên kết vượt quá ngưỡng nhất định (8), Java 8 chuyển danh sách liên kết (độ phức tạp thời gian tìm kiếm O(N)) thành cây đỏ-đen (độ phức tạp thời gian tìm kiếm O(log(N))).

Trong Java 8, độ mịn của khóa (lock granularity) nhỏ hơn: khi cập nhật một bucket không rỗng thường dùng `synchronized` để khóa nút đầu (head node) của bucket đó; việc cập nhật trên các bucket khác nhau thường có thể thực thi song song, và thao tác đọc cũng sẽ không sử dụng các khóa bucket này.

### ⭐️ Hiện thực ConcurrentHashMap ở JDK 1.7 và JDK 1.8 có điểm gì khác nhau?

- **Cách hiện thực an toàn luồng:** JDK 1.7 dùng khóa phân đoạn `Segment` để đảm bảo an toàn, trong đó `Segment` kế thừa từ `ReentrantLock`. JDK 1.8 từ bỏ thiết kế khóa phân đoạn `Segment`, sử dụng `Node + CAS + synchronized` để đảm bảo an toàn luồng với độ mịn khóa nhỏ hơn — `synchronized` chỉ khóa nút đầu của danh sách liên kết hoặc cây đỏ-đen hiện tại.
- **Cách giải quyết xung đột Hash:** JDK 1.7 dùng phương pháp nối chuỗi (separate chaining), còn JDK 1.8 dùng nối chuỗi kết hợp với cây đỏ-đen (khi độ dài danh sách liên kết vượt quá ngưỡng nhất định, chuyển danh sách liên kết thành cây đỏ-đen).
- **Mức độ đồng thời (concurrency):** Ở JDK 1.7, việc cập nhật đồng thời chủ yếu bị giới hạn bởi số lượng `Segment`, mặc định là 16. JDK 1.8 không còn dùng số lượng `Segment` cố định nữa, việc cập nhật trên các bucket khác nhau thường có thể thực thi song song.

### Tại sao key và value của ConcurrentHashMap không được phép là null?

Key và value của `ConcurrentHashMap` không được phép là `null` chủ yếu nhằm tránh sự nhập nhằng ngữ nghĩa (ambiguity). `null` là một giá trị đặc biệt biểu thị không có đối tượng hoặc không có tham chiếu. Nếu bạn dùng `null` làm key, bạn sẽ không thể phân biệt được key đó thực sự có tồn tại trong `ConcurrentHashMap` hay vốn dĩ không có key đó. Tương tự, nếu dùng `null` làm value, bạn sẽ không thể phân biệt được giá trị đó thực sự được lưu trong `ConcurrentHashMap` hay được trả về do không tìm thấy key tương ứng.

Lấy ví dụ phương thức `get`: kết quả trả về `null` tồn tại hai khả năng:

- Giá trị đó không nằm trong collection;
- Bản thân giá trị đó chính là `null`.

Đây chính là nguồn gốc của sự nhập nhằng.

Chi tiết có thể tham khảo tại [Phân tích mã nguồn ConcurrentHashMap](https://javaguide.cn/java/collection/concurrent-hash-map-source-code.html).

Trong môi trường đa luồng, tồn tại tình huống một thread đang thao tác trên `ConcurrentHashMap` thì các thread khác lại chỉnh sửa `ConcurrentHashMap` đó, nên không thể dùng `containsKey(key)` để kiểm tra xem cặp key-value này có tồn tại hay không, do vậy cũng không có cách nào giải quyết vấn đề nhập nhằng này.

Trái ngược với điều đó, `HashMap` có thể lưu trữ key `null` và value `null`, nhưng key `null` chỉ có thể có một, còn value `null` có thể có nhiều. Nếu truyền `null` làm tham số key, nó sẽ trả về giá trị tại vị trí có giá trị hash bằng 0. Trong môi trường đơn luồng, không có chuyện trong lúc một thread thao tác trên `HashMap` lại có thread khác chỉnh sửa `HashMap` đó, nên có thể thông qua `containsKey(key)` để kiểm tra cặp key-value có tồn tại hay không rồi xử lý tương ứng, do đó không tồn tại vấn đề nhập nhằng.

Nói cách khác, trong môi trường đa luồng không thể phán đoán chính xác cặp key-value có tồn tại hay không (vì tồn tại trường hợp thread khác sửa đổi), còn trong môi trường đơn luồng thì có thể (không có chuyện thread khác sửa đổi).

Nếu bạn thực sự cần sử dụng `null` trong `ConcurrentHashMap`, có thể dùng một đối tượng rỗng tĩnh đặc biệt để thay thế cho `null`:

```java
public static final Object NULL = new Object();
```

Cuối cùng, chia sẻ thêm câu trả lời của chính tác giả `ConcurrentHashMap` (Doug Lea) cho câu hỏi này:

> The main reason that nulls aren't allowed in ConcurrentMaps (ConcurrentHashMaps, ConcurrentSkipListMaps) is that ambiguities that may be just barely tolerable in non-concurrent maps can't be accommodated. The main one is that if `map.get(key)` returns `null`, you can't detect whether the key explicitly maps to `null` vs the key isn't mapped. In a non-concurrent map, you can check this via `map.contains(key)`, but in a concurrent one, the map might have changed between calls.
> *(Lý do chính khiến null không được phép trong các ConcurrentMap như ConcurrentHashMap hay ConcurrentSkipListMap là vì những sự nhập nhằng vốn có thể tạm chấp nhận trong các map không đồng thời lại không thể chấp nhận được ở đây. Vấn đề chính là nếu `map.get(key)` trả về `null`, bạn không thể xác định liệu key đó được ánh xạ tường minh tới `null` hay là key chưa được ánh xạ. Trong map không đồng thời, bạn có thể kiểm tra qua `map.contains(key)`, nhưng trong map đồng thời, dữ liệu có thể đã thay đổi giữa hai lần gọi.)*

Tạm dịch lại, ý chính vẫn là ở môi trường đơn luồng có thể chấp nhận sự nhập nhằng, còn trong môi trường đa luồng thì không thể chấp nhận được.

### ⭐️ ConcurrentHashMap có đảm bảo tính nguyên tử (atomicity) của các thao tác kết hợp không?

`ConcurrentHashMap` an toàn luồng (thread-safe), nghĩa là nó có thể đảm bảo khi nhiều thread cùng thực hiện đọc và ghi trên nó sẽ không xảy ra tình trạng dữ liệu không nhất quán, cũng sẽ không dẫn đến vấn đề vòng lặp vô hạn khi thao tác đa luồng như `HashMap` từ JDK 1.7 trở về trước. Tuy nhiên, điều đó KHÔNG có nghĩa là nó đảm bảo mọi thao tác kết hợp (compound operation) đều có tính nguyên tử (`Atomicity`) — nhất định đừng nhầm lẫn hai khái niệm này!

Thao tác kết hợp là thao tác được cấu thành từ nhiều thao tác cơ bản (như `put`, `get`, `remove`, `containsKey`, v.v.), ví dụ trước hết kiểm tra xem một key có tồn tại hay không bằng `containsKey(key)`, sau đó dựa vào kết quả để chèn hoặc cập nhật bằng `put(key, value)`. Loại thao tác này trong quá trình thực thi có thể bị thread khác xen ngang, dẫn đến kết quả không như kỳ vọng.

Ví dụ, có hai thread A và B cùng thực hiện thao tác kết hợp trên `ConcurrentHashMap` như sau:

```java
// Thread A
if (!map.containsKey(key)) {
map.put(key, value);
}
// Thread B
if (!map.containsKey(key)) {
map.put(key, anotherValue);
}
```

Nếu thứ tự thực thi của thread A và B diễn ra như sau:

1. Thread A kiểm tra thấy trong `map` chưa tồn tại `key`
2. Thread B kiểm tra thấy trong `map` chưa tồn tại `key`
3. Thread B chèn `(key, anotherValue)` vào `map`
4. Thread A chèn `(key, value)` vào `map`

Vậy kết quả cuối cùng sẽ là `(key, value)` chứ không phải `(key, anotherValue)` như mong đợi. Đây chính là vấn đề phát sinh do tính không nguyên tử của thao tác kết hợp.

**Vậy làm thế nào để đảm bảo tính nguyên tử cho thao tác kết hợp trong `ConcurrentHashMap`?**

`ConcurrentHashMap` cung cấp một số thao tác kết hợp mang tính nguyên tử như `putIfAbsent`, `compute`, `computeIfAbsent`, `computeIfPresent`, `merge`, v.v. Các phương thức này đều có thể nhận một hàm làm tham số để tính toán ra giá trị `value` mới dựa trên `key` và `value` đã cho rồi cập nhật vào map.

Đoạn code trên có thể viết lại thành:

```java
// Thread A
map.putIfAbsent(key, value);
// Thread B
map.putIfAbsent(key, anotherValue);
```

Hoặc:

```java
// Thread A
map.computeIfAbsent(key, k -> value);
// Thread B
map.computeIfAbsent(key, k -> anotherValue);
```

Nhiều bạn có thể sẽ nói: trường hợp này cũng có thể dùng khóa (lock) để đồng bộ mà! Đúng là có thể làm vậy, nhưng không khuyến khích dùng cơ chế đồng bộ bằng khóa thủ công vì đi ngược lại mục đích ban đầu khi dùng `ConcurrentHashMap`. Khi sử dụng `ConcurrentHashMap`, hãy cố gắng tận dụng các phương thức thao tác kết hợp nguyên tử có sẵn này để đảm bảo tính nguyên tử.

## Lớp tiện ích Collections (Ít quan trọng)

**Các phương thức thường dùng của lớp tiện ích `Collections`:**

- Sắp xếp
- Thao tác tìm kiếm, thay thế
- Kiểm soát đồng bộ (không khuyến khích; khi cần kiểu collection an toàn luồng, hãy cân nhắc sử dụng các collection đồng thời trong gói JUC)

### Thao tác sắp xếp

```java
void reverse(List list)// Đảo ngược danh sách
void shuffle(List list)// Xáo trộn ngẫu nhiên
void sort(List list)// Sắp xếp tăng dần theo thứ tự tự nhiên
void sort(List list, Comparator c)// Sắp xếp tùy chỉnh, logic sắp xếp do Comparator điều khiển
void swap(List list, int i , int j)// Hoán đổi phần tử tại hai vị trí chỉ số
void rotate(List list, int distance)// Xoay vòng: khi distance là số dương, chuyển toàn bộ distance phần tử cuối của list lên đầu; khi distance là số âm, chuyển toàn bộ distance phần tử đầu của list xuống cuối
```

### Thao tác tìm kiếm, thay thế

```java
int binarySearch(List list, Object key)// Tìm kiếm nhị phân trên List và trả về chỉ số, lưu ý List bắt buộc phải đã được sắp xếp
int max(Collection coll)// Trả về phần tử lớn nhất theo thứ tự tự nhiên; tương tự với int min(Collection coll)
int max(Collection coll, Comparator c)// Trả về phần tử lớn nhất theo thứ tự tùy chỉnh, quy tắc sắp xếp do lớp Comparator điều khiển; tương tự với int min(Collection coll, Comparator c)
void fill(List list, Object obj)// Thay thế toàn bộ phần tử trong list chỉ định bằng phần tử được chỉ định
int frequency(Collection c, Object o)// Thống kê số lần xuất hiện của phần tử
int indexOfSubList(List list, List target)// Tìm chỉ số xuất hiện đầu tiên của target trong list, không tìm thấy trả về -1; tương tự với int lastIndexOfSubList(List source, list target)
boolean replaceAll(List list, Object oldVal, Object newVal)// Thay thế các phần tử cũ bằng phần tử mới
```

### Kiểm soát đồng bộ

`Collections` cung cấp nhiều phương thức `synchronizedXxx()`, giúp bao bọc collection được chỉ định thành một collection đồng bộ theo luồng, từ đó giải quyết vấn đề an toàn luồng khi đa luồng truy cập đồng thời vào collection.

Mọi thao tác truy cập đều phải được thực hiện thông qua wrapper trả về; khi duyệt bằng `Iterator`, `Spliterator` hoặc `Stream`, bạn vẫn cần tự đồng bộ hóa thủ công trên wrapper đó.

Chúng ta biết `HashSet`, `TreeSet`, `ArrayList`, `LinkedList`, `HashMap`, `TreeMap` đều không an toàn luồng. `Collections` cung cấp nhiều phương thức tĩnh có thể bao bọc chúng thành các collection đồng bộ theo luồng.

**Tốt nhất không nên dùng các phương thức dưới đây vì hiệu năng rất thấp; khi cần kiểu collection an toàn luồng, hãy cân nhắc sử dụng các collection đồng thời thuộc gói JUC.**

Các phương thức cụ thể như sau:

```java
synchronizedCollection(Collection<T>  c) // Trả về collection đồng bộ (an toàn luồng) được bọc từ collection chỉ định.
synchronizedList(List<T> list)// Trả về List đồng bộ (an toàn luồng) được bọc từ list chỉ định.
synchronizedMap(Map<K,V> m) // Trả về Map đồng bộ (an toàn luồng) được bọc từ map chỉ định.
synchronizedSet(Set<T> s) // Trả về Set đồng bộ (an toàn luồng) được bọc từ set chỉ định.
```
