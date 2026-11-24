---
title: "Chuyên đề MySQL: Index, Transaction, Logs, Sao lưu & Khôi phục, MVCC và Tối ưu hiệu năng"
description: "Lộ trình học tập và tối ưu hiệu năng MySQL phục vụ phỏng vấn, bao gồm Index, vô hiệu hóa Index, mức cô lập Transaction, MVCC, binlog, redo log, undo log, sao lưu và khôi phục, đồng bộ dữ liệu, Execution Plan và tối ưu SQL."
category: Cơ sở dữ liệu
tag:
  - MySQL
  - Cơ sở dữ liệu
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: MySQL,Câu hỏi phỏng vấn MySQL,MySQL Index,Vô hiệu hóa Index,Mức cô lập Transaction,MVCC,binlog,redo log,undo log,Sao lưu MySQL,Khôi phục MySQL,Đồng bộ MySQL sang ES,Canal,Flink CDC,Execution Plan,Quy trình thực thi SQL,Tối ưu hiệu năng MySQL,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/database/mysql/README.md
---

MySQL là một trong những cơ sở dữ liệu quan hệ (Relational Database) được sử dụng phổ biến nhất trong phát triển Backend, đồng thời cũng là chuyên đề dễ bị hỏi xoáy sâu nhất trong phỏng vấn cơ sở dữ liệu. Khi học MySQL, bạn nên triển khai theo các mạch chính: "Index giúp truy vấn nhanh hơn như thế nào, Transaction đảm bảo tính nhất quán ra sao, Logs đảm bảo khôi phục và sao chép thế nào, dữ liệu được đồng bộ sang các hệ thống dị thể như công cụ tìm kiếm ra sao, và Execution Plan giúp định vị Slow SQL như thế nào".

## Phù hợp với ai

- Lập trình viên Backend muốn học bài bản nguyên lý MySQL và tối ưu hiệu năng.
- Các bạn đang ôn luyện câu hỏi phỏng vấn liên quan đến MySQL Index, Transaction, MVCC, Logs và Execution Plan.
- Độc giả đã có thể viết SQL thông thường, nhưng chưa nắm vững cách phân tích Slow SQL, thiết kế Index và các vấn đề về Transaction.
- Kỹ sư cần xử lý các bài toán về hiệu năng MySQL, tính nhất quán dữ liệu, đồng bộ dữ liệu dị thể và thiết kế kiểu dữ liệu cột trong dự án thực tế.

## Trọng tâm học tập

- Index cây B+ (B+ Tree), Clustered Index, Secondary Index, Covering Index và thao tác hồi bảng (back-to-table lookup) lần lượt là gì?
- Những cách viết SQL nào sẽ dẫn đến vô hiệu hóa Index (Index Invalidation), và kiểm chứng qua Execution Plan như thế nào?
- Các mức cô lập Transaction (Transaction Isolation Level) của MySQL ảnh hưởng thế nào tới Dirty Read, Non-repeatable Read và Phantom Read?
- InnoDB thực hiện Snapshot Read thông qua MVCC, `undo log` và Read View như thế nào?
- `binlog`, `redo log`, `undo log` lần lượt giải quyết những vấn đề gì trong sao chép dữ liệu (Replication), khôi phục sau sự cố (Crash Recovery) và hoàn tác Transaction (Rollback)?
- MySQL khôi phục về một thời điểm chỉ định thông qua Full Backup, `binlog` và PITR như thế nào?
- Có những phương án nào để đồng bộ dữ liệu từ MySQL sang Elasticsearch? Xử lý đồng bộ toàn phần, đồng bộ gia tăng, sai thứ tự (out-of-order) và đối soát dữ liệu ra sao?
- Tối ưu Slow SQL nên khoanh vùng từng lớp từ thiết kế bảng, Index, cách viết SQL đến Execution Plan như thế nào?

## Thứ tự đọc khuyến nghị

