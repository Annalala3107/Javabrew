---
title: "Hệ thống kiến thức Cơ sở dữ liệu: SQL, MySQL, Redis, MongoDB và Elasticsearch"
description: "Lộ trình học tập và phỏng vấn cơ sở dữ liệu, bao gồm SQL, MySQL Index, Transaction, Logs, MVCC, Execution Plan, Redis Cache, MongoDB và Elasticsearch."
category: Cơ sở dữ liệu
tag:
  - Cơ sở dữ liệu
  - MySQL
  - Redis
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Cơ sở dữ liệu,Câu hỏi phỏng vấn cơ sở dữ liệu,SQL,MySQL,Redis,MongoDB,Elasticsearch,MySQL Index,MySQL Transaction,MySQL Logs,MVCC,Redis Cache,Redis Persistence,Redis Cluster,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/database/README.md
---


Tài liệu **Hệ thống kiến thức Cơ sở dữ liệu** này hướng tới việc học Backend, thực hành kỹ thuật và ôn tập phỏng vấn, sắp xếp các bài viết liên quan đến cơ sở dữ liệu trên trang theo trình tự: "Nền tảng cơ sở dữ liệu -> SQL -> MySQL -> Redis -> NoSQL & Tìm kiếm".

Nếu thời gian hạn hẹp, bạn nên xem trước [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cơ sở dữ liệu](./basis.md), [Tổng hợp kiến thức nền tảng về cú pháp SQL](./sql/sql-syntax-summary.md), [Tổng hợp câu hỏi phỏng vấn MySQL thường gặp](./mysql/mysql-questions-01.md) và [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 1)](./redis/redis-questions-01.md) để nhanh chóng lập danh sách các chủ đề tần suất cao.

## Phù hợp với ai

- Lập trình viên Backend đang học bài bản về nền tảng cơ sở dữ liệu, SQL, MySQL và Redis.
- Các bạn chuẩn bị phỏng vấn Backend cho vị trí thực tập/mới tốt nghiệp, đã có kinh nghiệm hoặc tại các công ty công nghệ vừa và lớn.
- Kỹ sư muốn bổ sung kiến thức về Index, Transaction, Logs, Execution Plan, tính nhất quán của Cache (Cache Consistency), cơ chế bền vững dữ liệu (Persistence) và Cluster của Redis.
- Độc giả đã từng viết code CRUD nghiệp vụ, nhưng chưa nắm vững nguyên lý tầng dưới của cơ sở dữ liệu, tối ưu hiệu năng và lựa chọn công nghệ NoSQL.

## Trọng tâm học tập

- Cơ sở dữ liệu quan hệ (Relational Database) và NoSQL lần lượt phù hợp giải quyết những bài toán nào, ranh giới lựa chọn phổ biến nằm ở đâu?
- Cần nắm vững truy vấn, tổng hợp (aggregation), kết nối (join), truy vấn con (subquery) và ngữ nghĩa Transaction của SQL như thế nào?
- Làm sao để xâu chuỗi MySQL Index, mức cô lập Transaction (Transaction Isolation), MVCC, ba loại Log chính và Execution Plan thành một mạch kiến thức thống nhất?
- Vì sao Redis nhanh, và cần hiểu các cấu trúc dữ liệu phổ biến, chiến lược Cache, Persistence, vấn đề nghẽn (blocking) và cơ chế Cluster như thế nào?
- Các hệ thống NoSQL/tìm kiếm như MongoDB, Elasticsearch thường được kiểm tra những điểm nào trong phỏng vấn Backend và lựa chọn kỹ thuật thực tế?

## Thứ tự đọc khuyến nghị

