---
title: Phân tích mã nguồn ArrayList
description: "Phân tích chuyên sâu mã nguồn ArrayList: giải thích chi tiết cấu trúc mảng tầng dưới của ArrayList, cơ chế mở rộng dung lượng 1.5 lần, truy cập ngẫu nhiên nhanh RandomAccess, cài đặt tuần tự hóa (Serialization) và so sánh hiệu năng với Vector."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/arraylist-source-code.md
head:
  - - meta
    - name: keywords
      content: mã nguồn ArrayList,cơ chế mở rộng dung lượng ArrayList,mảng động,RandomAccess,tuần tự hóa ArrayList,phân biệt ArrayList và Vector
---

## Giới thiệu về ArrayList

Tầng dưới của `ArrayList` là một danh sách lưu trữ bằng mảng, tương đương với mảng động. So với mảng thông thường trong Java, dung lượng của nó có thể tăng trưởng động. Trước khi thêm một lượng lớn phần tử, ứng dụng có thể sử dụng thao tác `ensureCapacity` để tăng dung lượng của thể hiện `ArrayList`. Điều này giúp giảm số lần cấp phát lại tăng dần.

`ArrayList` kế thừa từ `AbstractList` và triển khai các giao diện `List`, `RandomAccess`, `Cloneable`, `java.io.Serializable`.

```java

public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable{

  }
```

- `List`: Cho biết nó là một danh sách, hỗ trợ các thao tác thêm, xóa, tìm kiếm, v.v., và có thể truy cập thông qua chỉ số (index).
- `RandomAccess`: Đây là một giao diện đánh dấu (marker interface), cho biết tập hợp `List` triển khai giao diện này hỗ trợ **truy cập ngẫu nhiên nhanh**. Trong `ArrayList`, chúng ta có thể lấy nhanh đối tượng phần tử thông qua chỉ số thứ tự của phần tử — đó chính là truy cập ngẫu nhiên nhanh.
- `Cloneable`: Cho biết nó hỗ trợ sao chép thông qua phương thức `clone()`; `ArrayList#clone()` trả về một bản sao chép nông (Shallow Copy).
- `Serializable`: Cho biết nó có thể thực hiện thao tác tuần tự hóa (`Serialization`), tức là có thể chuyển đổi đối tượng thành luồng byte để lưu trữ bền vững hoặc truyền qua mạng, rất tiện lợi.

![Sơ đồ lớp ArrayList](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/arraylist-class-diagram-1c1e5618.png)

### Sự khác biệt giữa ArrayList và Vector là gì? (Nắm sơ lược)

- `ArrayList` là lớp triển khai chính của `List`, tầng dưới sử dụng `Object[]` để lưu trữ, phù hợp với các thao tác tìm kiếm thường xuyên và không an toàn luồng (not thread-safe).
- `Vector` là lớp triển khai cũ của `List`, tầng dưới sử dụng `Object[]` để lưu trữ và có tính an toàn luồng (thread-safe).

### ArrayList có thể thêm giá trị null không?

`ArrayList` có thể lưu trữ bất kỳ kiểu đối tượng nào, bao gồm cả giá trị `null`. Tuy nhiên, không khuyến khích thêm giá trị `null` vào `ArrayList`, vì giá trị `null` không mang lại ý nghĩa và sẽ khiến mã nguồn khó bảo trì — chẳng hạn nếu quên kiểm tra null sẽ dẫn đến ngoại lệ con trỏ null (`NullPointerException`).

Mã ví dụ:

```java
ArrayList<String> listOfStrings = new ArrayList<>();
listOfStrings.add(null);
listOfStrings.add("java");
System.out.println(listOfStrings);
```

Kết quả đầu ra:

```plain
[null, java]
```

### Sự khác biệt giữa ArrayList và LinkedList là gì?

- **Có đảm bảo an toàn luồng hay không:** Cả `ArrayList` và `LinkedList` đều không được đồng bộ hóa (unsynchronized), tức là không đảm bảo an toàn luồng (thread-safe).
- **Cấu trúc dữ liệu tầng dưới:** Tầng dưới của `ArrayList` sử dụng **mảng `Object`**; tầng dưới của `LinkedList` sử dụng cấu trúc dữ liệu **danh sách liên kết đôi (Doubly Linked List)** (trước JDK 1.6 là danh sách liên kết vòng, đến JDK 1.7 đã bỏ tính chất vòng. Lưu ý sự khác biệt giữa danh sách liên kết đôi và danh sách liên kết vòng đôi, phần dưới có giới thiệu!).
- **Việc chèn và xóa có bị ảnh hưởng bởi vị trí phần tử hay không:**
  - `ArrayList` sử dụng mảng để lưu trữ, nên độ phức tạp thời gian của thao tác chèn và xóa phần tử bị ảnh hưởng bởi vị trí của phần tử. Ví dụ: khi thực thi phương thức `add(E e)`, `ArrayList` mặc định sẽ nối thêm phần tử được chỉ định vào cuối danh sách này, trong trường hợp đó độ phức tạp thời gian là O(1). Tuy nhiên, nếu muốn chèn hoặc xóa phần tử tại vị trí chỉ định `i` (`add(int index, E element)`), độ phức tạp thời gian sẽ là O(n). Bởi vì khi thực hiện thao tác trên, phần tử thứ `i` và `(n-i)` phần tử sau phần tử thứ `i` trong tập hợp đều phải dịch chuyển lùi/tiến một vị trí.
  - `LinkedList` sử dụng danh sách liên kết để lưu trữ, nên việc chèn hoặc xóa phần tử ở đầu và cuối (`add(E e)`, `addFirst(E e)`, `addLast(E e)`, `removeFirst()`, `removeLast()`) không bị ảnh hưởng bởi vị trí phần tử, độ phức tạp thời gian là O(1). Còn nếu muốn chèn hoặc xóa phần tử tại vị trí chỉ định `i` (`add(int index, E element)`, `remove(Object o)`, `remove(int index)`), độ phức tạp thời gian là O(n), vì cần di chuyển tới vị trí chỉ định trước rồi mới chèn và xóa.
