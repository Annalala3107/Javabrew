---
title: Chi tiết đồng bộ dữ liệu MySQL sang Elasticsearch: Các giải pháp phổ biến và xử lý tính nhất quán
description: Hướng dẫn chi tiết các giải pháp đồng bộ dữ liệu từ MySQL sang Elasticsearch, so sánh ghi kép ở tầng ứng dụng (dual write), đồng bộ định kỳ, Canal, Debezium và Flink CDC, đồng thời giới thiệu đồng bộ toàn phần (full sync), đồng bộ gia tăng (incremental sync), thông điệp sai thứ tự, tính lũy đẳng (idempotency), xóa dữ liệu, tái tạo Index và đối soát dữ liệu.
category: Cơ sở dữ liệu
tag:
  - MySQL
  - Elasticsearch
  - Đồng bộ dữ liệu
head:
  - - meta
    - name: keywords
      content: Đồng bộ MySQL sang Elasticsearch,Đồng bộ MySQL ES,Canal đồng bộ ES,Flink CDC đồng bộ ES,Debezium,CDC,binlog,Đồng bộ toàn phần,Đồng bộ gia tăng,Tính nhất quán dữ liệu
lang: vi
sourceRef: zh-ref/database/mysql/mysql-to-elasticsearch-sync.md
---

MySQL mạnh về xử lý giao dịch (Transaction), còn Elasticsearch mạnh về tìm kiếm toàn văn (Full-Text Search) và truy vấn phức tạp. Nhiều hệ thống chọn MySQL làm nguồn dữ liệu chuẩn (authoritative data source), sau đó trích xuất và tổ chức các trường cần tìm kiếm thành tài liệu (Document) để ghi vào Elasticsearch.

Khi làm như vậy, các vấn đề hóc búa thường tập trung vào những khâu sau:

- Lần đầu triển khai (go-live), làm thế nào để nạp toàn bộ dữ liệu tồn đọng từ MySQL?
- Khi MySQL phát sinh thêm mới, cập nhật và xóa dữ liệu về sau, làm sao cập nhật liên tục sang ES?
- Khi tác vụ đồng bộ tiêu thụ trùng lặp, nhận thông điệp sai thứ tự hoặc bị gián đoạn, làm sao tránh dữ liệu cũ ghi đè dữ liệu mới?
- Khi cấu trúc Index thay đổi hoặc dữ liệu không nhất quán, làm sao tái tạo (rebuild) và chuyển đổi mượt mà?

Một giải pháp đồng bộ khả dụng thường phải đồng thời xử lý **đồng bộ toàn phần (Full Sync), đồng bộ gia tăng (Incremental Sync), khôi phục lỗi và kiểm tra dữ liệu**. Chỉ giải quyết một khâu rất dễ khiến hệ thống bị kẹt khi đưa lên production hoặc khi khắc phục sự cố.

## Xác định rõ mục tiêu đồng bộ trước

Việc đồng bộ từ MySQL sang Elasticsearch thường được chia làm hai loại:

- **Đồng bộ toàn phần (Full Sync)**: Đọc toàn bộ dữ liệu hiện có trong MySQL để xây dựng một Index hoàn chỉnh trên ES. Thường dùng khi mới ra mắt hệ thống, tái tạo Index hoặc sửa lỗi dữ liệu.
- **Đồng bộ gia tăng (Incremental Sync)**: Liên tục thu thập các thao tác `INSERT`, `UPDATE`, `DELETE` đã commit trong MySQL để cập nhật các Document tương ứng trên ES.

Hai cách này thường được kết hợp với nhau. Ví dụ: ban đầu nạp toàn phần 10 triệu bản ghi lịch sử, sau đó tiếp tục tiêu thụ phần thay đổi gia tăng từ vị trí binlog (binlog position) đã ghi nhận tại thời điểm bắt đầu tác vụ toàn phần cho đến khi đuổi kịp dữ liệu mới nhất.

Cũng cần lưu ý rằng việc ghi vào ES thành công không đồng nghĩa dữ liệu có thể tìm kiếm được ngay lập tức. Elasticsearch thông qua cơ chế `refresh` mới giúp các Document vừa ghi trở nên khả kiến với truy vấn tìm kiếm, do đó độ trễ đầu-cuối (end-to-end) ít nhất bao gồm các khâu: thu thập thay đổi, xếp hàng thông điệp, xử lý dữ liệu, ghi vào ES và `refresh`. Tài liệu chính thức gọi khả năng hiển thị tìm kiếm này là [Tìm kiếm gần thời gian thực (Near Real-Time Search)](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search).

![Kết nối giữa đồng bộ toàn phần và đồng bộ gia tăng từ MySQL sang ES](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/mysql-es-full-incremental-sync-e5d667d7.webp)

## Định nghĩa hợp đồng đồng bộ (Sync Contract) trước khi chọn giải pháp

Cùng một công cụ đồng bộ, nhưng khi đặt vào các mô hình dữ liệu và yêu cầu nhất quán khác nhau, kết quả có thể khác biệt hoàn toàn. Trước khi chọn giải pháp, hãy làm rõ các quy ước sau:

- **Nguồn dữ liệu chuẩn (Authoritative Data Source)**: Thường lấy MySQL làm chuẩn, ES chỉ lưu góc nhìn phục vụ tìm kiếm có thể tái tạo được. Nghiệp vụ không được phép bỏ qua MySQL để sửa trực tiếp các trường chuẩn trên ES.
- **Quy tắc sinh Document**: Xác định rõ những bảng và cột nào cấu thành một Document trên ES, `_id` của Document lấy từ đâu, và thay đổi ở nhiều bảng sẽ phải dựng lại những Document nào.
- **Ngữ nghĩa xóa dữ liệu**: Xác định xóa vật lý (physical delete), xóa logic (soft delete) và hết hiệu lực nghiệp vụ tương ứng với lệnh `delete` trên ES, giữ lại cờ đánh dấu xóa hay dựng lại Document.
- **Thứ tự và phiên bản (Version)**: Xác định khóa phân vùng (partition key) và nguồn cấp số phiên bản cho cùng một Document để tránh việc thử lại (retry), xử lý đồng thời hoặc nhiều luồng đồng bộ khiến giá trị cũ ghi đè giá trị mới.
- **Mục tiêu độ trễ và khôi phục**: Thống nhất mức độ trễ cho phép trong điều kiện bình thường, thời gian cần đuổi kịp sau khi đường truyền gián đoạn, và phương án khởi tạo lại khi thời gian gián đoạn vượt quá thời gian lưu giữ binlog hoặc MQ.
- **Kiểu dữ liệu trường và giá trị rỗng**: Làm rõ cách ghi số tiền, số nguyên không dấu, ngày giờ, enum và chuỗi rỗng sang ES; phân biệt rạch ròi giữa thiếu trường, `null` và chuỗi/giá trị rỗng.
- **Ngân sách tài nguyên DB nguồn**: Đánh giá số lượng kết nối, mức độ đồng thời và I/O đĩa khi quét toàn phần; xác định đọc từ Primary hay Read-Only Replica; thiết lập giới hạn tốc độ và điều kiện tạm dừng cho tác vụ đồng bộ.
- **Quy trình thay đổi Schema**: Khi thêm trường, đổi kiểu dữ liệu hoặc điều chỉnh bộ phân tách từ (analyzer), ai là người cập nhật `mapping`, và thứ tự phát hành giữa ứng dụng, tác vụ đồng bộ và Index Template ra sao.

Việc nghiệm thu cũng không thể chỉ dừng ở kiểm tra "tổng số bản ghi toàn phần bằng nhau". Tối thiểu phải kiểm thử đủ: thêm mới, cập nhật, xóa vật lý, xóa logic, thông điệp trùng lặp và thông điệp sai thứ tự; đồng thời chủ động tạm dừng ES hoặc tác vụ đồng bộ để quan sát khả năng đuổi kịp sau khi khôi phục. Quy trình nạp lại toàn phần sang Index mới, đuổi kịp phần gia tăng, đối soát dữ liệu, chuyển đổi Alias và rollback cũng cần chạy thử trọn vẹn. Mỗi hạng mục trong hợp đồng đồng bộ đều nên ánh xạ tới một ca kiểm thử hoặc một chỉ số giám sát (metric).

## So sánh các giải pháp phổ biến

| Giải pháp | Đồng bộ toàn phần | Đồng bộ gia tăng | Ưu điểm chính | Nhược điểm chính | Kịch bản phù hợp |
| --- | --- | --- | --- | --- | --- |
| Ghi kép tầng ứng dụng (Dual Write) | Không hỗ trợ | Hỗ trợ | Triển khai trực quan, đường đi ngắn | Không thể commit nguyên tử, xâm lấn code nghiệp vụ, dễ sai thứ tự | Dữ liệu nhỏ, nghiệp vụ đơn giản chấp nhận bất nhất quán ngắn hạn |
| Outbox Table + MQ | Không hỗ trợ | Hỗ trợ | Cập nhật nghiệp vụ và lưu sự kiện nằm chung một Transaction | Vẫn cần bổ sung thành phần nạp toàn phần, đẩy tin và consumer | Ứng dụng đã áp dụng kiến trúc hướng sự kiện (Event-Driven) |
| Đồng bộ định kỳ (Scheduled Sync) | Hỗ trợ | Hỗ trợ quét theo điều kiện | Đơn giản, chi phí vận hành thấp | Độ trễ cao, cần xử lý riêng thao tác xóa và cửa sổ quét | Dữ liệu ít, tần suất cập nhật thấp |
| Canal + Consumer | Xử lý riêng | Hỗ trợ | Hệ sinh thái trưởng thành, dễ tích hợp MQ và consumer tùy biến | Cần tự quản lý binlog position, consumer và khớp nối toàn phần | Đồng bộ gia tăng khi đã có sẵn hạ tầng Java/MQ |
| Debezium + Kafka | Hỗ trợ Snapshot | Hỗ trợ | Hệ sinh thái Kafka Connect hoàn chỉnh, định dạng sự kiện thống nhất | Nhiều thành phần, phụ thuộc Kafka Connect | Đã có Kafka Connect hoặc nền tảng CDC đa nguồn dữ liệu |
| Flink CDC | Hỗ trợ | Hỗ trợ | Tự động nối tiếp toàn phần và gia tăng, phù hợp biến đổi phức tạp | Chi phí triển khai và quản lý State cao hơn | Dữ liệu lớn, cần xử lý luồng (streaming) hoặc biến đổi đa bảng |

Chữ "Hỗ trợ" trong bảng chỉ thể hiện công cụ có cung cấp năng lực tương ứng, không đồng nghĩa cứ tích hợp vào là tự động đáp ứng yêu cầu nhất quán của nghiệp vụ. Kết quả cuối cùng còn phụ thuộc vào cách ghi ES, thứ tự thông điệp, Checkpoint, chiến lược retry và thiết kế Index.

## Ghi kép ở tầng ứng dụng (Dual Write)

Ghi kép ở tầng ứng dụng là cách sau khi code nghiệp vụ cập nhật MySQL xong thì gọi tiếp Elasticsearch API để cập nhật Index.

![Ghi kép đồng bộ ở tầng ứng dụng](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/es-mq-synchronization-synchronous-double-write-c84c2d56.png)

Giả sử thứ tự ghi là "MySQL trước, ES sau", các kết quả thường gặp như sau:

| Kịch bản | MySQL | Elasticsearch | Kết quả |
| --- | --- | --- | --- |
| Cả hai lần ghi đều thành công | Thành công | Thành công | Dữ liệu nhất quán |
| Ghi MySQL thất bại | Rollback | Không thực thi | Dữ liệu nhất quán |
| MySQL thành công rồi ứng dụng bị sập | Thành công | Chưa thực thi | Dữ liệu không nhất quán |
| MySQL thành công, ghi ES thất bại | Thành công | Thất bại | Dữ liệu không nhất quán |
| ES đã ghi nhưng phía client bị timeout | Thành công | Không rõ kết quả | Khi retry bắt buộc phải đảm bảo tính lũy đẳng |

Transaction của MySQL không thể rollback thao tác ghi đã commit vào Elasticsearch, và Elasticsearch cũng không thể gộp chung thành một Local Transaction thông thường với MySQL. Vì thế, ghi kép đồng bộ nhìn chung chỉ có thể hướng tới tính nhất quán cuối cùng (Eventual Consistency).

Ghi kép trực tiếp còn tồn tại hai vấn đề dễ bị bỏ sót.

Thứ nhất là hiệu năng và tính sẵn sàng. Request nghiệp vụ phải chờ thêm một lần gọi ES, nên chỉ cần ES chập chờn là luồng xử lý chính cũng bị ảnh hưởng theo. Nếu chuyển sang gửi bất đồng bộ qua Thread Pool, `CompletableFuture` hoặc MQ thông thường, độ trễ request sẽ giảm nhưng khoảng hở "MySQL đã commit, tin nhắn chưa kịp gửi thì tiến trình bị sập" vẫn còn đó.

Thứ hai là sai thứ tự do xử lý đồng thời. Giả sử cùng một bản ghi sản phẩm lần lượt được cập nhật lên `v2` rồi `v3`, hai request gửi sang ES có thể đến nơi theo thứ tự ngược lại, cuối cùng khiến `v2` cũ ghi đè `v3`. Chỉ chuyển thao tác ghi sang bất đồng bộ không tự động giải quyết được vấn đề thứ tự.

### Dùng Transactional Outbox để bù khoảng hở Transaction

Khi yêu cầu độ tin cậy đồng bộ cao hơn, có thể sử dụng mẫu **Transactional Outbox (Bảng thông điệp cục bộ)**:

1. Trong cùng một Transaction MySQL, vừa cập nhật bảng nghiệp vụ vừa chèn một bản ghi sự kiện vào bảng `outbox`.
2. Tiến trình đẩy tin độc lập hoặc thành phần CDC đọc bảng `outbox` và gửi sự kiện sang MQ.
3. Consumer của ES xử lý thông điệp; thành công thì ghi nhận kết quả tiêu thụ, thất bại thì retry hoặc đẩy vào Dead Letter Queue (DLQ).

Cách này đảm bảo "cập nhật dữ liệu nghiệp vụ" và "lưu sự kiện chờ gửi" cùng thành công hoặc cùng rollback. Debezium cũng cung cấp sẵn [Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html) để thu thập và chuyển đổi các sự kiện outbox.

Bảng thông điệp cục bộ giải quyết bài toán mất sự kiện, nhưng vẫn cần xử lý tiêu thụ trùng lặp, thứ tự thông điệp theo cùng khóa chính nghiệp vụ, khởi tạo dữ liệu toàn phần và đối soát dữ liệu.

## Đồng bộ định kỳ

Nếu khối lượng dữ liệu không lớn, tần suất cập nhật thấp và nghiệp vụ chấp nhận độ trễ theo phút hoặc thậm chí theo ngày, các tác vụ định kỳ (scheduled task) thường là đã đủ dùng. Blog cá nhân, kho tri thức nội bộ hoặc hệ thống tìm kiếm trang quản trị cỡ nhỏ là những kịch bản khá điển hình.

![Đồng bộ định kỳ](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/es-mq-synchronization-scheduled-task-6b8f007f.png)

Đồng bộ định kỳ không nhất thiết lần nào cũng phải quét toàn bảng, mà có thể truy vấn gia tăng theo thời gian cập nhật:

```sql
SELECT id, title, content, updated_at
FROM article
WHERE (
        updated_at > :last_updated_at
        OR (updated_at = :last_updated_at AND id > :last_id)
      )
  AND updated_at <= :task_cutoff
ORDER BY updated_at, id
LIMIT :batch_size;
```

Khi bắt đầu tác vụ, cố định mốc `task_cutoff`; sau khi xử lý xong mỗi lô (batch), lưu lại con trỏ kép gồm `last_updated_at` và `last_id`. Lô tiếp theo tiếp tục dùng chung mốc thời gian cắt đó cho đến khi xử lý hết dữ liệu của lượt này. Cách này vừa tránh được phân trang sâu (deep pagination), vừa không bị sót bản ghi khi nhiều dòng có cùng `updated_at`.

Thao tác xóa vật lý không để lại `updated_at`, nên đồng bộ gia tăng định kỳ thường phải kết hợp với cột xóa logic, bảng ghi nhật ký xóa hoặc đối soát toàn phần định kỳ. Nếu không, dữ liệu đã xóa trong MySQL có thể tồn tại lâu dài trên ES.

Khi dùng Spring Task, tác vụ chạy vào 0 giờ sáng thứ Hai hằng tuần có thể viết như sau:

```java
@Scheduled(cron = "0 0 0 ? * MON", zone = "Asia/Shanghai")
public void rebuildArticleIndex() {
    // Đọc MySQL theo từng trang, ghi hàng loạt (bulk) sang ES Index mới
}
```

### Dùng Index Alias khi tái tạo toàn phần

