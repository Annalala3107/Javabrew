---
title: Giải thích chi tiết về ThreadLocal
description: "Phân tích chuyên sâu về ThreadLocal: giải thích nguyên lý biến cục bộ theo luồng (thread-local), cơ chế triển khai ThreadLocalMap, tham chiếu yếu (WeakReference) và vấn đề rò rỉ bộ nhớ (Memory Leak), kịch bản sử dụng và các thực hành tốt nhất."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/threadlocal.md
head:
  - - meta
    - name: keywords
      content: ThreadLocal,biến cục bộ theo luồng,ThreadLocalMap,rò rỉ bộ nhớ,tham chiếu yếu,nguyên lý ThreadLocal,cô lập luồng
---

> Bài viết này được đóng góp bởi tác giả Yizhihua Suanbusuan Langman (`一枝花算不算浪漫`), bài viết gốc tại: [https://juejin.cn/post/6844904151567040519](https://juejin.cn/post/6844904151567040519).

### Lời mở đầu

![](/media/jg/local/java/concurrent/images/thread-local/1-385ee6.png)

**Toàn bài dài hơn 10.000 chữ với 31 hình minh họa, tiêu tốn rất nhiều thời gian và công sức để biên soạn. Sáng tác nội dung gốc không hề dễ dàng, mong mọi người bấm theo dõi và ủng hộ nhé, xin cảm ơn.**

Với `ThreadLocal`, phản ứng đầu tiên của nhiều bạn có thể là "đơn giản thôi mà, nó là bản sao biến của luồng, mỗi luồng được cô lập riêng biệt". Vậy hãy cùng suy ngẫm một vài câu hỏi sau đây:

- `key` của `ThreadLocal` là **tham chiếu yếu (`WeakReference`)**, vậy khi gọi `ThreadLocal.get()` sau khi xảy ra **GC**, `key` có bị biến thành **`null`** hay không?
- **Cấu trúc dữ liệu** của `ThreadLocalMap` trong `ThreadLocal` là gì?
- **Thuật toán băm (Hash)** của `ThreadLocalMap` hoạt động ra sao?
- **Xung đột băm (Hash Collision)** trong `ThreadLocalMap` được xử lý như thế nào?
- **Cơ chế mở rộng dung lượng (`resize`)** của `ThreadLocalMap` là gì?
- **Cơ chế dọn dẹp các `key` đã hết hạn** trong `ThreadLocalMap` diễn ra như thế nào? Quy trình **dọn dẹp thăm dò (`probing cleanup`)** và **dọn dẹp heuristic (`heuristic cleanup`)** ra sao?
- Nguyên lý triển khai của phương thức `ThreadLocalMap.set()` là gì?
- Nguyên lý triển khai của phương thức `ThreadLocalMap.get()` là gì?
- Tình hình sử dụng `ThreadLocal` trong dự án thực tế? Những cái bẫy (`pitfall`) từng gặp phải?
- ……

Những câu hỏi trên bạn đã nắm rõ tường tận hết chưa? Bài viết này sẽ xoay quanh các câu hỏi đó, kết hợp hình vẽ minh họa và mã nguồn để phân tích **từng ngóc ngách** của `ThreadLocal`.

### Mục lục

**Lưu ý:** Mã nguồn trong bài viết này dựa trên `JDK 1.8`.

### Minh họa mã nguồn `ThreadLocal`

Trước tiên, hãy cùng xem một ví dụ sử dụng `ThreadLocal`:

```java
public class ThreadLocalTest {
    private List<String> messages = Lists.newArrayList();

    public static final ThreadLocal<ThreadLocalTest> holder = ThreadLocal.withInitial(ThreadLocalTest::new);

    public static void add(String message) {
        holder.get().messages.add(message);
    }

    public static List<String> clear() {
        List<String> messages = holder.get().messages;
        holder.remove();

        System.out.println("size: " + holder.get().messages.size());
        return messages;
    }

    public static void main(String[] args) {
        ThreadLocalTest.add("一枝花算不算浪漫");
        System.out.println(holder.get().messages);
        ThreadLocalTest.clear();
    }
}
```

Kết quả in ra:

```java
[一枝花算不算浪漫]
size: 0
```

Đối tượng `ThreadLocal` có thể cung cấp biến cục bộ theo luồng (thread-local variable): mỗi `Thread` (luồng) sở hữu một **bản sao biến** riêng của chính mình, nhiều luồng không gây nhiễu lẫn nhau.

### Cấu trúc dữ liệu của `ThreadLocal`

![](/media/jg/local/java/concurrent/images/thread-local/2-ac0f33.png)

Lớp `Thread` có một biến thực thể `threadLocals` thuộc kiểu `ThreadLocal.ThreadLocalMap`, tức là mỗi luồng đều có một `ThreadLocalMap` của riêng mình.

`ThreadLocalMap` có cài đặt độc lập riêng; có thể hình dung đơn giản `key` của nó chính là `ThreadLocal`, còn `value` là giá trị được đưa vào trong code (thực tế `key` không phải là bản thân `ThreadLocal`, mà là một **tham chiếu yếu** trỏ tới nó).

Mỗi luồng khi đưa giá trị vào `ThreadLocal` đều lưu vào `ThreadLocalMap` của chính luồng đó; khi đọc ra cũng dùng `ThreadLocal` làm tham chiếu để tìm `key` tương ứng trong `map` của riêng mình, nhờ đó thực hiện được sự **cô lập luồng (thread isolation)**.

`ThreadLocalMap` có cấu trúc khá giống `HashMap`, chỉ khác ở chỗ `HashMap` được triển khai bằng **mảng + danh sách liên kết**, trong khi `ThreadLocalMap` hoàn toàn **không có cấu trúc danh sách liên kết**.

Chúng ta cũng cần chú ý tới `Entry`: `key` của nó là `ThreadLocal<?> k`, kế thừa từ `WeakReference` — tức là kiểu tham chiếu yếu mà chúng ta thường nhắc tới.

### Sau khi GC thì `key` có trở thành `null` không?

Trả lời lại câu hỏi ở đầu bài: `key` của `ThreadLocal` là tham chiếu yếu, vậy khi gọi `ThreadLocal.get()`, nếu xảy ra `GC` thì `key` có trở thành `null` không?

Để làm rõ vấn đề này, trước hết ta cần nắm vững **bốn loại tham chiếu trong Java**:

- **Tham chiếu mạnh (Strong Reference)**: Các đối tượng chúng ta thường khởi tạo bằng `new` thuộc loại tham chiếu mạnh. Chỉ cần tham chiếu mạnh còn tồn tại, bộ thu gom rác (Garbage Collector) sẽ không bao giờ thu hồi đối tượng được tham chiếu, ngay cả khi thiếu bộ nhớ.
- **Tham chiếu mềm (Soft Reference)**: Đối tượng được bọc bằng `SoftReference` gọi là tham chiếu mềm. Đối tượng mà tham chiếu mềm trỏ tới sẽ bị thu hồi khi bộ nhớ sắp bị tràn (`OOM`).
- **Tham chiếu yếu (Weak Reference)**: Đối tượng được tham chiếu qua `WeakReference` nếu không còn tham chiếu mạnh hay tham chiếu mềm nào nữa sẽ trở thành đối tượng khả tiếp cận yếu (`weakly reachable`); khi bộ thu gom rác quyết định xử lý nhóm đối tượng này, nó sẽ xóa các tham chiếu yếu tương ứng. Một lần thu gom rác cụ thể không đảm bảo sẽ xử lý ngay lập tức toàn bộ các đối tượng ứng viên.
- **Tham chiếu ảo (Phantom Reference)**: Tham chiếu ảo là loại tham chiếu yếu nhất, được định nghĩa trong Java bằng `PhantomReference`. Tác dụng duy nhất của tham chiếu ảo là thông qua hàng đợi tham chiếu để nhận thông báo khi đối tượng sắp bị thu hồi.

Tiếp theo, hãy xem đoạn code dưới đây — ta sử dụng `Reflection` để quan sát dữ liệu bên trong `ThreadLocal` sau khi `GC` (đoạn code dưới đây lấy nguồn từ <https://blog.csdn.net/thewindkee/article/details/103726942> để chạy minh họa kịch bản thu hồi GC trên máy local):

> `System.gc()` chỉ là lời đề nghị gửi tới JVM để thực hiện thu gom rác; kết quả dưới đây phù hợp để minh họa nguyên lý, nhưng không thể coi là hành vi chắc chắn xảy ra trong mọi lần chạy.

```java
public class ThreadLocalDemo {

    public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException, InterruptedException {
        Thread t = new Thread(()->test("abc",false));
        t.start();
        t.join();
        System.out.println("--gc后--");
        Thread t2 = new Thread(() -> test("def", true));
        t2.start();
        t2.join();
    }

    private static void test(String s,boolean isGC)  {
        try {
            new ThreadLocal<>().set(s);
            if (isGC) {
                System.gc();
            }
            Thread t = Thread.currentThread();
            Class<? extends Thread> clz = t.getClass();
            Field field = clz.getDeclaredField("threadLocals");
            field.setAccessible(true);
            Object ThreadLocalMap = field.get(t);
            Class<?> tlmClass = ThreadLocalMap.getClass();
            Field tableField = tlmClass.getDeclaredField("table");
            tableField.setAccessible(true);
            Object[] arr = (Object[]) tableField.get(ThreadLocalMap);
            for (Object o : arr) {
                if (o != null) {
                    Class<?> entryClass = o.getClass();
                    Field valueField = entryClass.getDeclaredField("value");
                    Field referenceField = entryClass.getSuperclass().getSuperclass().getDeclaredField("referent");
                    valueField.setAccessible(true);
                    referenceField.setAccessible(true);
                    System.out.println(String.format("弱引用key:%s,值:%s", referenceField.get(o), valueField.get(o)));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

Kết quả như sau:

```java
弱引用key:java.lang.ThreadLocal@433619b6,值:abc
弱引用key:java.lang.ThreadLocal@418a15e3,值:java.lang.ref.SoftReference@bf97a12
--gc后--
弱引用key:null,值:def
```

![](/media/jg/local/java/concurrent/images/thread-local/3-68a191.png)

Như hình minh họa, bởi vì `ThreadLocal` được tạo ra ở đây không trỏ/gán cho biến nào, tức là không có tham chiếu nào giữ nó:

```java
new ThreadLocal<>().set(s);
```

Trong lần chạy ví dụ này, bộ thu gom rác đã xử lý `ThreadLocal` chỉ còn lại tham chiếu yếu, nên ta thấy `referent=null`. Tuy nhiên điều này phụ thuộc vào việc JVM có thực sự chạy và hoàn tất chu kỳ thu gom rác tương ứng hay không. Nếu **sửa lại code một chút**:

![](/media/jg/local/java/concurrent/images/thread-local/4-e0f271.png)

Khi mới đọc câu hỏi này, nếu không suy nghĩ kỹ, thấy **tham chiếu yếu** lại thêm **Garbage Collection**, chắc chắn sẽ nghĩ đáp án là `null`.

Thực tế không phải vậy: bởi vì đề bài nói là đang thực hiện thao tác `ThreadLocal.get()`, điều đó chứng tỏ thực ra vẫn còn **tham chiếu mạnh** tồn tại, nên `key` không phải là `null`. Như hình dưới đây minh họa, **tham chiếu mạnh** tới `ThreadLocal` vẫn đang tồn tại.

![](/media/jg/local/java/concurrent/images/thread-local/5-b548b8.png)

Nếu **tham chiếu mạnh** không còn tồn tại, bộ thu gom rác có thể xóa `key` trong tham chiếu yếu. Lúc này `Entry` vẫn giữ tham chiếu mạnh tới `value`, cho đến khi phần tử hết hạn đó được dọn dẹp bởi các thao tác tiếp theo của `ThreadLocalMap`, hoặc cho đến khi luồng sở hữu kết thúc và toàn bộ Map không còn khả năng tiếp cận; trong các luồng có vòng đời dài như ở Thread Pool, khoảng thời gian tồn đọng này có thể rất lâu, do đó tiềm ẩn nguy cơ rò rỉ bộ nhớ (Memory Leak).

### Giải thích chi tiết mã nguồn phương thức `ThreadLocal.set()`

![](/media/jg/local/java/concurrent/images/thread-local/6-e82bfd.png)

Nguyên lý phương thức `set` trong `ThreadLocal` như hình trên rất đơn giản: chủ yếu kiểm tra xem `ThreadLocalMap` đã tồn tại hay chưa, sau đó dùng phương thức `set` trong `ThreadLocal` để xử lý dữ liệu.

Mã nguồn như sau:

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}

void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

Logic cốt lõi chủ yếu vẫn nằm trong `ThreadLocalMap`; hãy xem tiếp từng bước, phía sau sẽ có phân tích chi tiết hơn nữa.

### Thuật toán Hash của `ThreadLocalMap`

Đã là cấu trúc `Map`, tất nhiên `ThreadLocalMap` cũng phải tự triển khai thuật toán `hash` của riêng mình để giải quyết vấn đề xung đột trong mảng bảng băm.

```java
int i = key.threadLocalHashCode & (len-1);
```

Thuật toán `hash` trong `ThreadLocalMap` rất đơn giản; ở đây `i` chính là vị trí chỉ số mảng tương ứng của `key` hiện tại trong bảng băm.

Điểm mấu chốt nhất ở đây là cách tính giá trị `threadLocalHashCode`: trong `ThreadLocal` có một thuộc tính `HASH_INCREMENT = 0x61c88647`:

```java
public class ThreadLocal<T> {
    private final int threadLocalHashCode = nextHashCode();

    private static AtomicInteger nextHashCode = new AtomicInteger();

    private static final int HASH_INCREMENT = 0x61c88647;

    private static int nextHashCode() {
        return nextHashCode.getAndAdd(HASH_INCREMENT);
    }

    static class ThreadLocalMap {
        ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
            table = new Entry[INITIAL_CAPACITY];
            int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);

            table[i] = new Entry(firstKey, firstValue);
            size = 1;
            setThreshold(INITIAL_CAPACITY);
        }
    }
}
```

Mỗi khi tạo một đối tượng `ThreadLocal`, giá trị `ThreadLocal.nextHashCode` sẽ tăng thêm `0x61c88647`.

Hằng số này không phải số Fibonacci, mà là một bước tăng băm 32-bit được suy ra từ tỷ lệ vàng. Khi các `ThreadLocal` được tạo liên tiếp sử dụng bước tăng này để sinh mã băm, rồi lấy các bit thấp theo mảng có độ dài là lũy thừa của 2, vị trí các slot phân bố sẽ khá đồng đều.

Chúng ta có thể tự thử nghiệm:

![](/media/jg/local/java/concurrent/images/thread-local/8-438265.png)

Có thể thấy các mã băm sinh ra phân bố khá đồng đều; nếu quan tâm, bạn có thể tìm hiểu sâu thêm về phép băm nhân (multiplicative hashing) dựa trên tỷ lệ vàng.

### Xung đột băm (Hash Collision) trong `ThreadLocalMap`

> **Lưu ý:** Trong tất cả các hình minh họa dưới đây, **khối màu xanh lá** `Entry` đại diện cho **dữ liệu hợp lệ**, **khối màu xám** đại diện cho `Entry` có giá trị `key` bằng `null` (**đã bị Garbage Collection thu hồi**), và **khối màu trắng** biểu thị `Entry` bằng `null`.

Mặc dù `ThreadLocalMap` sử dụng **hằng số tỷ lệ vàng** làm hệ số tính `hash`, giúp giảm đáng kể xác suất xung đột `Hash`, nhưng xung đột vẫn có thể xảy ra.

Cách giải quyết xung đột trong `HashMap` là xây dựng một cấu trúc **danh sách liên kết** trên mảng: dữ liệu bị xung đột được gắn vào danh sách liên kết, và nếu độ dài danh sách liên kết vượt quá một ngưỡng nhất định thì sẽ chuyển thành **cây đỏ-đen (Red-Black Tree)**.

Trong khi đó, `ThreadLocalMap` không có cấu trúc danh sách liên kết, nên không thể dùng cách giải quyết xung đột của `HashMap`.

![](/media/jg/local/java/concurrent/images/thread-local/7-4f53bf.png)

Như hình trên, nếu chúng ta chèn một dữ liệu có `value=27`, sau khi tính `hash` đáng lẽ nó phải rơi vào slot 4, nhưng slot 4 đã có dữ liệu `Entry`.

Lúc này nó sẽ duyệt tuyến tính về phía sau cho đến khi tìm được slot có `Entry` bằng `null` mới dừng lại, rồi đặt phần tử hiện tại vào slot đó. Tất nhiên trong quá trình duyệt còn có những tình huống khác — chẳng hạn gặp `Entry` khác `null` nhưng có `key` bằng nhau, hoặc gặp `Entry` có `key` bằng `null`, v.v. — mỗi trường hợp đều có cách xử lý riêng, phía sau sẽ giải thích chi tiết từng trường hợp.

Hình vẽ còn minh họa một dữ liệu `Entry` có `key` bằng `null` (**khối màu xám tại Entry=2**); vì kiểu của `key` là **tham chiếu yếu**, nên loại dữ liệu này có thể tồn tại. Trong quá trình `set`, nếu gặp phải `Entry` có `key` đã hết hạn, thực tế sẽ tiến hành một lượt **dọn dẹp thăm dò (`probing cleanup`)**, cách thức cụ thể sẽ được trình bày ở phần sau.

### Giải thích chi tiết `ThreadLocalMap.set()`

#### Minh họa bằng hình nguyên lý `ThreadLocalMap.set()`

Sau khi xem xong **thuật toán hash** của `ThreadLocal`, hãy xem tiếp `set` được triển khai như thế nào.

Việc `set` dữ liệu vào `ThreadLocalMap` (**thêm mới** hoặc **cập nhật** dữ liệu) chia thành nhiều trường hợp; với từng trường hợp chúng ta sẽ vẽ hình minh họa.

**Trường hợp thứ nhất:** `Entry` tại slot tính được sau khi `hash` đang rỗng:

![](/media/jg/local/java/concurrent/images/thread-local/9-5a4866.png)

Ở đây chỉ cần đặt trực tiếp dữ liệu vào slot đó là xong.

**Trường hợp thứ hai:** Dữ liệu tại slot không rỗng, và `key` trùng khớp với `key` của `ThreadLocal` hiện tại tính được qua `hash`:

![](/media/jg/local/java/concurrent/images/thread-local/10-885243.png)

Ở đây cập nhật trực tiếp dữ liệu tại slot đó.

**Trường hợp thứ ba:** Dữ liệu tại slot không rỗng; trong quá trình duyệt về phía sau, trước khi tìm thấy slot có `Entry` bằng `null`, không gặp phải `Entry` nào có `key` hết hạn:

![](/media/jg/local/java/concurrent/images/thread-local/11-14fd05.png)

Duyệt mảng bảng băm tuyến tính về phía sau: nếu tìm thấy slot có `Entry` bằng `null` thì đặt dữ liệu vào slot đó; hoặc nếu trong quá trình duyệt về phía sau gặp dữ liệu có **giá trị `key` bằng nhau** thì cập nhật trực tiếp là xong.

**Trường hợp thứ tư:** Dữ liệu tại slot không rỗng; trong quá trình duyệt về phía sau, trước khi tìm thấy slot có `Entry` bằng `null`, gặp phải `Entry` có `key` hết hạn — như hình dưới đây, trong lúc duyệt về phía sau đã gặp slot tại `index=7` có `Entry` mang `key=null`:

![](/media/jg/local/java/concurrent/images/thread-local/12-964696.png)

Dữ liệu `Entry` tại chỉ số `7` của mảng bảng băm có `key` bằng `null`, chứng tỏ `key` của dữ liệu này đã bị bộ thu gom rác thu hồi; lúc này phương thức `replaceStaleEntry()` sẽ được thực thi — ý nghĩa của phương thức này là **logic thay thế dữ liệu hết hạn** — lấy `index=7` làm điểm xuất phát để duyệt và thực hiện công việc dọn dẹp thăm dò dữ liệu.

Khởi tạo vị trí bắt đầu quét cho việc dọn dẹp thăm dò dữ liệu hết hạn: `slotToExpunge = staleSlot = 7`.

Bắt đầu từ `staleSlot` hiện tại, duyệt ngược về phía trước để tìm các dữ liệu hết hạn khác, sau đó cập nhật chỉ số bắt đầu quét dữ liệu hết hạn `slotToExpunge`. Vòng lặp `for` lặp cho đến khi gặp `Entry` bằng `null` mới kết thúc.

Nếu tìm thấy dữ liệu hết hạn, tiếp tục duyệt ngược về phía trước cho tới khi gặp slot có `Entry=null` mới dừng lặp; như hình dưới đây, **`slotToExpunge` được cập nhật thành 0**:

![](/media/jg/local/java/concurrent/images/thread-local/13-554973.png)

Từ nút hiện tại (`index=7`) duyệt ngược về phía trước để kiểm tra xem có dữ liệu `Entry` hết hạn hay không; nếu có thì cập nhật giá trị `slotToExpunge`, gặp `null` thì kết thúc thăm dò. Lấy hình trên làm ví dụ, `slotToExpunge` được cập nhật thành 0.

Thao tác duyệt ngược về phía trước ở trên là nhằm cập nhật giá trị chỉ số bắt đầu dọn dẹp thăm dò dữ liệu hết hạn `slotToExpunge`; giá trị này sẽ được giải thích ở phía sau — nó dùng để xác định xem trước slot hết hạn hiện tại `staleSlot` còn phần tử hết hạn nào khác nữa hay không.

Tiếp theo, bắt đầu từ vị trí `staleSlot` (`index=7`) duyệt tiếp về phía sau; **nếu tìm thấy dữ liệu `Entry` có cùng `key`:**

![](/media/jg/local/java/concurrent/images/thread-local/14-242683.png)

Từ nút hiện tại `staleSlot` tìm về phía sau phần tử `Entry` có giá trị `key` bằng nhau; sau khi tìm thấy thì cập nhật giá trị của `Entry` đó và hoán đổi vị trí với phần tử tại `staleSlot` (vị trí `staleSlot` chứa phần tử hết hạn), cập nhật dữ liệu `Entry`, rồi bắt đầu dọn dẹp các `Entry` hết hạn, như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/view-fbd8d7e9.png)

Trong quá trình duyệt về phía sau, nếu không tìm thấy dữ liệu `Entry` có cùng `key`:

![](/media/jg/local/java/concurrent/images/thread-local/15-1f6b38.png)

Từ nút hiện tại `staleSlot` tìm về phía sau phần tử `Entry` có giá trị `key` bằng nhau, cho tới khi `Entry` bằng `null` mới dừng tìm kiếm. Qua hình trên có thể thấy lúc này trong `table` không có `Entry` nào có cùng `key`.

Tạo mới một `Entry` để thay thế vị trí `table[staleSlot]`:

![](/media/jg/local/java/concurrent/images/thread-local/16-bee02e.png)

Sau khi thay thế xong cũng tiến hành dọn dẹp phần tử hết hạn; công việc dọn dẹp chủ yếu dựa vào hai phương thức: `expungeStaleEntry()` và `cleanSomeSlots()`, chi tiết cụ thể sẽ được nói ở phía sau, mời bạn đọc tiếp.

#### Giải thích chi tiết mã nguồn `ThreadLocalMap.set()`

Phần trên đã phân tích nguyên lý triển khai `set()` bằng hình vẽ khá rõ ràng rồi, giờ hãy cùng xem tiếp mã nguồn:

`java.lang.ThreadLocal`.`ThreadLocalMap.set()`:

```java
private void set(ThreadLocal<?> key, Object value) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);

    for (Entry e = tab[i];
         e != null;
         e = tab[i = nextIndex(i, len)]) {
        ThreadLocal<?> k = e.get();

        if (k == key) {
            e.value = value;
            return;
        }

        if (k == null) {
            replaceStaleEntry(key, value, i);
            return;
        }
    }

    tab[i] = new Entry(key, value);
    int sz = ++size;
    if (!cleanSomeSlots(i, sz) && sz >= threshold)
        rehash();
}
```

Tại đây, nó sẽ thông qua `key` để tính vị trí tương ứng trong bảng băm, sau đó từ vị trí bucket tương ứng với `key` hiện tại tìm tiếp về phía sau để tìm ra bucket có thể sử dụng được.

```java
Entry[] tab = table;
int len = tab.length;
int i = key.threadLocalHashCode & (len-1);
```

Trong những trường hợp nào thì một bucket có thể sử dụng được?

1. `k == key`: cho thấy đây là thao tác thay thế/cập nhật, có thể sử dụng.
2. Gặp một bucket hết hạn (`k == null`): thực thi logic thay thế, chiếm dụng bucket hết hạn.
3. Trong quá trình tìm kiếm gặp trường hợp bucket có `Entry == null`: dùng trực tiếp.

Tiếp theo là thực thi vòng lặp `for` duyệt về phía sau; trước tiên hãy xem cài đặt của hai phương thức `nextIndex()` và `prevIndex()`:

![](/media/jg/local/java/concurrent/images/thread-local/17-ec720c.png)

```java
private static int nextIndex(int i, int len) {
    return ((i + 1 < len) ? i + 1 : 0);
}

