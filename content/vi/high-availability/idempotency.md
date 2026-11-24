---
title: "Giải thích chi tiết thiết kế Tính lũy đẳng (Idempotency) của API: Idempotency Key, Token, Unique Index, Bảng chống trùng và Callback thanh toán"
description: "Giải thích chi tiết thiết kế Tính lũy đẳng (Idempotency) của API: khái niệm tính lũy đẳng, Idempotency Key, nguồn gốc request trùng lặp, cơ chế Token, Unique Index, bảng chống trùng (Deduplication Table), khóa lạc quan (Optimistic Lock), khóa bi quan (Pessimistic Lock), khóa phân tán (Distributed Lock) và giải pháp lũy đẳng cho đơn hàng, callback thanh toán."
category: Độ sẵn sàng cao (High Availability)
icon: mdi:shield-lock-outline
tag:
  - Tính lũy đẳng (Idempotency)
  - Đồng thời cao (High Concurrency)
head:
  - - meta
    - name: keywords
      content: Tính lũy đẳng API,Thiết kế Idempotency,Idempotency Key,Cơ chế Token,Unique Index,Bảng chống trùng,Distributed Lock,Khóa lạc quan,Idempotency callback thanh toán,Idempotency đơn hàng,Gửi trùng lặp,Câu hỏi phỏng vấn Idempotency
lang: vi
sourceRef: zh-ref/high-availability/idempotency.md
---

Tính lũy đẳng (Idempotency) của API là câu hỏi thường gặp trong phỏng vấn, đồng thời cũng là vấn đề kỹ sư Backend thường xuyên phải xử lý trong công việc phát triển hằng ngày.

## Tính lũy đẳng (Idempotency) là gì?

**Tính lũy đẳng (Idempotency)** vốn là một khái niệm toán học thường gặp trong đại số trừu tượng, biểu thị một phép toán dù thực hiện một lần hay nhiều lần đều tạo ra hiệu ứng giống hệt nhau. Đặt lên hàm số, có thể hiểu là $f(f(x)) = f(x)$. Ví dụ, $f(x)=|x|$ có tính lũy đẳng, bởi vì lấy giá trị tuyệt đối của một số một lần hay nhiều lần đều cho ra cùng một kết quả.

Trong ngữ nghĩa của API, Tính lũy đẳng (Idempotency) chủ yếu chỉ việc nhiều request giống hệt nhau gửi lên đều tạo ra tác động kỳ vọng lên tài nguyên phía Server giống như khi chỉ thực thi một request duy nhất. Còn nội dung phản hồi trả về có bắt buộc giống hệt nhau hay không thì tùy thuộc vào thiết kế nghiệp vụ; các API liên quan đến tiền tệ thường yêu cầu trả về kết quả nghiệp vụ ổn định, nhất quán.

Xét riêng theo loại thao tác dữ liệu:

- Thao tác chèn (Insert) phải dựa vào khóa duy nhất nghiệp vụ (Business Unique Key) hoặc Idempotency Key để tránh tạo dữ liệu trùng lặp.
- Thao tác cập nhật (Update) cần phân biệt giữa cập nhật gán giá trị (Assignment Update) và cập nhật cộng dồn (Incremental Update). Kiểu gán giá trị như `update set status = 'PAID'` dễ đảm bảo tính lũy đẳng hơn, còn kiểu cộng/trừ dồn như `update set balance = balance - 100` bắt buộc phải kiểm soát bổ sung để tránh thực thi lặp lại.

Vấn đề Tính lũy đẳng của API thường phát sinh do mạng chập chờn, người dùng thao tác lặp lại, Client/Gateway tự động Retry khi Timeout hoặc Message Queue gửi lặp message; phản hồi chậm sẽ làm tăng mạnh xác suất xuất hiện các request trùng lặp này.

**Nếu không đảm bảo Tính lũy đẳng (Idempotency) sẽ gây hậu quả gì?**

