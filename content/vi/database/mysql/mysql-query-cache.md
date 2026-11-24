---
title: Chi tiết về Query Cache (Bộ nhớ đệm truy vấn) trong MySQL
description: Phân tích chuyên sâu về nguyên lý hoạt động, cấu hình quản trị cũng như ưu nhược điểm của Query Cache trong MySQL; lý giải vì sao MySQL 8.0 loại bỏ hoàn toàn tính năng này và các khuyến nghị thực tiễn tốt nhất cho môi trường production.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Query Cache,bộ nhớ đệm truy vấn MySQL,cơ chế cache MySQL,mất hiệu lực cache,MySQL 8.0,tối ưu hóa hiệu năng truy vấn,quản lý bộ nhớ MySQL
lang: vi
sourceRef: zh-ref/database/mysql/mysql-query-cache.md
---

Cache (bộ nhớ đệm) là một giải pháp tối ưu hóa hiệu năng hệ thống vô cùng hiệu quả và thiết thực. Từ hệ điều hành cho tới các phần mềm ứng dụng và dịch vụ Web, cơ chế cache đều được ứng dụng rộng rãi.

Tuy nhiên, các DBA dày dặn kinh nghiệm đều khuyến nghị nên tắt bỏ tính năng Query Cache (bộ nhớ đệm truy vấn) mặc định của MySQL trên môi trường production. Hơn nữa, bắt đầu từ phiên bản MySQL 5.7.20, Query Cache đã bị đánh dấu ngừng hỗ trợ (deprecated), và đến phiên bản MySQL 8.0 trở đi, tính năng này đã bị loại bỏ hoàn toàn khỏi mã nguồn.

Tại sao lại như vậy? Phải chăng Query Cache thực sự "vô dụng" và gây hại nhiều hơn lợi?

Mang theo những câu hỏi dưới đây, chúng ta hãy cùng đi sâu tìm hiểu bài viết này:

- MySQL Query Cache là gì? Phạm vi áp dụng của nó ra sao?
- Quy tắc lưu cache của MySQL hoạt động như thế nào?
- Ưu và nhược điểm của MySQL Query Cache là gì?
- Query Cache tác động như thế nào đến hiệu năng tổng thể của MySQL?

## Giới thiệu về MySQL Query Cache

Kiến trúc tổng thể của hệ thống MySQL được minh họa như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/mysql-architecture-a9cf127e.png)

Nhằm gia tăng tốc độ phản hồi cho các câu lệnh truy vấn hoàn toàn giống nhau, MySQL Server sẽ thực hiện tính toán giá trị Hash từ chuỗi ký tự của câu lệnh truy vấn. MySQL Server không thực hiện bất kỳ bước tiền xử lý hay chuẩn hóa nào đối với câu SQL; câu SQL bắt buộc phải trùng khớp tuyệt đối từng ký tự thì giá trị Hash sinh ra mới giống nhau. Sau khi có được giá trị Hash, MySQL sẽ dùng giá trị này để so khớp với kết quả truy vấn đang lưu trong Query Cache:

- Nếu khớp (cache hit), tập kết quả đã lưu trong cache sẽ được trả về trực tiếp cho client mà không cần trải qua các bước phân tích cú pháp (parse), tối ưu hóa hay thực thi câu lệnh.
- Nếu không khớp (cache miss), MySQL sẽ thực thi câu truy vấn bình thường, sau đó lưu cả giá trị Hash cùng tập kết quả vào Query Cache để phục vụ cho các lần truy vấn tiếp theo.

Nói cách khác, **khi một câu lệnh truy vấn (`SELECT`) gửi tới MySQL Server, hệ thống sẽ kiểm tra Query Cache trước; nếu câu lệnh này đã từng được thực thi trước đó, kết quả sẽ được trả về ngay lập tức cho client.**