private static int prevIndex(int i, int len) {
    return ((i - 1 >= 0) ? i - 1 : len - 1);
}
```

Tiếp theo, xem phần logic còn lại trong vòng lặp `for`:

1. Nếu bucket tương ứng với `key` hiện tại có dữ liệu `Entry` rỗng (`null`), chứng tỏ không xảy ra xung đột tại vị trí này của mảng bảng băm; thoát vòng lặp `for` và `set` trực tiếp dữ liệu vào bucket tương ứng.
2. Nếu bucket tương ứng với `key` không rỗng:
   - 2.1 Nếu `k == key`, chứng tỏ thao tác `set` hiện tại là thao tác thay thế, thực hiện logic thay thế rồi trả về ngay.
   - 2.2 Nếu `k == null`, chứng tỏ `Entry` ở vị trí bucket hiện tại là dữ liệu đã hết hạn, thực thi phương thức `replaceStaleEntry()` (phương thức cốt lõi), sau đó trả về.
3. Vòng lặp `for` chạy xong và đi tiếp xuống dưới, chứng tỏ trong quá trình duyệt về phía sau đã gặp trường hợp `entry` bằng `null`:
   - 3.1 Tạo một đối tượng `Entry` mới tại bucket có `Entry` bằng `null`.
   - 3.2 Thực hiện thao tác `++size`.
4. Gọi `cleanSomeSlots()` để thực hiện một lượt dọn dẹp heuristic nhằm dọn các `Entry` có `key` hết hạn trong mảng bảng băm:
   - 4.1 Nếu sau khi dọn dẹp xong mà không dọn được dữ liệu nào và `size` đã đạt/vượt ngưỡng (`2/3` độ dài mảng), thực hiện thao tác `rehash()`.
   - 4.2 Trong `rehash()`, trước tiên sẽ tiến hành một lượt dọn dẹp thăm dò để xóa các `key` hết hạn; sau khi dọn xong nếu `size >= threshold - threshold / 4` thì sẽ thực thi logic mở rộng dung lượng (`resize`) thực sự (logic `resize` sẽ xem ở phần sau).

Tiếp theo, hãy tập trung xem xét phương thức `replaceStaleEntry()`: phương thức này cung cấp chức năng thay thế dữ liệu đã hết hạn; ta có thể đối chiếu lại với sơ đồ nguyên lý của **Trường hợp thứ tư** ở trên để ôn lại, mã nguồn cụ thể như sau:

`java.lang.ThreadLocal.ThreadLocalMap.replaceStaleEntry()`:

```java
private void replaceStaleEntry(ThreadLocal<?> key, Object value,
                                       int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;
    Entry e;

    int slotToExpunge = staleSlot;
    for (int i = prevIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = prevIndex(i, len))

        if (e.get() == null)
            slotToExpunge = i;

    for (int i = nextIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = nextIndex(i, len)) {

        ThreadLocal<?> k = e.get();

        if (k == key) {
            e.value = value;

            tab[i] = tab[staleSlot];
            tab[staleSlot] = e;

            if (slotToExpunge == staleSlot)
                slotToExpunge = i;
            cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
            return;
        }

        if (k == null && slotToExpunge == staleSlot)
            slotToExpunge = i;
    }

    tab[staleSlot].value = null;
    tab[staleSlot] = new Entry(key, value);

    if (slotToExpunge != staleSlot)
        cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
}
```

`slotToExpunge` biểu thị chỉ số bắt đầu dọn dẹp thăm dò dữ liệu hết hạn, mặc định bắt đầu từ `staleSlot` hiện tại. Từ `staleSlot` hiện tại, duyệt ngược về phía trước để kiểm tra xem có dữ liệu hết hạn hay không; vòng lặp `for` chỉ kết thúc khi gặp `Entry` bằng `null`. Nếu ở phía trước tìm thấy dữ liệu hết hạn, cập nhật chỉ số bắt đầu dọn dẹp thăm dò dữ liệu hết hạn thành `i`, tức là `slotToExpunge = i`:

```java
for (int i = prevIndex(staleSlot, len);
     (e = tab[i]) != null;
     i = prevIndex(i, len)){

    if (e.get() == null){
        slotToExpunge = i;
    }
}
```

Sau đó bắt đầu tìm về phía sau từ `staleSlot`, cũng kết thúc khi gặp bucket có `Entry` bằng `null`.
Nếu trong quá trình duyệt **gặp `k == key`**, điều này cho thấy đây là logic thay thế: cập nhật dữ liệu mới rồi hoán đổi với vị trí `staleSlot` hiện tại. Nếu `slotToExpunge == staleSlot`, chứng tỏ ngay từ lúc đầu khi `replaceStaleEntry()` tìm ngược về phía trước không thấy `Entry` hết hạn nào, và khi tìm tiếp về phía sau cũng chưa gặp dữ liệu hết hạn nào; do đó sửa chỉ số bắt đầu dọn dẹp thăm dò dữ liệu hết hạn thành `index` của vòng lặp hiện tại, tức `slotToExpunge = i`. Cuối cùng gọi `cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);` để dọn dẹp dữ liệu hết hạn theo kiểu heuristic.

```java
if (k == key) {
    e.value = value;

    tab[i] = tab[staleSlot];
    tab[staleSlot] = e;

    if (slotToExpunge == staleSlot)
        slotToExpunge = i;

    cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
    return;
}
```

Hai phương thức `cleanSomeSlots()` và `expungeStaleEntry()` phía sau sẽ được giảng chi tiết; cả hai đều liên quan đến việc dọn dẹp: một cái là dọn dẹp heuristic các `Entry` có `key` hết hạn (`Heuristically scan`), còn cái kia là dọn dẹp thăm dò các `Entry` có `key` hết hạn.

**Nếu `k != key`** thì đi tiếp xuống dưới: `k == null` cho thấy `Entry` đang duyệt hiện tại là dữ liệu hết hạn, còn `slotToExpunge == staleSlot` cho thấy lượt tìm ngược về phía trước ban đầu không phát hiện `Entry` hết hạn nào. Nếu điều kiện thỏa mãn, cập nhật `slotToExpunge` thành vị trí hiện tại — với điều kiện tiên quyết là quá trình quét các slot đứng trước không phát hiện dữ liệu hết hạn.

```java
if (k == null && slotToExpunge == staleSlot)
    slotToExpunge = i;