1. [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cơ sở dữ liệu](./basis.md) và [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng NoSQL](./nosql.md): Hiểu trước phân loại cơ sở dữ liệu, Transaction, dạng chuẩn (Normal Form), các loại NoSQL và kịch bản ứng dụng điển hình.
2. [Tổng hợp kiến thức nền tảng về cú pháp SQL](./sql/sql-syntax-summary.md): Bổ sung nền tảng SQL cơ bản về truy vấn, lọc, sắp xếp, tổng hợp, nối bảng (join), truy vấn con, chèn, cập nhật và xóa dữ liệu.
3. [Chuyên đề MySQL](./mysql/): Tập trung học về Index, mức cô lập Transaction, MVCC, ba loại Log chính, quy trình thực thi và Execution Plan.
4. [Chuyên đề Redis](./redis/): Tập trung học về kiến thức nền tảng Cache, cấu trúc dữ liệu, chiến lược đọc/ghi Cache, Persistence, vấn đề blocking, phân mảnh bộ nhớ (memory fragmentation) và Cluster.
5. [Chuyên đề MongoDB](./mongodb/): Bổ sung kiến thức về cơ sở dữ liệu tài liệu (Document Database) tùy theo yêu cầu vị trí công việc.

## Các bài viết cốt lõi

### Nền tảng cơ sở dữ liệu & SQL

Phần này phù hợp để xây dựng nhận thức chung về cơ sở dữ liệu, tập trung hiểu các loại cơ sở dữ liệu, ngữ nghĩa Transaction, bộ ký tự (Character Set), nền tảng SQL và các câu hỏi truy vấn thường gặp.

- [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cơ sở dữ liệu](./basis.md): Hệ thống hóa khái niệm nền tảng cơ sở dữ liệu, đặc tính Transaction, kiểm soát đồng thời (Concurrency Control), dạng chuẩn (Normal Form) và các câu hỏi phỏng vấn thường gặp.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng NoSQL](./nosql.md): Hiểu các loại NoSQL như Key-Value, Document, Column-Family, Graph Database và kịch bản áp dụng.
- [Giải thích chi tiết về Character Set: Bộ ký tự là gì và cách sử dụng?](./character-set.md): Hiểu bộ ký tự, mã hóa (encoding), nguyên nhân lỗi font/ký tự rác và cách thiết lập Character Set trong MySQL.
- [Chuyên đề SQL](./sql/): Đi từ kiến thức cơ bản về cú pháp SQL đến các câu hỏi phỏng vấn SQL thường gặp.
- [Tổng hợp kiến thức nền tảng về cú pháp SQL](./sql/sql-syntax-summary.md): Bao phủ truy vấn, lọc, sắp xếp, tổng hợp, gom nhóm, nối bảng, truy vấn con và chỉnh sửa dữ liệu.

### MySQL

MySQL là một trong những trọng tâm cốt lõi nhất về cơ sở dữ liệu quan hệ trong phát triển Backend. Khi học, bạn nên liên kết mạch kiến thức: "Index -> Execution Plan -> Transaction -> MVCC -> Logs -> Tối ưu hiệu năng".

- [Chuyên đề MySQL](./mysql/): Xâu chuỗi MySQL Index, Transaction, MVCC, Logs, Execution Plan và tối ưu hiệu năng.
- [Tổng hợp câu hỏi phỏng vấn MySQL thường gặp](./mysql/mysql-questions-01.md): Nhanh chóng lập danh sách câu hỏi MySQL tần suất cao.
- [Giải thích chi tiết về MySQL Index](./mysql/mysql-index.md): Hiểu cấu trúc dữ liệu Index, quy tắc tiền tố ngoài cùng bên trái (leftmost prefix), Covering Index, truy vấn lại bảng chính (table lookup / back-to-table) và nguyên tắc thiết kế Index.
- [Giải thích chi tiết về các mức cô lập Transaction trong MySQL](./mysql/transaction-isolation-level.md): Hiểu Dirty Read, Non-repeatable Read, Phantom Read và sự đánh đổi giữa các mức cô lập khác nhau.
- [Cách triển khai MVCC của Storage Engine InnoDB](./mysql/innodb-implementation-of-mvcc.md): Hiểu Read View, cột ẩn (hidden columns), undo log và Snapshot Read.
- [Giải thích chi tiết về ba loại Log chính của MySQL](./mysql/mysql-logs.md): Hiểu vai trò và mối quan hệ giữa `binlog`, `redo log` và `undo log`.
- [Giải thích chi tiết đồng bộ dữ liệu từ MySQL sang Elasticsearch](./mysql/mysql-to-elasticsearch-sync.md): So sánh ghi kép ở tầng ứng dụng (dual write), đồng bộ định kỳ, Canal, Debezium và Flink CDC để hiểu bài toán đồng bộ toàn phần, đồng bộ gia tăng và tính nhất quán dữ liệu.
- [Phân tích Execution Plan trong MySQL](./mysql/mysql-query-execution-plan.md): Nắm vững các trường phổ biến của `EXPLAIN` và điểm khởi đầu để phân tích câu SQL chậm.

