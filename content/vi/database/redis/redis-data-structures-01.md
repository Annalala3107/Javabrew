---
title: Giải thích chi tiết 5 kiểu dữ liệu cơ bản của Redis
description: Giải thích chi tiết cách sử dụng và kịch bản ứng dụng của năm kiểu dữ liệu cơ bản trong Redis gồm String, List, Set, Hash, Zset, đồng thời phân tích sâu nguyên lý triển khai các cấu trúc dữ liệu nền tảng như SDS, SkipList, ZipList.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Kiểu dữ liệu Redis,String,List,Set,Hash,Zset,SDS,SkipList,ZipList,Lệnh Redis
lang: vi
sourceRef: zh-ref/database/redis/redis-data-structures-01.md
---

Redis có tổng cộng 5 kiểu dữ liệu cơ bản: String (chuỗi), List (danh sách), Set (tập hợp), Hash (bảng băm) và Zset (tập hợp có thứ tự / Sorted Set).

5 kiểu dữ liệu này được cung cấp trực tiếp cho người dùng sử dụng dưới dạng hình thức lưu trữ dữ liệu, còn phần cài đặt bên dưới của chúng chủ yếu dựa vào 8 cấu trúc dữ liệu sau: Simple Dynamic String (`SDS` — chuỗi động đơn giản), `LinkedList` (danh sách liên kết đôi), `Dict` (bảng băm / từ điển), `SkipList` (danh sách nhảy), `Intset` (tập hợp số nguyên), `ZipList` (danh sách nén) và `QuickList` (danh sách nhanh).

Bảng đối chiếu giữa 5 kiểu dữ liệu cơ bản của Redis và các cấu trúc dữ liệu cài đặt bên dưới như sau:

| String | List                         | Hash          | Set          | Zset              |
| :----- | :--------------------------- | :------------ | :----------- | :---------------- |
| SDS    | LinkedList/ZipList/QuickList | Dict, ZipList | Dict, Intset | ZipList, SkipList |

Trước Redis 3.2, cấu trúc bên dưới của List là LinkedList hoặc ZipList. Từ Redis 3.2 trở đi, Redis giới thiệu QuickList (kết hợp giữa LinkedList và ZipList), và cấu trúc bên dưới của List chuyển thành QuickList. Bắt đầu từ Redis 7.0, ZipList được thay thế bởi ListPack.

Bạn có thể tìm thấy phần giới thiệu rất chi tiết về các kiểu/cấu trúc dữ liệu của Redis trên trang chủ chính thức của Redis:

- [Redis Data Structures](https://redis.com/redis-enterprise/data-structures/)
- [Redis Data types tutorial](https://redis.io/docs/manual/data-types/data-types-tutorial/)

Trong tương lai khi các phiên bản Redis mới được phát hành, có thể sẽ xuất hiện thêm các cấu trúc dữ liệu mới; bằng cách tra cứu tài liệu tương ứng trên trang chủ chính thức của Redis, bạn sẽ luôn nắm được thông tin đáng tin cậy nhất.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720181630203-1eca43a6.png)

## String (Chuỗi)

### Giới thiệu

String là kiểu dữ liệu đơn giản nhất và cũng được sử dụng phổ biến nhất trong Redis.

String là kiểu dữ liệu an toàn nhị phân (binary-safe), có thể dùng để lưu trữ bất kỳ loại dữ liệu nào như chuỗi ký tự, số nguyên, số thực dấu phẩy động, hình ảnh (dữ liệu ảnh mã hóa/giải mã base64 hoặc đường dẫn ảnh), hay các đối tượng đã được tuần tự hóa (`Serialization`).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124403897-bb5e9fd5.png)

Mặc dù Redis được viết bằng ngôn ngữ C, nhưng Redis không sử dụng cách biểu diễn chuỗi gốc của C mà tự xây dựng một cấu trúc **Simple Dynamic String** (**SDS** — chuỗi động đơn giản). So với chuỗi gốc của C, SDS của Redis không chỉ lưu được dữ liệu văn bản mà còn lưu được dữ liệu nhị phân, độ phức tạp khi lấy độ dài chuỗi chỉ là O(1) (chuỗi C là O(N)); ngoài ra, các API của Redis SDS đều an toàn và không gây ra lỗi tràn bộ đệm (buffer overflow).