Không đảm bảo tính lũy đẳng có thể dẫn tới các lỗi nghiêm trọng ở mức độ production, điển hình nhất là trong các kịch bản liên quan đến tiền. Chẳng hạn khi chưa đảm bảo tính lũy đẳng, người dùng lúc thanh toán bấm nút trả tiền nhiều lần liên tiếp, Backend xử lý nhiều request trừ tiền giống hệt nhau, dẫn tới tài khoản bị trừ tiền nhiều lần. Trong các nghiệp vụ tài chính, lỗi dạng này thuộc nhóm sự cố production rủi ro cao.

Vì vậy, các kịch bản như tiền tệ, tồn kho, đơn hàng, mã giảm giá (coupon) đều phải xử lý tính lũy đẳng một cách nghiêm túc. Ngoài ra, đảm bảo tính lũy đẳng không phải chỉ làm ở Frontend là xong, mà phía Backend cũng bắt buộc phải triển khai.

## Làm thế nào để đảm bảo Tính lũy đẳng (Idempotency) cho API?

Frontend có thể làm mờ (disable) hoặc khóa nút bấm sau khi người dùng gửi request. Tuy nhiên cách này chỉ giúp giảm xác suất gửi trùng lặp do bấm nhầm, chứ không thể xem là bảo chứng cho tính lũy đẳng. Người dùng vẫn có thể tải lại trang, gửi lại request (replay), bỏ qua Frontend, hoặc bản thân hệ thống tự phát sinh request lặp do Gateway Timeout Retry hay Message Queue giao lặp message. Ranh giới đảm bảo tính lũy đẳng thực sự bắt buộc phải đặt ở phía Server, đặc biệt với các API làm thay đổi trạng thái nghiệp vụ như tiền tệ, tồn kho, đơn hàng.

Ở phía Backend, việc đảm bảo tính lũy đẳng phức tạp hơn một chút và có nhiều giải pháp khác nhau, như khóa bi quan (`Pessimistic Lock`), Unique Index, bảng chống trùng (Deduplication Table), khóa lạc quan (`Optimistic Lock`), khóa phân tán (Distributed Lock), cơ chế Token, v.v.

Tư tưởng cốt lõi của khóa bi quan và khóa phân tán đều là dùng khóa (Lock) để đảm bảo tại cùng một thời điểm chỉ có duy nhất một request được thực thi. Nhưng chỉ dùng khóa thôi là chưa đủ, còn phải kết hợp kiểm tra tính lũy đẳng dựa theo logic nghiệp vụ — ví dụ kịch bản đăng ký cần kiểm tra số điện thoại/email/username đã tồn tại chưa, kịch bản thanh toán đơn hàng cần kiểm tra trạng thái đơn hàng.

Trong dự án thực tế, phổ biến hơn cả là phương án kết hợp: **Business Unique Key / Idempotency ID chịu trách nhiệm nhận diện request trùng lặp, Unique Index hoặc bảng chống trùng ở Database đóng vai trò chốt chặn cuối cùng, State Machine ngăn trạng thái quay ngược; còn khóa phân tán chỉ dùng khi cần tuần tự hóa thao tác trên cùng một tài nguyên nghiệp vụ.**

Với các kịch bản thường gặp có thể định hình trước như sau:

