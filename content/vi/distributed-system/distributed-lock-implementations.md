---
title: "Giải thích chi tiết các phương án triển khai Distributed Lock: Redis, Redlock, ZooKeeper và Redisson Watch Dog"
category: Hệ thống phân tán (Distributed Systems)
description: "Giải thích chi tiết các phương án triển khai Distributed Lock, bao gồm Redis SET NX EX, giải phóng khóa an toàn bằng Lua, Redisson Watch Dog, Redlock, Ephemeral Sequential Node của ZooKeeper, khóa khả tái nhập (Reentrant Lock) của Curator và Fencing Token trong thực tế production."
tag:
  - Distributed Lock
head:
  - - meta
    - name: keywords
      content: Distributed Lock,Khóa phân tán,Redis Distributed Lock,ZooKeeper Distributed Lock,Redisson,Watch Dog,SETNX,Redlock,Fencing Token,Curator,Triển khai Distributed Lock,Câu hỏi phỏng vấn Distributed Lock
lang: vi
sourceRef: zh-ref/distributed-system/distributed-lock-implementations.md
---

Thông thường, chúng ta sẽ chọn triển khai Distributed Lock (khóa phân tán) dựa trên Redis hoặc ZooKeeper, trong đó Redis được sử dụng phổ biến hơn một chút. Ở đây, mình cũng sẽ bắt đầu giới thiệu cách triển khai Distributed Lock lấy Redis làm ví dụ.

Bài viết này mặc định bạn đã hiểu vì sao cần Distributed Lock. Nếu bạn chưa nắm rõ về độ mịn của khóa (lock granularity), owner token, thời gian timeout của khóa và vùng tranh chấp nghiệp vụ (critical section), bạn nên đọc trước bài [Nhập môn Distributed Lock](./distributed-lock.md). Nếu muốn đặt việc hết hạn khóa, khôi phục client cũ và Fencing Token vào một mô hình điều phối rộng hơn để hiểu sâu hơn, bạn có thể kết hợp đọc thêm [Giải thích chi tiết về điều phối phân tán](./protocol/centralized-and-decentralized.md).

## Triển khai Distributed Lock dựa trên Redis

### Làm thế nào để triển khai một Distributed Lock đơn giản nhất dựa trên Redis?

Dù là khóa cục bộ (local lock) hay Distributed Lock, cốt lõi đều nằm ở **tính loại trừ lẫn nhau (Mutual Exclusion)**.

Trong Redis, lệnh `SETNX` giúp chúng ta hiện thực hóa tính loại trừ lẫn nhau. `SETNX` là viết tắt của **SET** if **N**ot e**X**ists (tương ứng với phương thức `setIfAbsent` trong Java): chỉ khi key chưa tồn tại thì mới thiết lập giá trị cho key. Nếu key đã tồn tại, `SETNX` sẽ không làm gì cả.

```bash
> SETNX lockKey uniqueValue
(integer) 1
> SETNX lockKey uniqueValue
(integer) 0
```

Khi giải phóng khóa, chỉ cần dùng lệnh `DEL` để xóa key tương ứng là được.

```bash
> DEL lockKey
(integer) 1
```

Để tránh xóa nhầm khóa của client khác, ở đây chúng ta nên sử dụng Lua script để đối chiếu trước xem value tương ứng với key có đúng là giá trị duy nhất đã ghi lúc khóa hay không, sau khi kiểm tra khớp mới tiến hành xóa.

Việc chọn Lua script là để đảm bảo tính nguyên tử (`Atomicity`) cho thao tác mở khóa. Bởi vì Redis khi thực thi Lua script có thể thực thi một cách nguyên tử, qua đó đảm bảo tính nguyên tử cho thao tác giải phóng khóa.

