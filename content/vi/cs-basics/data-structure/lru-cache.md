---
title: "Tổng hợp câu hỏi phỏng vấn về LRU Cache: Hash Table, Doubly Linked List và LinkedHashMap"
description: Tổng hợp câu hỏi phỏng vấn về LRU Cache, giải thích chiến lược đào thải cache LRU, triển khai kết hợp Hash Table và Doubly Linked List, cách dùng LinkedHashMap trong Java, độ phức tạp và các kịch bản bộ nhớ đệm thực tế.
category: Khoa học Máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: LRU Cache,LRU,Đào thải cache,Bảng băm,Danh sách liên kết đôi,LinkedHashMap,Java LRU,Thay thế trang,Phỏng vấn Cấu trúc dữ liệu
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/lru-cache.md
---

LRU là viết tắt của cụm từ Least Recently Used, có nghĩa là "ít được sử dụng gần đây nhất". Khi dung lượng cache đạt giới hạn tối đa, hệ thống cần đào thải (loại bỏ) những dữ liệu đã lâu nhất không được truy cập.

Trong các buổi phỏng vấn kỹ thuật, yêu cầu tự tay lập trình (handwrite) một LRU Cache xuất hiện với tần suất rất cao. Lý do là vì nó kết hợp hài hòa giữa Hash Table và Doubly Linked List (danh sách liên kết đôi): Hash Table chịu trách nhiệm tìm kiếm node trong `O(1)`, trong khi Doubly Linked List chịu trách nhiệm di chuyển node và xóa node cuối danh sách trong `O(1)`.

Tổng quan nội dung bài viết:

1. LRU Cache là gì?
2. Tại sao LRU lại thích hợp làm chiến lược đào thải cache?
3. Tại sao cần kết hợp Hash Table + Doubly Linked List?
4. Làm thế nào để tự code `get` và `put`?
5. `LinkedHashMap` trong Java triển khai LRU như thế nào?
6. LRU trong các hệ thống thực tế cần cân nhắc thêm những gì?

![LRU Cache duy trì thứ tự truy cập gần nhất thông qua Hash Table và Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/lru-cache-6035d197.png)

## LRU Cache là gì?

Mâu thuẫn cốt lõi của bộ nhớ đệm (cache) là: không gian lưu trữ thì hữu hạn, nhưng chúng ta lại muốn giữ lại trong bộ nhớ tối đa những dữ liệu mà "trong tương lai vẫn sẽ được truy cập".

Vấn đề là chương trình không thể biết trước tương lai. Cách tiếp cận của LRU là lấy tiêu chí "được truy cập gần đây" làm ước lượng dự đoán cho khả năng "tiếp tục được truy cập trong tương lai gần". Nếu một dữ liệu vừa mới được truy cập, nhiều khả năng nó sẽ sớm được truy cập lại; nếu một dữ liệu đã lâu không được động tới, khi bộ nhớ đệm đầy thì dữ liệu này sẽ được ưu tiên loại bỏ trước.

Lấy một ví dụ, với bộ nhớ đệm có dung lượng là 2 được truy cập theo thứ tự sau:

```text
put(1, 1)
put(2, 2)
get(1)
put(3, 3)
```

Trước thời điểm gọi `put(3, 3)`, trong cache đang chứa `1` và `2`. Dù `1` được thêm vào sớm hơn `2`, nhưng nó vừa được truy cập lại qua thao tác `get(1)`. Do đó, phần tử ít được sử dụng gần đây nhất lúc này là `2`, và cuối cùng phần tử bị loại bỏ sẽ là `2`.

Ví dụ này cũng làm sáng tỏ một nguyên lý quan trọng: LRU không xét xem "ai được thêm vào trước", mà quan tâm đến "ai đã lâu nhất không được truy cập".

## Tại sao cần chiến lược đào thải cache?

Bộ nhớ đệm không bao giờ là vô hạn. Cho dù là cache trong bộ nhớ JVM (local in-memory cache), Redis, Buffer Pool của cơ sở dữ liệu, hay page cache của hệ điều hành, tất cả đều phải đối mặt với giới hạn dung lượng.

