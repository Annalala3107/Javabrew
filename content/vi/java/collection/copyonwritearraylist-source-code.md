---
title: Phân tích mã nguồn CopyOnWriteArrayList
description: "Phân tích chuyên sâu mã nguồn CopyOnWriteArrayList: giải thích chi tiết cơ chế Copy-On-Write (COW), kịch bản phù hợp đọc nhiều ghi ít, cài đặt List an toàn luồng, đảm bảo tính nhất quán ảnh chụp nhanh (snapshot consistency) và đánh đổi chi phí bộ nhớ."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/copyonwritearraylist-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn CopyOnWriteArrayList,sao chép khi ghi COW,List an toàn luồng,đọc nhiều ghi ít,concurrent container,nhất quán snapshot
---

## Giới thiệu về CopyOnWriteArrayList

Trước JDK 1.5, nếu muốn sử dụng một `List` an toàn trong môi trường đồng thời, ta có thể chọn `Vector` hoặc bộ bọc đồng bộ trả về từ `Collections.synchronizedList()`. Tuy nhiên `Vector` là một tập hợp cũ kỹ và đã bị đào thải. `Vector` gần như gắn `synchronized` lên toàn bộ các phương thức thêm, xóa, sửa, truy vấn; cách này tuy đảm bảo được đồng bộ hóa, nhưng tương đương với việc đặt một ổ khóa lớn lên toàn bộ `Vector`, khiến mỗi lần gọi bất kỳ phương thức nào đều phải tranh giành khóa, dẫn đến hiệu năng rất thấp.

