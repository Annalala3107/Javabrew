---
title: Giới thiệu phân trang sâu (Deep Pagination) và khuyến nghị tối ưu
description: "Phân trang sâu là tình huống offset truy vấn quá lớn khiến hiệu năng suy giảm mạnh. Bài viết giải thích nguyên nhân gây chậm của phân trang sâu và bốn phương án tối ưu: truy vấn theo khoảng (Range Query), tối ưu bằng Subquery, Deferred Join với INNER JOIN và Covering Index, đồng thời phân tích kịch bản áp dụng và ưu nhược điểm của từng phương án."
category: Hiệu năng cao
head:
  - - meta
    - name: keywords
      content: Phân trang sâu,Tối ưu phân trang,Tối ưu LIMIT,Phân trang MySQL,Deferred Join,Covering Index,Cursor Pagination
lang: vi
sourceRef: zh-ref/high-performance/deep-pagination-optimization.md
---

## Phân trang sâu là gì? Do đâu mà ra?

Tình huống offset (độ lệch) của truy vấn quá lớn được gọi là phân trang sâu (Deep Pagination), dẫn đến hiệu năng truy vấn thấp, ví dụ:

```sql
# Khi MySQL không thể tận dụng Index, nó bỏ qua 1.000.000 bản ghi rồi mới lấy 10 bản ghi
SELECT * FROM t_order ORDER BY id LIMIT 1000000, 10
```

Khi offset truy vấn quá lớn, trình tối ưu truy vấn (Query Optimizer) của MySQL có thể chọn quét toàn bảng (Full Table Scan) thay vì dùng Index để tối ưu truy vấn.

**Nguyên nhân gốc rễ khiến phân trang sâu bị chậm** nằm ở cơ chế thực thi của MySQL: với `LIMIT offset, N`, MySQL không nhảy thẳng tới vị trí `offset`, mà phải quét từ đầu tổng cộng `offset + N` bản ghi. Nếu truy vấn dựa vào Secondary Index và không thỏa mãn Covering Index, điều đó đồng nghĩa MySQL phải thực hiện hàng loạt thao tác **truy vấn hồi bảng (Bookmark Lookup — phát sinh lượng lớn Random I/O)** vô ích cho `offset` bản ghi đầu tiên, rồi cuối cùng vứt bỏ toàn bộ dữ liệu vất vả đọc ra đó. Ngay cả khi Optimizer từ bỏ Index vì chi phí quá cao để chuyển sang Full Table Scan, chi phí quét tuần tự hàng triệu dòng vẫn vô cùng lớn.

![Vấn đề phân trang sâu](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/deep-pagination-phenomenon-900f886b.png)

Ngưỡng tới hạn khiến offset truy vấn trở nên quá lớn sẽ khác nhau tùy từng máy, phụ thuộc vào nhiều yếu tố như cấu hình phần cứng (hiệu năng CPU, tốc độ ổ đĩa), kích thước bảng, loại Index và thông tin thống kê của Index.

![Ngưỡng tới hạn chuyển sang quét toàn bảng](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/deep-pagination-phenomenon-critical-point-acaa0a08.png)

Trình tối ưu truy vấn của MySQL sử dụng chiến lược dựa trên chi phí (Cost-based) để chọn Execution Plan tối ưu nhất. Nó căn cứ vào chi phí CPU và I/O để quyết định dùng Index Scan hay Full Table Scan. Nếu Optimizer cho rằng Full Table Scan rẻ hơn, nó sẽ từ bỏ Index. Tuy nhiên, ngay cả khi offset lớn, nếu truy vấn sử dụng Covering Index, MySQL vẫn có thể dùng Index để tránh thao tác hồi bảng.

## Khuyến nghị tối ưu phân trang sâu

> **Bài viết này dựa trên MySQL 8.0 + InnoDB Storage Engine**; hành vi của Optimizer ở các phiên bản khác nhau có thể có sự khác biệt.

### Truy vấn theo khoảng (Cursor Pagination)

