---
title: Giải thích chi tiết các cơ chế Persistence trong Redis
description: Phân tích chuyên sâu ba cơ chế lưu trữ bền vững (Persistence) trong Redis gồm RDB Snapshot, nhật ký AOF và Hybrid Persistence (lưu trữ kết hợp), bao gồm nguyên lý hoạt động, cách cấu hình và so sánh ưu nhược điểm để giúp bạn lựa chọn chiến lược Persistence phù hợp với kịch bản nghiệp vụ.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Persistence,RDB,AOF,Hybrid Persistence,bgsave,Khôi phục dữ liệu,Sao lưu Redis,fork tiến trình con
lang: vi
sourceRef: zh-ref/database/redis/redis-persistence.md
---

Khi sử dụng cache, chúng ta thường cần thực hiện lưu trữ bền vững (Persistence) cho dữ liệu trong bộ nhớ, tức là ghi dữ liệu đang nằm trên RAM xuống ổ cứng. Phần lớn lý do là để tái sử dụng dữ liệu về sau (chẳng hạn khôi phục dữ liệu sau khi khởi động lại máy hoặc sau sự cố phần cứng), hoặc để đồng bộ dữ liệu (chẳng hạn các node Master-Replica trong cụm Redis đồng bộ dữ liệu thông qua tệp RDB).

Một điểm rất quan trọng giúp Redis khác biệt với Memcached là Redis hỗ trợ Persistence, và hỗ trợ tới 3 phương thức Persistence:

- Ảnh chụp nhanh (Snapshotting, RDB)
- Tệp chỉ ghi nối tiếp (Append-Only File, AOF)
- Hybrid Persistence kết hợp RDB và AOF (bổ sung từ Redis 4.0)

Địa chỉ tài liệu chính thức: <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/> .

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis4.0-persitence-5af100fe.png)

**Bài viết này dựa trên phiên bản Redis 7.0+**. Cơ chế Persistence giữa các phiên bản có những khác biệt quan trọng; trước khi sử dụng, hãy kiểm tra phiên bản Redis của bạn:

| Phiên bản      | Cơ chế Persistence mặc định | Tính năng quan trọng                           |
| -------------- | --------------------------- | ---------------------------------------------- |
| **Redis 4.0**  | RDB                         | Bổ sung Hybrid Persistence (RDB + AOF)         |
| **Redis 6.0**  | RDB                         | AOF vẫn cần bật thủ công                       |
| **Redis 7.0**  | RDB                         | Giới thiệu Multi-Part AOF                      |
| **Redis 7.2+** | RDB                         | Tiếp tục tối ưu hiệu năng Persistence          |

**Khác biệt hành vi cốt lõi**:

- **Mức tiêu tốn bộ nhớ khi AOF rewrite**: Trước Redis 7.0, dữ liệu tăng thêm phát sinh trong lúc rewrite phải được giữ lại trên RAM; từ 7.0+ vấn đề này được giải quyết bằng Multi-Part AOF.
- **Hybrid Persistence**: Ở Redis 4.0–6.x cần bật thủ công; từ Redis 7.0+ được bật mặc định.

Kiểm tra phiên bản Redis của bạn:

```bash
redis-cli INFO server | grep redis_version
# Ví dụ đầu ra: redis_version:7.0.12
```

Hình dưới đây minh họa toàn bộ quy trình hoạt động của các cơ chế Persistence trong Redis, bao gồm những nội dung cốt lõi của bài viết này:

![Quy trình đầy đủ các cơ chế Persistence trong Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-persistence-flow-95efd545.png)

## RDB Persistence

### RDB Persistence là gì?

Redis có thể tạo ra một Snapshot (ảnh chụp nhanh) để thu được bản sao của dữ liệu lưu trong bộ nhớ tại **một thời điểm nhất định**. Sau khi tạo Snapshot, Redis có thể sao lưu bản Snapshot đó, sao chép sang các máy chủ khác để tạo các bản sao máy chủ có cùng dữ liệu (kiến trúc Master-Replica của Redis, chủ yếu dùng để nâng cao hiệu năng Redis), hoặc giữ lại tại chỗ để sử dụng khi khởi động lại máy chủ.

Snapshot Persistence là phương thức Persistence mặc định của Redis. Trong tệp cấu hình `redis.conf`, cấu hình mặc định như sau:

```clojure
# Cấu hình mặc định trên Redis 7.0 (định dạng một dòng)
save 3600 1 300 100 60 10000

# Ý nghĩa từng điều kiện:
# - Có ít nhất 1 key thay đổi trong vòng 3600 giây (1 giờ)
# - Có ít nhất 100 key thay đổi trong vòng 300 giây (5 phút)
# - Có ít nhất 10000 key thay đổi trong vòng 60 giây (1 phút)

# Tương đương với định dạng nhiều dòng ở các phiên bản cũ:
# save 3600 1
# save 300 100
# save 60 10000
```

### Tạo Snapshot RDB có làm block Main Thread không?

Redis cung cấp hai câu lệnh để tạo tệp Snapshot RDB:

- `save`: Thao tác lưu đồng bộ, sẽ block Main Thread (luồng chính) của Redis;
- `bgsave`: `fork` ra một tiến trình con (Child Process), và tiến trình con sẽ thực thi việc lưu.

> Ở đây chúng ta nói là Main Thread của Redis thay vì tiến trình chính (Main Process), chủ yếu vì sau khi khởi động, Redis thực hiện phần lớn công việc chính theo cách đơn luồng (single-threaded). Nếu bạn muốn mô tả nó là tiến trình chính của Redis thì cũng hoàn toàn chính xác.

#### Phân tích chi phí hiệu năng của fork

Mặc dù `bgsave` chạy trong tiến trình con và không block Main Thread xử lý các yêu cầu lệnh, nhưng **bản thân thao tác `fork` là thao tác gây block**, đồng thời phát sinh chi phí bộ nhớ bổ sung (các số liệu trong bảng dưới đây chỉ mang tính tham khảo; giá trị thực tế chịu ảnh hưởng bởi hiệu năng CPU, tỷ lệ phân mảnh bộ nhớ, tải hệ thống và các yếu tố khác):

| Kích thước tập dữ liệu | Độ trễ fork | Bộ nhớ chiếm dụng thêm        | Mức độ rủi ro |
| ---------------------- | ----------- | ----------------------------- | ------------- |
| < 1GB                  | < 10ms      | ~10MB (sao chép bảng trang)   | Thấp          |
| 1-10GB                 | 10-100ms    | 10-100MB                      | Trung bình    |
| 10-50GB                | 100ms-1s    | 100-500MB                     | Cao           |
| > 50GB                 | > 1s        | > 500MB                       | Cực kỳ cao    |

> Bài viết này lấy `bgsave` của RDB làm ví dụ để minh họa tác động hiệu năng của `fork`, nhưng **cơ chế tương tự cũng áp dụng cho AOF Rewrite (lệnh `BGREWRITEAOF`)**. AOF Rewrite cũng phải `fork` tiến trình con và đối mặt với cùng độ trễ `fork`, chi phí bộ nhớ COW và rủi ro THP. Trong môi trường Production, dù dùng RDB hay AOF Rewrite thì đều cần theo dõi các chỉ số hiệu năng liên quan đến `fork`.

#### Cơ chế Copy-on-Write (COW)

- Sau khi `fork`, tiến trình con dùng chung các trang nhớ (memory page, kích thước chuẩn 4KB) với tiến trình cha.
- Khi tiến trình cha hoặc tiến trình con sửa đổi một trang nhớ nào đó, nhân hệ điều hành (kernel) sẽ sao chép trang đó ra bản riêng (Copy-on-Write).
- Khi tập dữ liệu lớn + tải ghi cao, điều này sẽ dẫn tới việc sao chép hàng loạt trang nhớ và ảnh hưởng đến hiệu năng.

#### Vấn đề bùng nổ bộ nhớ (Memory Avalanche) do THP (Transparent Huge Pages)

Các bản phân phối Linux mặc định bật **THP (Transparent Huge Pages — Trang lớn trong suốt)** với kích thước 2MB. THP làm tăng xác suất các trang lớn bị kích hoạt COW. **Trong trường hợp xấu nhất**, nếu bộ nhớ bị gộp thành trang lớn 2MB, thì ngay cả khi client chỉ sửa đổi 10 byte dữ liệu, kernel vẫn phải sao chép toàn bộ trang nhớ 2MB, khiến chi phí bộ nhớ của COW bị **phóng đại lên 512 lần** (2MB / 4KB = 512).

