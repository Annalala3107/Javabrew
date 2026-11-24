---
title: "Chuyên đề MongoDB: Mô hình Document, Index, Replica Set, Sharding, Transaction và Câu hỏi phỏng vấn thường gặp"
description: "Lộ trình học tập và phỏng vấn MongoDB và NoSQL, bao gồm mô hình Document, Collection, Index, Replica Set, Sharding, Transaction, Aggregation, Read/Write Concern, Storage Engine và các câu hỏi phỏng vấn thường gặp."
category: Cơ sở dữ liệu
tag:
  - MongoDB
  - NoSQL
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.85
head:
  - - meta
    - name: keywords
      content: MongoDB,Câu hỏi phỏng vấn MongoDB,NoSQL,Document Database,MongoDB Index,Replica Set,Sharding,Aggregation,Transaction,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/database/mongodb/README.md
---

MongoDB là một Document Database (cơ sở dữ liệu hướng tài liệu) điển hình, phù hợp với dữ liệu bán cấu trúc (semi-structured data), mô hình trường linh hoạt và các kịch bản nghiệp vụ thay đổi nhanh. Khi học MongoDB, bạn nên tập trung hiểu mô hình Document, Index, Replica Set, Sharding, Aggregation và năng lực Transaction, thay vì chỉ đơn giản xem nó là "một cơ sở dữ liệu có thể lưu JSON".

## Phù hợp với ai

- Lập trình viên Backend muốn tìm hiểu các khái niệm cốt lõi về MongoDB và Document Database.
- Các bạn đang ôn tập câu hỏi phỏng vấn liên quan đến MongoDB, NoSQL và mô hình Document.
- Kỹ sư cần lựa chọn giữa cơ sở dữ liệu quan hệ và cơ sở dữ liệu hướng tài liệu.
- Độc giả đã từng tiếp xúc với MongoDB, nhưng chưa nắm vững cơ chế của Index, Replica Set, Sharding và Transaction.

## Trọng tâm học tập

- Database, Collection và Document trong MongoDB khác gì so với Database, Table và Row trong cơ sở dữ liệu quan hệ?
- Mô hình Document phù hợp với những cấu trúc dữ liệu nào, và khi nào không nên dùng MongoDB?
- Index, Aggregation Pipeline, Replica Set và Sharding trong MongoDB lần lượt giải quyết những bài toán nào?
- Cần hiểu như thế nào về `read concern`, `write concern`, Transaction và ngữ nghĩa nhất quán (Consistency)?
- Trong phỏng vấn, làm sao trả lời câu hỏi về MongoDB theo các khía cạnh: "mô hình, truy vấn, Index, tính sẵn sàng cao (High Availability), khả năng mở rộng, kịch bản phù hợp"?

## Thứ tự đọc đề xuất

1. [Tổng hợp câu hỏi phỏng vấn thường gặp về kiến thức cơ bản NoSQL](../nosql.md): Hiểu trước phân loại NoSQL, kịch bản phù hợp và sự khác biệt với cơ sở dữ liệu quan hệ.
2. [Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 1)](./mongodb-questions-01.md): Học các khái niệm cơ bản về MongoDB, mô hình Document, Index và truy vấn.
3. [Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 2)](./mongodb-questions-02.md): Tiếp tục tìm hiểu về Replica Set, Sharding, Transaction, Aggregation và thực hành triển khai Production.
4. Quay lại [Hệ thống kiến thức Cơ sở dữ liệu](../) để đặt vai trò của MongoDB cạnh MySQL, Redis và Elasticsearch để so sánh.

## Bài viết cốt lõi

- [Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 1)](./mongodb-questions-01.md): Bao gồm khái niệm cơ bản về MongoDB, mô hình Document, Collection, truy vấn, Index và các vấn đề thường gặp khi sử dụng.
- [Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 2)](./mongodb-questions-02.md): Bao gồm Replica Set, Sharding, Transaction, Aggregation, Read/Write Concern, Storage Engine và thực hành Production.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về kiến thức cơ bản NoSQL](../nosql.md): Giúp hiểu vị trí của MongoDB trong hệ sinh thái NoSQL, cũng như sự khác biệt với cơ sở dữ liệu Key-Value, Column-Family và Graph.

## Câu hỏi tần suất cao

- MongoDB và MySQL có gì khác nhau?
- Mô hình Document của MongoDB phù hợp với những kịch bản nghiệp vụ nào?
- MongoDB hỗ trợ những loại Index nào? Thiết kế Index như thế nào?
- Replica Set của MongoDB đảm bảo tính sẵn sàng cao bằng cách nào?
- Sharding của MongoDB giải quyết bài toán gì? Chọn Shard Key như thế nào?
- MongoDB có hỗ trợ Transaction không? Có phù hợp cho các kịch bản Transaction phức tạp không?
- Aggregation Pipeline của MongoDB phù hợp để giải quyết những bài toán nào?
- `read concern` và `write concern` lần lượt kiểm soát điều gì?
- Những kịch bản nào không phù hợp để sử dụng MongoDB?
- Vai trò của MongoDB, Redis và Elasticsearch khác nhau như thế nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Cơ sở dữ liệu](../)
- [Tổng hợp câu hỏi phỏng vấn thường gặp về kiến thức cơ bản NoSQL](../nosql.md)
- [Chuyên đề MySQL](../mysql/)
- [Chuyên đề Redis](../redis/)
