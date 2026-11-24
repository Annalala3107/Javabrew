---
title: Tổng hợp lưu ý khi sử dụng Java Collections
description: "Tổng hợp lưu ý khi sử dụng Java Collections: Dựa trên Alibaba Java Coding Guidelines, hệ thống hóa các thực hành tốt nhất như kiểm tra tập hợp rỗng, cạm bẫy của Arrays.asList, vấn đề subList và lựa chọn concurrent container nhằm tránh các lỗi thường gặp."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/java-collection-precautions-for-use.md
head:
  - - meta
    - name: keywords
      content: Thực hành tốt Java Collections,Kiểm tra tập hợp rỗng,Arrays.asList,subList,Concurrent Container,Lưu ý khi sử dụng Collection,Tối ưu hiệu năng
---

Trong bài viết này, tôi tổng hợp các lưu ý thường gặp khi sử dụng Collection cùng nguyên lý cụ thể của chúng dựa trên *Alibaba Java Coding Guidelines* (Sổ tay Lập trình Java của Alibaba).

Rất khuyến khích các bạn đọc kỹ lại vài lần để tránh mắc phải những lỗi cơ bản như vậy khi tự viết code.

## Kiểm tra tập hợp rỗng

*Alibaba Java Coding Guidelines* mô tả như sau:

> **Để kiểm tra tất cả phần tử bên trong Collection có rỗng hay không, hãy sử dụng phương thức `isEmpty()` thay vì cách dùng `size()==0`.**

Lý do là vì phương thức `isEmpty()` có tính dễ đọc tốt hơn và có độ phức tạp thời gian là `O(1)`.

Đa phần các Collection mà chúng ta sử dụng đều có phương thức `size()` với độ phức tạp thời gian là `O(1)`, tuy nhiên cũng có nhiều lớp không đạt `O(1)`, chẳng hạn như `ConcurrentLinkedQueue` thuộc gói `java.util.concurrent`. Phương thức `isEmpty()` của `ConcurrentLinkedQueue` kiểm tra thông qua phương thức `first()`, trong đó `first()` trả về node đầu tiên trong hàng đợi có giá trị khác `null` (lý do giá trị của node bằng `null` là vì cơ chế xóa logic được sử dụng trong iterator):

```java
public boolean isEmpty() { return first() == null; }

Node<E> first() {
    restartFromHead:
    for (;;) {
        for (Node<E> h = head, p = h, q;;) {
            boolean hasItem = (p.item != null);
            if (hasItem || (q = p.next) == null) {  // Giá trị node hiện tại khác null hoặc đã đến cuối hàng đợi
                updateHead(h, p);  // Đặt head thành p
                return hasItem ? p : null;
            }
            else if (p == q) continue restartFromHead;
            else p = q;  // p = p.next
        }
    }
}
```

Do khi thêm và xóa phần tử đều thực thi phương thức `updateHead(h, p)`, nên độ phức tạp thời gian của phương thức này có thể coi là xấp xỉ `O(1)`. Trong khi đó, phương thức `size()` cần duyệt toàn bộ danh sách liên kết, có độ phức tạp thời gian là `O(n)`:

```java
public int size() {
    int count = 0;
    for (Node<E> p = first(); p != null; p = succ(p))
        if (p.item != null)
            if (++count == Integer.MAX_VALUE)
                break;
    return count;
}
```

Ngoài ra, trong `ConcurrentHashMap` 1.7, độ phức tạp thời gian của phương thức `size()` và `isEmpty()` cũng không hoàn toàn giống nhau. `ConcurrentHashMap` 1.7 lưu số lượng phần tử trong từng `Segment`: phương thức `size()` cần thống kê số lượng của từng `Segment`, còn `isEmpty()` chỉ cần tìm thấy `Segment` đầu tiên không rỗng là được. Tuy nhiên, trong `ConcurrentHashMap` 1.8, cả `size()` và `isEmpty()` đều cần gọi phương thức `sumCount()` để tổng hợp bộ đếm trong `baseCount` và `CounterCell[]`. Dưới đây là mã nguồn của phương thức `sumCount()`:

```java
final long sumCount() {
    CounterCell[] as = counterCells; CounterCell a;
    long sum = baseCount;
    if (as != null)
        for (int i = 0; i < as.length; ++i)
            if ((a = as[i]) != null)
                sum += a.value;
    return sum;
}
```

