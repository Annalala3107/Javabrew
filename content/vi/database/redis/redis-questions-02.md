---
title: Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 2)
description: "Tổng hợp câu hỏi phỏng vấn Redis mới nhất (Phần 2): phân tích chuyên sâu nguyên lý Redis transaction, tối ưu hiệu năng (pipeline/Lua/bigkey/hotkey), giải pháp cho Cache Penetration / Breakdown / Avalanche, slow query và phân mảnh bộ nhớ, cùng kiến trúc Redis Sentinel và Cluster. Giúp bạn tự tin vượt qua phỏng vấn kỹ thuật backend!"
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn Redis,Redis transaction,Tối ưu hiệu năng Redis,Redis cache penetration,Redis cache breakdown,Redis cache avalanche,Redis bigkey,Redis hotkey,Redis slow log,Phân mảnh bộ nhớ Redis,Redis cluster,Redis Sentinel,Redis Cluster,Redis pipeline,Redis Lua script
lang: vi
sourceRef: zh-ref/database/redis/redis-questions-02.md
---

## Redis Transaction (Giao dịch)

### Redis Transaction là gì?

Bạn có thể hiểu transaction trong Redis là: **Redis Transaction cung cấp một tính năng đóng gói nhiều lệnh request lại với nhau. Sau đó, thực thi tuần tự tất cả các lệnh đã đóng gói mà không bị gián đoạn giữa chừng.**

Trong phát triển thực tế, Redis Transaction rất ít khi được sử dụng và tính năng này tương đối hạn chế, không nên nhầm lẫn nó với giao dịch trong các cơ sở dữ liệu quan hệ (RDBMS) thông thường.

Redis Transaction không cung cấp cơ chế rollback khi thất bại như các hệ quản trị cơ sở dữ liệu quan hệ truyền thống; tính bền vững của nó phụ thuộc hoàn toàn vào cơ chế persistence của chính Redis. Mỗi lệnh trong transaction vẫn thực hiện tương tác mạng với Redis server: những lệnh này được xếp hàng trước trên server, đợi đến khi lệnh `EXEC` được gọi thì mới thực thi liên tiếp theo thứ tự.

Redis Transaction không được khuyến khích sử dụng trong công việc phát triển hàng ngày.

### Sử dụng Redis Transaction như thế nào?

Redis có thể hiện thực tính năng Transaction thông qua các lệnh như **`MULTI`, `EXEC`, `DISCARD` và `WATCH`**.

```bash
> MULTI
OK
> SET PROJECT "JavaGuide"
QUEUED
> GET PROJECT
QUEUED
> EXEC
1) OK
2) "JavaGuide"
```