Không nên vừa xóa vừa ghi trực tiếp trên Index cũ mà người dùng đang truy vấn. Cách an toàn hơn là:

1. Tạo một Index mới có gắn phiên bản, ví dụ `articles_v2`, cấu hình sẵn `settings` và `mappings`.
2. Ghi toàn bộ dữ liệu MySQL vào Index mới và hoàn tất kiểm tra số lượng, lấy mẫu nội dung cũng như kết quả truy vấn.
3. Bổ sung các thay đổi gia tăng phát sinh trong lúc tác vụ toàn phần đang chạy.
4. Dùng `_aliases` API để chuyển đổi nguyên tử (atomic) biệt danh (alias) nghiệp vụ từ Index cũ sang Index mới.
5. Giữ lại Index cũ một thời gian, xác nhận không có sai sót rồi mới dọn dẹp.

```http
POST /_aliases
{
  "actions": [
    { "remove": { "index": "articles_v1", "alias": "articles", "must_exist": true } },
    { "add": { "index": "articles_v2", "alias": "articles" } }
  ]
}
```

[Aliases API](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html) của Elasticsearch có thể thực hiện nhiều thao tác thay đổi Alias trong cùng một phép toán nguyên tử. Tuy nhiên, việc chuyển Alias chỉ giải quyết chuyển đổi mượt mà cho lưu lượng đọc; nếu trong thời gian tái tạo vẫn có ghi nghiệp vụ, bắt buộc phải bù đắp đoạn thay đổi đó bằng cách phát lại binlog, ghi song song hai Index hoặc tạm dừng ghi.

## CDC dựa trên binlog

Giải pháp CDC (Change Data Capture) đọc MySQL binlog và chuyển các thay đổi dữ liệu đã commit thành sự kiện để hệ thống phía sau (downstream) tiêu thụ. Cách tiếp cận này không đòi hỏi duy trì logic ghi ES bên trong từng API nghiệp vụ và hiện là phương thức đồng bộ gia tăng phổ biến hơn cả.

Trước khi tích hợp, cần rà soát các cấu hình sau:

- MySQL đã bật binlog và tài khoản CDC được cấp các quyền sao chép (replication) cùng quyền đọc bảng cần thiết.
- Dùng định dạng binlog mà công cụ hỗ trợ. Các công cụ thu thập thay đổi mức dòng như Canal, Debezium, Flink CDC thường yêu cầu `binlog_format=ROW`; riêng Debezium yêu cầu rõ ràng thêm `binlog_row_image=FULL`, và các công cụ khác cũng cần đối chiếu lại cấu hình này theo phiên bản đang sử dụng. MySQL 8.4 mặc định `binlog_format` là `ROW`, nhưng với môi trường cũ hoặc cloud database vẫn phải kiểm tra theo cấu hình thực tế.
- Thời gian lưu giữ binlog phải bao phủ được cửa sổ khôi phục sự cố dài nhất. Nếu tác vụ dừng quá lâu khiến binlog cần thiết đã bị dọn, thường chỉ có thể chụp lại snapshot hoặc đồng bộ toàn phần từ đầu.
- Mỗi client CDC phải sử dụng một `server_id` duy nhất; khi chuyển đổi dự phòng (HA failover), cần kiểm tra thêm GTID, khôi phục vị trí (position) và cấu hình binlog của bản sao (replica) đang kết nối.
- Tài khoản CDC chỉ được cấp quyền replication, đọc metadata và đọc các bảng mục tiêu đúng theo tài liệu công cụ yêu cầu; tài khoản ES giới hạn phạm vi ghi vào đúng Index hoặc Alias mục tiêu; không lưu trực tiếp thông tin xác thực trong file cấu hình đưa lên kho mã nguồn.

### Canal