1. [Tổng hợp câu hỏi phỏng vấn MySQL thường gặp](./mysql-questions-01.md): Xây dựng danh sách các chủ đề MySQL tần suất cao trước.
2. [Giải thích chi tiết về MySQL Index](./mysql-index.md), [Tổng hợp các kịch bản vô hiệu hóa Index trong MySQL](./mysql-index-invalidation.md): Hiểu nguyên lý Index và các tình huống vô hiệu hóa Index phổ biến.
3. [Giải thích chi tiết về các mức cô lập Transaction trong MySQL](./transaction-isolation-level.md), [Cách triển khai MVCC của Storage Engine InnoDB](./innodb-implementation-of-mvcc.md): Nắm vững Transaction và đọc nhất quán (Consistent Read).
4. [Giải thích chi tiết về ba loại Log chính của MySQL](./mysql-logs.md), [Giải thích chi tiết sao lưu và khôi phục MySQL](./mysql-backup-and-restore.md), [Giải thích chi tiết đồng bộ dữ liệu từ MySQL sang Elasticsearch](./mysql-to-elasticsearch-sync.md): Hiểu vai trò của `binlog` trong commit, khôi phục, sao chép và đồng bộ dữ liệu dị thể.
5. [Quy trình thực thi câu lệnh SQL trong MySQL](./how-sql-executed-in-mysql.md): Hiểu cách Connector, Analyzer, Optimizer, Executor và Storage Engine phối hợp với nhau.
6. [Phân tích Execution Plan trong MySQL](./mysql-query-execution-plan.md), [Tổng hợp khuyến nghị và quy chuẩn tối ưu hiệu năng cao MySQL](./mysql-high-performance-optimization-specification-recommendations.md): Áp dụng nguyên lý vào Slow SQL và quy chuẩn kỹ thuật thực tế.

## Các bài viết cốt lõi

### Tổng quan & Quy chuẩn

- [Tổng hợp câu hỏi phỏng vấn MySQL thường gặp](./mysql-questions-01.md): Xâu chuỗi các trọng tâm thi cử tần suất cao như Index, Transaction, Lock, Logs, Storage Engine và tối ưu SQL.
- [Tổng hợp khuyến nghị và quy chuẩn tối ưu hiệu năng cao MySQL](./mysql-high-performance-optimization-specification-recommendations.md): Tổng hợp các đề xuất tối ưu dưới góc độ tạo bảng, kiểu dữ liệu, Index, SQL, Transaction và quy chuẩn lập trình.
- [Một nghìn dòng ghi chú học tập MySQL](./a-thousand-lines-of-mysql-study-notes.md): Phù hợp để rà soát lỗ hổng kiến thức và ôn nhanh các điểm kiến thức MySQL phổ biến.

### Index & Execution Plan

- [Giải thích chi tiết về MySQL Index](./mysql-index.md): Hiểu cấu trúc dữ liệu Index, Clustered Index, Secondary Index, Covering Index, quy tắc tiền tố ngoài cùng bên trái (Leftmost Prefix) và thiết kế Index.
- [Tổng hợp các kịch bản vô hiệu hóa Index trong MySQL](./mysql-index-invalidation.md): Tổng hợp các cách viết gây vô hiệu hóa Index phổ biến và hướng điều tra xử lý.
- [Vô hiệu hóa Index do chuyển đổi kiểu ngầm định trong MySQL](./index-invalidation-caused-by-implicit-conversion.md): Tập trung vào vấn đề vô hiệu hóa Index do chuyển đổi kiểu ngầm định (Implicit Conversion).
- [Phân tích Execution Plan trong MySQL](./mysql-query-execution-plan.md): Nắm vững các trường quan trọng của `EXPLAIN` như `type`, `key`, `rows`, `Extra`.

### Transaction, MVCC, Logs & Đồng bộ dữ liệu

