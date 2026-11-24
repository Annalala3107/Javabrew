---
title: Tổng hợp các Concurrent Collections phổ biến trong Java
description: "Tổng hợp toàn diện về các Concurrent Collections trong Java: giải thích chi tiết đặc điểm, kịch bản áp dụng và so sánh hiệu năng của các container thread-safe trong JUC như ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/java-concurrent-collections.md
head:
  - - meta
    - name: keywords
      content: Java Concurrent Collections,ConcurrentHashMap,CopyOnWriteArrayList,BlockingQueue,ConcurrentLinkedQueue,container thread-safe
---

Phần lớn các container này do JDK cung cấp đều nằm trong package `java.util.concurrent`.

- **`ConcurrentHashMap`**: Phiên bản `HashMap` an toàn luồng (thread-safe).
- **`CopyOnWriteArrayList`**: `List` an toàn luồng, có hiệu năng rất tốt trong các trường hợp đọc nhiều ghi ít, vượt trội hoàn toàn so với `Vector`.
- **`ConcurrentLinkedQueue`**: Hàng đợi đồng thời hiệu năng cao, được cài đặt bằng danh sách liên kết. Có thể xem như một `LinkedList` an toàn luồng, đây là một hàng đợi không chặn (non-blocking queue).
- **`BlockingQueue`**: Đây là một interface, bên trong JDK cài đặt interface này thông qua danh sách liên kết, mảng, v.v. Nó biểu thị Blocking Queue (hàng đợi chặn), rất phù hợp để làm kênh chia sẻ dữ liệu.
- **`ConcurrentSkipListMap`**: Cài đặt của Skip List (danh sách nhảy). Đây là một `Map` sử dụng cấu trúc dữ liệu Skip List để tra cứu nhanh.

## ConcurrentHashMap

Chúng ta biết rằng `HashMap` không an toàn luồng; nếu dùng trong kịch bản đồng thời, một cách giải quyết phổ biến là bọc `HashMap` thông qua phương thức `Collections.synchronizedMap()` để nó trở thành an toàn luồng. Tuy nhiên, cách này dùng một khóa toàn cục để đồng bộ các truy cập đồng thời giữa các Thread khác nhau, sẽ gây ra nút thắt cổ chai hiệu năng nghiêm trọng, đặc biệt là trong các kịch bản đồng thời cao.

Để giải quyết vấn đề này, `ConcurrentHashMap` đã ra đời; là phiên bản an toàn luồng của `HashMap`, nó cung cấp năng lực xử lý đồng thời hiệu quả hơn nhiều.

Ở thời kỳ JDK 1.7, `ConcurrentHashMap` chia toàn bộ mảng bucket thành từng phân đoạn (`Segment`, khóa phân đoạn); mỗi khóa chỉ khóa một phần dữ liệu của container (xem sơ đồ bên dưới), nên khi nhiều Thread truy cập dữ liệu ở các phân đoạn khác nhau trong container sẽ không có tranh chấp khóa, giúp nâng cao tỷ lệ truy cập đồng thời.