### Các lệnh thường dùng

| Lệnh                            | Mô tả                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| SET key value                   | Thiết lập giá trị cho key chỉ định                                |
| SETNX key value                 | Chỉ thiết lập giá trị cho key khi key chưa tồn tại                |
| GET key                         | Lấy giá trị của key chỉ định                                      |
| MSET key1 value1 key2 value2 …… | Thiết lập giá trị cho một hoặc nhiều key chỉ định                 |
| MGET key1 key2 ...              | Lấy giá trị của một hoặc nhiều key chỉ định                       |
| STRLEN key                      | Trả về độ dài của giá trị chuỗi được lưu tại key                  |
| INCR key                        | Tăng giá trị số được lưu trong key lên 1                          |
| DECR key                        | Giảm giá trị số được lưu trong key đi 1                           |
| EXISTS key                      | Kiểm tra xem key chỉ định có tồn tại hay không                    |
| DEL key (Chung)                 | Xóa key chỉ định                                                  |
| EXPIRE key seconds (Chung)      | Thiết lập thời gian hết hạn cho key chỉ định                      |

Để xem thêm các lệnh Redis String và hướng dẫn sử dụng chi tiết, vui lòng xem tại trang chủ chính thức của Redis: <https://redis.io/commands/?group=string>.

**Thao tác cơ bản**:

```bash
> SET key value
OK
> GET key
"value"
> EXISTS key
(integer) 1
> STRLEN key
(integer) 5
> DEL key
(integer) 1
> GET key
(nil)
```

**Thiết lập hàng loạt**:

```bash
> MSET key1 value1 key2 value2
OK
> MGET key1 key2 # Lấy hàng loạt giá trị tương ứng của nhiều key
1) "value1"
2) "value2"
```

**Bộ đếm (có thể dùng khi nội dung chuỗi là số nguyên):**

```bash
> SET number 1
OK
> INCR number # Tăng giá trị số lưu trong key lên 1
(integer) 2
> GET number
"2"
> DECR number # Giảm giá trị số lưu trong key đi 1
(integer) 1
> GET number
"1"
```

**Thiết lập thời gian hết hạn (mặc định là không bao giờ hết hạn)**:

```bash
> EXPIRE key 60
(integer) 1
> SETEX key 60 value # Thiết lập giá trị kèm thời gian hết hạn
OK
> TTL key
(integer) 56
```

### Kịch bản ứng dụng

**Kịch bản cần lưu trữ dữ liệu thông thường**

- Ví dụ: Cache Session, Token, đường dẫn ảnh, đối tượng đã tuần tự hóa (tiết kiệm bộ nhớ hơn so với lưu bằng Hash).
- Lệnh liên quan: `SET`, `GET`.

**Kịch bản cần đếm (counter)**

- Ví dụ: Số lượng request của người dùng trong một đơn vị thời gian (có thể dùng cho giới hạn lưu lượng — rate limiting đơn giản), lượt truy cập trang trong một đơn vị thời gian.
- Lệnh liên quan: `SET`, `GET`, `INCR`, `DECR`.

**Khóa phân tán (Distributed Lock)**

Bằng cách tận dụng lệnh `SETNX key value`, có thể triển khai một khóa phân tán đơn giản nhất (vẫn tồn tại một số khiếm khuyết nên thông thường không khuyến nghị triển khai khóa phân tán theo cách này).

## List (Danh sách)

### Giới thiệu

List trong Redis thực chất là một cài đặt của cấu trúc dữ liệu danh sách liên kết (`Linked List`). Tôi đã giới thiệu chi tiết về cấu trúc danh sách liên kết trong bài viết [Cấu trúc dữ liệu tuyến tính: Mảng, Danh sách liên kết, Ngăn xếp, Hàng đợi](https://javaguide.cn/cs-basics/data-structure/linear-data-structure.html), nên ở đây sẽ không nhắc lại nhiều.

Nhiều ngôn ngữ lập trình bậc cao đã tích hợp sẵn cài đặt danh sách liên kết, ví dụ như `LinkedList` trong Java, nhưng ngôn ngữ C lại không có sẵn nên Redis tự triển khai cấu trúc danh sách liên kết của riêng mình. List của Redis được triển khai dưới dạng **danh sách liên kết đôi (doubly linked list)**, nghĩa là có thể hỗ trợ tìm kiếm và duyệt ngược giúp thao tác thuận tiện hơn, dù có phát sinh thêm một phần chi phí bộ nhớ phụ.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124413287-d935c3fc.png)