Sau lệnh [`MULTI`](https://redis.io/commands/multi), bạn có thể nhập vào nhiều lệnh khác nhau, Redis sẽ không thực thi ngay mà đưa chúng vào một hàng đợi (queue). Chỉ khi lệnh [`EXEC`](https://redis.io/commands/exec) được gọi, toàn bộ các lệnh mới được thực thi.

Quá trình này diễn ra như sau:

1. Bắt đầu transaction (`MULTI`);
2. Đưa lệnh vào hàng đợi (các lệnh thao tác Redis hàng loạt, thực thi theo thứ tự vào trước ra trước - FIFO);
3. Thực thi transaction (`EXEC`).

Bạn cũng có thể hủy bỏ một transaction thông qua lệnh [`DISCARD`](https://redis.io/commands/discard), lệnh này sẽ dọn sạch toàn bộ các lệnh đang được lưu trong hàng đợi của transaction.

```bash
> MULTI
OK
> SET PROJECT "JavaGuide"
QUEUED
> GET PROJECT
QUEUED
> DISCARD
OK
```

Bạn có thể sử dụng lệnh [`WATCH`](https://redis.io/commands/watch) để giám sát các Key chỉ định. Khi gọi lệnh `EXEC` để thực thi transaction, nếu một Key đang bị `WATCH` giám sát bị **client/Session khác** sửa đổi, toàn bộ transaction sẽ không được thực thi.

```bash
# Client 1
> SET PROJECT "RustGuide"
OK
> WATCH PROJECT
OK
> MULTI
OK
> SET PROJECT "JavaGuide"
QUEUED

# Client 2
# Trước khi Client 1 thực thi lệnh EXEC để commit transaction, sửa đổi giá trị của PROJECT
> SET PROJECT "GoGuide"

# Client 1
# Sửa đổi thất bại, vì giá trị của PROJECT đã bị Client 2 sửa đổi trước đó
> EXEC
(nil)
> GET PROJECT
"GoGuide"
```

Tuy nhiên, nếu **WATCH** và **Transaction** nằm trong cùng một Session, và thao tác sửa đổi Key bị giám sát diễn ra ngay BÊN TRONG transaction, thì transaction đó vẫn có thể thực thi thành công (issue liên quan: [Hiệu ứng khác nhau khi lệnh WATCH gặp lệnh MULTI](https://github.com/Snailclimb/JavaGuide/issues/1714)).

Sửa đổi Key bị WATCH giám sát từ bên trong transaction:

```bash
> SET PROJECT "JavaGuide"
OK
> WATCH PROJECT
OK
> MULTI
OK
> SET PROJECT "JavaGuide1"
QUEUED
> SET PROJECT "JavaGuide2"
QUEUED
> SET PROJECT "JavaGuide3"
QUEUED
> EXEC
1) OK
2) OK
3) OK
127.0.0.1:6379> GET PROJECT
"JavaGuide3"
```

Sửa đổi Key bị WATCH giám sát từ bên ngoài transaction:

```bash
> SET PROJECT "JavaGuide"
OK
> WATCH PROJECT
OK
> SET PROJECT "JavaGuide2"
OK
> MULTI
OK
> GET USER
QUEUED
> EXEC
(nil)
```

Giới thiệu liên quan trên trang chủ Redis [https://redis.io/topics/transactions](https://redis.io/topics/transactions) như sau:

![Redis Transaction](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-transactions-a08b8862.png)

### Redis Transaction có hỗ trợ tính nguyên tử (Atomicity) không?

Transaction trong Redis khác với transaction trong các cơ sở dữ liệu quan hệ mà chúng ta thường biết. Chúng ta đều biết transaction có 4 đặc tính quan trọng (ACID): **1. Tính nguyên tử (Atomicity)**, **2. Tính cô lập (Isolation)**, **3. Tính bền vững (Durability)**, **4. Tính nhất quán (Consistency)**.

1. **Tính nguyên tử (Atomicity)**: Transaction là đơn vị thực thi nhỏ nhất, không thể phân chia. Tính nguyên tử đảm bảo các hành động hoặc là hoàn thành toàn bộ, hoặc là hoàn toàn không có tác dụng gì;
2. **Tính cô lập (Isolation)**: Khi có nhiều truy cập đồng thời vào cơ sở dữ liệu, transaction của một người dùng sẽ không bị can thiệp bởi transaction khác, các transaction đồng thời độc lập với nhau;
3. **Tính bền vững (Durability)**: Sau khi transaction được commit, các thay đổi dữ liệu là vĩnh viễn, ngay cả khi cơ sở dữ liệu gặp sự cố cũng không làm mất dữ liệu;
4. **Tính nhất quán (Consistency)**: Trước và sau khi thực thi transaction, dữ liệu luôn ở trạng thái hợp lệ, nhiều transaction cùng đọc một dữ liệu sẽ nhận được kết quả nhất quán.

Khi Redis Transaction gặp lỗi trong quá trình chạy (runtime error), ngoại trừ lệnh phát sinh lỗi, tất cả các lệnh khác trong transaction vẫn được thực thi bình thường. Hơn nữa, Redis Transaction không hỗ trợ thao tác rollback (quay lui). Do đó, Redis Transaction thực chất **không thỏa mãn tính nguyên tử**.

Trang chủ Redis cũng đã giải thích lý do tại sao không hỗ trợ rollback. Nói đơn giản là các nhà phát triển Redis nhận thấy việc hỗ trợ rollback là không cần thiết, làm như vậy giúp hệ thống đơn giản hơn và đạt hiệu năng cao hơn. Nhóm phát triển cho rằng các lỗi khi thực thi lệnh hoàn toàn có thể và cần phải được phát hiện ngay trong giai đoạn lập trình và kiểm thử, chứ không phải để xảy ra trên môi trường production.

![Tại sao Redis không hỗ trợ rollback](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-rollback-b66d7587.png)

**Các issue liên quan**:

- [issue#452: Về vấn đề Redis Transaction không thỏa mãn tính nguyên tử](https://github.com/Snailclimb/JavaGuide/issues/452).
- [Issue#491: Về việc Redis không hỗ trợ rollback transaction?](https://github.com/Snailclimb/JavaGuide/issues/491).

### Redis Transaction có hỗ trợ tính bền vững (Durability) không?

Một điểm khác biệt rất quan trọng giữa Redis và Memcached là Redis có hỗ trợ lưu trữ bền vững (persistence), và hỗ trợ tới 3 phương thức persistence:

- Chụp ảnh nhanh (snapshotting, RDB);
- Tệp chỉ ghi nối tiếp (append-only file, AOF);
- Lưu trữ lai giữa RDB và AOF (bổ sung từ Redis 4.0).

So với RDB, tính thời gian thực của AOF tốt hơn nhiều. Trong file cấu hình của Redis có 3 chiến lược `fsync` khác nhau cho AOF:

```bash
appendfsync always    # Mỗi khi có sửa đổi dữ liệu, main thread trực tiếp gọi fsync để đồng bộ file AOF (ghi đĩa), sau khi fsync xong mới trả về. always do main thread thực hiện thay vì luồng nền, làm suy giảm nghiêm trọng hiệu năng Redis
appendfsync everysec  # Mỗi giây gọi hàm fsync một lần để đồng bộ file AOF xuống đĩa
appendfsync no        # Để hệ điều hành tự quyết định thời điểm đồng bộ, thường là khoảng 30 giây một lần
```

Khi cấu hình chiến lược `fsync` của AOF là `no` hoặc `everysec`, đều tiềm ẩn nguy cơ mất mát dữ liệu nhất định. Ở chế độ `always`, về cơ bản có thể đáp ứng yêu cầu về tính bền vững, nhưng hiệu năng lại quá kém nên trong thực tế phát triển sẽ không ai sử dụng.

Do đó, tính bền vững của Redis Transaction cũng không thể được đảm bảo trọn vẹn.

### Làm thế nào để giải quyết nhược điểm của Redis Transaction?

Từ phiên bản 2.6, Redis đã hỗ trợ thực thi Lua script, chức năng của nó rất giống với transaction. Chúng ta có thể tận dụng Lua script để thực thi hàng loạt nhiều lệnh Redis. Toàn bộ các lệnh này sẽ được gửi lên Redis server và thực thi trọn vẹn trong một lượt, giúp giảm thiểu đáng kể chi phí truyền tải qua mạng.

Một đoạn Lua script được xem như một lệnh đơn lẻ khi thực thi, trong suốt quá trình chạy script sẽ không có script hay lệnh Redis nào khác chen ngang, đảm bảo thao tác không bị gián đoạn hay can thiệp.

Tuy nhiên, nếu Lua script gặp lỗi runtime và dừng lại giữa chừng, các lệnh phía sau lỗi sẽ không được thực thi. Đồng thời, những lệnh đã thực thi trước khi gặp lỗi sẽ không được hoàn tác (không có rollback như database quan hệ). Do đó, **nói một cách khắt khe, việc dùng Lua script để thực thi hàng loạt lệnh Redis thực chất cũng không thỏa mãn hoàn toàn tính nguyên tử.**

Nếu muốn các lệnh trong Lua script đều được thực thi đầy đủ, bắt buộc phải đảm bảo cú pháp câu lệnh và tên lệnh đều chính xác.

Ngoài ra, Redis 7.0 bổ sung tính năng [Redis functions](https://redis.io/docs/latest/develop/programmability/functions-intro/), bạn có thể coi Redis functions như một công cụ script mạnh mẽ và linh hoạt hơn cả Lua.

## ⭐️Tối ưu hóa hiệu năng Redis (Quan trọng)

Ngoài những nội dung được giới thiệu dưới đây, xin gợi ý thêm hai bài viết rất hay:

- [Redis của bạn có thực sự bị chậm không? Tối ưu hiệu năng như thế nào - Ali Developer](https://mp.weixin.qq.com/s/nNEuYw0NlYGhuKKKKoWfcQ).
- [Tổng hợp các nguyên nhân gây tắc nghẽn thường gặp trong Redis - JavaGuide](https://javaguide.cn/database/redis/redis-common-blocking-problems-summary.html).

### Sử dụng thao tác hàng loạt (Batch Operation) để giảm truyền tải mạng

Quá trình thực thi một lệnh Redis có thể đơn giản hóa thành 4 bước sau:

1. Gửi lệnh;
2. Lệnh xếp hàng chờ;
3. Thực thi lệnh;
4. Trả về kết quả.

Trong đó, tổng thời gian của bước 1 và bước 4 được gọi là **Round Trip Time (RTT, thời gian khứ hồi mạng)**, tức là thời gian dữ liệu di chuyển trên đường truyền mạng.

Sử dụng thao tác hàng loạt có thể giảm thiểu số lần truyền tải mạng, từ đó giảm chi phí mạng và tiết kiệm đáng kể thời gian RTT.

Ngoài ra, việc gửi một lệnh qua socket I/O tốn chi phí khá cao (liên quan đến chuyển đổi ngữ cảnh context switch, gọi hệ thống `read()` và `write()`), thao tác hàng loạt còn giúp giảm thiểu chi phí socket I/O này. Điều này cũng đã được trang chủ Redis nhắc đến trong phần giới thiệu về pipeline: <https://redis.io/docs/manual/pipelining/>.

#### Các lệnh thao tác hàng loạt nguyên bản (Native Batch Commands)

Trong Redis có một số lệnh hỗ trợ sẵn thao tác hàng loạt, chẳng hạn:

- `MGET` (lấy giá trị của một hoặc nhiều key chỉ định), `MSET` (thiết lập giá trị cho một hoặc nhiều key chỉ định),
- `HMGET` (lấy giá trị của một hoặc nhiều field trong Hash chỉ định), `HMSET` (thiết lập đồng thời một hoặc nhiều cặp field-value vào Hash chỉ định),
- `SADD` (thêm một hoặc nhiều phần tử vào Set chỉ định),
- ……

Tuy nhiên, trong giải pháp phân mảnh cụm Redis Cluster do Redis chính thức cung cấp, việc sử dụng các lệnh batch nguyên bản này có thể gặp một số vấn đề nhỏ cần lưu ý. Ví dụ, `MGET` không thể đảm bảo tất cả các key đều nằm trên cùng một **hash slot (khe băm)**, do đó `MGET` vẫn có thể cần nhiều lần truyền tải mạng, và tính nguyên tử cũng không còn được đảm bảo tuyệt đối. Dù vậy, so với các thao tác không dùng batch, nó vẫn tiết kiệm được rất nhiều lần truyền tải mạng.

Quy trình giản lược diễn ra như sau (thường do Redis client tự động thực hiện, chúng ta không cần tự viết mã xử lý):

1. Tìm tất cả các hash slot tương ứng với danh sách key;
2. Lần lượt gửi request `MGET` tới các node Redis tương ứng để lấy dữ liệu;
3. Chờ tất cả request thực thi xong, ráp nối lại dữ liệu kết quả sao cho đúng thứ tự danh sách key đầu vào rồi trả về.

Nếu muốn triệt tiêu vấn đề phải truyền tải mạng nhiều lần này, cách làm phổ biến là tự duy trì mối quan hệ ánh xạ giữa key và slot. Tuy nhiên cách này kém linh hoạt, dù đem lại hiệu năng cao hơn nhưng lại làm tăng độ phức tạp của hệ thống.

> Redis Cluster không sử dụng bảng băm nhất quán (Consistent Hashing), mà áp dụng mô hình **phân vùng theo khe băm (Hash Slot)**, mỗi cặp key-value đều thuộc về một **hash slot**. Khi client gửi request lệnh, trước tiên nó sẽ tính toán hash slot của key theo công thức băm, sau đó tra cứu mối quan hệ ánh xạ giữa hash slot và các node để tìm ra đúng node Redis đích.
>
> Tôi đã phân tích chi tiết phần nội dung này trong bài viết [Giải thích chi tiết về Redis Cluster (Trả phí)](https://javaguide.cn/database/redis/redis-cluster.html), bạn có thể tham khảo thêm.

#### Pipeline (Đường ống)

Đối với các lệnh không có hỗ trợ thao tác hàng loạt nguyên bản, chúng ta có thể sử dụng **pipeline** để đóng gói một loạt các lệnh Redis thành một nhóm. Nhóm lệnh này sẽ được gửi lên Redis server một lần duy nhất qua mạng. Tuy nhiên, cần chú ý khống chế **số lượng phần tử** trong một lượt thao tác (ví dụ dưới 500 phần tử, thực tế còn phụ thuộc vào số byte của dữ liệu) để tránh lượng dữ liệu truyền qua mạng quá lớn.

Tương tự như `MGET`, `MSET`, việc sử dụng pipeline trên Redis Cluster cũng gặp vấn đề nếu các key không nằm trên cùng một **hash slot**. Nếu muốn sử dụng, phía client phải tự phân nhóm key theo từng slot tương ứng.

Các lệnh batch nguyên bản và pipeline có sự khác biệt rõ rệt, cần lưu ý khi sử dụng:

- Lệnh batch nguyên bản là thao tác nguyên tử (atomic), còn pipeline là thao tác phi nguyên tử (non-atomic).
- Pipeline có thể đóng gói nhiều câu lệnh khác nhau, còn lệnh batch nguyên bản thì không.
- Lệnh batch nguyên bản do server Redis hỗ trợ sẵn, còn pipeline cần sự phối hợp triển khai giữa cả client và server.

Tiện đây xin bổ sung thêm so sánh giữa pipeline và Redis Transaction:

- Transaction là thao tác nguyên tử (khối thực thi cô lập, các lệnh từ client khác không xen vào giữa), còn pipeline là phi nguyên tử (các lệnh từ các client khác có thể được thực thi xen kẽ).
- Trong Redis Transaction, từng lệnh vẫn phải gửi lên server qua mạng rồi mới gọi `EXEC`, trong khi Pipeline chỉ cần gửi một lần duy nhất, số lần request ít hơn rất nhiều.

> Transaction có thể coi là một khối thao tác nguyên tử trên server nhưng không thỏa mãn tính nguyên tử tuyệt đối (vì không có rollback). Khi nhắc đến thao tác nguyên tử trong Redis, ý muốn nói thao tác đó (như transaction, Lua script) sẽ không bị các thao tác khác xen ngang, chứ không đảm bảo tất cả các lệnh ghi bên trong hoặc cùng thành công hoặc cùng bị hủy bỏ.
>
> ![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-pipeline-vs-transaction-4997418c.png)

Ngoài ra, pipeline không phù hợp với các lệnh có quan hệ phụ thuộc thứ tự thực thi. Ví dụ, bạn cần lấy kết quả của lệnh trước để làm tham số cho lệnh sau, pipeline sẽ không đáp ứng được yêu cầu này. Đối với kịch bản đó, chúng ta nên sử dụng **Lua script**.

#### Lua Script

Lua script cũng hỗ trợ thực thi hàng loạt nhiều câu lệnh. Một đoạn Lua script có thể xem như một lệnh đơn lẻ khi thực thi, được coi là **thao tác nguyên tử**. Nghĩa là, trong suốt quá trình một đoạn Lua script đang chạy, sẽ không có script hay lệnh Redis nào khác được phép thực thi xen ngang, đảm bảo thao tác không bị can thiệp bởi bất kỳ lệnh nào khác — đây là ưu thế mà pipeline không có được.

Hơn nữa, Lua script còn hỗ trợ một số logic xử lý đơn giản, chẳng hạn đọc một giá trị ra và xử lý điều kiện rẽ nhánh ngay bên trong script, điều mà pipeline hoàn toàn không làm được.

Tuy nhiên, Lua script vẫn tồn tại những hạn chế sau:

- Nếu Lua script gặp lỗi runtime giữa chừng và kết thúc, các thao tác phía sau sẽ không được thực hiện, nhưng các thao tác ghi đã diễn ra trước đó sẽ không bị hủy bỏ (không có rollback). Do đó ngay cả khi dùng Lua script, tính nguyên tử theo kiểu cơ sở dữ liệu quan hệ vẫn không đạt được.
- Trên cụm Redis Cluster, tính nguyên tử của Lua script cũng không được đảm bảo nếu các key trong script không nằm trên cùng một **hash slot**.

### Vấn đề lượng lớn key hết hạn tập trung cùng thời điểm

Như tôi đã đề cập ở phần trước: Đối với key hết hạn, Redis sử dụng chiến lược kết hợp **Xóa định kỳ (Periodic Deletion) + Xóa lười (Lazy Deletion)**.

Trong quá trình xóa định kỳ, nếu đột nhiên gặp phải một lượng lớn key cùng hết hạn, các request từ phía client buộc phải xếp hàng chờ đợi luồng dọn dẹp chạy xong, bởi vì tác vụ dọn dẹp định kỳ này chạy ngay trên main thread của Redis. Điều này dẫn tới việc request của client không được phản hồi kịp thời, tốc độ phản hồi trở nên rất chậm.

**Làm thế nào để giải quyết?** Dưới đây là hai giải pháp phổ biến:

1. Thiết lập thời gian hết hạn ngẫu nhiên cho key (thêm một khoảng jitter ngẫu nhiên).
2. Bật tính năng lazy-free (giải phóng trễ / xóa lười). Tính năng lazy-free được đưa vào từ Redis 4.0, cho phép Redis giải phóng vùng nhớ của key bị xóa một cách bất đồng bộ ở một luồng nền riêng biệt, tránh làm tắc nghẽn main thread.

Lời khuyên cá nhân là dù có bật lazy-free hay không, chúng ta vẫn nên luôn thiết lập thời gian hết hạn có yếu tố ngẫu nhiên cho các key.

### Redis bigkey (Key dung lượng lớn)

#### bigkey là gì?

Nói một cách đơn giản, nếu giá trị (value) ứng với một key chiếm dụng dung lượng bộ nhớ tương đối lớn, key đó có thể được coi là bigkey. Cụ thể lớn bao nhiêu thì bị tính là bigkey? Có một tiêu chuẩn tham khảo tương đối như sau:

- Value kiểu String vượt quá 1MB.
- Value kiểu phức hợp (List, Hash, Set, Sorted Set...) chứa hơn 5000 phần tử (tuy nhiên, với kiểu phức hợp, không phải cứ nhiều phần tử là dung lượng bộ nhớ sẽ lớn, còn phụ thuộc vào kích thước từng phần tử).

![Tiêu chuẩn xác định bigkey](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/bigkey-criterion-e36d656b.png)

#### bigkey được sinh ra như thế nào? Có tác hại gì?

bigkey thường sinh ra do các nguyên nhân sau:

- Thiết kế chương trình chưa chuẩn, chẳng hạn dùng trực tiếp kiểu String để lưu dữ liệu nhị phân của tệp tin có kích thước lớn.
- Không lường trước quy mô tăng trưởng dữ liệu của nghiệp vụ, chẳng hạn khi dùng các kiểu tập hợp đã không tính đến sự bùng nổ nhanh chóng của dữ liệu.
- Không dọn dẹp dữ liệu rác kịp thời, ví dụ trong Hash còn tồn đọng một lượng khổng lồ các cặp key-value không còn sử dụng.

bigkey không chỉ tiêu tốn nhiều bộ nhớ RAM và băng thông mạng, mà còn gây ảnh hưởng tiêu cực rất lớn đến hiệu năng hệ thống.

Trong bài viết [Tổng hợp các nguyên nhân gây tắc nghẽn thường gặp trong Redis](./redis-common-blocking-problems-summary.md), chúng ta đã biết: bigkey còn gây ra sự cố nghẽn (blocking). Cụ thể, thể hiện ở 3 khía cạnh chính:

1. Client timeout: Do Redis thực thi lệnh dưới dạng đơn luồng, khi thao tác với bigkey sẽ tốn nhiều thời gian, làm nghẽn toàn bộ Redis server, dưới góc nhìn của client thì request bị treo rất lâu không có phản hồi.
2. Nghẽn mạng: Mỗi lần đọc dữ liệu từ bigkey sẽ sinh ra lưu lượng mạng rất lớn. Nếu một key có kích thước 1MB và mỗi giây có 1000 lượt truy cập, nó sẽ tạo ra lưu lượng lên tới 1000MB/giây (1GB/s), đây là thảm họa đối với card mạng gigabit thông thường.
3. Nghẽn worker thread: Nếu dùng lệnh `DEL` để xóa bigkey, luồng làm việc chính sẽ bị nghẽn trong lúc giải phóng bộ nhớ, không thể xử lý các lệnh tiếp theo.

Tình trạng tắc nghẽn do bigkey gây ra còn tác động tiêu cực đến quá trình đồng bộ Master-Slave và mở rộng quy mô cụm (resharding) trong Cluster.

Tóm lại, bigkey tiềm ẩn rất nhiều rủi ro, chúng ta cần tránh tối đa sự xuất hiện của bigkey trong Redis.

#### Làm thế nào để phát hiện bigkey?

**1. Dùng tham số `--bigkeys` tích hợp trong Redis.**

```bash
# redis-cli -p 6379 --bigkeys

# Scanning the entire keyspace to find biggest keys as well as
# average sizes per key type.  You can use -i 0.1 to sleep 0.1 sec
# per 100 SCAN commands (not usually needed).

[00.00%] Biggest string found so far '"ballcat:oauth:refresh_auth:f6cdb384-9a9d-4f2f-af01-dc3f28057c20"' with 4437 bytes
[00.00%] Biggest list   found so far '"my-list"' with 17 items

-------- summary -------

Sampled 5 keys in the keyspace!
Total key length in bytes is 264 (avg len 52.80)

Biggest   list found '"my-list"' has 17 items
Biggest string found '"ballcat:oauth:refresh_auth:f6cdb384-9a9d-4f2f-af01-dc3f28057c20"' has 4437 bytes

1 lists with 17 items (20.00% of keys, avg size 17.00)
0 hashs with 0 fields (00.00% of keys, avg size 0.00)
4 strings with 4831 bytes (80.00% of keys, avg size 1207.75)
0 streams with 0 entries (00.00% of keys, avg size 0.00)
0 sets with 0 members (00.00% of keys, avg size 0.00)
0 zsets with 0 members (00.00% of keys, avg size 0.00
```

Từ kết quả chạy lệnh này, chúng ta có thể thấy: Lệnh này sẽ quét (Scan) toàn bộ các key trong Redis, có thể gây ảnh hưởng nhẹ đến hiệu năng Redis. Hơn nữa, phương pháp này chỉ tìm ra được Top 1 bigkey cho từng cấu trúc dữ liệu (String có dung lượng lớn nhất, hoặc kiểu phức hợp có nhiều phần tử nhất). Tuy nhiên, một key có nhiều phần tử chưa chắc đã chiếm nhiều bộ nhớ, điều này đòi hỏi chúng ta phải dựa vào nghiệp vụ thực tế để đánh giá tiếp.

Khi chạy lệnh này trên môi trường production, để giảm tải cho Redis, bạn nên chỉ định thêm tham số `-i` để điều tiết tần suất quét. Ví dụ: `redis-cli -p 6379 --bigkeys -i 3` biểu thị trong quá trình quét, cứ sau mỗi đợt quét sẽ tạm nghỉ 3 giây.

**2. Sử dụng lệnh SCAN tích hợp trong Redis**

Lệnh `SCAN` có thể trả về các key khớp với pattern theo số lượng nhất định. Sau khi lấy được key, bạn có thể dùng các lệnh `STRLEN`, `HLEN`, `LLEN`... để kiểm tra độ dài hoặc số lượng phần tử.

| Cấu trúc dữ liệu | Lệnh | Độ phức tạp | Kết quả (ứng với key) |
| --- | --- | --- | --- |
| String | STRLEN | O(1) | Chiều dài của chuỗi |
| Hash | HLEN | O(1) | Số lượng field trong Hash |
| List | LLEN | O(1) | Số lượng phần tử trong List |
| Set | SCARD | O(1) | Số lượng phần tử trong Set |
| Sorted Set | ZCARD | O(1) | Số lượng phần tử trong Sorted Set |

Đối với các kiểu tập hợp, bạn cũng có thể dùng lệnh `MEMORY USAGE` (Redis 4.0+), lệnh này sẽ trả về dung lượng bộ nhớ thực tế mà cặp key-value đang chiếm dụng.

**3. Phân tích file RDB bằng công cụ mã nguồn mở.**

Phát hiện bigkey bằng cách phân tích file sao lưu RDB offline. Tiền đề của phương án này là Redis của bạn có sử dụng cơ chế persistence RDB.

Trên mạng có sẵn các công cụ hữu ích:

- [redis-rdb-tools](https://github.com/sripathikrishnan/redis-rdb-tools): Công cụ viết bằng Python dùng để phân tích file snapshot RDB của Redis.
- [rdb_bigkeys](https://github.com/weiyanwei412/rdb_bigkeys): Công cụ viết bằng Go dùng để phân tích file RDB, có hiệu năng xử lý cao hơn.

**4. Sử dụng dịch vụ phân tích Redis trên Public Cloud.**

Nếu bạn sử dụng dịch vụ Redis do các nhà cung cấp đám mây công cộng (Public Cloud) cung cấp, hãy kiểm tra xem họ có tích hợp sẵn tính năng phân tích key hay không (thường đều có sẵn).

Dưới đây là tính năng phân tích và phát hiện bigkey theo thời gian thực trên Alibaba Cloud Redis, tài liệu tại: <https://www.alibabacloud.com/help/zh/apsaradb-for-redis/latest/use-the-real-time-key-statistics-feature>.

![Phân tích Key của Alibaba Cloud](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aliyun-key-analysis-0a8d83ea.png)

#### Làm thế nào để xử lý bigkey?

Các biện pháp phổ biến để xử lý và tối ưu bigkey gồm có (có thể kết hợp linh hoạt các cách với nhau):

- **Phân tách bigkey**: Chia nhỏ một bigkey thành nhiều key nhỏ hơn. Ví dụ, chia một Hash chứa hàng vạn field thành nhiều Hash nhỏ hơn dựa trên một thuật toán băm phụ (secondary hashing).
- **Dọn dẹp thủ công**: Với Redis 4.0+, sử dụng lệnh `UNLINK` để xóa bất đồng bộ một hoặc nhiều key chỉ định. Với Redis dưới 4.0, có thể dùng `SCAN` kết hợp với `DEL` để xóa từng đợt nhỏ.
- **Áp dụng cấu trúc dữ liệu phù hợp**: Ví dụ, không lưu dữ liệu nhị phân của tệp tin trong String; sử dụng HyperLogLog để thống kê UV; sử dụng Bitmap để lưu trữ thông tin trạng thái nhị phân (0/1).
- **Bật cơ chế lazy-free (giải phóng trễ)**: Tính năng có từ Redis 4.0, giúp Redis chuyển tác vụ giải phóng bộ nhớ của key bị xóa sang một luồng phụ xử lý bất đồng bộ, tránh làm nghẽn main thread.

### Redis hotkey (Key có tần suất truy cập cao)

#### hotkey là gì?

Nếu một key có số lượt truy cập vượt trội và cao hơn hẳn các key khác, key đó được gọi là **hotkey (key nóng)**. Ví dụ, một instance Redis xử lý 5000 request mỗi giây, trong đó chỉ riêng một key đã chiếm tới 2000 request/giây, thì key đó chính là hotkey.

hotkey thường xuất hiện do nhu cầu truy cập dữ liệu nóng tăng đột biến, chẳng hạn như sự kiện tin tức gây sốt bất ngờ, sản phẩm đang trong đợt mở bán flash sale...

#### hotkey có tác hại gì?

Xử lý hotkey sẽ chiếm dụng rất nhiều CPU và băng thông mạng, làm tăng độ trễ của các request khác trên cùng một instance. Khi vượt quá ngưỡng chịu tải, hệ thống thường biểu hiện qua việc các request bị xếp hàng chờ, timeout và sụt giảm thông lượng, điều này không nhất thiết có nghĩa là Redis server sẽ sập ngay lập tức. Tuy nhiên, nếu ứng dụng gặp timeout mà liên tục retry không kiểm soát hoặc truy vấn ngược về database, áp lực sẽ nhanh chóng dồn sang cơ sở dữ liệu phía sau.

Khi điều tra sự cố, không thể chỉ nhìn vào số lượt truy cập: Việc thực thi các lệnh phức tạp ở tần suất cao sẽ nhanh chóng vắt kiệt CPU, còn việc đọc liên tục value có kích thước lớn thì có thể làm nghẽn card mạng trước. Ngoài ra, cần phân biệt rõ giữa **điểm nóng đọc (Read Hotspot)** và **điểm nóng ghi (Write Hotspot)**. Bộ nhớ đệm cục bộ (local cache) chủ yếu hỗ trợ chia sẻ tải cho các request đọc, chứ không giải quyết được trực tiếp bài toán dồn dập ghi vào cùng một key.

Do đó, hotkey rất dễ trở thành nút thắt cổ chai về hiệu năng của toàn hệ thống, cần phải có giải pháp tối ưu chuyên biệt để đảm bảo tính sẵn sàng cao và ổn định cho hệ thống.

#### Làm thế nào để phát hiện hotkey?

**1. Dùng tham số `--hotkeys` tích hợp trong `redis-cli`.**

`redis-cli --hotkeys` thông qua lệnh `SCAN` để duyệt qua các key và đọc `OBJECT FREQ` nhằm tìm kiếm các key ứng viên có tần suất truy cập cao. **Lưu ý: Giá trị counter trả về chỉ là tần suất xấp xỉ theo thuật toán LFU, không phải là số lần truy cập thực tế và không thể quy đổi trực tiếp ra QPS.**

Tiền đề để sử dụng phương án này là tham số `maxmemory-policy` của Redis Server phải được đặt là `allkeys-lfu` hoặc `volatile-lfu`, nếu không sẽ báo lỗi như sau:

```bash
# redis-cli -p 6379 --hotkeys

# Scanning the entire keyspace to find hot keys as well as
# average sizes per key type.  You can use -i 0.1 to sleep 0.1 sec
# per 100 SCAN commands (not usually needed).

Error: ERR An LFU maxmemory policy is not selected, access frequency not tracked. Please note that when switching between policies at runtime LRU and LFU data will take some time to adjust.
```

Trong Redis có hai chính sách đào thải dựa trên LFU:

1. **volatile-lfu (least frequently used)**: Chọn lọc và đào thải dữ liệu có tần suất sử dụng thấp nhất từ tập các key có cài đặt TTL (`server.db[i].expires`).
2. **allkeys-lfu (least frequently used)**: Khi bộ nhớ đầy, đào thải các key có tần suất sử dụng thấp nhất trên toàn bộ không gian key.

Không nên chỉ vì muốn tìm kiếm hotkey mà tùy tiện thay đổi chính sách đào thải trên môi trường production, vì điều này sẽ làm thay đổi hành vi của Redis khi bộ nhớ chạm ngưỡng tối đa. Nếu instance đã dùng sẵn LFU, bạn có thể kiểm soát tốc độ quét:

```bash
redis-cli -h 127.0.0.1 -p 6379 --hotkeys -i 0.1
```

Bộ đếm LFU sử dụng cơ chế tăng theo xác suất và suy giảm dần theo thời gian dựa trên cấu hình, rất thích hợp để so sánh độ nóng truy cập gần đây. Việc quét cũng tốn thời gian và sinh thêm request phụ, nó không phản ánh toàn bộ lưu lượng tại một thời điểm tức thời nên có thể bỏ lỡ các đợt bùng nổ ngắn hạn. Khi kiểm tra trên cụm, cần xác định rõ phạm vi node; số liệu trên node slave không thể đại diện trực tiếp cho lưu lượng đọc trên master. Chi tiết cơ chế xem tại [OBJECT FREQ](https://redis.io/docs/latest/commands/object-freq/), [Chính sách đào thải LFU](https://redis.io/docs/latest/develop/reference/eviction/#lfu-eviction) và [Tài liệu Redis CLI](https://redis.io/docs/latest/develop/tools/cli/).

**2. Sử dụng lệnh `MONITOR`.**

Lệnh `MONITOR` có thể xuất ra các lệnh mà server đang xử lý theo thời gian thực, dùng để thu thập mẫu trong khoảng thời gian ngắn và thống kê theo key; nó không phải là log kiểm toán hoàn chỉnh, một số lệnh nội bộ sẽ không được ghi lại.

Vì lệnh này ảnh hưởng rất lớn đến hiệu năng của Redis, nghiêm cấm duy trì lệnh `MONITOR` trong thời gian dài (trong production cần hết sức thận trọng khi dùng lệnh này).

```bash
# redis-cli
127.0.0.1:6379> MONITOR
OK
1683638260.637378 [0 172.17.0.1:61516] "ping"
1683638267.144236 [0 172.17.0.1:61518] "smembers" "mySet"
1683638268.941863 [0 172.17.0.1:61518] "smembers" "mySet"
1683638269.551671 [0 172.17.0.1:61518] "smembers" "mySet"
1683638270.646256 [0 172.17.0.1:61516] "ping"
1683638270.849551 [0 172.17.0.1:61518] "smembers" "mySet"
1683638271.926945 [0 172.17.0.1:61518] "smembers" "mySet"
1683638274.276599 [0 172.17.0.1:61518] "smembers" "mySet2"
1683638276.327234 [0 172.17.0.1:61518] "smembers" "mySet"
```

Khi cần chẩn đoán ngắn hạn, bạn có thể giới hạn thời gian thu thập và kích thước file ghi nhận, sau khi dừng thu thập thì tiến hành thống kê offline. Phương pháp này chỉ nhìn thấy request trong thời gian đang mở lệnh, không thể tái hiện lại hotkey đã xuất hiện trước đó; kết quả đầu ra cũng có thể chứa các tham số nghiệp vụ nhạy cảm nên cần kiểm soát quyền truy cập. Chi tiết ảnh hưởng hiệu năng xem tại [Tài liệu chính thức về MONITOR](https://redis.io/docs/latest/commands/monitor/).

**3. Tận dụng các dự án mã nguồn mở.**

Dự án [hotkey](https://gitee.com/jd-platform-opensource/hotkey) của JD Retail không chỉ hỗ trợ phát hiện hotkey mà còn hỗ trợ xử lý và phân phối hotkey rất hiệu quả.

![hotkey mã nguồn mở của JD Retail](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/jd-hotkey-76fb6236.webp)

**4. Dự đoán trước dựa trên đặc thù nghiệp vụ.**

Có thể căn cứ vào kịch bản nghiệp vụ để dự đoán trước một số hotkey, chẳng hạn thông tin sản phẩm chuẩn bị mở bán flash sale, vé hòa nhạc... Tuy nhiên, chúng ta không thể lường trước mọi hotkey phát sinh đột ngột, ví dụ các tin tức giật gân, sự kiện bất ngờ.

**5. Thu thập số liệu ở tầng Client hoặc tầng Proxy.**

Có thể ghi nhận số lượt đọc ghi của từng key theo cửa sổ thời gian (sliding window) tại SDK dùng chung hoặc tại tầng Proxy, sau đó tổng hợp số liệu từ nhiều instance ứng dụng. Một instance đơn lẻ chỉ nhìn thấy lưu lượng của chính nó; nếu muốn xác định hotkey trên quy mô toàn cục, cần thống nhất quy chuẩn và cửa sổ thời gian thống kê, đồng thời lưu ý rằng lượng truy cập nghiệp vụ trúng local cache sẽ không được tính vào request gửi tới Redis.

Cách này rất phù hợp để theo dõi liên tục, nhưng đòi hỏi phải duy trì logic thu thập và tổng hợp dữ liệu. Nên dùng cơ chế lấy mẫu (sampling) và cấu trúc đếm có giới hạn dung lượng để kiểm soát chi phí, tránh lưu trữ vô tội vạ số liệu của từng key và không nên đưa toàn bộ key thô vào làm nhãn (metric label) cho hệ thống giám sát.

**6. Sử dụng dịch vụ phân tích Redis trên Public Cloud.**

Nếu bạn dùng dịch vụ Redis trên đám mây, hãy xem xét các công cụ phân tích key được tích hợp sẵn.

Ví dụ, Alibaba Cloud Redis hỗ trợ tính năng phát hiện và phân tích hotkey theo thời gian thực, tài liệu tại: <https://www.alibabacloud.com/help/zh/apsaradb-for-redis/latest/use-the-real-time-key-statistics-feature>.

![Phân tích Key của Alibaba Cloud](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aliyun-key-analysis-0a8d83ea.png)

**7. Thống kê điểm nóng trực tiếp trên Server.**

Server có thể quan sát tập trung toàn bộ request gửi tới node đó. Khi cần tùy biến năng lực thống kê, có thể dùng các cấu trúc dữ liệu có giới hạn kích thước để đếm truy cập trong một cửa sổ thời gian, phân định rõ điểm nóng đọc và ghi, đồng thời cung cấp API tra cứu và cảnh báo. Giải pháp này đòi hỏi phải can thiệp mã nguồn server và cần đánh giá tính tương thích khi nâng cấp phiên bản Redis.

Cấu trúc thống kê có giới hạn dung lượng giúp kiểm soát bộ nhớ, nhưng khi bản ghi bị đào thải hoặc lấy mẫu thì kết quả có thể không bao quát hết 100% lượt truy cập. Khi đánh giá phương án, cần làm rõ cửa sổ thống kê, tỷ lệ lấy mẫu, dung lượng bộ nhớ, chi phí thông báo và tỷ lệ bỏ sót, không thể đồng nhất "tính toán một lần rất nhanh" với "toàn bộ quá trình không tốn chi phí".

**Bổ sung phiên bản: Redis Open Source từ bản 8.6.0 cung cấp bộ lệnh `HOTKEYS` nguyên bản.** Bộ lệnh này nhận diện điểm nóng dựa trên thời gian CPU hoặc dung lượng byte mạng trong một khung thời gian quan sát chỉ định, cơ chế hoàn toàn khác với việc dựa vào LFU của `redis-cli --hotkeys`. Ví dụ, trên instance hỗ trợ lệnh này và có quyền tương ứng, bạn có thể thực thi:

```bash
# Thu thập mẫu trong 30 giây, giữ lại Top 10 theo tiêu chí CPU và lưu lượng mạng; SAMPLE 10 nghĩa là lấy mẫu theo xác suất 1/10
redis-cli HOTKEYS START METRICS 2 CPU NET COUNT 10 DURATION 30 SAMPLE 10
# Xem kết quả trong hoặc sau quá trình thu thập
redis-cli HOTKEYS GET
```

Việc lấy mẫu sẽ ảnh hưởng đến độ chính xác; kết quả cũng chỉ phản ánh phạm vi quan sát đã chỉ định, không thể dùng để truy vấn các điểm nóng trong lịch sử chưa từng được ghi nhận. Tham số và giá trị trả về xem tại [HOTKEYS START](https://redis.io/docs/latest/commands/hotkeys-start/) và [HOTKEYS GET](https://redis.io/docs/latest/commands/hotkeys-get/).

Khi lựa chọn phương án phát hiện, bạn có thể dùng hệ thống giám sát sẵn có để xác định các node đang chịu tải cao và khoảng thời gian bất thường, sau đó dùng công cụ dò điểm nóng phù hợp với phiên bản hiện tại để thu hẹp phạm vi. Kỹ thuật bắt gói tin mạng (packet capture) cũng có thể hỗ trợ phân tích luồng RESP dạng văn bản thuần, nhưng cần xử lý việc giải mã giao thức, chi phí ghi nhận và rào cản mã hóa TLS, nên thông thường không được ưu tiên làm phương án giám sát định kỳ.

#### Làm thế nào để giải quyết hotkey?

Các biện pháp phổ biến để xử lý và tối ưu hóa hotkey (có thể kết hợp linh hoạt):

- **Điểm nóng đọc ưu tiên phân tán request đọc**: Đưa các dữ liệu ổn định, đọc nhiều ghi ít vào bộ nhớ đệm cục bộ JVM (như Caffeine) hoặc proxy cache, đồng thời thiết lập giới hạn dung lượng tối đa, TTL và cơ chế vô hiệu hóa hợp lý; khi cache hết hạn, gộp các request đồng thời truy vấn về database (request collapsing).
- **Phân tách đọc ghi (Read-Write Separation)**: Client điều hướng các request đọc có thể chấp nhận dữ liệu cũ hơn một chút sang các slave node, nhưng cần tính đến độ trễ sao chép bất đồng bộ (replication lag); lưu ý việc thêm slave node không giúp chia sẻ tải cho các thao tác ghi vào cùng một key.
- **Phân biệt giữa nhiều hotkey và một hotkey đơn lẻ**: Redis Cluster có thể phân tán các key khác nhau vào các shard (phân mảnh) khác nhau, nhưng một key cụ thể vẫn chỉ thuộc về một hash slot duy nhất do một master node phụ trách. Do đó, chỉ tăng số lượng shard không thể giải quyết được áp lực tải đè lên một key duy nhất. Bạn có thể tham khảo [Đặc tả kỹ thuật của Cluster](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) để hiểu sâu mối quan hệ giữa slot và node.
- **Tách điểm nóng ghi theo ngữ nghĩa nghiệp vụ**: Ví dụ các bộ đếm cho phép trễ khi tổng hợp có thể chia thành nhiều bộ đếm phụ rồi định kỳ gộp lại (sub-counters), nhưng bắt buộc phải đánh giá lại chi phí đọc, tính nguyên tử và tính nhất quán. Các thao tác đòi hỏi ràng buộc nghiêm ngặt như trừ tồn kho không thể áp dụng máy móc cách chia nhỏ bộ đếm này.
- **Kiểm soát lan truyền quá tải**: Kết hợp rate limiting, circuit breaker (giảm tải/ngắt mạch), gộp request và giới hạn số lần retry, tránh tình trạng Redis bị timeout khiến toàn bộ request ồ ạt đổ dồn về database.

Nếu tạo nhiều bản sao khác key cho cùng một dữ liệu nóng đọc, cần đảm bảo chúng thực sự được phân bổ vào các shard khác nhau, đồng thời xử lý việc cập nhật hoặc vô hiệu hóa toàn bộ các bản sao này. Việc đặt cùng một hash tag cho các bản sao sẽ khiến chúng rơi vào cùng một hash slot, làm mất đi ý nghĩa phân tán tải. Để tìm hiểu thêm về thông báo và ranh giới nhất quán trong cache nhiều tầng, mời bạn đọc tiếp [Kiến thức cơ bản về Cache](./cache-basics.md).

Ngoài những phương pháp trên, nếu bạn dùng dịch vụ Redis trên nền tảng Public Cloud, hãy chú ý tới các giải pháp "mì ăn liền" (out-of-the-box) do họ cung cấp.

Ví dụ, Alibaba Cloud Redis hỗ trợ tính năng Proxy Query Cache để tối ưu hóa triệt để vấn đề hotkey.

![Tối ưu hóa vấn đề Hotkey thông qua Proxy Query Cache của Alibaba Cloud](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aliyun-hotkey-proxy-query-cache-5a9f16f3.png)

### Lệnh truy vấn chậm (Slow Query)

#### Tại sao lại có lệnh truy vấn chậm?

Chúng ta biết rằng việc thực thi một lệnh Redis trải qua 4 bước:

1. Gửi lệnh;
2. Lệnh xếp hàng;
3. Thực thi lệnh;
4. Trả về kết quả.

Tính năng Slow Query của Redis thống kê thời gian tiêu tốn riêng ở bước 3 (thực thi lệnh), các lệnh truy vấn chậm chính là những lệnh có thời gian thực thi vượt quá ngưỡng quy định.

Tại sao Redis lại phát sinh các lệnh truy vấn chậm?

Đại đa số các lệnh trong Redis đều có độ phức tạp thời gian là O(1), nhưng cũng có một số ít lệnh có độ phức tạp là O(n), ví dụ:

- `KEYS *`: Trả về toàn bộ các key khớp với pattern.
- `HGETALL`: Trả về toàn bộ các cặp key-value trong một Hash.
- `LRANGE`: Trả về các phần tử trong dải chỉ định của một List.
- `SMEMBERS`: Trả về toàn bộ các phần tử trong một Set.
- `SINTER`/`SUNION`/`SDIFF`: Tính toán giao/hợp/hiệu của nhiều Set.
- ……

Vì độ phức tạp thời gian của các lệnh này là O(n), đôi khi phải quét toàn bộ tập dữ liệu, nên khi n tăng lên thì thời gian thực thi cũng kéo dài tương ứng. Dù vậy, những lệnh này không phải là tuyệt đối không được dùng, nhưng khi dùng bạn phải nắm rõ giá trị n là bao nhiêu. Ngoài ra, khi có nhu cầu duyệt dữ liệu, nên thay thế bằng các lệnh `HSCAN`, `SSCAN`, `ZSCAN`.

Bên cạnh các lệnh O(n), còn có những lệnh có độ phức tạp thời gian có thể vượt quá O(n), ví dụ:

- `ZRANGE`/`ZREVRANGE`: Trả về các phần tử trong khoảng xếp hạng chỉ định của Sorted Set. Độ phức tạp là O(log(n)+m), trong đó n là tổng số phần tử, m là số lượng phần tử trả về. Khi m và n rất lớn, chi phí sẽ tăng cao.
- `ZREMRANGEBYRANK`/`ZREMRANGEBYSCORE`: Xóa các phần tử trong khoảng xếp hạng hoặc khoảng điểm số chỉ định của Sorted Set. Độ phức tạp là O(log(n)+m), với n là tổng số phần tử và m là số phần tử bị xóa.
- ……

#### Làm thế nào để tìm ra các lệnh truy vấn chậm?

Redis cung cấp sẵn tính năng **Slow Log (Nhật ký truy vấn chậm)** tích hợp bên trong, chuyên dùng để ghi lại các lệnh có thời gian thực thi vượt quá ngưỡng quy định. Tính năng này vô cùng hữu ích trong việc định vị nút thắt hiệu năng và tìm ra các thao tác khiến Redis bị nghẽn, nguyên lý tương tự như Slow Query Log của MySQL.

Trong file `redis.conf`, chúng ta có thể dùng tham số `slowlog-log-slower-than` để cài đặt ngưỡng thời gian (tính bằng micro giây), và tham số `slowlog-max-len` để cấu hình số lượng bản ghi tối đa được lưu trữ.

Khi Redis phát hiện một lệnh có thời gian thực thi vượt quá ngưỡng `slowlog-log-slower-than`, nó sẽ ghi lệnh đó vào slow log. Khi số lượng bản ghi vượt quá `slowlog-max-len`, Redis sẽ tự động đẩy các bản ghi cũ nhất ra ngoài (FIFO).

⚠️ Lưu ý: Vì slow log chiếm dụng bộ nhớ RAM, nếu cấu hình độ dài tối đa quá lớn có thể dẫn đến việc tiêu tốn nhiều bộ nhớ không cần thiết.

Cấu hình mặc định của `slowlog-log-slower-than` và `slowlog-max-len` như sau (bạn có thể tự điều chỉnh):

```properties
# The following time is expressed in microseconds, so 1000000 is equivalent
# to one second. Note that a negative number disables the slow log, while
# a value of zero forces the logging of every command.
slowlog-log-slower-than 10000

# There is no limit to this length. Just be aware that it will consume memory.
# You can reclaim memory used by the slow log with SLOWLOG RESET.
slowlog-max-len 128
```

Ngoài việc sửa file cấu hình, bạn cũng có thể thiết lập trực tiếp thông qua lệnh `CONFIG`:

```bash
# Lệnh thực thi vượt quá 10000 micro-giây (tức 10 mili-giây) sẽ bị ghi lại
CONFIG SET slowlog-log-slower-than 10000
# Chỉ lưu lại 128 bản ghi lệnh chậm gần nhất
CONFIG SET slowlog-max-len 128
```

Để xem nội dung slow log rất đơn giản, bạn chỉ cần dùng lệnh `SLOWLOG GET`.

```bash
127.0.0.1:6379> SLOWLOG GET # Truy vấn nhật ký truy vấn chậm
 1) 1) (integer) 5
    2) (integer) 1684326682
    3) (integer) 12000
    4) 1) "KEYS"
       2) "*"
    5) "172.17.0.1:61152"
    6) ""
  // ...
```

Mỗi bản ghi trong slow log gồm 6 giá trị sau:

1. **ID duy nhất**: Định danh duy nhất của bản ghi nhật ký.
2. **Dấu thời gian (Timestamp)**: Thời điểm Unix timestamp khi lệnh thực thi hoàn tất.
3. **Thời gian thực thi (Duration)**: Thời gian lệnh chạy, tính bằng **micro giây (μs)**.
4. **Lệnh và tham số (Command)**: Câu lệnh cụ thể và mảng các tham số kèm theo.
5. **Thông tin Client (Client IP:Port)**: Địa chỉ IP và cổng của client gửi lệnh.
6. **Tên Client (Client Name)**: Tên định danh của client nếu có thiết lập (`CLIENT SETNAME`).

Lệnh `SLOWLOG GET` mặc định trả về 10 bản ghi gần nhất, bạn cũng có thể chỉ định số lượng muốn lấy: `SLOWLOG GET N`.

Dưới đây là một số lệnh hữu ích khác liên quan đến slow log:

```bash
# Trả về số lượng bản ghi slow log hiện có
127.0.0.1:6379> SLOWLOG LEN
(integer) 128
# Xóa sạch toàn bộ bản ghi slow log
127.0.0.1:6379> SLOWLOG RESET
OK
```

### Phân mảnh bộ nhớ trong Redis (Memory Fragmentation)

**Các câu hỏi liên quan**:

1. Phân mảnh bộ nhớ là gì? Tại sao lại xuất hiện phân mảnh bộ nhớ trong Redis?
2. Làm thế nào để dọn dẹp phân mảnh bộ nhớ trong Redis?

**Câu trả lời chi tiết**: [Giải thích chi tiết về phân mảnh bộ nhớ trong Redis](https://javaguide.cn/database/redis/redis-memory-fragmentation.html).

## ⭐️Các sự cố trong môi trường Production của Redis (Quan trọng)

### Cache Penetration (Thủng bộ nhớ đệm)

#### Cache Penetration là gì?

Cache Penetration (thủng bộ nhớ đệm) hiểu đơn giản là: Có một lượng lớn request gửi lên với các key không hợp lệ, **hoàn toàn không tồn tại trong cache và cũng không hề tồn tại trong database**. Điều này khiến toàn bộ các request này xuyên thẳng qua tầng cache và dội thẳng vào cơ sở dữ liệu, gây áp lực khủng khiếp lên database và có thể khiến database bị sập (crash) ngay lập tức.

![Cache Penetration](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-penetration-c8f04a78.png)

Ví dụ: Một hacker cố tình tạo ra hàng loạt các key giả mạo không tồn tại để liên tục gửi request, khiến toàn bộ truy vấn rơi thẳng vào database và không tìm thấy bản ghi nào. Kết quả là database phải gánh chịu tải trọng khổng lồ từ các truy vấn vô nghĩa này.

#### Có những biện pháp giải quyết nào?

Biện pháp cơ bản đầu tiên là **kiểm tra tính hợp lệ của tham số đầu vào (validation)**, với những tham số phi lý thì lập tức ném ngoại lệ hoặc trả về lỗi ngay cho client. Chẳng hạn ID truy vấn database không được nhỏ hơn 0, định dạng email gửi lên không đúng thì chặn lại ngay lập tức.

**1) Cache key không hợp lệ (Cache null value)**

Nếu truy vấn cả trong cache và database đều không có dữ liệu, hãy ghi một giá trị rỗng (null) vào Redis và đặt thời gian hết hạn ngắn cho nó, câu lệnh như sau: `SET key value EX 10086`. Cách này xử lý tốt trường hợp các request key bất hợp pháp ít bị thay đổi. Tuy nhiên nếu hacker cố tình tấn công và mỗi lần lại sinh ra một key hoàn toàn mới, Redis sẽ bị ngập tràn bởi các key rác này. Rõ ràng, đây không phải giải pháp xử lý triệt để tận gốc. Nếu buộc phải dùng cách này, hãy đặt thời gian hết hạn cho key rác thật ngắn, ví dụ khoảng 1 đến 5 phút.

Ngoài ra, nói thêm một chút, thông thường chúng ta hay thiết kế key theo định dạng: `Tên_bảng:Tên_cột:Tên_khóa_chính:Giá_trị_khóa_chính`.

Đoạn code Java minh họa cách xử lý:

```java
public Object getObjectInclNullById(Integer id) {
    // Lấy dữ liệu từ cache
    Object cacheValue = cache.get(id);
    // Cache bị miss
    if (cacheValue == null) {
        // Truy vấn từ cơ sở dữ liệu
        Object storageValue = storage.get(key);
        // Lưu giá trị vào cache (kể cả khi là null)
        cache.set(key, storageValue);
        // Nếu dữ liệu trong DB cũng là null, bắt buộc phải set thời gian hết hạn (ví dụ 300 giây)
        if (storageValue == null) {
            // Bắt buộc phải đặt TTL ngắn, nếu không sẽ đối mặt nguy cơ bị tấn công cạn kiệt bộ nhớ
            cache.expire(key, 60 * 5);
        }
        return storageValue;
    }
    return cacheValue;
}
```

**2) Bloom Filter (Bộ lọc Bloom)**

Bloom Filter là một cấu trúc dữ liệu cực kỳ kỳ diệu, thông qua nó chúng ta có thể nhanh chóng kiểm tra xem một phần tử chỉ định có tồn tại trong một tập dữ liệu khổng lồ hay không. Chúng ta có thể coi nó gồm 2 phần: một vector nhị phân (mảng bit) và một tập hợp các hàm băm ngẫu nhiên độc lập. So với các cấu trúc thông thường như List, Map, Set, nó chiếm dung lượng bộ nhớ cực kỳ nhỏ và tốc độ xử lý vượt trội. Tuy nhiên, nhược điểm là kết quả trả về mang tính xác suất (có thể xảy ra false positive). Về mặt lý thuyết, càng nhiều phần tử đưa vào thì tỷ lệ báo nhầm càng cao, đồng thời dữ liệu trong Bloom Filter rất khó để xóa bỏ.

![Sơ đồ nguyên lý đơn giản của Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-simple-schematic-diagram-ecf8f3d1.png)

Bloom Filter sử dụng một mảng bit tương đối lớn để lưu trữ dữ liệu, mỗi phần tử trong mảng chỉ chiếm đúng 1 bit và chỉ nhận giá trị 0 hoặc 1 (đại diện cho false hoặc true), đây chính là bí quyết giúp Bloom Filter tiết kiệm bộ nhớ tối đa. Tính toán cụ thể: một mảng bit chứa 1.000.000 phần tử chỉ tốn: 1.000.000 Bit / 8 = 125.000 Byte = 125.000 / 1024 KB ≈ 122KB bộ nhớ.

![Mảng bit](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-bit-table-b8f56b57.png)

Cách triển khai cụ thể: Đưa toàn bộ các giá trị key có thể tồn tại vào Bloom Filter. Khi có request từ người dùng gửi tới, trước tiên kiểm tra xem key đó có nằm trong Bloom Filter hay không. Nếu không có, lập tức trả về lỗi tham số cho client; chỉ khi key có thể tồn tại trong Bloom Filter thì mới tiếp tục quy trình xử lý cache và database phía sau.

Quy trình xử lý cache sau khi tích hợp Bloom Filter như sau:

![Sơ đồ quy trình xử lý cache sau khi tích hợp Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-penetration-bloom-filter-878a8a50.png)

Để tìm hiểu chi tiết hơn về Bloom Filter, bạn có thể xem bài viết: [Chưa hiểu rõ Bloom Filter? Một bài viết làm sáng tỏ mọi ngóc ngách!](https://javaguide.cn/cs-basics/data-structure/bloom-filter.html).

**3) Giới hạn tần suất giao diện (Rate Limiting)**

Thực hiện rate limit trên API dựa theo User ID hoặc IP người dùng. Đối với các hành vi truy cập có tần suất bất thường, có thể áp dụng thêm cơ chế danh sách đen (blacklist), chẳng hạn đưa IP vi phạm vào danh sách cấm truy cập.

Các sự cố Cache Breakdown và Avalanche được đề cập dưới đây cũng có thể kết hợp với rate limit để hạn chế thiệt hại, vì mấu chốt của các vấn đề này đều là việc có quá nhiều request dồn thẳng vào database gây quá tải.

Chi tiết về các giải pháp rate limit xem tại: [Giải thích chi tiết về giới hạn tốc độ dịch vụ (Rate Limiting)](https://javaguide.cn/high-availability/limit-request.html).

### Cache Breakdown (Hỏng bộ nhớ đệm / Sập điểm nóng)

#### Cache Breakdown là gì?

Trong Cache Breakdown, request gửi lên nhắm vào một **dữ liệu nóng (hot data)**, dữ liệu này **có tồn tại trong database nhưng lại không có trong cache (thường là vì bản ghi cache tương ứng vừa hết hạn)**. Điều này có thể dẫn tới việc trong tích tắc có một lượng khổng lồ request đồng thời đổ dồn thẳng vào database, khiến cơ sở dữ liệu bị quá tải và có thể sập nguồn ngay lập tức.

![Cache Breakdown](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-breakdown-1a847904.png)

Ví dụ: Trong một chương trình flash sale đang diễn ra, dữ liệu cache của một sản phẩm cực hot đột ngột hết hạn, dẫn đến việc hàng vạn request truy cập sản phẩm đó trong chớp mắt ồ ạt tràn vào database, tạo nên sức ép khổng lồ.

#### Có những biện pháp giải quyết nào?

1. **Không bao giờ hết hạn** (Không khuyến khích): Cấu hình dữ liệu nóng không bao giờ hết hạn hoặc đặt thời gian hết hạn cực dài.
2. **Làm nóng cache trước (Cache Preheating)** (Khuyến khích): Chủ động đưa dữ liệu nóng vào cache trước giờ cao điểm và cài đặt TTL hợp lý, ví dụ trong kịch bản flash sale thì đảm bảo dữ liệu không bị hết hạn trước khi phiên bán kết thúc.
3. **Sử dụng khóa Mutex** (Tùy trường hợp): Khi phát hiện cache bị miss, dùng distributed lock (hoặc mutex lock) để đảm bảo tại một thời điểm chỉ có duy nhất một request được phép truy vấn database và cập nhật lại dữ liệu vào cache, các request còn lại phải chờ đợi.

#### Sự khác biệt giữa Cache Penetration và Cache Breakdown là gì?

- Trong **Cache Penetration**: Key được request **hoàn toàn không tồn tại trong cache và cũng không hề tồn tại trong database**.
- Trong **Cache Breakdown**: Key được request tương ứng với **dữ liệu nóng (hot data)**, dữ liệu này **có tồn tại trong database nhưng tạm thời không có trong cache (thường do bản ghi cache đã hết hạn)**.

### Cache Avalanche (Tuyết lở bộ nhớ đệm)

#### Cache Avalanche là gì?

Cái tên Cache Avalanche (tuyết lở) này thực sự rất hình tượng.

Trên thực tế, Cache Avalanche miêu tả một kịch bản đơn giản: **Dữ liệu trong cache đồng loạt hết hạn trên diện rộng tại cùng một thời điểm, dẫn đến việc vô số request đồng thời ập thẳng vào database.** Hiện tượng này giống như một cơn tuyết lở ồ ạt cuốn phăng mọi thứ, áp lực đè nặng lên cơ sở dữ liệu là vô cùng khủng khiếp và có thể khiến database sập ngay lập tức.

Ngoài ra, việc toàn bộ hệ thống cache Redis gặp sự cố dừng hoạt động (downtime/crash) cũng sẽ trực tiếp dẫn đến hiện tượng Cache Avalanche, khiến 100% request phải đổ về database.

![Cache Avalanche](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-avalanche-2585e3bd.png)

Ví dụ: Lượng lớn dữ liệu trong cache được cài đặt cùng một mốc thời gian hết hạn, khi đến thời điểm đó chúng đồng loạt biến mất khỏi cache. Đúng lúc này, có một lượng lớn truy cập gửi tới, khiến toàn bộ request đánh thẳng vào database.

#### Có những biện pháp giải quyết nào?

**Đối với trường hợp dịch vụ Redis gặp sự cố không khả dụng**:

1. **Triển khai Redis Cluster**: Sử dụng cụm Redis Cluster hoặc Redis Sentinel để tránh tình trạng lỗi trên một node đơn lẻ làm tê liệt toàn bộ hệ thống cache. Xem chi tiết tại: [Giải thích chi tiết về Redis Cluster (Trả phí)](https://javaguide.cn/database/redis/redis-cluster.html).
2. **Bộ nhớ đệm nhiều tầng (Multi-level Cache)**: Thiết lập kiến trúc cache nhiều cấp, chẳng hạn kết hợp Local Cache (Caffeine) + Redis Cache phân tán. Khi Redis gặp sự cố, hệ thống vẫn có thể lấy được một phần dữ liệu từ local cache trên từng node ứng dụng.

**Đối với trường hợp lượng lớn key trong cache đồng loạt hết hạn**:

1. **Cài đặt thời gian hết hạn ngẫu nhiên (Random TTL / Jitter)** (Tùy chọn): Thêm một khoảng thời gian ngẫu nhiên vào thời gian hết hạn cố định của từng key, giúp thời điểm hết hạn của các key phân tán rải rác, tránh việc hết hạn tập trung cùng lúc.
2. **Làm nóng cache trước (Cache Preheating)** (Khuyến khích): Chủ động nạp dữ liệu nóng vào cache trước giờ cao điểm và cài đặt thời gian hết hạn hợp lý, ví dụ dữ liệu trong đợt flash sale không bị hết hạn trước khi kết thúc chương trình.
3. **Chiến lược cache vĩnh viễn (Persistent Cache)** (Tùy trường hợp): Dù thông thường không khuyến khích để cache vĩnh viễn, nhưng đối với một số dữ liệu mang tính cốt lõi và ít khi biến động, có thể cân nhắc chiến lược này.

#### Làm thế nào để thực hiện Cache Preheating (Làm nóng cache)?

Có 2 cách làm phổ biến:

1. Dùng tác vụ định kỳ (Scheduled Task), chẳng hạn như `xxl-job`, để kích hoạt logic làm nóng cache theo giờ, truy vấn dữ liệu nóng từ database rồi nạp sẵn vào Redis.
2. Dùng hàng đợi tin nhắn (Message Queue), ví dụ như Kafka, để tiến hành làm nóng cache bất đồng bộ: Đẩy ID hoặc khóa chính của dữ liệu nóng vào MQ, sau đó service cache sẽ consume tin nhắn từ MQ, dựa vào ID để truy vấn database và cập nhật vào cache.

#### Sự khác biệt giữa Cache Avalanche và Cache Breakdown là gì?

Cache Avalanche và Cache Breakdown nhìn bề ngoài khá giống nhau, nhưng điểm khác biệt cốt lõi là: Cache Avalanche xuất phát từ việc **hàng loạt hoặc toàn bộ dữ liệu** trong cache bị vô hiệu hóa cùng lúc; trong khi Cache Breakdown chủ yếu do **một dữ liệu nóng cụ thể** không có trong cache (thường do bản ghi cache của đúng dữ liệu đó vừa hết hạn).

### Làm thế nào để đảm bảo tính nhất quán dữ liệu giữa Cache và Database?

Tính nhất quán giữa cache và database là một thách thức kỹ thuật rất phổ biến. Đưa cache vào hệ thống mục đích chính là để nâng cao hiệu năng và giảm tải cho database, nhưng chắc chắn sẽ phát sinh nguy cơ dữ liệu không nhất quán. Sự nhất quán tuyệt đối (Strong Consistency) đồng nghĩa với việc độ phức tạp của hệ thống tăng vọt và suy giảm hiệu năng nghiêm trọng, do đó trong thực tế chúng ta thường chọn giải pháp phù hợp với bài toán nghiệp vụ để tìm điểm cân bằng tối ưu giữa hiệu năng và tính nhất quán (Eventual Consistency).

Dưới đây chúng ta sẽ phân tích chuyên sâu về **Cache Aside Pattern (Mô hình bộ nhớ đệm bên cạnh)**. Đây là chiến lược đọc ghi cache được sử dụng phổ biến nhất, quy trình của nó như sau:

- **Thao tác đọc (Read)**:
  1. Thử đọc dữ liệu từ cache trước.
  2. Nếu trúng cache (cache hit), trả về dữ liệu trực tiếp.
  3. Nếu trượt cache (cache miss), truy vấn dữ liệu từ database, ghi dữ liệu lấy được vào cache rồi trả về kết quả.
- **Thao tác ghi (Write)**:
  1. Cập nhật dữ liệu vào database và commit transaction trước.
  2. Sau khi commit thành công, xóa dữ liệu tương ứng trong cache.

Sơ đồ minh họa:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-write-9faa322c.png)

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-read-166ab345.png)

Thứ tự thao tác này vẫn cần chú ý giải quyết các vấn đề sau:

- **Xóa cache thất bại**: Áp dụng tác vụ thử lại (retry) có khả năng phục hồi; nếu dùng MQ thì cần tính đến kịch bản server bị sập sau khi DB đã commit nhưng tin nhắn MQ chưa kịp bắn ra, khi cần thiết phải kết hợp bảng tin nhắn giao dịch (Transactional Outbox) hoặc bắt log CDC (như Canal/Debezium) và giám sát các tác vụ bù đắp.
- **Ghi đè giá trị cũ (Old value backfill)**: Luồng đọc có thể đọc được dữ liệu cũ trước khi DB cập nhật, nhưng lại ghi đè vào cache sau khi thao tác xóa cache của luồng ghi đã hoàn tất. Kỹ thuật xóa kép trễ (Delayed Double Delete) chỉ giảm bớt phần nào rủi ro chứ không thể bao quát độ trễ mạng dài bất định; việc đọc từ slave database (có độ trễ replication) hoặc snapshot transaction dài cũng có thể nạp dữ liệu cũ vào cache.
- **TTL bảo hiểm**: Thiết lập thời gian hết hạn (TTL) phù hợp với mức độ dung sai của nghiệp vụ, tuy nhiên việc lấy lại dữ liệu sau khi TTL hết hạn phải đảm bảo đọc được dữ liệu mới từ database; bản thân TTL không thể mang lại tính nhất quán mạnh.
- **Năng lực phía đọc và bản sao nhiều tầng**: Việc xóa cache đòi hỏi khi cache miss hệ thống phải có khả năng truy vấn DB hoặc có phương án fallback rõ ràng. Nếu trong hệ thống còn có JVM local cache, cần xử lý thêm cơ chế thông báo xóa cache tới từng instance ứng dụng.

Để tìm hiểu chi tiết về các kịch bản tương tranh theo thời gian, ranh giới commit transaction và cơ chế retry, mời bạn xem bài: [Giải thích chi tiết 3 chiến lược đọc/ghi cache thường gặp](./3-commonly-used-cache-read-and-write-strategies.md); về bài toán truy vấn ngược và thông báo trong multi-level cache, xem tại [Kiến thức cơ bản về Cache](./cache-basics.md).

Bài viết gợi ý đọc thêm: [Vấn đề nhất quán giữa Cache và Database, đọc bài này là đủ - Nước và Đạn Bạc](https://mp.weixin.qq.com/s?__biz=MzIyOTYxNDI5OA==&mid=2247487312&idx=1&sn=fa19566f5729d6598155b5c676eee62d&chksm=e8beb8e5dfc931f3e35655da9da0b61c79f2843101c130cf38996446975014f958a6481aacf1&scene=178&cur_album_id=1699766580538032128#rd).

### Những trường hợp nào có thể khiến Redis bị nghẽn (blocking)?

Các nguyên nhân phổ biến có thể làm Redis bị tắc nghẽn bao gồm:

- Thực thi các lệnh có độ phức tạp `O(n)` (chẳng hạn `KEYS *`, `HGETALL`, `LRANGE`, `SMEMBERS`...), khi lượng dữ liệu lớn sẽ khiến thời gian thực thi lệnh kéo dài.
- Thực thi lệnh `SAVE` để tạo snapshot RDB đồng bộ sẽ chặn đứng main thread (nên dùng `BGSAVE` vì nó fork tiến trình con để tránh nghẽn).
- Ghi nhật ký AOF diễn ra trên main thread, có thể khiến các lệnh tiếp theo bị nghẽn trong lúc ghi log.
- Quá trình đẩy đĩa AOF (fsync): Luồng nền đồng bộ dữ liệu xuống đĩa vật lý, khi đĩa bị quá tải I/O sẽ khiến hàm `fsync` bị nghẽn, từ đó làm nghẽn luôn thao tác `write` trên main thread, đặc biệt rõ rệt khi cấu hình `appendfsync always` hoặc `everysec`.
- Quá trình AOF rewrite: Khi ghi nối tiếp phần dữ liệu từ AOF rewrite buffer vào file AOF mới có thể phát sinh tắc nghẽn.
- Thao tác trên bigkey (String > 1MB hoặc kiểu phức hợp > 5000 phần tử) gây ra tình trạng timeout phía client, nghẽn băng thông mạng và nghẽn luồng xử lý.
- Dùng lệnh `flushdb` hoặc `flushall` để xóa sạch database, thao tác xóa lượng lớn key và giải phóng bộ nhớ sẽ làm nghẽn main thread.
- Khi mở rộng hoặc thu hẹp cụm Redis Cluster: Việc di chuyển dữ liệu giữa các node diễn ra đồng bộ, nếu di chuyển bigkey sẽ khiến cả 2 node bị nghẽn trong thời gian dài, có thể kích hoạt cơ chế chuyển đổi dự phòng (failover) nhầm lẫn.
- Thiếu bộ nhớ RAM kích hoạt cơ chế Swap của hệ điều hành: OS hoán đổi bộ nhớ của Redis ra ổ đĩa cứng khiến hiệu năng đọc ghi sụt giảm nghiêm trọng.
- Các tiến trình khác trên cùng máy chủ chiếm dụng quá nhiều CPU khiến thông lượng của Redis sụt giảm.
- Các sự cố về mạng như từ chối kết nối, độ trễ mạng cao, ngắt mềm card mạng (softirq)... khiến Redis bị nghẽn.

Để tìm hiểu chi tiết hơn, bạn có thể đọc bài viết: [Tổng hợp các nguyên nhân gây tắc nghẽn thường gặp trong Redis](https://javaguide.cn/database/redis/redis-common-blocking-problems-summary.html).

## Redis Cluster & Sentinel

**Redis Sentinel**:

1. Sentinel là gì? Có tác dụng gì?
2. Sentinel phát hiện một node offline như thế nào? Sự khác biệt giữa Offline chủ quan (Subjective Down - SDOWN) và Offline khách quan (Objective Down - ODOWN)?
3. Sentinel thực hiện chuyển đổi dự phòng (Failover) như thế nào?
4. Tại sao khuyến nghị nên triển khai nhiều node Sentinel (Cụm Sentinel)?
5. Sentinel lựa chọn Master mới như thế nào (Cơ chế bầu cử)?
6. Làm thế nào để bầu chọn ra Leader từ cụm Sentinel?
7. Sentinel có thể ngăn chặn hiện tượng phân não (Split-brain) không?

**Redis Cluster**:

1. Tại sao cần Redis Cluster? Nó giải quyết được bài toán gì? Có những ưu thế nào?
2. Redis Cluster thực hiện phân mảnh (sharding) dữ liệu như thế nào?
3. Tại sao số lượng khe băm (Hash Slot) trong Redis Cluster lại là 16384?
4. Làm thế nào để xác định một key chỉ định sẽ phân bổ vào hash slot nào?
5. Redis Cluster có hỗ trợ phân bổ lại các hash slot (Resharding) không?
6. Trong thời gian mở rộng hoặc thu hẹp cụm, Redis Cluster có tiếp tục cung cấp dịch vụ được không?
7. Các node trong Redis Cluster giao tiếp với nhau như thế nào?

**Tham khảo câu trả lời chi tiết**: [Giải thích chi tiết về Redis Cluster (Trả phí)](https://javaguide.cn/database/redis/redis-cluster.html).

## Quy chuẩn sử dụng Redis trong thực tế

Trong quá trình sử dụng Redis thực tế, chúng ta nên tuân thủ các quy chuẩn phổ biến sau:

1. **Sử dụng Connection Pool (Hồ chứa kết nối)**: Tránh việc liên tục tạo mới và đóng kết nối client.
2. **Hạn chế dùng các lệnh O(n), khi dùng phải chú ý tới giá trị n**: Những lệnh O(n) như `KEYS *`, `HGETALL`, `LRANGE`, `SMEMBERS`, `SINTER`/`SUNION`/`SDIFF`... không phải là hoàn toàn bị cấm, nhưng bắt buộc phải biết rõ số lượng n phần tử. Ngoài ra, khi cần duyệt dữ liệu hãy ưu tiên dùng `HSCAN`, `SSCAN`, `ZSCAN`.
3. **Sử dụng thao tác hàng loạt để giảm truyền tải mạng**: Tận dụng các lệnh batch nguyên bản (như `MGET`, `MSET`...), pipeline, Lua script.
4. **Hạn chế dùng Redis Transaction**: Tính năng của Redis Transaction khá hạn chế, nên cân nhắc thay thế bằng Lua script.
5. **Cấm bật lệnh monitor trong thời gian dài**: Lệnh này gây ảnh hưởng rất lớn đến hiệu năng server.
6. **Kiểm soát vòng đời (TTL) của Key**: Tránh để trong Redis tồn đọng quá nhiều dữ liệu rác ít khi được truy cập.
7. ……

## Tài liệu tham khảo

- "Redis Development and Operations" (Redis Phát triển và Vận hành)
- "Redis Design and Implementation" (Redis Thiết kế và Triển khai)
- Redis Transactions: <https://redis.io/docs/manual/transactions/>
- What is Redis Pipeline: <https://buildatscale.tech/what-is-redis-pipeline/>
- Bật mí chi tiết cách phát hiện và xử lý BigKey, HotKey trong Redis: <https://mp.weixin.qq.com/s/FPYE1B839_8Yk1-YSiW-1Q>
- Khám phá hướng đi và giải pháp xử lý vấn đề Bigkey: <https://mp.weixin.qq.com/s/Sej7D9TpdAobcCmdYdMIyA>
- Cẩm nang toàn diện chẩn đoán sự cố độ trễ trong Redis: <https://mp.weixin.qq.com/s/mIc6a9mfEGdaNDD3MmfFsg>
