---
title: Tổng hợp các nguyên nhân gây nghẽn (blocking) phổ biến trong Redis
description: Tổng hợp toàn diện các nguyên nhân gây nghẽn (blocking) phổ biến trong Redis, bao gồm các lệnh độ phức tạp O(n), thao tác với bigkey, flush log AOF xuống đĩa, tạo snapshot RDB, mở rộng cụm, giúp bạn khắc phục và phòng ngừa các vấn đề về hiệu năng Redis.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis blocking,Redis hiệu năng,lệnh O(n),bigkey,AOF flush,RDB snapshot,đồng bộ master-slave,bộ nhớ đạt giới hạn
lang: vi
sourceRef: zh-ref/database/redis/redis-common-blocking-problems-summary.md
---

> Bài viết được tổng hợp và hoàn thiện từ: <https://mp.weixin.qq.com/s/0Nqfq_eQrUb12QH6eBbHXA>, Tác giả: 阿 Q ShuoDaiMa (A-Q Talks Code).

Bài viết này sẽ tổng hợp chi tiết các tình huống có thể khiến Redis bị nghẽn (blocking). Đây cũng chính là những yếu tố then chốt ảnh hưởng đến hiệu năng của Redis mà bạn cần đặc biệt lưu tâm khi sử dụng!

## Các lệnh độ phức tạp O(n)

Phần lớn các lệnh trong Redis đều có độ phức tạp thời gian là O(1), nhưng vẫn có một số ít lệnh có độ phức tạp là O(n), chẳng hạn như:

- `KEYS *`: Trả về tất cả các key khớp với pattern chỉ định.
- `HGETALL`: Trả về toàn bộ các cặp key-value trong một Hash.
- `LRANGE`: Trả về các phần tử trong phạm vi chỉ định của một List.
- `SMEMBERS`: Trả về tất cả các phần tử trong một Set.
- `SINTER` / `SUNION` / `SDIFF`: Tính toán giao / hợp / hiệu của nhiều Set.
- ...

Do các lệnh này có độ phức tạp thời gian là O(n) và đôi khi phải quét toàn bộ bảng/keyspace, khi n càng lớn thì thời gian thực thi càng kéo dài, dẫn đến việc làm nghẽn (block) các kết nối từ client. Tuy nhiên, điều này không có nghĩa là tuyệt đối không được dùng các lệnh này, mà cần phải kiểm soát rõ giá trị N. Ngoài ra, khi có nhu cầu duyệt dữ liệu, bạn nên sử dụng `HSCAN`, `SSCAN`, `ZSCAN` để thay thế.

Bên cạnh các lệnh O(n) nêu trên có thể gây nghẽn, còn có một số lệnh có độ phức tạp thời gian chạm mức O(n) hoặc lớn hơn trong một số điều kiện nhất định, ví dụ:

- `ZRANGE` / `ZREVRANGE`: Trả về tất cả các phần tử trong phạm vi thứ hạng chỉ định của một Sorted Set. Độ phức tạp thời gian là O(log(n)+m), với n là tổng số phần tử và m là số phần tử được trả về. Khi m và n rất lớn, chi phí thực thi sẽ tăng cao.
- `ZREMRANGEBYRANK` / `ZREMRANGEBYSCORE`: Xóa tất cả các phần tử trong phạm vi thứ hạng hoặc điểm số chỉ định của Sorted Set. Độ phức tạp thời gian là O(log(n)+m), với n là tổng số phần tử và m là số phần tử bị xóa.
- ...

## Lệnh SAVE tạo snapshot RDB

Redis cung cấp hai lệnh để tạo file snapshot RDB:

- `save`: Thao tác lưu đồng bộ, sẽ trực tiếp block luồng chính (main thread) của Redis;
- `bgsave`: Fork một tiến trình con (child process) để thực thi ngầm, không gây block main thread của Redis, đây là tùy chọn mặc định.

Theo mặc định, cấu hình Redis sẽ sử dụng lệnh `bgsave`. Nếu bạn chạy lệnh `save` thủ công để tạo file snapshot RDB, main thread chắc chắn sẽ bị block hoàn toàn.

## AOF

### Nghẽn khi ghi nhật ký AOF

Cơ chế lưu trữ bền vững AOF của Redis ghi log sau khi lệnh đã được thực thi xong, điều này khác với các cơ sở dữ liệu quan hệ (như MySQL) vốn thường ghi log trước khi thực thi lệnh (nhằm phục vụ crash recovery).

![Quá trình ghi log AOF](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-aof-write-log-disc-7a4b70ef.png)

**Tại sao lại ghi log sau khi đã thực thi lệnh xong?**