- **Gửi biểu mẫu trùng lặp (Duplicate Form Submission)**: Khóa nút bấm ở Frontend chỉ giảm thao tác bấm nhầm; phía Server tốt nhất nên cấp kèm Token dùng một lần để đảm bảo cùng một biểu mẫu chỉ gửi thành công được một lần.
- **Tạo đơn hàng**: Nhất định phải có Business Unique Key như mã đơn hàng hoặc Request ID, cộng thêm Unique Index trong Database để chốt chặn. Khi request trùng lặp đi vào, thay vì tạo thêm đơn mới, hệ thống trả về kết quả của đơn hàng đã có.
- **Callback thanh toán**: Mã giao dịch của bên thứ ba phải định danh duy nhất một lần callback, kết hợp với State Machine đơn hàng và bảng chống trùng để tránh ghi nhận thanh toán nhiều lần cho cùng một giao dịch.
- **Trừ tồn kho**: Trọng tâm là chống trừ lặp và chống bán vượt tồn (Overselling), có thể kết hợp kiểm tra trạng thái, khóa lạc quan (`Optimistic Lock`), Redis Lua hoặc Transaction của Database.
- **Tiêu thụ message (Message Consumption)**: Message có thể bị gửi lặp, vì vậy cần dùng Message ID hoặc mã nghiệp vụ để lưu lại kết quả đã xử lý. Message nào đã xử lý rồi thì bỏ qua hoặc trả về thành công ngay.

Khi chọn giải pháp có thể tuân theo vài nguyên tắc ưu tiên:

1. Nếu dùng Business Unique Key giải quyết được thì ưu tiên dùng Business Unique Key.
2. Nếu dùng được Unique Index của Database làm chốt chặn cuối thì không nên chỉ dựa vào Cache.
3. Với nghiệp vụ có luồng chuyển đổi trạng thái, dùng State Machine để chống thực thi lại và chống quay ngược trạng thái.
4. Chỉ cân nhắc khóa phân tán khi cần bảo vệ vùng tranh chấp (Critical Section) của cùng một tài nguyên nghiệp vụ.
5. Kịch bản tài chính rủi ro cao cần nhiều lớp chốt chặn, không đặt cược toàn bộ vào một cơ chế duy nhất.

### Khóa bi quan (`Pessimistic Lock`)

Trong Java, có thể dùng các khóa bi quan có sẵn trong JDK như lớp `ReentrantLock` hoặc từ khóa `synchronized` để đảm bảo tại cùng một thời điểm chỉ có một Thread được phép sửa đổi. Tuy nhiên, khóa của JDK thuộc loại khóa cục bộ (Local Lock) trên một JVM, không dùng được trong môi trường phân tán.

![Khóa cục bộ trên JVM](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/jvm-local-lock-e76b860d.png)

Ngoài khóa bi quan do JDK cung cấp, bản thân Database cũng có sẵn khóa độc quyền (Exclusive Lock / X-Lock). Khóa độc quyền còn gọi là khóa ghi; Transaction khi sửa bản ghi sẽ lấy khóa độc quyền, không cho phép nhiều Transaction cùng giữ đồng thời. Nếu một bản ghi đã bị gắn khóa độc quyền, các Transaction khác không thể gắn thêm khóa không tương thích lên bản ghi đó.

Sử dụng khóa độc quyền trong MySQL:

```sql
SELECT ... FOR UPDATE
```

Khóa độc quyền chỉ dùng được trong các Storage Engine hỗ trợ Transaction (như InnoDB) và chỉ có hiệu lực bên trong Transaction. `SELECT ... FOR UPDATE` tốt nhất phải đánh trúng Index phù hợp, nếu không InnoDB có thể quét và khóa lượng lớn bản ghi, thậm chí tương đương khóa toàn bảng, gây sụt giảm nghiêm trọng khả năng xử lý đồng thời. Ở mức cô lập mặc định `REPEATABLE READ` (RR) của MySQL, InnoDB có thể dùng Next-Key Lock (Record Lock + Gap Lock), nên càng cần kiểm tra kế hoạch thực thi qua `EXPLAIN` để chắc chắn truy vấn đi qua Index.

Trong kịch bản đồng thời cao, tranh chấp khóa gay gắt sẽ làm Thread bị chặn (block), lượng lớn Thread bị chặn gây chuyển đổi ngữ cảnh (Context Switch) liên tục và tăng chi phí hiệu năng hệ thống. Hơn nữa, khóa bi quan còn tiềm ẩn nguy cơ Deadlock, làm gián đoạn luồng chạy. Khi dùng khóa bi quan, cần đảm bảo thứ tự lấy khóa nhất quán, Transaction ngắn nhất có thể, truy vấn đánh trúng Index, đồng thời kết hợp `EXPLAIN` và log Deadlock để xử lý tình trạng chờ khóa.

