---
title: Giải thích chi tiết tách dữ liệu nóng - lạnh (Cold-Hot Data Separation)
description: Bài viết giải thích chi tiết nguyên lý cốt lõi và phương án thực tế của tách dữ liệu nóng - lạnh, bao gồm chiến lược phân loại dữ liệu nóng/lạnh, thiết kế phân tầng nhiều cấp, đảm bảo tính nhất quán khi di chuyển dữ liệu, tối ưu truy vấn dữ liệu lạnh, lựa chọn lưu trữ (HBase/TiDB/Object Storage) và các ca triển khai điển hình cho hệ thống đơn hàng, log và nội dung.
category: Hiệu năng cao
head:
  - - meta
    - name: keywords
      content: Tách dữ liệu nóng lạnh,Di chuyển dữ liệu lạnh,Lưu trữ dữ liệu lạnh,Lưu trữ phân tầng,TiDB tách nóng lạnh,HBase,Lưu trữ dài hạn dữ liệu,Tối ưu chi phí lưu trữ,Tính nhất quán dữ liệu
lang: vi
sourceRef: zh-ref/high-performance/data-cold-hot-separation.md
---

## Tách dữ liệu nóng - lạnh là gì?

Tách dữ liệu nóng - lạnh (Cold-Hot Data Separation) là chiến lược kiến trúc phân chia dữ liệu thành dữ liệu lạnh và dữ liệu nóng dựa trên **tần suất truy cập** và **mức độ quan trọng về mặt nghiệp vụ**, sau đó lưu trữ riêng biệt trên các phương tiện lưu trữ có hiệu năng và chi phí khác nhau.

Kiến trúc này hướng đến ba mục tiêu cốt lõi:

1. **Nâng cao hiệu năng truy vấn**: Dữ liệu nóng được lưu trên phương tiện hiệu năng cao (như SSD, bộ nhớ RAM) nhằm đảm bảo tốc độ phản hồi cho các nghiệp vụ cốt lõi.
2. **Giảm chi phí lưu trữ**: Dữ liệu lạnh được di chuyển sang phương tiện chi phí thấp (như HDD, Object Storage), giúp cắt giảm đáng kể chi phí lưu trữ.
3. **Đáp ứng yêu cầu tuân thủ (Compliance)**: Một số ngành (như tài chính, y tế) bắt buộc lưu trữ dữ liệu lâu dài; tách nóng - lạnh giúp cân bằng giữa tuân thủ quy định và chi phí.

### Dữ liệu lạnh và dữ liệu nóng

**Dữ liệu nóng (Hot Data)** là dữ liệu được truy cập và chỉnh sửa thường xuyên, đòi hỏi phản hồi nhanh; **dữ liệu lạnh (Cold Data)** là dữ liệu có tần suất truy cập cực thấp, giá trị nghiệp vụ hiện tại không cao nhưng vẫn cần lưu giữ lâu dài.

Có hai phương pháp chính để phân biệt dữ liệu nóng và dữ liệu lạnh:

1. **Phân loại theo chiều thời gian**: Phân chia dựa trên thời gian tạo, thời gian cập nhật hoặc thời gian hết hạn của dữ liệu. Ví dụ: hệ thống đơn hàng đánh dấu các đơn hàng trước một mốc thời gian (như 90 ngày hoặc 1 năm) là dữ liệu lạnh. Phương pháp này phù hợp với kịch bản **tần suất truy cập dữ liệu gắn chặt với thời gian**, dễ triển khai và chi phí thấp.
2. **Phân loại theo tần suất truy cập**: Dữ liệu được truy cập nhiều xem là dữ liệu nóng, truy cập ít xem là dữ liệu lạnh. Ví dụ: hệ thống nội dung đánh dấu các bài viết có **lượt xem dưới ngưỡng** là dữ liệu lạnh. Cách này cần ghi nhận thêm tần suất truy cập và phù hợp khi **tần suất truy cập gắn chặt với đặc tính của bản thân dữ liệu**.

**Chọn chiến lược phân loại như thế nào?**

- Nếu dữ liệu nghiệp vụ mang tính thời hiệu tự nhiên (như đơn hàng, log, hóa đơn), ưu tiên chọn **chiều thời gian** vì chi phí triển khai thấp nhất.
- Nếu giá trị dữ liệu không phụ thuộc thời gian (như bài viết, sản phẩm, hồ sơ người dùng), cần kết hợp đánh giá theo **tần suất truy cập**.
- Trong dự án thực tế có thể kết hợp cả hai: lấy chiều thời gian làm chính, tần suất truy cập làm bổ trợ để bao phủ nhiều kịch bản nghiệp vụ hơn.