### Các lệnh thường dùng

| Lệnh                        | Mô tả                                                                   |
| --------------------------- | ----------------------------------------------------------------------- |
| RPUSH key value1 value2 ... | Thêm một hoặc nhiều phần tử vào cuối (bên phải) của danh sách chỉ định  |
| LPUSH key value1 value2 ... | Thêm một hoặc nhiều phần tử vào đầu (bên trái) của danh sách chỉ định   |
| LSET key index value        | Đặt giá trị tại vị trí chỉ mục `index` của danh sách chỉ định thành `value` |
| LPOP key                    | Xóa và lấy phần tử đầu tiên (ngoài cùng bên trái) của danh sách chỉ định |
| RPOP key                    | Xóa và lấy phần tử cuối cùng (ngoài cùng bên phải) của danh sách chỉ định |
| LLEN key                    | Lấy số lượng phần tử của danh sách                                      |
| LRANGE key start end        | Lấy các phần tử trong khoảng từ `start` đến `end` của danh sách         |

Để xem thêm các lệnh Redis List và hướng dẫn sử dụng chi tiết, vui lòng xem tại trang chủ chính thức của Redis: <https://redis.io/commands/?group=list>.

**Triển khai hàng đợi (Queue) bằng `RPUSH/LPOP` hoặc `LPUSH/RPOP`**:

```bash
> RPUSH myList value1
(integer) 1
> RPUSH myList value2 value3
(integer) 3
> LPOP myList
"value1"
> LRANGE myList 0 1
1) "value2"
2) "value3"
> LRANGE myList 0 -1
1) "value2"
2) "value3"
```

**Triển khai ngăn xếp (Stack) bằng `RPUSH/RPOP` hoặc `LPUSH/LPOP`**:

```bash
> RPUSH myList2 value1 value2 value3
(integer) 3
> RPOP myList2 # Lấy phần tử ngoài cùng bên phải của list ra
"value3"
```

Tôi đã vẽ riêng một sơ đồ để mọi người dễ hình dung các lệnh `RPUSH`, `LPOP`, `LPUSH`, `RPOP`:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-list-a1006c6c.png)

**Xem các phần tử trong danh sách theo khoảng chỉ mục tương ứng bằng `LRANGE`**:

```bash
> RPUSH myList value1 value2 value3
(integer) 3
> LRANGE myList 0 1
1) "value1"
2) "value2"
> LRANGE myList 0 -1
1) "value1"
2) "value2"
3) "value3"
```

Thông qua lệnh `LRANGE`, bạn có thể triển khai truy vấn phân trang dựa trên List với hiệu năng rất cao!

**Xem độ dài danh sách liên kết bằng `LLEN`**:

```bash
> LLEN myList
(integer) 3
```

### Kịch bản ứng dụng

**Hiển thị luồng thông tin (News Feed)**

- Ví dụ: Bài viết mới nhất, cập nhật mới nhất.
- Lệnh liên quan: `LPUSH`, `LRANGE`.

**Message Queue (Hàng đợi thông điệp)**

`List` có thể dùng để làm hàng đợi thông điệp, nhưng chức năng quá đơn giản và tồn tại nhiều hạn chế nên không khuyến nghị làm như vậy.

Tương đối mà nói, cấu trúc dữ liệu `Stream` được bổ sung từ Redis 5.0 phù hợp để làm hàng đợi thông điệp hơn, tuy nhiên tính năng vẫn còn khá sơ sài. So với các Message Queue chuyên dụng, nó vẫn còn nhiều điểm thiếu sót, chẳng hạn như các vấn đề mất thông điệp và tồn đọng thông điệp (message backlog) rất khó giải quyết triệt để.

## Hash (Bảng băm)

### Giới thiệu