**Hành vi thực tế**: Kernel không ép toàn bộ bộ nhớ phải dùng trang lớn 2MB, mà tự động quyết định có gộp trang hay không tùy theo tình hình thực tế. Chỉ khi THP đã gộp thành công thành trang lớn thì thao tác sửa đổi mới kích hoạt COW 2MB. Tuy nhiên, trong kịch bản ghi đồng thời cao (high-concurrency write), điều này vẫn làm tăng đáng kể mức tiêu thụ bộ nhớ, thậm chí có thể hút cạn RAM máy chủ chỉ trong tích tắc và kích hoạt **OOM Killer buộc dừng tiến trình Redis**.

**Cách kiểm tra**:

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
# Kết quả [always] madvise never nghĩa là đang bật (rất nguy hiểm!)
# Kết quả đúng phải là always madvise [never]
```

**Giải pháp**: Thêm `echo never > /sys/kernel/mm/transparent_hugepage/enabled` vào script khởi động Redis, hoặc dùng `redis-server --disable-thp yes` (hỗ trợ từ Redis 6.0+).

**Cảnh báo khi khởi động**: Khi Redis phát hiện THP đang bật, nó sẽ in ra log khởi động `WARNING you have Transparent Huge Pages (THP) support enabled in your kernel`; cần xử lý ngay lập tức.

#### Khuyến nghị cho môi trường Production

```bash
# 1. Giám sát các chỉ số rủi ro fork
redis-cli INFO memory | grep -E "(used_memory|used_memory_rss)"

# Ví dụ đầu ra:
# used_memory:1073741824
# used_memory_rss:1226833920
# used_memory_rss_human:1.14G

# Tính tỷ lệ RSS/USED, khi fork nên < 2
# Nếu tiệm cận hoặc vượt quá 2, rủi ro khi fork là rất cao

# 2. Cấu hình maxmemory để giới hạn RAM của Redis, chừa không gian cho fork
# Thiết lập trong redis.conf:
# maxmemory 8gb
# maxmemory-policy allkeys-lru

# 3. Tránh kích hoạt thủ công BGSAVE trong giờ cao điểm
# Hãy để Redis tự động kích hoạt theo các quy tắc đã cấu hình