Quy tắc phân định nóng - lạnh không nên chỉ do đội ngũ kỹ thuật tự quyết định cảm tính. Tra cứu đơn hàng, đối soát hóa đơn, kiểm toán, CSKH và vận hành đều ảnh hưởng đến câu hỏi "dữ liệu lạnh còn truy vấn được không, mất bao lâu để lấy ra và có bắt buộc truy vấn toàn bộ dữ liệu không". Trước khi triển khai, tốt nhất nên liệt kê các luồng truy vấn cốt lõi rồi mới chốt mốc thời gian di chuyển dữ liệu lạnh.

### Chiến lược phân tầng nhiều cấp trong tách nóng - lạnh

Khi triển khai thực tế, "nóng" và "lạnh" hiếm khi là sự phân đôi cứng nhắc, mà thường theo dạng **phân tầng nhiều cấp tiệm tiến**:

| Tầng dữ liệu | Đặc tính dữ liệu | Ví dụ quy tắc phân loại | Chiến lược lưu trữ |
| ------------ | -------------------- | --------------------------- | ---------------------- |
| **Dữ liệu nóng (Hot)** | Truy cập tần suất cao, phản hồi thời gian thực | 30 ngày gần nhất + mọi đơn hàng chưa hoàn tất | MySQL Hot DB (SSD) |
| **Dữ liệu ấm (Warm)** | Truy cập tần suất trung bình, có thể bị truy vấn | Đơn hàng từ 30~90 ngày trước | MySQL Warm DB (HDD) |
| **Dữ liệu lạnh (Cold)** | Truy cập tần suất thấp, thỉnh thoảng tra cứu | Đơn hàng lịch sử từ 90 ngày đến 3 năm | Cold DB độc lập hoặc Object Storage |
| **Dữ liệu lưu trữ (Archive)** | Hiếm khi truy cập, chỉ giữ để tuân thủ | Đơn hàng quá 3 năm | Object Storage (chỉ giữ bản tổng hợp) |

**Khuyến nghị thực tế**: Quy tắc phân định nên được quản lý động qua **Configuration Center** (trung tâm cấu hình), tránh phải sửa code liên tục khi nghiệp vụ thay đổi.

### Xử lý thế nào khi dữ liệu lạnh bất ngờ được truy cập?

Nếu dữ liệu lạnh đột nhiên được truy cập (ví dụ người dùng tra cứu đơn hàng từ 3 năm trước), có cần "nâng cấp ngược về nóng" không?

| Chiến lược | Kịch bản áp dụng | Ưu điểm | Nhược điểm |
| ------------ | ---------------------- | -------------------- | ---------------------------- |
| **Không di chuyển ngược (No Migration Back)** | Truy vấn phát sinh ngẫu nhiên, tần suất cực thấp | Triển khai đơn giản | Tốc độ truy vấn chậm |
| **Lớp Cache (Cache Layer)** | Truy vấn tần suất trung bình | Tăng tốc truy vấn mà không thay đổi lưu trữ | Cần thêm thành phần Cache |
| **Di chuyển ngược bất đồng bộ (Async Migration Back)** | Truy vấn tần suất cao, cần truy cập liên tục | Giải quyết triệt để vấn đề hiệu năng | Triển khai phức tạp, có thể phát sinh vấn đề nhất quán |

**Cách làm khuyến nghị**: Đa số kịch bản nên áp dụng tổ hợp "**Không di chuyển ngược + Lớp Cache**". Khi truy vấn dữ liệu lạnh, kiểm tra Cache trước, nếu hit thì trả về ngay; nếu miss thì truy vấn Cold DB rồi ghi kết quả vào Cache (với truy vấn phát sinh hiếm gặp, đặt TTL ngắn khoảng 5~15 phút là đủ).