```lua
-- Khi giải phóng khóa, đối chiếu trước xem value của key có khớp với giá trị duy nhất đã ghi khi lấy khóa không; khớp mới xóa để tránh xóa nhầm khóa của client khác
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

![Triển khai Distributed Lock đơn giản với Redis](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-setnx-24920263.png)

Đây là cách triển khai Distributed Lock bằng Redis đơn giản nhất, cài đặt dễ dàng và hiệu năng cũng rất cao. Tuy nhiên, cách triển khai này tồn tại một số vấn đề. Chẳng hạn, nếu ứng dụng gặp sự cố khiến logic giải phóng khóa bị sập đột ngột, khóa có thể không bao giờ được giải phóng, dẫn đến tài nguyên dùng chung không thể được các Thread/Process khác truy cập nữa.

### Tại sao phải thiết lập thời gian hết hạn cho khóa?

Để tránh việc khóa không thể được giải phóng, một giải pháp dễ nghĩ tới là: **thiết lập thời gian hết hạn cho key này (tức là khóa)**.

```bash
127.0.0.1:6379> SET lockKey uniqueValue EX 3 NX
OK
```

- **lockKey**: Tên khóa cần lấy;
- **uniqueValue**: Chuỗi ngẫu nhiên có thể định danh duy nhất khóa;
- **NX**: Chỉ khi key tương ứng với `lockKey` chưa tồn tại mới có thể `SET` thành công;
- **EX**: Thiết lập thời gian hết hạn (đơn vị giây). `EX 3` biểu thị khóa này có thời gian tự động hết hạn là 3 giây. Tương ứng với `EX` là `PX` (đơn vị mili-giây), cả hai đều dùng để thiết lập thời gian hết hạn.

**Bắt buộc phải đảm bảo việc thiết lập giá trị cho key chỉ định và thiết lập thời gian hết hạn là một thao tác nguyên tử (`Atomic`)!!!** Nếu không, vẫn có thể xảy ra tình trạng khóa không thể được giải phóng.

Tại sao phải dùng `SET NX EX`, mà không dùng `SETNX` trước rồi mới gọi `EXPIRE`? Cách làm phổ biến trước đây là gọi `SETNX` rồi `EXPIRE` thành hai bước riêng biệt: nếu client sập sau khi `SETNX` thành công nhưng trước khi kịp gọi `EXPIRE`, nó sẽ để lại một khóa vĩnh viễn. Từ Redis 2.6.12 đã hỗ trợ cú pháp nguyên tử như `SET key value NX EX seconds`, nên ưu tiên sử dụng cách này để tránh rủi ro Deadlock.

Cách này quả thực giải quyết được vấn đề trên, nhưng vẫn còn lỗ hổng: **nếu thời gian thao tác với tài nguyên dùng chung lớn hơn thời gian hết hạn, khóa sẽ bị hết hạn trước khi xong việc, dẫn đến Distributed Lock mất tác dụng trực tiếp. Còn nếu đặt thời gian timeout quá dài thì lại ảnh hưởng đến hiệu năng.**

Đây cũng chính là nguyên nhân gốc rễ khiến phần sau cần đến Fencing Token: việc kéo dài TTL đơn thuần không thể triệt tiêu khoảng thời gian mà "client A vẫn tưởng mình đang giữ khóa, nhưng thực tế khóa đã hết hạn và bị client B lấy mất".

Có lẽ bạn đang nghĩ: **Giá mà khi thao tác trên tài nguyên dùng chung chưa hoàn thành, thời gian hết hạn của khóa có thể tự động gia hạn được thì tốt biết mấy!**

### Làm thế nào để hiện thực hóa việc gia hạn khóa một cách mượt mà?

Đối với các lập trình viên Java, đã có sẵn giải pháp hoàn chỉnh: **[Redisson](https://github.com/redisson/redisson)**. Giải pháp cho các ngôn ngữ khác có thể tìm thấy trong tài liệu chính thức của Redis tại: <https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/>.

![Distributed locks with Redis](/media/jg/ext/oss.javaguide.cn/github/javaguide/redis-distributed-lock-c6e6e1a9.png)

Redisson là một Redis Client mã nguồn mở dành cho ngôn ngữ Java, cung cấp nhiều tính năng dùng ngay được (out-of-the-box), không chỉ bao gồm nhiều phương án triển khai Distributed Lock. Hơn nữa, Redisson còn hỗ trợ nhiều kiến trúc triển khai như Redis Standalone (đơn máy), Redis Sentinel, Redis Cluster, v.v.

Distributed Lock trong Redisson đi kèm cơ chế tự động gia hạn, cách sử dụng rất đơn giản và nguyên lý cũng dễ hiểu: nó cung cấp một **Watch Dog** chuyên dùng để giám sát và gia hạn khóa. Nếu Thread đang thao tác với tài nguyên dùng chung chưa thực thi xong, Watch Dog sẽ liên tục kéo dài thời gian hết hạn của khóa, đảm bảo khóa không bị giải phóng do quá hạn.

![Cơ chế tự động gia hạn Watch Dog của Redisson](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-redisson-renew-expiration-1be699dd.png)

Tên gọi Watch Dog bắt nguồn từ phương thức `getLockWatchdogTimeout()`. Phương thức này trả về thời gian hết hạn mà Watch Dog gia hạn cho khóa, mặc định là 30 giây (dựa trên [redisson-3.17.6](https://github.com/redisson/redisson/releases/tag/redisson-3.17.6)). Hiện nay Redisson đã bước sang phiên bản 4.x; ngữ nghĩa cấu hình cụ thể nên đối chiếu trực tiếp mã nguồn `Config#getLockWatchdogTimeout` và `RedissonBaseLock#renewExpiration` của phiên bản mà dự án đang sử dụng.

```java
// Mặc định 30 giây, hỗ trợ tùy chỉnh
private long lockWatchdogTimeout = 30 * 1000;

public Config setLockWatchdogTimeout(long lockWatchdogTimeout) {
    this.lockWatchdogTimeout = lockWatchdogTimeout;
    return this;
}
public long getLockWatchdogTimeout() {
   return lockWatchdogTimeout;
}
```

Phương thức `renewExpiration()` chứa logic chính của Watch Dog:

```java
private void renewExpiration() {
         //......
        Timeout task = commandExecutor.getConnectionManager().newTimeout(new TimerTask() {
            @Override
            public void run(Timeout timeout) throws Exception {
                //......
                // Gia hạn bất đồng bộ dựa trên Lua script
                CompletionStage<Boolean> future = renewExpirationAsync(threadId);
                future.whenComplete((res, e) -> {
                    if (e != null) {
                        // Không thể gia hạn
                        log.error("Can't update lock " + getRawName() + " expiration", e);
                        EXPIRATION_RENEWAL_MAP.remove(getEntryName());
                        return;
                    }

                    if (res) {
                        // Kích hoạt lần gia hạn tiếp theo qua chuỗi callback của timer, không phải đệ quy stack nên không gây tràn call stack
                        renewExpiration();
                    } else {
                        // Hủy gia hạn
                        cancelExpirationRenewal(null);
                    }
                });
            }
         // Trì hoãn internalLockLeaseTime/3 (mặc định 10s, tức 30/3) rồi gọi lại
        }, internalLockLeaseTime / 3, TimeUnit.MILLISECONDS);

        ee.setTimeout(task);
    }
```

Theo mặc định, cứ mỗi 10 giây, Watch Dog sẽ thực hiện thao tác gia hạn, đặt lại thời gian timeout của khóa thành 30 giây. Trước khi gia hạn, Watch Dog cũng sẽ kiểm tra xem có cần thực hiện gia hạn nữa hay không: chỉ gia hạn khi cần thiết, ngược lại sẽ hủy thao tác gia hạn.

Watch Dog hiện thực hóa việc gia hạn khóa bất đồng bộ bằng cách gọi phương thức `renewExpirationAsync()`:

```java
protected CompletionStage<Boolean> renewExpirationAsync(long threadId) {
    return evalWriteAsync(getRawName(), LongCodec.INSTANCE, RedisCommands.EVAL_BOOLEAN,
            // Kiểm tra xem có phải Thread đang giữ khóa không; nếu đúng thì gia hạn thời gian hết hạn khóa thành 30s (mặc định)
            "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
                    "redis.call('pexpire', KEYS[1], ARGV[1]); " +
                    "return 1; " +
                    "end; " +
                    "return 0;",
            Collections.singletonList(getRawName()),
            internalLockLeaseTime, getLockName(threadId));
}
```

Có thể thấy, phương thức `renewExpirationAsync` thực chất gọi Lua script để thực hiện gia hạn, làm vậy chủ yếu để đảm bảo tính nguyên tử cho thao tác gia hạn.

Ở đây mình lấy `RLock` (cài đặt Reentrant Lock của Redisson) làm ví dụ để minh họa cách sử dụng Redisson triển khai Distributed Lock:

```java
// 1. Lấy đối tượng Distributed Lock chỉ định
RLock lock = redisson.getLock("lock");
// 2. Lấy khóa và không đặt thời gian timeout để kích hoạt cơ chế tự động gia hạn Watch Dog
lock.lock();
// 3. Thực thi nghiệp vụ
...
// 4. Giải phóng khóa
lock.unlock();
```

Chỉ khi không chỉ định thời gian timeout của khóa thì cơ chế tự động gia hạn Watch Dog mới được kích hoạt.

```java
// Tự đặt thời gian hết hạn cho khóa sẽ không kích hoạt cơ chế tự động gia hạn Watch Dog
lock.lock(10, TimeUnit.SECONDS);
```

Nếu dùng Redis để triển khai Distributed Lock, rất khuyến khích sử dụng trực tiếp trên nền tảng Redisson.

### Làm thế nào để triển khai Reentrant Lock (khóa khả tái nhập)?

Cái gọi là Reentrant Lock (khóa khả tái nhập) nghĩa là trong cùng một Thread có thể lấy cùng một khóa nhiều lần. Ví dụ, một Thread đang thực thi một phương thức có khóa, bên trong phương thức đó lại gọi một phương thức khác cần cùng khóa đó, thì Thread này có thể thực thi trực tiếp phương thức được gọi (tức tái nhập - reentrant) mà không cần phải giành lại khóa từ đầu. Các khóa như `synchronized` và `ReentrantLock` trong Java đều thuộc loại Reentrant Lock.

**Distributed Lock không khả tái nhập (Non-reentrant) về cơ bản đã đáp ứng được phần lớn các kịch bản nghiệp vụ; một số kịch bản đặc thù mới cần đến Reentrant Distributed Lock.**

Ý tưởng cốt lõi để triển khai Reentrant Distributed Lock là khi Thread lấy khóa sẽ kiểm tra xem khóa đó có phải đang thuộc về chính mình hay không; nếu đúng thì không cần lấy lại nữa. Để làm được điều này, ta có thể gắn cho mỗi khóa một bộ đếm tái nhập (reentrancy counter) và định danh Thread đang chiếm giữ nó. Khi bộ đếm tái nhập lớn hơn 0, tức khóa đang bị chiếm giữ, cần kiểm tra xem Thread đang giữ khóa và Thread yêu cầu lấy khóa có phải là cùng một Thread hay không.

Trong dự án thực tế, chúng ta không cần tự cài đặt thủ công mà nên sử dụng **Redisson** đã nhắc ở trên; nó tích hợp sẵn nhiều loại khóa như Reentrant Lock, Spin Lock, Fair Lock, MultiLock, RedLock, ReadWriteLock.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/redisson-readme-locks-f664da3d.png)