![Cấu trúc lưu trữ ConcurrentHashMap trong Java 7](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

Đến JDK 1.8, `ConcurrentHashMap` bỏ khóa phân đoạn `Segment` và áp dụng `Node + CAS + synchronized` để đảm bảo an toàn đồng thời. Cấu trúc dữ liệu tương tự cấu trúc của `HashMap` 1.8: mảng + danh sách liên kết / cây đỏ-đen (Red-Black Tree). Java 8 sẽ chuyển đổi danh sách liên kết (độ phức tạp thời gian tìm kiếm là O(N)) sang cây đỏ-đen (độ phức tạp thời gian tìm kiếm là O(log(N))) khi độ dài danh sách liên kết vượt quá một ngưỡng nhất định (8).

Trong Java 8, độ mịn của khóa cho thao tác cập nhật nhỏ hơn: khi cần khóa, `synchronized` chỉ khóa nút đầu của bucket tương ứng, nên các cập nhật trên các bucket khác nhau thường có thể diễn ra đồng thời. Thao tác đọc nói chung không cần khóa và cũng có thể diễn ra đồng thời với thao tác cập nhật.

![Cấu trúc lưu trữ ConcurrentHashMap trong Java 8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

Để tìm hiểu chi tiết về `ConcurrentHashMap`, hãy xem bài viết này của tôi: [Phân tích mã nguồn `ConcurrentHashMap`](./../collection/concurrent-hash-map-source-code.md).

## CopyOnWriteArrayList

Trước khi JDK 1.5 đưa vào `CopyOnWriteArrayList`, ngoài `Vector` xuất hiện từ sớm, người ta cũng có thể bọc `List` thông thường bằng `Collections.synchronizedList()` để có khả năng truy cập đồng bộ. Các phương thức thêm, sửa, xóa, tra cứu của `Vector` hầu như đều gắn `synchronized`, nên từng lời gọi phương thức riêng lẻ có tính an toàn luồng, nhưng các thao tác kết hợp vẫn cần đồng bộ bổ sung.

JDK 1.5 giới thiệu package `java.util.concurrent` (JUC), cung cấp rất nhiều container vừa an toàn luồng vừa có hiệu năng đồng thời tốt, trong đó cài đặt `List` an toàn luồng duy nhất chính là `CopyOnWriteArrayList`.

Đối với phần lớn các kịch bản nghiệp vụ, thao tác đọc thường nhiều hơn rất nhiều so với thao tác ghi. Do thao tác đọc không sửa đổi dữ liệu gốc, việc khóa mỗi lần đọc thực chất là một sự lãng phí tài nguyên. Ngược lại, chúng ta nên cho phép nhiều Thread cùng truy cập đồng thời dữ liệu bên trong của `List`, bởi đối với thao tác đọc thì điều đó là an toàn.

Tư tưởng này rất giống với triết lý thiết kế của khóa đọc-ghi `ReentrantReadWriteLock`: đọc-đọc không loại trừ nhau, đọc-ghi loại trừ nhau, ghi-ghi loại trừ nhau (chỉ đọc-đọc là không loại trừ nhau). `CopyOnWriteArrayList` còn tiến xa hơn một bước dựa trên tư tưởng này. Để đẩy hiệu năng thao tác đọc lên mức tối đa, thao tác đọc trong `CopyOnWriteArrayList` hoàn toàn không cần khóa. Tuyệt vời hơn nữa, thao tác ghi cũng không chặn thao tác đọc, chỉ có ghi-ghi mới loại trừ lẫn nhau. Nhờ vậy, hiệu năng của thao tác đọc có thể được nâng cao vượt bậc.

Cốt lõi tạo nên tính an toàn luồng của `CopyOnWriteArrayList` nằm ở việc nó áp dụng chiến lược **sao chép khi ghi (Copy-On-Write)** — điều này có thể thấy ngay từ chính cái tên `CopyOnWriteArrayList`.

Khi cần sửa đổi nội dung của `CopyOnWriteArrayList` (các thao tác `add`, `set`, `remove`, v.v.), nó không sửa trực tiếp mảng gốc, mà trước tiên sẽ tạo một bản sao của mảng nền tảng, thực hiện sửa đổi trên mảng bản sao đó, rồi sau khi sửa xong mới gán ngược mảng đã sửa trở lại; nhờ vậy có thể đảm bảo thao tác ghi không ảnh hưởng đến thao tác đọc.

Để tìm hiểu chi tiết về `CopyOnWriteArrayList`, hãy xem bài viết này của tôi: [Phân tích mã nguồn `CopyOnWriteArrayList`](./../collection/copyonwritearraylist-source-code.md).

## ConcurrentLinkedQueue

Các `Queue` an toàn luồng do Java cung cấp có thể chia thành **Blocking Queue (hàng đợi chặn)** và **Non-blocking Queue (hàng đợi không chặn)**; trong đó ví dụ điển hình của Blocking Queue là `BlockingQueue`, còn ví dụ điển hình của Non-blocking Queue là `ConcurrentLinkedQueue`. Trong ứng dụng thực tế cần căn cứ vào nhu cầu thực tế để chọn Blocking Queue hay Non-blocking Queue. **Blocking Queue có thể được cài đặt thông qua khóa (lock), còn Non-blocking Queue có thể được cài đặt thông qua thao tác CAS.**

Từ tên gọi có thể thấy hàng đợi `ConcurrentLinkedQueue` sử dụng danh sách liên kết làm cấu trúc dữ liệu của mình. `ConcurrentLinkedQueue` có thể xem là hàng đợi có hiệu năng tốt nhất trong môi trường đồng thời cao. Sở dĩ nó có hiệu năng tốt như vậy là nhờ cài đặt nội bộ phức tạp của nó.

Chúng ta sẽ không phân tích mã nguồn bên trong của `ConcurrentLinkedQueue` ở đây; mọi người chỉ cần biết rằng `ConcurrentLinkedQueue` chủ yếu sử dụng thuật toán không chặn CAS để hiện thực hóa an toàn luồng là được.

`ConcurrentLinkedQueue` phù hợp với những kịch bản đòi hỏi hiệu năng tương đối cao, đồng thời việc đọc và ghi hàng đợi có nhiều Thread thực hiện cùng lúc — tức là nếu chi phí khóa hàng đợi tương đối cao thì phù hợp sử dụng `ConcurrentLinkedQueue` không khóa (lock-free) để thay thế.

## BlockingQueue

### Giới thiệu BlockingQueue

Ở trên chúng ta đã nhắc tới `ConcurrentLinkedQueue` như một hàng đợi không chặn hiệu năng cao. Tiếp theo, chúng ta sẽ nói về hàng đợi chặn — `BlockingQueue`. Blocking Queue (`BlockingQueue`) được sử dụng rộng rãi trong bài toán "Nhà sản xuất - Người tiêu dùng" (Producer-Consumer), lý do là `BlockingQueue` cung cấp các phương thức chèn và lấy ra có khả năng chặn. Khi thùng chứa hàng đợi đã đầy, Thread sản xuất sẽ bị chặn cho đến khi hàng đợi chưa đầy; khi thùng chứa hàng đợi trống, Thread tiêu dùng sẽ bị chặn cho đến khi hàng đợi không còn trống.

`BlockingQueue` là một interface kế thừa từ `Queue`, nên các lớp cài đặt của nó cũng có thể dùng như một cài đặt của `Queue`, còn `Queue` lại kế thừa từ interface `Collection`. Dưới đây là các lớp cài đặt liên quan của `BlockingQueue`:

![Các lớp cài đặt của BlockingQueue](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/51622268-4ec848dd.png)

Dưới đây chủ yếu giới thiệu 3 lớp cài đặt phổ biến của `BlockingQueue`: `ArrayBlockingQueue`, `LinkedBlockingQueue` và `PriorityBlockingQueue`.

### ArrayBlockingQueue

`ArrayBlockingQueue` là lớp cài đặt hàng đợi có giới hạn (bounded queue) của interface `BlockingQueue`, tầng dưới sử dụng mảng để cài đặt.

```java
public class ArrayBlockingQueue<E>
extends AbstractQueue<E>
implements BlockingQueue<E>, Serializable{}
```

Một khi đã được khởi tạo, dung lượng của `ArrayBlockingQueue` không thể thay đổi. Kiểm soát đồng thời của nó sử dụng khóa tái nhập `ReentrantLock`; dù là thao tác chèn hay thao tác đọc, đều cần lấy được khóa rồi mới có thể thực hiện. Khi dung lượng hàng đợi đầy, cố gắng đưa phần tử vào hàng đợi sẽ khiến thao tác bị chặn; cố gắng lấy một phần tử từ hàng đợi rỗng cũng sẽ bị chặn tương tự.

Mặc định `ArrayBlockingQueue` không đảm bảo tính công bằng cho các Thread đang chờ truy cập hàng đợi. Sau khi bật chính sách công bằng (fair policy), khi có tranh chấp hàng đợi sẽ cấp quyền truy cập cho các Producer hoặc Consumer đang chờ theo thứ tự FIFO; điều này mô tả thứ tự chờ trong hàng đợi, không đồng nghĩa với việc hệ điều hành lập lịch các Thread hoàn toàn theo thời gian đồng hồ thực (wall-clock time). Ở chế độ không công bằng (non-fair), các Thread bị chặn lâu vẫn có thể không kịp thời truy cập hàng đợi. Chính sách công bằng thường làm giảm thông lượng (throughput); nếu cần có thể dùng đoạn mã sau:

```java
private static ArrayBlockingQueue<Integer> blockingQueue = new ArrayBlockingQueue<Integer>(10,true);
```

### LinkedBlockingQueue

`LinkedBlockingQueue` là hàng đợi chặn có tầng dưới cài đặt dựa trên **danh sách liên kết đơn**, có thể dùng như hàng đợi không giới hạn hoặc hàng đợi có giới hạn, cũng thỏa mãn đặc tính FIFO và có thông lượng cao hơn so với `ArrayBlockingQueue`. Để tránh việc dung lượng `LinkedBlockingQueue` tăng nhanh và tiêu tốn lượng lớn bộ nhớ, thông thường khi tạo đối tượng `LinkedBlockingQueue` người ta sẽ chỉ định kích thước của nó; nếu không chỉ định, dung lượng sẽ bằng `Integer.MAX_VALUE`.

**Các constructor liên quan:**

```java
    /**
     * Hàng đợi không giới hạn theo một nghĩa nào đó
     * Creates a {@code LinkedBlockingQueue} with a capacity of
     * {@link Integer#MAX_VALUE}.
     */
    public LinkedBlockingQueue() {
        this(Integer.MAX_VALUE);
    }

    /**
     * Hàng đợi có giới hạn
     * Creates a {@code LinkedBlockingQueue} with the given (fixed) capacity.
     *
     * @param capacity the capacity of this queue
     * @throws IllegalArgumentException if {@code capacity} is not greater
     *         than zero
     */
    public LinkedBlockingQueue(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException();
        this.capacity = capacity;
        last = head = new Node<E>(null);
    }
```

### PriorityBlockingQueue

`PriorityBlockingQueue` là một hàng đợi chặn không giới hạn có hỗ trợ độ ưu tiên. Mặc định các phần tử được sắp xếp theo thứ tự tự nhiên; cũng có thể chỉ định quy tắc sắp xếp bằng cách tự định nghĩa lớp cài đặt phương thức `compareTo()`, hoặc truyền tham số `Comparator` qua constructor khi khởi tạo.

`PriorityBlockingQueue` sử dụng khóa tái nhập `ReentrantLock` để kiểm soát đồng thời và là hàng đợi không giới hạn (`ArrayBlockingQueue` là hàng đợi có giới hạn, `LinkedBlockingQueue` cũng có thể chỉ định dung lượng tối đa bằng cách truyền `capacity` vào constructor, nhưng `PriorityBlockingQueue` chỉ có thể chỉ định kích thước ban đầu của hàng đợi; sau này khi chèn phần tử, **nếu không đủ chỗ nó sẽ tự động mở rộng dung lượng**).

Nói một cách đơn giản, nó là phiên bản an toàn luồng của `PriorityQueue`. Không được chèn giá trị null; đồng thời đối tượng chèn vào hàng đợi phải có khả năng so sánh được (`comparable`), nếu không sẽ báo ngoại lệ `ClassCastException`. Thao tác chèn `put` của nó sẽ không bị block vì nó là hàng đợi không giới hạn (phương thức `take` sẽ bị chặn khi hàng đợi rỗng).

**Bài viết đề xuất:** [Đọc hiểu hàng đợi đồng thời BlockingQueue trong Java](https://javadoop.com/post/java-concurrent-queue)

## ConcurrentSkipListMap

> Phần nội dung dưới đây tham khảo chuyên mục trên GeekTime [*Vẻ đẹp của Cấu trúc dữ liệu và Giải thuật*](https://time.geekbang.org/column/intro/126?code=zl3GYeAsRI4rEJIBNu5B/km7LSZsPDlGWQEpAYw5Vu0=&utm_term=SPoster "Vẻ đẹp của Cấu trúc dữ liệu và Giải thuật") và cuốn *Thực chiến thiết kế chương trình đồng thời cao Java*.

Để dẫn nhập vào `ConcurrentSkipListMap`, trước tiên hãy cùng tìm hiểu sơ qua về Skip List (danh sách nhảy).

Đối với một danh sách liên kết đơn, ngay cả khi danh sách đã được sắp xếp, nếu chúng ta muốn tìm một dữ liệu nào đó trong đó thì cũng chỉ có thể duyệt danh sách từ đầu đến cuối, khiến hiệu quả tự nhiên bị thấp; Skip List thì khác. Skip List là một cấu trúc dữ liệu có thể dùng để tra cứu nhanh, hơi giống với cây cân bằng (balanced tree). Cả hai đều có thể tra cứu phần tử một cách nhanh chóng. Nhưng một điểm khác biệt quan trọng là: việc chèn và xóa trên cây cân bằng thường rất dễ dẫn đến việc phải điều chỉnh lại toàn cục cây cân bằng một lần, trong khi việc chèn và xóa trên Skip List chỉ cần thao tác cục bộ trên toàn bộ cấu trúc dữ liệu là được. Lợi ích mang lại là: trong tình huống đồng thời cao, bạn sẽ cần một khóa toàn cục để đảm bảo an toàn luồng cho toàn bộ cây cân bằng, còn đối với Skip List, bạn chỉ cần khóa một phần là đủ. Nhờ vậy, trong môi trường đồng thời cao, bạn có thể đạt được hiệu năng tốt hơn. Về mặt hiệu năng truy vấn, độ phức tạp thời gian của Skip List cũng là **O(log n)**, nên trong các cấu trúc dữ liệu đồng thời, JDK sử dụng Skip List để cài đặt một `Map`.

Bản chất của Skip List là đồng thời duy trì nhiều danh sách liên kết, và các danh sách liên kết được phân tầng:

![Skip List chỉ mục 2 tầng](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/93666217-abaee06c.jpg)

Danh sách liên kết ở tầng thấp nhất duy trì toàn bộ các phần tử trong Skip List, mỗi danh sách liên kết ở tầng trên đều là tập con của tầng ngay bên dưới nó.

Các phần tử trong toàn bộ các danh sách liên kết của Skip List đều đã được sắp xếp. Khi tìm kiếm, có thể bắt đầu tìm từ danh sách liên kết ở tầng cao nhất. Một khi phát hiện phần tử cần tìm nhỏ hơn nút kế tiếp của nút đang truy cập (hoặc nút kế tiếp là rỗng), sẽ chuyển xuống danh sách liên kết ở tầng kế dưới để tiếp tục tìm. Điều này có nghĩa là trong quá trình tìm kiếm, việc tìm kiếm diễn ra theo kiểu nhảy cóc. Như minh họa ở hình trên, tìm kiếm phần tử 18 trong Skip List:

![Tìm kiếm phần tử 18 trong Skip List](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/32005738-4bbbf9bd.jpg)

Khi tìm 18, ban đầu cần duyệt 18 lần, nay chỉ cần 7 lần là xong. Đối với những trường hợp độ dài danh sách liên kết tương đối lớn, việc xây dựng chỉ mục giúp nâng cao hiệu quả tìm kiếm sẽ trở nên vô cùng rõ rệt.

Từ những phân tích trên có thể dễ dàng thấy rằng: **Skip List là một thuật toán đánh đổi không gian lấy thời gian.**

Một điểm khác biệt nữa giữa việc dùng Skip List cài đặt `Map` và dùng thuật toán băm (Hash) cài đặt `Map` là: hàm băm không lưu giữ thứ tự của phần tử, còn tất cả phần tử trong Skip List đều được sắp xếp. Do đó khi duyệt Skip List, bạn sẽ thu được một kết quả có thứ tự. Vì vậy, nếu ứng dụng của bạn cần tính có thứ tự, thì Skip List chính là lựa chọn số một. Lớp trong JDK hiện thực hóa cấu trúc dữ liệu này chính là `ConcurrentSkipListMap`.

## Tài liệu tham khảo

- *Thực chiến thiết kế chương trình đồng thời cao Java* (*Practical Java High-Concurrency Programming Design*)
- <https://javadoop.com/post/java-concurrent-queue>
- <https://juejin.im/post/5aeebd02518825672f19c546>
