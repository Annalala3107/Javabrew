---
title: Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng NoSQL
description: Tổng hợp câu hỏi phỏng vấn và kiến thức nền tảng về cơ sở dữ liệu NoSQL, bao gồm sự khác biệt giữa NoSQL và SQL, ưu điểm của NoSQL, bốn loại cơ sở dữ liệu NoSQL (Key-Value, Document, Graph, Wide-Column) cùng kịch bản ứng dụng của các sản phẩm tiêu biểu như Redis, MongoDB, Neo4j.
category: Cơ sở dữ liệu
tag:
  - NoSQL
  - MongoDB
  - Redis
head:
  - - meta
    - name: keywords
      content: NoSQL,Redis,MongoDB,HBase,Cassandra,Key-Value Database,Document Database,Graph Database,Wide-Column Store,Sự khác biệt giữa SQL và NoSQL
lang: vi
sourceRef: zh-ref/database/nosql.md
---

## NoSQL là gì?

NoSQL (viết tắt của Not Only SQL) dùng để chỉ chung các cơ sở dữ liệu phi quan hệ (non-relational database), chủ yếu hướng tới lưu trữ dữ liệu dạng Key-Value, Document và Graph. Hơn nữa, cơ sở dữ liệu NoSQL hỗ trợ bẩm sinh tính phân tán, sao lưu dư thừa dữ liệu (data redundancy) và phân mảnh dữ liệu (data sharding), nhằm cung cấp giải pháp lưu trữ dữ liệu có khả năng mở rộng, tính sẵn sàng cao và hiệu năng cao.

Một hiểu lầm phổ biến là cơ sở dữ liệu NoSQL hoặc cơ sở dữ liệu phi quan hệ không thể lưu trữ tốt dữ liệu có quan hệ. Thực tế cơ sở dữ liệu NoSQL vẫn có thể lưu trữ dữ liệu quan hệ — chỉ là cách lưu trữ của chúng khác với cơ sở dữ liệu quan hệ.

Các cơ sở dữ liệu NoSQL tiêu biểu: HBase, Cassandra, MongoDB, Redis.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/sql-nosql-tushi-5c2e4f78.png)

## SQL và NoSQL khác nhau như thế nào?

|              | Cơ sở dữ liệu SQL                                                          | Cơ sở dữ liệu NoSQL                                                                                                                     |
| :----------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Mô hình lưu trữ dữ liệu | Lưu trữ có cấu trúc, dạng bảng với các hàng và cột cố định                 | Lưu trữ phi cấu trúc. Document: tài liệu JSON; Key-Value: cặp khóa-giá trị; Wide-Column: bảng gồm hàng và các cột động; Graph: nút (node) và cạnh (edge) |
| Lịch sử phát triển | Phát triển vào thập niên 1970, trọng tâm là giảm trùng lặp dữ liệu        | Phát triển vào cuối thập niên 2000, trọng tâm là nâng cao khả năng mở rộng và giảm chi phí lưu trữ dữ liệu quy mô lớn                    |
| Ví dụ        | Oracle, MySQL, Microsoft SQL Server, PostgreSQL                            | Document: MongoDB, CouchDB; Key-Value: Redis, DynamoDB; Wide-Column: Cassandra, HBase; Graph: Neo4j, Amazon Neptune, Giraph             |
| Thuộc tính ACID | Cung cấp các thuộc tính Atomicity, Consistency, Isolation và Durability (ACID) | Thường không hỗ trợ ACID Transaction nhằm đánh đổi lấy khả năng mở rộng và hiệu năng cao; số ít có hỗ trợ như MongoDB, tuy nhiên sự hỗ trợ ACID Transaction của MongoDB vẫn có điểm khác biệt so với MySQL |
| Hiệu năng    | Hiệu năng thường phụ thuộc vào hệ thống con đĩa cứng (disk subsystem). Để đạt hiệu năng tối ưu, thường cần tối ưu truy vấn, Index và cấu trúc bảng | Hiệu năng thường do kích thước Cluster phần cứng tầng dưới, độ trễ mạng và ứng dụng gọi đến quyết định                                   |
| Mở rộng      | Mở rộng theo chiều dọc (Scale Up - dùng máy chủ mạnh hơn), tách đọc/ghi, phân tách DB/bảng (Sharding) | Mở rộng theo chiều ngang (Scale Out - thêm máy chủ, thường dựa trên cơ chế Sharding)                                                    |
| Mục đích sử dụng | Lưu trữ dữ liệu cho các dự án doanh nghiệp thông thường                    | Ứng dụng đa dạng: chẳng hạn Graph Database hỗ trợ phân tích và duyệt mối quan hệ giữa dữ liệu liên kết; Key-Value Database xử lý mở rộng dữ liệu lớn và thay đổi trạng thái với tần suất cực cao |
| Cú pháp truy vấn | Ngôn ngữ truy vấn có cấu trúc (SQL)                                        | Cú pháp truy cập dữ liệu có thể khác nhau tùy từng cơ sở dữ liệu                                                                        |