- **Có hỗ trợ truy cập ngẫu nhiên nhanh hay không:** `LinkedList` không hỗ trợ truy cập phần tử ngẫu nhiên hiệu quả, trong khi `ArrayList` (triển khai giao diện `RandomAccess`) thì có. Truy cập ngẫu nhiên nhanh nghĩa là lấy nhanh đối tượng phần tử thông qua chỉ số thứ tự của nó (tương ứng với phương thức `get(int index)`).
- **Mức chiếm dụng không gian bộ nhớ:** Sự lãng phí không gian của `ArrayList` chủ yếu thể hiện ở việc chừa sẵn một khoảng dung lượng dự phòng ở cuối danh sách `list`, còn chi phí không gian của `LinkedList` thể hiện ở việc mỗi phần tử của nó đều tiêu tốn nhiều bộ nhớ hơn so với `ArrayList` (vì phải lưu trữ phần tử kế tiếp trực tiếp, phần tử đứng trước trực tiếp cùng với dữ liệu).

## Giải thích mã nguồn cốt lõi của ArrayList

Dưới đây lấy JDK 1.8 làm ví dụ để phân tích mã nguồn tầng dưới của `ArrayList`.

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    private static final long serialVersionUID = 8683452581122892189L;

    /**
     * Kích thước dung lượng khởi tạo mặc định
     */
    private static final int DEFAULT_CAPACITY = 10;

    /**
     * Mảng rỗng (dùng cho các thể hiện rỗng).
     */
    private static final Object[] EMPTY_ELEMENTDATA = {};

    // Thể hiện mảng rỗng dùng chung cho các thể hiện rỗng kích thước mặc định.
    // Chúng ta tách biệt nó khỏi mảng EMPTY_ELEMENTDATA để biết cần tăng dung lượng thêm bao nhiêu khi thêm phần tử đầu tiên.
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    /**
     * Mảng lưu trữ dữ liệu của ArrayList
     */
    transient Object[] elementData; // non-private to simplify nested class access

    /**
     * Số lượng phần tử mà ArrayList chứa
     */
    private int size;

    /**
     * Constructor có tham số dung lượng ban đầu (người dùng có thể tự chỉ định kích thước ban đầu của collection khi tạo đối tượng ArrayList)
     */
    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            // Nếu tham số truyền vào lớn hơn 0, tạo mảng có kích thước initialCapacity
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            // Nếu tham số truyền vào bằng 0, tạo mảng rỗng
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            // Các trường hợp khác, ném ra ngoại lệ
            throw new IllegalArgumentException("Illegal Capacity: " +
                    initialCapacity);
        }
    }

    /**
     * Constructor không tham số mặc định
     * DEFAULTCAPACITY_EMPTY_ELEMENTDATA có kích thước 0. Dung lượng khởi tạo mặc định là 10, tức là ban đầu thực chất là mảng rỗng và chỉ khi thêm phần tử đầu tiên thì dung lượng mảng mới thành 10
     */
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

    /**
     * Khởi tạo một danh sách chứa các phần tử của collection được chỉ định, theo thứ tự được trả về bởi iterator của collection đó.
     */
    public ArrayList(Collection<? extends E> c) {
        // Chuyển đổi collection được chỉ định thành mảng
        elementData = c.toArray();
        // Nếu độ dài mảng elementData khác 0
        if ((size = elementData.length) != 0) {
            // Nếu elementData không phải kiểu dữ liệu Object[] (c.toArray có thể không trả về mảng kiểu Object[] nên thêm câu lệnh bên dưới để kiểm tra)
            if (elementData.getClass() != Object[].class)
                // Sao chép nội dung của mảng elementData vốn không phải kiểu Object[] sang mảng elementData kiểu Object[] mới
                elementData = Arrays.copyOf(elementData, size, Object[].class);
        } else {
            // Các trường hợp khác, thay thế bằng mảng rỗng
            this.elementData = EMPTY_ELEMENTDATA;
        }
    }

    /**
     * Điều chỉnh dung lượng của thể hiện ArrayList này bằng với kích thước hiện tại của danh sách. Ứng dụng có thể sử dụng thao tác này để tối thiểu hóa bộ nhớ lưu trữ của thể hiện ArrayList.
     */
    public void trimToSize() {
        modCount++;
        if (size < elementData.length) {
            elementData = (size == 0)
                    ? EMPTY_ELEMENTDATA
                    : Arrays.copyOf(elementData, size);
        }
    }