### Redis giải quyết độ tin cậy của Distributed Lock trong môi trường Cluster như thế nào?

Để tránh điểm lỗi đơn (Single Point of Failure), dịch vụ Redis trong môi trường production thường được triển khai theo cụm (Cluster).

Dưới kiến trúc Redis Cluster, các cách triển khai Distributed Lock giới thiệu ở trên sẽ gặp vấn đề. Cơ chế nhân bản Master-Slave của Redis mặc định là bất đồng bộ: sau khi node Master ghi khóa thành công sẽ trả về kết quả ngay cho client rồi mới đồng bộ bất đồng bộ sang các node Slave. Nếu node Master sập trước khi kịp đồng bộ, cơ chế Failover của Sentinel hoặc Redis Cluster có thể thăng cấp một node Slave chưa nhận được dữ liệu khóa lên làm Master mới, dẫn đến khóa cũ bị mất, client khác có thể lấy khóa thành công lần nữa, từ đó phá vỡ tính loại trừ lẫn nhau.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/redis-master-slave-distributed-lock-a2db96f4.png)

Trước vấn đề này, cha đẻ của Redis là antirez đã thiết kế thuật toán [Redlock](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) để giải quyết.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-redis.io-realock-4a999396.png)

Tư tưởng của thuật toán Redlock là để client lần lượt gửi yêu cầu xin cấp khóa tới nhiều Redis master độc lập với nhau; nếu client có thể lấy khóa thành công trên số lượng instance chiếm đa số tuyệt đối, thì có thể coi là client đã lấy được Distributed Lock thành công, ngược lại là lấy khóa thất bại.

Điều kiện phán đoán đầy đủ của Redlock như sau:

- Sử dụng N Redis master độc lập hoàn toàn với nhau (không phải các shard của Redis Cluster).
- Client ghi lại thời điểm bắt đầu.
- Lần lượt gửi yêu cầu lấy khóa tới từng node với cùng key, value và TTL; mỗi yêu cầu đặt timeout ngắn để tránh một node đơn lẻ làm chậm toàn bộ quá trình lấy khóa.
- Chỉ khi lấy khóa thành công trên ít nhất `N/2 + 1` node và tổng thời gian tiêu tốn nhỏ hơn TTL mới được coi là lấy khóa thành công.
- Thời gian hiệu lực thực tế của khóa vào khoảng `TTL - thời gian tiêu tốn để lấy khóa - biên độ trôi đồng hồ (Clock Drift)`.
- Khi thất bại phải gửi yêu cầu giải phóng khóa tới tất cả các node, bao gồm cả những node đã lấy khóa thất bại hoặc bị timeout.

Redlock thao tác trực tiếp với các node Redis độc lập chứ không đi qua Redis Cluster, nhờ vậy mới tránh được vấn đề mất khóa do Failover trên một shard Master-Slave đơn lẻ.