Hash trong Redis là một bảng ánh xạ các cặp `field-value` (cặp khóa-giá trị) kiểu String, đặc biệt phù hợp để lưu trữ đối tượng; trong các thao tác sau đó, bạn có thể sửa đổi trực tiếp giá trị của một số trường (field) nhất định trong đối tượng này.

Hash tương tự như `HashMap` trước JDK 1.8, cài đặt bên trong cũng gần giống nhau (mảng + danh sách liên kết). Tuy nhiên, Hash của Redis đã thực hiện nhiều tối ưu hóa hơn.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124421703-50a6fb86.png)

### Các lệnh thường dùng

| Lệnh                                      | Mô tả                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| HSET key field value                      | Thiết lập giá trị cho trường chỉ định trong bảng băm chỉ định                     |
| HSETNX key field value                    | Chỉ thiết lập giá trị cho trường chỉ định khi trường đó chưa tồn tại              |
| HMSET key field1 value1 field2 value2 ... | Đồng thời thiết lập một hoặc nhiều cặp field-value vào bảng băm chỉ định          |
| HGET key field                            | Lấy giá trị của trường chỉ định trong bảng băm chỉ định                           |
| HMGET key field1 field2 ...               | Lấy giá trị của một hoặc nhiều trường chỉ định trong bảng băm chỉ định            |
| HGETALL key                               | Lấy tất cả các cặp field-value trong bảng băm chỉ định                            |
| HEXISTS key field                         | Kiểm tra xem trường chỉ định có tồn tại trong bảng băm chỉ định hay không         |
| HDEL key field1 field2 ...                | Xóa một hoặc nhiều trường của bảng băm                                            |
| HLEN key                                  | Lấy số lượng trường trong bảng băm chỉ định                                       |
| HINCRBY key field increment               | Thực hiện phép toán cộng/trừ trên trường chỉ định (số dương là cộng, âm là trừ)   |

Để xem thêm các lệnh Redis Hash và hướng dẫn sử dụng chi tiết, vui lòng xem tại trang chủ chính thức của Redis: <https://redis.io/commands/?group=hash>.

**Mô phỏng lưu trữ dữ liệu đối tượng**:

```bash
> HMSET userInfoKey name "guide" description "dev" age 24
OK
> HEXISTS userInfoKey name # Kiểm tra trường chỉ định trong value tương ứng với key có tồn tại không
(integer) 1
> HGET userInfoKey name # Lấy giá trị của trường chỉ định lưu trong bảng băm
"guide"
> HGET userInfoKey age
"24"
> HGETALL userInfoKey # Lấy tất cả các trường và giá trị của key chỉ định trong bảng băm
1) "name"
2) "guide"
3) "description"
4) "dev"
5) "age"
6) "24"
> HSET userInfoKey name "GuideGeGe"
> HGET userInfoKey name
"GuideGeGe"
> HINCRBY userInfoKey age 2
(integer) 26
```

### Kịch bản ứng dụng

**Kịch bản lưu trữ dữ liệu đối tượng**

- Ví dụ: Thông tin người dùng, thông tin sản phẩm, thông tin bài viết, thông tin giỏ hàng.
- Lệnh liên quan: `HSET` (đặt giá trị một trường), `HMSET` (đặt giá trị nhiều trường), `HGET` (lấy giá trị một trường), `HMGET` (lấy giá trị nhiều trường).

## Set (Tập hợp)

### Giới thiệu

Kiểu Set trong Redis là một tập hợp không có thứ tự, các phần tử trong tập hợp không có thứ tự trước sau nhưng đều là duy nhất, hơi giống với `HashSet` trong Java. Khi bạn cần lưu trữ một danh sách dữ liệu nhưng không muốn xuất hiện dữ liệu trùng lặp, Set là một lựa chọn rất tốt; hơn nữa Set còn cung cấp giao diện quan trọng để kiểm tra xem một phần tử có nằm trong tập hợp Set hay không — điều mà List không thể đáp ứng hiệu quả.

Bạn có thể dễ dàng thực hiện các phép toán giao (intersection), hợp (union), hiệu (difference) dựa trên Set; ví dụ bạn có thể lưu tất cả những người một user đang theo dõi vào một Set và tất cả người theo dõi (fan) của họ vào một Set khác. Khi đó, Set có thể triển khai rất thuận tiện các tính năng như theo dõi chung, người hâm mộ chung, sở thích chung. Quá trình này chính là phép tìm giao của các tập hợp.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124430264-b249fe9b.png)