## Cơ sở dữ liệu NoSQL có những ưu điểm gì?

Cơ sở dữ liệu NoSQL rất phù hợp với nhiều ứng dụng hiện đại như ứng dụng di động, Web và game — những hệ thống cần cơ sở dữ liệu linh hoạt, dễ mở rộng, hiệu năng cao và nhiều tính năng mạnh mẽ để mang lại trải nghiệm người dùng vượt trội.

- **Tính linh hoạt:** Cơ sở dữ liệu NoSQL thường cung cấp schema linh hoạt, giúp phát triển nhanh hơn và lặp lại (iterate) nhiều hơn. Mô hình dữ liệu linh hoạt khiến cơ sở dữ liệu NoSQL trở thành lựa chọn lý tưởng cho dữ liệu bán cấu trúc (semi-structured) và phi cấu trúc (unstructured).
- **Khả năng mở rộng:** Cơ sở dữ liệu NoSQL thường được thiết kế để mở rộng theo chiều ngang (Scale Out) thông qua cụm phần cứng phân tán, thay vì mở rộng theo chiều dọc bằng cách bổ sung máy chủ đắt tiền cấu hình mạnh.
- **Hiệu năng cao:** Cơ sở dữ liệu NoSQL được tối ưu riêng cho từng mô hình dữ liệu và mẫu truy cập (access pattern) cụ thể, nhờ đó đạt hiệu năng cao hơn so với việc cố gắng thực hiện chức năng tương tự trên cơ sở dữ liệu quan hệ.
- **Tính năng mạnh mẽ:** Cơ sở dữ liệu NoSQL cung cấp các API và kiểu dữ liệu mạnh mẽ được xây dựng chuyên biệt cho mô hình dữ liệu tương ứng của chúng.

## Cơ sở dữ liệu NoSQL có những loại nào?

Cơ sở dữ liệu NoSQL chủ yếu được chia thành bốn loại dưới đây:

- **Key-Value (Khóa - Giá trị):** Cơ sở dữ liệu Key-Value là loại cơ sở dữ liệu tương đối đơn giản, trong đó mỗi mục gồm một khóa (key) và một giá trị (value). Đây là loại cơ sở dữ liệu NoSQL cực kỳ linh hoạt vì ứng dụng có thể kiểm soát hoàn toàn nội dung lưu trong trường value mà không bị ràng buộc. Redis và DynamoDB là hai cơ sở dữ liệu Key-Value rất phổ biến.
- **Document (Tài liệu):** Dữ liệu trong cơ sở dữ liệu Document được lưu trữ dưới dạng tài liệu tương tự đối tượng JSON (JavaScript Object Notation), rất rõ ràng và trực quan. Mỗi tài liệu chứa các cặp trường và giá trị. Những giá trị này thường có thể thuộc nhiều kiểu khác nhau — bao gồm chuỗi, số, boolean, mảng hoặc đối tượng — và cấu trúc của chúng thường khớp với đối tượng mà lập trình viên sử dụng trong code. MongoDB là một cơ sở dữ liệu Document rất phổ biến.
- **Graph (Đồ thị):** Cơ sở dữ liệu Graph được thiết kế để dễ dàng xây dựng và vận hành các ứng dụng làm việc với tập dữ liệu có mức độ liên kết cao. Các kịch bản sử dụng điển hình gồm mạng xã hội, hệ thống gợi ý (recommendation engine), phát hiện gian lận (fraud detection) và đồ thị tri thức (knowledge graph). Neo4j và Giraph là hai cơ sở dữ liệu Graph rất phổ biến.
- **Wide-Column (Cột rộng):** Cơ sở dữ liệu lưu trữ dạng Wide-Column rất phù hợp khi cần lưu trữ khối lượng dữ liệu khổng lồ. Cassandra và HBase là hai cơ sở dữ liệu Wide-Column rất phổ biến.

Hình ảnh dưới đây được trích từ [Tài liệu chính thức của Microsoft | Dữ liệu quan hệ và dữ liệu NoSQL](https://learn.microsoft.com/en-us/dotnet/architecture/cloud-native/relational-vs-nosql-data).

![Mô hình dữ liệu NoSQL](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/types-of-nosql-datastores-acd3ac86.png)

## Tài liệu tham khảo

- NoSQL là gì? - Tài liệu chính thức MongoDB: <https://www.mongodb.com/zh-cn/nosql-explained>
- NoSQL là gì? - AWS: <https://aws.amazon.com/cn/nosql/>
- NoSQL vs. SQL Databases - Tài liệu chính thức MongoDB: <https://www.mongodb.com/zh-cn/nosql-explained/nosql-vs-sql>