Redlock có cách triển khai tương đối phức tạp, hiệu năng kém hơn và trong trường hợp xảy ra nhảy đồng hồ vẫn tồn tại nguy cơ mất an toàn. Tác giả cuốn *Designing Data-Intensive Applications* là Martin Kleppmann từng viết bài phân tích chuyên sâu ([How to do distributed locking - Martin Kleppmann - 2016](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)) phê bình Redlock, cho rằng đây là một cách triển khai Distributed Lock rất tệ. Các bạn quan tâm có thể đọc thêm bài viết [Từ loạt câu hỏi phỏng vấn về khóa Redis đến cuộc tranh luận đỉnh cao](https://mp.weixin.qq.com/s?__biz=Mzg3NjU3NTkwMQ==&mid=2247505097&idx=1&sn=5c03cb769c4458350f4d4a321ad51f5a&source=41#wechat_redirect), trong đó trình bày chi tiết cuộc tranh luận giữa antirez và Martin Kleppmann về Redlock.

Làm thế nào để phán đoán xem có nên dùng Redlock hay không? Cốt lõi là phải phân biệt rõ kịch bản sử dụng khóa trước:

1. Nếu là **khóa thiên về hiệu suất (Efficiency-oriented locking)**, tức là khi khóa mất hiệu lực chỉ gây ra các hệ quả chấp nhận được như tính toán lặp lại hoặc thực thi trùng tác vụ, có thể dùng phương án Redis đơn instance, Sentinel hoặc Cluster, đồng thời chấp nhận tường minh rủi ro thực thi đồng thời hãn hữu trong các tình huống cực đoan.
2. Nếu là **khóa thiên về tính đúng đắn (Correctness-oriented locking)**, tức là khi khóa mất hiệu lực sẽ gây sai lệch tồn kho, sai lệch tiền bạc, hỏng dữ liệu — những hậu quả không thể chấp nhận — thì nên ưu tiên ZooKeeper/etcd kết hợp với Fencing Token, thay vì trông cậy vào Failover Master-Slave của Redis để đảm bảo loại trừ lẫn nhau tuyệt đối.
3. Redlock phụ thuộc vào độ trễ mạng có giới hạn, thời gian tạm dừng tiến trình có giới hạn và độ trôi đồng hồ có giới hạn. Tạm dừng GC kéo dài, nhảy đồng hồ, gói tin đến trễ đều làm suy yếu tính đúng đắn của nó.
4. Quan điểm cốt lõi của Martin Kleppmann là: khóa thiên về tính đúng đắn bắt buộc phải đi kèm Fencing Token; luận điểm phản bác của antirez tập trung vào thực tế kỹ thuật rằng ảnh hưởng của trôi đồng hồ là có hạn và giá trị ngẫu nhiên giúp chống xóa nhầm. Người đọc nên phân biệt rõ kịch bản trước rồi mới chọn phương án.

## Triển khai Distributed Lock dựa trên ZooKeeper

So với việc triển khai Distributed Lock bằng Redis, ngoài độ tin cậy tương đối cao hơn, ở khía cạnh tính năng ZooKeeper còn có một đặc tính rất hữu ích: **cơ chế Watch**. Cơ chế này có thể dùng để hiện thực hóa Fair Distributed Lock (khóa phân tán công bằng). Tuy nhiên, hiệu năng của Distributed Lock triển khai bằng ZooKeeper tương đối kém hơn, nên nếu hệ thống yêu cầu hiệu năng cao thì ZooKeeper có thể không phù hợp.

### Làm thế nào để triển khai Distributed Lock dựa trên ZooKeeper?

Distributed Lock của ZooKeeper được hiện thực hóa dựa trên **Ephemeral Sequential Node (node tuần tự tạm thời)** và **Watcher (trình lắng nghe sự kiện)**.

Lấy khóa:

1. Đầu tiên chúng ta cần một node bền vững (Persistent Node) `/locks`. Client lấy khóa bằng cách tạo một Ephemeral Sequential Node bên dưới `/locks`.
2. Giả sử Client 1 tạo node `/locks/lock1`; sau khi tạo thành công, nó sẽ kiểm tra xem `lock1` có phải là node con nhỏ nhất dưới `/locks` hay không.
3. Nếu `lock1` là node con nhỏ nhất thì lấy khóa thành công. Ngược lại, lấy khóa thất bại.
4. Nếu lấy khóa thất bại, điều đó cho thấy đã có client khác lấy được khóa trước. Client 1 sẽ không liên tục lặp vòng để thử lấy khóa, mà đăng ký một Watcher lên node đứng ngay trước nó, ví dụ `/locks/lock0`. Tác dụng của trình lắng nghe này là thông báo cho Client 1 ngay sau khi node trước đó giải phóng khóa (tránh Spin Lock vô ích), từ đó Client 1 lấy khóa thành công.

Giải phóng khóa:

1. Client lấy khóa thành công sau khi thực thi xong quy trình nghiệp vụ sẽ xóa node con tương ứng của mình.
2. Nếu client đang giữ khóa gặp sự cố, node con tương ứng do là Ephemeral Sequential Node nên cũng sẽ tự động bị xóa, tránh tình trạng khóa không thể được giải phóng.
3. Watcher mà ta nhắc ở trên thực chất là lắng nghe đúng sự kiện xóa node con này; node con bị xóa đồng nghĩa với việc khóa đã được giải phóng.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-zookeeper-f61bc28a.png)

Trong dự án thực tế, khuyến khích sử dụng Curator để triển khai ZooKeeper Distributed Lock. Curator là một framework Java client cho ZooKeeper do Netflix mã nguồn mở; so với client `zookeeper` mặc định đi kèm của ZooKeeper, khả năng đóng gói của Curator hoàn thiện hơn nhiều và các API đều rất thuận tiện để sử dụng.

`Curator` chủ yếu hiện thực hóa 4 loại khóa sau:

- `InterProcessMutex`: Distributed Reentrant Exclusive Lock (khóa độc quyền phân tán khả tái nhập)
- `InterProcessSemaphoreMutex`: Distributed Non-reentrant Exclusive Lock (khóa độc quyền phân tán không khả tái nhập)
- `InterProcessReadWriteLock`: Distributed Read-Write Lock (khóa đọc-ghi phân tán)
- `InterProcessMultiLock`: Container quản lý nhiều khóa như một thực thể duy nhất; khi lấy khóa sẽ lấy toàn bộ các khóa, khi giải phóng cũng sẽ giải phóng toàn bộ tài nguyên khóa (bỏ qua các khóa giải phóng thất bại).

