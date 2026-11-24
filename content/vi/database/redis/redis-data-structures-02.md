---
title: Giải thích chi tiết 3 kiểu dữ liệu đặc biệt của Redis
description: Giải thích chi tiết cách sử dụng và kịch bản ứng dụng của ba kiểu dữ liệu đặc biệt trong Redis gồm Bitmap, HyperLogLog, GEO, bao gồm việc triển khai các kịch bản nghiệp vụ điển hình như thống kê điểm danh, thống kê UV, tìm người ở gần.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Kiểu dữ liệu đặc biệt Redis,Bitmap,HyperLogLog,GEO,Thống kê lực lượng tập hợp,Dữ liệu địa lý,Thống kê điểm danh,Thống kê UV
lang: vi
sourceRef: zh-ref/database/redis/redis-data-structures-02.md
---

Ngoài 5 kiểu dữ liệu cơ bản, Redis còn hỗ trợ 3 kiểu dữ liệu đặc biệt: Bitmap, HyperLogLog và GEO.

## Bitmap (Bản đồ bit)

### Giới thiệu

Theo tài liệu chính thức:

> Bitmaps are not an actual data type, but a set of bit-oriented operations defined on the String type which is treated like a bit vector. Since strings are binary safe blobs and their maximum length is 512 MB, they are suitable to set up to 2^32 different bits.
>
> Bitmap không phải là một kiểu dữ liệu thực sự trong Redis, mà là một tập hợp các thao tác hướng bit được định nghĩa trên kiểu String, coi String như một vector bit. Do chuỗi là các khối dữ liệu an toàn nhị phân (binary-safe) và độ dài tối đa là 512 MB, chúng phù hợp để thiết lập tối đa 2^32 bit khác nhau.

Bitmap lưu trữ các chữ số nhị phân liên tiếp (0 và 1). Thông qua Bitmap, chỉ cần một bit duy nhất để biểu diễn giá trị hoặc trạng thái tương ứng của một phần tử nào đó, trong đó key chính là bản thân phần tử tương ứng. Như chúng ta đã biết, 8 bit tạo thành 1 byte, vì vậy bản thân Bitmap tiết kiệm không gian lưu trữ cực kỳ lớn.

Bạn có thể coi Bitmap như một mảng lưu các chữ số nhị phân (0 và 1), trong đó chỉ số của mỗi phần tử trong mảng được gọi là `offset` (độ lệch).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194154133-ab812d2d.png)

### Các lệnh thường dùng

| Lệnh                                  | Mô tả                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| SETBIT key offset value               | Thiết lập giá trị tại vị trí `offset` chỉ định                                 |
| GETBIT key offset                     | Lấy giá trị tại vị trí `offset` chỉ định                                       |
| BITCOUNT key start end                | Lấy số lượng phần tử có giá trị bằng `1` trong khoảng từ `start` đến `end`     |
| BITOP operation destkey key1 key2 ... | Thực hiện phép toán trên một hoặc nhiều Bitmap; các toán tử hỗ trợ gồm AND, OR, XOR và NOT |

**Minh họa thao tác cơ bản với Bitmap**:

```bash
# SETBIT sẽ trả về giá trị bit trước đó (mặc định là 0); ở đây sẽ tạo ra 7 bit
> SETBIT mykey 7 1
(integer) 0
> SETBIT mykey 7 0
(integer) 1
> GETBIT mykey 7
(integer) 0
> SETBIT mykey 6 1
(integer) 0
> SETBIT mykey 8 1
(integer) 0
# Đếm số lượng bit được đặt thành 1 bằng bitcount.
> BITCOUNT mykey
(integer) 2
```

### Kịch bản ứng dụng

**Kịch bản cần lưu trữ thông tin trạng thái (chỉ cần biểu diễn bằng 0/1)**

- Ví dụ: Tình trạng điểm danh của người dùng, trạng thái người dùng hoạt động (active user), thống kê hành vi người dùng (ví dụ người dùng đã nhấn thích một video nào đó hay chưa).
- Lệnh liên quan: `SETBIT`, `GETBIT`, `BITCOUNT`, `BITOP`.

## HyperLogLog (Thống kê lực lượng tập hợp — Cardinality)

### Giới thiệu

HyperLogLog là một thuật toán xác suất nổi tiếng dùng để đếm số lượng phần tử phân biệt (cardinality counting), được tối ưu hóa và cải tiến dựa trên LogLog Counting (LLC). Thuật toán này không phải của riêng Redis; Redis chỉ triển khai thuật toán này và cung cấp các API dùng sẵn.