### Khóa lạc quan (`Optimistic Lock`)

Khóa lạc quan thường được cài đặt bằng cơ chế số phiên bản (Version) hoặc thuật toán CAS.

Với cơ chế số phiên bản, ta thêm một cột `version` vào bảng; mỗi lần cập nhật dữ liệu sẽ kiểm tra xem `version` hiện tại có khớp với giá trị trong Database không. Nếu khớp thì cập nhật thành công và tăng `version` lên 1; nếu không khớp thì cập nhật thất bại, nghĩa là dữ liệu đã bị request khác sửa đổi trước đó.

```sql
-- Cập nhật dữ liệu, sửa price, tăng version lên 1 và kiểm tra version có bằng 1 không (giả sử ban đầu version = 1)
update goods set price = price + 100, version = version + 1 where id = 1 and version = 1;
-- Do version đã đổi thành 2 nên câu SQL dưới đây không cập nhật được dòng nào
update goods set price = price + 100, version = version + 1 where id = 1 and version = 1;
```

Trong kịch bản đồng thời cao, khóa lạc quan thường không chặn chờ lâu như khóa bi quan, giúp giảm tình trạng dồn ứ Thread do tranh chấp khóa nên hiệu năng thường vượt trội hơn. Tuy vậy, thao tác cập nhật Database vẫn có thể liên quan tới Row Lock, nên trong Transaction phức tạp vẫn không thể nói hoàn toàn không có rủi ro Deadlock. Nếu xung đột xảy ra liên tục (tỷ lệ ghi quá lớn), việc thất bại và Retry liên miên (trong khi chi phí của khóa bi quan là cố định) cũng sẽ làm giảm hiệu năng nghiêm trọng và đẩy CPU tăng vọt. Ngoài ra, phương pháp này chủ yếu phù hợp cho kịch bản cập nhật dữ liệu.

Khi cập nhật bằng khóa lạc quan thất bại, cần thiết kế trước chiến lược xử lý: có thể trả về thông báo xung đột rõ ràng để bên gọi quyết định có Retry hay không; hoặc Retry giới hạn 2–3 lần ở phía Server; hoặc truy vấn trạng thái hiện tại để trả về kết quả đã có. Với kịch bản tiền tệ không khuyến khích tự động Retry mù quáng, nên ưu tiên báo xung đột hoặc truy vấn trạng thái cuối cùng.

### Unique Index (Chỉ mục duy nhất)

Bằng cách đặt Unique Index trong bảng, ta đảm bảo tính duy nhất của dữ liệu. Nếu có dữ liệu trùng lặp được chèn vào, Database sẽ ném ra ngoại lệ và ứng dụng có thể bắt ngoại lệ đó để xử lý. Tuy nhiên, cách này chỉ áp dụng được cho kịch bản chèn dữ liệu (Insert).

```sql
create table t_order(
    id int unsigned PRIMARY KEY AUTO_INCREMENT COMMENT "Khóa chính",
    `code` varchar(200) not null COMMENT "Mã giao dịch",
    `customer_id`  int unsigned COMMENT "ID thành viên",
    `amount` decimal(10,2) unsigned not null COMMENT "Tổng tiền",
    -- Lược bỏ các cột đơn hàng khác
    -- Lược bỏ các chỉ mục khác
    -- Mã giao dịch đơn hàng phải là duy nhất
    UNIQUE unq_code(`code`)
) COMMENT="Bảng đơn hàng";
```

Không nên chỉ dựa vào Unique Index để gánh toàn bộ logic tính lũy đẳng, nhưng với thao tác chèn dữ liệu thì rất nên dùng Unique Index làm lớp bảo vệ cuối ở tầng Database để tránh sinh dữ liệu trùng dưới tải đồng thời.