Sau khi dung lượng bị đầy, nếu không có chiến lược đào thải, hệ thống chỉ có thể từ chối dữ liệu mới hoặc xóa dữ liệu một cách ngẫu nhiên. Xóa ngẫu nhiên dĩ nhiên rất đơn giản, nhưng lại có nguy cơ xóa nhầm những dữ liệu đang rất "nóng" (hot data), làm sụt giảm nghiêm trọng tỷ lệ trúng cache (hit rate). LRU tận dụng tính tuần tự của thời gian truy cập để đưa ra một phán đoán mang tính thực nghiệm: dữ liệu lâu ngày không được chạm tới thì xác suất được truy cập lại trong thời gian ngắn tới thường sẽ thấp hơn.

So sánh nhanh các chiến lược đào thải phổ biến:

| Chiến lược | Căn cứ đào thải | Đặc điểm |
| --- | --- | --- |
| FIFO | Dữ liệu vào cache sớm nhất | Triển khai đơn giản, nhưng không quan tâm dữ liệu sau đó có được truy cập thường xuyên hay không |
| LRU | Dữ liệu lâu nhất chưa được truy cập | Phù hợp với các mô hình truy cập có tính cục bộ thời gian (temporal locality) |
| LFU | Dữ liệu có số lần truy cập ít nhất | Phù hợp cho kịch bản có điểm nóng dữ liệu lâu dài, nhưng cần duy trì bộ đếm tần suất |
| TTL | Thời gian hết hạn | Phù hợp cho dữ liệu có vòng đời rõ ràng, không tương đương với đào thải theo dung lượng |

LRU thường xuyên được đem ra phỏng vấn vì nó vừa gắn liền với các kịch bản kỹ thuật thực tế, vừa kiểm tra rất tốt năng lực phối hợp các cấu trúc dữ liệu cơ bản.

## Trọng tâm ôn luyện phỏng vấn

- Trình bày rõ tại sao chỉ dùng riêng Hash Table hoặc chỉ dùng riêng Linked List đều không đủ.
- Tự viết được logic `get` và `put`.
- Giải thích được đầu và cuối của Doubly Linked List đại diện cho điều gì.
- Xử lý mượt mà các trường hợp biên như đầy dung lượng, cập nhật key đã tồn tại, xóa node ở cuối danh sách.
- Nắm được cách triển khai LRU bằng `LinkedHashMap` trong Java.

## Thứ tự truy cập của LRU được duy trì như thế nào?

Trong LRU Cache, mỗi một lần truy cập đều làm thay đổi mức độ "mới - cũ" của dữ liệu.

Thông thường chúng ta sẽ quy ước:

- Đầu danh sách liên kết biểu thị dữ liệu được sử dụng gần đây nhất (MRU - Most Recently Used).
- Cuối danh sách liên kết biểu thị dữ liệu lâu nhất chưa được sử dụng (LRU - Least Recently Used).
- Khi `get(key)` trúng cache (hit), chuyển node tương ứng lên đầu danh sách.
- Trong `put(key, value)`, nếu là key mới, chèn node mới vào đầu danh sách.
- Trong `put(key, value)`, nếu là key đã tồn tại, sau khi cập nhật value cũng phải di chuyển node đó lên đầu danh sách.
- Khi dung lượng vượt quá giới hạn cho phép, xóa bỏ node ở cuối danh sách.

Điểm dễ bị bỏ sót nhất ở đây chính là thao tác `get()`. Rất nhiều bạn nghĩ rằng `get()` chỉ là đọc dữ liệu nên không làm thay đổi cấu trúc. Nhưng đối với LRU, đọc dữ liệu cũng là một lần truy cập; chỉ cần trúng cache, thời gian sử dụng gần nhất của key này lập tức được làm mới.

## Thiết kế cấu trúc dữ liệu

| Thành phần | Vai trò |
| --- | --- |
| `HashMap<Integer, Node>` | Tìm kiếm nhanh node trong danh sách liên kết theo key |
| Doubly Linked List (Danh sách liên kết đôi) | Sắp xếp theo thời gian truy cập: đầu là dùng gần nhất, cuối là lâu nhất chưa dùng |
| Node giả đầu và cuối (Dummy Head & Tail) | Đơn giản hóa các trường hợp biên khi chèn và xóa |

Sau khi truy cập một key, ta cần đưa nó lên đầu danh sách. Khi chèn key mới, cũng đưa lên đầu danh sách. Khi vượt quá dung lượng, xóa node đứng ngay trước node giả đuôi (`tail`).

Tại sao bắt buộc phải phối hợp cả hai cấu trúc?

