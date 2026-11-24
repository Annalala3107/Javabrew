---
title: Phân tích mã nguồn ConcurrentHashMap
description: "Phân tích chuyên sâu mã nguồn ConcurrentHashMap: so sánh cơ chế Segment Lock trên JDK 1.7 với CAS + Synchronized trên JDK 1.8, giúp nắm vững cơ chế đảm bảo an toàn luồng và tối ưu hiệu năng cho Map trong môi trường đồng thời cao."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/concurrent-hash-map-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn ConcurrentHashMap,Map an toàn luồng,Segment Lock,thao tác CAS,concurrent container,khác biệt JDK 7 và JDK 8
---

> Bài viết được đóng góp bởi Modu Code: <https://mp.weixin.qq.com/s/AHWzboztt53ZfFZmsSnMSw>. JavaGuide đã cải thiện và tối ưu đáng kể nội dung so với bản gốc.

Bài viết trước đã giới thiệu mã nguồn `HashMap`, nhận được phản hồi rất tốt và nhiều bạn đọc cũng đã chia sẻ quan điểm của mình. Lần này chúng ta tiếp tục đến với `ConcurrentHashMap`. Là một phiên bản `HashMap` an toàn luồng (thread-safe), tần suất sử dụng của nó cũng rất cao. Vậy cấu trúc lưu trữ và nguyên lý triển khai của nó như thế nào?

## 1. ConcurrentHashMap 1.7

### 1. Cấu trúc lưu trữ