Trong môi trường đồng thời (concurrent), `ConcurrentHashMap` 1.8 sử dụng `baseCount` và `CounterCell[]` để phân tán tranh chấp khi cập nhật bộ đếm, thay vì lưu số lượng node trong từng `Node`. Trong `ConcurrentHashMap` 1.7, số lượng phần tử được lưu trong từng `Segment`, phương thức `size()` cần thống kê số lượng của mỗi `Segment`, còn `isEmpty()` chỉ cần tìm ra `Segment` đầu tiên không rỗng là đủ.

## Chuyển đổi Collection sang Map

*Alibaba Java Coding Guidelines* mô tả như sau:

> **Khi sử dụng phương thức `toMap()` của lớp `java.util.stream.Collectors` để chuyển thành `Map`, nhất định phải lưu ý rằng khi value là `null` sẽ ném ra ngoại lệ NPE.**

```java
class Person {
    private String name;
    private String phoneNumber;
     // getters and setters
}

List<Person> bookList = new ArrayList<>();
bookList.add(new Person("jack","18163138123"));
bookList.add(new Person("martin",null));
// Lỗi NullPointerException
bookList.stream().collect(Collectors.toMap(Person::getName, Person::getPhoneNumber));
```

Dưới đây chúng ta sẽ giải thích nguyên nhân.

Trước tiên, hãy xem phương thức `toMap()` của lớp `java.util.stream.Collectors`; có thể thấy bên trong nó gọi phương thức `merge()` của interface `Map`.

```java
public static <T, K, U, M extends Map<K, U>>
Collector<T, ?, M> toMap(Function<? super T, ? extends K> keyMapper,
                            Function<? super T, ? extends U> valueMapper,
                            BinaryOperator<U> mergeFunction,
                            Supplier<M> mapSupplier) {
    BiConsumer<M, T> accumulator
            = (map, element) -> map.merge(keyMapper.apply(element),
                                          valueMapper.apply(element), mergeFunction);
    return new CollectorImpl<>(mapSupplier, accumulator, mapMerger(mergeFunction), CH_ID);
}
```

Phương thức `merge()` của interface `Map` như sau; phương thức này là cài đặt mặc định (default method) trong interface.