[Canal](https://github.com/alibaba/canal) mô phỏng giao thức tương tác của MySQL Replica để yêu cầu binlog từ MySQL và phân tích thành các sự kiện thay đổi có cấu trúc.

![Nguyên lý hoạt động của Canal](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/canal-overview-80f4ee19.png)

Trách nhiệm cốt lõi của Canal Server là đăng ký theo dõi và phân tích log gia tăng. Phía downstream có thể dùng Canal Client để tiêu thụ trực tiếp, hoặc để Canal đẩy thông điệp sang Kafka, RocketMQ hay các MQ khác rồi dịch vụ đồng bộ mới cập nhật lên ES.

![Canal đồng bộ dữ liệu qua MQ](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/es-mq-synchronization-canal-with-mq-fae56985.png)

Đưa MQ vào giữa mang lại một số lợi ích chính:

- Tách rời Canal với ES consumer; khi ES tạm thời gián đoạn, các thay đổi có thể tạm tồn trong MQ.
- Có thể định tuyến các bản ghi cùng khóa chính nghiệp vụ vào cùng một phân vùng (partition) để dễ duy trì thứ tự cục bộ.
- Consumer có thể gom thông điệp để gọi ES Bulk API, giảm chi phí gửi request.
- Khi lưu giữ thông điệp trong một khoảng thời gian nhất định, có thể phát lại dữ liệu lỗi hoặc dựng lại hệ thống phía sau.

MQ không tự động mang lại tính nhất quán. Consumer vẫn phải xác định rõ khi nào commit offset, thất bại thì retry thế nào, retry có đảm bảo tính lũy đẳng (idempotent) không và ai xử lý dữ liệu trong dead-letter queue.

Canal Server chủ yếu đảm nhiệm đăng ký thay đổi gia tăng. Dữ liệu toàn phần ban đầu có thể nạp bằng tác vụ phân trang tự phát triển hoặc công cụ đồng bộ hàng loạt đã được kiểm chứng độ tương thích. Mặc dù [DataX bản mã nguồn mở](https://github.com/alibaba/DataX/tree/master/elasticsearchwriter) có cung cấp `ElasticsearchWriter`, nhưng README chính thức vẫn ghi chú chỉ mới kiểm thử trên Elasticsearch 5.x; trước khi kết nối vào ES 7/8 bắt buộc phải kiểm tra lại mapping type, giao thức client và tham số ghi. Canal Client Adapter cũng từng cung cấp năng lực ETL cho một số hệ thống đích, việc có phù hợp với phiên bản ES hiện tại và các mapping phức tạp hay không cũng cần kiểm chứng theo phiên bản thực tế. Khi phần toàn phần và phần gia tăng do hai tác vụ riêng thực hiện, điểm mấu chốt nhất là ghi nhận và nối đúng vị trí binlog.

### Flink CDC

MySQL Source của Flink CDC có thể đọc snapshot của bảng trước rồi nối tiếp tiêu thụ binlog. Nó chia bảng thành nhiều Chunk theo khóa phân mảnh (shard key) để đọc snapshot song song; trước và sau khi đọc mỗi Chunk sẽ ghi lại vị trí binlog `LOW` và `HIGH`, rồi hợp nhất các thay đổi phát sinh trong khoảng thời gian đó để cho ra kết quả Chunk nhất quán.

Thuật toán snapshot gia tăng (Incremental Snapshot) này có một số đặc điểm:

- Giai đoạn snapshot có thể đọc song song.
- Thực hiện Checkpoint ở mức độ hạt Chunk, khi lỗi có thể khôi phục từ tiến độ đã hoàn thành.
- Không cần giữ khóa đọc toàn cục (global read lock) lấy từ `FLUSH TABLES WITH READ LOCK` trong suốt cả giai đoạn snapshot.
- Sau khi snapshot toàn phần kết thúc, tự động tiếp tục đọc binlog, giảm bớt thao tác nối vị trí thủ công.

![Flink CDC snapshot gia tăng nối tiếp binlog](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/flink-cdc-incremental-snapshot-68392a53.webp)

Tính đến Flink CDC 3.6, bản chính thức đã cung cấp [MySQL Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/mysql/) và [Elasticsearch Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/elasticsearch/), cho phép khai báo trực tiếp Pipeline từ MySQL sang ES. ES Sink sẽ không tự động tạo Index, nên trước khi chạy vẫn cần chuẩn bị sẵn Index, mapping và các template liên quan.

Khái niệm `exactly-once` trong tài liệu Flink CDC chủ yếu mô tả ngữ nghĩa xử lý của Source ở giai đoạn đọc snapshot và binlog. Tài liệu Elasticsearch Sink chính thức của Flink đưa ra đảm bảo phân phối nền tảng là `at-least-once`: Checkpoint sẽ đợi các request ES đã gửi đi hoàn tất, nhưng sau khi khôi phục lỗi vẫn có thể phát lại request. Việc dùng Document ID cố định cùng thao tác `index`/`upsert` lũy đẳng giúp các lần ghi lặp lại rơi vào đúng một Document; nếu cùng một Document vẫn có thể bị sai thứ tự, cần kết hợp thêm số phiên bản từ phía nguồn. `exactly-once` ở Source không thể suy thẳng thành `exactly-once` đầu-cuối (end-to-end) từ MySQL sang ES.

### Debezium

MySQL Connector của Debezium thường chạy trên nền Kafka Connect. Khi khởi động lần đầu, nó có thể chạy một snapshot nhất quán rồi liên tục đẩy các sự kiện thay đổi mức dòng từ vị trí binlog tương ứng vào Kafka Topic. Về sau vẫn có thể kích hoạt snapshot gia tăng theo từng khối (chunked incremental snapshot) khi cần.

Nếu đội ngũ đã sử dụng Kafka Connect, hoặc dự định gom thay đổi của nhiều loại cơ sở dữ liệu vào chung Kafka, Debezium giúp tiết kiệm công sức hơn việc tự viết bộ phân tích binlog và định dạng sự kiện. Khi ghi sang ES vẫn cần Elasticsearch Sink Connector hoặc một consumer tùy biến; các quy tắc cho sự kiện xóa, nén Topic (Topic compaction), thay đổi Schema và chuyển đổi thông điệp đều phải thiết kế riêng.

Quy trình snapshot cụ thể và các mục cấu hình có thể tham khảo tại [Tài liệu chính thức Debezium MySQL Connector](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

## Những vấn đề bắt buộc phải xử lý trên môi trường Production

Việc chọn công cụ chỉ quyết định thay đổi đi tới downstream bằng cách nào. Dữ liệu có giữ được chính xác hay không còn phụ thuộc vào những chi tiết triển khai dưới đây.

![Đảm bảo tính nhất quán khi đồng bộ MySQL sang ES](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/mysql-es-consistency-guardrails-10110577.webp)

### 1. Dùng khóa chính MySQL làm Document ID trên ES

Khi đồng bộ, nên sử dụng khóa chính nghiệp vụ ổn định và duy nhất làm `_id` của ES. Khi thực hiện lặp lại `index` hoặc `upsert` cho cùng một bản ghi, thao tác sẽ cập nhật lên cùng một Document, nhờ đó consumer dễ đạt được tính lũy đẳng (idempotency) hơn.

Nếu để ES tự động sinh `_id`, việc retry thông điệp có thể ghi ra nhiều Document trùng lặp, và khi xóa cũng rất khó xác định đúng mục tiêu.

### 2. Đảm bảo thứ tự sự kiện cho cùng một Document

Thứ tự toàn cục (global ordering) thường rất tốn kém, còn đồng bộ MySQL sang ES đa phần chỉ cần đảm bảo các sự kiện của cùng một Document ID giữ đúng thứ tự. Cách làm phổ biến là chọn phân vùng MQ theo khóa chính nghiệp vụ, để các sự kiện có cùng khóa chính đi vào cùng một phân vùng và được xử lý tuần tự.

Dù vậy, rebalance, retry khi lỗi và nhiều luồng đồng bộ song song vẫn có thể gây sai thứ tự. Với các kịch bản không chấp nhận giá trị cũ ghi đè giá trị mới, có thể gắn kèm một số phiên bản nghiệp vụ tăng đơn điệu vào cả sự kiện lẫn Document trên ES, đồng thời loại bỏ phiên bản cũ trước khi ghi. Số phiên bản phải xuất phát từ một nguồn thứ tự đáng tin cậy, không được lấy thẳng thời gian cục bộ do nhiều máy tự sinh để thay thế.

Nếu phiên bản phía nguồn có thể biểu diễn dưới dạng số nguyên `long` không âm, các thao tác `index` và `delete` của [ES Bulk API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-bulk) hỗ trợ thiết lập `version` và `version_type=external`: chỉ những lần ghi có số phiên bản cao hơn mới ghi đè được Document hiện có. Sự kiện xóa cũng phải mang theo cùng hệ thống phiên bản đó, nếu không một bản cập nhật cũ đến trễ vẫn có thể ghi sống lại Document đã bị xóa. GTID, tên file binlog và vị trí thường không thể dùng thẳng làm phiên bản ngoài (external version) của ES nếu chưa chuyển đổi — cần định nghĩa quy tắc so sánh ổn định trước khi triển khai.

### 3. Xử lý chính xác thao tác xóa

`INSERT` và `UPDATE` rốt cuộc có thể quy về `upsert`, còn `DELETE` bắt buộc phải chuyển đổi tường minh thành thao tác `delete` trên ES. Nếu nghiệp vụ dùng xóa logic, cần thống nhất quy ước là xóa hẳn Document trên ES hay giữ lại Document và ghi `deleted=true`.

Nếu tác vụ đồng bộ có lọc dữ liệu theo các trường thay đổi được như `status`, `is_deleted`, cần xử lý thêm trường hợp "trước đây thỏa điều kiện, sau khi cập nhật lại không thỏa nữa". Bộ lọc thông thường sẽ chỉ bỏ qua sự kiện cập nhật mới chứ không tự động tạo thêm một lệnh `delete` cho Document cũ đang nằm trong ES. Bạn có thể giữ lại trường trạng thái và lọc lúc truy vấn, hoặc nhận diện sự chuyển đổi trạng thái để chủ động phát sinh sự kiện xóa.

Document tổng hợp từ nhiều bảng càng dễ bị sót khi xóa. Ví dụ Document sản phẩm gồm các trường từ bảng sản phẩm, bảng thương hiệu và bảng danh mục; khi xóa một danh mục, không thể chỉ xóa "ES Document tương ứng với ID danh mục", mà phải tìm ra các sản phẩm bị ảnh hưởng để dựng lại Document của chúng.

### 4. Xử lý Document kết hợp nhiều bảng

Binlog ghi lại thay đổi của từng dòng trong từng bảng, trong khi ES thường dùng Document phi chuẩn hóa (denormalized). Một Document sản phẩm có thể kết hợp dữ liệu từ nhiều bảng như sản phẩm, thương hiệu, tồn kho và nhãn (tag).

Khi CDC thu thập được sự thay đổi tên thương hiệu, hệ thống cần biết những sản phẩm nào đang tham chiếu thương hiệu này. Có ba cách xử lý phổ biến:

- Consumer truy vấn ngược lại MySQL dựa trên sự kiện thay đổi để lắp ghép lại toàn bộ Document bị ảnh hưởng.
- Duy trì sẵn một bảng rộng (wide table) tối ưu cho tìm kiếm ngay trong MySQL rồi đồng bộ bảng rộng đó.
- Dùng các engine xử lý luồng như Flink để duy trì trạng thái kết nối (join state) và tạo ra Document đầu ra.

Cách thứ nhất dễ triển khai nhưng phải kiểm soát mức độ đồng thời và cơ chế cache khi truy vấn ngược MySQL; cách thứ hai làm tăng chi phí bảo trì bảng rộng; cách thứ ba phù hợp với kịch bản dữ liệu lớn và logic liên kết phức tạp, nhưng việc quản lý State, Checkpoint và nâng cấp job đòi hỏi công tác vận hành chuyên biệt.

### 5. Ghi hàng loạt (Bulk) cũng phải kiểm tra kết quả từng bản ghi

[Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html) của Elasticsearch cho phép thực hiện nhiều lệnh `index`, `update` và `delete` trong một lần gọi, giúp giảm chi phí mạng và xử lý request.

Trong một Bulk request có thể chỉ một vài Document bị lỗi. Consumer không thể chỉ kiểm tra mã trạng thái HTTP mà phải duyệt kiểm tra từng phần tử trong `items`, chỉ retry các lỗi tạm thời như timeout mạng, `429` hoặc một số lỗi `5xx`. Các lỗi xác định như xung đột `mapping` hay sai định dạng trường thì retry tiếp cũng không có ý nghĩa, cần ghi nhận thông điệp gốc và chuyển sang hàng đợi thư chết (DLQ) hoặc quy trình xử lý thủ công.

Không có kích thước lô Bulk cố định nào phù hợp cho mọi hệ thống. Số lượng phần tử trong lô, dung lượng byte, độ đồng thời và tần suất `refresh` cần tinh chỉnh dựa trên kích thước Document, số lượng Shard, hàng đợi ghi của ES và kết quả kiểm thử chịu tải (load test).

Khi tốc độ ghi của ES chậm hơn tốc độ thay đổi ở đầu nguồn, cần truyền áp lực ngược (backpressure) lên thượng nguồn: giới hạn số Bulk request đang bay (in-flight) và mức đồng thời của consumer, khi cần thì tạm dừng tiêu thụ hoặc hạ tốc độ đọc của Source. Không dùng hàng đợi trong bộ nhớ không giới hạn để hứng phần tồn đọng; điều đó chỉ biến điểm nghẽn ghi ở ES thành lỗi tràn bộ nhớ (`OOM`) của tiến trình đồng bộ. Khi dùng MQ, cũng phải đảm bảo thời gian lưu giữ thông điệp bao phủ được thời gian tồn đọng tối đa dự kiến.

### 6. Quản lý mapping và thay đổi DDL

MySQL thêm cột mới không có nghĩa mapping trên ES nên tự động thêm trường cùng tên. Dynamic mapping có thể nhận diện nhầm ngày tháng, số hoặc chuỗi sang sai kiểu dữ liệu, hoặc làm bùng nổ số lượng trường gây ra tình trạng `mapping explosion`.

Mapping của các trường cần thiết kế theo cách thức truy vấn, không thể chuyển đổi máy móc theo kiểu dữ liệu MySQL:

- Tên, tiêu đề và mô tả cần tìm kiếm toàn văn thì dùng `text`; nếu còn cần sắp xếp, tổng hợp (aggregation) hoặc lọc chính xác thì thêm trường con `keyword`. Các chuỗi có cấu trúc như mã trạng thái, nhãn, email thường dùng thẳng `keyword`.
- Không chuyển số tiền sang `float` hoặc `double` một cách vô điều kiện. Có thể lưu bằng số nguyên theo đơn vị tiền tệ nhỏ nhất, hoặc dùng `scaled_float` tùy theo độ chính xác cho phép; dù chọn cách nào cũng phải chốt quy tắc quy đổi trong hợp đồng đồng bộ.
- Giá trị tối đa của `BIGINT UNSIGNED` trong MySQL vượt quá kiểu `long` của ES; giá trị lớn cần dùng `unsigned_long` hoặc chuyển sang `keyword`, không để xảy ra tràn số âm thầm trong quá trình tuần tự hóa (`Serialization`).
- Kiểu `TIMESTAMP` của MySQL tự chuyển đổi qua lại theo múi giờ phiên làm việc (session time zone) và UTC, trong khi `DATETIME` không thực hiện chuyển đổi tự động tương tự. Luồng đồng bộ cần cố định múi giờ phiên phía nguồn và định dạng ngày của ES, đồng thời kiểm thử bằng mẫu dữ liệu qua nhiều múi giờ và quanh thời điểm giờ mùa hè (DST).
- Phân biệt thiếu trường, `null`, chuỗi rỗng và mảng rỗng. Việc chúng có tham gia truy vấn `exists`, sắp xếp, tổng hợp và cập nhật cục bộ hay không cần được thống nhất xử lý trước khi ghi.

Môi trường Production phù hợp hơn với `mapping` tường minh và Index Template. Khi kiểu dữ liệu hoặc bộ phân tách từ (analyzer) có thay đổi không tương thích, hãy tạo Index mới, tái tạo toàn phần rồi chuyển đổi qua Alias. Tác vụ CDC cũng phải quy định rõ cách xử lý các sự kiện DDL của MySQL, cũng như thứ tự phát hành giữa mã nguồn, Index Template và tác vụ đồng bộ.

### 7. Giám sát độ trễ, lỗi và thời gian lưu giữ binlog

Tối thiểu cần theo dõi những chỉ số sau:

- Khoảng cách giữa vị trí tiêu thụ hiện tại và vị trí binlog mới nhất của MySQL.
- Lượng thông điệp tồn đọng trong MQ và thời gian chờ của thông điệp cũ nhất.
- Tỷ lệ thành công của ES Bulk, nguyên nhân lỗi từng bản ghi, số lần retry và số lượng dead-letter.
- Tốc độ đọc, tốc độ ghi và khối lượng dữ liệu còn lại của tác vụ toàn phần.
- Thời gian lưu giữ binlog còn lại có lớn hơn tổng thời gian xử lý tồn đọng hiện tại và thời gian khôi phục sự cố hay không.
- Trạng thái cụm ES, số lần từ chối ghi (write rejection), ngưỡng đầy đĩa (disk watermark) và độ trễ `refresh`.

Ngưỡng cảnh báo cần thiết lập dựa trên mục tiêu độ trễ của nghiệp vụ và đường cơ sở từ kiểm thử chịu tải. Việc áp cứng các ngưỡng dùng chung cho mọi hệ thống như "độ trễ vượt quá 60 giây" hay "tỷ lệ lỗi vượt quá 1%" thường không có cơ sở thực tế.

### 8. Đối soát định kỳ và duy trì khả năng tái tạo

Thông điệp không bị tồn đọng không đồng nghĩa dữ liệu chắc chắn nhất quán. Lỗi quy tắc đồng bộ, sót thao tác xóa, xung đột mapping hay việc can thiệp sửa trực tiếp ES đều có thể gây ra sai lệch âm thầm.

Việc đối soát có thể thực hiện theo từng lớp:

1. So sánh tổng số bản ghi hợp lệ giữa MySQL và ES để phát hiện nhanh các sai lệch rõ rệt.
2. Thống kê số lượng và bản tóm tắt theo khoảng khóa chính hoặc phân vùng nghiệp vụ để thu hẹp phạm vi vấn đề.
3. Lấy mẫu đối chiếu các trường quan trọng, hoặc tính mã băm (hash) trên Document sau khi đã chuẩn hóa.
4. Đẩy các khóa chính sai lệch sang tác vụ sửa chữa để dựng lại Document tương ứng, tránh sửa tay trực tiếp trên ES.

Dù đường ống gia tăng hằng ngày có đáng tin cậy tới đâu, hệ thống vẫn phải giữ năng lực "tạo Index mới chỉ với một thao tác, nạp lại toàn phần, đuổi kịp gia tăng, kiểm tra đối chiếu và chuyển Alias". Năng lực này vừa dùng để sửa dữ liệu, vừa phục vụ nâng cấp mapping và bộ phân tách từ.

### 9. Chuẩn bị quy trình vận hành khẩn cấp (Runbook) cho sự cố

Đợi tới khi cảnh báo nổ ra mới ứng biến quyết định "nên retry hay nên rebuild" rất dễ làm sự cố lan rộng. Trước khi đưa lên production (go-live), hãy viết sẵn các bước khôi phục cho những lỗi thường gặp và diễn tập để xác nhận vị trí binlog, Checkpoint, MQ Offset và Index Alias đều hoạt động đúng dự kiến.

| Kịch bản sự cố | Cách xử lý | Việc không nên làm trực tiếp |
| --- | --- | --- |
| ES tạm thời gián đoạn hoặc trả về 429/5xx | Tạm dừng hoặc giới hạn tốc độ ghi, giữ lại thông điệp chưa xác nhận, retry theo chiến lược lùi dần (backoff), theo dõi lượng tồn đọng giảm sau khi khôi phục | Commit offset tiêu thụ khi chưa ghi thành công |
| Xung đột mapping hoặc sai định dạng trường | Dừng việc retry vô ích, ghi log sự kiện gốc và lý do lỗi, sửa template hoặc quy tắc chuyển đổi rồi phát lại có chọn lọc | Retry vô hạn một lỗi mang tính tất định |
| Tác vụ CDC khởi động lại và State vẫn dùng được | Khôi phục từ Checkpoint, vị trí binlog hoặc MQ Offset đã lưu và dựa vào ghi lũy đẳng để khử trùng lặp | Xóa sạch State rồi chạy thẳng từ vị trí mới nhất |
| Binlog hoặc thông điệp cần thiết đã hết hạn | Chạy lại snapshot nhất quán hoặc tái tạo toàn phần, rồi thiết lập lại điểm khớp nối toàn phần – gia tăng | Nhảy cóc lên vị trí mới nhất để chạy tiếp rồi tuyên bố dữ liệu đã nhất quán |
| Index ES hỏng hoặc thay đổi toàn bộ quy tắc | Tạo Index mới, nạp lại toàn phần, đuổi kịp phần gia tăng và đối soát, sau đó chuyển Alias | Vừa xóa vừa vá trên Index cũ mà không giữ điểm quay lui cho lưu lượng truy vấn |

Sổ tay vận hành (Runbook) còn phải ghi rõ người phụ trách, quyền hạn cần thiết, vị trí lưu file State hoặc Checkpoint, đầu mối phát lại dead-letter và điều kiện rollback. Sau khi diễn tập xong, hãy kiểm tra xem quá trình khôi phục có làm tải DB nguồn tăng vọt, ES bị từ chối ghi, binlog tiếp tục hết hạn hay cùng một lô dữ liệu bị phát lại lặp đi lặp lại không.

## Lựa chọn như thế nào?

- Dữ liệu nhỏ, cập nhật không thường xuyên, chấp nhận độ trễ dài: Ưu tiên đồng bộ gia tăng định kỳ kết hợp tái tạo toàn phần định kỳ.
- Nghiệp vụ đã có sẵn sự kiện miền (Domain Event) đáng tin cậy và MQ: Có thể dùng Transactional Outbox + MQ, để dịch vụ đồng bộ tiêu thụ sự kiện và cập nhật ES.
- Nhu cầu chính là lấy ổn định thay đổi gia tăng từ MySQL, đội ngũ quen thuộc Java và MQ: Canal + MQ + consumer tùy biến thường khá phù hợp, phần toàn phần thiết kế riêng.
- Đã có sẵn nền tảng Kafka Connect, hoặc cần tích hợp đồng nhất nhiều loại cơ sở dữ liệu: Có thể cân nhắc Debezium.
- Dữ liệu lớn, muốn tự động nối tiếp toàn phần và gia tăng, hoặc cần làm sạch dạng luồng và biến đổi nhiều bảng: Có thể cân nhắc Flink CDC.

Khi chốt phương án cuối cùng, đừng chỉ so sánh thông lượng (throughput) của công cụ. Hãy xác định trước độ trễ tìm kiếm mà nghiệp vụ chấp nhận được, thời gian khôi phục sự cố, số lượng thành phần cần triển khai, độ phức tạp của Document đa bảng và năng lực vận hành của đội ngũ, rồi kiểm thử chịu tải với quy mô dữ liệu và cấu trúc Document tiệm cận môi trường Production.

## Tài liệu tham khảo

- [MySQL 8.4: Setting the Binary Log Format](https://dev.mysql.com/doc/refman/8.4/en/binary-log-setting.html)
- [Tài liệu dự án Canal](https://github.com/alibaba/canal)
- [Flink CDC 3.6: MySQL Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/mysql/)
- [Flink CDC 3.6: Elasticsearch Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/elasticsearch/)
- [Flink: Ngữ nghĩa chịu lỗi của Elasticsearch Sink](https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/elasticsearch/)
- [Debezium MySQL Connector](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
- [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
- [Elasticsearch Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html)
- [Elasticsearch Aliases](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)
- [Elasticsearch Field Data Types](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/field-data-types)
- [Elasticsearch Numeric Field Types](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/number)
- [MySQL 8.4: Kiểu DATE, DATETIME và TIMESTAMP](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)
- [Spring Framework: Task Execution and Scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