// Dưới đây là cơ chế mở rộng dung lượng (resize) của ArrayList
// Cơ chế mở rộng dung lượng của ArrayList giúp cải thiện hiệu năng; nếu mỗi lần chỉ mở rộng thêm 1 phần tử,
// việc chèn thường xuyên sẽ dẫn đến sao chép liên tục và làm giảm hiệu năng, còn cơ chế mở rộng dung lượng của ArrayList đã tránh được tình trạng này.

    /**
     * Nếu cần thiết, tăng dung lượng của thể hiện ArrayList này để đảm bảo nó có thể chứa ít nhất số lượng phần tử mong muốn
     *
     * @param minCapacity dung lượng tối thiểu cần thiết
     */
    public void ensureCapacity(int minCapacity) {
        // Nếu không phải mảng rỗng mặc định, giá trị của minExpand là 0;
        // nếu là mảng rỗng mặc định, giá trị của minExpand là 10
        int minExpand = (elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA)
                // Nếu không phải bảng phần tử mặc định, có thể sử dụng bất kỳ kích thước nào
                ? 0
                // Nếu là mảng rỗng mặc định, nó vốn dĩ đã phải ở kích thước mặc định
                : DEFAULT_CAPACITY;

        // Nếu dung lượng tối thiểu lớn hơn ngưỡng mở rộng hiện có
        if (minCapacity > minExpand) {
            // Dựa theo dung lượng tối thiểu cần thiết để đảm bảo dung lượng đủ dùng
            ensureExplicitCapacity(minCapacity);
        }
    }


    // Tính toán dung lượng cần thiết dựa trên dung lượng tối thiểu đã cho và mảng phần tử hiện tại.
    private static int calculateCapacity(Object[] elementData, int minCapacity) {
        // Nếu mảng phần tử hiện tại là mảng rỗng mặc định (trạng thái ban đầu), trả về giá trị lớn hơn giữa dung lượng mặc định và dung lượng tối thiểu làm dung lượng cần thiết
        if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        // Ngược lại, trả về trực tiếp dung lượng tối thiểu
        return minCapacity;
    }

    // Đảm bảo dung lượng nội bộ đạt tới dung lượng tối thiểu được chỉ định.
    private void ensureCapacityInternal(int minCapacity) {
        ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
    }

    // Kiểm tra xem có cần mở rộng dung lượng hay không
    private void ensureExplicitCapacity(int minCapacity) {
        modCount++;
        // overflow-conscious code
        if (minCapacity - elementData.length > 0)
            // Gọi phương thức grow để mở rộng dung lượng; gọi phương thức này đồng nghĩa quá trình mở rộng đã bắt đầu
            grow(minCapacity);
    }

    /**
     * Kích thước mảng tối đa có thể cấp phát
     */
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    /**
     * Phương thức cốt lõi để mở rộng dung lượng ArrayList.
     */
    private void grow(int minCapacity) {
        // oldCapacity là dung lượng cũ, newCapacity là dung lượng mới
        int oldCapacity = elementData.length;
        // Dịch phải oldCapacity đi 1 bit, hiệu quả tương đương oldCapacity / 2.
        // Chúng ta biết tốc độ của phép toán bit nhanh hơn nhiều so với phép chia nguyên; kết quả cả biểu thức là cập nhật dung lượng mới bằng 1.5 lần dung lượng cũ.
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        // Sau đó kiểm tra xem dung lượng mới có lớn hơn dung lượng tối thiểu cần thiết không; nếu vẫn nhỏ hơn thì lấy dung lượng tối thiểu làm dung lượng mới của mảng.
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        // Tiếp theo kiểm tra xem dung lượng mới có vượt quá dung lượng tối đa do ArrayList định nghĩa không;
        // nếu vượt quá, gọi hugeCapacity() để so sánh minCapacity và MAX_ARRAY_SIZE;
        // nếu minCapacity lớn hơn MAX_ARRAY_SIZE thì dung lượng mới là Integer.MAX_VALUE, ngược lại dung lượng mới là MAX_ARRAY_SIZE.
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

    // So sánh minCapacity và MAX_ARRAY_SIZE
    private static int hugeCapacity(int minCapacity) {
        if (minCapacity < 0) // overflow
            throw new OutOfMemoryError();
        return (minCapacity > MAX_ARRAY_SIZE) ?
                Integer.MAX_VALUE :
                MAX_ARRAY_SIZE;
    }

    /**
     * Trả về số lượng phần tử trong danh sách này.
     */
    public int size() {
        return size;
    }

    /**
     * Trả về true nếu danh sách này không chứa phần tử nào.
     */
    public boolean isEmpty() {
        // Lưu ý sự khác biệt giữa = và ==
        return size == 0;
    }

    /**
     * Trả về true nếu danh sách này chứa phần tử được chỉ định.
     */
    public boolean contains(Object o) {
        // Phương thức indexOf(): trả về chỉ số xuất hiện đầu tiên của phần tử được chỉ định trong danh sách này, hoặc -1 nếu danh sách không chứa phần tử đó
        return indexOf(o) >= 0;
    }

    /**
     * Trả về chỉ số xuất hiện đầu tiên của phần tử được chỉ định trong danh sách này, hoặc -1 nếu danh sách không chứa phần tử đó
     */
    public int indexOf(Object o) {
        if (o == null) {
            for (int i = 0; i < size; i++)
                if (elementData[i] == null)
                    return i;
        } else {
            for (int i = 0; i < size; i++)
                // So sánh bằng phương thức equals()
                if (o.equals(elementData[i]))
                    return i;
        }
        return -1;
    }

    /**
     * Trả về chỉ số xuất hiện cuối cùng của phần tử được chỉ định trong danh sách này, hoặc -1 nếu danh sách không chứa phần tử đó.
     */
    public int lastIndexOf(Object o) {
        if (o == null) {
            for (int i = size - 1; i >= 0; i--)
                if (elementData[i] == null)
                    return i;
        } else {
            for (int i = size - 1; i >= 0; i--)
                if (o.equals(elementData[i]))
                    return i;
        }
        return -1;
    }

    /**
     * Trả về một bản sao chép nông (Shallow Copy) của thể hiện ArrayList này. (Bản thân các phần tử không bị sao chép.)
     */
    public Object clone() {
        try {
            ArrayList<?> v = (ArrayList<?>) super.clone();
            // Chức năng của Arrays.copyOf là sao chép mảng và trả về mảng sau khi sao chép. Tham số gồm mảng cần sao chép và độ dài sao chép
            v.elementData = Arrays.copyOf(elementData, size);
            v.modCount = 0;
            return v;
        } catch (CloneNotSupportedException e) {
            // Điều này không thể xảy ra, vì lớp này hỗ trợ clone
            throw new InternalError(e);
        }
    }

    /**
     * Trả về một mảng chứa tất cả các phần tử trong danh sách này theo đúng thứ tự (từ phần tử đầu đến phần tử cuối).
     * Mảng trả về sẽ "an toàn" vì danh sách này không giữ tham chiếu nào tới nó.
     * (Nói cách khác, phương thức này phải cấp phát một mảng mới).
     * Do đó, bên gọi có thể tự do chỉnh sửa cấu trúc mảng trả về.
     * Lưu ý: nếu phần tử là kiểu tham chiếu, việc thay đổi nội dung phần tử sẽ ảnh hưởng đến đối tượng trong danh sách gốc.
     * Phương thức này đóng vai trò cầu nối giữa các API dựa trên mảng và API dựa trên collection.
     */
    public Object[] toArray() {
        return Arrays.copyOf(elementData, size);
    }

    /**
     * Trả về một mảng chứa tất cả các phần tử trong danh sách này theo đúng thứ tự (từ phần tử đầu đến phần tử cuối);
     * kiểu runtime của mảng trả về chính là kiểu runtime của mảng được chỉ định. Nếu danh sách vừa với mảng được chỉ định, nó sẽ được trả về trong chính mảng đó.
     * Ngược lại, một mảng mới sẽ được cấp phát với kiểu runtime của mảng chỉ định và kích thước của danh sách này.
     * Nếu danh sách vừa với mảng chỉ định và phần không gian còn lại dư ra (tức là số phần tử của mảng nhiều hơn danh sách), phần tử trong mảng nằm ngay sau điểm kết thúc của collection sẽ được gán thành null.
     * (Điều này chỉ giúp xác định độ dài của danh sách nếu bên gọi biết chắc danh sách không chứa bất kỳ phần tử null nào.)
     */
    @SuppressWarnings("unchecked")
    public <T> T[] toArray(T[] a) {
        if (a.length < size)
            // Tạo mới một mảng có kiểu runtime của a, nhưng chứa nội dung của mảng ArrayList
            return (T[]) Arrays.copyOf(elementData, size, a.getClass());
        // Gọi phương thức arraycopy() do System cung cấp để sao chép giữa các mảng
        System.arraycopy(elementData, 0, a, 0, size);
        if (a.length > size)
            a[size] = null;
        return a;
    }

    // Positional Access Operations

    @SuppressWarnings("unchecked")
    E elementData(int index) {
        return (E) elementData[index];
    }

    /**
     * Trả về phần tử tại vị trí được chỉ định trong danh sách này.
     */
    public E get(int index) {
        rangeCheck(index);

        return elementData(index);
    }

    /**
     * Thay thế phần tử tại vị trí được chỉ định trong danh sách này bằng phần tử được chỉ định.
     */
    public E set(int index, E element) {
        // Kiểm tra giới hạn đối với index
        rangeCheck(index);

        E oldValue = elementData(index);
        elementData[index] = element;
        // Trả về phần tử cũ trước đó ở vị trí này
        return oldValue;
    }

    /**
     * Nối thêm phần tử được chỉ định vào cuối danh sách này.
     */
    public boolean add(E e) {
        ensureCapacityInternal(size + 1);  // Increments modCount!!
        // Ở đây ta thấy bản chất của việc thêm phần tử vào ArrayList tương đương với việc gán giá trị vào mảng
        elementData[size++] = e;
        return true;
    }

    /**
     * Chèn phần tử được chỉ định vào vị trí chỉ định trong danh sách này.
     * Trước tiên gọi rangeCheckForAdd để kiểm tra giới hạn index; sau đó gọi ensureCapacityInternal để đảm bảo capacity đủ lớn;
     * tiếp theo dịch chuyển toàn bộ thành phần từ index trở đi sang phải một vị trí; chèn element vào vị trí index; cuối cùng tăng size lên 1.
     */
    public void add(int index, E element) {
        rangeCheckForAdd(index);

        ensureCapacityInternal(size + 1);  // Increments modCount!!
        // Nhất định phải xem kỹ phương thức arraycopy() sao chép giữa các mảng này; bên dưới dùng arraycopy() để mảng tự sao chép lên chính nó
        System.arraycopy(elementData, index, elementData, index + 1,
                size - index);
        elementData[index] = element;
        size++;
    }

    /**
     * Xóa phần tử tại vị trí chỉ định trong danh sách này. Dịch chuyển bất kỳ phần tử phía sau nào sang trái (giảm chỉ số của chúng đi 1).
     */
    public E remove(int index) {
        rangeCheck(index);

        modCount++;
        E oldValue = elementData(index);

        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index + 1, elementData, index,
                    numMoved);
        elementData[--size] = null; // clear to let GC do its work
        // Phần tử bị xóa khỏi danh sách
        return oldValue;
    }

    /**
     * Xóa lần xuất hiện đầu tiên của phần tử được chỉ định khỏi danh sách này (nếu tồn tại). Nếu danh sách không chứa phần tử đó, danh sách không thay đổi.
     * Trả về true nếu danh sách này chứa phần tử được chỉ định
     */
    public boolean remove(Object o) {
        if (o == null) {
            for (int index = 0; index < size; index++)
                if (elementData[index] == null) {
                    fastRemove(index);
                    return true;
                }
        } else {
            for (int index = 0; index < size; index++)
                if (o.equals(elementData[index])) {
                    fastRemove(index);
                    return true;
                }
        }
        return false;
    }

    /*
     * Phương thức xóa private này bỏ qua kiểm tra giới hạn và không trả về giá trị bị xóa.
     */
    private void fastRemove(int index) {
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index + 1, elementData, index,
                    numMoved);
        elementData[--size] = null; // Sau khi xóa phần tử, đặt phần tử tại vị trí đó thành null để Garbage Collector (GC) có thể thu hồi phần tử đó.
    }

    /**
     * Xóa toàn bộ phần tử khỏi danh sách.
     */
    public void clear() {
        modCount++;

        // Đặt giá trị tất cả phần tử trong mảng thành null
        for (int i = 0; i < size; i++)
            elementData[i] = null;

        size = 0;
    }

    /**
     * Nối thêm tất cả phần tử trong collection được chỉ định vào cuối danh sách này theo thứ tự được trả về bởi Iterator của collection đó.
     */
    public boolean addAll(Collection<? extends E> c) {
        Object[] a = c.toArray();
        int numNew = a.length;
        ensureCapacityInternal(size + numNew);  // Increments modCount
        System.arraycopy(a, 0, elementData, size, numNew);
        size += numNew;
        return numNew != 0;
    }

    /**
     * Chèn tất cả phần tử trong collection được chỉ định vào danh sách này, bắt đầu từ vị trí chỉ định.
     */
    public boolean addAll(int index, Collection<? extends E> c) {
        rangeCheckForAdd(index);

        Object[] a = c.toArray();
        int numNew = a.length;
        ensureCapacityInternal(size + numNew);  // Increments modCount

        int numMoved = size - index;
        if (numMoved > 0)
            System.arraycopy(elementData, index, elementData, index + numNew,
                    numMoved);

        System.arraycopy(a, 0, elementData, index, numNew);
        size += numNew;
        return numNew != 0;
    }

    /**
     * Xóa khỏi danh sách này tất cả phần tử có chỉ số nằm giữa fromIndex (bao gồm) và toIndex (không bao gồm).
     * Dịch chuyển các phần tử phía sau sang trái (giảm chỉ số của chúng).
     */
    protected void removeRange(int fromIndex, int toIndex) {
        modCount++;
        int numMoved = size - toIndex;
        System.arraycopy(elementData, toIndex, elementData, fromIndex,
                numMoved);

        // clear to let GC do its work
        int newSize = size - (toIndex - fromIndex);
        for (int i = newSize; i < size; i++) {
            elementData[i] = null;
        }
        size = newSize;
    }

    /**
     * Kiểm tra xem chỉ số đã cho có nằm trong phạm vi hợp lệ hay không.
     */
    private void rangeCheck(int index) {
        if (index >= size)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    /**
     * Một phiên bản của rangeCheck được sử dụng bởi add và addAll
     */
    private void rangeCheckForAdd(int index) {
        if (index > size || index < 0)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    /**
     * Trả về thông tin chi tiết của IndexOutOfBoundsException
     */
    private String outOfBoundsMsg(int index) {
        return "Index: " + index + ", Size: " + size;
    }

    /**
     * Xóa khỏi danh sách này tất cả các phần tử có chứa trong collection được chỉ định.
     */
    public boolean removeAll(Collection<?> c) {
        Objects.requireNonNull(c);
        // Nếu danh sách này bị sửa đổi thì trả về true
        return batchRemove(c, false);
    }

    /**
     * Chỉ giữ lại các phần tử trong danh sách này mà có chứa trong collection được chỉ định.
     * Nói cách khác, xóa khỏi danh sách này toàn bộ các phần tử không nằm trong collection được chỉ định.
     */
    public boolean retainAll(Collection<?> c) {
        Objects.requireNonNull(c);
        return batchRemove(c, true);
    }


    /**
     * Bắt đầu từ vị trí chỉ định trong danh sách, trả về list iterator duyệt các phần tử trong danh sách (theo đúng thứ tự).
     * Chỉ số chỉ định biểu thị phần tử đầu tiên mà lời gọi next ban đầu sẽ trả về. Lời gọi previous ban đầu sẽ trả về phần tử tại chỉ số chỉ định trừ 1.
     * List iterator trả về có tính chất fail-fast.
     */
    public ListIterator<E> listIterator(int index) {
        if (index < 0 || index > size)
            throw new IndexOutOfBoundsException("Index: " + index);
        return new ListItr(index);
    }

    /**
     * Trả về list iterator trong danh sách (theo thứ tự thích hợp).
     * List iterator trả về có tính chất fail-fast.
     */
    public ListIterator<E> listIterator() {
        return new ListItr(0);
    }

    /**
     * Trả về iterator duyệt các phần tử trong danh sách này theo đúng thứ tự.
     * Iterator trả về có tính chất fail-fast.
     */
    public Iterator<E> iterator() {
        return new Itr();
    }
```

## Phân tích cơ chế mở rộng dung lượng của ArrayList

### Bắt đầu từ các Constructor của ArrayList

`ArrayList` có ba cách khởi tạo, mã nguồn của các phương thức khởi tạo như sau (JDK 8):

```java
/**
 * Kích thước dung lượng khởi tạo mặc định
 */
private static final int DEFAULT_CAPACITY = 10;

private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

/**
 * Constructor mặc định, khởi tạo danh sách rỗng với dung lượng ban đầu 10 (constructor không tham số)
 */
public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}

/**
 * Constructor có tham số dung lượng ban đầu. (người dùng tự chỉ định dung lượng)
 */
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {// Dung lượng ban đầu lớn hơn 0
        // Tạo mảng có kích thước initialCapacity
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {// Dung lượng ban đầu bằng 0
        // Tạo mảng rỗng
        this.elementData = EMPTY_ELEMENTDATA;
    } else {// Dung lượng ban đầu nhỏ hơn 0, ném ra ngoại lệ
        throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
    }
}


/**
 * Khởi tạo danh sách chứa các phần tử của collection được chỉ định, các phần tử này được trả về theo thứ tự bởi iterator của collection đó
 * Nếu collection chỉ định là null, throws NullPointerException.
 */
public ArrayList(Collection<? extends E> c) {
    elementData = c.toArray();
    if ((size = elementData.length) != 0) {
        // c.toArray might (incorrectly) not return Object[] (see 6260652)
        if (elementData.getClass() != Object[].class)
            elementData = Arrays.copyOf(elementData, size, Object[].class);
    } else {
        // replace with empty array.
        this.elementData = EMPTY_ELEMENTDATA;
    }
}
```

Các bạn tinh ý chắc chắn sẽ nhận ra: **khi khởi tạo `ArrayList` bằng constructor không tham số, giá trị thực chất được gán lúc khởi tạo chỉ là một mảng rỗng. Chỉ khi thực sự thực hiện thao tác thêm phần tử vào mảng thì dung lượng mới thực sự được cấp phát. Tức là khi thêm phần tử đầu tiên vào mảng, dung lượng mảng mới mở rộng thành 10.** Nội dung này sẽ được trình bày bên dưới khi chúng ta phân tích cơ chế mở rộng dung lượng (`resize`) của `ArrayList`!

> Bổ sung: Ở JDK 6, khi `new` đối tượng `ArrayList` bằng constructor không tham số, mảng `Object[]` `elementData` có độ dài 10 được tạo ngay lập tức.

### Phân tích từng bước cơ chế mở rộng dung lượng của ArrayList

Ở đây lấy `ArrayList` được tạo bởi constructor không tham số làm ví dụ phân tích.

#### Phương thức add

```java
/**
* Nối thêm phần tử được chỉ định vào cuối danh sách này.
*/
public boolean add(E e) {
    // Trước khi thêm phần tử, gọi phương thức ensureCapacityInternal trước
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    // Ở đây ta thấy bản chất của việc thêm phần tử vào ArrayList tương đương với việc gán giá trị vào mảng
    elementData[size++] = e;
    return true;
}
```

**Lưu ý**: JDK 11 đã loại bỏ hai phương thức `ensureCapacityInternal()` và `ensureExplicitCapacity()`.

Mã nguồn của phương thức `ensureCapacityInternal` như sau:

```java
// Tính toán dung lượng cần thiết dựa trên dung lượng tối thiểu đã cho và mảng phần tử hiện tại.
private static int calculateCapacity(Object[] elementData, int minCapacity) {
    // Nếu mảng phần tử hiện tại là mảng rỗng mặc định (trạng thái ban đầu), trả về giá trị lớn hơn giữa dung lượng mặc định và dung lượng tối thiểu làm dung lượng cần thiết
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        return Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    // Ngược lại, trả về trực tiếp dung lượng tối thiểu
    return minCapacity;
}

// Đảm bảo dung lượng nội bộ đạt tới dung lượng tối thiểu được chỉ định.
private void ensureCapacityInternal(int minCapacity) {
    ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}
```

Phương thức `ensureCapacityInternal` rất đơn giản, bên trong gọi trực tiếp phương thức `ensureExplicitCapacity`:

```java
// Kiểm tra xem có cần mở rộng dung lượng hay không
private void ensureExplicitCapacity(int minCapacity) {
    modCount++;
    // Kiểm tra xem dung lượng mảng hiện tại có đủ để lưu minCapacity phần tử hay không
    if (minCapacity - elementData.length > 0)
        // Gọi phương thức grow để mở rộng dung lượng
        grow(minCapacity);
}
```

Hãy cùng phân tích kỹ một chút:

- Khi chúng ta `add` phần tử thứ 1 vào `ArrayList`, `elementData.length` là 0 (vì vẫn là một `list` rỗng); do thực thi phương thức `ensureCapacityInternal()`, `minCapacity` lúc này bằng 10. Lúc này `minCapacity - elementData.length > 0` thỏa mãn, nên sẽ đi vào phương thức `grow(minCapacity)`.
- Khi `add` phần tử thứ 2, `minCapacity` bằng 2, lúc này `elementData.length` (dung lượng) sau khi thêm phần tử đầu tiên đã mở rộng thành `10`. Lúc này `minCapacity - elementData.length > 0` không thỏa mãn, nên sẽ không đi vào (thực thi) phương thức `grow(minCapacity)`.
- Khi thêm các phần tử thứ 3, 4··· đến phần tử thứ 10, phương thức `grow` vẫn không được thực thi, dung lượng mảng đều bằng 10.

Cho đến khi thêm phần tử thứ 11, `minCapacity` (bằng 11) lớn hơn `elementData.length` (bằng 10). Lúc này đi vào phương thức `grow` để tiến hành mở rộng dung lượng.

#### Phương thức grow

```java
/**
 * Kích thước mảng tối đa có thể cấp phát
 */
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

/**
 * Phương thức cốt lõi để mở rộng dung lượng ArrayList.
 */
private void grow(int minCapacity) {
    // oldCapacity là dung lượng cũ, newCapacity là dung lượng mới
    int oldCapacity = elementData.length;
    // Dịch phải oldCapacity đi 1 bit, hiệu quả tương đương oldCapacity / 2.
    // Chúng ta biết tốc độ của phép toán bit nhanh hơn nhiều so với phép chia nguyên; kết quả cả biểu thức là cập nhật dung lượng mới bằng 1.5 lần dung lượng cũ.
    int newCapacity = oldCapacity + (oldCapacity >> 1);

    // Sau đó kiểm tra xem dung lượng mới có lớn hơn dung lượng tối thiểu cần thiết không; nếu vẫn nhỏ hơn thì lấy dung lượng tối thiểu làm dung lượng mới của mảng.
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;

    // Nếu dung lượng mới lớn hơn MAX_ARRAY_SIZE, đi vào (thực thi) phương thức `hugeCapacity()` để so sánh minCapacity và MAX_ARRAY_SIZE;
    // nếu minCapacity lớn hơn dung lượng tối đa, dung lượng mới sẽ là `Integer.MAX_VALUE`, ngược lại dung lượng mới là MAX_ARRAY_SIZE tức `Integer.MAX_VALUE - 8`.
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);

    // minCapacity is usually close to size, so this is a win:
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

**`int newCapacity = oldCapacity + (oldCapacity >> 1)`, vì vậy sau mỗi lần mở rộng dung lượng, dung lượng của `ArrayList` sẽ trở thành khoảng 1.5 lần so với ban đầu (nếu `oldCapacity` là số chẵn thì đúng bằng 1.5 lần, nếu lẻ thì xấp xỉ 1.5 lần)!** Chẵn lẻ khác nhau, ví dụ: `10 + 10/2 = 15`, còn `33 + 33/2 = 49`. Nếu là số lẻ thì phần thập phân sẽ bị bỏ đi.

> `>>` (toán tử dịch bit): `>> 1` dịch phải 1 bit tương đương chia cho 2, dịch phải `n` bit tương đương chia cho 2 lũy thừa `n`. Ở đây `oldCapacity` dịch phải 1 bit nên tương đương `oldCapacity / 2`. Đối với các phép tính nhị phân trên dữ liệu lớn, toán tử dịch bit nhanh hơn nhiều so với các toán tử thông thường vì chương trình chỉ dịch bit chứ không tính toán, nhờ đó nâng cao hiệu suất và tiết kiệm tài nguyên.

**Hãy cùng tìm hiểu thêm phương thức `grow()` thông qua ví dụ:**

- Khi `add` phần tử thứ 1, `oldCapacity` là 0; sau khi so sánh, điều kiện `if` thứ nhất thỏa mãn nên `newCapacity = minCapacity` (bằng 10). Nhưng điều kiện `if` thứ hai không thỏa mãn, tức là `newCapacity` không lớn hơn `MAX_ARRAY_SIZE`, nên không đi vào phương thức `hugeCapacity`. Dung lượng mảng là 10, trong phương thức `add` trả về `true`, `size` tăng lên 1.
- Khi `add` phần tử thứ 11 và đi vào phương thức `grow`, `newCapacity` là 15, lớn hơn `minCapacity` (bằng 11), nên điều kiện `if` thứ nhất không thỏa mãn. Dung lượng mới không vượt quá `size` tối đa của mảng nên không đi vào phương thức `hugeCapacity`. Dung lượng mảng được mở rộng thành 15, phương thức `add` trả về `true`, `size` tăng lên 11.
- Cứ tiếp tục như vậy······

**Bổ sung thêm một điểm kiến thức khá quan trọng nhưng dễ bị bỏ qua:**

- Thuộc tính `length` trong Java dùng cho mảng — ví dụ khi bạn khai báo một mảng và muốn biết độ dài của mảng đó thì dùng thuộc tính `length`.
- Phương thức `length()` trong Java dùng cho chuỗi (`String`) — nếu muốn xem độ dài của chuỗi đó thì dùng phương thức `length()`.
- Phương thức `size()` trong Java dùng cho các collection (Generics) — nếu muốn xem collection đó có bao nhiêu phần tử thì gọi phương thức này!

#### Phương thức hugeCapacity()

Từ mã nguồn của phương thức `grow()` ở trên, ta biết được: nếu dung lượng mới lớn hơn `MAX_ARRAY_SIZE`, chương trình đi vào (thực thi) phương thức `hugeCapacity()` để so sánh `minCapacity` và `MAX_ARRAY_SIZE`; nếu `minCapacity` lớn hơn dung lượng tối đa thì dung lượng mới là `Integer.MAX_VALUE`, ngược lại dung lượng mới là `MAX_ARRAY_SIZE` tức `Integer.MAX_VALUE - 8`.

```java
private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
    // So sánh minCapacity và MAX_ARRAY_SIZE
    // Nếu minCapacity lớn hơn, lấy Integer.MAX_VALUE làm kích thước mảng mới
    // Nếu MAX_ARRAY_SIZE lớn hơn, lấy MAX_ARRAY_SIZE làm kích thước mảng mới
    // MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
    return (minCapacity > MAX_ARRAY_SIZE) ?
        Integer.MAX_VALUE :
        MAX_ARRAY_SIZE;
}
```

### Phương thức `System.arraycopy()` và `Arrays.copyOf()`

Khi đọc mã nguồn, chúng ta sẽ thấy `ArrayList` gọi hai phương thức này rất nhiều. Ví dụ: trong thao tác mở rộng dung lượng vừa trình bày ở trên cũng như các phương thức `add(int index, E element)`, `toArray()`, v.v., đều sử dụng chúng!

#### Phương thức `System.arraycopy()`

Mã nguồn:

```java
    // Ta thấy arraycopy là một phương thức native; tiếp theo hãy giải thích ý nghĩa cụ thể của từng tham số
    /**
    *   Sao chép mảng
    * @param src mảng nguồn
    * @param srcPos vị trí bắt đầu trong mảng nguồn
    * @param dest mảng đích
    * @param destPos vị trí bắt đầu trong mảng đích
    * @param length số lượng phần tử mảng cần sao chép
    */
    public static native void arraycopy(Object src,  int  srcPos,
                                        Object dest, int destPos,
                                        int length);
```

Tình huống sử dụng:

```java
    /**
     * Chèn phần tử được chỉ định vào vị trí chỉ định trong danh sách này.
     * Trước tiên gọi rangeCheckForAdd để kiểm tra giới hạn index; sau đó gọi ensureCapacityInternal để đảm bảo capacity đủ lớn;
     * tiếp theo dịch chuyển toàn bộ thành phần từ index trở đi sang phải một vị trí; chèn element vào vị trí index; cuối cùng tăng size lên 1.
     */
    public void add(int index, E element) {
        rangeCheckForAdd(index);

        ensureCapacityInternal(size + 1);  // Increments modCount!!
        // Phương thức arraycopy() thực hiện mảng tự sao chép lên chính nó
        // elementData: mảng nguồn; index: vị trí bắt đầu trong mảng nguồn; elementData: mảng đích; index + 1: vị trí bắt đầu trong mảng đích; size - index: số lượng phần tử mảng cần sao chép
        System.arraycopy(elementData, index, elementData, index + 1, size - index);
        elementData[index] = element;
        size++;
    }
```

Chúng ta hãy viết một phương thức đơn giản để kiểm thử:

```java
public class ArraycopyTest {

  public static void main(String[] args) {
    // TODO Auto-generated method stub
    int[] a = new int[10];
    a[0] = 0;
    a[1] = 1;
    a[2] = 2;
    a[3] = 3;
    System.arraycopy(a, 2, a, 3, 3);
    a[2]=99;
    for (int i = 0; i < a.length; i++) {
      System.out.print(a[i] + " ");
    }
  }

}
```

Kết quả:

```plain
0 1 99 2 3 0 0 0 0 0
```

#### Phương thức `Arrays.copyOf()`

Mã nguồn:

```java
    public static int[] copyOf(int[] original, int newLength) {
      // Cấp phát một mảng mới
        int[] copy = new int[newLength];
  // Gọi System.arraycopy để sao chép dữ liệu từ mảng nguồn và trả về mảng mới
        System.arraycopy(original, 0, copy, 0,
                         Math.min(original.length, newLength));
        return copy;
    }
```

Tình huống sử dụng:

```java
   /**
     Trả về một mảng chứa tất cả các phần tử trong danh sách này theo đúng thứ tự (từ phần tử đầu đến phần tử cuối); kiểu runtime của mảng trả về chính là kiểu runtime của mảng được chỉ định.
     */
    public Object[] toArray() {
    // elementData: mảng cần sao chép; size: độ dài cần sao chép
        return Arrays.copyOf(elementData, size);
    }
```

Theo cá nhân tôi, phương thức `Arrays.copyOf()` chủ yếu được dùng để mở rộng dung lượng cho mảng sẵn có. Mã kiểm thử như sau:

```java
public class ArrayscopyOfTest {

  public static void main(String[] args) {
    int[] a = new int[3];
    a[0] = 0;
    a[1] = 1;
    a[2] = 2;
    int[] b = Arrays.copyOf(a, 10);
    System.out.println("b.length"+b.length);
  }
}
```

Kết quả:

```plain
10
```

#### Mối liên hệ và sự khác biệt giữa hai phương thức

**Mối liên hệ:**

Nhìn vào mã nguồn của cả hai, có thể thấy bên trong `copyOf()` thực chất gọi phương thức `System.arraycopy()`.

**Sự khác biệt:**

`arraycopy()` cần truyền vào mảng đích, sao chép mảng nguồn vào mảng do bạn tự định nghĩa hoặc sao chép lên chính mảng nguồn, đồng thời cho phép chọn vị trí bắt đầu sao chép, độ dài sao chép và vị trí đặt vào mảng mới; còn `copyOf()` sẽ tự động tạo mới một mảng ở bên trong và trả về mảng đó.

### Phương thức `ensureCapacity`

Không biết mọi người có để ý trong mã nguồn `ArrayList` có một phương thức `ensureCapacity` hay không — phương thức này không được gọi bên trong `ArrayList`, nên rõ ràng là được cung cấp để người dùng gọi. Vậy phương thức này có tác dụng gì?

```java
    /**
    Nếu cần thiết, tăng dung lượng của thể hiện ArrayList này để đảm bảo nó có thể chứa ít nhất số lượng phần tử được chỉ định bởi tham số minimum capacity.
     *
     * @param   minCapacity   dung lượng tối thiểu mong muốn
     */
    public void ensureCapacity(int minCapacity) {
        int minExpand = (elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA)
            // any size if not default element table
            ? 0
            // larger than default for default empty table. It's already
            // supposed to be at default size.
            : DEFAULT_CAPACITY;

        if (minCapacity > minExpand) {
            ensureExplicitCapacity(minCapacity);
        }
    }

```

Về mặt lý thuyết, tốt nhất nên sử dụng phương thức `ensureCapacity` trước khi thêm một lượng lớn phần tử vào `ArrayList` để giảm số lần cấp phát lại tăng dần.

Hãy cùng kiểm thử thực tế hiệu quả của phương thức này thông qua đoạn mã bên dưới:

```java
public class EnsureCapacityTest {
  public static void main(String[] args) {
    ArrayList<Object> list = new ArrayList<Object>();
    final int N = 10000000;
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < N; i++) {
      list.add(i);
    }
    long endTime = System.currentTimeMillis();
    System.out.println("使用ensureCapacity方法前："+(endTime - startTime));

  }
}
```

Kết quả chạy:

```plain
使用ensureCapacity方法前：2158
```

```java
public class EnsureCapacityTest {
    public static void main(String[] args) {
        ArrayList<Object> list = new ArrayList<Object>();
        final int N = 10000000;
        long startTime1 = System.currentTimeMillis();
        list.ensureCapacity(N);
        for (int i = 0; i < N; i++) {
            list.add(i);
        }
        long endTime1 = System.currentTimeMillis();
        System.out.println("使用ensureCapacity方法后："+(endTime1 - startTime1));
    }
}
```

Kết quả chạy:

```plain
使用ensureCapacity方法后：1773
```

Qua kết quả chạy, chúng ta có thể thấy việc sử dụng phương thức `ensureCapacity` trước khi thêm một lượng lớn phần tử vào `ArrayList` có thể cải thiện hiệu năng. Tuy nhiên, mức chênh lệch hiệu năng này gần như không đáng kể. Hơn nữa, các dự án thực tế về cơ bản cũng không thể thêm nhiều phần tử như vậy vào `ArrayList`.