```java
CuratorFramework client = ZKUtils.getClient();
client.start();
// Khóa độc quyền phân tán khả tái nhập
InterProcessLock lock1 = new InterProcessMutex(client, lockPath1);
// Khóa độc quyền phân tán không khả tái nhập
InterProcessLock lock2 = new InterProcessSemaphoreMutex(client, lockPath2);
// Gom nhiều khóa thành một chỉnh thể
InterProcessMultiLock lock = new InterProcessMultiLock(Arrays.asList(lock1, lock2));

if (!lock.acquire(10, TimeUnit.SECONDS)) {
   throw new IllegalStateException("Không thể lấy nhiều khóa");
}
System.out.println("Đã lấy nhiều khóa");
System.out.println("Có đang giữ khóa thứ nhất không: " + lock1.isAcquiredInThisProcess());
System.out.println("Có đang giữ khóa thứ hai không: " + lock2.isAcquiredInThisProcess());
try {
    // Thao tác tài nguyên
    resource.use();
} finally {
    System.out.println("Giải phóng nhiều khóa");
    lock.release();
}
System.out.println("Có đang giữ khóa thứ nhất không: " + lock1.isAcquiredInThisProcess());
System.out.println("Có đang giữ khóa thứ hai không: " + lock2.isAcquiredInThisProcess());
client.close();
```

### Tại sao phải dùng Ephemeral Sequential Node (node tuần tự tạm thời)?

Mỗi node dữ liệu trong ZooKeeper được gọi là **znode**, đây là đơn vị dữ liệu nhỏ nhất trong ZooKeeper.

Chúng ta thường phân chia znode thành 4 loại chính:

- **PERSISTENT (node bền vững)**: Một khi được tạo sẽ tồn tại mãi ngay cả khi cụm ZooKeeper gặp sự cố, cho đến khi bị xóa tường minh.
- **EPHEMERAL (node tạm thời)**: Vòng đời của Ephemeral Node gắn liền với **Session của client**; **Session biến mất thì node biến mất**. Hơn nữa, **Ephemeral Node chỉ có thể là node lá (leaf node)**, không thể tạo node con bên dưới.
- **PERSISTENT_SEQUENTIAL (node tuần tự bền vững)**: Ngoài các đặc tính của node PERSISTENT, tên của các node con còn mang tính tuần tự, ví dụ `/node1/app0000000001`, `/node1/app0000000002`.
- **EPHEMERAL_SEQUENTIAL (node tuần tự tạm thời)**: Ngoài các đặc tính của node EPHEMERAL, tên của các node con còn mang tính tuần tự.

Có thể thấy, điểm khác biệt lớn nhất giữa Ephemeral Node và Persistent Node nằm ở cách xử lý khi Session mất hiệu lực: khi Session biến mất, node tạm thời tương ứng sẽ biến mất. Nhờ vậy, nếu client xảy ra ngoại lệ khiến chưa kịp giải phóng khóa cũng không sao, khi Session hết hiệu lực node sẽ tự động bị xóa, giúp tránh việc tiến trình client bị sập mà vẫn chiếm khóa vĩnh viễn.

Tuy nhiên, ZooKeeper vẫn cần cân nhắc đến tạm dừng GC (GC Pause), phân vùng mạng (Network Partition) và Session Timeout. Khi client bị GC kéo dài hoặc phân vùng mạng dẫn đến Session hết hạn, ZooKeeper sẽ xóa Ephemeral Node và cho phép client mới lấy khóa, trong khi client cũ có thể chưa kịp nhận biết Session đã hết hiệu lực và vẫn tưởng mình đang giữ khóa. Với các kịch bản yêu cầu tính đúng đắn cao, vẫn nên kết hợp Fencing Token để ngăn client cũ ghi dữ liệu lỗi thời sau khi khôi phục.

Khi dùng Redis để triển khai Distributed Lock, ta dựa vào thời gian hết hạn để tránh vấn đề khóa không thể giải phóng gây Deadlock; còn với ZooKeeper, ta tận dụng đặc tính của Ephemeral Node để xử lý việc giải phóng khóa sau khi client bị sập.

Giả sử không dùng node tuần tự, tất cả các client đang cố gắng lấy khóa đều sẽ đặt Watcher lên cùng một node con đang giữ khóa. Khi khóa đó được giải phóng, chắc chắn sẽ xảy ra tình trạng toàn bộ các client đang chờ đồng loạt lao vào tranh giành khóa (hiệu ứng bầy đàn - Herd Effect), rất bất lợi cho hiệu năng. Sau khi dùng node tuần tự, mỗi client chỉ cần lắng nghe đúng node đứng ngay trước mình, thân thiện hơn nhiều cho hiệu năng.

### Tại sao phải thiết lập lắng nghe trên node đứng ngay trước?

> Watcher (trình lắng nghe sự kiện) là một đặc tính rất quan trọng trong ZooKeeper. ZooKeeper cho phép người dùng đăng ký các Watcher lên node chỉ định, và khi một số sự kiện cụ thể được kích hoạt, phía server ZooKeeper sẽ đẩy thông báo sự kiện tới các client đang quan tâm; cơ chế này là đặc tính cốt lõi giúp ZooKeeper hiện thực hóa dịch vụ điều phối phân tán.

Trong cùng một khoảng thời gian, có thể có rất nhiều client cùng lúc yêu cầu lấy khóa, nhưng chỉ có một client có thể lấy thành công. Nếu lấy khóa thất bại, điều đó chứng tỏ đã có client khác lấy khóa thành công. Client lấy khóa thất bại sẽ không lặp vòng liên tục để thử lấy khóa, mà đăng ký một trình lắng nghe sự kiện lên node đứng ngay trước nó.