HyperLogLog do Redis cung cấp chiếm dụng dung lượng cực kỳ nhỏ — chỉ cần 12 KB bộ nhớ là có thể lưu trữ gần `2^64` phần tử khác nhau. Thực sự rất lợi hại, đây chẳng phải là sức hấp dẫn của toán học sao! Hơn nữa, Redis còn tối ưu hóa cấu trúc lưu trữ của HyperLogLog bằng cách sử dụng hai chế độ đếm:

- **Ma trận thưa (Sparse)**: Khi số đếm còn nhỏ, chiếm rất ít dung lượng.
- **Ma trận đặc (Dense)**: Khi số đếm đạt đến một ngưỡng nhất định, chiếm 12 KB dung lượng.

Trong tài liệu chính thức của Redis có phần giải thích chi tiết tương ứng:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220721091424563-dce29bee.png)

Để tiết kiệm bộ nhớ, các thuật toán xác suất đếm số lượng phần tử phân biệt không trực tiếp lưu trữ dữ liệu gốc, mà ước lượng giá trị cardinality (số phần tử phân biệt trong tập hợp) thông qua phương pháp thống kê xác suất. Do đó, kết quả đếm của HyperLogLog không phải là giá trị chính xác tuyệt đối mà tồn tại một sai số nhất định (sai số chuẩn là `0.81%`).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194154133-ab812d2d.png)

Việc sử dụng HyperLogLog rất đơn giản, nhưng nguyên lý bên dưới lại rất phức tạp. Để hiểu nguyên lý của HyperLogLog và cách triển khai trong Redis, bạn có thể xem bài viết này: [Giải thích nguyên lý thuật toán HyperLogLog và cách Redis ứng dụng nó](https://juejin.cn/post/6844903785744056333).

Giới thiệu thêm một công cụ hỗ trợ rất tốt cho việc hiểu nguyên lý HyperLogLog: [Sketch of the Day: HyperLogLog — Cornerstone of a Big Data Infrastructure](http://content.research.neustar.biz/blog/hll.html).

Ngoài HyperLogLog ra, Redis còn cung cấp các cấu trúc dữ liệu xác suất khác, địa chỉ tài liệu chính thức tương ứng là: <https://redis.io/docs/data-types/probabilistic/>.

### Các lệnh thường dùng

Các lệnh liên quan đến HyperLogLog rất ít, phổ biến nhất chỉ có 3 lệnh sau.

| Lệnh                                      | Mô tả                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| PFADD key element1 element2 ...           | Thêm một hoặc nhiều phần tử vào HyperLogLog                                                    |
| PFCOUNT key1 key2                         | Lấy số đếm phần tử duy nhất của một hoặc nhiều HyperLogLog                                     |
| PFMERGE destkey sourcekey1 sourcekey2 ... | Gộp nhiều HyperLogLog vào `destkey`; `destkey` sẽ kết hợp các nguồn để tính ra số đếm duy nhất |

**Minh họa thao tác cơ bản với HyperLogLog**:

```bash
> PFADD hll foo bar zap
(integer) 1
> PFADD hll zap zap zap
(integer) 0
> PFADD hll foo bar
(integer) 0
> PFCOUNT hll
(integer) 3
> PFADD some-other-hll 1 2 3
(integer) 1
> PFCOUNT hll some-other-hll
(integer) 6
> PFMERGE desthll hll some-other-hll
"OK"
> PFCOUNT desthll
(integer) 6
```

### Kịch bản ứng dụng

**Kịch bản đếm với số lượng cực lớn (hàng triệu, hàng chục triệu trở lên)**

- Ví dụ: Thống kê số lượng IP truy cập hàng ngày/hàng tuần/hàng tháng của các website lớn, thống kê UV của các bài viết hot.
- Lệnh liên quan: `PFADD`, `PFCOUNT`.

## Geospatial (Vị trí địa lý)

### Giới thiệu

Geospatial index (chỉ mục không gian địa lý, viết tắt là GEO) chủ yếu dùng để lưu trữ thông tin vị trí địa lý, được cài đặt dựa trên Sorted Set.

Thông qua GEO, chúng ta có thể dễ dàng tính toán khoảng cách giữa hai vị trí, tìm các phần tử xung quanh một vị trí chỉ định, v.v.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194359494-aed36ad8.png)

### Các lệnh thường dùng

| Lệnh                                             | Mô tả                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| GEOADD key longitude1 latitude1 member1 ...      | Thêm thông tin kinh độ và vĩ độ của một hoặc nhiều phần tử vào GEO                                              |
| GEOPOS key member1 member2 ...                   | Trả về thông tin kinh độ và vĩ độ của các phần tử đã cho                                                        |
| GEODIST key member1 member2 M/KM/FT/MI           | Trả về khoảng cách giữa hai phần tử đã cho                                                                      |
| GEORADIUS key longitude latitude radius distance | Lấy các phần tử khác trong bán kính `distance` xung quanh vị trí chỉ định; hỗ trợ ASC (gần đến xa), DESC (xa đến gần), Count (số lượng), v.v. |
| GEORADIUSBYMEMBER key member radius distance     | Tương tự lệnh `GEORADIUS`, chỉ khác là điểm tâm tham chiếu là một phần tử có sẵn trong GEO                      |

**Thao tác cơ bản**:

```bash
> GEOADD personLocation 116.33 39.89 user1 116.34 39.90 user2 116.35 39.88 user3
3
> GEOPOS personLocation user1
116.3299986720085144
39.89000061669732844
> GEODIST personLocation user1 user2 km
1.4018
```

Kiểm tra `personLocation` qua công cụ trực quan hóa Redis, quả nhiên bên dưới chính là Sorted Set.

Dữ liệu kinh độ và vĩ độ của vị trí địa lý lưu trong GEO được chuyển đổi thành một số nguyên thông qua thuật toán GeoHash, và số nguyên này được dùng làm `score` (tham số trọng số) của Sorted Set.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220721201545147-31c10f9f.png)