### Các lệnh thường dùng

| Lệnh                                  | Mô tả                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------- |
| SADD key member1 member2 ...          | Thêm một hoặc nhiều phần tử vào tập hợp chỉ định                           |
| SMEMBERS key                          | Lấy tất cả các phần tử trong tập hợp chỉ định                              |
| SCARD key                             | Lấy số lượng phần tử của tập hợp chỉ định                                  |
| SISMEMBER key member                  | Kiểm tra phần tử chỉ định có nằm trong tập hợp chỉ định hay không          |
| SINTER key1 key2 ...                  | Lấy giao của tất cả các tập hợp đã cho                                     |
| SINTERSTORE destination key1 key2 ... | Lưu giao của tất cả các tập hợp đã cho vào `destination`                   |
| SUNION key1 key2 ...                  | Lấy hợp của tất cả các tập hợp đã cho                                      |
| SUNIONSTORE destination key1 key2 ... | Lưu hợp của tất cả các tập hợp đã cho vào `destination`                    |
| SDIFF key1 key2 ...                   | Lấy hiệu của tất cả các tập hợp đã cho                                     |
| SDIFFSTORE destination key1 key2 ...  | Lưu hiệu của tất cả các tập hợp đã cho vào `destination`                   |
| SPOP key count                        | Xóa và lấy ngẫu nhiên một hoặc nhiều phần tử trong tập hợp chỉ định        |
| SRANDMEMBER key count                 | Lấy ngẫu nhiên một số lượng phần tử chỉ định trong tập hợp chỉ định        |

Để xem thêm các lệnh Redis Set và hướng dẫn sử dụng chi tiết, vui lòng xem tại trang chủ chính thức của Redis: <https://redis.io/commands/?group=set>.

**Thao tác cơ bản**:

```bash
> SADD mySet value1 value2
(integer) 2
> SADD mySet value1 # Không cho phép phần tử trùng lặp nên thêm thất bại
(integer) 0
> SMEMBERS mySet
1) "value1"
2) "value2"
> SCARD mySet
(integer) 2
> SISMEMBER mySet value1
(integer) 1
> SADD mySet2 value2 value3
(integer) 2
```

- `mySet`: `value1`, `value2`.
- `mySet2`: `value2`, `value3`.

**Tìm giao (Intersection)**:

```bash
> SINTERSTORE mySet3 mySet mySet2
(integer) 1
> SMEMBERS mySet3
1) "value2"
```

**Tìm hợp (Union)**:

```bash
> SUNION mySet mySet2
1) "value3"
2) "value2"
3) "value1"
```

**Tìm hiệu (Difference)**:

```bash
> SDIFF mySet mySet2 # Hiệu tập hợp gồm tất cả phần tử thuộc mySet nhưng không thuộc A
1) "value1"
```

### Kịch bản ứng dụng

**Kịch bản dữ liệu lưu trữ không được phép trùng lặp**

- Ví dụ: Thống kê UV trang web (với lượng dữ liệu khổng lồ thì `HyperLogLog` sẽ phù hợp hơn), lượt thích bài viết, lượt thích bài đăng, v.v.
- Lệnh liên quan: `SCARD` (lấy số lượng phần tử trong tập hợp).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719073733851-c2639db3.png)

**Kịch bản cần lấy giao, hợp và hiệu từ nhiều nguồn dữ liệu**

- Ví dụ: Bạn chung (giao), người theo dõi chung (giao), đang theo dõi chung (giao), gợi ý kết bạn (hiệu), gợi ý âm nhạc (hiệu), gợi ý tài khoản đăng ký (hiệu + giao), v.v.
- Lệnh liên quan: `SINTER` (giao), `SINTERSTORE` (giao), `SUNION` (hợp), `SUNIONSTORE` (hợp), `SDIFF` (hiệu), `SDIFFSTORE` (hiệu).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719074543513-f08a950a.png)

**Kịch bản cần lấy ngẫu nhiên phần tử trong nguồn dữ liệu**