```

Trong quá trình duyệt tiếp về phía sau, nếu không tìm thấy dữ liệu nào có `k == key` và gặp phần tử có `Entry` bằng `null`, thì kết thúc quá trình lặp hiện tại. Lúc này chứng tỏ đây là logic thêm mới, nên đặt dữ liệu mới vào `slot` tương ứng với `table[staleSlot]`.

```java
tab[staleSlot].value = null;
tab[staleSlot] = new Entry(key, value);
```

Cuối cùng, nếu phát hiện ngoài `staleSlot` ra còn có các `slot` hết hạn khác, thì phải kích hoạt logic dọn dẹp dữ liệu:

```java
if (slotToExpunge != staleSlot)
    cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
```

### Quy trình dọn dẹp thăm dò `key` hết hạn trong `ThreadLocalMap`

Ở trên chúng ta đã đề cập đến hai cách dọn dẹp dữ liệu có `key` hết hạn của `ThreadLocalMap`: **dọn dẹp thăm dò (`probing cleanup`)** và **dọn dẹp heuristic (`heuristic cleanup`)**.

Trước hết hãy nói về dọn dẹp thăm dò, chính là phương thức `expungeStaleEntry`: duyệt mảng bảng băm từ vị trí bắt đầu về phía sau để thăm dò và dọn sạch dữ liệu hết hạn, gán `Entry` của dữ liệu hết hạn thành `null`; trên đường đi nếu gặp dữ liệu chưa hết hạn thì sẽ `rehash` lại rồi định vị lại trong mảng `table` — nếu vị trí định vị mới đã có dữ liệu thì đặt dữ liệu chưa hết hạn đó vào bucket `Entry=null` gần vị trí đó nhất, giúp `Entry` sau khi `rehash` nằm gần vị trí bucket đúng của nó hơn. Logic hoạt động như sau:

![](/media/jg/local/java/concurrent/images/thread-local/18-186170.png)

Như hình trên, `set(27)` sau khi tính `hash` đáng lẽ rơi vào bucket `index=4`; vì bucket `index=4` đã có dữ liệu nên duyệt tiếp về phía sau và cuối cùng đặt vào bucket `index=7`. Sau một thời gian, `key` của `Entry` tại `index=5` biến thành `null`.

![](/media/jg/local/java/concurrent/images/thread-local/19-c026f2.png)

Nếu sau đó lại có dữ liệu khác được `set` vào `map`, thao tác **dọn dẹp thăm dò** sẽ được kích hoạt.

Như hình trên, sau khi thực hiện **dọn dẹp thăm dò**, dữ liệu tại `index=5` bị xóa sạch; tiếp tục duyệt về phía sau tới phần tử ở `index=7`, sau khi `rehash` thấy `index` đúng của phần tử này là `4`, nhưng vị trí này đã có dữ liệu nên tìm về phía sau nút `Entry=null` gần `index=4` nhất (chính là phần tử vừa được dọn dẹp thăm dò xóa bỏ: `index=5`), tìm thấy rồi thì di chuyển dữ liệu ở `index=7` sang `index=5`, lúc này vị trí bucket đã gần với vị trí đúng `index=4` hơn.

Sau một lượt dọn dẹp thăm dò, các dữ liệu có `key` hết hạn sẽ bị dọn sạch, còn dữ liệu chưa hết hạn sau khi được `rehash` và định vị lại thì vị trí bucket về mặt lý thuyết sẽ gần vị trí `i = key.hashCode & (tab.len - 1)` hơn. Sự tối ưu hóa này giúp cải thiện hiệu năng tra cứu trên toàn bộ bảng băm.

Tiếp theo hãy xem quy trình cụ thể của `expungeStaleEntry()`, chúng ta vẫn đi theo cách minh họa bằng hình trước rồi giải thích mã nguồn sau:

![](/media/jg/local/java/concurrent/images/thread-local/20-b0b370.png)

Giả sử gọi `expungeStaleEntry(3)`: như hình trên ta thấy trạng thái dữ liệu trong `table` của `ThreadLocalMap`, sau đó thực thi thao tác dọn dẹp:

![](/media/jg/local/java/concurrent/images/thread-local/21-99a31f.png)

Bước đầu tiên là xóa sạch dữ liệu tại vị trí `staleSlot` hiện tại, `Entry` ở vị trí `index=3` trở thành `null`. Sau đó tiếp tục thăm dò về phía sau:

![](/media/jg/local/java/concurrent/images/thread-local/22-997db4.png)

Sau khi thực hiện xong bước thứ hai, phần tử ở `index=4` được dời sang slot `index=3`.

Tiếp tục duyệt về phía sau để kiểm tra: khi gặp dữ liệu hợp lệ, tính xem vị trí của dữ liệu đó có bị lệch không; nếu bị lệch thì tính lại vị trí `slot`, mục đích là giúp dữ liệu hợp lệ nằm tại đúng vị trí hoặc càng gần vị trí đúng càng tốt.

![](/media/jg/local/java/concurrent/images/thread-local/23-404130.png)

Trong quá trình duyệt về phía sau, khi gặp một slot trống thì dừng thăm dò — như vậy một lượt dọn dẹp thăm dò đã hoàn tất. Tiếp theo chúng ta cùng xem **mã nguồn triển khai** cụ thể:

```java
private int expungeStaleEntry(int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;

    tab[staleSlot].value = null;
    tab[staleSlot] = null;
    size--;

    Entry e;
    int i;
    for (i = nextIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == null) {
            e.value = null;
            tab[i] = null;
            size--;
        } else {
            int h = k.threadLocalHashCode & (len - 1);
            if (h != i) {
                tab[i] = null;

                while (tab[h] != null)
                    h = nextIndex(h, len);
                tab[h] = e;
            }
        }
    }
    return i;
}
```

Ở đây ta vẫn lấy `staleSlot=3` làm ví dụ minh họa: đầu tiên xóa sạch dữ liệu ở slot `tab[staleSlot]`, rồi giảm `size--`.
Tiếp theo duyệt từ vị trí `staleSlot` về phía sau; nếu gặp dữ liệu hết hạn có `k == null` thì cũng xóa sạch dữ liệu ở slot đó rồi giảm `size--`:

```java
ThreadLocal<?> k = e.get();