# 4. Cân nhắc kiến trúc Master-Replica + thực hiện Persistence trên Replica
# Chuyển tác vụ Persistence sang node Replica để tránh chi phí fork trên node Master
```

**Cảnh báo giám sát**:

- `rdb_last_bgsave_time_sec`: Thời gian thực thi `bgsave` gần nhất, nên `< 5s`.
- `rdb_last_cow_size`: Dung lượng bộ nhớ COW của lần `fork` gần nhất, nên `< 10%` của `used_memory`.

## AOF Persistence

### AOF Persistence là gì?

So với Snapshot Persistence, AOF Persistence có tính thời gian thực tốt hơn. Mặc định Redis không bật cơ chế AOF (Append-Only File); bạn có thể bật thông qua tham số `appendonly`:

> **Lưu ý về phiên bản**: Redis mặc định sử dụng cơ chế RDB Persistence. Nếu muốn sử dụng AOF, bạn cần cấu hình thủ công `appendonly yes`. Redis 7.0 giới thiệu cơ chế Multi-Part AOF để tối ưu hiệu năng AOF, nhưng không làm thay đổi cơ chế Persistence mặc định.

```bash
appendonly yes
```

Sau khi bật AOF Persistence, mỗi lần thực thi một lệnh làm thay đổi dữ liệu trong Redis, Redis sẽ ghi lệnh đó vào bộ đệm AOF `server.aof_buf`, rồi ghi tiếp vào tệp AOF (lúc này dữ liệu vẫn đang nằm trong buffer nhân hệ điều hành và chưa được đồng bộ xuống đĩa), và cuối cùng dựa vào chính sách `fsync` được cấu hình để quyết định thời điểm đồng bộ dữ liệu từ buffer nhân hệ điều hành xuống ổ cứng.

Chỉ khi đã được đồng bộ xuống ổ đĩa thì dữ liệu mới thực sự được lưu trữ bền vững; nếu không vẫn tồn tại rủi ro mất dữ liệu — chẳng hạn nếu dữ liệu trong buffer nhân hệ điều hành chưa kịp đồng bộ mà máy chủ gặp sự cố sập nguồn, phần dữ liệu đó sẽ bị mất.

Vị trí lưu tệp AOF giống với tệp RDB, đều được thiết lập qua tham số `dir`, và tên tệp mặc định là `appendonly.aof`.

### Quy trình hoạt động cơ bản của AOF như thế nào?

Việc triển khai cơ chế AOF Persistence có thể chia đơn giản thành 5 bước:

1. **Nối lệnh (`append`)**: Tất cả các lệnh ghi sẽ được nối thêm vào bộ đệm AOF (`AOF buffer`).
2. **Ghi tệp (`write`)**: Ghi dữ liệu từ bộ đệm AOF vào tệp AOF. Bước này cần gọi hàm `write` (lời gọi hệ thống / syscall); `write` sẽ đưa dữ liệu vào buffer nhân hệ điều hành rồi trả về ngay lập tức (ghi trễ / delayed write). Lưu ý!!! Lúc này dữ liệu vẫn chưa được đồng bộ xuống đĩa.
3. **Đồng bộ tệp (`fsync`)**: Đây mới là bước cốt lõi của Persistence! Dựa theo chính sách `appendfsync` cấu hình trong `redis.conf`, Redis sẽ gọi hàm `fsync` (syscall) tại các thời điểm khác nhau. `fsync` thao tác trên từng tệp đơn lẻ để cưỡng bức đồng bộ xuống ổ cứng (ghi dữ liệu từ buffer nhân xuống đĩa); `fsync` sẽ block cho đến khi ghi đĩa hoàn tất rồi mới trả về, qua đó đảm bảo tính bền vững của dữ liệu.
4. **Viết lại tệp (`rewrite`)**: Khi tệp AOF ngày càng phình to, cần định kỳ viết lại (rewrite) tệp AOF nhằm mục đích nén gọn dung lượng.
5. **Nạp lại khi khởi động (`load`)**: Khi Redis khởi động lại, hệ thống có thể nạp tệp AOF để khôi phục dữ liệu.

> Hệ điều hành Linux cung cấp trực tiếp một số hàm dùng để truy cập và điều khiển tệp cũng như thiết bị; các hàm này được gọi là **lời gọi hệ thống (system call / syscall)**.

Dưới đây là giải thích lại các lời gọi hệ thống Linux vừa đề cập:

- `write`: Sau khi ghi vào buffer nhân hệ điều hành thì trả về ngay lập tức (chỉ mới ghi vào buffer), không đồng bộ ngay xuống ổ cứng. Tuy cải thiện hiệu năng nhưng lại phát sinh rủi ro mất dữ liệu. **Thao tác đồng bộ xuống ổ cứng phụ thuộc vào chính sách ghi ngược trang bẩn (Dirty Page Writeback) của nhân Linux**, chủ yếu chịu ảnh hưởng bởi các tham số sau:
  - `/proc/sys/vm/dirty_expire_centisecs`: Thời gian hết hạn của trang bẩn (mặc định 30 giây)
  - `/proc/sys/vm/dirty_writeback_centisecs`: Chu kỳ đánh thức luồng writeback của kernel (mặc định 5 giây)
  - Áp lực bộ nhớ hệ thống: Khi thiếu RAM, kernel sẽ kích hoạt đồng bộ tích cực hơn
- **Điều này có nghĩa là ở chế độ `appendfsync no`, lượng dữ liệu có thể bị mất khi máy chủ sập là không thể kiểm soát và không thể dự đoán**, tùy thuộc vào thời điểm đồng bộ gần nhất của kernel.
- `fsync`: `fsync` dùng để cưỡng bức xả (flush) buffer nhân hệ điều hành (đồng bộ xuống đĩa), đảm bảo thao tác ghi đĩa kết thúc mới trả về.

Sơ đồ quy trình hoạt động của AOF như sau:

![Quy trình hoạt động cơ bản của AOF](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aof-work-process-de6bd5f8.png)

### Có những chế độ AOF Persistence nào?

Trong tệp cấu hình của Redis tồn tại ba chế độ AOF Persistence (chính sách `fsync`) khác nhau, cụ thể là:

1. `appendfsync always`: Sau khi Main Thread gọi `write` thực hiện thao tác ghi, nó sẽ gọi ngay hàm `fsync` để đồng bộ tệp AOF (flush xuống đĩa); trong thời gian đó Main Thread bị block cho đến khi `fsync` đẩy toàn bộ dữ liệu xuống đĩa mới trả về. Với chính sách `always`, **Main Thread trực tiếp thực thi `fsync`** chứ không phải luồng nền. Cách này an toàn dữ liệu nhất, về lý thuyết không mất bất kỳ dữ liệu nào. Nhưng vì mỗi thao tác ghi đều đồng bộ hóa gây block Main Thread nên hiệu năng cực kỳ kém.
2. `appendfsync everysec`: Sau khi Main Thread gọi `write` thực hiện thao tác ghi thì trả về ngay lập tức, còn một luồng nền (luồng `aof_fsync`) sẽ gọi hàm `fsync` (syscall) mỗi giây một lần để đồng bộ tệp AOF (`write` + `fsync`, chu kỳ `fsync` là 1 giây). Cách này hầu như không ảnh hưởng đến hiệu năng của Main Thread, tạo nên sự cân bằng tuyệt vời giữa hiệu năng và an toàn dữ liệu. Tuy nhiên, khi Redis sập bất thường, thông thường có thể mất dữ liệu trong 1 giây gần nhất.

> **Thực tế ở mức Production (Rủi ro mất 2 giây và bị block)**:
>
> "Mất tối đa 1 giây" là kịch bản lý tưởng. Khi I/O đĩa bận rộn và `fsync` chạy nền mất quá nhiều thời gian, Main Thread khi thực thi lệnh ghi sẽ kiểm tra thời gian hoàn thành của lần `fsync` trước đó. Nếu đã quá 2 giây kể từ lần `fsync` thành công gần nhất, Main Thread sẽ bị **cưỡng bức block** để bảo vệ bộ nhớ không bị phình vỡ (logic kiểm tra block `aof_background_fsync` trong mã nguồn `aof.c` của Redis).
>
> Do đó, **trong tình huống sập nguồn cực đoan, có thể mất tối đa 2 giây dữ liệu**, và sự dao động hiệu năng đĩa (disk jitter) sẽ trực tiếp khiến độ trễ P99 của Redis tăng vọt.
>
> **Chỉ số bắt buộc phải giám sát**: `redis-cli INFO persistence | grep aof_delayed_fsync` (ghi nhận tổng số lần Main Thread bị block bởi `fsync`; trường này chỉ xuất hiện khi đã bật AOF).

3. `appendfsync no`: Sau khi Main Thread gọi `write` thực hiện thao tác ghi thì trả về ngay lập tức, để hệ điều hành quyết định thời điểm đồng bộ — trên Linux thường là 30 giây một lần (`write` nhưng không `fsync`, thời điểm `fsync` do hệ điều hành quyết định). Cách này cho hiệu năng tốt nhất vì tránh được việc block do `fsync`. Nhưng độ an toàn dữ liệu kém nhất: lượng dữ liệu bị mất khi sập máy là không thể kiểm soát, phụ thuộc vào thời điểm đồng bộ gần nhất của hệ điều hành.

Có thể thấy: **Sự khác biệt chính giữa 3 phương thức Persistence này nằm ở thời điểm `fsync` đồng bộ tệp AOF (flush xuống đĩa)**.

Để dung hòa giữa độ an toàn dữ liệu và hiệu năng ghi, có thể cân nhắc tùy chọn `appendfsync everysec` để Redis đồng bộ tệp AOF mỗi giây một lần, giúp ảnh hưởng đến hiệu năng Redis ở mức nhỏ. Thông thường, ngay cả khi xảy ra sập hệ thống, người dùng tối đa chỉ mất dữ liệu phát sinh trong vòng một giây. Khi ổ cứng đang bận thực thi các thao tác ghi, Redis cũng sẽ chủ động giảm tốc độ một cách uyển chuyển để thích ứng với tốc độ ghi tối đa của ổ cứng.

> ⚠️ **Lưu ý**: Khi nút thắt cổ chai I/O đĩa nghiêm trọng, Main Thread của Redis có thể bị block tới 2 giây để chờ `fsync`, khiến cửa sổ mất dữ liệu mở rộng thành 2 giây. Môi trường Production nên giám sát chỉ số `aof_delayed_fsync` để đánh giá tình trạng sức khỏe của ổ đĩa.

Từ phiên bản Redis 7.0.0 trở đi, Redis sử dụng cơ chế **Multi-Part AOF**. Đúng như tên gọi, Multi-Part AOF tách tệp AOF đơn lẻ trước đây thành nhiều tệp AOF. Trong Multi-Part AOF, tệp AOF được chia thành ba loại:

- BASE: Đại diện cho tệp AOF cơ sở, thường được tạo ra bởi tiến trình con thông qua quá trình rewrite; loại tệp này có tối đa một tệp.
- INCR: Đại diện cho tệp AOF gia tăng (incremental), thường được tạo ra khi AOFRW bắt đầu thực thi; có thể tồn tại nhiều tệp loại này.
- HISTORY: Đại diện cho tệp AOF lịch sử, hình thành từ các tệp BASE và INCR AOF trước đó; mỗi khi AOFRW hoàn thành thành công, các tệp BASE và INCR AOF tương ứng trước lần AOFRW này đều sẽ chuyển thành HISTORY, và các tệp loại HISTORY sẽ được Redis tự động xóa.

Multi-Part AOF không phải là trọng tâm chính nên chỉ cần nắm tổng quan; nếu muốn tìm hiểu chi tiết, bạn có thể tham khảo bài viết của kỹ sư Alibaba: [Thiết kế và triển khai Multi-Part AOF trong Redis 7.0](https://zhuanlan.zhihu.com/p/467217082).

**Issue liên quan**: [Cơ chế AOF của Redis #783](https://github.com/Snailclimb/JavaGuide/issues/783).

### Tại sao AOF lại ghi log sau khi thực thi xong câu lệnh?

Các cơ sở dữ liệu quan hệ (như MySQL) thường ghi log trước khi thực thi câu lệnh (để thuận tiện cho việc khôi phục sau sự cố), trong khi cơ chế AOF Persistence của Redis lại ghi log sau khi thực thi xong câu lệnh.

![Quá trình ghi log của AOF](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-aof-write-log-disc-7a4b70ef.png)

**Tại sao lại ghi log sau khi thực thi xong câu lệnh?**

- Tránh chi phí kiểm tra bổ sung: việc ghi log AOF sẽ không thực hiện kiểm tra cú pháp câu lệnh;
- Ghi sau khi thực thi xong câu lệnh giúp không làm block quá trình thực thi câu lệnh hiện tại.

Tuy nhiên, cách làm này cũng mang lại rủi ro (như đã đề cập ở phần giới thiệu AOF Persistence trước đó):

- Nếu vừa thực thi xong câu lệnh mà Redis bị sập ngay lập tức thì thay đổi tương ứng sẽ bị mất;
- Có thể gây block cho quá trình thực thi các câu lệnh tiếp theo (việc ghi log AOF diễn ra trên Main Thread của Redis).

### Bạn có hiểu về AOF Rewrite không?

Khi tệp AOF trở nên quá lớn, Redis có thể tự động viết lại (rewrite) tệp AOF ở chế độ nền để tạo ra một tệp AOF mới; tệp AOF mới này lưu giữ trạng thái cơ sở dữ liệu giống hệt tệp AOF cũ nhưng có dung lượng nhỏ gọn hơn.

![AOF Rewrite](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aof-rewrite-85c7d34e.png)

> AOF rewrite (viết lại AOF) là một tên gọi dễ gây hiểu nhầm: tính năng này hoạt động bằng cách đọc trực tiếp các cặp key-value trong cơ sở dữ liệu, mà hoàn toàn không cần đọc, phân tích hay ghi gì lên tệp AOF hiện có.

Do quá trình AOF rewrite thực hiện lượng lớn thao tác ghi, để tránh ảnh hưởng tới việc xử lý các yêu cầu lệnh bình thường của Redis, Redis đưa tiến trình AOF rewrite vào chạy trong một tiến trình con (Child Process).

Trong thời gian rewrite tệp AOF, Redis còn duy trì một **AOF rewrite buffer** (bộ đệm viết lại AOF); bộ đệm này sẽ ghi nhận toàn bộ các lệnh ghi mà máy chủ thực thi trong khoảng thời gian tiến trình con tạo tệp AOF mới. Sau khi tiến trình con hoàn tất việc tạo tệp AOF mới, máy chủ sẽ nối toàn bộ nội dung trong rewrite buffer vào cuối tệp AOF mới, giúp trạng thái cơ sở dữ liệu lưu trong tệp AOF mới khớp hoàn toàn với trạng thái cơ sở dữ liệu hiện tại. Cuối cùng, máy chủ thay thế tệp AOF cũ bằng tệp AOF mới để hoàn tất thao tác rewrite tệp AOF.

Để sử dụng chức năng AOF rewrite, bạn có thể gọi thủ công lệnh `BGREWRITEAOF`, hoặc thiết lập hai tham số cấu hình dưới đây để hệ thống tự động quyết định thời điểm kích hoạt:

- `auto-aof-rewrite-min-size`: Nếu kích thước tệp AOF nhỏ hơn giá trị này thì sẽ không kích hoạt AOF rewrite. Giá trị mặc định là `64 MB`;
- `auto-aof-rewrite-percentage`: Tỷ lệ giữa kích thước AOF hiện tại (`aof_current_size`) và kích thước AOF ở lần rewrite trước (`aof_base_size`). Nếu kích thước tệp AOF hiện tại tăng thêm đạt tỷ lệ phần trăm này thì sẽ kích hoạt AOF rewrite. Đặt giá trị này bằng `0` sẽ tắt tính năng tự động AOF rewrite. Giá trị mặc định là `100`.

**Biên lỗi (Failure Boundaries) và các kịch bản rủi ro của AOF Rewrite**:

Mặc dù AOF rewrite được đặt trong tiến trình con để thực thi, vẫn tồn tại những rủi ro sau mà bạn cần nắm rõ:

| Kịch bản rủi ro       | Tác động                                       | Điều kiện kích hoạt                   | Biện pháp ứng phó                                               |
| --------------------- | ---------------------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| **fork thất bại**     | Không thể tạo tiến trình con rewrite           | Thiếu RAM, giới hạn hệ điều hành      | Giám sát mức sử dụng RAM, cấu hình `maxmemory`                  |
| **Đầy ổ đĩa**         | Ghi tệp AOF mới thất bại                       | Dữ liệu tăng nhanh trong lúc rewrite  | Giám sát dung lượng đĩa (`df -h`), đặt ngưỡng cảnh báo 70%      |
| **Cạn kiệt inode**    | Không thể tạo tệp mới                          | Hệ thống có quá nhiều tệp nhỏ         | Giám sát tỷ lệ sử dụng inode (`df -i`), dọn dẹp tệp tạm         |
| **Lùi mốc thời gian** | Quản lý tệp Multi-Part AOF bị rối loạn         | Vấn đề đồng bộ đồng hồ trên VM        | Cấu hình dịch vụ NTP, bật `aof-timestamp-enabled`               |
| **Tín hiệu SIGTERM**  | Rewrite bị gián đoạn giữa chừng                | Kỹ sư vận hành khởi động lại thủ công | Cấu hình tắt máy mềm dẻo (`shutdown-timeout`)                   |

**Khuyến nghị giám sát trên môi trường Production**:

```bash
# Giám sát trạng thái AOF rewrite
redis-cli INFO persistence | grep aof_rewrite_in_progress