Nếu chỉ dùng riêng Hash Table: có thể tìm value trong `O(1)`, nhưng không biết được key nào lâu nhất chưa được dùng. Bạn sẽ phải mất thêm công sức duy trì thứ tự truy cập.

Nếu chỉ dùng riêng Linked List: có thể duy trì tốt thứ tự truy cập, node ở đuôi chính là node cần đào thải. Nhưng mỗi lần tìm node theo key đều phải duyệt tuần tự từ đầu tới cuối với độ phức tạp `O(n)`.

Hash Table + Doubly Linked List bổ khuyết hoàn hảo cho nhau:

- Hash Table giúp chúng ta định vị trực tiếp node trong danh sách liên kết theo key trong `O(1)`.
- Doubly Linked List cho phép chúng ta di chuyển node bất kỳ và xóa node ở đuôi trong `O(1)`.
- Trong node lưu đồng thời cả key và value để khi đào thải node đuôi, hệ thống có thể dựa vào key để xóa bỏ entry tương ứng trong Hash Table.

## Lộ trình tự code khi phỏng vấn

Code của LRU có khá nhiều chi tiết con trỏ, không nên bắt đầu bằng việc viết ngay một class đồ sộ. Khi phỏng vấn, bạn nên bóc tách các thao tác thành từng bước rõ ràng:

1. Xác định quy ước thứ tự danh sách: đầu là dùng gần nhất, đuôi là lâu nhất chưa dùng.
2. Định nghĩa hàm `get`: không tìm thấy trả về `-1`, tìm thấy thì di chuyển node lên đầu danh sách.
3. Định nghĩa hàm `put`: key đã tồn tại thì cập nhật giá trị và chuyển lên đầu; key mới thì chèn vào đầu.
4. Xử lý đào thải khi vượt quá dung lượng: xóa node đứng trước node giả đuôi và xóa key tương ứng trong Hash Table.
5. Đóng gói các thao tác danh sách liên kết thành các phương thức độc lập: `addToHead`, `remove`, `moveToHead`, `removeTail`.

Cách viết này giúp hàm `get` và `put` chỉ cần kết hợp các hàm nguyên tử trên danh sách, không phải đổi con trỏ lặp đi lặp lại trong luồng xử lý chính, giảm thiểu tối đa rủi ro bug.

## Tại sao phải dùng danh sách liên kết đôi (Doubly Linked List)?

Để đưa một node lên đầu danh sách, ta cần tháo node đó ra khỏi vị trí hiện tại của nó, rồi chèn vào ngay sau node đầu danh sách.

Nếu dùng danh sách liên kết đơn (Singly Linked List), khi muốn xóa node hiện tại, ta bắt buộc phải biết node tiền nhiệm (predecessor) đứng trước nó. Dù Hash Table tìm được ngay node hiện tại trong `O(1)`, nó cũng không thể tìm được node đứng trước nếu không duyệt lại từ đầu.

Node trong danh sách liên kết đôi có cả con trỏ `prev` và `next`, việc xóa một node bất kỳ chỉ cần thay đổi 4 con trỏ:

```java
node.prev.next = node.next;
node.next.prev = node.prev;
```

Đây chính là nguyên nhân mấu chốt khiến LRU bắt buộc phải dùng danh sách liên kết đôi: nó không chỉ cần xóa node ở đuôi, mà trong thao tác `get()` trúng đích và `put()` cập nhật key cũ, nó còn phải di chuyển một node bất kỳ ở giữa danh sách lên đầu.

Node giả đầu và cuối (sentinel / dummy node) cũng rất quan trọng. Có hai node lính gác `head` và `tail`, các thao tác chèn đầu, xóa đuôi hay xử lý danh sách rỗng đều dùng chung một logic chuẩn mực, không cần viết rải rác các lệnh kiểm tra `null`.

## Tự code LRU Cache bằng Java

```java
class LRUCache {
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0);
    private final Node tail = new Node(0, 0);

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }
        moveToHead(node);
        return node.value;
    }

    void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {
            node.value = value;
            moveToHead(node);
            return;
        }
        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);
        if (map.size() > capacity) {
            Node removed = removeTail();
            map.remove(removed.key);
        }
    }

    private void moveToHead(Node node) {
        remove(node);
        addToHead(node);
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private Node removeTail() {
        Node node = tail.prev;
        remove(node);
        return node;
    }

    private static class Node {
        int key;
        int value;
        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }
}
```

Độ phức tạp thời gian của cả `get` và `put` đều là `O(1)`, độ phức tạp không gian là `O(capacity)`.