- Tránh chi phí kiểm tra cú pháp dư thừa: Việc ghi log AOF không cần kiểm tra cú pháp lệnh vì lệnh lỗi đã bị loại bỏ trong lúc thực thi;
- Ghi log sau khi thực thi lệnh sẽ không làm block quá trình thực thi của chính lệnh hiện tại.

Tuy nhiên điều này cũng mang lại rủi ro:

- Nếu Redis bị crash ngay sau khi thực thi lệnh thì các sửa đổi tương ứng sẽ bị mất vĩnh viễn;
- **Có thể làm block việc thực thi của các lệnh tiếp theo (vì thao tác ghi log AOF diễn ra ngay trên main thread của Redis)**.

### Nghẽn khi flush AOF xuống đĩa

Khi bật AOF persistence, mỗi khi thực thi một lệnh làm thay đổi dữ liệu trong Redis, Redis sẽ ghi lệnh đó vào bộ đệm AOF `server.aof_buf`, sau đó dựa vào cấu hình `appendfsync` để quyết định khi nào sẽ đồng bộ xuống file AOF trên đĩa cứng.

Trong file cấu hình của Redis có ba chiến lược `appendfsync` khác nhau:

1. `appendfsync always`: Sau khi main thread gọi hàm `write` để ghi dữ liệu, **main thread** sẽ lập tức gọi hàm `fsync` để đồng bộ file AOF (flush xuống đĩa), sau khi `fsync` hoàn tất thì thread mới return. Chiến lược `always` do **chính main thread trực tiếp thực thi fsync**, không phải do background thread. Cách này an toàn dữ liệu nhất nhưng mọi thao tác ghi đều block đồng bộ main thread, làm suy giảm nghiêm trọng hiệu năng Redis (`write` + `fsync`).
2. `appendfsync everysec`: Main thread gọi `write` xong sẽ return ngay, sau đó background thread (luồng `aof_fsync`) định kỳ mỗi giây một lần gọi hàm `fsync` (system call) để đồng bộ file AOF (`write` + `fsync`, khoảng cách giữa các lần `fsync` là 1 giây).
3. `appendfsync no`: Main thread gọi `write` xong return ngay, để mặc hệ điều hành tự quyết định thời điểm đồng bộ, trên Linux thông thường khoảng 30 giây một lần (`write` nhưng không chủ động `fsync`, thời điểm `fsync` do OS quyết định).

Khi background thread (`aof_fsync`) gọi hàm `fsync` để đồng bộ file AOF, nó phải chờ cho đến khi quá trình ghi hoàn tất. Khi áp lực I/O của đĩa quá lớn, thao tác `fsync` sẽ bị nghẽn (block), lúc này khi main thread gọi hàm `write` thì bản thân nó cũng sẽ bị block theo. Chỉ sau khi `fsync` hoàn tất, lời gọi `write` của main thread mới có thể return thành công.

Để hiểu chi tiết quy trình hoạt động của AOF, bạn có thể tham khảo: [Chi tiết cơ chế lưu trữ bền vững (Persistence) trong Redis](./redis-persistence.md), giúp bạn hiểu sâu hơn về hiện tượng block khi flush AOF xuống đĩa.

### Nghẽn khi rewrite AOF (AOF Rewrite)

1. Redis fork một tiến trình/luồng con để thực hiện rewrite file. Khi thực thi lệnh `BGREWRITEAOF`, Redis server sẽ duy trì một bộ đệm rewrite AOF (AOF rewrite buffer); bộ đệm này ghi nhận lại toàn bộ các lệnh ghi mà server nhận được trong thời gian tiến trình con đang tạo file AOF mới.
2. Sau khi tiến trình con hoàn tất việc tạo file AOF mới, server sẽ append toàn bộ nội dung từ rewrite buffer vào cuối file AOF mới, giúp cho trạng thái database được lưu trữ trong file AOF mới hoàn toàn trùng khớp với trạng thái hiện hành.
3. Cuối cùng, server sử dụng file AOF mới để thay thế nguyên tử cho file AOF cũ, hoàn tất quy trình rewrite AOF.

Hiện tượng nghẽn xuất hiện ở bước thứ 2: quá trình ghi dữ liệu tích lũy mới từ bộ đệm vào file mới sẽ gây ra **blocking**.