if (k == null) {
    e.value = null;
    tab[i] = null;
    size--;
}
```

Nếu `key` chưa hết hạn, tính lại xem vị trí chỉ số lý tưởng của `key` hiện tại có phải là chỉ số slot hiện tại hay không; nếu không phải, điều đó chứng tỏ đã xảy ra xung đột `hash`, lúc này từ vị trí slot đúng vừa tính lại duyệt tiếp về phía sau để tìm vị trí gần nhất có thể lưu được `entry`:

```java
int h = k.threadLocalHashCode & (len - 1);
if (h != i) {
    tab[i] = null;

    while (tab[h] != null)
        h = nextIndex(h, len);

    tab[h] = e;
}
```

Đây là phần xử lý các dữ liệu bình thường từng bị xung đột `Hash`; sau khi duyệt lại, vị trí của các `Entry` từng bị xung đột `Hash` sẽ gần vị trí đúng hơn, nhờ vậy khi tra cứu hiệu năng sẽ cao hơn.

### Cơ chế mở rộng dung lượng (`resize`) của `ThreadLocalMap`

Ở cuối phương thức `ThreadLocalMap.set()`, nếu sau khi thực hiện dọn dẹp heuristic mà không dọn được dữ liệu nào, đồng thời số lượng `Entry` hiện có trong bảng băm đã đạt tới ngưỡng mở rộng dung lượng của bảng `(len*2/3)`, thì bắt đầu thực thi logic `rehash()`:

```java
if (!cleanSomeSlots(i, sz) && sz >= threshold)
    rehash();