Bằng cách ghi lại ID của bản ghi cuối cùng ở trang trước, dùng `WHERE id > last_id LIMIT n` để lấy dữ liệu trang kế tiếp:

```sql
# Lấy trang tiếp theo bằng cách ghi nhận ID của bản ghi cuối cùng từ kết quả truy vấn trước
SELECT * FROM t_order WHERE id > 100000 ORDER BY id LIMIT 10
```

**Ưu điểm cốt lõi của Cursor Pagination**: **Không phụ thuộc vào tính liên tục của ID**. MySQL chỉ cần định vị tới vị trí `last_id` trên cây B+ rồi đọc tuần tự tiếp `n` bản ghi; việc ở giữa có bị đứt quãng (như ID bị xóa) hoàn toàn không ảnh hưởng đến tính chính xác hay hiệu năng.

Hạn chế của phương pháp này:

1. **Không hỗ trợ nhảy trang**: Không thể nhảy thẳng tới trang thứ N mà chỉ có thể lật từng trang tiến (hoặc lùi).
2. **Giới hạn trường sắp xếp**: Nếu truy vấn cần sắp xếp theo trường khác (như thời gian tạo) thay vì ID, phải dùng con trỏ kết hợp `(sort_field, id)` để đảm bảo tính duy nhất và thứ tự.
3. **Kịch bản đồng thời (Concurrency)**: Khi có dữ liệu mới được chèn hoặc dữ liệu cũ bị xóa trong lúc đang phân trang, có thể xảy ra:
   - **Sót dữ liệu**: Khi truy vấn trang 2, có dữ liệu mới chèn vào phạm vi trang 1 khiến dữ liệu cũ bị "đẩy" xuống trang 2, nhưng truy vấn trang 2 đã dựa trên ID cuối cũ để bỏ qua nó.
   - **Trùng dữ liệu**: Khi truy vấn trang 2, dữ liệu cuối trang 1 bị xóa khiến bản ghi đầu tiên của trang 2 "trồi" lên cuối trang 1, dẫn tới truy vấn trang 2 lại trả về bản ghi đó một lần nữa.

### Subquery (Truy vấn con)

Trước tiên truy vấn ra giá trị khóa chính tương ứng với tham số đầu tiên của `LIMIT`, sau đó lọc lại theo giá trị khóa chính này rồi `LIMIT`, tốc độ sẽ nhanh hơn đáng kể.

Trong *Sổ tay phát triển Java (Java Development Handbook)* của Alibaba cũng có mô tả tương ứng:

> Tận dụng Deferred Join hoặc Subquery để tối ưu các kịch bản phân trang cực nhiều.
>
> ![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/alibaba-java-development-handbook-paging-1098ea1c.png)

```sql
-- Tìm nhanh ID bắt đầu thông qua offset trên Primary Key Index bằng Subquery
SELECT * FROM t_order
WHERE id >= (
    SELECT id FROM t_order ORDER BY id LIMIT 1000000, 1
) ORDER BY id LIMIT 10;
```

**Nguyên lý hoạt động**:

1. Subquery `(SELECT id FROM t_order ORDER BY id LIMIT 1000000, 1)` quét trên Primary Key Index và bỏ qua 1.000.000 bản ghi đầu tiên, trả về giá trị khóa chính của bản ghi thứ 1.000.001.
2. Truy vấn chính `SELECT * FROM t_order WHERE id >= ... ORDER BY id LIMIT 10` lấy khóa chính này làm điểm bắt đầu để truy xuất 10 bản ghi đầy đủ kế tiếp.

Tuy nhiên, trong một số trường hợp Subquery có thể tạo bảng tạm (Temporary Table) làm ảnh hưởng hiệu năng, vì vậy với truy vấn phức tạp nên ưu tiên cân nhắc Deferred Join.