# Giám sát tốc độ tăng kích thước tệp AOF
redis-cli INFO persistence | grep aof_current_size
redis-cli INFO persistence | grep aof_base_size

# Kiểm tra tỷ lệ sử dụng ổ đĩa và inode
df -h /var/lib/redis
df -i /var/lib/redis

# Thiết lập chính sách fsync gia tăng trong lúc AOF rewrite (Redis 7.0+)
# aof-rewrite-incremental-sync yes
```

Trước phiên bản Redis 7.0, nếu có lệnh ghi phát sinh trong thời gian rewrite, AOF có thể tiêu tốn lượng lớn bộ nhớ và toàn bộ các lệnh ghi đến trong lúc rewrite đều phải ghi xuống đĩa hai lần.

Từ phiên bản Redis 7.0 trở đi, cơ chế AOF rewrite đã được tối ưu và cải tiến. Đoạn trích dưới đây được lấy từ bài viết [Nhìn lại quá khứ và tương lai của Redis từ bản phát hành Redis 7.0](https://mp.weixin.qq.com/s/RnoPPL7jiFSKkx3G4p57Pg) của kỹ sư Alibaba:

> Cách xử lý dữ liệu tăng thêm (incremental data) trong thời gian AOF rewrite luôn là một bài toán nan giải. Trước đây, dữ liệu tăng thêm trong lúc rewrite phải được giữ lại trên RAM, và sau khi rewrite kết thúc mới ghi phần dữ liệu tăng thêm đó vào tệp AOF mới để đảm bảo tính toàn vẹn dữ liệu. Có thể thấy AOF rewrite tiêu tốn thêm RAM và I/O đĩa — đây là nỗi đau cố hữu của Redis AOF rewrite; dù trước đó đã có nhiều lần cải tiến nhưng bài toán cốt lõi về tiêu hao tài nguyên vẫn chưa được giải quyết triệt để.
>
> Phiên bản doanh nghiệp Redis Enterprise Edition của Alibaba Cloud ban đầu cũng gặp vấn đề này; sau nhiều vòng phát triển lặp lại nội bộ, họ đã hiện thực hóa cơ chế Multi-Part AOF để giải quyết triệt để, đồng thời đóng góp lại cho cộng đồng và phát hành cùng bản 7.0 lần này. Cách làm cụ thể là tách `base` (dữ liệu toàn phần) và `incr` (dữ liệu tăng thêm) thành các tệp độc lập để lưu trữ, xóa bỏ hoàn toàn sự lãng phí tài nguyên RAM và I/O, đồng thời hỗ trợ lưu giữ và quản lý các tệp AOF lịch sử; kết hợp với thông tin dấu thời gian trong tệp AOF còn có thể thực hiện khôi phục theo điểm thời gian PITR (phiên bản doanh nghiệp Tair của Alibaba Cloud đã hỗ trợ), giúp nâng cao hơn nữa độ tin cậy dữ liệu của Redis và đáp ứng nhu cầu rollback dữ liệu của người dùng.

**Issue liên quan**: [Mô tả về Redis AOF Rewrite chưa chính xác #1439](https://github.com/Snailclimb/JavaGuide/issues/1439).

### Tệp AOF xác minh tính toàn vẹn dữ liệu như thế nào?

**Kết luận cốt lõi**: Tệp AOF thuần **không có** cơ chế checksum (mã kiểm tra toàn vẹn), mà chỉ xác minh thông qua việc phân tích cú pháp từng câu lệnh; checksum CRC64 chỉ tồn tại trong **phần RDB** của tệp Hybrid Persistence.

#### Chế độ AOF thuần: Không có checksum, chỉ phân tích cú pháp

Tệp AOF thuần không tính checksum CRC64 cho toàn bộ tệp hay từng câu lệnh riêng lẻ, mà xác minh tính hợp lệ bằng cách phân tích (parse) từng câu lệnh bên trong tệp.

**Tại sao không có checksum?**

AOF là nhật ký dạng văn bản được ghi nối tiếp với tần suất rất cao. Nếu mỗi lần nối thêm lệnh đều phải tính lại checksum CRC64 cho toàn bộ tệp thì sẽ kéo tụt nghiêm trọng CPU của Main Thread và I/O đĩa. Vì vậy Redis chọn cách nhẹ nhàng hơn: đọc và phân tích cú pháp từng lệnh một khi khởi động lại để nạp dữ liệu.

Nếu phát hiện lỗi cú pháp trong quá trình phân tích (như câu lệnh không đầy đủ, sai định dạng), Redis sẽ dừng nạp và báo lỗi.

> **Khả năng chịu lỗi cắt cụt phần đuôi (Tự động khôi phục)**:
>
> Khi gặp sự cố mất điện đột ngột hoặc bị dừng cưỡng bức bằng `kill -9`, câu lệnh cuối cùng trong tệp AOF rất dễ bị ghi dở dang (chỉ mới ghi được một nửa). Hành vi khôi phục lúc này được quyết định bởi cấu hình **`aof-load-truncated`**:
>
> | Giá trị cấu hình | Hành vi                                                                                             | Kịch bản áp dụng                                                    |
> | ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
> | `yes` (mặc định) | Redis tự động bỏ qua lệnh chưa hoàn chỉnh ở cuối tệp, tiếp tục khởi động xong và ghi cảnh báo ra log | Khuyến nghị cho môi trường Production, chấp nhận mất ít dữ liệu để đổi lấy tính khả dụng |
> | `no`             | Redis từ chối khởi động và báo lỗi ngay, buộc kỹ sư dùng công cụ `redis-check-aof` kiểm tra và sửa  | Các hệ thống tài chính hoặc nơi yêu cầu cực cao về toàn vẹn dữ liệu |
>
> **Kiểm chứng khôi phục phần đuôi bị cắt cụt**:
>
> ```bash
> # Mô phỏng kịch bản mất điện: nối thêm dữ liệu rác vô nghĩa vào cuối tệp AOF
> echo "truncated garbage data" >> /var/lib/redis/appendonly.aof
>
> # Khởi động lại Redis (khi aof-load-truncated=yes sẽ tự động khôi phục)
> redis-server /path/to/redis.conf
> # Log đầu ra: # Bad file format reading the append only file: make a backup of your AOF file, then use ./redis-check-aof --fix <filename>
> ```
>
> **Kịch bản thất bại**: Nếu phần **ở giữa** tệp AOF (chứ không phải phần đuôi) bị xuất hiện ký tự rác do lỗi hỏng đĩa âm thầm (silent disk corruption), cơ chế tự động cắt phần đuôi sẽ vô hiệu và Redis sẽ dừng hoạt động, từ chối phục vụ. Lúc này cần dùng công cụ `redis-check-aof --fix` để sửa chữa.

**Nguyên lý hoạt động của `redis-check-aof`**:

- **Giai đoạn phát hiện**: Đọc từng lệnh theo đúng định dạng tệp AOF, kiểm tra số lượng tham số, độ dài chuỗi tham số,... và chỉ ra vị trí trong tệp của lệnh bị lỗi / chưa hoàn chỉnh.
- **Giai đoạn sửa chữa**: Cắt bỏ toàn bộ phần nội dung phía sau vị trí bị lỗi (**Lưu ý: sẽ làm mất toàn bộ dữ liệu phía sau điểm cắt**); tệp gốc sẽ được sao lưu thành `appendonly.aof.broken`.

#### Chế độ Hybrid Persistence: Chiến lược kiểm tra phân đoạn

Ở **chế độ Hybrid Persistence** (giới thiệu từ Redis 4.0), tệp AOF áp dụng chiến lược kiểm tra "quản trị phân đoạn":

```
┌────────────────────────────────────────────────────────────────────┐
│                  Cấu trúc tệp Hybrid Persistence                   │
├────────────────────────────────────────────────────────────────────┤
│  Phần Snapshot RDB (Nhị phân) ← Được bảo vệ bởi checksum CRC64     │
│  ├── Phần đầu "REDIS"                                              │
│  ├── Mã DB, các cặp key-value...                                   │
│  ├── Cờ đánh dấu EOF                                               │
│  └── Checksum CRC64 (8 byte)  ← Biên kiểm tra dừng tại đây         │
├────────────────────────────────────────────────────────────────────┤
│  Phần AOF gia tăng (Văn bản)  ← Không checksum, chỉ parse cú pháp  │
│  ├── *3\r\n$3\r\nSET\r\n...                                        │
│  └── ...                                                           │
└────────────────────────────────────────────────────────────────────┘
```

- **Phần Snapshot RDB**: Bắt đầu bằng chuỗi ký tự cố định `REDIS`, lưu trữ ảnh chụp nhanh dữ liệu trên RAM tại một thời điểm, và đính kèm một checksum CRC64 ở cuối dữ liệu Snapshot. Checksum này **nằm chặt ngay tại cuối khối dữ liệu RDB**, chỉ đảm bảo tính toàn vẹn cho phần Snapshot nhị phân này.
- **Phần AOF gia tăng**: Nối ngay phía sau Snapshot RDB, ghi lại các lệnh ghi phát sinh thêm. Phần này **vẫn không có checksum**, áp dụng cơ chế phân tích cú pháp từng lệnh giống hệt AOF thuần.

**Quy trình kiểm tra khi nạp tệp**:

1. Trước tiên Redis kiểm tra phần Snapshot RDB: tính toán checksum CRC64 của phần dữ liệu này và so sánh với giá trị checksum được lưu. Nếu không khớp, Redis từ chối khởi động.
2. Sau khi phần RDB vượt qua bước kiểm tra, Redis tiếp tục phân tích từng lệnh AOF gia tăng. Nếu gặp lỗi phân tích, nó sẽ dừng nạp các lệnh phía sau (nhưng lúc này dữ liệu Snapshot RDB đã được nạp thành công).

#### Giải thích các tham số cấu hình

| Tham số cấu hình     | Phạm vi áp dụng                                    | Mô tả                                                                          |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `rdbchecksum`        | Tệp RDB, phần RDB trong Hybrid Persistence         | Kiểm soát việc có tính checksum CRC64 hay không; không có tác dụng lên phần AOF |
| `aof-load-truncated` | Tệp AOF thuần, phần AOF gia tăng của tệp kết hợp   | Kiểm soát việc có tự động bỏ qua phần đuôi bị cắt cụt để tiếp tục khởi động hay không |

**Vá lỗi thủ công** (dành cho người dùng nâng cao):

- Nếu không muốn sửa tệp AOF bằng cách cắt bỏ phần đuôi, bạn có thể thử vá lỗi thủ công.
- Mở tệp AOF bằng trình soạn thảo văn bản (định dạng văn bản thuần), xóa hoặc sửa thủ công câu lệnh bị lỗi.
- Phù hợp cho các tình huống đặc thù khi đã biết chính xác vị trí lỗi.

## Các tối ưu hóa ở phiên bản mới

### Redis 4.0 đã tối ưu hóa cơ chế Persistence như thế nào?

Vì RDB và AOF đều có ưu điểm riêng, nên từ phiên bản 4.0, Redis bắt đầu hỗ trợ Hybrid Persistence kết hợp cả RDB và AOF.

#### Hướng dẫn cấu hình

```bash
# Bật AOF
appendonly yes