![Cấu trúc lưu trữ của Java 7 ConcurrentHashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

Cấu trúc lưu trữ của `ConcurrentHashMap` trong Java 7 như hình trên. `ConcurrentHashMap` được cấu thành từ nhiều `Segment`, và mỗi `Segment` là một cấu trúc tương tự như `HashMap`, nên bên trong mỗi `HashMap` con có thể tự mở rộng dung lượng (`resize`). Tuy nhiên, số lượng `Segment` một khi đã **khởi tạo thì không thể thay đổi**; mặc định số lượng `Segment` là 16, do đó mặc định có thể có tối đa 16 phân đoạn thực hiện thao tác cập nhật đồng thời.

### 2. Khởi tạo

Hãy tìm hiểu quy trình khởi tạo của `ConcurrentHashMap` thông qua hàm khởi tạo không tham số.

```java
    /**
     * Creates a new, empty map with a default initial capacity (16),
     * load factor (0.75) and concurrencyLevel (16).
     */
    public ConcurrentHashMap() {
        this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR, DEFAULT_CONCURRENCY_LEVEL);
    }
```

Hàm khởi tạo không tham số gọi tới hàm khởi tạo có tham số và truyền vào ba giá trị mặc định, cụ thể như sau:

```java
    /**
     * Dung lượng khởi tạo mặc định
     */
    static final int DEFAULT_INITIAL_CAPACITY = 16;

    /**
     * Hệ số tải (load factor) mặc định
     */
    static final float DEFAULT_LOAD_FACTOR = 0.75f;

    /**
     * Mức độ đồng thời (concurrency level) mặc định
     */
    static final int DEFAULT_CONCURRENCY_LEVEL = 16;
```

Tiếp theo, hãy xem logic triển khai bên trong hàm khởi tạo có tham số này.

```java
@SuppressWarnings("unchecked")
public ConcurrentHashMap(int initialCapacity,float loadFactor, int concurrencyLevel) {
    // Kiểm tra tham số đầu vào
    if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
    // Kiểm tra concurrencyLevel, nếu lớn hơn 1<<16 thì đặt lại thành 65536
    if (concurrencyLevel > MAX_SEGMENTS)
        concurrencyLevel = MAX_SEGMENTS;
    // Tìm kích thước lũy thừa của 2 khớp tốt nhất với tham số
    // Số mũ của 2
    int sshift = 0;
    int ssize = 1;
    // Vòng lặp này tìm lũy thừa của 2 nhỏ nhất >= concurrencyLevel
    while (ssize < concurrencyLevel) {
        ++sshift;
        ssize <<= 1;
    }
    // Lưu độ dịch đoạn (segment shift)
    this.segmentShift = 32 - sshift;
    // Lưu mặt nạ đoạn (segment mask)
    this.segmentMask = ssize - 1;
    // Thiết lập dung lượng
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    // c = dung lượng / ssize, mặc định 16 / 16 = 1; tính dung lượng kiểu HashMap trong mỗi Segment
    int c = initialCapacity / ssize;
    if (c * ssize < initialCapacity)
        ++c;
    int cap = MIN_SEGMENT_TABLE_CAPACITY;
    // Dung lượng kiểu HashMap bên trong Segment tối thiểu là 2 hoặc bội lũy thừa của 2
    while (cap < c)
        cap <<= 1;
    // Tạo mảng segments và khởi tạo segments[0]
    Segment<K,V> s0 = new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                         (HashEntry<K,V>[])new HashEntry[cap]);
    Segment<K,V>[] ss = (Segment<K,V>[])new Segment[ssize];
    UNSAFE.putOrderedObject(ss, SBASE, s0); // ghi có thứ tự vào segments[0]
    this.segments = ss;
}
```

Tổng kết lại logic khởi tạo của `ConcurrentHashMap` trong Java 7:

1. Kiểm tra các tham số bắt buộc.
2. Kiểm tra kích thước mức độ đồng thời `concurrencyLevel`: nếu lớn hơn giá trị tối đa thì đặt lại về giá trị tối đa. Trong hàm khởi tạo không tham số, **giá trị mặc định là 16.**
3. Tìm giá trị **lũy thừa của 2** gần nhất lớn hơn hoặc bằng `concurrencyLevel` làm độ dài của mảng `segments`, **mặc định là 16**.
4. Lưu độ dịch `segmentShift` bằng **32 - sshift**, dùng để tính vị trí khi `put` ở bước sau; mặc định là 28.
5. Lưu `segmentMask`, mặc định là `ssize - 1 = 16 - 1 = 15`.
6. **Khởi tạo `segments[0]`**, **kích thước mặc định là 2**, **hệ số tải 0.75**, **ngưỡng mở rộng dung lượng (`threshold`) là `2\*0.75=1.5`**, nên chỉ khi chèn phần tử thứ hai mới tiến hành mở rộng dung lượng (`resize`).

### 3. put

Tiếp nối các tham số khởi tạo trên, hãy xem mã nguồn của phương thức `put`.

```java
/**
 * Maps the specified key to the specified value in this table.
 * Neither the key nor the value can be null.
 *
 * <p> The value can be retrieved by calling the <tt>get</tt> method
 * with a key that is equal to the original key.
 *
 * @param key key with which the specified value is to be associated
 * @param value value to be associated with the specified key
 * @return the previous value associated with <tt>key</tt>, or
 *         <tt>null</tt> if there was no mapping for <tt>key</tt>
 * @throws NullPointerException if the specified key or value is null
 */
public V put(K key, V value) {
    Segment<K,V> s;
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key);
    // Dịch phải không dấu hash đi 28 bit (tính lúc khởi tạo), rồi AND với segmentMask=15
    // Thực chất là lấy 4 bit cao AND với segmentMask (1111)
    int j = (hash >>> segmentShift) & segmentMask;
    if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
         (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
        // Nếu Segment tìm thấy bị null thì khởi tạo
        s = ensureSegment(j);
    return s.put(key, hash, value, false);
}

/**
 * Returns the segment for the given index, creating it and
 * recording in segment table (via CAS) if not already present.
 *
 * @param k the index
 * @return the segment
 */
@SuppressWarnings("unchecked")
private Segment<K,V> ensureSegment(int k) {
    final Segment<K,V>[] ss = this.segments;
    long u = (k << SSHIFT) + SBASE; // raw offset
    Segment<K,V> seg;
    // Kiểm tra Segment tại vị trí u có null không
    if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
        Segment<K,V> proto = ss[0]; // dùng segment 0 làm mẫu
        // Lấy độ dài khởi tạo của HashEntry<K,V> trong segment số 0
        int cap = proto.table.length;
        // Lấy loadFactor của bảng băm trong segment số 0 (tất cả segment dùng chung loadFactor)
        float lf = proto.loadFactor;
        // Tính ngưỡng mở rộng dung lượng
        int threshold = (int)(cap * lf);
        // Tạo mảng HashEntry có dung lượng cap
        HashEntry<K,V>[] tab = (HashEntry<K,V>[])new HashEntry[cap];
        if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) { // recheck
            // Kiểm tra lại Segment tại u có null không vì có thể có thread khác đã xử lý
            Segment<K,V> s = new Segment<K,V>(lf, threshold, tab);
            // Spin-check kiểm tra Segment tại vị trí u có null không
            while ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
                   == null) {
                // Gán giá trị bằng CAS, chỉ thành công một lần duy nhất
                if (UNSAFE.compareAndSwapObject(ss, u, null, seg = s))
                    break;
            }
        }
    }
    return seg;
}
```

Đoạn mã nguồn trên phân tích quy trình xử lý khi `ConcurrentHashMap` thực hiện `put` một dữ liệu; dưới đây là các bước cụ thể:

1. Tính toán vị trí của `key` cần `put`, lấy ra `Segment` tại vị trí chỉ định.

2. Nếu `Segment` tại vị trí đó bị trống (`null`), tiến hành khởi tạo `Segment` này.

   **Quy trình khởi tạo `Segment`:**

   1. Kiểm tra `Segment` tại vị trí vừa tính có là `null` hay không.
   2. Nếu là `null`, tiếp tục khởi tạo, dùng dung lượng và hệ số tải của `Segment[0]` để tạo một mảng `HashEntry`.
   3. Kiểm tra lại một lần nữa xem `Segment` tại vị trí chỉ định có còn là `null` không.
   4. Dùng mảng `HashEntry` vừa tạo để khởi tạo `Segment` này.
   5. Spin kiểm tra xem `Segment` tại vị trí chỉ định có là `null` không, sử dụng CAS để gán `Segment` vào vị trí đó.

3. Gọi `Segment.put` để chèn cặp `key`, `value`.

Phía trên chúng ta đã tìm hiểu thao tác lấy `Segment` và khởi tạo `Segment`. Phương thức `put` của `Segment` ở dòng cuối cùng vẫn chưa xem, hãy tiếp tục phân tích.

```java
final V put(K key, int hash, V value, boolean onlyIfAbsent) {
    // Lấy khóa độc quyền ReentrantLock; không lấy được thì gọi scanAndLockForPut
    HashEntry<K,V> node = tryLock() ? null : scanAndLockForPut(key, hash, value);
    V oldValue;
    try {
        HashEntry<K,V>[] tab = table;
        // Tính vị trí index cần put dữ liệu
        int index = (tab.length - 1) & hash;
        // Lấy HashEntry tại tọa độ index
        HashEntry<K,V> first = entryAt(tab, index);
        for (HashEntry<K,V> e = first;;) {
            if (e != null) {
                // Kiểm tra key đã tồn tại chưa; nếu tồn tại thì duyệt danh sách liên kết và thay thế value
                K k;
                if ((k = e.key) == key ||
                    (e.hash == hash && key.equals(k))) {
                    oldValue = e.value;
                    if (!onlyIfAbsent) {
                        e.value = value;
                        ++modCount;
                    }
                    break;
                }
                e = e.next;
            }
            else {
                // Nếu first khác null tức vị trí index đã có phần tử (xung đột), chèn vào đầu danh sách liên kết
                if (node != null)
                    node.setNext(first);
                else
                    node = new HashEntry<K,V>(hash, key, value, first);
                int c = count + 1;
                // Nếu số lượng vượt ngưỡng và độ dài mảng < MAXIMUM_CAPACITY thì thực hiện rehash
                if (c > threshold && tab.length < MAXIMUM_CAPACITY)
                    rehash(node);
                else
                    // Gán node vào vị trí index (có thể là một phần tử đơn hoặc đầu danh sách liên kết)
                    setEntryAt(tab, index, node);
                ++modCount;
                count = c;
                oldValue = null;
                break;
            }
        }
    } finally {
        unlock();
    }
    return oldValue;
}
```

Vì `Segment` kế thừa `ReentrantLock`, bên trong `Segment` có thể lấy khóa rất thuận tiện, và quy trình `put` đã tận dụng khả năng này:

1. Gọi `tryLock()` để lấy khóa; nếu không lấy được thì dùng **`scanAndLockForPut`** để tiếp tục lấy khóa.

2. Tính toán vị trí `index` để đặt dữ liệu cần `put`, sau đó lấy `HashEntry` tại vị trí này.

3. Duyệt để `put` phần tử mới. Tại sao phải duyệt? Vì `HashEntry` lấy được ở đây có thể là một ô trống hoặc một danh sách liên kết đã tồn tại, nên phải xử lý khác nhau:

   Nếu tại vị trí này **chưa có `HashEntry`**:

   1. Nếu số lượng hiện tại lớn hơn ngưỡng mở rộng dung lượng và nhỏ hơn dung lượng tối đa, **tiến hành mở rộng dung lượng (`rehash`)**.
   2. Nếu không, chèn trực tiếp theo phương pháp chèn đầu (head insertion).

   Nếu tại vị trí này **đã có `HashEntry`**:

   1. Kiểm tra xem `key` và `hash` của phần tử hiện tại trong danh sách liên kết có khớp với `key` và `hash` cần `put` hay không. Nếu khớp thì thay thế giá trị.
   2. Nếu không khớp, lấy node tiếp theo trong danh sách liên kết cho đến khi tìm thấy phần tử giống nhau để thay thế giá trị, hoặc duyệt hết danh sách liên kết mà không thấy phần tử nào giống:
      1. Nếu số lượng hiện tại lớn hơn ngưỡng mở rộng dung lượng và nhỏ hơn dung lượng tối đa, **tiến hành mở rộng dung lượng (`rehash`)**.
      2. Nếu không, chèn trực tiếp vào đầu danh sách liên kết.

4. Nếu vị trí cần chèn trước đó đã tồn tại phần tử, sau khi thay thế sẽ trả về giá trị cũ; ngược lại trả về `null`.

Ở bước 1 phía trên, chúng ta chưa giới thiệu thao tác `scanAndLockForPut`. Phương thức này liên tục spin gọi `tryLock()` để giành khóa. Khi số lần spin vượt quá giới hạn quy định, nó sẽ gọi `lock()` để chặn (block) cho tới khi lấy được khóa. Trong lúc spin, nó cũng tranh thủ lấy trước `HashEntry` tại vị trí `hash`.

```java
private HashEntry<K,V> scanAndLockForPut(K key, int hash, V value) {
    HashEntry<K,V> first = entryForHash(this, hash);
    HashEntry<K,V> e = first;
    HashEntry<K,V> node = null;
    int retries = -1; // âm khi đang định vị node
    // Spin để lấy khóa
    while (!tryLock()) {
        HashEntry<K,V> f; // dùng để kiểm tra lại first bên dưới
        if (retries < 0) {
            if (e == null) {
                if (node == null) // tạo trước node một cách suy đoán
                    node = new HashEntry<K,V>(hash, key, value, null);
                retries = 0;
            }
            else if (key.equals(e.key))
                retries = 0;
            else
                e = e.next;
        }
        else if (++retries > MAX_SCAN_RETRIES) {
            // Sau khi spin đạt số lần chỉ định thì block chờ cho tới khi lấy được khóa
            lock();
            break;
        }
        else if ((retries & 1) == 0 &&
                 (f = entryForHash(this, hash)) != first) {
            e = first = f; // duyệt lại nếu node đầu đã thay đổi
            retries = -1;
        }
    }
    return node;
}

```

### 4. Mở rộng dung lượng (`rehash`)

`ConcurrentHashMap` khi mở rộng dung lượng chỉ tăng lên gấp đôi so với ban đầu. Khi dữ liệu trong mảng cũ được di chuyển sang mảng mới, vị trí của chúng hoặc giữ nguyên, hoặc chuyển thành `index + oldSize`. Tham số `node` truyền vào sẽ được chèn vào vị trí chỉ định sau khi mở rộng dung lượng theo phương pháp **chèn đầu** danh sách liên kết.

```java
private void rehash(HashEntry<K,V> node) {
    HashEntry<K,V>[] oldTable = table;
    // Dung lượng cũ
    int oldCapacity = oldTable.length;
    // Dung lượng mới, tăng gấp đôi
    int newCapacity = oldCapacity << 1;
    // Ngưỡng mở rộng dung lượng mới
    threshold = (int)(newCapacity * loadFactor);
    // Tạo mảng mới
    HashEntry<K,V>[] newTable = (HashEntry<K,V>[]) new HashEntry[newCapacity];
    // Mặt nạ mới; ví dụ mặc định 2 sau khi mở rộng là 4, trừ 1 thành 3 (nhị phân 11)
    int sizeMask = newCapacity - 1;
    for (int i = 0; i < oldCapacity ; i++) {
        // Duyệt mảng cũ
        HashEntry<K,V> e = oldTable[i];
        if (e != null) {
            HashEntry<K,V> next = e.next;
            // Tính vị trí mới: hoặc giữ nguyên hoặc bằng vị trí cũ + dung lượng cũ
            int idx = e.hash & sizeMask;
            if (next == null)   //  Chỉ có một node đơn trên danh sách
                // Chưa phải danh sách liên kết, chỉ có 1 phần tử thì gán trực tiếp
                newTable[idx] = e;
            else { // Tái sử dụng chuỗi liên tiếp có cùng slot
                // Đã là danh sách liên kết
                HashEntry<K,V> lastRun = e;
                int lastIdx = idx;
                // Vị trí mới chỉ có thể giữ nguyên hoặc bằng vị trí cũ + dung lượng cũ
                // Sau khi duyệt xong, các phần tử phía sau lastRun đều có cùng vị trí mới
                for (HashEntry<K,V> last = next; last != null; last = last.next) {
                    int k = last.hash & sizeMask;
                    if (k != lastIdx) {
                        lastIdx = k;
                        lastRun = last;
                    }
                }
                // Các phần tử sau lastRun đều có chung vị trí, gán cả đoạn danh sách liên kết sang vị trí mới
                newTable[lastIdx] = lastRun;
                // Nhân bản các node còn lại
                for (HashEntry<K,V> p = e; p != lastRun; p = p.next) {
                    // Duyệt các phần tử còn lại và chèn đầu vào vị trí k chỉ định
                    V v = p.value;
                    int h = p.hash;
                    int k = h & sizeMask;
                    HashEntry<K,V> n = newTable[k];
                    newTable[k] = new HashEntry<K,V>(h, p.key, v, n);
                }
            }
        }
    }
    // Chèn đầu node mới
    int nodeIndex = node.hash & sizeMask; // thêm node mới
    node.setNext(newTable[nodeIndex]);
    newTable[nodeIndex] = node;
    table = newTable;
}
```

Một số bạn đọc có thể thắc mắc về hai vòng lặp `for` cuối cùng. Ở đây, vòng `for` đầu tiên nhằm tìm ra một node mà tất cả các node `next` phía sau nó đều có cùng vị trí mới, rồi gán trực tiếp cả đoạn đó như một danh sách liên kết vào vị trí mới. Vòng `for` thứ hai nhằm lấy các phần tử còn lại phía trước chèn theo kiểu chèn đầu vào danh sách liên kết tại vị trí tương ứng. ~~Cách triển khai như vậy có lẽ dựa trên thống kê xác suất, bạn nào nghiên cứu sâu có thể chia sẻ thêm ý kiến.~~

Trong vòng `for` thứ hai bên trong, mã nguồn dùng `new HashEntry<K,V>(h, p.key, v, n)` để tạo một `HashEntry` mới thay vì tái sử dụng node cũ, vì nếu tái sử dụng node cũ thì việc thay đổi con trỏ `next` sẽ khiến các Thread đang duyệt đồng thời (chẳng hạn đang thực thi phương thức `get`) không thể tiếp tục duyệt được. Đúng như chú thích trong mã nguồn đã nói:

> Các node bị thay thế sẽ đủ điều kiện cho Garbage Collection thu gom ngay khi không còn bị bất kỳ reader thread nào đang duyệt đồng thời bảng tham chiếu tới nữa.
>
> The nodes they replace will be garbage collectable as soon as they are no longer referenced by any reader thread that may be in the midst of concurrently traversing table

Còn tại sao lại cần thêm một vòng `for` để tìm `lastRun`? Thực chất là để giảm số lần tạo đối tượng mới, đúng như chú thích đã nêu:

> Về mặt thống kê, với ngưỡng mặc định, khi dung lượng bảng tăng gấp đôi thì chỉ khoảng một phần sáu số node cần phải được nhân bản (clone).
>
> Statistically, at the default threshold, only about one-sixth of them need cloning when a table doubles.

### 5. get

Đến đây thì mọi thứ rất đơn giản, phương thức `get` chỉ cần hai bước:

1. Tính toán ra vị trí lưu trữ của `key`.
2. Duyệt tại vị trí chỉ định để tìm kiếm giá trị `value` của `key` khớp.

```java
public V get(Object key) {
    Segment<K,V> s; // tích hợp thủ công phương thức truy cập để giảm chi phí gọi hàm
    HashEntry<K,V>[] tab;
    int h = hash(key);
    long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;
    // Tính toán ra vị trí lưu trữ của key
    if ((s = (Segment<K,V>)UNSAFE.getObjectVolatile(segments, u)) != null &&
        (tab = s.table) != null) {
        for (HashEntry<K,V> e = (HashEntry<K,V>) UNSAFE.getObjectVolatile
                 (tab, ((long)(((tab.length - 1) & h)) << TSHIFT) + TBASE);
             e != null; e = e.next) {
            // Nếu là danh sách liên kết, duyệt tìm value của key trùng khớp
            K k;
            if ((k = e.key) == key || (e.hash == h && key.equals(k)))
                return e.value;
        }
    }
    return null;
}
```

## 2. ConcurrentHashMap 1.8

Nhìn chung, `ConcurrentHashMap` trong Java 8 có sự thay đổi khá lớn so với Java 7.

### 1. Cấu trúc lưu trữ

![Cấu trúc lưu trữ của Java 8 ConcurrentHashMap (Ảnh từ javadoop)](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

Có thể thấy `ConcurrentHashMap` của Java 8 thay đổi khá nhiều so với Java 7: không còn là **Mảng Segment + Mảng HashEntry + Danh sách liên kết** như trước, mà chuyển thành **Mảng Node + Danh sách liên kết / Cây đỏ-đen (Red-Black Tree)**. Khi danh sách liên kết bị xung đột đạt đến một độ dài nhất định, danh sách liên kết sẽ được chuyển đổi thành Cây đỏ-đen.

### 2. Khởi tạo initTable

```java
/**
 * Initializes table, using the size recorded in sizeCtl.
 */
private final Node<K,V>[] initTable() {
    Node<K,V>[] tab; int sc;
    while ((tab = table) == null || tab.length == 0) {
        // Nếu sizeCtl < 0, chứng tỏ thread khác đã CAS thành công và đang khởi tạo
        if ((sc = sizeCtl) < 0)
            // Nhường quyền sử dụng CPU
            Thread.yield(); // lost initialization race; just spin
        else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
            try {
                if ((tab = table) == null || tab.length == 0) {
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                    @SuppressWarnings("unchecked")
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                    table = tab = nt;
                    sc = n - (n >>> 2);
                }
            } finally {
                sizeCtl = sc;
            }
            break;
        }
    }
    return tab;
}
```

Từ mã nguồn có thể thấy việc khởi tạo `ConcurrentHashMap` được hoàn thành thông qua **spin và thao tác CAS**. Trong đó cần lưu ý biến `sizeCtl` (viết tắt của `sizeControl`), giá trị của nó quyết định trạng thái khởi tạo hiện tại:

1. `-1`: Cho biết đang trong quá trình khởi tạo, các Thread khác cần spin chờ.
2. `-N`: Cho biết `table` đang trong quá trình mở rộng dung lượng (`resize`); 16 bit cao biểu thị dấu nhận diện mở rộng (resize stamp), còn 16 bit thấp trừ đi 1 chính là số lượng Thread đang tham gia mở rộng dung lượng.
3. `0`: Cho biết `table` chưa được khởi tạo; khi khởi tạo sẽ sử dụng dung lượng mặc định.
4. `>0`: Biểu thị ngưỡng mở rộng dung lượng của `table` nếu `table` đã được khởi tạo.

### 3. put

Hãy đi thẳng qua mã nguồn của `put`.

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}

/** Implementation for put and putIfAbsent */
final V putVal(K key, V value, boolean onlyIfAbsent) {
    // key và value không được phép null
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        // f = phần tử tại vị trí đích
        Node<K,V> f; int n, i, fh;// fh lưu giá trị hash của phần tử tại vị trí đích
        if (tab == null || (n = tab.length) == 0)
            // Mảng bucket đang rỗng, khởi tạo mảng bucket (spin + CAS)
            tab = initTable();
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            // Bucket đang rỗng, dùng CAS đưa vào không cần khóa; thành công thì break thoát luôn
            if (casTabAt(tab, i, null,new Node<K,V>(hash, key, value, null)))
                break;  // no lock when adding to empty bin
        }
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            // Dùng synchronized khóa node đầu để thêm node
            synchronized (f) {
                if (tabAt(tab, i) == f) {
                    // Cho thấy là danh sách liên kết
                    if (fh >= 0) {
                        binCount = 1;
                        // Lặp để thêm node mới hoặc ghi đè node đã có
                        for (Node<K,V> e = f;; ++binCount) {
                            K ek;
                            if (e.hash == hash &&
                                ((ek = e.key) == key ||
                                 (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K,V> pred = e;
                            if ((e = e.next) == null) {
                                pred.next = new Node<K,V>(hash, key,
                                                          value, null);
                                break;
                            }
                        }
                    }
                    else if (f instanceof TreeBin) {
                        // Cây đỏ-đen
                        Node<K,V> p;
                        binCount = 2;
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                       value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            if (binCount != 0) {
                if (binCount >= TREEIFY_THRESHOLD)
                    treeifyBin(tab, i);
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    addCount(1L, binCount);
    return null;
}
```

1. Tính toán `hashCode` dựa trên `key`.

2. Kiểm tra xem có cần tiến hành khởi tạo hay không.

3. Nếu `Node` định vị theo `key` hiện tại bị `null`, chứng tỏ có thể ghi dữ liệu vào vị trí này, dùng CAS thử ghi; nếu thất bại thì quay lại vòng lặp và kiểm tra trạng thái mới nhất.

4. Nếu `hashCode` của vị trí hiện tại thỏa mãn `MOVED == -1`, thì cần tiến hành mở rộng dung lượng (hỗ trợ di chuyển dữ liệu).

5. Nếu không rơi vào các trường hợp trên, sử dụng khóa `synchronized` để ghi dữ liệu.

6. Nếu số lượng phần tử đạt tới `TREEIFY_THRESHOLD` thì thực thi phương thức cây hóa; bên trong `treeifyBin` trước hết sẽ kiểm tra độ dài mảng hiện tại >= 64 rồi mới chuyển đổi danh sách liên kết thành Cây đỏ-đen.

### 4. get

Quy trình `get` tương đối đơn giản, hãy xem trực tiếp mã nguồn.

```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    // Vị trí hash mà key nằm ở đó
    int h = spread(key.hashCode());
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (e = tabAt(tab, (n - 1) & h)) != null) {
        // Nếu phần tử tại vị trí chỉ định tồn tại và hash của node đầu giống nhau
        if ((eh = e.hash) == h) {
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                // Giá trị hash và key đều bằng nhau, trả về value của phần tử luôn
                return e.val;
        }
        else if (eh < 0)
            // Hash của node đầu < 0, tức đang mở rộng dung lượng hoặc là Cây đỏ-đen, gọi find tìm kiếm
            return (p = e.find(h, key)) != null ? p.val : null;
        while ((e = e.next) != null) {
            // Là danh sách liên kết, duyệt để tìm kiếm
            if (e.hash == h &&
                ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```

Tổng kết lại quá trình `get`:

1. Tính toán vị trí dựa vào giá trị hash.
2. Tìm tới vị trí chỉ định; nếu node đầu chính là phần tử cần tìm thì trả về trực tiếp `value` của nó.
3. Nếu giá trị hash của node đầu nhỏ hơn 0, chứng tỏ đang mở rộng dung lượng hoặc là Cây đỏ-đen, tiến hành tìm kiếm qua `find`.
4. Nếu là danh sách liên kết, duyệt danh sách để tìm kiếm.

### 5. Đếm số lượng phần tử (`size`)

Phương thức `size()` của `ConcurrentHashMap` dùng để lấy tổng số phần tử hiện có trong Map, nhưng trong kịch bản đồng thời cao, làm thế nào để thống kê số lượng phần tử vừa chính xác vừa hiệu quả là một bài toán kỹ thuật khó. Java 8 đã áp dụng một cơ chế đếm phân mảnh rất tinh tế để giải quyết vấn đề này.

#### 5.1 Tại sao cần cơ chế đếm phân mảnh

Trong môi trường đồng thời (concurrent), nếu nhiều Thread cùng lúc thực thi thao tác `put`, tất cả đều cần cập nhật tổng số phần tử. Nếu chỉ sử dụng một biến đếm dùng chung duy nhất, nó sẽ dẫn đến tranh chấp khốc liệt — mọi Thread đều giành quyền sửa đổi cùng một biến, gây ảnh hưởng nghiêm trọng tới hiệu năng.

Để giải quyết vấn đề này, `ConcurrentHashMap` áp dụng tư tưởng thiết kế **phân tán điểm nóng (hotspot dispersion)**: không dùng một bộ đếm đơn lẻ mà phân tán việc đếm sang nhiều biến khác nhau. Giống như ngân hàng không chỉ mở một quầy giao dịch mà mở nhiều quầy để phân luồng khách hàng vậy, cách này giúp giảm đáng kể xung đột.

#### 5.2 Thiết kế của `baseCount` và `counterCells`

Bên trong `ConcurrentHashMap` duy trì hai trường cốt lõi liên quan đến việc đếm:

- **baseCount**: Bộ đếm cơ bản. Trong trường hợp không có tranh chấp, biến này được cập nhật trực tiếp qua CAS. Có thể coi nó như "bộ đếm chính".
- **counterCells**: Mảng các bộ đếm. Khi nhiều Thread cạnh tranh cập nhật `baseCount` thất bại, chúng sẽ thử phân tán phần tăng thêm của bộ đếm vào các vị trí khác nhau trong mảng `counterCells`.
  - Mỗi Thread dựa vào **giá trị Probe** của mình (có thể hiểu như một mã băm được sinh ra từ Thread) để ánh xạ tới một slot nào đó trong mảng, ưu tiên cộng dồn vào "ô ưu tiên" này.
  - **Lưu ý**: Ô này không phải là "riêng tư tuyệt đối của Thread" theo nghĩa chặt chẽ; khi xảy ra xung đột băm, nhiều Thread vẫn có thể ánh xạ tới cùng một slot và cập nhật đồng thời.

**Ví dụ**: Giả sử có 10 Thread cùng lúc thêm phần tử vào Map. Thread đầu tiên cập nhật thành công `baseCount` qua CAS, nhưng 9 Thread còn lại khi cập nhật `baseCount` phát hiện có tranh chấp nên chuyển sang tìm một vị trí trong mảng `counterCells` để cộng dồn. 9 Thread này có thể phân tán vào các vị trí khác nhau của mảng (ví dụ Thread 2 ở `counterCells[1]`, Thread 3 ở `counterCells[2]`), qua đó phân tán sự tranh chấp từ một điểm sang nhiều điểm.

#### 5.3 Cách cập nhật bộ đếm khi `put` phần tử

Ở cuối phương thức `putVal`, ta có thể thấy lệnh gọi `addCount(1L, binCount)` — phương thức này dùng để cập nhật số lượng phần tử.

Logic thực thi của `addCount` có thể tóm tắt đại khái như sau:

1. **Ưu tiên thử cập nhật `baseCount`**

   - Nếu hiện tại vẫn chưa kích hoạt `counterCells` (`counterCells == null`), Thread sẽ thử cập nhật trực tiếp `baseCount` qua CAS trước.
   - Nếu CAS thành công, chứng tỏ mức độ tranh chấp không cao, có thể return ngay lập tức.

2. **Khi xuất hiện tranh chấp, chuyển sang `counterCells`**

   - Nếu cập nhật `baseCount` qua CAS thất bại (chứng tỏ có Thread khác đang tranh chấp), hoặc `counterCells` đã tồn tại (chứng tỏ hệ thống trước đó đã từng gặp tranh chấp), Thread sẽ thử cập nhật trong `counterCells`:
     - Ánh xạ tới một slot dựa vào giá trị probe của chính mình;
     - Thực hiện một lần cộng dồn CAS lên `CounterCell` tương ứng với slot đó.
   - Nếu slot này đang trống hoặc CAS vẫn tiếp tục xung đột, Thread sẽ đi vào một nhánh "nặng" hơn là `fullAddCount`, bên trong sẽ phụ trách khởi tạo slot, chọn lại slot, v.v.

3. **Khởi tạo động và mở rộng dung lượng `counterCells`**
   - Khi phát hiện tranh chấp tương đối gay gắt (ví dụ: CAS của một cell nào đó cũng liên tục thất bại), `fullAddCount` dưới sự bảo vệ của một Spin Lock nhẹ `cellsBusy` sẽ:
     - Nếu `counterCells` chưa được khởi tạo thì khởi tạo một mảng nhỏ (ví dụ độ dài 2);
     - Nếu đã tồn tại và độ dài chưa đạt giới hạn trên (thường không vượt quá số nhân CPU) thì mở rộng gấp 2 lần, tăng thêm các slot đếm để phân tán Thread ra nhiều hơn nữa.

Thiết kế này đảm bảo: khi mức độ đồng thời thấp thì chỉ dùng `baseCount` đơn giản với đường đi cực ngắn; khi mức độ đồng thời cao thì tự động chuyển sang đếm phân mảnh, san phẳng tranh chấp thông qua `counterCells` và cơ chế mở rộng dung lượng, cân bằng được cả hiệu năng lẫn độ chính xác.

#### 5.4 Cách `sumCount` tính tổng số phần tử

Khi ta gọi phương thức `size()`, cuối cùng nó sẽ gọi phương thức `sumCount()` để tính tổng số phần tử. Logic của `sumCount()` rất đơn giản và trực tiếp:

1. Đọc giá trị của `baseCount` làm giá trị nền.
2. Duyệt mảng `counterCells`, cộng dồn giá trị đếm của tất cả các vị trí khác null vào giá trị nền.
3. Trả về kết quả cộng dồn.

**Lưu ý**:

- **Tính nhất quán yếu (Weak Consistency)**: Toàn bộ quá trình của `sumCount()` **không dùng khóa**. Trong lúc đang tính toán nếu có Thread khác chèn dữ liệu, kết quả trả về chỉ là một **giá trị xấp xỉ**. Tuy nhiên, trong bối cảnh đồng thời cao, việc theo đuổi "tổng số chính xác tại một tích tắc" tốn kém chi phí quá lớn và không có ý nghĩa, một giá trị xấp xỉ thường đã đủ dùng.
- **Tràn số nguyên (Integer Overflow)**: Phương thức `size()` trả về kiểu `int`. Nếu số lượng phần tử vượt quá `Integer.MAX_VALUE`, nó sẽ chỉ trả về `Integer.MAX_VALUE`. Phương thức **`mappingCount()`** được bổ sung từ Java 8 trả về kiểu `long`, phù hợp để biểu diễn số lượng lớn hơn, nhưng trong lúc có cập nhật đồng thời giá trị trả về vẫn là ước lượng.

## 3. Tổng kết

`ConcurrentHashMap` trong Java 7 sử dụng khóa phân đoạn (Segment Lock), tức là trên mỗi `Segment` tại cùng một thời điểm chỉ có một Thread có thể thao tác. Mỗi `Segment` là một cấu trúc mảng tương tự `HashMap` có thể mở rộng dung lượng, và xung đột của nó sẽ chuyển thành danh sách liên kết. Tuy nhiên, số lượng `Segment` một khi đã khởi tạo thì không thể thay đổi.

`ConcurrentHashMap` trong Java 8 sử dụng cơ chế khóa `Synchronized` kết hợp CAS. Cấu trúc cũng tiến hóa từ **Mảng `Segment` + Mảng `HashEntry` + Danh sách liên kết** của Java 7 thành **Mảng `Node` + Danh sách liên kết / Cây đỏ-đen (Red-Black Tree)**, trong đó `Node` là cấu trúc tương tự `HashEntry`. Khi xung đột đạt tới một kích thước nhất định (`TREEIFY_THRESHOLD = 8`), danh sách liên kết sẽ chuyển thành Cây đỏ-đen; khi số lượng xung đột nhỏ hơn một mức nhất định (`UNTREEIFY_THRESHOLD = 6`), nó lại thoái hóa về danh sách liên kết.

Một số bạn đọc có thể băn khoăn về hiệu năng của `Synchronized`, thực tế là từ khi `Synchronized` đưa vào chiến lược nâng cấp khóa (lock escalation), hiệu năng không còn là vấn đề nữa; các bạn quan tâm có thể tự tìm hiểu thêm về **nâng cấp khóa** của `Synchronized`.