> **Kịch bản lọc phức tạp**: Trong bài toán phân trang có điều kiện lọc phức tạp (như `WHERE status = 1 ORDER BY id LIMIT 1000000, 10`), các ID thỏa điều kiện thường phân bố rời rạc. Lúc này ưu thế của Subquery càng rõ rệt: bằng cách tận dụng Composite Index (như `(status, id)`) trong Subquery để quét Covering Index, hệ thống bỏ qua rất hiệu quả 1 triệu bản ghi đầu thỏa điều kiện, định vị tới ID mục tiêu rồi truy vấn chính chỉ cần hồi bảng đúng 10 lần.

Tất nhiên ta cũng có thể dùng Subquery để lấy tập ID của trang mục tiêu trước rồi mới truy vấn nội dung theo tập ID đó, nhưng cách viết này khá rườm rà, không gọn bằng `INNER JOIN` Deferred Join.

### Deferred Join (Kết nối trì hoãn)

Deferred Join có tư duy tối ưu tương tự Subquery: đều đẩy thao tác `LIMIT` lên cây Primary Key Index để giảm số lần hồi bảng. So với dùng trực tiếp Subquery, Deferred Join đưa kết quả Subquery vào truy vấn chính thông qua `INNER JOIN`, tránh việc Subquery có thể sinh ra bảng tạm. Khi thực thi `INNER JOIN`, MySQL Optimizer có thể tận dụng Index để thực hiện phép nối hiệu quả (như Index Scan hoặc chiến lược tối ưu khác), nên trong kịch bản phân trang sâu, hiệu năng thường tốt hơn dùng trực tiếp Subquery.

```sql
-- Dùng INNER JOIN để thực hiện Deferred Join
SELECT t1.*
FROM t_order t1
INNER JOIN (
    -- Subquery ở đây có thể tận dụng Covering Index với hiệu năng cực cao
    SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10
) t2 ON t1.id = t2.id;
```

**Nguyên lý hoạt động**:

1. Subquery `(SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10)` quét qua Primary Key Index, bỏ qua 1.000.000 bản ghi đầu và trả về ID của 10 bản ghi thuộc trang mục tiêu.
2. Dùng `INNER JOIN` nối kết quả Subquery với bảng chính `t_order` để lấy đầy đủ dữ liệu bản ghi.

Ngoài `INNER JOIN`, cũng có thể dùng dấu phẩy để nối Subquery.

```sql
-- Dùng dấu phẩy để thực hiện Deferred Join
SELECT t1.* FROM t_order t1,
(SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10) t2
WHERE t1.id = t2.id;
```

**Lưu ý**: Dù nối Subquery bằng dấu phẩy cũng cho hiệu quả tương tự, nhưng để đảm bảo khả năng đọc hiểu và bảo trì code, khuyến nghị dùng cú pháp `INNER JOIN` chuẩn mực hơn.

### Covering Index (Chỉ mục bao phủ)

Cách truy vấn mà trong Index đã chứa sẵn toàn bộ các trường cần lấy được gọi là Covering Index.

**Lợi ích của Covering Index:**

- **Tránh truy vấn lần hai trên bảng InnoDB, tức tránh thao tác hồi bảng (Bookmark Lookup)**: InnoDB lưu trữ dữ liệu theo thứ tự của Clustered Index; với InnoDB, node lá của Secondary Index lưu thông tin khóa chính của dòng. Nếu dùng Secondary Index để truy vấn dữ liệu, sau khi tìm thấy khóa tương ứng, còn phải truy vấn lần hai qua khóa chính mới lấy được dữ liệu thực sự cần thiết. Trong Covering Index, các giá trị trong Secondary Index đã đủ để lấy toàn bộ dữ liệu, tránh được truy vấn lần hai theo khóa chính (hồi bảng), giảm thao tác I/O và tăng hiệu quả truy vấn.
- **Giảm Random I/O do hồi bảng gây ra**: Trả về trực tiếp dữ liệu từ Covering Index giúp tránh thao tác Random I/O khi phải từ khóa chính của Secondary Index quay về tra Clustered Index. Mỗi lần tra Clustered Index theo khóa chính khi hồi bảng về bản chất đều là Random I/O.