- [Giải thích chi tiết về các mức cô lập Transaction trong MySQL](./transaction-isolation-level.md): Hiểu Read Uncommitted, Read Committed, Repeatable Read, Serializable cùng các bất thường đọc đồng thời.
- [Cách triển khai MVCC của Storage Engine InnoDB](./innodb-implementation-of-mvcc.md): Hiểu các cột ẩn (hidden columns), `undo log`, Read View và cơ chế phán đoán tính khả kiến (Visibility).
- [Giải thích chi tiết về ba loại Log chính của MySQL](./mysql-logs.md): Hiểu vai trò, thời điểm ghi và cơ chế Two-Phase Commit của `binlog`, `redo log`, `undo log`.
- [Giải thích chi tiết sao lưu và khôi phục MySQL](./mysql-backup-and-restore.md): Hiểu `mysqldump`, XtraBackup, `binlog`, PITR, RTO/RPO và diễn tập khôi phục.
- [Giải thích chi tiết đồng bộ dữ liệu từ MySQL sang Elasticsearch](./mysql-to-elasticsearch-sync.md): So sánh ghi kép ở tầng ứng dụng (dual write), đồng bộ định kỳ, Canal, Debezium và Flink CDC, đồng thời hiểu bài toán đồng bộ toàn phần, đồng bộ gia tăng và tính nhất quán cuối cùng (Eventual Consistency).

### Quy trình thực thi & Chi tiết kỹ thuật

- [Quy trình thực thi câu lệnh SQL trong MySQL](./how-sql-executed-in-mysql.md): Hiểu sự phối hợp giữa Connector, Query Cache, Analyzer, Optimizer, Executor và Storage Engine.
- [Giải thích chi tiết về MySQL Query Cache](./mysql-query-cache.md): Hiểu cơ chế hoạt động của Query Cache, nguyên nhân mất hiệu lực (invalidation) và bối cảnh bị loại bỏ.
- [Khóa chính tự tăng trong MySQL có luôn liên tục không?](./mysql-auto-increment-primary-key-continuous.md): Hiểu mối quan hệ giữa cấp phát giá trị tự tăng, Rollback, chèn hàng loạt (batch insert) và tính liên tục của khóa chính.
- [Khuyến nghị lựa chọn kiểu ngày giờ trong MySQL](./some-thoughts-on-database-storage-time.md): So sánh kịch bản áp dụng của các kiểu như `DATE`, `DATETIME`, `TIMESTAMP`.

## Câu hỏi tần suất cao

- Vì sao MySQL khuyến nghị sử dụng Index cây B+?
- Clustered Index và Secondary Index khác nhau như thế nào? Hồi bảng (table lookup) và Covering Index là gì?
- Nguyên tắc tiền tố ngoài cùng bên trái (Leftmost Prefix) là gì? Những kịch bản nào khiến Index bị vô hiệu hóa?
- Làm thế nào để đánh giá một câu SQL có sử dụng Index phù hợp hay không thông qua `EXPLAIN`?
- Bốn mức cô lập Transaction của MySQL lần lượt giải quyết những vấn đề gì?
- MVCC được triển khai như thế nào? Trong Read View có những trường quan trọng nào?
- `binlog`, `redo log`, `undo log` có sự khác biệt gì? Two-Phase Commit giải quyết vấn đề gì?
- MySQL sử dụng bản sao lưu toàn phần (Full Backup) và `binlog` để khôi phục theo mốc thời gian (PITR) như thế nào?
- Có những phương án nào để đồng bộ dữ liệu MySQL sang Elasticsearch? Làm sao đảm bảo tính lũy đẳng (Idempotency) và xử lý thông điệp sai thứ tự?
- Tối ưu Slow SQL nên bắt đầu từ những khía cạnh nào?
- Vì sao khóa chính tự tăng (Auto-Increment Primary Key) không nhất thiết phải liên tục?
- Nên lựa chọn giữa `DATETIME` và `TIMESTAMP` như thế nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Cơ sở dữ liệu](../)
- [Chuyên đề SQL](../sql/)
- [Hệ thống kiến thức Hệ thống hiệu năng cao (High Performance)](../../high-performance/)
- [Hệ thống kiến thức Hệ thống sẵn sàng cao (High Availability)](../../high-availability/)