- Ví dụ: Hệ thống quay số trúng thưởng, gọi tên ngẫu nhiên, v.v.
- Lệnh liên quan: `SPOP` (lấy ngẫu nhiên phần tử trong tập hợp và xóa đi, phù hợp cho kịch bản không cho phép trúng thưởng lặp lại), `SRANDMEMBER` (lấy ngẫu nhiên phần tử trong tập hợp, phù hợp cho kịch bản cho phép trúng thưởng lặp lại).

## Sorted Set (Tập hợp có thứ tự)

### Giới thiệu

Sorted Set tương tự như Set, nhưng so với Set, Sorted Set bổ sung thêm một tham số trọng số là `score`, giúp các phần tử trong tập hợp có thể được sắp xếp có thứ tự theo `score`, đồng thời có thể lấy danh sách phần tử thông qua khoảng giá trị của `score`. Khá giống sự kết hợp giữa `HashMap` và `TreeSet` trong Java.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124437791-c6796849.png)

### Các lệnh thường dùng

| Lệnh                                          | Mô tả                                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ZADD key score1 member1 score2 member2 ...    | Thêm một hoặc nhiều phần tử vào sorted set chỉ định                                                                          |
| ZCARD KEY                                     | Lấy số lượng phần tử của sorted set chỉ định                                                                                 |
| ZSCORE key member                             | Lấy giá trị `score` của phần tử chỉ định trong sorted set chỉ định                                                           |
| ZINTERSTORE destination numkeys key1 key2 ... | Lưu giao của tất cả các sorted set đã cho vào `destination`, gộp `score` của các phần tử trùng nhau bằng phép SUM; `numkeys` là số tập hợp |
| ZUNIONSTORE destination numkeys key1 key2 ... | Tìm hợp, các tham số khác tương tự `ZINTERSTORE`                                                                             |
| ZDIFFSTORE destination numkeys key1 key2 ...  | Tìm hiệu, các tham số khác tương tự `ZINTERSTORE`                                                                            |
| ZRANGE key start end                          | Lấy các phần tử trong khoảng từ `start` đến `end` của sorted set chỉ định (`score` từ thấp đến cao)                          |
| ZREVRANGE key start end                       | Lấy các phần tử trong khoảng từ `start` đến `end` của sorted set chỉ định (`score` từ cao xuống thấp)                        |
| ZREVRANK key member                           | Lấy thứ hạng của phần tử chỉ định trong sorted set chỉ định (sắp xếp theo `score` từ lớn đến nhỏ)                            |

Để xem thêm các lệnh Redis Sorted Set và hướng dẫn sử dụng chi tiết, vui lòng xem tại trang chủ chính thức của Redis: <https://redis.io/commands/?group=sorted-set>.

**Thao tác cơ bản**:

```bash
> ZADD myZset 2.0 value1 1.0 value2
(integer) 2
> ZCARD myZset
2
> ZSCORE myZset value1
2.0
> ZRANGE myZset 0 1
1) "value2"
2) "value1"
> ZREVRANGE myZset 0 1
1) "value1"
2) "value2"
> ZADD myZset2 4.0 value2 3.0 value3
(integer) 2

```

- `myZset`: `value1` (2.0), `value2` (1.0).
- `myZset2`: `value2` (4.0), `value3` (3.0).

**Lấy thứ hạng của phần tử chỉ định**:

```bash
> ZREVRANK myZset value1
0
> ZREVRANK myZset value2
1
```

**Tìm giao (Intersection)**:

```bash
> ZINTERSTORE myZset3 2 myZset myZset2
1
> ZRANGE myZset3 0 1 WITHSCORES
value2
5
```

**Tìm hợp (Union)**:

```bash
> ZUNIONSTORE myZset4 2 myZset myZset2
3
> ZRANGE myZset4 0 2 WITHSCORES
value1
2
value3
3
value2
5
```

**Tìm hiệu (Difference)**:

```bash
> ZDIFF 2 myZset myZset2 WITHSCORES
value1
2
```

### Kịch bản ứng dụng

**Kịch bản cần lấy ngẫu nhiên các phần tử trong nguồn dữ liệu và sắp xếp theo một trọng số nào đó**