Giả sử đã tạo Composite Index `(code, type)`, câu truy vấn sau có thể dùng Covering Index:

```sql
# Trong InnoDB, Secondary Index mặc định đã chứa khóa chính id
# Nếu chỉ cần truy vấn 3 cột id, code, type thì chỉ cần tạo Composite Index (code, type) là đủ bao phủ
SELECT id, code, type FROM t_order
ORDER BY code
LIMIT 1000000, 10;
```

**⚠️ Lưu ý**:

- Khi tập kết quả truy vấn chiếm phần lớn tổng số dòng của bảng, MySQL Query Optimizer có thể chọn bỏ qua Index và tự động chuyển sang Full Table Scan.
- Dù có thể dùng `FORCE INDEX` để ép Query Optimizer đi theo Index, cách này có thể khiến Optimizer không chọn được Execution Plan tốt hơn, nên hiệu quả không phải lúc nào cũng lý tưởng.

## Khuyến nghị triển khai trên Production

Tối ưu phân trang trước hết phải đồng bộ với hình thái sản phẩm. Hệ thống quản trị (Admin) thường cần nhảy trang và tổng số dòng chính xác, còn bảng tin (Feed), danh sách bình luận hay danh sách đơn hàng thường chỉ cần "Trang trước / Trang sau" hoặc "Tải thêm". Nếu nghiệp vụ không cần nhảy tới trang thứ 10.000 thì đừng vì tương thích phân trang truyền thống mà hy sinh hiệu năng truy vấn.

Lựa chọn phổ biến như sau:

| Hình thái nghiệp vụ | Phương án khuyến nghị | Lý do |
| ---------------------- | ---------------- | -------------------------------- |
| Bảng tin, bình luận, danh sách tin nhắn | Cursor Pagination | Chỉ cần lật tiến/lùi, hiệu năng ổn định |
| Danh sách Admin, tra cứu vận hành | Deferred Join hoặc Subquery | Tương thích số trang truyền thống, nhưng cần giới hạn số trang tối đa |
| Bảng xếp hạng cố định trường | Covering Index | Ít trường cần truy vấn, giảm hồi bảng |
| Tìm kiếm phức tạp, sắp xếp đa điều kiện | Search Engine hoặc OLAP | MySQL không phù hợp gánh tìm kiếm và sắp xếp bước nhảy lớn |

### Giám sát và Cảnh báo

- **Giám sát Slow Query**: Theo dõi các câu SQL có offset `LIMIT` quá lớn trong Slow Query Log để phát hiện vấn đề kịp thời.
- **Cảnh báo ngưỡng**: Thiết lập ngưỡng `long_query_time` để bắt các truy vấn phân trang sâu.
- **Kiểm tra Execution Plan**: Định kỳ dùng `EXPLAIN` kiểm tra Execution Plan của các SQL phân trang trọng yếu, đảm bảo Optimizer dùng Index đúng kỳ vọng.
- **Rate Limit cho API**: Áp dụng giới hạn tốc độ riêng cho các request trang sâu, tránh crawler hoặc request bất thường kéo sập database.
- **Giới hạn số trang tối đa**: Ví dụ chỉ cho phép truy vấn 100 trang đầu, dữ liệu sâu hơn thì hướng dẫn người dùng thu hẹp điều kiện tìm kiếm.

### Những ngộ nhận thường gặp

| Ngộ nhận | Thực tế |
| --------------------------------- | ---------------------------------------------------- |
| Cho rằng `FORCE INDEX` giải quyết được mọi vấn đề | Ép dùng Index có thể ngăn Optimizer chọn kế hoạch tối ưu hơn, cần thận trọng khi dùng |
| Cho rằng Covering Index phù hợp mọi kịch bản | Quá nhiều cột khiến chi phí bảo trì Index cao, và tập kết quả lớn vẫn có thể chạy Full Table Scan |
| Cho rằng Cursor Pagination giải quyết mọi vấn đề | Cursor Pagination không hỗ trợ nhảy trang và chỉ lật được theo thứ tự của một số trường cố định |