```

Tiếp theo hãy xem cài đặt cụ thể của `rehash()`:

```java
private void rehash() {
    expungeStaleEntries();

    if (size >= threshold - threshold / 4)
        resize();
}

private void expungeStaleEntries() {
    Entry[] tab = table;
    int len = tab.length;
    for (int j = 0; j < len; j++) {
        Entry e = tab[j];
        if (e != null && e.get() == null)
            expungeStaleEntry(j);
    }
}
```

Đầu tiên, phương thức này sẽ thực hiện dọn dẹp thăm dò từ vị trí bắt đầu của `table` về phía sau — quy trình dọn dẹp chi tiết đã được phân tích ở trên. Sau khi dọn dẹp xong, trong `table` có thể có một số dữ liệu `Entry` có `key` bằng `null` đã bị dọn bỏ, nên lúc này mới kiểm tra `size >= threshold - threshold / 4` (tức là `size >= threshold * 3/4`) để quyết định có mở rộng dung lượng hay không.

Ta vẫn nhớ ngưỡng ở trên để gọi `rehash()` là `size >= threshold`; vì thế khi nhà tuyển dụng hỏi xoáy về cơ chế mở rộng dung lượng của `ThreadLocalMap`, ta nhất định phải trình bày rõ ràng cả hai bước này:

![](/media/jg/local/java/concurrent/images/thread-local/24-322f02.png)

Tiếp theo, hãy xem phương thức `resize()` cụ thể; để tiện minh họa, ta lấy ví dụ `oldTab.len=8`:

![](/media/jg/local/java/concurrent/images/thread-local/25-add7da.png)

Kích thước của `tab` sau khi mở rộng dung lượng là `oldLen * 2`; sau đó duyệt bảng băm cũ, tính lại vị trí `hash` rồi đưa vào mảng `tab` mới — nếu xảy ra xung đột `hash` thì tìm về phía sau slot gần nhất có `entry` bằng `null`. Sau khi duyệt xong, toàn bộ dữ liệu `entry` hợp lệ trong `oldTab` đều đã được đưa vào `tab` mới, đồng thời tính lại **ngưỡng (`threshold`)** cho lần mở rộng dung lượng tiếp theo của `tab`. Mã nguồn cụ thể như sau:

```java
private void resize() {
    Entry[] oldTab = table;
    int oldLen = oldTab.length;
    int newLen = oldLen * 2;
    Entry[] newTab = new Entry[newLen];
    int count = 0;

    for (int j = 0; j < oldLen; ++j) {
        Entry e = oldTab[j];
        if (e != null) {
            ThreadLocal<?> k = e.get();
            if (k == null) {
                e.value = null;
            } else {
                int h = k.threadLocalHashCode & (newLen - 1);
                while (newTab[h] != null)
                    h = nextIndex(h, newLen);
                newTab[h] = e;
                count++;
            }
        }
    }

    setThreshold(newLen);
    size = count;
    table = newTab;
}
```

### Giải thích chi tiết `ThreadLocalMap.get()`

Ở trên ta đã xem xong mã nguồn phương thức `set()`, bao gồm các thao tác gán dữ liệu, dọn dẹp dữ liệu và tối ưu hóa vị trí bucket dữ liệu; tiếp theo hãy xem nguyên lý của thao tác `get()`.

#### Minh họa bằng hình `ThreadLocalMap.get()`

**Trường hợp thứ nhất:** Thông qua giá trị `key` cần tìm, tính ra vị trí `slot` trong bảng băm; `Entry.key` tại vị trí `slot` đó trùng khớp với `key` đang tìm thì trả về trực tiếp:

![](/media/jg/local/java/concurrent/images/thread-local/26-a9068e.png)

**Trường hợp thứ hai:** `Entry.key` tại vị trí `slot` không trùng với `key` cần tìm:

![](/media/jg/local/java/concurrent/images/thread-local/27-5e85b6.png)

Ta lấy `get(ThreadLocal1)` làm ví dụ: sau khi tính `hash`, vị trí `slot` đúng lẽ ra phải là `4`, nhưng slot `index=4` đã có dữ liệu và giá trị `key` không bằng `ThreadLocal1`, nên cần tiếp tục duyệt về phía sau để tìm.

Khi duyệt tới dữ liệu ở `index=5`, lúc này `Entry.key=null`, kích hoạt một lượt dọn dẹp thăm dò dữ liệu qua phương thức `expungeStaleEntry()`; sau khi thực thi xong, dữ liệu ở `index 5, 8` đều bị thu hồi, còn dữ liệu ở `index 6, 7` đều được dịch chuyển lên trước. Sau khi `index 6, 7` dịch chuyển lên trước, tiếp tục duyệt từ `index=5` về phía sau, kết quả tìm thấy dữ liệu `Entry` có giá trị `key` bằng nhau tại `index=6`, như hình dưới đây:

![](/media/jg/local/java/concurrent/images/thread-local/28-03351d.png)

#### Giải thích chi tiết mã nguồn `ThreadLocalMap.get()`

`java.lang.ThreadLocal.ThreadLocalMap.getEntry()`:

```java
private Entry getEntry(ThreadLocal<?> key) {
    int i = key.threadLocalHashCode & (table.length - 1);
    Entry e = table[i];
    if (e != null && e.get() == key)
        return e;
    else
        return getEntryAfterMiss(key, i, e);
}