# Bật Hybrid Persistence (mặc định bật từ Redis 7.0+)
aof-use-rdb-preamble yes

# Tối ưu điều kiện kích hoạt rewrite
auto-aof-rewrite-percentage 100   # Kích hoạt rewrite khi kích thước tệp AOF tăng 100% so với lần rewrite trước
auto-aof-rewrite-min-size 64mb    # Chỉ kích hoạt rewrite khi tệp AOF đạt tối thiểu 64MB
```

**Khác biệt giữa các phiên bản**:

- **Redis 4.0–6.x**: Hybrid Persistence mặc định tắt, cần cấu hình thủ công `aof-use-rdb-preamble yes`.
- **Redis 7.0+**: Hybrid Persistence được **bật mặc định**, không cần cấu hình thêm.

#### Nguyên lý hoạt động

Khi bật Hybrid Persistence, trong lúc AOF rewrite, Redis sẽ ghi thẳng nội dung RDB vào phần đầu của tệp AOF. Lợi ích của cách làm này là kết hợp được ưu điểm của cả RDB và AOF: nạp dữ liệu nhanh đồng thời tránh mất quá nhiều dữ liệu.

**Cấu trúc tệp Hybrid Persistence**:

```
┌───────────────────┐
│   RDB Header      │ ← Snapshot nhị phân (định dạng nén)
│   REDIS0009       │
│   ...             │
├───────────────────┤
│   AOF Log Entries │ ← Các lệnh ở định dạng văn bản
│   *3\r\n$3\r\nSET\r\n$5\r\nkey01\r\n...
│   INCR counter    │
│   ...             │
└───────────────────┘
```

**Quy trình hoạt động cốt lõi**:

1. **Giai đoạn xử lý ghi**:

   - Client thực thi lệnh ghi (`SET/INCR`,...).
   - Redis cập nhật ngay dữ liệu trong bộ nhớ.
   - Nối lệnh vào bộ đệm AOF (định dạng văn bản).

2. **Giai đoạn kích hoạt Persistence**:

   - Kích thước tệp AOF đạt ngưỡng (mặc định 64MB) hoặc tăng thêm 100%.
   - Kích hoạt AOF rewrite (`BGREWRITEAOF`).

3. **Giai đoạn xây dựng tệp**:

   - Tiến trình con ghi dữ liệu hiện tại trong bộ nhớ theo định dạng RDB vào phần đầu của tệp AOF mới.
   - Tiến trình cha tiếp tục xử lý lệnh ghi, dữ liệu tăng thêm được ghi vào rewrite buffer.
   - Sau khi rewrite hoàn tất, nối các lệnh tăng thêm trong rewrite buffer vào cuối tệp AOF mới.

4. **Giai đoạn khôi phục dữ liệu**:
   - Khi Redis khởi động, hệ thống ưu tiên nạp phần RDB trước (khôi phục nhanh dữ liệu nền).
   - Sau đó phát lại (replay) tuần tự các lệnh AOF gia tăng (khôi phục dữ liệu mới nhất).

#### So sánh ưu thế

| Chỉ số                     | RDB thuần       | AOF thuần        | Hybrid Persistence |
| -------------------------- | --------------- | ---------------- | ------------------ |
| **Tốc độ khôi phục**       | Nhanh (tính giây)| Chậm (tính phút) | Nhanh (tính giây)  |
| **Cửa sổ mất dữ liệu**     | Tính bằng phút  | ≤2 giây          | ≤2 giây            |
| **Kích thước tệp**         | Nhỏ (đã nén)    | Lớn (log văn bản)| Trung bình         |
| **Ảnh hưởng hiệu năng ghi**| Thấp            | Cao              | Trung bình         |
| **Khả năng đọc hiểu**      | Kém (nhị phân)  | Tốt (văn bản)    | Kém (phần RDB)     |

**Số liệu benchmark** (tập dữ liệu 1GB, ổ SSD):

- Khôi phục bằng AOF thuần: 30–60 giây
- Khôi phục bằng Hybrid Persistence: 2–5 giây (**nhanh hơn 5–10 lần**)

**Nhược điểm của Hybrid Persistence**:

- Phần RDB nằm trong tệp AOF ở dạng nhị phân nén, không còn là định dạng AOF nữa nên khả năng đọc trực tiếp kém hơn.
- Tiêu tốn thêm CPU để nén và giải nén RDB.

#### Các vấn đề thường gặp và giải pháp

**1. Kiểm chứng cấu hình**:

```bash
# Cách 1: Kiểm tra phần đầu tệp (in ra REDIS nghĩa là đã bật Hybrid Persistence)
head -c 5 appendonly.aof