### Redis

Redis vừa là Cache, vừa là điểm trọng tâm thường gặp về Middleware trong phỏng vấn. Khi học đừng chỉ học thuộc lệnh, mà phải hiểu chiến lược Cache, cấu trúc dữ liệu, Persistence, nguyên nhân gây blocking và cơ chế Cluster.

- [Chuyên đề Redis](./redis/): Triển khai xoay quanh Cache, cấu trúc dữ liệu, Persistence, Cluster, vấn đề blocking và thực hành kỹ thuật.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cache](./redis/cache-basics.md): Hiểu kịch bản sử dụng Cache, Cache Penetration, Cache Breakdown, Cache Avalanche và vấn đề tính nhất quán.
- [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 1)](./redis/redis-questions-01.md) và [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 2)](./redis/redis-questions-02.md): Nhanh chóng lập danh sách câu hỏi Redis tần suất cao.
- [Giải thích chi tiết 5 kiểu dữ liệu cơ bản của Redis](./redis/redis-data-structures-01.md): Hiểu kịch bản ứng dụng của String, List, Hash, Set và Sorted Set.
- [Giải thích chi tiết cơ chế Persistence của Redis](./redis/redis-persistence.md): Hiểu RDB, AOF, viết lại AOF (AOF Rewrite) và cơ chế Hybrid Persistence.

### NoSQL & Tìm kiếm

Phần này phù hợp để bổ sung sau khi đã nắm vững cơ sở dữ liệu quan hệ và Cache, giúp hiểu ranh giới lựa chọn giữa Document Database và lưu trữ phi quan hệ.

- [Chuyên đề MongoDB](./mongodb/): Tổng hợp mô hình tài liệu (Document Model) của MongoDB, Index, Replica Set, Sharding, Transaction và các câu hỏi phỏng vấn thường gặp.
- [Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 1)](./mongodb/mongodb-questions-01.md) và [Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 2)](./mongodb/mongodb-questions-02.md): Hiểu các khái niệm cốt lõi và thực hành kỹ thuật của MongoDB.

## Câu hỏi tần suất cao

- Cơ sở dữ liệu quan hệ và NoSQL khác nhau như thế nào? Mỗi loại phù hợp với những kịch bản nào?
- ACID của Transaction trong cơ sở dữ liệu là gì? Các mức cô lập (Isolation Level) lần lượt giải quyết những vấn đề gì?
- Thứ tự thực thi của `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY` trong SQL nên hiểu như thế nào?
- Vì sao MySQL Index giúp tăng tốc truy vấn? Trong những trường hợp nào Index bị vô hiệu hóa?
- InnoDB thực hiện đọc nhất quán không khóa (non-locking consistent read) thông qua MVCC như thế nào?
- `binlog`, `redo log`, `undo log` lần lượt giải quyết những vấn đề gì?
- Làm sao phân tích SQL Execution Plan thông qua `EXPLAIN`?
- Vì sao Redis nhanh? Xử lý Cache Penetration, Cache Breakdown và Cache Avalanche như thế nào?
- Redis Persistence, Master-Replica Replication, Sentinel và Cluster lần lượt giải quyết những vấn đề gì?
- MongoDB và Elasticsearch lần lượt phù hợp với những kịch bản nghiệp vụ nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Hệ thống hiệu năng cao (High Performance)](../high-performance/)
- [Hệ thống kiến thức Hệ thống sẵn sàng cao (High Availability)](../high-availability/)
- [Hệ thống kiến thức Hệ thống phân tán (Distributed Systems)](../distributed-system/)
- [Thiết kế hệ thống (System Design)](../system-design/)