private Entry getEntryAfterMiss(ThreadLocal<?> key, int i, Entry e) {
    Entry[] tab = table;
    int len = tab.length;

    while (e != null) {
        ThreadLocal<?> k = e.get();
        if (k == key)
            return e;
        if (k == null)
            expungeStaleEntry(i);
        else
            i = nextIndex(i, len);
        e = tab[i];
    }
    return null;
}
```

### Quy trình dọn dẹp heuristic `key` hết hạn trong `ThreadLocalMap`

Phía trên đã nhiều lần nhắc tới hai phương thức dọn dẹp `key` hết hạn của `ThreadLocalMap`: **dọn dẹp thăm dò (`expungeStaleEntry()`)** và **dọn dẹp heuristic (`cleanSomeSlots()`)**.

Dọn dẹp thăm dò là bắt đầu từ `Entry` hiện tại dọn về phía sau, gặp giá trị `null` thì kết thúc, thuộc dạng **dọn dẹp thăm dò tuyến tính**.

Còn dọn dẹp heuristic được tác giả JDK định nghĩa là: **Heuristically scan some cells looking for stale entries** (quét heuristic một số ô để tìm các phần tử hết hạn).

![](/media/jg/local/java/concurrent/images/thread-local/29-f76822.png)

Mã nguồn cụ thể như sau:

```java
private boolean cleanSomeSlots(int i, int n) {
    boolean removed = false;
    Entry[] tab = table;
    int len = tab.length;
    do {
        i = nextIndex(i, len);
        Entry e = tab[i];
        if (e != null && e.get() == null) {
            n = len;
            removed = true;
            i = expungeStaleEntry(i);
        }
    } while ( (n >>>= 1) != 0);
    return removed;
}
```

### `InheritableThreadLocal`

Khi chúng ta sử dụng `ThreadLocal`, trong các kịch bản bất đồng bộ (asynchronous), luồng con không thể chia sẻ dữ liệu bản sao biến của luồng được tạo trong luồng cha.

Để giải quyết vấn đề này, JDK còn cung cấp lớp `InheritableThreadLocal`. Hãy xem một ví dụ:

```java
public class InheritableThreadLocalDemo {
    public static void main(String[] args) {
        ThreadLocal<String> ThreadLocal = new ThreadLocal<>();
        ThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();
        ThreadLocal.set("父类数据:threadLocal");
        inheritableThreadLocal.set("父类数据:inheritableThreadLocal");

        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("子线程获取父类ThreadLocal数据：" + ThreadLocal.get());
                System.out.println("子线程获取父类inheritableThreadLocal数据：" + inheritableThreadLocal.get());
            }
        }).start();
    }
}
```

Kết quả in ra:

```java
子线程获取父类ThreadLocal数据：null
子线程获取父类inheritableThreadLocal数据：父类数据:inheritableThreadLocal
```

Nguyên lý triển khai là khi luồng con được tạo từ luồng cha bằng cách gọi `new Thread()`, phương thức `Thread#init` sẽ được gọi bên trong constructor của `Thread`. Trong phương thức `init`, dữ liệu của luồng cha được sao chép sang luồng con:

```java
private void init(ThreadGroup g, Runnable target, String name,
                      long stackSize, AccessControlContext acc,
                      boolean inheritThreadLocals) {
    if (name == null) {
        throw new NullPointerException("name cannot be null");
    }

    if (inheritThreadLocals && parent.inheritableThreadLocals != null)
        this.inheritableThreadLocals =
            ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
    this.stackSize = stackSize;
    tid = nextThreadID();
}
```

Tuy nhiên `InheritableThreadLocal` vẫn có nhược điểm: thông thường khi xử lý bất đồng bộ chúng ta đều sử dụng Thread Pool, mà `InheritableThreadLocal` lại gán giá trị bên trong phương thức `init()` khi `new Thread`, trong khi Thread Pool hoạt động theo logic tái sử dụng luồng, nên ở đây sẽ nảy sinh vấn đề.

Tất nhiên, hễ có vấn đề xuất hiện thì sẽ có giải pháp: Alibaba đã mã nguồn mở một thành phần là `TransmittableThreadLocal` có thể giải quyết vấn đề này; ở đây không mở rộng thêm, bạn đọc quan tâm có thể tự tra cứu tài liệu.

### Thực chiến sử dụng `ThreadLocal` trong dự án

#### Kịch bản sử dụng `ThreadLocal`