# Cách 2: Kiểm chứng qua CLI
redis-cli CONFIG GET aof-use-rdb-preamble
# Đầu ra: 1) "aof-use-rdb-preamble"
#         2) "yes"
```

**2. Khôi phục khi tệp bị hỏng**:

**Mô tả công cụ**:

| Công cụ             | Nguyên lý hoạt động                                                                           | Phát hiện lỗi                                                     | Khả năng sửa chữa                                                      |
| ------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **redis-check-aof** | Đọc lần lượt từng lệnh theo định dạng tệp AOF, kiểm tra số lượng tham số, độ dài chuỗi tham số | Kiểm tra tính đúng đắn và đầy đủ của lệnh, cung cấp vị trí lỗi    | ✅ **Hỗ trợ sửa**: cắt bỏ nội dung từ vị trí lỗi, hoặc vá thủ công     |
| **redis-check-rdb** | Đọc tuần tự phần đầu tệp, phần dữ liệu và phần đuôi tệp theo định dạng RDB                     | Đánh giá tính đúng đắn của nội dung trong quá trình đọc và báo lỗi| ❌ **Không hỗ trợ sửa**: chỉ phát hiện lỗi, cần sửa thủ công            |

**Các bước khôi phục**:

```bash
# Bước 1: Kiểm tra lỗi của tệp AOF
redis-check-aof appendonly.aof
# In ra vị trí lỗi và nguyên nhân

# Bước 2: Sửa tệp AOF (cắt bỏ từ vị trí lỗi)
redis-check-aof --fix appendonly.aof
# Tệp AOF gốc sẽ được sao lưu thành appendonly.aof.broken

# Bước 3: Kiểm tra phần RDB
redis-check-rdb appendonly.aof
# Chỉ kiểm tra, không hỗ trợ tham số --fix

# Bước 4: Nếu phần RDB bị lỗi, cần sửa thủ công hoặc bỏ toàn bộ tệp
# Tùy chọn A: Sửa thủ công (cần am hiểu định dạng nhị phân của RDB)
# Tùy chọn B: Xóa tệp Hybrid Persistence, chỉ khôi phục bằng RDB thuần hoặc AOF thuần

# Bước 5: Khởi động Redis
redis-server --appendonly yes --appendfilename appendonly.aof
```

> **⚠️ Lưu ý quan trọng**:
>
> - **Tệp AOF**: `redis-check-aof --fix` sẽ cắt tệp kể từ vị trí lỗi, **làm mất toàn bộ dữ liệu sau điểm cắt**.
> - **Tệp RDB**: `redis-check-rdb` **không hỗ trợ sửa chữa**; nếu phần RDB bị hỏng, toàn bộ tệp Hybrid Persistence sẽ không thể khôi phục và bạn chỉ có thể dựa vào bản sao lưu hoặc tệp AOF thuần.
> - **Sửa thủ công**: Với phần RDB, nếu bắt buộc phải sửa, cần dùng trình chỉnh sửa thập lục phân (hex editor như `hexdump`, `xxd`) để chỉnh sửa thủ công định dạng nhị phân.

#### Khuyến nghị cấu hình Production

```bash
# Ví dụ cấu hình Production đầy đủ
appendonly yes
aof-use-rdb-preamble yes

# Tối ưu hiệu năng
aof-rewrite-incremental-fsync yes   # fsync gia tăng, giảm đỉnh tải I/O đĩa
# Kịch bản nhạy cảm với độ trễ (khuyến nghị yes)
no-appendfsync-on-rewrite yes       # Tạm dừng fsync trong lúc rewrite để tránh block
# Kịch bản ưu tiên an toàn dữ liệu (khuyến nghị no)
no-appendfsync-on-rewrite no        # Vẫn chạy fsync trong lúc rewrite, có thể block nhưng an toàn hơn

# Khuyến nghị hoạch định dung lượng:
# - Dự phòng dung lượng ổ đĩa gấp 2x dung lượng RAM
# - Giữ kích thước mỗi tệp AOF < 16GB
# - Giám sát chỉ số aof_delayed_fsync
```

Địa chỉ tài liệu chính thức: <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/>

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis4.0-persitence-5af100fe.png)

### Redis 7.0 đã tối ưu hóa cơ chế Persistence như thế nào?

Do quá trình AOF rewrite tồn tại vấn đề phải đệm dữ liệu tăng thêm trên RAM và ghi hai lần xuống đĩa, từ Redis 7.0 trở đi hệ thống bắt đầu hỗ trợ Multi-Part AOF (mặc định bật, có thể chỉ định thư mục qua cấu hình `appenddirname`).

Khi bật Multi-Part AOF, tệp AOF sẽ được tách thành tệp `base` (tối đa một tệp, lưu Snapshot toàn phần ban đầu, có thể ở định dạng RDB hoặc AOF) và nhiều tệp `incr` (nhật ký lệnh gia tăng). Các lệnh mới phát sinh trong lúc rewrite được ghi trực tiếp vào tệp `incr` mới, và tệp `manifest` sẽ theo dõi toàn bộ các phần này. Cách làm này giúp loại bỏ chi phí bộ đệm RAM và thao tác ghi I/O hai lần khi rewrite, cải thiện hiệu năng và giảm nguy cơ bị block do `fsync`. Nhờ cấu trúc tệp tách biệt, các tệp `INCR` giữ trạng thái chỉ đọc (read-only) trước khi rewrite nên việc sao chép từng tệp đơn lẻ tương đối an toàn; tuy nhiên, việc sao lưu nhất quán liên tệp vẫn cần tạm dừng rewrite, quy trình backup tổng thể phức tạp hơn so với AOF đơn tệp, và ở các tập dữ liệu cực lớn vẫn cần giám sát tài nguyên.

> **Rủi ro điểm lỗi đơn cốt lõi: Tệp `manifest` bị hỏng**
>
> Multi-Part AOF phụ thuộc vào **tệp manifest** để theo dõi và quản lý toàn bộ các tệp `base/incr/history`; đây là metadata cốt lõi của cả hệ thống log gia tăng. Nếu tệp manifest bị hỏng hoặc thất lạc:
>
> | Kịch bản rủi ro                          | Tác động                                                                       | Độ khó khôi phục                            |
> | ---------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
> | **Tệp manifest bị hỏng âm thầm**         | Redis không thể nhận diện và nạp đúng tệp AOF khi khởi động, DB không khôi phục được | Cực cao (cần dựng lại manifest thủ công) |
> | **Sự cố đĩa làm mất tệp manifest**       | Dù các tệp base/incr còn nguyên vẹn, Redis vẫn không tái dựng được quan hệ phụ thuộc | Cực cao (cần can thiệp thủ công)         |
>
> **Biện pháp giảm thiểu rủi ro**:
>
> ```bash
> # 1. Sao lưu tệp manifest (quan trọng ngang hàng với các tệp dữ liệu)
> cp /var/lib/redis/appendonlydir/appendonly.aof.manifest /backup/
>
> # 2. Giám sát tình trạng ổ đĩa (phát hiện sớm hư hỏng)
> smartctl -a /dev/sda | grep -E "SMART overall-health self-assessment|Media_Errors"
>
> # 3. Định kỳ kiểm tra tính toàn vẹn của manifest (Redis cũng tự động kiểm tra khi khởi động)
> redis-check-aof /var/lib/redis/appendonlydir/appendonly.aof.manifest
> ```
>
> **Bản chính thức chưa cung cấp công cụ sửa chữa tự động**; môi trường Production bắt buộc phải đưa tệp `manifest` vào chiến lược sao lưu với mức độ quan trọng ngang bằng chính các tệp dữ liệu RDB/AOF.

## Chỉ số giám sát trong môi trường Production

### Chỉ số hiệu năng Persistence

```bash
# Các chỉ số liên quan đến RDB
redis-cli INFO persistence | grep rdb_last_bgsave_time_sec
# Khuyến nghị: < 5s. Vượt quá 5s cho thấy tập dữ liệu quá lớn hoặc có nghẽn I/O