Tác dụng của trình lắng nghe sự kiện này là: **sau khi client tương ứng với node đứng trước giải phóng khóa (tức là sau khi node đứng trước bị xóa — lắng nghe sự kiện xóa), thông báo cho client đang lấy khóa thất bại (đánh thức Thread đang chờ, tương ứng cơ chế `wait/notifyAll` trong Java), để nó thử lấy khóa và lấy thành công.**

### Làm thế nào để triển khai Reentrant Lock?

Ở đây lấy cách triển khai Reentrant Lock của `InterProcessMutex` trong Curator để giới thiệu (mã nguồn tại: [InterProcessMutex.java](https://github.com/apache/curator/blob/master/curator-recipes/src/main/java/org/apache/curator/framework/recipes/locks/InterProcessMutex.java)).

Khi chúng ta gọi phương thức `InterProcessMutex#acquire` để lấy khóa, bên trong sẽ gọi phương thức `InterProcessMutex#internalLock`.

```java
// Lấy khóa độc quyền khả tái nhập, chặn cho đến khi lấy thành công
@Override
public void acquire() throws Exception {
  if (!internalLock(-1, null)) {
    throw new IOException("Lost connection while trying to acquire lock: " + basePath);
  }
}
```

Phương thức `internalLock` sẽ lấy Thread hiện tại đang yêu cầu khóa, sau đó lấy `lockData` tương ứng với Thread đó từ `threadData` (kiểu `ConcurrentMap<Thread, LockData>`). `lockData` chứa thông tin của khóa và số lần đã lấy khóa, là chìa khóa để hiện thực hóa Reentrant Lock.

Trong lần đầu tiên lấy khóa, `lockData` sẽ là `null`. Sau khi lấy khóa thành công, Thread hiện tại và `lockData` tương ứng sẽ được đưa vào `threadData`.

```java
private boolean internalLock(long time, TimeUnit unit) throws Exception {
  // Lấy Thread hiện tại đang yêu cầu khóa
  Thread currentThread = Thread.currentThread();
  // Lấy lockData tương ứng
  LockData lockData = threadData.get(currentThread);
  // Nếu là lần đầu tiên lấy khóa, lockData là null
  if (lockData != null) {
    // Sau khi Thread hiện tại đã lấy khóa một lần
    // Vì khóa của Thread hiện tại đã tồn tại, tăng lockCount để hiện thực hóa tái nhập (reentrancy)
    lockData.lockCount.incrementAndGet();
    return true;
  }
  // Thử lấy khóa
  String lockPath = internals.attemptLock(time, unit, getLockNodeBytes());
  if (lockPath != null) {
    LockData newLockData = new LockData(currentThread, lockPath);
    // Sau khi lấy khóa thành công, đưa Thread hiện tại và lockData tương ứng vào threadData
    threadData.put(currentThread, newLockData);
    return true;
  }

  return false;
}
```

`LockData` là một lớp nội tĩnh (static inner class) trong `InterProcessMutex`.

```java
private final ConcurrentMap<Thread, LockData> threadData = Maps.newConcurrentMap();

private static class LockData
{
    // Thread hiện đang giữ khóa
    final Thread owningThread;
    // Node con tương ứng với khóa
    final String lockPath;
    // Số lần lấy khóa
    final AtomicInteger lockCount = new AtomicInteger(1);

    private LockData(Thread owningThread, String lockPath)
    {
      this.owningThread = owningThread;
      this.lockPath = lockPath;
    }
}
```

Nếu đã lấy khóa một lần trước đó, khi quay lại lấy khóa lần sau, nó sẽ bị chặn ngay tại `if (lockData != null)`, rồi thực thi `lockData.lockCount.incrementAndGet();` để tăng số lần lấy khóa lên 1.

Toàn bộ logic triển khai Reentrant Lock rất đơn giản: kiểm tra trực tiếp ở phía client xem Thread hiện tại đã giữ khóa hay chưa; nếu có rồi thì chỉ cần cộng 1 vào số lần lấy khóa là xong.

Cần lưu ý ranh giới của khả năng tái nhập: tính khả tái nhập của Curator `InterProcessMutex` chỉ giới hạn trong cùng một Thread bên trong cùng một JVM. Tương tự, `RLock` của Redisson cũng dùng `UUID:threadId` để ghi nhận Thread giữ khóa và bộ đếm tái nhập, chứ không có nghĩa là cùng một người dùng nghiệp vụ có thể tái nhập tự nhiên xuyên JVM hay xuyên Thread. Nếu cần khả năng tái nhập cấp nghiệp vụ xuyên Process hoặc xuyên JVM, cần tự thiết kế định danh nghiệp vụ, tính lũy đẳng (`Idempotency`) và logic chống trùng lặp ở tầng ứng dụng.

## Triển khai Fencing Token trong thực tế kỹ thuật

Fencing Token (mã thông báo cách ly) tự thân chỉ là một số phiên bản tăng đơn điệu (monotonically increasing), nó chỉ phát huy tác dụng khi phía tài nguyên đích phối hợp kiểm tra. Client khi truy cập cơ sở dữ liệu, Object Storage hoặc tài nguyên bên ngoài bắt buộc phải mang theo token; phía tài nguyên cần lưu lại token lớn nhất từng thấy và từ chối mọi thao tác ghi có token nhỏ hơn. Nếu không, việc chỉ sinh ra token đơn lẻ sẽ không có ý nghĩa gì.

Các cách triển khai phổ biến như sau:

| Lưu trữ / Hệ thống | Nguồn gốc Token | Cách thức kiểm tra |
| --- | --- | --- |
| MySQL | Thêm cột `fencing_token` vào bảng nghiệp vụ | `UPDATE ... SET fencing_token = ? WHERE id = ? AND ? > fencing_token`, đảm bảo token mới lớn hơn token đã lưu |
| Object Storage | Mang theo token hoặc điều kiện phiên bản khi ghi | Sử dụng ghi có điều kiện (Conditional Write) hoặc ràng buộc phiên bản đối tượng |
| ZooKeeper | Có thể cân nhắc dùng `zxid` hoặc `znode stat version` | Phía tài nguyên từ chối các lượt ghi có phiên bản cũ |
| etcd | `revision` / `mod_revision` | Kiểm tra phiên bản thông qua giao dịch có điều kiện (`Txn`) |

Lưu ý: Nếu tài nguyên bên ngoài không hỗ trợ ghi có điều kiện hoặc kiểm tra phiên bản, nó sẽ không phù hợp để gánh vác các kịch bản Distributed Lock đòi hỏi tính đúng đắn; nên cân nhắc chuyển sang dịch vụ điều phối có tính nhất quán mạnh hơn, hoặc cải tạo luồng ghi tài nguyên để hỗ trợ kiểm tra token.

Đây chính là nguồn gốc của vấn đề "khóa hết hạn trước thời điểm xong việc" đã nhắc ở phần trước: kéo dài TTL đơn thuần không thể triệt tiêu khoảng hở mà "client A vẫn tưởng mình đang giữ khóa, nhưng thực tế khóa đã hết hạn và bị client B lấy mất". Fencing Token đóng vai trò lớp chốt chặn an toàn bằng cách kiểm tra phiên bản ngay tại phía tài nguyên.

## Đối chiếu nhanh với etcd / Consul

- **etcd**: Dựa trên Raft, cung cấp các năng lực như Lease, Txn, `revision`, tự nhiên phù hợp hơn cho việc điều phối có kèm fencing. Trong hệ sinh thái Cloud-Native / Kubernetes, etcd phổ biến hơn.
- **Consul**: Cung cấp Session + Lock, nhưng vẫn cần cân nhắc vấn đề phán đoán nhầm Session TTL và fencing.

Trong hệ sinh thái Java, ZooKeeper + Curator trưởng thành hơn; còn trong hệ sinh thái Cloud-Native / Kubernetes, etcd phổ biến hơn.

Khi lựa chọn công nghệ thực tế cần kết hợp với hạ tầng sẵn có của đội ngũ, hệ sinh thái client, yêu cầu hiệu năng và năng lực xử lý sự cố.

## Tổng kết

Trong bài viết này, mình đã chủ yếu giới thiệu hai cách phổ biến để triển khai Distributed Lock là **Redis** và **ZooKeeper**, đồng thời bổ sung phần đối chiếu nhanh với etcd / Consul. Còn về việc cụ thể nên chọn phương án nào, vẫn phải căn cứ vào nhu cầu cụ thể của nghiệp vụ để quyết định.

- Nếu yêu cầu hiệu năng tương đối cao và có thể chấp nhận rủi ro hãn hữu thực thi đồng thời trong trường hợp cực đoan, có thể dùng Redis để triển khai Distributed Lock. Khuyến khích ưu tiên chọn các Distributed Lock có sẵn do **Redisson** cung cấp thay vì tự cài đặt lại từ đầu.
- Nếu yêu cầu độ tin cậy và tính đúng đắn tương đối cao, khuyến nghị dùng ZooKeeper hoặc etcd để triển khai Distributed Lock và kết hợp với Fencing Token. Nên triển khai ZooKeeper Distributed Lock dựa trên framework **Curator**. Tuy nhiên, hiện nay nhiều dự án không dùng đến ZooKeeper; nếu chỉ vì một tính năng Distributed Lock mà kéo thêm ZooKeeper vào hệ thống thì không đáng chút nào, không nên làm tăng độ phức tạp hệ thống chỉ vì một tính năng nhỏ.

Cần lưu ý rằng dù chọn cách nào để triển khai Distributed Lock — bao gồm Redis, ZooKeeper hay etcd — dưới các bất thường như tạm dừng GC của tiến trình, độ trễ mạng, phân vùng mạng, trôi đồng hồ, bất kỳ Distributed Lock dựa trên hợp đồng thuê (`Lease`) nào đều tồn tại khoảng hở khiến client tưởng nhầm mình vẫn đang giữ khóa. Để nâng cao hơn nữa độ tin cậy của hệ thống, khuyến nghị đưa vào cơ chế chốt chặn ở phía tài nguyên như Fencing Token nhằm tránh việc client lỗi thời ghi đè dữ liệu.