Tài liệu tham khảo thêm: [Phân tích sự cố nghẽn khi AOF Rewrite trong Redis](https://cloud.tencent.com/developer/article/1633077).

## Bigkey (Key kích thước lớn)

Nếu value tương ứng với một key chiếm dụng dung lượng bộ nhớ tương đối lớn, key đó có thể được coi là bigkey. Cụ thể lớn bao nhiêu thì tính là bigkey? Có một tiêu chuẩn tham khảo tương đối như sau:

- Value kiểu String có dung lượng vượt quá 1MB.
- Value thuộc kiểu dữ liệu phức hợp (List, Hash, Set, Sorted Set...) chứa hơn 5.000 phần tử (với kiểu phức hợp, không hẳn cứ nhiều phần tử là dung lượng bộ nhớ lớn hơn, nhưng đây là tiêu chí ước lượng phổ biến).

Các vấn đề nghẽn do bigkey gây ra bao gồm:

- Client bị timeout blocking: Do Redis xử lý các lệnh theo cơ chế đơn luồng (single thread), các thao tác trên bigkey sẽ tốn nhiều thời gian, làm block Redis; đứng từ góc nhìn client sẽ thấy hiện tượng treo rất lâu không có phản hồi.
- Gây nghẽn băng thông mạng (network congestion): Mỗi lần đọc dữ liệu bigkey sẽ phát sinh lưu lượng mạng rất lớn. Nếu một key có kích thước 1MB, với tần suất truy cập 1.000 lượt/giây thì mỗi giây sẽ tạo ra 1.000MB lưu lượng, đây là thảm họa đối với các server dùng card mạng 1Gbps thông thường.
- Block worker thread: Khi dùng lệnh `DEL` để xóa bigkey, worker thread sẽ bị block trong suốt thời gian giải phóng bộ nhớ, khiến hệ thống không thể xử lý các lệnh tiếp theo.

### Tìm kiếm bigkey

Khi sử dụng tham số `--bigkeys` tích hợp sẵn của Redis để quét tìm bigkey, tốt nhất bạn nên chạy lệnh này trên các node Replica (Slave), vì nếu chạy trực tiếp trên Master node thì sẽ gây **block** Master node.

- Bạn cũng có thể sử dụng lệnh `SCAN` để duyệt tìm bigkey một cách an toàn hơn;
- Phân tích file RDB để tìm ra bigkey, phương án này yêu cầu Redis phải đang bật cơ chế RDB persistence. Trên mạng có sẵn các công cụ rất tiện lợi:
  - redis-rdb-tools: Công cụ viết bằng Python dùng để phân tích file snapshot RDB của Redis.
  - rdb_bigkeys: Công cụ viết bằng ngôn ngữ Go dùng để phân tích file snapshot RDB của Redis với hiệu năng vượt trội hơn.

### Xóa bigkey

Bản chất của thao tác xóa là giải phóng không gian bộ nhớ mà cặp key-value đang chiếm giữ.

Giải phóng bộ nhớ chỉ là bước đầu tiên. Để quản lý không gian bộ nhớ hiệu quả hơn, khi ứng dụng giải phóng bộ nhớ, **hệ điều hành cần phải chèn các khối nhớ vừa giải phóng vào một danh sách liên kết các khối nhớ trống (free memory block linked list)** nhằm phục vụ cho việc quản lý và cấp phát lại sau này. Bản thân quy trình này đòi hỏi thời gian nhất định và sẽ **block** tiến trình đang thực hiện giải phóng bộ nhớ.

Do đó, nếu giải phóng một lượng lớn bộ nhớ cùng một lúc, thời gian thao tác trên danh sách liên kết khối nhớ trống sẽ tăng lên, kéo theo việc main thread của Redis bị block. Khi main thread bị nghẽn, tất cả các request khác đều có thể bị timeout. Tình trạng timeout dồn ứ ngày càng nhiều sẽ làm cạn kiệt connection pool của Redis, phát sinh hàng loạt ngoại lệ hệ thống.

Khi xóa bigkey, khuyến nghị nên áp dụng phương pháp xóa theo từng đợt (batching) hoặc xóa bất đồng bộ (sử dụng lệnh `UNLINK`).

## Làm trống database (Flush Database)

Việc làm trống database cũng dựa trên cùng nguyên lý với việc xóa bigkey nêu trên: các lệnh `FLUSHDB`, `FLUSHALL` đều liên quan đến việc xóa và giải phóng toàn bộ các cặp key-value, đây cũng là một điểm nghẽn nghiêm trọng trong Redis.

## Mở rộng cụm (Cluster Resizing)

Redis Cluster hỗ trợ mở rộng (scale-out) hoặc thu hẹp (scale-in) node động, tuy nhiên quy trình này hiện tại vẫn ở trạng thái bán tự động và cần sự can thiệp của con người.

Khi mở rộng hoặc thu hẹp cụm, hệ thống cần tiến hành di chuyển dữ liệu (data migration). Để đảm bảo tính nhất quán trong quá trình di chuyển, tất cả các thao tác migration của Redis đều là thao tác đồng bộ.

Khi thực thi migration, các node Redis ở cả hai đầu đều sẽ rơi vào trạng thái nghẽn với khoảng thời gian dài ngắn khác nhau. Đối với các key nhỏ, thời gian này không đáng kể; nhưng nếu gặp phải key có kích thước bộ nhớ quá lớn, trường hợp nghiêm trọng có thể kích hoạt cơ chế failover ngoài ý muốn trong cụm, dẫn đến việc chuyển đổi master không cần thiết.

## Swap (Hoán đổi bộ nhớ)

**Swap là gì?** Swap trong Linux thường được gọi là phân vùng hoán đổi bộ nhớ. Tương tự như bộ nhớ ảo (Virtual Memory) trong Windows, khi bộ nhớ vật lý bị thiếu hụt, hệ điều hành sẽ sử dụng một phần không gian ổ đĩa cứng giả lập thành bộ nhớ để giải quyết tình trạng cạn kiệt RAM. Vì vậy, vai trò của phân vùng Swap là đánh đổi hiệu năng ổ cứng để tăng dung lượng bộ nhớ, giải quyết sự cố VPS bị thiếu hoặc tràn RAM.

Swap là điều tối kỵ đối với Redis. Tiền đề cốt lõi giúp Redis đạt hiệu năng cực cao là toàn bộ dữ liệu phải nằm trên RAM. Nếu hệ điều hành hoán đổi một phần bộ nhớ mà Redis đang sử dụng ra ổ đĩa cứng, do tốc độ đọc ghi giữa RAM và đĩa cứng chênh lệch nhau hàng nghìn đến hàng triệu lần, hiệu năng của Redis sau khi bị swap sẽ sụt giảm nghiêm trọng.

Cách thức kiểm tra xem Redis có đang bị Swap hay không:

1. Tra cứu process ID (PID) của Redis:

```bash
redis-cli -p 6383 info server | grep process_id
process_id: 4476
```

2. Dựa vào process ID để tra cứu thông tin bộ nhớ bị hoán đổi:

```bash
cat /proc/4476/smaps | grep Swap
Swap: 0kB
Swap: 0kB
Swap: 4kB
Swap: 0kB
Swap: 0kB
.....
```

Nếu dung lượng swap đều là 0KB hoặc chỉ có cá biệt vài mục 4KB thì hệ thống hoàn toàn bình thường.

Các biện pháp phòng tránh hiện tượng hoán đổi bộ nhớ (Swap):

- Đảm bảo máy chủ luôn có đủ dung lượng bộ nhớ vật lý khả dụng.
- Đảm bảo tất cả các Redis instance đều được cấu hình giới hạn bộ nhớ tối đa (`maxmemory`), ngăn chặn tình trạng bộ nhớ Redis tăng trưởng mất kiểm soát trong các tình huống cực đoan.
- Giảm mức độ ưu tiên sử dụng swap của hệ thống, ví dụ: `echo 10 > /proc/sys/vm/swappiness`.

## Cạnh tranh CPU (CPU Contention)

Redis là một ứng dụng tiêu biểu thuộc dạng CPU-bound (sử dụng nhiều CPU), không nên triển khai chung trên cùng một máy chủ với các dịch vụ đa nhân tiêu tốn nhiều CPU khác. Khi các tiến trình khác tiêu hao quá nhiều tài nguyên CPU, throughput (thông lượng) của Redis sẽ bị ảnh hưởng nghiêm trọng.

Bạn có thể theo dõi tình trạng hoạt động hiện tại của Redis thông qua lệnh `redis-cli --stat`. Sử dụng lệnh `top` để quan sát mức độ chiếm dụng CPU của các tiến trình. Đồng thời phân tích thời gian tiêu tốn bất thường của các lệnh qua bảng thống kê `info commandstats` để xác định xem sự cố có bắt nguồn từ các thuật toán có độ phức tạp cao hoặc việc tối ưu hóa bộ nhớ quá mức hay không.

## Các vấn đề về mạng (Network Issues)

Từ chối kết nối (connection refused), độ trễ mạng cao (latency), ngắt mềm card mạng (softIRQ)... cùng các sự cố liên quan đến hạ tầng mạng cũng có thể khiến Redis bị nghẽn (blocking).

## Tài liệu tham khảo

- Phân tích và tổng kết 6 kịch bản gây nghẽn trong Redis: <https://mp.weixin.qq.com/s/eaZCEtTjTuEmXfUubVHjew>
- Ghi chép phát triển và vận hành Redis - Cơn ác mộng của Redis: Blocking: <https://mp.weixin.qq.com/s/TDbpz9oLH6ifVv6ewqgSgA>