JDK 1.5 đã giới thiệu gói `java.util.concurrent` (JUC), cung cấp nhiều container an toàn luồng (thread-safe) với hiệu năng đồng thời rất tốt, trong đó cài đặt `List` an toàn luồng duy nhất chính là `CopyOnWriteArrayList`. Về tổng hợp các container đồng thời phổ biến trong gói `java.util.concurrent`, bạn có thể đọc bài viết: [Tổng hợp các container đồng thời phổ biến trong Java](https://javaguide.cn/java/concurrent/java-concurrent-collections.html).

### CopyOnWriteArrayList thực sự lợi hại ở điểm nào?

Đối với phần lớn các kịch bản nghiệp vụ, thao tác đọc thường nhiều hơn rất nhiều so với thao tác ghi. Vì thao tác đọc không làm thay đổi dữ liệu gốc, việc khóa (`lock`) ở mỗi lần đọc thực chất là một sự lãng phí tài nguyên. Ngược lại, chúng ta nên cho phép nhiều Thread (luồng) cùng truy cập đồng thời vào dữ liệu bên trong `List`, vì đối với thao tác đọc thì điều này hoàn toàn an toàn.

Tư tưởng này rất giống với triết lý thiết kế khóa đọc-ghi của `ReentrantReadWriteLock`, tức là đọc-đọc không loại trừ lẫn nhau, đọc-ghi loại trừ lẫn nhau, ghi-ghi loại trừ lẫn nhau (chỉ có đọc-đọc không chặn nhau). `CopyOnWriteArrayList` còn tiến xa hơn một bước trong tư tưởng này. Để phát huy hiệu năng đọc lên mức tối đa, các thao tác đọc trong `CopyOnWriteArrayList` hoàn toàn không cần khóa. Điều lợi hại hơn nữa là thao tác ghi cũng không chặn thao tác đọc, chỉ có ghi-ghi mới loại trừ lẫn nhau. Nhờ đó, hiệu năng của thao tác đọc được nâng cao đáng kể.

Cốt lõi giúp `CopyOnWriteArrayList` đạt được an toàn luồng nằm ở việc nó áp dụng chiến lược **sao chép khi ghi (Copy-On-Write)** — điều mà ngay từ cái tên `CopyOnWriteArrayList` bạn đã có thể nhận ra.

### Tư tưởng của Copy-On-Write là gì?

"Copy-On-Write" trong tên `CopyOnWriteArrayList` nghĩa là sao chép khi ghi, viết tắt là COW.

Dưới đây là phần giới thiệu về Copy-On-Write trên Wikipedia, giải thích rất hay:

> Copy-on-write (viết tắt là COW, tạm dịch: sao chép khi ghi) là một chiến lược tối ưu hóa trong lĩnh vực lập trình máy tính. Tư tưởng cốt lõi của nó là: nếu có nhiều bên gọi (callers) cùng yêu cầu một tài nguyên giống nhau (chẳng hạn như dữ liệu lưu trên bộ nhớ hoặc ổ đĩa), họ sẽ cùng nhận được một con trỏ giống nhau trỏ tới cùng tài nguyên đó, cho đến khi có một caller cố gắng sửa đổi nội dung của tài nguyên, lúc này hệ thống mới thực sự sao chép ra một bản sao riêng (`private copy`) cho caller đó, còn tài nguyên ban đầu mà các caller khác nhìn thấy vẫn giữ nguyên không đổi. Quá trình này hoàn toàn trong suốt đối với các caller khác. Ưu điểm chính của cách làm này là nếu caller không sửa đổi tài nguyên thì sẽ không có bản sao riêng nào được tạo ra, do đó nhiều caller khi chỉ thực hiện thao tác đọc có thể dùng chung một tài nguyên.

Lấy `CopyOnWriteArrayList` làm ví dụ: khi cần sửa đổi nội dung của `CopyOnWriteArrayList` (các thao tác `add`, `set`, `remove`, v.v.), nó không sửa trực tiếp lên mảng gốc, mà trước tiên sẽ tạo một bản sao của mảng tầng dưới, thực hiện sửa đổi trên mảng bản sao đó, sau khi sửa xong mới gán mảng đã sửa trở lại. Nhờ vậy có thể đảm bảo thao tác ghi không làm ảnh hưởng đến thao tác đọc.

Có thể thấy, cơ chế sao chép khi ghi rất phù hợp với kịch bản đồng thời đọc nhiều ghi ít, giúp nâng cao đáng kể hiệu năng đồng thời của hệ thống.

Tuy nhiên, cơ chế Copy-On-Write không phải là viên đạn bạc mà vẫn tồn tại một số nhược điểm, dưới đây liệt kê vài điểm chính:

1. Chiếm dụng bộ nhớ: Mỗi thao tác ghi đều cần sao chép một bản dữ liệu gốc, chiếm thêm không gian bộ nhớ; trong trường hợp lượng dữ liệu lớn, có thể dẫn đến thiếu tài nguyên bộ nhớ.
2. Chi phí thao tác ghi: Mỗi lần ghi đều phải sao chép một bản dữ liệu gốc, rồi mới sửa đổi và thay thế tham chiếu, nên chi phí thao tác ghi tương đối lớn; trong các kịch bản ghi thường xuyên, hiệu năng có thể bị ảnh hưởng.
3. Tính nhất quán ảnh chụp nhanh (Snapshot Consistency): Iterator sẽ giữ lại một ảnh chụp nhanh (snapshot) của mảng tầng dưới tại thời điểm nó được tạo ra; các thay đổi về sau sẽ không được phản ánh vào Iterator đó.
4. ...

## Phân tích mã nguồn CopyOnWriteArrayList

Ở đây lấy JDK 1.8 làm ví dụ để phân tích mã nguồn cốt lõi tầng dưới của `CopyOnWriteArrayList`.

Định nghĩa lớp `CopyOnWriteArrayList` như sau:

```java
public class CopyOnWriteArrayList<E>
extends Object
implements List<E>, RandomAccess, Cloneable, Serializable
{
  //...
}
```

`CopyOnWriteArrayList` triển khai các interface sau:

- `List`: Cho thấy đây là một danh sách, hỗ trợ các thao tác thêm, xóa, tìm kiếm, v.v., đồng thời có thể truy cập theo chỉ số (`index`).
- `RandomAccess`: Đây là một marker interface, cho thấy tập hợp `List` triển khai interface này hỗ trợ **truy cập ngẫu nhiên nhanh**.
- `Cloneable`: Cho thấy nó hỗ trợ sao chép thông qua phương thức `clone()`; `CopyOnWriteArrayList#clone()` trả về sao chép nông (Shallow Copy).
- `Serializable`: Cho thấy nó có thể thực hiện tuần tự hóa (`Serialization`), tức là chuyển đối tượng thành luồng byte để lưu trữ bền vững hoặc truyền qua mạng, rất thuận tiện.

![Sơ đồ lớp CopyOnWriteArrayList](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/copyonwritearraylist-class-diagram-613f0797.png)

### Khởi tạo

`CopyOnWriteArrayList` có một hàm tạo không tham số và hai hàm tạo có tham số.

```java
// Tạo một CopyOnWriteArrayList rỗng
public CopyOnWriteArrayList() {
    setArray(new Object[0]);
}

// Tạo một CopyOnWriteArrayList chứa các phần tử của tập hợp được chỉ định, theo thứ tự trả về từ Iterator của tập hợp đó
public CopyOnWriteArrayList(Collection<? extends E> c) {
    Object[] elements;
    if (c.getClass() == CopyOnWriteArrayList.class)
        elements = ((CopyOnWriteArrayList<?>)c).getArray();
    else {
        elements = c.toArray();
        // c.toArray might (incorrectly) not return Object[] (see 6260652)
        if (elements.getClass() != Object[].class)
            elements = Arrays.copyOf(elements, elements.length, Object[].class);
    }
    setArray(elements);
}

// Tạo một danh sách chứa bản sao của mảng được chỉ định
public CopyOnWriteArrayList(E[] toCopyIn) {
    setArray(Arrays.copyOf(toCopyIn, toCopyIn.length, Object[].class));
}
```

### Chèn phần tử

Phương thức `add()` của `CopyOnWriteArrayList` có ba phiên bản:

- `add(E e)`: Chèn phần tử vào cuối `CopyOnWriteArrayList`.
- `add(int index, E element)`: Chèn phần tử vào vị trí được chỉ định trong `CopyOnWriteArrayList`.
- `addIfAbsent(E e)`: Nếu phần tử được chỉ định chưa tồn tại thì thêm phần tử đó vào. Trả về `true` nếu thêm thành công.

Ở đây lấy `add(E e)` làm ví dụ để giới thiệu:

```java
// Chèn phần tử vào cuối CopyOnWriteArrayList
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    // Khóa
    lock.lock();
    try {
        // Lấy mảng ban đầu
        Object[] elements = getArray();
        // Độ dài mảng ban đầu
        int len = elements.length;
        // Tạo mảng mới có độ dài + 1 và sao chép các phần tử của mảng cũ sang mảng mới
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        // Đặt phần tử vào cuối mảng mới
        newElements[len] = e;
        // Cho array trỏ tới mảng mới
        setArray(newElements);
        return true;
    } finally {
        // Mở khóa
        lock.unlock();
    }
}
```

Từ đoạn mã nguồn trên có thể thấy:

- Bên trong phương thức `add` sử dụng `ReentrantLock` để khóa, đảm bảo đồng bộ hóa và tránh việc nhiều Thread cùng thực hiện thao tác ghi một lúc. Trường `lock` được khai báo `final`, sau khi khởi tạo tham chiếu sẽ không thể trỏ sang đối tượng khác; đồng thời logic giải phóng khóa được đặt trong khối `finally` để đảm bảo khóa luôn được mở.
- `CopyOnWriteArrayList` thực hiện thao tác ghi bằng cách sao chép mảng tầng dưới: trước tiên tạo một mảng mới để chứa phần tử mới thêm vào, thực hiện ghi trên mảng mới, cuối cùng gán mảng mới cho tham chiếu mảng tầng dưới để thay thế mảng cũ. Điều này chứng minh điều chúng ta đã nói ở trên: cốt lõi an toàn luồng của `CopyOnWriteArrayList` là áp dụng chiến lược **sao chép khi ghi (Copy-On-Write)**.
- Mỗi lần ghi đều phải sao chép mảng tầng dưới thông qua `Arrays.copyOf`, có độ phức tạp thời gian là O(n) và tiêu tốn thêm không gian bộ nhớ. Do đó, `CopyOnWriteArrayList` phù hợp với kịch bản đọc nhiều ghi ít; trong điều kiện thao tác ghi không thường xuyên và tài nguyên bộ nhớ dồi dào, nó có thể cải thiện hiệu năng của hệ thống.
- Trong `CopyOnWriteArrayList` không có thao tác mở rộng dung lượng giống như phương thức `grow()` của `ArrayList`.

> Độ phức tạp thời gian của phương thức `Arrays.copyOf` là O(n), trong đó n biểu thị độ dài của mảng cần sao chép. Nguyên lý cài đặt của phương thức này là tạo một mảng mới, sau đó sao chép dữ liệu từ mảng nguồn sang mảng mới, rồi trả về mảng mới. Vì phương thức này sao chép toàn bộ mảng nên độ phức tạp thời gian tỉ lệ thuận với độ dài mảng, tức O(n). Đáng chú ý là do ở tầng dưới có gọi chỉ thị sao chép ở mức hệ thống nên trong thực tế hiệu năng của phương thức này khá tốt, tuy nhiên vẫn cần kiểm soát lượng dữ liệu được sao chép để tránh tình trạng chiếm dụng bộ nhớ quá cao.

### Đọc phần tử

Thao tác đọc của `CopyOnWriteArrayList` dựa trên việc mảng nội bộ `array` không hề bị sửa đổi trực tiếp, do đó khi đọc không cần kiểm soát đồng bộ hóa hay thao tác khóa mà vẫn đảm bảo tính an toàn của dữ liệu. Với cơ chế này, nhiều Thread có thể đọc đồng thời các phần tử trong danh sách.

```java
// Mảng tầng dưới, chỉ có thể truy cập thông qua phương thức getArray và setArray
private transient volatile Object[] array;

public E get(int index) {
    return get(getArray(), index);
}

final Object[] getArray() {
    return array;
}

private E get(Object[] a, int index) {
    return (E) a[index];
}
```

Tuy nhiên, phương thức `get` chỉ đảm bảo tính nhất quán yếu (weak consistency), trong một số trường hợp có thể đọc phải giá trị phần tử cũ.

Phương thức `get(int index)` được thực hiện qua hai bước:

1. Lấy tham chiếu đến mảng hiện tại thông qua `getArray()`;
2. Lấy trực tiếp phần tử tại chỉ số `index` từ mảng đó.

Quá trình này không khóa, nên trong môi trường đồng thời có thể xảy ra tình huống sau:

1. Thread 1 gọi phương thức `get(int index)` để lấy giá trị, bên trong lấy được thuộc tính `array` qua phương thức `getArray()`;
2. Thread 2 gọi các phương thức sửa đổi của `CopyOnWriteArrayList` như `add`, `set`, `remove`..., bên trong cập nhật giá trị thuộc tính `array` qua `setArray`;
3. Thread 1 vẫn lấy giá trị từ mảng `array` cũ.

### Lấy số lượng phần tử trong danh sách

```java
public int size() {
    return getArray().length;
}
```

Trong `CopyOnWriteArrayList`, mỗi lần sao chép mảng `array` đều vừa khít đủ để chứa toàn bộ các phần tử, không giống như `ArrayList` có chừa sẵn một khoảng không gian dư. Vì vậy, `CopyOnWriteArrayList` không có thuộc tính `size`; độ dài mảng tầng dưới của `CopyOnWriteArrayList` chính là số lượng phần tử, do đó phương thức `size()` chỉ cần trả về độ dài mảng là được.

### Xóa phần tử

Các phương thức liên quan đến xóa phần tử của `CopyOnWriteArrayList` có tổng cộng 4 phương thức:

1. `remove(int index)`: Xóa phần tử tại vị trí được chỉ định trong danh sách này. Dịch chuyển các phần tử phía sau sang trái (trừ chỉ số của chúng đi 1).
2. `boolean remove(Object o)`: Xóa phần tử được chỉ định xuất hiện đầu tiên trong danh sách này; nếu phần tử đó không tồn tại thì trả về `false`.
3. `boolean removeAll(Collection<?> c)`: Xóa khỏi danh sách này tất cả các phần tử có mặt trong tập hợp được chỉ định.
4. `void clear()`: Xóa toàn bộ các phần tử trong danh sách này.

Ở đây lấy `remove(int index)` làm ví dụ để giới thiệu:

```java
public E remove(int index) {
    // Lấy Reentrant Lock
    final ReentrantLock lock = this.lock;
    // Khóa
    lock.lock();
    try {
        // Lấy mảng array hiện tại
        Object[] elements = getArray();
        // Lấy độ dài mảng array hiện tại
        int len = elements.length;
        // Lấy phần tử tại chỉ số chỉ định (giá trị cũ)
        E oldValue = get(elements, index);
        int numMoved = len - index - 1;
        // Kiểm tra xem phần tử cần xóa có phải là phần tử cuối cùng không
        if (numMoved == 0)
            // Nếu xóa phần tử cuối, sao chép trực tiếp toàn bộ phần tử trước nó sang mảng mới
            setArray(Arrays.copyOf(elements, len - 1));
        else {
            // Sao chép theo đoạn: chép các phần tử trước index và từ index + 1 trở đi sang mảng mới
            // Độ dài mảng mới bằng độ dài mảng cũ - 1
            Object[] newElements = new Object[len - 1];
            System.arraycopy(elements, 0, newElements, 0, index);
            System.arraycopy(elements, index + 1, newElements, index,
                             numMoved);
            // Gán mảng mới cho tham chiếu array
            setArray(newElements);
        }
        return oldValue;
    } finally {
        // Mở khóa
        lock.unlock();
    }
}
```

### Kiểm tra phần tử có tồn tại hay không

`CopyOnWriteArrayList` cung cấp hai phương thức dùng để kiểm tra xem phần tử chỉ định có nằm trong danh sách hay không:

- `contains(Object o)`: Kiểm tra xem có chứa phần tử được chỉ định hay không.
- `containsAll(Collection<?> c)`: Kiểm tra xem có chứa toàn bộ các phần tử của tập hợp được chỉ định hay không.

```java
// Kiểm tra có chứa phần tử được chỉ định hay không
public boolean contains(Object o) {
    // Lấy mảng array hiện tại
    Object[] elements = getArray();
    // Gọi indexOf để tìm phần tử chỉ định; nếu kết quả >= 0 thì trả về true, ngược lại trả về false
    return indexOf(o, elements, 0, elements.length) >= 0;
}

// Kiểm tra có chứa toàn bộ phần tử của tập hợp được chỉ định hay không
public boolean containsAll(Collection<?> c) {
    // Lấy mảng array hiện tại
    Object[] elements = getArray();
    // Lấy độ dài mảng
    int len = elements.length;
    // Duyệt tập hợp được chỉ định
    for (Object e : c) {
        // Lặp lại lời gọi phương thức indexOf để kiểm tra; chỉ cần thiếu một phần tử là trả về false ngay
        if (indexOf(e, elements, 0, len) < 0)
            return false;
    }
    // Cuối cùng nghĩa là chứa toàn bộ hoặc tập hợp chỉ định là rỗng, khi đó trả về true
    return true;
}
```

## Kiểm thử các phương thức thường dùng của CopyOnWriteArrayList

Mã nguồn:

```java
// Tạo một đối tượng CopyOnWriteArrayList
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

// Thêm phần tử vào danh sách
list.add("Java");
list.add("Python");
list.add("C++");
System.out.println("Danh sách ban đầu: " + list);

// Dùng phương thức get để lấy phần tử tại vị trí chỉ định
System.out.println("Phần tử thứ hai trong danh sách: " + list.get(1));

// Dùng phương thức remove để xóa phần tử chỉ định
boolean result = list.remove("C++");
System.out.println("Kết quả xóa: " + result);
System.out.println("Danh sách sau khi xóa phần tử: " + list);

// Dùng phương thức set để cập nhật phần tử tại vị trí chỉ định
list.set(1, "Golang");
System.out.println("Danh sách sau khi cập nhật: " + list);

// Dùng phương thức add để chèn phần tử tại vị trí chỉ định
list.add(0, "PHP");
System.out.println("Danh sách sau khi chèn phần tử: " + list);

// Dùng phương thức size để lấy kích thước danh sách
System.out.println("Kích thước danh sách: " + list.size());

// Dùng phương thức removeAll để xóa toàn bộ các phần tử xuất hiện trong tập hợp chỉ định
result = list.removeAll(List.of("Java", "Golang"));
System.out.println("Kết quả xóa hàng loạt: " + result);
System.out.println("Danh sách sau khi xóa hàng loạt: " + list);

// Dùng phương thức clear để xóa sạch mọi phần tử trong danh sách
list.clear();
System.out.println("Danh sách sau khi xóa sạch: " + list);
```

Kết quả đầu ra:

```plain
Danh sách sau khi cập nhật: [Java, Golang]
Danh sách sau khi chèn phần tử: [PHP, Java, Golang]
Kích thước danh sách: 3
Kết quả xóa hàng loạt: true
Danh sách sau khi xóa hàng loạt: [PHP]
Danh sách sau khi xóa sạch: []
```