**Lấy các phần tử khác trong phạm vi vị trí chỉ định**:

```bash
> GEORADIUS personLocation 116.33 39.87 3 km
user3
user1
> GEORADIUS personLocation 116.33 39.87 2 km
> GEORADIUS personLocation 116.33 39.87 5 km
user3
user1
user2
> GEORADIUSBYMEMBER personLocation user1 5 km
user3
user1
user2
> GEORADIUSBYMEMBER personLocation user1 2 km
user1
user2
```

Để phân tích nguyên lý bên dưới của lệnh `GEORADIUS`, bạn có thể đọc bài viết này của Alibaba: [Redis rốt cuộc đã triển khai tính năng "Người ở gần" như thế nào?](https://juejin.cn/post/6844903966061363207).

**Xóa phần tử**:

Bên dưới GEO là Sorted Set, nên bạn có thể sử dụng các lệnh liên quan đến Sorted Set lên GEO.

```bash
> ZREM personLocation user1
1
> ZRANGE personLocation 0 -1
user3
user2
> ZSCORE personLocation user2
4069879562983946
```

### Kịch bản ứng dụng

**Kịch bản cần quản lý và sử dụng dữ liệu không gian địa lý**

- Ví dụ: Tìm người ở gần (Nearby People).
- Lệnh liên quan: `GEOADD`, `GEORADIUS`, `GEORADIUSBYMEMBER`.

## Tổng kết

| Kiểu dữ liệu     | Mô tả                                                                                                                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bitmap           | Bạn có thể coi Bitmap như một mảng lưu các chữ số nhị phân (0 và 1), trong đó chỉ số của mỗi phần tử trong mảng gọi là `offset`. Thông qua Bitmap, chỉ cần một bit duy nhất để biểu diễn giá trị hoặc trạng thái của một phần tử, với key chính là phần tử đó. Vì 8 bit tạo thành 1 byte nên bản thân Bitmap giúp tiết kiệm bộ nhớ cực lớn. |
| HyperLogLog      | HyperLogLog do Redis cung cấp chiếm dụng không gian cực nhỏ, chỉ cần 12 KB dung lượng là có thể lưu trữ gần `2^64` phần tử khác nhau. Tuy nhiên, kết quả đếm của HyperLogLog không phải là giá trị chính xác mà có sai số nhất định (sai số chuẩn là `0.81%`). |
| Geospatial index | Geospatial index (chỉ mục không gian địa lý, viết tắt là GEO) chủ yếu dùng để lưu trữ thông tin vị trí địa lý, được cài đặt dựa trên Sorted Set.                                                                                                |

## Tài liệu tham khảo

- Redis Data Structures: <https://redis.com/redis-enterprise/data-structures/>.
- *Redis Deep Dive: Core Principles and Application Practice* — 1.6 Tứ lạng bạt thiên cân — HyperLogLog
- Bloom Filter, Bitmap, HyperLogLog: <https://hogwartsrico.github.io/2020/06/08/BloomFilter-HyperLogLog-BitMap/index.html>
