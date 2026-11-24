---
title: Phân tích chuyên sâu về phân mảnh bộ nhớ trong Redis (Memory Fragmentation)
description: Phân tích chuyên sâu nguyên nhân gây phân mảnh bộ nhớ trong Redis, phương pháp chẩn đoán và giải pháp tối ưu hóa, bao gồm tính toán tỷ lệ phân mảnh bộ nhớ, nguyên lý của bộ cấp phát jemalloc và cấu hình tự động dọn dẹp phân mảnh.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Phân mảnh bộ nhớ Redis,tỷ lệ phân mảnh bộ nhớ,jemalloc,cấp phát bộ nhớ,activedefrag,tối ưu hóa bộ nhớ,quản lý bộ nhớ Redis
lang: vi
sourceRef: zh-ref/database/redis/redis-memory-fragmentation.md
---

## Phân mảnh bộ nhớ là gì?

Bạn có thể hiểu một cách đơn giản phân mảnh bộ nhớ (memory fragmentation) chính là những khoảng bộ nhớ trống nhưng không thể tái sử dụng hiệu quả.

Lấy một ví dụ: Hệ điều hành cấp phát cho bạn một vùng nhớ liên tục có kích thước 32 bytes, trong khi dữ liệu thực tế bạn cần lưu trữ chỉ tốn 24 bytes. Phần 8 bytes dôi dư ra này nếu sau đó không thể được cấp phát để lưu trữ dữ liệu khác thì được gọi là phân mảnh bộ nhớ.

![Phân mảnh bộ nhớ](/media/jg/ext/oss.javaguide.cn/github/javaguide/memory-fragmentation-9e762b3c.png)

Phân mảnh bộ nhớ trong Redis tuy không làm ảnh hưởng trực tiếp đến tốc độ xử lý của Redis, nhưng nó sẽ làm gia tăng đáng kể dung lượng RAM bị chiếm dụng thực tế.

## Tại sao lại xảy ra hiện tượng phân mảnh bộ nhớ trong Redis?

Hiện tượng phân mảnh bộ nhớ trong Redis thường bắt nguồn từ 2 nguyên nhân phổ biến:

**1. Khi lưu trữ dữ liệu, không gian bộ nhớ mà Redis xin cấp phát từ hệ điều hành có thể lớn hơn dung lượng thực tế dữ liệu cần.**

Dưới đây là đoạn trích nguyên văn từ tài liệu chính thức của Redis:

> To store user keys, Redis allocates at most as much memory as the `maxmemory` setting enables (however there are small extra allocations possible).

Khi Redis sử dụng phương thức `zmalloc` (hàm cấp phát bộ nhớ do Redis tự hiện thực) để cấp phát bộ nhớ, bên cạnh việc cấp phát đúng kích thước `size` yêu cầu, nó còn cấp phát thêm một lượng bộ nhớ có kích thước `PREFIX_SIZE`.