## Minh họa quá trình vận hành

Giả sử dung lượng cache là 2, thực thi lần lượt các lệnh sau:

```text
put(1, 1)
put(2, 2)
get(1)
put(3, 3)
```

Trạng thái biến đổi của danh sách liên kết như sau (phía bên trái đại diện cho phần tử sử dụng gần nhất):

| Thao tác | Trạng thái danh sách | Giải thích |
| --- | --- | --- |
| Trạng thái ban đầu | Rỗng | Head và tail giả nối với nhau, cache đang rỗng |
| `put(1, 1)` | `1` | Chèn node mới vào đầu danh sách |
| `put(2, 2)` | `2 -> 1` | `2` là phần tử dùng gần nhất |
| `get(1)` | `1 -> 2` | Sau khi truy cập `1`, chuyển nó lên đầu danh sách |
| `put(3, 3)` | `3 -> 1` | Vượt quá dung lượng, đào thải node `2` ở đuôi |

Bảng này giúp làm rõ hai lưu ý quan trọng: khi truy cập một node đã tồn tại thì phải làm mới thứ tự sử dụng của nó; khi đào thải node, node bị xóa là node ít dùng nhất ở đuôi danh sách, chứ không phải node mới chèn vào.

## Triển khai bằng LinkedHashMap

Lớp `LinkedHashMap` của Java hỗ trợ sẵn việc duy trì thứ tự phần tử theo thứ tự truy cập:

```java
class LRUCacheWithLinkedHashMap extends LinkedHashMap<Integer, Integer> {
    private final int capacity;

    LRUCacheWithLinkedHashMap(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}
```

Tham số thứ ba trong hàm khởi tạo, `accessOrder`, được đặt thành `true`, biểu thị rằng các phần tử được sắp xếp theo thứ tự truy cập thay vì thứ tự chèn ban đầu.

Tài liệu chính thức của `LinkedHashMap` cũng nhấn mạnh chế độ access-order này rất thích hợp để xây dựng LRU Cache. Có 2 điểm cần ghi nhớ:

1. Khi `accessOrder = false`, thứ tự duyệt là thứ tự chèn; khi `accessOrder = true`, thứ tự duyệt là thứ tự truy cập.
2. Phương thức `removeEldestEntry()` sẽ tự động được gọi sau khi chèn một entry mới; nếu trả về `true`, entry cũ nhất sẽ bị xóa bỏ.

Tuy nhiên, `LinkedHashMap` không an toàn trong môi trường đa luồng (thread-safe). Nếu muốn dùng trực tiếp nó làm local cache trong môi trường đa luồng, bạn cần tự đồng bộ hóa bằng lock hoặc chuyển sang các thư viện chuyên dụng.

## Mối quan hệ giữa LRU và Redis

Khi được sử dụng làm bộ nhớ đệm, Redis cũng cần thực thi chiến lược đào thải một khi dung lượng bộ nhớ chạm ngưỡng `maxmemory`. Redis hỗ trợ các chiến lược như `allkeys-lru`, `volatile-lru`:

- `allkeys-lru`: Đào thải key ít được sử dụng gần đây nhất trong toàn bộ các key.
- `volatile-lru`: Chỉ đào thải key ít được sử dụng gần đây nhất trong nhóm các key đã được thiết lập thời gian hết hạn (TTL).

Tuy nhiên, LRU trong Redis không phải là "LRU chính xác tuyệt đối" như trong bài toán code phỏng vấn. Để tiết kiệm bộ nhớ và chu kỳ CPU, Redis sử dụng cơ chế LRU xấp xỉ (Approximate LRU): nó lấy mẫu ngẫu nhiên một nhóm nhỏ các key, rồi chọn ra key có thời gian truy cập lâu nhất trong số đó để loại bỏ. Số lượng mẫu ngẫu nhiên này có thể điều chỉnh qua tham số cấu hình `maxmemory-samples`.

Điều này giúp chúng ta nhận ra sự khác biệt giữa phỏng vấn và thực tế: bài toán phỏng vấn thường yêu cầu dùng Hash Table + Doubly Linked List để đạt LRU chính xác; còn các hệ thống công nghiệp lớn sẽ chấp nhận đánh đổi giữa bộ nhớ, thông lượng, tính tương tranh và tỷ lệ trúng cache.

## Các kịch bản ứng dụng trong thực tế