Hiện tại việc ghi log trong dự án của chúng ta sử dụng `ELK+Logstash`, cuối cùng hiển thị và tìm kiếm trên `Kibana`.

Ngày nay đều là hệ thống phân tán cung cấp dịch vụ thống nhất ra bên ngoài; mối quan hệ lời gọi giữa các dự án/dịch vụ có thể liên kết qua `traceId`, nhưng làm thế nào để truyền `traceId` giữa các dự án khác nhau?

Ở đây chúng ta sử dụng `org.slf4j.MDC` để thực hiện chức năng này, bên trong chính là được triển khai thông qua `ThreadLocal`, cụ thể như sau:

Khi frontend gửi request đến **Dịch vụ A**, **Dịch vụ A** sẽ sinh ra một chuỗi `traceId` tương tự `UUID` và đưa chuỗi này vào `ThreadLocal` của luồng hiện tại; khi gọi **Dịch vụ B**, nó ghi `traceId` vào `Header` của request; khi **Dịch vụ B** nhận request, trước hết sẽ kiểm tra xem trong `Header` của request có `traceId` hay không — nếu có thì ghi vào `ThreadLocal` của luồng bên mình.

![](/media/jg/local/java/concurrent/images/thread-local/30-9557f8.png)

Trong hình, `requestId` chính là `traceId` dùng để liên kết chuỗi lời gọi giữa các hệ thống của chúng ta — khi các hệ thống gọi qua lại với nhau, thông qua `requestId` này có thể truy vết được toàn bộ chuỗi lời gọi tương ứng. Ngoài ra còn có một số kịch bản khác:

![](/media/jg/local/java/concurrent/images/thread-local/31-bc02a8.png)

Đối với những kịch bản này, chúng ta đều có giải pháp tương ứng như dưới đây:

#### Giải pháp khi gọi từ xa bằng Feign

**Dịch vụ gửi request:**

```java
@Component
@Slf4j
public class FeignInvokeInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        String requestId = MDC.get("requestId");
        if (StringUtils.isNotBlank(requestId)) {
            template.header("requestId", requestId);
        }
    }
}
```

**Dịch vụ nhận request:**

```java
@Slf4j
@Component
public class LogInterceptor extends HandlerInterceptorAdapter {

    @Override
    public void afterCompletion(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2, Exception arg3) {
        MDC.remove("requestId");
    }

    @Override
    public void postHandle(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2, ModelAndView arg3) {
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        String requestId = request.getHeader(BaseConstant.REQUEST_ID_KEY);
        if (StringUtils.isBlank(requestId)) {
            requestId = UUID.randomUUID().toString().replace("-", "");
        }
        MDC.put("requestId", requestId);
        return true;
    }
}
```

#### Truyền `requestId` khi gọi bất đồng bộ bằng Thread Pool

Do `MDC` được triển khai dựa trên `ThreadLocal`, nên trong quá trình bất đồng bộ, luồng con không thể lấy được dữ liệu lưu trong `ThreadLocal` của luồng cha; vì vậy ở đây có thể tùy biến bộ thực thi Thread Pool (`ThreadPoolTaskExecutor`) và sửa lại phần xử lý `run()`:

```java
public class MyThreadPoolTaskExecutor extends ThreadPoolTaskExecutor {

    @Override
    public void execute(Runnable runnable) {
        Map<String, String> context = MDC.getCopyOfContextMap();
        super.execute(() -> run(runnable, context));
    }

    @Override
    private void run(Runnable runnable, Map<String, String> context) {
        if (context != null) {
            MDC.setContextMap(context);
        }
        try {
            runnable.run();
        } finally {
            MDC.remove();
        }
    }
}
```

#### Sử dụng MQ để gửi message cho hệ thống bên thứ ba

Định nghĩa thuộc tính tùy biến `requestId` trong phần nội dung message gửi qua MQ; bên nhận sau khi consume message chỉ cần tự phân tích và sử dụng `requestId` đó là được.