> Nếu bạn chưa nắm rõ các tính năng mới của Java 8, hãy xem bài viết này: [Tổng hợp tính năng mới Java 8](https://mp.weixin.qq.com/s/ojyl7B6PiHaTWADqmUq2rw).

```java
default V merge(K key, V value,
        BiFunction<? super V, ? super V, ? extends V> remappingFunction) {
    Objects.requireNonNull(remappingFunction);
    Objects.requireNonNull(value);
    V oldValue = get(key);
    V newValue = (oldValue == null) ? value :
               remappingFunction.apply(oldValue, value);
    if(newValue == null) {
        remove(key);
    } else {
        put(key, newValue);
    }
    return newValue;
}
```

Phương thức `merge()` sẽ gọi `Objects.requireNonNull()` trước để kiểm tra `value` có rỗng (`null`) hay không.

```java
public static <T> T requireNonNull(T obj) {
    if (obj == null)
        throw new NullPointerException();
    return obj;
}
```

> `Collectors` cũng cung cấp phương thức `toMap()` không cần truyền `mergeFunction`, nhưng khi đó nếu xảy ra trùng `key`, nó sẽ ném ra ngoại lệ `duplicateKeyException`. Vì vậy rất khuyến khích khi dùng `toMap()` phải truyền đầy đủ `mergeFunction`.

## Duyệt Collection

*Alibaba Java Coding Guidelines* mô tả như sau:

> **Không thực hiện thao tác `remove/add` phần tử bên trong vòng lặp `foreach`. Để xóa phần tử hãy dùng `Iterator`; nếu thao tác đồng thời, cần khóa (lock) trên đối tượng `Iterator`.**

Cần lưu ý rằng chỉ khóa đối tượng `Iterator` không thể ngăn các Thread khác chỉnh sửa Collection. Lấy ví dụ các synchronization wrapper do `Collections.synchronizedXxx()` trả về: khi duyệt cần đồng bộ (`synchronized`) trên chính đối tượng Collection đã được bọc (wrapper) và đảm bảo mọi thao tác truy cập đều đi qua wrapper đó.

Thông qua việc dịch ngược (decompile), bạn sẽ thấy cú pháp `foreach` ở tầng dưới thực chất vẫn dựa vào `Iterator`. Tuy nhiên, thao tác `remove/add` lại gọi trực tiếp phương thức của chính Collection chứ không phải phương thức `remove/add` của `Iterator`.

Điều này dẫn đến việc `Iterator` bất ngờ phát hiện phần tử của mình bị `remove/add`, và nó sẽ ném ra `ConcurrentModificationException` để báo cho người dùng biết đã xảy ra sửa đổi đồng thời. Đây chính là **cơ chế Fail-Fast** phát sinh trong trạng thái đơn luồng.

> **Cơ chế Fail-Fast**: Khi nhiều Thread cùng sửa đổi một Collection thuộc kiểu fail-fast, ngoại lệ `ConcurrentModificationException` có thể bị ném ra. Ngay cả trong môi trường đơn luồng cũng có thể xảy ra tình huống này, như đã đề cập ở trên.
>
> Đọc thêm: [fail-fast là gì](https://www.cnblogs.com/54chensongxia/p/12470446.html).

Từ Java 8 trở đi, có thể dùng phương thức `Collection#removeIf()` để xóa các phần tử thỏa mãn điều kiện cụ thể, ví dụ:

```java
List<Integer> list = new ArrayList<>();
for (int i = 1; i <= 10; ++i) {
    list.add(i);
}
list.removeIf(filter -> filter % 2 == 0); /* Xóa tất cả các số chẵn trong list */
System.out.println(list); /* [1, 3, 5, 7, 9] */
```

Ngoài việc sử dụng trực tiếp `Iterator` để duyệt như đã giới thiệu ở trên, bạn còn có thể:

- Sử dụng vòng lặp `for` thông thường.
- Tùy theo kịch bản mà sử dụng các lớp Collection hỗ trợ duyệt theo snapshot hoặc duyệt nhất quán yếu (weakly consistent). Ví dụ, iterator của `CopyOnWriteArrayList` dựa trên snapshot, còn iterator của `ConcurrentHashMap` có tính nhất quán yếu (weakly consistent).
- ……

## Loại bỏ phần tử trùng lặp trong Collection

*Alibaba Java Coding Guidelines* mô tả như sau:

> **Có thể tận dụng đặc tính phần tử duy nhất của `Set` để nhanh chóng loại bỏ trùng lặp cho một Collection, tránh việc dùng `contains()` của `List` để duyệt loại bỏ trùng lặp hoặc kiểm tra phần tử tồn tại.**

Ở đây chúng ta lấy `HashSet` và `ArrayList` làm ví dụ minh họa.

```java
// Mã ví dụ loại bỏ trùng lặp bằng Set
public static <T> Set<T> removeDuplicateBySet(List<T> data) {

    if (CollectionUtils.isEmpty(data)) {
        return new HashSet<>();
    }
    return new HashSet<>(data);
}

// Mã ví dụ loại bỏ trùng lặp bằng List
public static <T> List<T> removeDuplicateByList(List<T> data) {

    if (CollectionUtils.isEmpty(data)) {
        return new ArrayList<>();

    }
    List<T> result = new ArrayList<>(data.size());
    for (T current : data) {
        if (!result.contains(current)) {
            result.add(current);
        }
    }
    return result;
}
```

Sự khác biệt cốt lõi giữa hai cách nằm ở phần cài đặt của phương thức `contains()`.

Phương thức `contains()` của `HashSet` ở tầng dưới dựa vào phương thức `containsKey()` của `HashMap`, có độ phức tạp thời gian tiệm cận `O(1)` (khi không xảy ra xung đột băm / Hash Collision là `O(1)`).

```java
private transient HashMap<E,Object> map;
public boolean contains(Object o) {
    return map.containsKey(o);
}
```

Nếu chúng ta chèn N phần tử vào `Set`, độ phức tạp thời gian sẽ tiệm cận `O(n)`.

Phương thức `contains()` của `ArrayList` được thực hiện bằng cách duyệt qua tất cả phần tử, nên độ phức tạp thời gian tiệm cận `O(n)`.

```java
public boolean contains(Object o) {
    return indexOf(o) >= 0;
}
public int indexOf(Object o) {
    if (o == null) {
        for (int i = 0; i < size; i++)
            if (elementData[i]==null)
                return i;
    } else {
        for (int i = 0; i < size; i++)
            if (o.equals(elementData[i]))
                return i;
    }
    return -1;
}
```

## Chuyển đổi Collection sang Array

*Alibaba Java Coding Guidelines* mô tả như sau:

> **Khi sử dụng phương thức chuyển Collection sang Array, bắt buộc phải dùng `toArray(T[] array)` của Collection, truyền vào một mảng rỗng có kiểu hoàn toàn trùng khớp và độ dài bằng 0.**

Tham số của phương thức `toArray(T[] array)` là một mảng kiểu generic; nếu không truyền tham số nào vào `toArray()` thì giá trị trả về là mảng kiểu `Object[]`.

```java
String [] s= new String[]{
    "dog", "lazy", "a", "over", "jumps", "fox", "brown", "quick", "A"
};
List<String> list = Arrays.asList(s);
Collections.reverse(list);
// Nếu không chỉ định kiểu dữ liệu sẽ gây lỗi
s=list.toArray(new String[0]);
```

Nhờ tối ưu hóa của JVM, việc dùng `new String[0]` làm tham số cho `Collection.toArray()` hiện nay là cách tốt hơn: `new String[0]` chỉ đóng vai trò như một khuôn mẫu (template) để chỉ định kiểu của mảng trả về, còn độ dài `0` giúp tiết kiệm không gian bộ nhớ vì nó chỉ dùng để báo hiệu kiểu trả về. Xem chi tiết tại: <https://shipilev.net/blog/2016/arrays-wisdom-ancients/>

## Chuyển đổi Array sang Collection

*Alibaba Java Coding Guidelines* mô tả như sau:

> **Khi sử dụng lớp tiện ích `Arrays.asList()` để chuyển mảng thành Collection, không được dùng các phương thức chỉnh sửa Collection của nó; các phương thức `add/remove/clear` sẽ ném ra ngoại lệ `UnsupportedOperationException`.**

Trước đây tôi từng gặp một cái bẫy tương tự trong một dự án.

`Arrays.asList()` khá phổ biến trong phát triển hằng ngày; chúng ta có thể dùng nó để chuyển một mảng thành một `List`.

```java
String[] myArray = {"Apple", "Banana", "Orange"};
List<String> myList = Arrays.asList(myArray);
// Hai câu lệnh trên tương đương với một câu lệnh bên dưới
List<String> myList = Arrays.asList("Apple","Banana", "Orange");
```

Mô tả trong mã nguồn JDK cho phương thức này:

```java
/**
  * Trả về một danh sách có kích thước cố định được chống lưng bởi mảng chỉ định. Phương thức này
  * đóng vai trò cầu nối giữa API dựa trên mảng và API dựa trên Collection, kết hợp sử dụng với
  * Collection.toArray(). List trả về có thể Serialize và triển khai interface RandomAccess.
  */
public static <T> List<T> asList(T... a) {
    return new ArrayList<>(a);
}
```

Dưới đây chúng ta hãy tổng kết các lưu ý khi sử dụng.

**1. `Arrays.asList()` sẽ không tự động boxing mảng kiểu nguyên thủy và trải ra thành các phần tử của danh sách.**

```java
int[] myArray = {1, 2, 3};
List myList = Arrays.asList(myArray);
System.out.println(myList.size());// 1
System.out.println(myList.get(0));// Giá trị địa chỉ của mảng
System.out.println(myList.get(1));// Lỗi: ArrayIndexOutOfBoundsException
int[] array = (int[]) myList.get(0);
System.out.println(array[0]);// 1
```

Khi truyền vào một mảng kiểu dữ liệu nguyên thủy (primitive), tham số thực sự mà `Arrays.asList()` nhận được không phải là các phần tử trong mảng, mà là chính đối tượng mảng đó! Lúc này phần tử duy nhất của `List` chính là mảng này, điều đó giải thích đoạn code phía trên.

Chúng ta có thể giải quyết vấn đề này bằng cách sử dụng mảng kiểu Wrapper (lớp bao):

```java
Integer[] myArray = {1, 2, 3};
```

**2. Gọi các phương thức sửa đổi Collection: `add()`, `remove()`, `clear()` sẽ ném ra ngoại lệ.**

```java
List myList = Arrays.asList(1, 2, 3);
myList.add(4);// Lỗi runtime: UnsupportedOperationException
myList.remove(1);// Lỗi runtime: UnsupportedOperationException
myList.clear();// Lỗi runtime: UnsupportedOperationException
```

Giá trị mà phương thức `Arrays.asList()` trả về không phải là `java.util.ArrayList`, mà là một lớp nội bộ (inner class) của `java.util.Arrays`; lớp nội bộ này không triển khai hay ghi đè (`Override`) các phương thức sửa đổi Collection.

```java
List myList = Arrays.asList(1, 2, 3);
System.out.println(myList.getClass());//class java.util.Arrays$ArrayList
```

Dưới đây là mã nguồn rút gọn của `java.util.Arrays$ArrayList`, ta có thể thấy lớp này đã ghi đè những phương thức nào:

```java
  private static class ArrayList<E> extends AbstractList<E>
        implements RandomAccess, java.io.Serializable
    {
        ...

        @Override
        public E get(int index) {
          ...
        }

        @Override
        public E set(int index, E element) {
          ...
        }

        @Override
        public int indexOf(Object o) {
          ...
        }

        @Override
        public boolean contains(Object o) {
           ...
        }

        @Override
        public void forEach(Consumer<? super E> action) {
          ...
        }

        @Override
        public void replaceAll(UnaryOperator<E> operator) {
          ...
        }

        @Override
        public void sort(Comparator<? super E> c) {
          ...
        }
    }
```

Chúng ta xem thêm các phương thức `add/remove/clear` của `java.util.AbstractList` là sẽ hiểu ngay tại sao ngoại lệ `UnsupportedOperationException` bị ném ra:

```java
public E remove(int index) {
    throw new UnsupportedOperationException();
}
public boolean add(E e) {
    add(size(), e);
    return true;
}
public void add(int index, E element) {
    throw new UnsupportedOperationException();
}

public void clear() {
    removeRange(0, size());
}
protected void removeRange(int fromIndex, int toIndex) {
    ListIterator<E> it = listIterator(fromIndex);
    for (int i=0, n=toIndex-fromIndex; i<n; i++) {
        it.next();
        it.remove();
    }
}
```

**Vậy làm thế nào để chuyển đổi mảng thành `ArrayList` một cách đúng đắn?**

1. Tự cài đặt phương thức tiện ích

```java
// JDK 1.5+
static <T> List<T> arrayToList(final T[] array) {
  final List<T> l = new ArrayList<T>(array.length);

  for (final T s : array) {
    l.add(s);
  }
  return l;
}


Integer [] myArray = { 1, 2, 3 };
System.out.println(arrayToList(myArray).getClass());//class java.util.ArrayList
```

2. Cách đơn giản nhất

```java
List list = new ArrayList<>(Arrays.asList("a", "b", "c"))
```

3. Sử dụng `Stream` của Java 8 (Khuyến nghị)

```java
Integer [] myArray = { 1, 2, 3 };
List myList = Arrays.stream(myArray).collect(Collectors.toList());
// Kiểu nguyên thủy cũng có thể chuyển đổi được (nhờ thao tác boxing của boxed())
int [] myArray2 = { 1, 2, 3 };
List myList = Arrays.stream(myArray2).boxed().collect(Collectors.toList());
```

4. Sử dụng Guava

Đối với Collection bất biến (immutable), bạn có thể dùng lớp [`ImmutableList`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/ImmutableList.java) cùng các phương thức factory [`of()`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/ImmutableList.java#L101) và [`copyOf()`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/ImmutableList.java#L225) (tham số không được phép `null`):

```java
List<String> il = ImmutableList.of("string", "elements");  // from varargs
List<String> il = ImmutableList.copyOf(aStringArray);      // from array
```

Đối với Collection có thể thay đổi (mutable), bạn có thể dùng lớp [`Lists`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/Lists.java) cùng phương thức factory [`newArrayList()`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/Lists.java#L87):

```java
List<String> l1 = Lists.newArrayList(anotherListOrCollection);    // from collection
List<String> l2 = Lists.newArrayList(aStringArray);               // from array
List<String> l3 = Lists.newArrayList("or", "string", "elements"); // from varargs
```

5. Sử dụng Apache Commons Collections

```java
List<String> list = new ArrayList<String>();
CollectionUtils.addAll(list, str);
```

6. Sử dụng phương thức `List.of()` của Java 9

```java
Integer[] array = {1, 2, 3};
List<Integer> list = List.of(array);
```