- Đào thải bộ nhớ đệm cục bộ (local cache eviction).
- Thay thế trang nhớ trong hệ điều hành (page replacement).
- Đệm dữ liệu điểm nóng (hotspot data cache).
- Bộ đệm kết quả dung lượng nhỏ trong API Gateway, Client SDK hoặc Middleware.

Trong các dự án thực tế, người ta còn phải xử lý các vấn đề như thread safety, thời gian hết hạn (TTL), dung lượng bộ nhớ tối đa, các chỉ số thống kê và callback đào thải. Bài toán phỏng vấn chủ yếu kiểm tra khả năng phối hợp cấu trúc dữ liệu, nên không cần đưa hết các chi tiết này vào mã nguồn.

Nếu làm việc với các dự án Java, đa số trường hợp chúng ta sẽ không tự code LRU mà sẽ sử dụng thẳng các thư viện caching mạnh mẽ như Caffeine. Lý do rất thực tế: cache trong production không chỉ cần đào thải theo dung lượng, mà còn phải quản lý thời gian hết hạn, đa luồng, tự động tải dữ liệu (loading), thống kê metrics, làm mới bất đồng bộ (async refresh), trọng số riêng cho từng entry. Trong tài liệu của Caffeine, việc đào thải được phân loại rất chi tiết thành dựa trên kích thước, dựa trên thời gian và dựa trên tham chiếu.

## Các câu hỏi truy vấn khi phỏng vấn

| Câu hỏi truy vấn | Trọng tâm trả lời |
| --- | --- |
| Tại sao không dùng riêng `HashMap`? | `HashMap` tìm được giá trị nhưng không biết key nào lâu nhất chưa được dùng. |
| Tại sao không dùng riêng Linked List? | Linked List duy trì được thứ tự nhưng tìm kiếm node theo key lại tốn `O(n)`. |
| Tại sao phải dùng Doubly Linked List? | Khi xóa một node bất kỳ cần nối lại cả node trước và node sau; danh sách liên kết đơn không thể tìm node trước trong `O(1)`. |
| Tại sao phải dùng node giả đầu và cuối? | Thống nhất logic chèn/xóa cho danh sách rỗng, node đầu và node đuôi, giảm bớt các câu lệnh rẽ nhánh rườm rà. |
| `LinkedHashMap` triển khai LRU như thế nào? | Bật cờ `accessOrder = true` khi khởi tạo và ghi đè phương thức `removeEldestEntry` để giới hạn dung lượng. |
| Cache trong thực tế cần quan tâm thêm gì? | An toàn đa luồng (thread safety), thời gian hết hạn, giới hạn bộ nhớ, callback đào thải, thống kê tỷ lệ trúng và phòng chống sụp đổ bộ nhớ đệm (cache breakdown). |

## Các điểm dễ nhầm lẫn

- Khi cập nhật một key đã tồn tại, cũng phải chuyển node đó lên đầu danh sách.
- Sau khi xóa node ở đuôi danh sách, đừng quên xóa key tương ứng trong Hash Table.
- Khi xóa node trong danh sách liên kết đôi, phải cập nhật đồng thời cả hai con trỏ trước và sau.
- Node giả đầu và đuôi giúp loại bỏ việc phải kiểm tra ranh giới danh sách rỗng phức tạp.
- Cần đặt `accessOrder = true` khi sử dụng `LinkedHashMap`.

## Tự kiểm tra câu hỏi tần suất cao

- Tại sao LRU cần sự phối hợp giữa Hash Table và Doubly Linked List?
- Tại sao thao tác `get` cũng phải di chuyển node?
- Khi cập nhật key đã tồn tại, tại sao không thể chỉ sửa mỗi value?
- Sau khi đào thải node ở đuôi, tại sao còn phải xóa key khỏi Hash Table?
- Sự khác nhau giữa thứ tự chèn (insertion order) và thứ tự truy cập (access order) trong `LinkedHashMap` là gì?

## Bài tập rèn luyện đề xuất

- [146. LRU Cache](https://leetcode.cn/problems/lru-cache/)
- [460. LFU Cache](https://leetcode.cn/problems/lfu-cache/)

## Tài liệu tham khảo

- [Java SE 17 API: LinkedHashMap](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/LinkedHashMap.html)
- [Redis Docs: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/)
- [Caffeine Wiki: Eviction](https://github.com/ben-manes/caffeine/wiki/Eviction)