### Bảng chống trùng (Deduplication Table)

Bảng chống trùng về bản chất cũng là một biến thể của giải pháp Unique Index. Đây là bảng chuyên dùng để ghi nhận thông tin request, trong đó có một cột được tạo Unique Index nhằm định danh duy nhất cho request. Khi Client gửi request lên, Server chèn một số thông tin của request (như mã đơn hàng, mã giao dịch, v.v.) vào bảng chống trùng: nếu chèn thành công, chứng tỏ đây là request đầu tiên và được phép thực thi nghiệp vụ tiếp theo; nếu chèn thất bại, chứng tỏ là request trùng lặp, có thể trả về ngay hoặc bỏ qua.

```sql
CREATE TABLE deduplication_table (
    id int unsigned PRIMARY KEY AUTO_INCREMENT COMMENT "Khóa chính",
    processed_code varchar(200) not null COMMENT "Mã đơn hàng đã xử lý",
    -- Lược bỏ các cột khác
    UNIQUE unq_processed_code(processed_code)
) COMMENT="Bảng chống trùng";
```

Việc chèn vào bảng chống trùng phải nằm trong cùng một Database Transaction với thao tác nghiệp vụ phía sau. Chỉ khi Transaction commit thành công thì mệnh đề "bản ghi chống trùng tồn tại = nghiệp vụ đã xử lý xong" mới đúng; nếu logic nghiệp vụ thất bại và Rollback thì bản ghi chống trùng cũng phải Rollback theo để request tiếp theo có thể đi vào xử lý lại bình thường. Nếu không, sẽ xuất hiện trạng thái bất nhất kiểu "bản ghi chống trùng đã lưu rồi nhưng nghiệp vụ thực chất chưa hoàn thành". Nếu Sharding Database làm bảng chống trùng và bảng nghiệp vụ không nằm trên cùng một Database vật lý, cần cân nhắc thêm các giải pháp Distributed Transaction như TCC / Saga hoặc đổi sang thiết kế đảm bảo nhất quán khác.

### Khóa phân tán (Distributed Lock)

Trong hệ thống phân tán, các service/client khác nhau thường chạy trên các tiến trình JVM độc lập. Nếu cần tuần tự hóa thao tác trên cùng một tài nguyên nghiệp vụ xuyên qua nhiều JVM, ta có thể cân nhắc sử dụng **khóa phân tán (Distributed Lock)**.

![Khóa phân tán (Distributed Lock)](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-7e3da313.png)

Dù dựa vào MySQL cũng có thể tạo khóa phân tán (như dùng `SELECT ... FOR UPDATE` hoặc Unique Index), nhưng hiệu năng và độ tin cậy thường kém hơn các dịch vụ điều phối chuyên dụng nên ít được dùng trên production.

Thông thường, chúng ta hay chọn triển khai khóa phân tán dựa trên Redis hoặc ZooKeeper, trong đó Redis được sử dụng nhiều hơn.

Database quan hệ vẫn có thể tham gia kiểm soát đồng thời trong hệ thống phân tán, ví dụ chốt chặn bằng Unique Index, kiểm tra State Machine hay tuần tự hóa bằng Row Lock; nhưng khóa lạc quan và Unique Index thường không được xếp vào nhóm khóa phân tán.

Về giới thiệu chi tiết khóa phân tán cũng như cách triển khai bằng Redis và ZooKeeper, tôi đã viết các bài chuyên sâu riêng, bạn nên xem thêm:

- [Giới thiệu về khóa phân tán](https://javaguide.cn/distributed-system/distributed-lock.html)
- [Tổng hợp các giải pháp cài đặt khóa phân tán phổ biến](https://javaguide.cn/distributed-system/distributed-lock-implementations.html)

Cần lưu ý rằng khóa phân tán ở đây được tạo dựa theo định danh duy nhất (ví dụ mã đơn hàng). Lấy được khóa chỉ có nghĩa là hiện tại được phép đi vào vùng tranh chấp (Critical Section), không đồng nghĩa trong quá khứ request này chưa từng được xử lý. Sau khi vào vùng tranh chấp vẫn bắt buộc phải truy vấn trạng thái nghiệp vụ hoặc bản ghi lũy đẳng. Ví dụ API thanh toán vẫn phải kiểm tra đơn hàng đã thanh toán chưa, mã giao dịch đã được xử lý chưa rồi mới quyết định thực thi nghiệp vụ hay trả về kết quả lịch sử.

Dưới đây là mã giả minh họa dùng `RLock` của Redisson 3.x để đảm bảo Tính lũy đẳng (Idempotency):

```java
// Định danh duy nhất
String uniqueId = "order123";

// 1. Tạo đối tượng khóa phân tán dựa trên định danh duy nhất
RLock lock = redisson.getLock("lock:" + uniqueId);
boolean locked = false;

try {
    // 2. Thử lấy khóa: chờ tối đa 3 giây, sau khi lấy được sẽ tự giải phóng sau 30 giây
    locked = lock.tryLock(3, 30, TimeUnit.SECONDS);
    if (!locked) {
        // Lấy khóa thất bại: trả về đang xử lý, thử lại sau, hoặc truy vấn kết quả lịch sử
        return;
    }

    // 3. Sau khi vào Critical Section, vẫn phải kiểm tra tính lũy đẳng nghiệp vụ
    // Ví dụ: kiểm tra trạng thái đơn hàng / bản ghi lũy đẳng đã tồn tại chưa
    // Chưa xử lý mới chạy logic nghiệp vụ; đã xử lý thì trả về kết quả lịch sử
    ...
} finally {
    // 4. Chỉ giải phóng khóa nếu Thread hiện tại đang giữ khóa
    if (locked && lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

Nếu không chỉ định rõ `leaseTime`, Redisson sẽ tự động gia hạn khóa đang giữ thông qua cơ chế Watchdog; nếu có chỉ định `leaseTime`, khóa sẽ tự động giải phóng sau thời gian thuê đó. Con số 30 giây ở trên chỉ mang tính minh họa, khi dùng thực tế nên đặt theo thời gian chạy tối đa của nghiệp vụ, thường khuyến nghị bằng 2–3 lần thời gian ước tính.

Khi sử dụng khóa phân tán còn cần chú ý thêm các vấn đề sau:

- Độ mịn của khóa (Lock Granularity): Khóa theo mã đơn hàng, User ID hoặc Resource ID, tuyệt đối không dùng khóa toàn cục (Global Lock).
- Quá hạn khóa (Lock Timeout): Khi thời gian thực thi nghiệp vụ vượt quá `leaseTime`, khóa có thể bị giải phóng sớm.
- Giải phóng khóa: Phải kiểm tra đúng Thread hiện tại / owner hiện tại để tránh giải phóng nhầm khóa của request khác.
- Khi lấy khóa thất bại: Cần quy định rõ trả về "đang xử lý", thông báo thử lại sau hay truy vấn kết quả xử lý lịch sử.
- Chốt chặn nghiệp vụ: Vào bên trong khóa vẫn phải kiểm tra trạng thái đơn hàng hoặc lịch sử lũy đẳng, không được chỉ phụ thuộc vào khóa.

### Cơ chế Token

Tư tưởng cốt lõi của cơ chế Token là sinh ra một chứng thực `token` duy nhất cho mỗi thao tác. Token phải được tạo từ phía Server, đảm bảo tính ngẫu nhiên, không thể đoán trước và có thời hạn hiệu lực ngắn. Nếu Server lưu trữ token, có thể dùng Redis để lưu và tiêu thụ một lần; chỉ khi làm token phi trạng thái (Stateless Token) mới cần tính đến chữ ký số, chống giả mạo và thời gian hết hạn.

Như vậy sẽ cần hai request để hoàn tất một thao tác nghiệp vụ:

1. Gửi request lấy token từ phía Server; token cần đặt thời gian hiệu lực (có thể đặt ngắn), Server lưu token đó lại (thường lưu trong Cache).
2. Thực hiện request nghiệp vụ chính thức, gắn token vừa lấy ở bước trước vào header hoặc tham số request. Server xác thực tính hợp lệ của token: nếu hợp lệ thì thực thi logic nghiệp vụ; nếu không hợp lệ thì từ chối request và trả về thông báo.

Khi Server xác thực token, không được thực hiện `GET` rồi mới `DEL` tách rời. Từ Redis 6.2.0 trở lên có thể dùng `GETDEL`, phiên bản thấp hơn có thể dùng Lua Script để thực hiện nguyên tử thao tác "kiểm tra + xóa", đảm bảo cùng một token chỉ có thể bị tiêu thụ bởi một request duy nhất.

Bài viết [Giải pháp truy cập đồng thời trong thiết kế hệ thống phân tán](https://mp.weixin.qq.com/s/yvKASWcRLfOok-NFPrIRsw) của đội ngũ kỹ thuật Dewu (Poizon) minh họa quy trình này khá rõ ràng.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/distributed-system/idempotent-token-20d48518.png)

Nên thực thi logic nghiệp vụ trước rồi xóa token, hay xóa token trước rồi mới thực thi logic nghiệp vụ? Cả hai cách dường như đều có rủi ro:

- Nếu thực thi logic nghiệp vụ trước, Client có thể gửi tiếp một request nữa mang cùng token trong lúc token vẫn chưa bị xóa; vì token vẫn còn nên request thứ hai cũng vượt qua bước kiểm tra.
- Nếu xóa token trước, khi logic nghiệp vụ bị Timeout hoặc gặp chập chờn mạng khiến Client phải Retry request thì token không còn dùng được nữa.

Nhìn chung, khuyến nghị hơn cả là tiêu thụ token một cách nguyên tử trước rồi mới chạy logic nghiệp vụ; nhưng phải đi kèm thông báo lỗi rõ ràng, cơ chế xin cấp lại token, Rollback Transaction nghiệp vụ và ghi nhận lịch sử lũy đẳng. Với kịch bản tiền tệ không thể chỉ dựa vào token, mà vẫn phải dùng trạng thái đơn hàng và lịch sử giao dịch làm chốt chặn cuối cùng.

Cơ chế Token phụ thuộc vào Redis để quản lý vòng đời token, nên cũng cần thiết kế sẵn chiến lược Dự phòng giáng cấp (Fallback) khi Redis không khả dụng. Biểu mẫu thông thường có thể báo người dùng thử lại sau; còn API liên quan đến tiền tệ không nên dùng Ngắt mạch (Circuit Breaker) theo kiểu cho đi qua tự do (fail-open), thà trả về thất bại còn hơn để xảy ra trừ tiền lặp hoặc ghi có lặp.

### Quy trình Tính lũy đẳng (Idempotency) cho Callback thanh toán

Callback thanh toán là một kịch bản cực kỳ điển hình trong thiết kế Tính lũy đẳng (Idempotency), vì nền tảng thanh toán bên thứ ba có thể gọi lại cùng một giao dịch nhiều lần do Timeout mạng hoặc thất lạc phản hồi. Một quy trình an toàn hơn thường như sau:

1. Request callback mang theo mã giao dịch của bên thứ ba `transaction_id`.
2. Bảng lưu lịch sử callback đánh Unique Index trên cột `transaction_id`.
3. Truy vấn trạng thái đơn hàng, chỉ cho phép cập nhật với các chuyển đổi trạng thái hợp lệ như `UNPAID -> PAID`.
4. Đặt thao tác cập nhật trạng thái đơn hàng, ghi bút toán dòng tiền và ghi bản ghi callback vào cùng một Database Transaction.
5. Khi nhận được callback trùng lặp, trả về thành công ngay để bên thứ ba ngừng Retry.

## Làm sao kiểm chứng giải pháp Tính lũy đẳng (Idempotency)?

Giải pháp tính lũy đẳng không thể chỉ nhìn code mà kết luận, mà phải kiểm chứng hiệu lực thực tế qua kiểm thử và đối soát dữ liệu. Đặc biệt với các kịch bản đơn hàng, thanh toán, tồn kho, không thể chỉ test mỗi trường hợp "request bình thường thành công một lần", mà phải chủ động tạo ra request trùng lặp, Timeout, lỗi và Rollback.

Các phương pháp kiểm chứng thiết thực gồm mấy nhóm sau:

1. **Kiểm thử tải đồng thời (Concurrent Load Testing)**: Với cùng một mã đơn hàng, mã giao dịch thanh toán hoặc Idempotency Key, gửi đồng thời 50–100 request; cuối cùng chỉ được phép có đúng một lần thực sự thực thi logic nghiệp vụ. Các request còn lại phải trả về cùng một kết quả hoặc trả về "đang xử lý" / "đã xử lý", tuyệt đối không sinh ra nhiều đơn hàng, nhiều bút toán tiền hay trừ tồn kho nhiều lần.
2. **Kiểm thử Retry**: Giả lập Client Retry khi Timeout, Gateway Retry, bên thứ ba callback lại và Message Queue giao lặp message. Trọng tâm là kiểm tra xem khi request lặp đi vào có khớp trúng bản ghi lũy đẳng hoặc trạng thái nghiệp vụ hay không, chứ không chạy lại logic nghiệp vụ.
3. **Kiểm thử ngoại lệ / tiêm lỗi**: Chủ động gây lỗi giữa chừng quá trình xử lý, chẳng hạn cập nhật trạng thái đơn hàng xong nhưng ghi bút toán thất bại, Token đã bị tiêu thụ nhưng Transaction Rollback, hoặc lấy được khóa phân tán xong thì service khởi động lại. Sau khi phục hồi và gửi lại request, dữ liệu vẫn phải khớp đúng, không được xuất hiện trạng thái bẩn kiểu "nửa thành công nửa thất bại".
4. **Đối soát dữ liệu**: Sau khi kết thúc kiểm thử tải hoặc kiểm thử ngoại lệ, đối soát chéo giữa bảng đơn hàng, bảng dòng tiền, bảng tồn kho và bảng chống trùng. Ví dụ: một giao dịch thanh toán chỉ được có đúng một bút toán thành công, đơn hàng chỉ chuyển từ `UNPAID` sang `PAID` đúng một lần, tổng số lượng tồn kho đã trừ phải khớp với số đơn hàng thành công.
5. **Kiểm toán log (Log Auditing)**: Trong log phải tra cứu được Idempotency Key, Request ID, mã đơn hàng nghiệp vụ, trạng thái xử lý và kết quả trả về. Khi production thực sự gặp sự cố, dựa vào các trường này mới xác định được request đã được xử lý lần đầu, xử lý lặp, đang xử lý hay đã bị logic lũy đẳng chặn lại.

Nói ngắn gọn, kiểm chứng Tính lũy đẳng (Idempotency) không phải là xem "API có trả về thành công hay không", mà là kiểm tra xem dưới request trùng lặp và các nhánh ngoại lệ, dữ liệu nghiệp vụ có luôn chỉ được xử lý đúng đắn một lần duy nhất hay không.

## Tài liệu tham khảo

- Làm thế nào để đảm bảo Tính lũy đẳng (Idempotency) của API dưới tải đồng thời cao?: <https://mp.weixin.qq.com/s/7P2KbWjjX5YPZCInoox-xQ>
- Giải quyết bài toán Tính lũy đẳng, chỉ cần nhớ câu khẩu quyết này!: <https://mp.weixin.qq.com/s/EatpiCzNlTw1viO_flQIpg>