![](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

## Quản trị và cấu hình MySQL Query Cache

Bạn có thể kiểm tra các thông tin liên quan đến Query Cache bằng lệnh `SHOW VARIABLES LIKE '%query_cache%';`.

Trước phiên bản MySQL 8.0, thông tin hiển thị thường có dạng như sau:

```bash
mysql> show variables like '%query_cache%';
+------------------------------+---------+
| Variable_name                | Value   |
+------------------------------+---------+
| have_query_cache             | YES     |
| query_cache_limit            | 1048576 |
| query_cache_min_res_unit     | 4096    |
| query_cache_size             | 599040  |
| query_cache_type             | ON      |
| query_cache_wlock_invalidate | OFF     |
+------------------------------+---------+
6 rows in set (0.02 sec)
```

Từ phiên bản MySQL 8.0 trở đi, kết quả trả về sẽ như sau:

```bash
mysql> show variables like '%query_cache%';
+------------------+-------+
| Variable_name    | Value |
+------------------+-------+
| have_query_cache | NO    |
+------------------+-------+
1 row in set (0.01 sec)
```

Dưới đây là giải thích chi tiết về các tham số xuất hiện trước phiên bản MySQL 8.0:

- **`have_query_cache`**: Cho biết MySQL Server có hỗ trợ Query Cache hay không. Giá trị `YES` nghĩa là có hỗ trợ, `NO` nghĩa là không hỗ trợ.
- **`query_cache_limit`**: Kích thước kết quả tối đa (tính theo byte) của một câu truy vấn được phép lưu vào cache. Nếu kết quả truy vấn vượt quá giá trị này, nó sẽ không được lưu vào cache.
- **`query_cache_min_res_unit`**: Kích thước khối bộ nhớ tối thiểu (byte) được cấp phát trong Query Cache. Khi câu truy vấn đang thực thi, MySQL lưu dần kết quả vào cache. Nếu kết quả tương đối lớn và vượt quá kích thước `query_cache_min_res_unit`, MySQL sẽ vừa nạp kết quả vừa xin cấp phát thêm bộ nhớ động. Nói cách khác, trong một lần truy vấn, MySQL có thể phải thực hiện thao tác cấp phát bộ nhớ nhiều lần. Tinh chỉnh hợp lý `query_cache_min_res_unit` giúp giảm thiểu hiện tượng phân mảnh bộ nhớ.
- **`query_cache_size`**: Tổng dung lượng bộ nhớ cấp phát cho Query Cache, tính theo byte và bắt buộc phải là bội số của 1024. Tài liệu chính thức của MySQL 5.7 ghi nhận giá trị mặc định là `1048576` (1 MB); thiết lập bằng 0 sẽ vô hiệu hóa Query Cache. Các bản cập nhật nhỏ có thể có giá trị mặc định khác nhau, vì vậy nên chỉ định rõ ràng trong file cấu hình thay vì dựa vào thiết lập mặc định.
- **`query_cache_type`**: Thiết lập chế độ hoạt động của Query Cache, mặc định là `ON`. Cấu hình ở mức `GLOBAL` sẽ áp dụng cho tất cả các kết nối client sau đó. Client cũng có thể thay đổi giá trị ở cấp `SESSION` để điều khiển riêng hành vi cache của mình.
- **`query_cache_wlock_invalidate`**: Kiểm soát việc có trả về dữ liệu trong cache hay không khi bảng đang bị khóa ghi (write lock). Mặc định ở trạng thái tắt (`OFF`), môi trường production thông thường nên duy trì cấu hình mặc định này.

Các giá trị khả dụng của `query_cache_type` (lưu ý: `query_cache_type` trong MySQL 5.6/5.7 là biến động, **nhưng có điều kiện tiên quyết**: nếu khi khởi động instance có giá trị `query_cache_type=0`, server sẽ bỏ qua việc cấp phát khóa mutex của Query Cache; lúc này việc sửa động qua `SET GLOBAL` sẽ báo lỗi, bắt buộc phải sửa file cấu hình và khởi động lại dịch vụ. Nếu lúc khởi động có giá trị khác 0, bạn hoàn toàn có thể chạy `SET GLOBAL query_cache_type=N` trực tuyến mà không cần restart):

- `0` hoặc `OFF`: Tắt hoàn toàn tính năng Query Cache.
- `1` hoặc `ON`: Bật tính năng Query Cache, nhưng không lưu các câu truy vấn bắt đầu bằng `SELECT SQL_NO_CACHE`.
- `2` hoặc `DEMAND`: Bật tính năng Query Cache, nhưng chỉ lưu các câu truy vấn có chỉ định rõ `SELECT SQL_CACHE`.

**Khuyến nghị thực tế**:

- Không nên thiết lập `query_cache_size` quá lớn. Dung lượng quá lớn không chỉ chiếm dụng bộ nhớ của các thành phần quan trọng khác (như InnoDB Buffer Pool) mà còn làm tăng đáng kể chi phí tìm kiếm và xóa cache. Khuyến nghị thiết lập giá trị ban đầu từ 10 MB đến 100 MB tùy theo cấu hình máy chủ, sau đó quan sát thực tế để tinh chỉnh.
- Khuyến nghị vô hiệu hóa Query Cache bằng cách đặt `query_cache_size = 0` thay vì chỉ phụ thuộc vào `query_cache_type`. Mặc dù cả hai đều là biến cấu hình, nhưng `query_cache_size = 0` giúp hệ thống bỏ qua hoàn toàn việc cấp phát bộ nhớ và các luồng kiểm tra cache, đảm bảo tắt triệt để hơn.

Trước phiên bản 8.0, thêm cấu hình sau vào file `my.cnf` rồi restart MySQL để bật Query Cache:

```properties
query_cache_type=1
query_cache_size=614400
```

Hoặc nếu instance khởi động với `query_cache_type` khác 0, bạn có thể bật trực tiếp qua lệnh sau:

```sql
set global query_cache_type=1;
set global query_cache_size=614400;
```

Để dọn dẹp hoặc xóa cache thủ công, có thể dùng 3 câu lệnh SQL sau:

- `FLUSH QUERY CACHE;`: Dọn dẹp các mảnh vụn bộ nhớ (defragment) trong Query Cache mà không xóa dữ liệu cache.
- `RESET QUERY CACHE;`: Xóa bỏ toàn bộ các kết quả truy vấn đang lưu trong Query Cache.
- `FLUSH TABLES;`: Đóng tất cả các bảng đang mở, đồng thời thao tác này sẽ xóa sạch nội dung trong Query Cache.

## Cơ chế Cache của MySQL

### Quy tắc lưu Cache

- Query Cache lưu trữ câu lệnh truy vấn và tập kết quả vào bộ nhớ (thường dưới dạng key-value, trong đó Key là giá trị Hash tính toán từ văn bản câu truy vấn, Database hiện tại, bảng mã ký tự client, phiên bản giao thức...; Value là tập kết quả truy vấn). Lần truy vấn sau nếu khớp sẽ lấy trực tiếp từ RAM.
- Kết quả cache được chia sẻ chung giữa các session của các client khác nhau, nghĩa là kết quả do một client kích hoạt có thể được client khác sử dụng lại.
- Câu SQL bắt buộc phải trùng khớp hoàn toàn tuyệt đối thì mới kích hoạt cache hit (chữ hoa/chữ thường, khoảng trắng, database được chọn, phiên bản giao thức, bảng mã ký tự đều phải đồng nhất). Khi kiểm tra Query Cache, MySQL Server không thực hiện chuẩn hóa câu lệnh mà đối chiếu chính xác nguyên văn chuỗi gửi lên từ client.
- Không lưu riêng rẽ kết quả của các subquery bên trong, chỉ lưu tập kết quả cuối cùng của toàn bộ câu truy vấn.
- Các hàm bất định (non-deterministic functions) sẽ không bao giờ được cache, ví dụ như `NOW()`, `CURDATE()`, `LAST_INSERT_ID()`, `RAND()`...
- Các truy vấn phát sinh cảnh báo (Warnings) sẽ không được lưu vào cache.
- Tập kết quả vượt quá ngưỡng `query_cache_limit` (mặc định 1 MB) sẽ không được cache.
- Nếu câu truy vấn có chứa bất kỳ User-Defined Function (UDF), hàm lưu trữ (stored function), biến người dùng (user variable), bảng tạm (temporary table) hoặc bảng hệ thống trong database `mysql`, kết quả cũng không được lưu vào cache.
- Sau khi cache được thiết lập, hệ thống Query Cache của MySQL sẽ theo dõi từng bảng xuất hiện trong câu truy vấn. Nếu các bảng này có bất kỳ thay đổi nào (về dữ liệu hoặc cấu trúc), toàn bộ dữ liệu cache liên quan đến bảng đó sẽ lập tức bị hủy bỏ (invalidate).
- MySQL Cache hầu như vô dụng trong môi trường phân tán chia tách cơ sở dữ liệu (sharding). Lý do là: các câu truy vấn thường đi qua middleware (như ShardingSphere, MyCat) định tuyến tới các instance MySQL độc lập, mỗi instance quản lý một Query Cache riêng; hơn nữa middleware khi định tuyến thường viết lại câu SQL (bổ sung điều kiện sharding key...), khiến chuỗi SQL đã biến đổi không khớp với câu gốc, dẫn đến trượt cache hoàn toàn.
- Không cache các câu truy vấn có sử dụng tùy chọn `SQL_NO_CACHE`.
- ...

Ví dụ về các tùy chọn `SELECT` trong Query Cache:

```sql
SELECT SQL_CACHE id, name FROM customer;# Sẽ lưu vào cache
SELECT SQL_NO_CACHE id, name FROM customer;# Sẽ không lưu vào cache
```

### Quản lý bộ nhớ trong cơ chế Cache

Query Cache được lưu trữ hoàn toàn trên RAM, do đó trước khi cấu hình và sử dụng, chúng ta cần hiểu rõ cách thức nó quản lý bộ nhớ.

MySQL Query Cache sử dụng kỹ thuật Memory Pool (bể bộ nhớ) tự quản lý việc cấp phát và giải phóng thay vì gọi liên tục tới hệ điều hành. Đơn vị cơ bản của memory pool là các khối (block) có kích thước biến động, dùng để lưu trữ thông tin về loại, kích thước và dữ liệu kết quả. Tập kết quả của một câu truy vấn được kết nối với nhau thông qua một danh sách liên kết (linked list) gồm các block này. Chiều dài tối thiểu của một block là `query_cache_min_res_unit`.

Khi máy chủ khởi động, hệ thống sẽ khởi tạo vùng nhớ dành cho cache thành một khối bộ nhớ trống liên tục duy nhất. Khi câu truy vấn bắt đầu trả về kết quả, do lúc này chưa thể biết trước dung lượng của toàn bộ tập kết quả là bao nhiêu, MySQL sẽ xin cấp phát một khối dữ liệu cơ bản có kích thước bằng `query_cache_min_res_unit`. Nếu tập kết quả vượt quá sức chứa của khối này, MySQL sẽ tiếp tục xin cấp phát thêm các khối mới theo nhu cầu trong quá trình sinh dữ liệu và nối chúng lại qua danh sách liên kết.

Việc cấp phát khối bộ nhớ đòi hỏi phải khóa vùng nhớ trống lại nên thao tác diễn ra khá chậm; MySQL sẽ cố gắng tối ưu thao tác này bằng cách chọn các khối bộ nhớ nhỏ nhất có thể, nếu không đủ sẽ xin cấp phát tiếp, và khi lưu xong nếu còn dư thừa sẽ giải phóng phần không dùng đến.

Cùng với quá trình đọc ghi đồng thời diễn ra liên tục, các khối cache với kích thước khác nhau bị giải phóng một cách ngẫu nhiên và rời rạc, cộng thêm phần không gian nhỏ còn sót lại (nhỏ hơn `query_cache_min_res_unit`) không thể tái sử dụng, khiến memory pool nhanh chóng xuất hiện lượng lớn các khối bộ nhớ trống không liên tục (tương tự hiện tượng phân mảnh ngoại vi - external fragmentation trong hệ điều hành), từ đó kích hoạt các đợt dọn dẹp và sắp xếp lại bộ nhớ gây hao tổn tài nguyên hệ thống.

## Ưu và nhược điểm của MySQL Query Cache

**Ưu điểm:**

- Thao tác kiểm tra Query Cache diễn ra rất sớm: ngay sau khi MySQL nhận yêu cầu từ client và xác thực quyền truy cập, trước cả khi tiến hành phân tích cú pháp SQL. Nói cách khác, khi MySQL nhận được câu truy vấn từ client, chỉ cần kiểm tra đủ quyền hạn là hệ thống sẽ lập tức tra cứu trong Query Cache, hoàn toàn không cần module Optimizer phân tích sinh execution plan, và càng không phát sinh bất kỳ tương tác I/O nào với Storage Engine.
- Do Query Cache hoạt động hoàn toàn trên bộ nhớ RAM, việc trả trực tiếp kết quả từ bộ nhớ giúp tiết kiệm lượng lớn I/O đĩa và chu kỳ tính toán của CPU. **Tuy nhiên, ưu thế này chỉ phát huy hiệu quả trong môi trường có độ đồng thời thấp, hệ thống chủ yếu là đọc và dữ liệu tĩnh ít thay đổi**. Trong môi trường đa nhân chịu tải đồng thời cao, việc tranh chấp gay gắt khóa mutex toàn cục `LOCK_query_cache` sẽ khiến hàng loạt luồng rơi vào trạng thái chờ khóa (có thể thấy trạng thái `Waiting for query cache lock` qua lệnh `SHOW PROCESSLIST`), khiến chỉ số TPS/QPS thực tế tụt dốc thảm hại.

**Nhược điểm:**

- MySQL phải tính toán giá trị Hash cho từng câu truy vấn `SELECT` tiếp nhận và tra cứu sự tồn tại của kết quả trong cache. Mặc dù chi phí CPU cho việc tính hash và tìm kiếm là không đáng kể, nhưng Query Cache ở tầng dưới lại phụ thuộc vào duy nhất một khóa mutex toàn cục (`LOCK_query_cache`) để đảm bảo an toàn đồng thời. Một khi đối mặt với tải cao, hàng ngàn hàng vạn câu truy vấn cùng tranh giành mutex này để kiểm tra hoặc ghi cache, chi phí xung đột khóa và chuyển đổi ngữ cảnh luồng (context switch) sẽ trở thành điểm nghẽn hiệu năng chết người.
- Vấn đề mất hiệu lực (invalidation) của cache. Nếu bảng dữ liệu thay đổi thường xuyên, tỷ lệ hủy cache sẽ cực kỳ cao. Thay đổi ở đây không chỉ là thay đổi dữ liệu bên trong bảng (`INSERT`, `UPDATE`, `DELETE`), mà còn bao gồm bất kỳ biến động nào về cấu trúc bảng hoặc index.
- Các câu truy vấn có câu chữ khác nhau nhưng trả về cùng một kết quả đều bị lưu thành các mục cache riêng biệt, gây lãng phí tài nguyên RAM nghiêm trọng. Chỉ cần khác biệt về chữ hoa/chữ thường, khoảng trắng hay chú thích (comment), Query Cache đều coi đó là các truy vấn khác nhau (vì giá trị Hash khác nhau).
- Việc thiết lập các biến hệ thống không hợp lý sẽ gây ra hiện tượng phân mảnh bộ nhớ nghiêm trọng, dẫn đến việc Query Cache phải thường xuyên dọn dẹp và thu hồi bộ nhớ.

## Tác động của MySQL Query Cache đến hiệu năng

Việc kích hoạt Query Cache trên MySQL Server sẽ mang lại chi phí hao tổn phụ trợ cho cả thao tác đọc lẫn thao tác ghi:

- **Thao tác đọc phải giữ khóa để kiểm tra**: Trước khi bắt đầu truy vấn đọc, hệ thống bắt buộc phải kiểm tra xem có trúng cache hay không, điều này đòi hỏi phải chiếm giữ khóa chia sẻ `LOCK_query_cache`. Dưới áp lực đồng thời cao, lượng lớn yêu cầu đọc cùng tranh chấp khóa sẽ gây ra hiện tượng xếp hàng chờ đợi.
- **Chi phí ghi vào Cache**: Nếu câu truy vấn đọc thỏa mãn điều kiện cache, sau khi thực thi xong phải ghi kết quả vào cache, bao gồm thao tác cấp phát bộ nhớ và nối danh sách liên kết, bước này cũng đòi hỏi phải giữ khóa.
- **Thao tác ghi kích hoạt hủy Cache diện rộng**: Khi có dữ liệu ghi vào bảng, hệ thống bắt buộc phải làm mất hiệu lực toàn bộ cache liên quan đến bảng đó. Thao tác này đòi hỏi phải giữ khóa độc quyền (exclusive lock) để quét qua toàn bộ vùng cache; giá trị `query_cache_size` càng lớn thì thời gian giữ khóa càng kéo dài. Thiết kế khóa mutex toàn cục duy nhất của Query Cache khiến các thao tác ghi sẽ chặn đứng tất cả các yêu cầu đọc và ghi khác liên quan tới cache, đây chính là nguyên nhân hàng đầu khiến MySQL 8.0 quyết định khai tử tính năng này.
- **Long Transaction trong InnoDB làm trầm trọng thêm vấn đề**: Dưới cơ chế MVCC, trước khi transaction được commit, các cache liên quan không thể sử dụng an toàn. Các giao dịch kéo dài (long transactions) không chỉ làm giảm tỷ lệ trúng cache, mà khóa độc quyền sinh ra từ thao tác ghi còn chặn đứng cả việc đọc cache của **các bảng hoàn toàn không liên quan khác**.

Bạn có thể theo dõi tình trạng hoạt động thực tế của Query Cache qua lệnh sau để đánh giá xem có đáng để bật tính năng này hay không:

```sql
SHOW STATUS LIKE 'Qcache%';
```

Ý nghĩa các chỉ số trạng thái quan trọng:

| Tên biến trạng thái | Ý nghĩa |
| :--- | :--- |
| `Qcache_hits` | Số lần trúng cache (cache hit) |
| `Qcache_inserts` | Số lần câu truy vấn được ghi vào cache |
| `Qcache_not_cached` | Số lần truy vấn không được lưu cache (không đủ điều kiện hoặc trượt cache) |
| `Qcache_lowmem_prunes` | Số lượng mục cache bị loại bỏ do thiếu bộ nhớ; nếu chỉ số này tăng liên tục chứng tỏ bộ nhớ không đủ hoặc phân mảnh nghiêm trọng |
| `Qcache_free_memory` | Dung lượng bộ nhớ trống còn lại trong cache (byte) |

Công thức tính tỷ lệ trúng cache tham khảo:

```
Tỷ lệ trúng cache = Qcache_hits / (Qcache_hits + Qcache_inserts + Qcache_not_cached)
```

Nếu tỷ lệ trúng cache thường xuyên thấp hơn 50%, điều đó chứng tỏ khối lượng công việc hiện tại hoàn toàn không phù hợp với Query Cache, khuyến nghị nên tắt bỏ. Ngoài ra, cần đặc biệt lưu ý tỷ lệ giữa `Qcache_lowmem_prunes` và `Qcache_inserts`: nếu tỷ lệ này quá cao, đồng nghĩa với việc dữ liệu vừa ghi vào cache đã nhanh chóng bị đẩy ra ngoài do thiếu bộ nhớ hoặc do phân mảnh, lúc này việc bật cache chỉ mang lại hiệu ứng tiêu cực thuần túy. Khi `Qcache_lowmem_prunes` tăng đều đặn, bạn có thể chạy lệnh `FLUSH QUERY CACHE` để dọn dẹp các mảnh vụn bộ nhớ, hoặc cân nhắc giảm giá trị `query_cache_min_res_unit`.

## Tổng kết

Mặc dù Query Cache trong MySQL về mặt lý thuyết có thể cải thiện tốc độ truy vấn, nhưng bản thân cơ chế quản trị cache lại phát sinh chi phí vận hành rất lớn: mỗi lần truy vấn đều phải kiểm tra và ghi cache, mỗi lần dữ liệu biến động lại phải hủy và dọn dẹp cache.

Query Cache là một cơ chế chỉ phù hợp với phạm vi ngữ cảnh rất hẹp. Nếu ứng dụng của bạn rất ít khi cập nhật dữ liệu vào database, Query Cache mới phát huy tác dụng rõ rệt. Trường hợp điển hình nhất là hệ thống blog cá nhân, nơi bài viết được cập nhật thưa thớt, dữ liệu các bảng tương đối ổn định theo thời gian.

Tóm tắt ngắn gọn các trường hợp thích hợp với Query Cache:

- Dữ liệu trong bảng ít thay đổi, mang tính chất tĩnh.
- Tần suất lặp lại của các câu truy vấn (`SELECT`) rất cao.
- Tập kết quả trả về nhỏ hơn 1 MB.

Đối với một hệ thống có dữ liệu cập nhật liên tục, vai trò của Query Cache là cực kỳ mờ nhạt, thậm chí trong nhiều trường hợp việc bật Query Cache còn làm giảm hiệu năng chung của toàn hệ thống.

Tóm tắt các trường hợp KHÔNG nên sử dụng Query Cache:

- Dữ liệu trong bảng, cấu trúc bảng hoặc index thay đổi thường xuyên.
- Rất ít các câu truy vấn bị lặp lại nguyên văn.
- Tập kết quả truy vấn trả về có kích thước lớn.

Cuốn sách *High Performance MySQL* đã từng đúc kết:

> Theo kinh nghiệm của chúng tôi, trong môi trường chịu áp lực xử lý đồng thời cao, Query Cache sẽ khiến hiệu năng hệ thống sụt giảm, thậm chí rơi vào tình trạng đơ cứng (freeze). Nếu bạn nhất định phải sử dụng Query Cache, đừng cấp phát dung lượng bộ nhớ quá lớn, và chỉ nên sử dụng khi thấy rõ lợi ích thực tế (tần suất sửa đổi nội dung database rất thấp).

**Thực tế hoàn toàn đúng như vậy! Trong các dự án phần mềm hiện đại, giải pháp tối ưu và linh hoạt hơn nhiều là sử dụng Local Cache ở tầng ứng dụng (như Caffeine) hoặc Distributed Cache (như Redis), mang lại hiệu năng cao hơn, ổn định hơn và tính ứng dụng rộng rãi hơn rất nhiều.**

## Tài liệu tham khảo

- *High Performance MySQL*
- Cơ chế Cache của MySQL: <https://zhuanlan.zhihu.com/p/55947158>
- Thiết lập và sử dụng Query Cache trong RDS MySQL - Tài liệu Alibaba Cloud RDS: <https://help.aliyun.com/document_detail/41717.html>
- 8.10.3 The MySQL Query Cache - Tài liệu chính thức của MySQL: <https://dev.mysql.com/doc/refman/5.7/en/query-cache.html>