Đoạn mã nguồn của hàm `zmalloc` như sau (đường dẫn mã nguồn: <https://github.com/antirez/redis-tools/blob/master/zmalloc.c>):

```c
void *zmalloc(size_t size) {
   // Cấp phát bộ nhớ theo kích thước chỉ định
   void *ptr = malloc(size+PREFIX_SIZE);
   if (!ptr) zmalloc_oom_handler(size);
#ifdef HAVE_MALLOC_SIZE
   update_zmalloc_stat_alloc(zmalloc_size(ptr));
   return ptr;
#else
   *((size_t*)ptr) = size;
   update_zmalloc_stat_alloc(size+PREFIX_SIZE);
   return (char*)ptr+PREFIX_SIZE;
#endif
}
```

Ngoài ra, Redis có thể sử dụng nhiều bộ cấp phát bộ nhớ (memory allocator) khác nhau (libc, jemalloc, tcmalloc), mặc định sử dụng [jemalloc](https://github.com/jemalloc/jemalloc). Mà jemalloc lại thực hiện cấp phát bộ nhớ dựa theo một chuỗi kích thước cố định (8 bytes, 16 bytes, 32 bytes...). Các đơn vị bộ nhớ được chia bởi jemalloc như hình dưới đây:

![Sơ đồ đơn vị bộ nhớ của jemalloc](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/6803d3929e3e46c1b1c9d0bb9ee8e717-da1a1cd1.png)

Khi ứng dụng yêu cầu cấp phát bộ nhớ, jemalloc sẽ cấp phát block có kích thước cố định gần nhất lớn hơn hoặc bằng kích thước yêu cầu. Ví dụ: ứng dụng cần xin 17 bytes bộ nhớ, jemalloc sẽ cấp phát thẳng một khối 32 bytes, dẫn đến lãng phí 15 bytes. Dẫu vậy, jemalloc đã được tối ưu hóa đặc biệt nhằm hạn chế phân mảnh bộ nhớ, nên nhìn chung không xảy ra tình trạng phân mảnh quá mức trong điều kiện tải bình thường.

**2. Thường xuyên chỉnh sửa và xóa dữ liệu trong Redis cũng gây ra phân mảnh bộ nhớ.**

Khi một dữ liệu nào đó trong Redis bị xóa, thông thường Redis sẽ không giải phóng ngay phần bộ nhớ đó trả về cho hệ điều hành.

Điều này cũng được giải thích rõ trong tài liệu chính thức của Redis:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redis-docs-memory-optimization-f0be21e8.png)

Đường dẫn tài liệu: <https://redis.io/topics/memory-optimization>.

## Làm thế nào để kiểm tra thông tin phân mảnh bộ nhớ trong Redis?

Sử dụng lệnh `info memory` để xem các thông số liên quan đến bộ nhớ trong Redis. Ý nghĩa cụ thể của từng tham số được tài liệu chính thức của Redis giải thích rất chi tiết: <https://redis.io/commands/INFO>.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redis-info-memory-8c8729ad.png)

Công thức tính tỷ lệ phân mảnh bộ nhớ của Redis:

`mem_fragmentation_ratio` (tỷ lệ phân mảnh bộ nhớ) = `used_memory_rss` (dung lượng bộ nhớ vật lý thực tế mà hệ điều hành cấp phát cho Redis) / `used_memory` (dung lượng bộ nhớ thực tế mà bộ cấp phát của Redis xin cấp phát để lưu trữ dữ liệu)

Nói cách khác, giá trị `mem_fragmentation_ratio` càng lớn thì mức độ phân mảnh bộ nhớ càng nghiêm trọng.

Tuyệt đối không được hiểu nhầm rằng lấy `used_memory_rss` trừ đi `used_memory` sẽ ra kích thước phân mảnh bộ nhớ! Hiệu số này không chỉ bao gồm phân mảnh bộ nhớ mà còn bao gồm cả chi phí vận hành tiến trình (process overhead), các thư viện dùng chung (shared libraries), stack, heap runtime...

Nhiều bạn có thể sẽ thắc mắc: "Tỷ lệ phân mảnh bộ nhớ đạt mức bao nhiêu thì cần phải dọn dẹp?".

Thông thường, chúng ta coi mức `mem_fragmentation_ratio > 1.5` là ngưỡng cần tiến hành dọn dẹp phân mảnh. `mem_fragmentation_ratio > 1.5` đồng nghĩa với việc bạn lưu trữ 2GB dữ liệu thực tế nhưng Redis lại chiếm dụng tới hơn 3GB bộ nhớ vật lý.

Nếu muốn kiểm tra nhanh tỷ lệ phân mảnh bộ nhớ, bạn có thể thực thi lệnh sau:

```bash
> redis-cli -p 6379 info | grep mem_fragmentation_ratio
```

Ngoài ra, tỷ lệ phân mảnh bộ nhớ đôi khi có thể nhỏ hơn 1. Tình huống này xảy ra khi bộ nhớ Redis cần dùng đã vượt quá bộ nhớ vật lý được cấp phát, khiến một phần bộ nhớ bị hoán đổi (swap) ra ổ đĩa cứng. Các bạn quan tâm có thể đọc thêm bài viết này: [Phân tích sự cố | Tỷ lệ phân mảnh bộ nhớ Redis quá thấp phải làm sao? - Cộng đồng mã nguồn mở Actions](https://mp.weixin.qq.com/s/drlDvp7bfq5jt2M5pTqJCw).

## Làm thế nào để dọn dẹp phân mảnh bộ nhớ trong Redis?

Từ phiên bản Redis 4.0-RC3 trở đi, Redis đã tích hợp sẵn cơ chế dọn dẹp phân mảnh bộ nhớ chủ động (`activedefrag`), giúp ngăn ngừa tình trạng tỷ lệ phân mảnh bộ nhớ tăng quá cao.

Có thể kích hoạt trực tiếp thông qua lệnh `config set` bằng cách đặt cấu hình `activedefrag` thành `yes`:

```bash
config set activedefrag yes
```

Thời điểm kích hoạt dọn dẹp cụ thể được điều khiển qua hai tham số sau:

```bash
# Bắt đầu dọn dẹp khi bộ nhớ phân mảnh chiếm từ 500MB trở lên
config set active-defrag-ignore-bytes 500mb
# Bắt đầu dọn dẹp khi tỷ lệ phân mảnh bộ nhớ vượt quá 1.5 (ngưỡng 50%)
config set active-defrag-threshold-lower 50
```

Cơ chế tự động dọn dẹp phân mảnh bộ nhớ có thể tiêu tốn CPU và ảnh hưởng tới hiệu năng xử lý của Redis. Chúng ta có thể kiểm soát tác động này thông qua hai tham số điều phối CPU:

```bash
# Tỷ lệ phần trăm CPU tối thiểu dành cho việc dọn dẹp phân mảnh không dưới 20%
config set active-defrag-cycle-min 20
# Tỷ lệ phần trăm CPU tối đa dành cho việc dọn dẹp phân mảnh không quá 50%
config set active-defrag-cycle-max 50
```

Ngoài ra, khởi động lại node cũng là một cách giải phóng và sắp xếp lại bộ nhớ phân mảnh một cách triệt để. Nếu đang vận hành cụm Redis với kiến trúc High Availability (HA), bạn có thể chủ động chuyển đổi Master node có tỷ lệ phân mảnh cao thành Replica node rồi tiến hành restart an toàn.

## Tài liệu tham khảo

- Tài liệu chính thức của Redis: <https://redis.io/topics/memory-optimization>
- Kỹ thuật cốt lõi và thực chiến Redis - Geek Time - Sau khi xóa dữ liệu, tại sao tỷ lệ chiếm dụng bộ nhớ vẫn rất cao?: <https://time.geekbang.org/column/article/289140>
- Phân tích mã nguồn Redis — Cấp phát bộ nhớ: <https://shinerio.cc/2020/05/17/redis/Redis-源码解析——内存管理>