## Tổng kết

Nguyên nhân gốc rễ của vấn đề phân trang sâu là: khi offset của `LIMIT` quá lớn, MySQL phải quét và bỏ qua lượng lớn bản ghi mới lấy được dữ liệu mục tiêu, và Query Optimizer có thể bỏ Index để chọn Full Table Scan. Lúc này ngay cả khi có Index, vẫn không tránh khỏi lượng lớn thao tác hồi bảng, khiến hiệu năng truy vấn tụt dốc nhanh chóng.

Bài viết đã giới thiệu bốn phương án tối ưu phân trang sâu phổ biến, bảng so sánh đặc điểm và kịch bản áp dụng như sau:

| Phương án tối ưu | Tư duy cốt lõi | Kịch bản áp dụng | Hạn chế |
| ------------ | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| **Range Query** | Ghi nhận ID cuối trang trước, lấy trang sau qua `WHERE id > last_id LIMIT n` | Sắp xếp theo ID, cho phép lật trang kiểu con trỏ | Không hỗ trợ nhảy trang; sắp xếp khác ID cần con trỏ kết hợp |
| **Subquery** | Lấy khóa chính bắt đầu qua Subquery rồi lọc theo khóa chính | Cần hỗ trợ lật trang `OFFSET` truyền thống | Subquery có thể tạo bảng tạm; phụ thuộc Index trên trường sắp xếp |
| **Deferred Join** | Dùng `INNER JOIN` đẩy phân trang về Primary Key Index để giảm hồi bảng | Phân trang dữ liệu lớn cần logic lật trang truyền thống | Câu SQL tương đối phức tạp |
| **Covering Index** | Tạo Composite Index chứa đủ các trường cần truy vấn để tránh hồi bảng | Trường truy vấn cố định, tạo được Index phù hợp | Chi phí bảo trì Index cao khi nhiều cột; tập kết quả lớn vẫn có thể chạy Full Table Scan |

**Gợi ý lựa chọn phương án**:

- **Ưu tiên dùng Deferred Join**: Với đa số kịch bản cần hỗ trợ logic lật trang `LIMIT offset, size` truyền thống, Deferred Join mang lại sự cân bằng tốt hơn về hiệu năng và khả năng bảo trì.
- **Cân nhắc Range Query (Cursor Pagination)**: Nếu nghiệp vụ cho phép lật trang dạng "Trang tiếp theo" (như News Feed mạng xã hội, Infinite Scroll), Range Query cho hiệu năng tốt và ổn định nhất.
- **Dùng Covering Index làm bổ trợ**: Khi các trường truy vấn cố định và số lượng ít, có thể kết hợp tạo Covering Index với các phương án khác để tối ưu thêm.

**Lưu ý**:

- Dù chọn phương án nào, đều phải chú ý giám sát Execution Plan thực tế (`EXPLAIN`) để đảm bảo Optimizer dùng Index đúng kỳ vọng.
- Với phân trang siêu sâu (như offset hàng triệu), cần đánh giá lại từ góc độ nghiệp vụ xem có thực sự cần hỗ trợ hay không, cân nhắc giới hạn số trang tối đa hoặc chuyển sang phương thức truy xuất khác (như Search Engine).

## Tham khảo

- Bàn về cách giải quyết vấn đề phân trang sâu trong MySQL - JianTianLuoDeXiaoNanHai: <https://juejin.cn/post/7012016858379321358>
- Giới thiệu phân trang sâu trong cơ sở dữ liệu và phương án tối ưu - JD Retail Tech: <https://mp.weixin.qq.com/s/ZEwGKvRCyvAgGlmeseAS7g>
- Tối ưu phân trang sâu trong MySQL - Dewu Tech: <https://juejin.cn/post/6985478936683610149>