redis-cli INFO persistence | grep rdb_last_cow_size
# Khuyến nghị: < 10% used_memory. Vượt quá cho thấy chi phí RAM Copy-on-Write khi fork lớn

redis-cli INFO memory | grep used_memory_rss
redis-cli INFO memory | grep used_memory
# Công thức tính: used_memory_rss / used_memory, khi fork nên < 2

# Các chỉ số liên quan đến AOF
redis-cli INFO persistence | grep aof_rewrite_in_progress
# Giá trị kỳ vọng: 0 (không rewrite) hoặc 1 (đang rewrite)

redis-cli INFO persistence | grep aof_current_size
redis-cli INFO persistence | grep aof_base_size
# Giám sát tốc độ tăng trưởng để tránh rewrite diễn ra quá dày đặc

redis-cli INFO persistence | grep aof_buffer_length
# Khuyến nghị: < 4MB. Quá lớn cho thấy Main Thread ghi nhanh hơn tốc độ fsync
```

### Giám sát tài nguyên hệ thống

```bash
# Mức sử dụng đĩa và thời gian chờ I/O
iostat -x 1 5 | grep dm-0
# Chú ý: %util (tỷ lệ sử dụng I/O), await (thời gian chờ trung bình)

# Dung lượng ổ đĩa (dự phòng không gian để rewrite tạo tệp mới)
df -h /var/lib/redis
# Khuyến nghị: mức sử dụng < 70%

# Tỷ lệ sử dụng inode (kịch bản nhiều tệp nhỏ)
df -i /var/lib/redis
# Khuyến nghị: mức sử dụng < 90%

# Mức sử dụng RAM
free -h
# Khuyến nghị: dự phòng tối thiểu 20% RAM trống cho thao tác fork
```

### Khuyến nghị quy tắc cảnh báo (Alert Rules)

> **Giải thích nguồn chỉ số**:
>
> - **Chỉ số Redis**: Thu thập qua `redis-cli INFO` hoặc Redis exporter (như `redis_rss_memory`, `aof_current_size`)
> - **Chỉ số cấp Node**: Thu thập qua `node_exporter` hoặc lệnh hệ thống (như `disk_usage`, RAM hệ thống, mức dùng CPU)
>
> Các quy tắc cảnh báo dưới đây giả định sử dụng hệ thống giám sát Prometheus + Redis exporter + `node_exporter`.

```yaml
alert_rules:
  # ── Cảnh báo liên quan đến Redis Persistence ─────────────────────
  - name: "RedisHighMemFragmentation"
    expr: redis_memory_rss_bytes / redis_memory_used_bytes > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Tỷ lệ phân mảnh bộ nhớ Redis quá cao, tăng rủi ro COW khi fork"
      description: >
        Instance {{ $labels.instance }} có mem_fragmentation_ratio = {{ $value | humanize }},
        vượt ngưỡng 2. Tỷ lệ phân mảnh quá cao đồng nghĩa OS đang cấp phát số trang vật lý nhiều hơn hẳn
        mức Redis tự thống kê; sau khi BGSAVE / BGREWRITEAOF kích hoạt fork, số trang mà COW cần sao chép
        sẽ tăng đáng kể, có thể làm RAM tăng vọt dưới tải ghi cao và tăng nguy cơ OOM.
        Khuyến nghị chạy MEMORY PURGE hoặc khởi động lại instance vào khung giờ thấp điểm để chống phân mảnh.

  - name: "RedisAofGrowthTooFast"
    expr: deriv(redis_aof_current_size_bytes[5m]) * 60 > 10485760
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Tốc độ ghi tệp AOF của Redis quá cao"
      description: >
        Tốc độ tăng trưởng AOF của instance {{ $labels.instance }} vượt quá 10 MB/phút
        (hiện tại khoảng {{ $value | humanize1024 }}B/phút).
        Ghi tốc độ cao sẽ liên tục kích hoạt auto-aof-rewrite, làm tăng áp lực I/O đĩa
        và có thể gây khuếch đại ghi (write amplification). Khuyến nghị kiểm tra xem nghiệp vụ
        có phát sinh bão lệnh nhỏ hoặc các lệnh quét toàn bộ như KEYS hay không.

  - name: "RedisAofFsyncDelayed"
    expr: rate(redis_aof_delayed_fsync_total[5m]) > 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Redis AOF fsync bị trễ, khả năng phản hồi của Main Thread bị nghẽn"
      description: >
        Instance {{ $labels.instance }} liên tục ghi nhận aof_delayed_fsync tăng lên;
        Main Thread bị block do phải chờ AOF fsync hoàn tất, khiến độ trễ P99 của lệnh xấu đi trực tiếp.
        Nguyên nhân phổ biến: 1) Băng thông I/O đĩa bão hòa; 2) appendfsync đang đặt là always;
        3) Dùng chung ổ đĩa với tiến trình I/O cao khác. Khuyến nghị chuyển sang everysec hoặc tách sang đĩa riêng.

  # ── Cảnh báo tài nguyên cấp Node ────────────────────────────────
  - name: "RedisDiskUsageHigh"
    expr: >
      (1 - node_filesystem_avail_bytes{mountpoint="/var/lib/redis"}
         / node_filesystem_size_bytes{mountpoint="/var/lib/redis"}) * 100 > 70
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Dung lượng phân vùng dữ liệu Redis đã dùng vượt quá 70%"
      description: >
        Điểm gắn /var/lib/redis hiện đang sử dụng {{ $value | humanize }}%.
        Trong lúc AOF rewrite sẽ tạo tạm tệp mới, cần dự phòng khoảng 1.5x dung lượng AOF hiện tại;
        thiếu dung lượng đĩa sẽ khiến rewrite thất bại và phát sinh log lỗi Redis "MISCONF".
        RDB bgsave cũng tương tự.
      remediation: >
        1. Dọn dẹp các bản Snapshot RDB hết hạn và tệp AOF lịch sử;
        2. Tăng auto-aof-rewrite-min-size để giảm tần suất rewrite;
        3. Mở rộng dung lượng ổ đĩa hoặc di chuyển thư mục dữ liệu sang phân vùng lớn hơn.