**⚠️ Lưu ý**: Để ngăn kẻ tấn công dùng tham số ngẫu nhiên truy vấn liên tục dữ liệu không tồn tại khiến Cold DB bị xuyên thủng (Cache Penetration), có thể đặt thêm **Bloom Filter** phía trước lớp Cache hoặc lưu **giá trị rỗng giữ chỗ (Null Placeholder)** trong Cache để tránh request độc hại đi thẳng xuống Cold DB. Chi tiết tham khảo [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 2)](https://javaguide.cn/database/redis/redis-questions-02.html) (Transaction trong Redis, tối ưu hiệu năng, sự cố production, cluster, quy chuẩn sử dụng, v.v.).

### Tư tưởng cốt lõi của tách nóng - lạnh

Tư tưởng cốt lõi của tách nóng - lạnh là **Lưu trữ phân tầng (Tiered Storage)** — phân bổ dữ liệu vào các tầng phương tiện lưu trữ khác nhau dựa theo đặc tính truy cập. Trong kiến trúc lưu trữ doanh nghiệp, thường chia thành các tầng sau:

| Tầng | Đặc tính dữ liệu | Phương tiện lưu trữ điển hình | Độ trễ truy cập |
| --------------------- | ------------------ | -------------------- | ----------- |
| **Hot (Tầng nóng)** | Truy cập tần suất cao, phản hồi thời gian thực | NVMe SSD, RAM | Mức mili-giây |
| **Warm (Tầng ấm)** | Truy cập tần suất trung bình, dữ liệu gần đây | SATA SSD, HDD tốc độ cao | Mức trăm mili-giây |
| **Cold (Tầng lạnh)** | Truy cập tần suất thấp, dữ liệu lịch sử | HDD dung lượng lớn, Object Storage | Mức giây |
| **Archive (Tầng lưu trữ)** | Hiếm khi truy cập, lưu giữ tuân thủ | Tape Library, Glacier Storage | Mức phút ~ giờ |

Tư tưởng phân tầng này được áp dụng rộng rãi trong hạ tầng CNTT, không chỉ giới hạn ở cơ sở dữ liệu mà còn ở hệ thống tệp, Object Storage, CDN Cache và nhiều hệ thống khác.

### Ưu và nhược điểm của tách dữ liệu nóng - lạnh

**Ưu điểm:**

- **Tối ưu hiệu năng truy vấn dữ liệu nóng**: Dữ liệu nóng tập trung trên lưu trữ hiệu năng cao, dung lượng bảng giảm mạnh, hiệu quả Index tăng rõ rệt, mang lại trải nghiệm mượt mà cho đại đa số thao tác người dùng.
- **Giảm mạnh chi phí lưu trữ**: Dữ liệu lạnh chuyển sang HDD hoặc Object Storage, **chênh lệch đơn giá giữa SSD và HDD có thể lên tới 5~10 lần**, tiết kiệm chi phí cực lớn với dữ liệu khổng lồ.
- **Tăng khả năng bảo trì hệ thống**: Khối lượng dữ liệu ở Hot DB nằm trong tầm kiểm soát, tốc độ backup/restore nhanh hơn và các thao tác DDL (như thêm Index) tốn ít thời gian hơn.

**Nhược điểm:**

- **Độ phức tạp hệ thống tăng lên**: Cần bổ sung thành phần di chuyển dữ liệu, logic định tuyến và hệ thống giám sát; rủi ro về tính nhất quán dữ liệu cũng cao hơn.
- **Hiệu quả truy vấn liên cơ sở dữ liệu thấp**: Nếu nghiệp vụ cần truy vấn đồng thời cả dữ liệu nóng và lạnh (như báo cáo thống kê năm), phải thực hiện Join hoặc tổng hợp chéo nhiều DB, làm tăng độ trễ và chi phí phát triển.
- **Chi phí bảo trì chiến lược di chuyển**: Quy tắc phân định nóng - lạnh cần được tinh chỉnh liên tục để tránh phân loại sai dẫn đến chuyển nhầm dữ liệu nóng đi nơi khác.

## Di chuyển dữ liệu lạnh

### Di chuyển dữ liệu lạnh như thế nào?

Di chuyển dữ liệu lạnh là mắt xích cốt lõi của tách nóng - lạnh, gồm ba phương án phổ biến sau:

| Phương án | Nguyên lý triển khai | Ưu điểm | Nhược điểm | Kịch bản áp dụng |
| ------------------- | ---------------------------------------- | ---------------------- | -------------------------------------------- | ---------------------------- |
| **Xử lý tại tầng nghiệp vụ** | Khi ghi sẽ xác định nóng/lạnh và định tuyến thẳng tới DB tương ứng | Tính thời gian thực cao | Xâm lấn code nghiệp vụ, logic phân loại phức tạp | Hầu như không dùng |
| **Di chuyển bằng Scheduled Job** | Task định kỳ quét Hot DB và di chuyển theo lô dữ liệu đạt điều kiện | Triển khai đơn giản | Có độ trễ di chuyển; quét bảng có thể làm ô nhiễm Buffer Pool | Kịch bản phân loại theo thời gian |
| **Di chuyển qua lắng nghe Binlog** | Lắng nghe log thay đổi của DB để di chuyển thời gian thực hoặc cận thời gian thực | Thời gian thực tốt, không xâm lấn code nghiệp vụ | Cần thêm thành phần (như Canal), không phù hợp phân loại theo thời gian | **Kịch bản phân loại theo tần suất truy cập (Khuyến nghị)** |

**Di chuyển bằng Scheduled Job** là phương án được dùng phổ biến nhất, có thể triển khai thông qua các nền tảng điều phối tác vụ phân tán như XXL-Job, Elastic-Job. Về các giải pháp lập lịch tác vụ, bạn cũng có thể xem bài viết chi tiết: [Giải thích chi tiết Scheduled Task trong Java](https://javaguide.cn/system-design/schedule-task.html).

> ⚠️ **Cảnh báo rủi ro**: Di chuyển bằng Scheduled Job tiềm ẩn vấn đề hiệu năng khi dữ liệu lớn. Các thao tác quét bảng phạm vi rộng (như `SELECT * FROM orders WHERE create_time < 'xxx' LIMIT 10000`) sẽ làm ô nhiễm nghiêm trọng InnoDB Buffer Pool, đẩy dữ liệu nóng thực sự của nghiệp vụ ra khỏi bộ nhớ. **Khuyến nghị trên môi trường production**:
>
> - Sử dụng **truy vấn theo dải khóa chính (Primary Key Range Query)** để tránh Full Table Scan;
> - Kiểm soát **kích thước mỗi batch di chuyển**, chia nhỏ thành nhiều lô để chạy;
> - Thực thi tác vụ di chuyển vào **khung giờ thấp điểm**;
> - Với dữ liệu khổng lồ, ưu tiên phương án **lắng nghe Binlog** để giảm tối đa tác động lên Hot DB.

Luồng xử lý điển hình như sau:

![Tách nóng lạnh - Di chuyển dữ liệu lạnh](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/data-cold-hot-separation-b0e9ec69.png)

**Khuyến nghị thực tế**: Nếu công ty có đội ngũ DBA hỗ trợ, nên thực hiện một đợt **di chuyển thủ công dữ liệu lạnh tồn đọng** để nạp hàng loạt dữ liệu lịch sử vào Cold DB trước, sau đó mới tự động hóa **di chuyển tăng dần (incremental migration)** bằng Scheduled Job.

### Làm sao đảm bảo tính nhất quán dữ liệu trong quá trình di chuyển?

Bài toán hóc búa nhất khi di chuyển dữ liệu là: **Nếu dữ liệu bị cập nhật ngay trong lúc đang di chuyển thì xử lý ra sao?**

#### Các giải pháp phổ biến

| Giải pháp | Cách triển khai | Ưu điểm | Nhược điểm |
| ------------------- | -------------------------------------- | ---------------- | ------------------------------------ |
| **Khóa trước khi di chuyển** | Khóa ghi (Write Lock) bản ghi trước khi di chuyển, xong mới giải phóng | Nhất quán mạnh | Ảnh hưởng thao tác ghi nghiệp vụ, giảm throughput |
| **Optimistic Lock theo Version** | Ghi nhận version lúc di chuyển, trước khi xóa kiểm tra version có đổi không | Không khóa (Lock-free), hiệu năng tốt | Cần thêm cột version vào bảng nghiệp vụ, xung đột phải retry |
| **Đánh dấu trạng thái + Idempotency** | Thêm cột trạng thái di chuyển ở Hot DB, đánh dấu trước rồi mới chuyển | Truy vết được, hỗ trợ rollback | Cần chỉnh sửa bảng nghiệp vụ |

> **Lưu ý**: Hot DB và Cold DB thường là **hai database instance khác nhau**, nên `INSERT` (Cold DB) và `DELETE` (Hot DB) không thể đặt trong cùng một Local Transaction; cần xử lý đặc biệt bài toán tính nguyên tử liên DB.

#### Giải pháp khuyến nghị: Đánh dấu trạng thái + Di chuyển Idempotent

Thêm cột `migrate_status` vào bảng ở Hot DB và dùng State Machine để đảm bảo tính nguyên tử cũng như khả năng truy vết khi di chuyển:

```sql
-- 1. Thêm cột trạng thái di chuyển cho bảng ở Hot DB
ALTER TABLE orders ADD COLUMN migrate_status TINYINT DEFAULT 0
    COMMENT '0-Chưa di chuyển 1-Đang di chuyển 2-Đã di chuyển';
```

```java
// 2. Luồng di chuyển (mã giả; kịch bản Cold DB độc lập cần thực thi từng bước ở tầng ứng dụng)

// Step 1: Đánh dấu đang di chuyển (Transaction trên Hot DB)
hotDb.execute("UPDATE orders SET migrate_status = 1 WHERE id = ? AND migrate_status = 0", id);

// Step 2: Đọc dữ liệu từ Hot DB và ghi vào Cold DB (cần chuyển đổi kết nối DB)
Order order = hotDb.query("SELECT * FROM orders WHERE id = ?", id);
coldDb.execute("INSERT IGNORE INTO orders_cold VALUES (?, ?, ...)", order.id, order.data...);

// Step 3: Đánh dấu đã di chuyển (Transaction trên Hot DB)
hotDb.execute("UPDATE orders SET migrate_status = 2 WHERE id = ? AND migrate_status = 1", id);

// Step 4: Xóa trễ dữ liệu ở Hot DB (tùy chọn, thực thi sau khi xác nhận dữ liệu Cold DB chính xác)
hotDb.execute("DELETE FROM orders WHERE id = ? AND migrate_status = 2", id);
```

> **Lưu ý**: Trong kịch bản Cold DB độc lập, MySQL tiêu chuẩn không thể chạy trực tiếp `INSERT ... SELECT` liên instance, bắt buộc phải tách ở tầng ứng dụng thành hai bước "đọc Hot DB → ghi Cold DB".

**Ưu điểm của giải pháp**:

- **Tính lũy đẳng (Idempotency)**: `INSERT IGNORE` đảm bảo ghi vào Cold DB có tính idempotent, còn luồng chuyển trạng thái `migrate_status` đảm bảo cập nhật trên Hot DB có tính idempotent.
- **Khả năng truy vết**: Nhờ cột trạng thái, có thể tra cứu tiến độ di chuyển và can thiệp thủ công khi gặp bất thường.
- **Hỗ trợ Rollback**: Khi di chuyển thất bại, có thể đặt lại trạng thái về 0 để di chuyển lại.
- **Xóa tiệm tiến**: Không xóa ngay dữ liệu ở Hot DB mà chỉ dọn sau khi xác nhận Cold DB không có sai sót, giúp giảm rủi ro.

> **Thu hồi dung lượng**: Sau khi InnoDB thực thi `DELETE`, nó chỉ đánh dấu các trang dữ liệu (data page) là đã xóa chứ không trả lại dung lượng vật lý ngay cho hệ điều hành. Cần chạy `OPTIMIZE TABLE` hoặc `ALTER TABLE ENGINE=InnoDB` vào **khung giờ thấp điểm** để dựng lại bảng và thu hồi dung lượng đĩa thực sự.

**Cơ chế dự phòng (Fallback)**:

- **Đối soát định kỳ**: Định kỳ quét các bản ghi có `migrate_status = 1` vượt quá ngưỡng thời gian để tự động đặt lại hoặc cảnh báo. **Lưu ý**: Độ phân biệt (cardinality) của cột `migrate_status` rất thấp, bắt buộc phải kết hợp Composite Index (như `idx_create_time_migrate_status`) để giới hạn vùng quét, tránh Full Table Scan.
- **Xử lý bản ghi cập nhật tần suất cao**: Với những bản ghi bị bỏ qua nhiều lần do cập nhật liên tục, thiết lập số lần retry tối đa; vượt ngưỡng thì cưỡng chế di chuyển hoặc can thiệp thủ công.

## Lưu trữ dữ liệu lạnh như thế nào?

Nguyên tắc chọn giải pháp lưu trữ dữ liệu lạnh là: **dung lượng lớn, chi phí thấp, độ tin cậy cao, có thể chấp nhận đánh đổi một phần tốc độ truy cập**.

### Giải pháp cho doanh nghiệp vừa và nhỏ

Có thể dùng thẳng **MySQL/PostgreSQL**, giữ cùng loại cơ sở dữ liệu với Hot DB để giảm độ phức tạp vận hành. Cách triển khai cụ thể:

- **Tách bảng trong cùng DB**: Tạo thêm bảng dữ liệu lạnh (như `order_history`) ngay trong cùng database, phân biệt nóng/lạnh qua tên bảng.
- **Cold DB độc lập**: Triển khai một database instance riêng làm Cold DB; tầng ứng dụng định tuyến truy cập giữa Hot DB và Cold DB.

**⚠️ Lưu ý**: Giải pháp Cold DB độc lập kéo theo **truy vấn liên DB**. Nếu nghiệp vụ có nhu cầu truy vấn kết hợp dữ liệu nóng và lạnh, cần đánh giá việc bổ sung lớp đồng bộ hoặc tổng hợp dữ liệu.

### Giải pháp cho doanh nghiệp lớn

Các doanh nghiệp lớn thường sử dụng những storage engine tối ưu riêng cho dữ liệu khổng lồ:

| Giải pháp lưu trữ | Đặc điểm | Kịch bản áp dụng |
| ---------------------- | -------------------------------- | -------------------------------- |
| **HBase** | Lưu trữ theo Column-Family, throughput cao, hỗ trợ dữ liệu cấp PB | Log, hành vi người dùng, lưu trữ dữ liệu IoT |
| **RocksDB** | KV Store hiệu năng cao, cấu trúc LSM-Tree | Kịch bản nhúng (Embedded), làm lớp lưu trữ nền cho hệ thống khác |
| **Doris/ClickHouse** | OLAP Engine, hỗ trợ phân tích thời gian thực | Kịch bản cần tổng hợp phân tích trên dữ liệu lạnh |
| **Cassandra** | Phân tán, độ sẵn sàng cao, không có điểm lỗi đơn (SPOF) | Triển khai đa vùng, lưu trữ yêu cầu High Availability |
| **Object Storage (OSS/S3)** | Chi phí cực thấp, mở rộng gần như vô hạn | Dữ liệu lạnh quy mô siêu lớn, lưu trữ tuân thủ |

### Giải pháp TiDB (Khuyến nghị)

Nếu tech stack của công ty cho phép, có thể dùng các cơ sở dữ liệu quan hệ phân tán như **TiDB**, vốn hỗ trợ sẵn tách nóng - lạnh một cách tự nhiên.

TiDB 6.0 giới thiệu tính năng **Placement Rules in SQL**, cho phép cấu hình vị trí đặt dữ liệu trên cụm TiKV thông qua giao diện SQL.

- **Dữ liệu nóng**: Dùng Placement Rules chỉ định lưu trên **node SSD** để đảm bảo hiệu năng truy vấn.
- **Dữ liệu lạnh**: Chỉ định lưu trên **node HDD** để giảm chi phí lưu trữ.

```sql
-- Tạo Placement Policy: lưu dữ liệu nóng trên node SSD
CREATE PLACEMENT POLICY hot_data
  CONSTRAINTS="[+disk=ssd]";

-- Tạo Placement Policy: lưu dữ liệu lạnh trên node HDD
CREATE PLACEMENT POLICY cold_data
  CONSTRAINTS="[+disk=hdd]";

-- Áp dụng Placement Policy cho bảng hoặc phân vùng (Partition)
ALTER TABLE orders PLACEMENT POLICY = hot_data;
ALTER TABLE orders PARTITION p2022 PLACEMENT POLICY = cold_data;
```

Ưu điểm của giải pháp này là: **nghiệp vụ không cần nhận biết logic tách nóng - lạnh**, việc định tuyến dữ liệu do TiDB tự động đảm nhiệm, giảm mạnh độ phức tạp ở tầng ứng dụng.

> **Thực hành hoàn chỉnh**: `Placement Rules` chỉ định loại phương tiện lưu trữ, nhưng việc đưa dữ liệu luân chuyển từ "phân vùng nóng" sang "phân vùng lạnh" vẫn cần kết hợp **bảng phân vùng (Range Partitioning)**. Tạo phân vùng theo mốc thời gian, gắn Placement Policy HDD cho các phân vùng lịch sử và gắn Placement Policy SSD cho phân vùng đang hoạt động. Theo thời gian, chỉ cần bảo trì việc tạo và xóa phân vùng, dữ liệu tầng dưới sẽ tự nhiên luân chuyển giữa các loại ổ cứng.

## Truy vấn dữ liệu lạnh như thế nào?

Dù tần suất truy cập dữ liệu lạnh thấp, nhưng khi cần truy vấn (như kiểm toán, đối soát, báo cáo năm), làm sao đảm bảo hiệu quả truy vấn?

### Phân tích nhu cầu truy vấn dữ liệu lạnh

Trước tiên cần làm rõ: **Nghiệp vụ có thực sự cần truy vấn dữ liệu lạnh không?**

- **Không cần**: Có thể đưa hoàn toàn dữ liệu lạnh ra khỏi DB nghiệp vụ, chỉ giữ bản lưu trữ (như Object Storage), khi cần thì trích xuất thủ công.
- **Có cần**: Phải thiết kế phương án truy vấn hợp lý để cân bằng hiệu năng và chi phí.

### Các phương án tối ưu truy vấn dữ liệu lạnh

| Biện pháp tối ưu | Cách triển khai | Kịch bản áp dụng |
| -------------------- | --------------------------------------------------- | -------------- |
| **Read Replica riêng cho Cold DB** | Triển khai bản sao chỉ đọc cho Cold DB, tránh truy vấn lạnh ảnh hưởng Hot DB | Kịch bản truy vấn lạnh tần suất cao |
| **Định tuyến truy vấn** | Tầng ứng dụng tự động định tuyến sang Hot DB hoặc Cold DB theo khoảng thời gian | Kịch bản truy vấn xuyên nóng/lạnh |
| **Tổng hợp trước (Pre-aggregation)** | Định kỳ tạo báo cáo tháng/quý cho dữ liệu lạnh, khi tra cứu đọc thẳng kết quả tổng hợp | Kịch bản thống kê phân tích |
| **Lưu trữ dạng cột (Columnar Storage)** | Cold DB dùng các OLAP Engine như ClickHouse, Doris | Truy vấn phân tích quy mô lớn |

**Xử lý truy vấn xuyên nóng/lạnh**:

Nếu phạm vi truy vấn bao gồm cả dữ liệu nóng và lạnh (như "tra cứu đơn hàng trong 2 năm gần nhất"), có hai hướng xử lý:

1. **Tách truy vấn**: Truy vấn riêng Hot DB và Cold DB rồi hợp nhất kết quả ở tầng ứng dụng.
2. **Giới hạn phạm vi**: Nhắc người dùng thu hẹp khoảng thời gian tra cứu, tránh truy vấn liên DB.

> **Cảnh báo chống sập (Avalanche Prevention)**: Nếu nghiệp vụ có **phân trang sắp xếp toàn cục** (như `ORDER BY create_time LIMIT 10000, 20`), tầng ứng dụng bắt buộc phải kéo `10000 + 20` bản ghi từ cả Hot DB và Cold DB về bộ nhớ để merge sort; khi offset lớn rất dễ gây **OOM**. **Yêu cầu bắt buộc**:
>
> - Giới hạn khoảng thời gian truy vấn, tránh truy vấn liên DB quá rộng;
> - Hoặc chuyển luồng tính toán sang bảng rộng (Wide Table) đồng bộ ở tầng dưới (như ClickHouse);
> - Nghiêm cấm thực hiện merge-pagination độ sâu lớn ở tầng ứng dụng.

### Tầng ứng dụng định tuyến dữ liệu nóng/lạnh như thế nào?

| Phương án | Cách triển khai | Ưu điểm | Nhược điểm |
| ------------ | ---------------------------------------- | ------------------ | ---------------------------- |
| **Hardcode** | Phán đoán định tuyến trực tiếp trong code | Triển khai đơn giản | Chi phí bảo trì cao, đổi quy tắc phải sửa code |
| **Configuration Center** | Lưu quy tắc định tuyến trong trung tâm cấu hình (như Nacos, Apollo) | Điều chỉnh động, không cần restart | Cần thêm thành phần hỗ trợ |
| **Tầng Proxy** | Đưa vào các middleware như ShardingSphere, ProxySQL | Nghiệp vụ không cần nhận biết | Độ phức tạp kiến trúc cao |

**Cách làm khuyến nghị**: Quy mô vừa và nhỏ dùng phương án **Configuration Center**, quy mô lớn dùng phương án **tầng Proxy**.

> ⚠️ **Cảnh báo rủi ro**: Sau khi đưa vào tầng Proxy, mọi phép tính tổng hợp liên Hot/Cold DB (như sắp xếp toàn cục, merge-pagination cho `GROUP BY`) đều dồn áp lực lên RAM và CPU của các node Proxy. Cần giới hạn chặt số dòng trả về tối đa cho các thao tác này, nếu không rất dễ làm node Proxy bị **OOM (Out of Memory)**.

## Giám sát và Rollback

Sau khi đưa tách nóng - lạnh lên production, tối thiểu phải theo dõi các chỉ số sau:

- **Tiến độ di chuyển**: Số lượng chờ di chuyển, số lượng thành công, số lượng thất bại, số lần retry.
- **Độ trễ di chuyển**: Thời gian từ lúc dữ liệu đạt điều kiện làm lạnh ở Hot DB cho tới khi hoàn tất di chuyển.
- **Kiểm tra tính nhất quán**: Số lượng bản ghi ở Hot/Cold DB, tóm tắt các trường trọng yếu, tổng các trường tiền tệ.
- **Phân bố tỷ lệ truy vấn**: Tỷ lệ truy vấn Hot DB, truy vấn Cold DB và truy vấn xuyên nóng/lạnh.
- **Áp lực lên Cold DB**: QPS, RT, Slow Query, số kết nối và tốc độ tăng trưởng dung lượng của Cold DB.
- **Lưu lượng dội ngược bất thường**: Khi dữ liệu lạnh bất ngờ bị truy cập tần suất cao, kiểm tra tỷ lệ Cache Hit và tải Cold DB có bất thường không.

Chiến lược Rollback cũng cần thiết kế trước. Cách làm an toàn là giai đoạn đầu mới triển khai chỉ copy chứ chưa xóa; đợi định tuyến truy vấn và kiểm tra nhất quán ổn định rồi mới xóa trễ dữ liệu ở Hot DB. Nhờ vậy, ngay cả khi luồng truy vấn Cold DB gặp sự cố, hệ thống vẫn có thể tạm thời chuyển về lại Hot DB.

## Tách nóng - lạnh vs. Lưu trữ dữ liệu (Data Archiving) vs. Bảng phân vùng (Partitioned Table)

Ba khái niệm này rất dễ nhầm lẫn, cần phân biệt rõ:

| Tiêu chí so sánh | Tách nóng - lạnh | Lưu trữ dữ liệu (Data Archiving) | Bảng phân vùng (Partitioned Table) |
| ------------------ | -------------------------- | ---------------------- | -------------------------- |
| **Dữ liệu có còn truy cập được không?** | Dữ liệu lạnh vẫn nằm trên luồng truy cập nghiệp vụ | Dữ liệu archive thường bị tách ra khỏi DB nghiệp vụ | Mọi phân vùng đều truy cập được |
| **Phương tiện lưu trữ** | Dữ liệu nóng và lạnh có thể nằm khác instance, khác loại lưu trữ | Thường chuyển sang lưu trữ chi phí thấp | Trong cùng một instance |
| **Độ phức tạp triển khai** | Trung bình | Thấp | Thấp |
| **Kịch bản điển hình** | Đơn hàng, log và dữ liệu mang tính thời hiệu | Lưu giữ tuân thủ, sao lưu dữ liệu | Một bảng dữ liệu lớn nhưng không cần tách lưu trữ |

**Giới hạn của bảng phân vùng**: Bảng phân vùng (Partitioned Table) trong MySQL có thể chia theo thời gian, nhưng toàn bộ các phân vùng vẫn nằm trong cùng một instance — **không thể tách rời phương tiện lưu trữ**. Nếu mục tiêu là giảm chi phí lưu trữ, bảng phân vùng không thể thay thế cho tách nóng - lạnh.

## Kịch bản nghiệp vụ điển hình

> **Lưu ý**: Các chiến lược lưu trữ dưới đây chỉ mang tính tham khảo; lựa chọn thực tế cần kết hợp đánh giá khối lượng dữ liệu, nhu cầu truy vấn, tech stack của đội ngũ và ngân sách chi phí.

### Hệ thống đơn hàng

| Giai đoạn | Phạm vi dữ liệu | Chiến lược lưu trữ | Ghi chú |
| -------- | ----------------------- | ------------------------------- | ---------------------------- |
| Dữ liệu nóng | 90 ngày gần nhất + đơn chưa hoàn tất | MySQL Hot DB (SSD) | Truy cập tần suất cao, đảm bảo hiệu năng truy vấn |
| Dữ liệu lạnh | 90 ngày ~ 3 năm | MySQL Cold DB (HDD) hoặc TiDB | Có thể vẫn cần tra cứu, giữ lưu trữ quan hệ |
| Dữ liệu lưu trữ | Quá 3 năm | Object Storage / HBase / Chỉ giữ bảng tổng hợp | Hiếm khi truy vấn, ưu tiên tiết kiệm chi phí |

### Hệ thống Log

| Giai đoạn | Phạm vi dữ liệu | Chiến lược lưu trữ | Ghi chú |
| ------ | --------- | ------------------------------------------------------ | ----------------------------------------- |
| Dữ liệu nóng | 7 ngày gần nhất | Elasticsearch Hot Nodes | Tìm kiếm thời gian thực, truy vấn tần suất cao |
| Dữ liệu ấm | 7~30 ngày | Elasticsearch Warm Nodes | Thỉnh thoảng tra cứu, giảm chi phí lưu trữ |
| Dữ liệu lạnh | Trên 30 ngày | Elasticsearch Cold Nodes / Nén archive sang Object Storage / ClickHouse | Chọn theo nhu cầu truy vấn; ClickHouse phù hợp phân tích |

### Hệ thống nội dung

| Giai đoạn | Phạm vi dữ liệu | Chiến lược lưu trữ | Ghi chú |
| ------ | -------------------------- | ----------------------------- | ------------------------------ |
| Dữ liệu nóng | Trong vòng 3 tháng sau khi đăng + lượt đọc cao | MySQL Hot DB | Được truy cập thường xuyên |
| Dữ liệu lạnh | Sau 3 tháng + lượt đọc thấp | MySQL Cold DB / HBase / Object Storage | Tần suất truy cập thấp, chuyển sang lưu trữ chi phí thấp |

**Gợi ý lựa chọn**:

- **Cần hỗ trợ Transaction hoặc truy vấn phức tạp**: Ưu tiên MySQL Cold DB hoặc TiDB.
- **Cần phân tích tổng hợp quy mô lớn**: Ưu tiên ClickHouse hoặc Doris.
- **Chỉ cần thỉnh thoảng tra cứu chi tiết**: Có thể chọn Object Storage (như OSS/S3), khi truy vấn mới tải tạm thời.
- **Dữ liệu cực lớn và tần suất truy cập cực thấp**: HBase hoặc Object Storage là lựa chọn tối ưu nhất về chi phí/hiệu quả.

## Chia sẻ ca thực tế

- [Cách tối ưu nhanh bảng đơn hàng hàng chục triệu bản ghi - Programmer Jidian - 2023](https://www.cnblogs.com/fulongyuanjushi/p/17910420.html)
- [Giải pháp và thực tiễn tách nóng - lạnh cho dữ liệu khổng lồ - Đội ngũ kỹ thuật ByteDance - 2022](https://mp.weixin.qq.com/s/ZKRkZP6rLHuTE1wvnqmAPQ)