- Ví dụ: Các bảng xếp hạng như bảng xếp hạng tặng quà phòng livestream, bảng xếp hạng số bước chân WeChat Moments, bảng xếp hạng bậc rank trong Vương Giả Vinh Diệu, bảng xếp hạng độ nóng chủ đề, v.v.
- Lệnh liên quan: `ZRANGE` (sắp xếp từ nhỏ đến lớn), `ZREVRANGE` (sắp xếp từ lớn đến nhỏ), `ZREVRANK` (thứ hạng của phần tử chỉ định).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/2021060714195385-ae2278e1.png)

Trong phần "Câu hỏi phỏng vấn kỹ thuật" của [*Cẩm nang phỏng vấn Java*](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) có một bài viết giới thiệu chi tiết cách sử dụng Sorted Set để thiết kế và xây dựng bảng xếp hạng.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719071115140-61c4235c.png)

**Kịch bản dữ liệu lưu trữ có mức độ ưu tiên hoặc mức độ quan trọng**, chẳng hạn như hàng đợi tác vụ ưu tiên (priority task queue).

- Ví dụ: Hàng đợi tác vụ ưu tiên.
- Lệnh liên quan: `ZRANGE` (sắp xếp từ nhỏ đến lớn), `ZREVRANGE` (sắp xếp từ lớn đến nhỏ), `ZREVRANK` (thứ hạng của phần tử chỉ định).

## Tổng kết

| Kiểu dữ liệu | Mô tả                                                                                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| String       | Kiểu dữ liệu an toàn nhị phân, có thể dùng để lưu trữ bất kỳ loại dữ liệu nào như chuỗi ký tự, số nguyên, số thực dấu phẩy động, hình ảnh (dữ liệu mã hóa/giải mã base64 hoặc đường dẫn ảnh), đối tượng tuần tự hóa. |
| List         | List của Redis được triển khai như một danh sách liên kết đôi, hỗ trợ tìm kiếm và duyệt ngược giúp thao tác thuận tiện hơn, tuy nhiên phát sinh thêm một phần chi phí bộ nhớ phụ.                        |
| Hash         | Bảng ánh xạ các cặp `field-value` kiểu String, đặc biệt phù hợp để lưu trữ đối tượng; trong các thao tác sau đó bạn có thể sửa đổi trực tiếp giá trị một số trường của đối tượng này.                   |
| Set          | Tập hợp không thứ tự, các phần tử trong tập hợp không có thứ tự trước sau nhưng đều duy nhất, khá giống `HashSet` trong Java.                                                                            |
| Zset         | So với Set, Sorted Set bổ sung thêm tham số trọng số `score`, giúp các phần tử trong tập hợp được sắp xếp có thứ tự theo `score` và truy xuất theo khoảng `score`. Khá giống sự kết hợp giữa `HashMap` và `TreeSet` trong Java. |

## Đọc thêm về cấu trúc dữ liệu

Đằng sau các kiểu dữ liệu của Redis sử dụng rất nhiều cấu trúc dữ liệu nền tảng. Nếu muốn bổ sung kiến thức tầng sâu dưới góc độ phỏng vấn, bạn có thể kết hợp đọc thêm các bài viết sau:

- [Giải thích chi tiết cấu trúc dữ liệu tuyến tính](../../cs-basics/data-structure/linear-data-structure.md): Hiểu rõ mối quan hệ giữa List, hàng đợi và danh sách liên kết.
- [Tổng hợp câu hỏi phỏng vấn về Bảng băm](../../cs-basics/data-structure/hash-table.md): Hiểu cách tìm kiếm và xử lý xung đột băm của các cấu trúc như Hash, Set.
- [Tổng hợp câu hỏi phỏng vấn về Skip List](../../cs-basics/data-structure/skip-list.md): Hiểu sự đánh đổi kiến trúc đằng sau khả năng truy vấn theo khoảng và xếp hạng của Sorted Set.

## Tài liệu tham khảo

- Redis Data Structures: <https://redis.com/redis-enterprise/data-structures/>.
- Redis Commands: <https://redis.io/commands/>.
- Redis Data types tutorial: <https://redis.io/docs/manual/data-types/data-types-tutorial/>.
- Lưu thông tin đối tượng trong Redis nên dùng Hash hay String: <https://segmentfault.com/a/1190000040032006>