```

## Lựa chọn giữa RDB và AOF như thế nào?

Về ưu nhược điểm của RDB và AOF, trang tài liệu chính thức cũng giải thích khá chi tiết tại [Redis persistence](https://redis.io/docs/manual/persistence/); dưới đây là phần tổng hợp ngắn gọn kết hợp với góc nhìn thực tế.

**Những điểm RDB vượt trội hơn AOF**:

- **Tệp nhỏ gọn, phù hợp cho sao lưu và khôi phục thảm họa**: Tệp RDB lưu trữ dữ liệu nhị phân đã qua nén, ghi lại tập dữ liệu tại một thời điểm nhất định; dung lượng tệp rất nhỏ, cực kỳ phù hợp để sao lưu và khôi phục sau sự cố (Disaster Recovery). Trong khi đó, tệp AOF lưu lại từng câu lệnh ghi — tương tự binlog của MySQL — nên thường lớn hơn tệp RDB rất nhiều. Khi AOF trở nên quá lớn, Redis có thể tự động rewrite AOF ở chế độ nền; tệp AOF mới có trạng thái dữ liệu giống tệp cũ nhưng dung lượng nhỏ hơn. Tuy nhiên, trước phiên bản Redis 7.0, nếu có lệnh ghi trong lúc rewrite, AOF có thể tiêu tốn nhiều RAM và mọi lệnh ghi đến trong thời gian rewrite đều bị ghi xuống đĩa hai lần.
- **Tốc độ khôi phục nhanh**: Khi khôi phục dữ liệu từ tệp RDB, Redis chỉ cần phân tích trực tiếp để khôi phục dữ liệu mà không phải thực thi lại từng câu lệnh một, nên tốc độ rất nhanh. Ngược lại, AOF phải thực thi tuần tự từng lệnh ghi nên rất chậm. Nói cách khác, khi khôi phục các tập dữ liệu lớn, RDB nhanh hơn AOF đáng kể.
- **Lợi thế trong sao chép Master-Replica**: Trên node Replica, RDB hỗ trợ **đồng bộ lại một phần** (Partial Resynchronization) sau khi khởi động lại hoặc chuyển đổi dự phòng (failover). Replica có thể dùng Snapshot RDB để nhanh chóng đồng bộ về trạng thái tại một thời điểm của node Master mà không cần đồng bộ toàn bộ (full resync).
- **Chi phí hiệu năng thấp**: RDB tối đa hóa hiệu năng của Redis vì công việc Persistence duy nhất mà tiến trình cha Redis phải làm là `fork` ra một tiến trình con; tiến trình con sẽ đảm nhận toàn bộ phần việc còn lại. Tiến trình cha không bao giờ phải thực hiện thao tác I/O đĩa hay tác vụ tương tự.

**Những điểm AOF vượt trội hơn RDB**:

- **An toàn dữ liệu cao hơn, hỗ trợ Persistence ở mức từng giây**: Độ an toàn dữ liệu của RDB kém hơn AOF, không thể lưu trữ dữ liệu theo thời gian thực hoặc theo từng giây. Quá trình tạo tệp RDB khá nặng nề; tuy tiến trình con của `BGSAVE` ghi tệp RDB không block Main Thread, nhưng vẫn ảnh hưởng đến tài nguyên CPU và RAM của máy chủ, trong trường hợp nghiêm trọng thậm chí có thể làm sập dịch vụ Redis. AOF hỗ trợ kiểm soát mất dữ liệu ở mức giây (tùy thuộc chính sách `fsync`: với `everysec`, thông thường mất tối đa 1 giây dữ liệu; nhưng khi I/O đĩa bận rộn có thể mất 2 giây và Main Thread sẽ bị block), và việc chỉ nối thêm lệnh vào tệp AOF là thao tác rất nhẹ.
- **Khả năng tương thích phiên bản tốt**: Tệp RDB được lưu dưới một định dạng nhị phân đặc thù, và qua quá trình phát triển của Redis đã xuất hiện nhiều phiên bản định dạng RDB khác nhau, dẫn đến vấn đề phiên bản Redis cũ không tương thích với định dạng RDB của phiên bản mới.
- **Khả năng đọc hiểu và thao tác trực tiếp cao**: AOF chứa nhật ký của mọi thao tác ở định dạng dễ hiểu và dễ phân tích. Bạn có thể dễ dàng xuất tệp AOF để phân tích, hoặc can thiệp trực tiếp vào tệp AOF để xử lý sự cố. Ví dụ, nếu lỡ tay chạy lệnh `FLUSHALL` xóa sạch dữ liệu, chỉ cần tệp AOF chưa bị rewrite, bạn chỉ việc xóa câu lệnh cuối cùng rồi khởi động lại Redis là có thể khôi phục trạng thái trước đó.
- **Nhật ký chỉ ghi nối tiếp, không rủi ro hỏng cấu trúc khi mất điện**: Nhật ký AOF là log chỉ ghi nối tiếp (append-only), không cần thao tác định vị (seek) và không gặp vấn đề hỏng cấu trúc do mất điện. Ngay cả khi vì lý do nào đó (đầy đĩa hoặc nguyên nhân khác) mà nhật ký kết thúc bằng một câu lệnh ghi dở dang, công cụ `redis-check-aof` vẫn có thể sửa chữa dễ dàng.

**Tác động của quá trình tiến hóa phiên bản đến việc lựa chọn**:

| Phiên bản     | Cải tiến cốt lõi                                    | Tác động lên AOF                                                       | Ý nghĩa khi lựa chọn                                                              |
| ------------- | --------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Redis 4.0** | Bổ sung Hybrid Persistence (`aof-use-rdb-preamble`) | Tệp base dùng định dạng RDB khi AOF rewrite, tốc độ khôi phục tăng 5–10x| Giảm bớt nhược điểm nạp chậm của AOF thuần, nhưng vẫn cần chú ý chi phí RAM và I/O khi rewrite |
| **Redis 7.0** | Bổ sung Multi-Part AOF                              | Xóa bỏ hoàn toàn vấn đề ghi hai lần khi rewrite, chi phí RAM và I/O giảm mạnh | Dùng riêng AOF trên Production khả thi hơn, nhưng vấn đề block do `fork` vẫn chưa được giải quyết |

**Các vấn đề cốt lõi chưa được giải quyết triệt để**:

- **Block do `fork`**: Dù dùng RDB `bgsave` hay AOF rewrite, bản thân thao tác `fork` đều gây block Main Thread (tập dữ liệu càng lớn, thời gian block càng lâu).
- **Khuyến nghị chính thức**: Tài liệu chính thức của Redis đến nay vẫn khuyến nghị **bật đồng thời cả RDB và AOF**, coi RDB như một phương án sao lưu nguội (cold backup) bổ sung để ứng phó với các tình huống cực đoan như tệp AOF bị hỏng hoặc lỗi ghi.

**Sự tương tác giữa AOF và RDB**:

Khi đồng thời bật cả AOF và RDB Persistence:

- **Tránh thực hiện các tác vụ I/O nặng cùng lúc**: Từ Redis 2.4+, hệ thống đảm bảo không kích hoạt AOF rewrite khi Snapshot RDB đang diễn ra, và cũng không cho phép chạy `BGSAVE` trong lúc đang AOF rewrite. Điều này ngăn hai tiến trình nền của Redis cùng thực hiện I/O đĩa nặng một lúc.
- **Lập lịch AOF rewrite**: Khi Snapshot đang diễn ra mà người dùng gửi yêu cầu rewrite log tường minh (qua `BGREWRITEAOF`), máy chủ sẽ trả về mã trạng thái `OK` để thông báo rằng thao tác đã được lên lịch và quá trình rewrite sẽ bắt đầu sau khi Snapshot hoàn tất.
- **Độ ưu tiên khi khởi động lại để khôi phục**: Nếu cả AOF và RDB Persistence đều được bật khi Redis khởi động lại, **tệp AOF sẽ được dùng để tái dựng lại tập dữ liệu gốc**, vì nó được đảm bảo là đầy đủ nhất.

**Khuyến nghị lựa chọn**:

| Kịch bản                                       | Phương án khuyến nghị                                                    | Mô tả                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Cache thuần túy (chấp nhận mất dữ liệu)**    | **Tắt Persistence** hoặc chỉ dùng RDB (tần suất thấp)                    | Tắt hoàn toàn có chi phí thấp nhất; nếu cần sao lưu nguội thì giữ RDB tần suất thấp |
| **Dữ liệu quan trọng trung bình** (session, cấu hình) | **Hybrid Persistence RDB + AOF** (Redis 4.0+)                      | RDB tăng tốc khôi phục, AOF bổ sung phần tăng thêm, `everysec` mất tối đa ~1s     |
| **Dữ liệu quan trọng cao** (dữ liệu nghiệp vụ cốt lõi) | **RDB + AOF (MP-AOF, Redis 7.0+)**, đồng thời Redis chỉ đóng vai trò tầng cache chứ không phải nơi lưu trữ duy nhất | MP-AOF giảm chi phí rewrite; việc lưu trữ bền vững thực sự do DB chính (MySQL,...) đảm nhận |
| **Kiến trúc Master-Replica**                   | **Tắt Persistence trên Master, bật AOF trên Replica**                    | Cấm cấu hình tự động khởi động lại trên node Master để tránh tập dữ liệu rỗng ghi đè lên Replica |

## Tài liệu tham khảo

- *Thiết kế và triển khai Redis* (*Redis Design and Implementation*)
- Redis persistence - Tài liệu chính thức Redis: <https://redis.io/docs/management/persistence/>
- The difference between AOF and RDB persistence: <https://www.sobyte.net/post/2022-04/redis-rdb-and-aof/>
- Giải thích chi tiết AOF Persistence trong Redis - Lập trình viên Lịch Tiểu Băng (Li Xiaobing): <http://remcarpediem.net/article/376c55d8/>
- Redis RDB và AOF Persistence · Analyze: <https://wingsxdu.com/posts/database/redis/rdb-and-aof/>
