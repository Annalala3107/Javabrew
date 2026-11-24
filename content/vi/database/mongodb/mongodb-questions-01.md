---
title: "Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 1)"
description: "Phần 1 tổng hợp câu hỏi phỏng vấn MongoDB thường gặp, giải thích chi tiết các kiến thức cốt lõi như khái niệm cơ bản về MongoDB, cấu trúc lưu trữ, kiểu dữ liệu, tính sẵn sàng cao với Replica Set và mở rộng ngang bằng Sharded Cluster để hỗ trợ chuẩn bị phỏng vấn Backend."
category: Cơ sở dữ liệu
tag:
  - NoSQL
  - MongoDB
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn MongoDB,Document Database,BSON,Replica Set,Sharded Cluster,MongoDB Index,WiredTiger,Aggregation Pipeline
lang: vi
sourceRef: zh-ref/database/mongodb/mongodb-questions-01.md
---

> Một phần nhỏ nội dung có tham khảo mô tả từ tài liệu chính thức của MongoDB, xin được ghi chú tại đây.

## Kiến thức cơ bản về MongoDB

### MongoDB là gì?

MongoDB là một hệ quản trị cơ sở dữ liệu NoSQL mã nguồn mở dựa trên **lưu trữ tệp phân tán**, được viết bằng **C++**. MongoDB cung cấp phương thức lưu trữ **hướng tài liệu (document-oriented)**, thao tác tương đối đơn giản và dễ dàng, hỗ trợ mô hình hóa dữ liệu "**phi lược đồ (schema-less)**", có thể lưu trữ các kiểu dữ liệu tương đối phức tạp và là một **Document Database (cơ sở dữ liệu hướng tài liệu)** rất phổ biến.

Trong điều kiện tải cao, MongoDB hỗ trợ tự nhiên khả năng mở rộng ngang (Horizontal Scaling) và tính sẵn sàng cao (High Availability), cho phép dễ dàng bổ sung thêm nhiều node/instance để đảm bảo hiệu năng và độ sẵn sàng của dịch vụ. Trong nhiều kịch bản, MongoDB có thể thay thế cơ sở dữ liệu quan hệ truyền thống hoặc hệ thống lưu trữ Key-Value, nhằm cung cấp giải pháp lưu trữ dữ liệu có khả năng mở rộng, sẵn sàng cao và hiệu năng cao cho các ứng dụng Web.

### Cấu trúc lưu trữ của MongoDB là gì?

Cấu trúc lưu trữ của MongoDB khác với cơ sở dữ liệu quan hệ truyền thống, chủ yếu gồm ba thành phần sau:

- **Document (Tài liệu)**: Đơn vị cơ bản nhất trong MongoDB, gồm các cặp khóa-giá trị (key-value) dạng BSON, tương tự như một dòng (Row) trong cơ sở dữ liệu quan hệ.
- **Collection (Tập hợp)**: Một Collection có thể chứa nhiều Document, tương tự như một bảng (Table) trong cơ sở dữ liệu quan hệ.
- **Database (Cơ sở dữ liệu)**: Một Database có thể chứa nhiều Collection, và bạn có thể tạo nhiều Database trong MongoDB, tương tự như một Database trong cơ sở dữ liệu quan hệ.

Nói cách khác, MongoDB lưu trữ các bản ghi dữ liệu dưới dạng Document (cụ thể hơn là [BSON Document](https://www.mongodb.com/docs/manual/core/document/#std-label-bson-document-format)), các Document này được tập hợp lại trong các Collection, và một Database lưu trữ một hoặc nhiều Collection chứa Document.

**So sánh thuật ngữ phổ biến giữa SQL và MongoDB**:

| SQL                              | MongoDB                                |
| -------------------------------- | -------------------------------------- |
| Bảng (`Table`)                   | Tập hợp (`Collection`)                 |
| Dòng (`Row`)                     | Tài liệu (`Document`)                  |
| Cột (`Col`)                      | Trường (`Field`)                       |
| Khóa chính (`Primary Key`)       | Object ID (`ObjectId`)                 |
| Chỉ mục (`Index`)                | Chỉ mục (`Index`)                      |
| Bảng lồng nhau (`Embedded Table`)| Tài liệu nhúng (`Embedded Document`)   |
| Mảng (`Array`)                   | Mảng (`Array`)                         |

#### Document

Bản ghi trong MongoDB chính là một BSON Document — một cấu trúc dữ liệu gồm các cặp key-value, tương tự đối tượng JSON và là đơn vị dữ liệu cơ bản trong MongoDB. Giá trị của một trường có thể bao gồm các Document khác, mảng (Array) và mảng các Document.

![MongoDB Document](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/crud-annotated-document.-b917150e.png)

Khóa (key) của Document là chuỗi (String). Ngoại trừ một vài trường hợp ngoại lệ, khóa có thể sử dụng bất kỳ ký tự UTF-8 nào:

- Khóa không được chứa `\0` (ký tự null). Ký tự này dùng để biểu thị kết thúc của khóa.
- `.` và `$` mang ý nghĩa đặc biệt và chỉ được sử dụng trong những ngữ cảnh nhất định.
- Các khóa bắt đầu bằng dấu gạch dưới `_` là các khóa dành riêng (dù không bắt buộc nghiêm ngặt).

**BSON [bee·sahn]** là viết tắt của Binary [JSON](http://json.org/), là biểu diễn nhị phân của các JSON Document, hỗ trợ nhúng Document và mảng vào bên trong các Document và mảng khác, đồng thời bổ sung các phần mở rộng cho phép biểu diễn những kiểu dữ liệu không thuộc đặc tả JSON. Về đặc tả BSON, bạn có thể tham khảo [bsonspec.org](http://bsonspec.org/), xem thêm [BSON Types](https://www.mongodb.com/docs/manual/reference/bson-types/).

Theo giới thiệu của Wikipedia về BSON, tốc độ duyệt của BSON nhanh hơn JSON — đây cũng là lý do chính khiến MongoDB lựa chọn BSON, nhưng BSON cần nhiều không gian lưu trữ hơn.

> So với JSON, BSON chú trọng vào việc nâng cao hiệu quả lưu trữ và quét dữ liệu. Các phần tử lớn trong BSON Document được gắn tiền tố là trường độ dài để thuận tiện cho việc quét. Trong một số trường hợp, do có tiền tố độ dài và chỉ mục mảng tường minh, BSON sử dụng nhiều không gian hơn JSON.

![Trang chủ chính thức của BSON](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/bsonspec.org-d1a3c1dd.png)

#### Collection

Collection của MongoDB tồn tại trong Database và **không có cấu trúc cố định**, tức là **phi lược đồ (schema-less)**, nghĩa là bạn có thể chèn dữ liệu có định dạng và kiểu khác nhau vào cùng một Collection. Tuy nhiên, thông thường dữ liệu được chèn vào một Collection vẫn có sự liên quan nhất định với nhau.

![MongoDB Collection](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/crud-annotated-collection-b60932eb.png)

Collection không cần phải được tạo trước; khi Document đầu tiên được chèn vào hoặc Index đầu tiên được tạo, nếu Collection đó chưa tồn tại, một Collection mới sẽ tự động được tạo ra.

Tên Collection có thể là bất kỳ chuỗi UTF-8 nào đáp ứng các điều kiện sau:

- Tên Collection không được là chuỗi rỗng `""`.
- Tên Collection không được chứa `\0` (ký tự null), vì ký tự này biểu thị điểm kết thúc tên Collection.
- Tên Collection không được bắt đầu bằng `"system."` — đây là tiền tố dành riêng cho các Collection hệ thống. Ví dụ, Collection `system.users` lưu thông tin người dùng của Database, còn Collection `system.namespaces` lưu thông tin về tất cả Collection trong Database.
- Tên Collection phải bắt đầu bằng dấu gạch dưới hoặc ký tự chữ cái và không được chứa `$`.

#### Database

Database dùng để lưu trữ tất cả Collection, còn Collection dùng để lưu trữ tất cả Document. Trong một MongoDB có thể tạo nhiều Database, mỗi Database có Collection và quyền hạn riêng.

MongoDB dành riêng một số Database đặc biệt sau:

- **admin**: Database `admin` chủ yếu lưu trữ người dùng root và vai trò (Role). Ví dụ: `system.users` lưu người dùng, `system.roles` lưu vai trò. Thông thường không khuyến nghị người dùng thao tác trực tiếp lên Database này. Khi thêm một người dùng vào Database này và cấp quyền vai trò `dbAdminAnyDatabase` trên `admin`, người dùng đó sẽ tự động kế thừa quyền trên tất cả Database. Một số lệnh phía server nhất định cũng chỉ có thể chạy từ Database này, chẳng hạn lệnh tắt server.
- **local**: Database `local` không bao giờ được sao chép (replicate) sang các Shard khác, do đó có thể dùng để lưu bất kỳ Collection cục bộ nào của một server đơn lẻ. Thông thường không khuyến nghị người dùng lưu trực tiếp dữ liệu nào vào `local` hoặc thực hiện các thao tác CRUD trên đó, vì dữ liệu không thể sao lưu và khôi phục một cách bình thường.
- **config**: Khi MongoDB sử dụng cấu hình Sharding, Database `config` dùng để lưu các thông tin liên quan đến Sharding.
- **test**: Database thử nghiệm được tạo mặc định. Khi kết nối đến dịch vụ [mongod](https://mongoing.com/docs/reference/program/mongod.html), nếu không chỉ định cụ thể Database cần kết nối, mặc định sẽ kết nối tới Database `test`.

Tên Database có thể là bất kỳ chuỗi UTF-8 nào thỏa mãn các điều kiện sau:

- Không được là chuỗi rỗng `""`.
- Không được chứa `' '` (khoảng trắng), `.`, `$`, `/`, `\` và `\0` (ký tự null).
- Nên viết hoàn toàn bằng chữ thường.
- Tối đa 64 byte.

Tên Database cuối cùng sẽ trở thành tên tệp trong hệ thống tệp (filesystem), đó cũng là lý do có nhiều ràng buộc đến vậy.

### MongoDB có những đặc điểm gì?

- **Bản ghi dữ liệu được lưu trữ dưới dạng Document**: Bản ghi trong MongoDB là một BSON Document — cấu trúc dữ liệu gồm các cặp key-value tương tự đối tượng JSON, là đơn vị dữ liệu cơ bản của MongoDB.
- **Phi lược đồ (Schema-free)**: Khái niệm Collection tương tự như Table trong MySQL, nhưng không cần định nghĩa bất kỳ lược đồ nào và có thể biểu diễn các đối tượng mô hình miền (Domain Model) phức tạp bằng ít đối tượng dữ liệu hơn.
- **Hỗ trợ nhiều cách thức truy vấn**: API truy vấn của MongoDB hỗ trợ các thao tác đọc/ghi (CRUD), tổng hợp dữ liệu (Aggregation), tìm kiếm văn bản (Text Search) và truy vấn không gian địa lý (Geospatial Query).
- **Hỗ trợ ACID Transaction**: Cơ sở dữ liệu NoSQL thường không hỗ trợ Transaction nhằm đánh đổi lấy khả năng mở rộng và hiệu năng cao. Tuy nhiên vẫn có ngoại lệ, và MongoDB có hỗ trợ Transaction. Giống như cơ sở dữ liệu quan hệ, Transaction của MongoDB cũng có đầy đủ đặc tính ACID. MongoDB hỗ trợ sẵn tính nguyên tử (Atomicity) trên từng Document đơn lẻ, vốn đã mang đặc tính của Transaction. MongoDB 4.0 bổ sung hỗ trợ Multi-Document Transaction, nhưng chỉ hỗ trợ trong mô hình triển khai Replica Set, tức phạm vi Transaction bị giới hạn trong một Replica Set. MongoDB 4.2 giới thiệu Distributed Transaction, bổ sung hỗ trợ Multi-Document Transaction trên Sharded Cluster và hợp nhất với hỗ trợ Multi-Document Transaction hiện có trên Replica Set.
- **Lưu trữ nhị phân hiệu quả**: Các Document lưu trong Collection tồn tại dưới dạng cặp key-value. Key dùng để định danh duy nhất một Document (thường có kiểu `ObjectId`), còn Value tồn tại ở định dạng BSON. BSON = Binary JSON, là định dạng bổ sung thêm thông tin kiểu dữ liệu và mô tả metadata dựa trên JSON.
- **Tích hợp sẵn tính năng nén dữ liệu**: Cần ít tài nguyên hơn để lưu trữ cùng một lượng dữ liệu.
- **Hỗ trợ Map-Reduce**: Hoàn thành các tác vụ tổng hợp phức tạp theo cách chia để trị. Tuy nhiên, từ MongoDB 5.0 trở đi, Map-Reduce không còn được khuyến nghị chính thức nữa; giải pháp thay thế là [Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/). Aggregation Pipeline mang lại hiệu năng và tính dễ sử dụng tốt hơn Map-Reduce.
- **Hỗ trợ nhiều loại Index**: MongoDB hỗ trợ nhiều loại Index gồm Single Field Index, Compound Index, Multikey Index, Hashed Index, Text Index, Geospatial Index,... mỗi loại phù hợp với từng kịch bản sử dụng khác nhau.
- **Hỗ trợ Failover**: Cung cấp khả năng khôi phục sự cố tự động; khi node Primary gặp sự cố, hệ thống tự động bầu chọn một node Primary mới từ các node Secondary để đảm bảo cụm tiếp tục hoạt động bình thường một cách trong suốt đối với client.
- **Hỗ trợ Sharded Cluster**: MongoDB hỗ trợ tự động phân mảnh dữ liệu trên cụm, giúp cụm lưu trữ được nhiều dữ liệu hơn và đạt hiệu năng mạnh mẽ hơn. Khi chèn và cập nhật dữ liệu, hệ thống có thể tự động định tuyến và lưu trữ.
- **Hỗ trợ lưu trữ tệp lớn**: Dung lượng tối đa của một Document đơn lẻ trong MongoDB là 16 MB. Đối với các tệp lớn hơn 16 MB, MongoDB cung cấp GridFS để lưu trữ; thông qua GridFS, dữ liệu lớn sẽ được chia thành từng khối nhỏ (chunk) rồi lưu các Document nhỏ sau khi chia này vào cơ sở dữ liệu.

### MongoDB phù hợp với những kịch bản ứng dụng nào?

**Ưu thế của MongoDB nằm ở tính linh hoạt của mô hình dữ liệu và Storage Engine, khả năng mở rộng của kiến trúc cũng như sự hỗ trợ mạnh mẽ về Index.**

Khi cân nhắc chọn MongoDB, cần đánh giá đầy đủ các ưu thế của nó kết hợp với nhu cầu thực tế của dự án:

- Cùng với sự phát triển của dự án, việc lưu trữ dữ liệu theo định dạng giống JSON (BSON) có đáp ứng được nhu cầu dự án hay không? Bản ghi trong MongoDB là một BSON Document gồm các cặp key-value tương tự đối tượng JSON và là đơn vị dữ liệu cơ bản của MongoDB.
- Có cần lưu trữ khối lượng dữ liệu lớn hay cần mở rộng ngang nhanh chóng không? MongoDB hỗ trợ Sharded Cluster, giúp dễ dàng bổ sung thêm các node (instance) để cụm lưu trữ nhiều dữ liệu hơn và đạt hiệu năng cao hơn.
- Có cần nhiều loại Index hơn để đáp ứng nhiều kịch bản ứng dụng khác nhau không? MongoDB hỗ trợ nhiều loại Index gồm Single Field Index, Compound Index, Multikey Index, Hashed Index, Text Index, Geospatial Index,... mỗi loại có ngữ cảnh sử dụng riêng.
- ……

## Storage Engine của MongoDB

### MongoDB hỗ trợ những Storage Engine nào?

Storage Engine là thành phần cốt lõi của cơ sở dữ liệu, chịu trách nhiệm quản lý cách thức dữ liệu được lưu trữ trong bộ nhớ và trên đĩa.

Giống như MySQL, MongoDB cũng áp dụng **kiến trúc Storage Engine dạng plugin (pluggable)**, hỗ trợ nhiều loại Storage Engine khác nhau để giải quyết các bài toán trong từng kịch bản khác nhau. Khi tạo Database hoặc Collection, bạn có thể chỉ định Storage Engine.

> Kiến trúc Storage Engine dạng plugin giúp tách rời tầng Server và tầng Storage Engine, cho phép hỗ trợ nhiều Storage Engine — chẳng hạn MySQL vừa có thể hỗ trợ Storage Engine InnoDB dùng cấu trúc B-Tree, vừa có thể hỗ trợ Storage Engine RocksDB dùng cấu trúc LSM.

Khi Storage Engine mới ra đời, mặc định sử dụng MMAPv1; từ phiên bản MongoDB 4.x trở đi không còn hỗ trợ MMAPv1 Storage Engine nữa.

Hiện nay chủ yếu có hai Storage Engine sau:

- **WiredTiger Storage Engine**: Kể từ MongoDB 3.2 trở đi, Storage Engine mặc định là [WiredTiger Storage Engine](https://www.mongodb.com/docs/manual/core/wiredtiger/). Rất phù hợp với hầu hết các khối lượng công việc (workload) và được khuyến nghị cho các triển khai mới. WiredTiger cung cấp các tính năng như mô hình đồng thời ở mức Document (document-level concurrency), Checkpoint và nén dữ liệu (sẽ trình bày ở phần sau).
- **In-Memory Storage Engine**: [In-Memory Storage Engine](https://www.mongodb.com/docs/manual/core/inmemory/) có sẵn trong MongoDB Enterprise. Thay vì lưu Document trên đĩa, nó giữ chúng trong bộ nhớ để đạt độ trễ dữ liệu có tính dự đoán cao hơn.

Ngoài ra, MongoDB 3.0 cung cấp **Pluggable Storage Engine API**, cho phép bên thứ ba phát triển Storage Engine cho MongoDB — điểm này cũng khá giống MySQL.

### WiredTiger dựa trên LSM Tree hay B+ Tree?

Hiện nay, đại đa số Storage Engine của các cơ sở dữ liệu phổ biến đều được triển khai dựa trên B/B+ Tree hoặc LSM (Log-Structured Merge) Tree. Đối với cơ sở dữ liệu NoSQL, phần lớn (như HBase, Cassandra, RocksDB) đều dựa trên LSM Tree, nhưng MongoDB lại hơi khác.

Như đã đề cập ở trên, từ MongoDB 3.2 trở đi, Storage Engine mặc định là WiredTiger. Trên trang web chính thức của WiredTiger, chúng ta có thể thấy WiredTiger sử dụng B+ Tree làm cấu trúc lưu trữ của mình:

```plain
WiredTiger maintains a table's data in memory using a data structure called a B-Tree ( B+ Tree to be specific), referring to the nodes of a B-Tree as pages. Internal pages carry only keys. The leaf pages store both keys and values.
```

Ngoài ra, WiredTiger cũng hỗ trợ [LSM (Log-Structured Merge)](https://source.wiredtiger.com/3.1.0/lsm.html) Tree làm cấu trúc lưu trữ, nhưng khi MongoDB dùng WiredTiger làm Storage Engine thì mặc định sử dụng B+ Tree.

Nếu muốn tìm hiểu lý do MongoDB sử dụng B+ Tree, bạn có thể xem bài viết này: [[Phản bác văn mẫu phỏng vấn] Đừng đoán mò nữa, MongoDB dùng B+ Tree, không phải B-Tree như bạn nghĩ](https://zhuanlan.zhihu.com/p/519658576).

Khi sử dụng B+ Tree, WiredTiger đọc/ghi dữ liệu xuống đĩa theo đơn vị cơ bản là **page**. Mỗi node của B+ Tree là một page, gồm có ba loại page:

- **root page (node gốc)**: Node gốc của B+ Tree.
- **internal page (node trung gian)**: Node chỉ mục trung gian không lưu trữ dữ liệu thực tế.
- **leaf page (node lá)**: Node lá thực sự lưu trữ dữ liệu, bao gồm page header (đầu trang), block header (đầu khối) và dữ liệu thực (key/value). Trong đó, page header định nghĩa các thông tin như loại page, kích thước payload thực tế trong page, số lượng bản ghi trong page; block header định nghĩa các thông tin như checksum của page và vị trí định địa chỉ của block trên đĩa.

Cấu trúc tổng thể của nó được minh họa như hình dưới đây:

![Cấu trúc tổng thể B+ Tree của WiredTiger](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongodb-b-plus-tree-integral-structure-387883ed.jpg)

Nếu muốn nghiên cứu sâu hơn về WiredTiger Storage Engine, khuyến nghị đọc chuỗi bài [WiredTiger Storage Engine Series](https://mongoing.com/archives/category/wiredtiger%e5%ad%98%e5%82%a8%e5%bc%95%e6%93%8e%e7%b3%bb%e5%88%97) của cộng đồng MongoDB Trung Quốc.

## Aggregation trong MongoDB

### Aggregation trong MongoDB dùng để làm gì?

Trong các dự án thực tế, chúng ta thường cần tổng hợp nhiều Document hoặc thậm chí nhiều Collection lại với nhau để tính toán và phân tích (ví dụ tính tổng, lấy giá trị lớn nhất) rồi trả về kết quả sau tính toán — quá trình này được gọi là **thao tác Aggregation (tổng hợp)**.

Theo giới thiệu từ tài liệu chính thức, chúng ta có thể dùng thao tác Aggregation để:

- Kết hợp giá trị từ nhiều Document lại với nhau.
- Thực hiện một loạt phép toán trên dữ liệu trong Collection.
- Phân tích sự thay đổi của dữ liệu theo thời gian.

### MongoDB cung cấp những phương thức nào để thực hiện Aggregation?

MongoDB cung cấp hai phương thức để thực hiện Aggregation:

- **Aggregation Pipeline (Đường ống tổng hợp)**: Phương thức ưu tiên hàng đầu để thực hiện các thao tác tổng hợp.
- **Single Purpose Aggregation Methods (Phương thức tổng hợp mục đích đơn)**: Tức các hàm tổng hợp có một chức năng cụ thể như `count()`, `distinct()`, `estimatedDocumentCount()`.

Phần lớn các bài viết còn nhắc đến **map-reduce** như một phương thức tổng hợp. Tuy nhiên, từ MongoDB 5.0 trở đi, map-reduce không còn được khuyến nghị chính thức nữa; giải pháp thay thế là [Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/). Aggregation Pipeline mang lại hiệu năng và tính dễ sử dụng tốt hơn map-reduce.

Aggregation Pipeline của MongoDB gồm nhiều giai đoạn (Stage), mỗi giai đoạn sẽ biến đổi các Document khi chúng đi qua đường ống. Mỗi giai đoạn nhận đầu ra từ giai đoạn trước, xử lý dữ liệu tiếp và gửi kết quả làm đầu vào cho giai đoạn kế tiếp.

Quy trình làm việc của mỗi Pipeline gồm:

1. Tiếp nhận một loạt Document dữ liệu thô
2. Thực hiện một chuỗi phép toán trên các Document này
3. Xuất Document kết quả cho giai đoạn tiếp theo

![Quy trình làm việc của Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongodb-aggregation-stage-a09e1e52.png)

**Các toán tử giai đoạn (Stage Operator) thường dùng**:

| Toán tử   | Mô tả ngắn gọn                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| \$match   | Toán tử lọc, dùng để sàng lọc tập Document                                                                                      |
| \$project | Toán tử chiếu (projection), dùng để tái cấu trúc trường của từng Document: trích xuất trường, đổi tên hoặc tạo trường mới từ biểu thức |
| \$sort    | Toán tử sắp xếp, dùng để sắp xếp Document theo một hoặc nhiều trường                                                           |
| \$limit   | Toán tử giới hạn, dùng để giới hạn số lượng Document trả về                                                                     |
| \$skip    | Toán tử bỏ qua, dùng để bỏ qua một số lượng Document chỉ định                                                                   |
| \$count   | Toán tử đếm, dùng để thống kê số lượng Document                                                                                 |
| \$group   | Toán tử gom nhóm, dùng để gom nhóm tập Document                                                                                 |
| \$unwind  | Toán tử tách mảng, dùng để tách từng phần tử trong mảng thành các Document riêng lẻ                                             |
| \$lookup  | Toán tử kết nối (join), dùng để kết nối với một Collection khác trong cùng Database và lấy Document chỉ định, tương tự `populate` |

Xem thêm giới thiệu các toán tử khác tại tài liệu chính thức: <https://docs.mongodb.com/manual/reference/operator/aggregation/>

Các toán tử giai đoạn được sử dụng ở lớp đầu tiên bên trong tham số mảng của phương thức `db.collection.aggregate`.

```sql
db.collection.aggregate( [ { <toán tử giai đoạn>: <biểu thức> }, { <toán tử giai đoạn>: <biểu thức> }, ... ] )
```

Dưới đây là một ví dụ trong tài liệu chính thức của MongoDB:

```sql
db.orders.aggregate([
   # Giai đoạn 1: Giai đoạn $match lọc các document theo trường status và chuyển các document có status bằng "A" sang giai đoạn tiếp theo.
    { $match: { status: "A" } },
  # Giai đoạn 2: Giai đoạn $group nhóm các document theo trường cust_id để tính tổng amount cho mỗi giá trị cust_id duy nhất.
    { $group: { _id: "$cust_id", total: { $sum: "$amount" } } }
])
```

## Transaction trong MongoDB

> Để hiểu thấu đáo nguyên lý Transaction của MongoDB cần tốn khá nhiều thời gian, bản thân tôi cũng chưa nắm thật sâu hết mọi chi tiết. Vì vậy ở đây tôi chỉ giới thiệu sơ lược về Transaction trong MongoDB; những bạn muốn tìm hiểu sâu về nguyên lý có thể tự tìm kiếm và tham khảo thêm tài liệu liên quan.
>
> Dưới đây xin gợi ý vài bài viết để mọi người tham khảo:
>
> - [Bài viết chuyên sâu | Nguyên lý Transaction của MongoDB](https://mongoing.com/archives/82187)
> - [Thiết kế và triển khai mô hình nhất quán của MongoDB](https://developer.aliyun.com/article/782494)
> - [Tài liệu chính thức của MongoDB giới thiệu về Transaction](https://www.mongodb.com/docs/upcoming/core/transactions/)

Khi giới thiệu về dữ liệu NoSQL chúng ta cũng đã nói, các cơ sở dữ liệu NoSQL thường không hỗ trợ Transaction nhằm đánh đổi lấy khả năng mở rộng và hiệu năng cao. Tuy nhiên vẫn có ngoại lệ, và MongoDB hỗ trợ Transaction.

Giống như cơ sở dữ liệu quan hệ, Transaction trong MongoDB cũng có các đặc tính ACID:

- **Atomicity (Tính nguyên tử)**: Transaction là đơn vị thực thi nhỏ nhất, không cho phép chia cắt. Tính nguyên tử đảm bảo các hành động hoặc hoàn thành toàn bộ, hoặc hoàn toàn không có tác dụng gì.
- **Consistency (Tính nhất quán)**: Trước và sau khi thực thi Transaction, dữ liệu luôn giữ trạng thái nhất quán; ví dụ trong nghiệp vụ chuyển tiền, bất kể Transaction thành công hay thất bại, tổng số tiền của người chuyển và người nhận phải không đổi.
- **Isolation (Tính cô lập)**: Khi truy cập cơ sở dữ liệu đồng thời, Transaction của một người dùng không bị can thiệp bởi các Transaction khác, các Transaction đồng thời độc lập với nhau trên cơ sở dữ liệu. Storage Engine WiredTiger hỗ trợ các mức cô lập `read-uncommitted`, `read-committed` và `snapshot`, trong đó MongoDB mặc định chọn `snapshot` isolation khi khởi động. Ở các mức cô lập khác nhau, trong vòng đời của một Transaction có thể xảy ra các hiện tượng như Dirty Read, Non-Repeatable Read hoặc Phantom Read.
- **Durability (Tính bền vững)**: Sau khi một Transaction được commit, các thay đổi của nó đối với dữ liệu trong cơ sở dữ liệu là vĩnh viễn, ngay cả khi cơ sở dữ liệu gặp sự cố cũng không bị ảnh hưởng.

Tôi sẽ không nói quá nhiều về chi tiết Transaction trong bài viết này; nếu quan tâm bạn có thể xem bài viết [Tổng hợp câu hỏi phỏng vấn MySQL thường gặp](../mysql/mysql-questions-01.md) do tôi viết, trong đó có trình bày rất chi tiết.

MongoDB hỗ trợ sẵn tính nguyên tử trên từng Document đơn lẻ, vốn cũng mang đặc tính của Transaction. Khi nhắc đến Transaction trong MongoDB, thông thường người ta đang nói đến **Multi-Document Transaction (Transaction đa tài liệu)**. MongoDB 4.0 bổ sung hỗ trợ Multi-Document ACID Transaction, nhưng chỉ hỗ trợ trong mô hình triển khai Replica Set, tức phạm vi Transaction bị giới hạn trong một Replica Set. MongoDB 4.2 giới thiệu **Distributed Transaction (Transaction phân tán)**, bổ sung hỗ trợ Multi-Document Transaction trên Sharded Cluster và hợp nhất với hỗ trợ Multi-Document Transaction hiện có trên Replica Set.

Theo giới thiệu của tài liệu chính thức:

> Kể từ MongoDB 4.2, Distributed Transaction và Multi-Document Transaction trong MongoDB mang cùng một ý nghĩa. Distributed Transaction chỉ Multi-Document Transaction trên Sharded Cluster và Replica Set. Từ MongoDB 4.2 trở đi, Multi-Document Transaction (dù trên Sharded Cluster hay Replica Set) đều được gọi là Distributed Transaction.

Trong phần lớn trường hợp, Multi-Document Transaction tạo ra chi phí hiệu năng lớn hơn so với thao tác ghi trên một Document đơn lẻ. Đối với đa số kịch bản, [mô hình dữ liệu phi chuẩn hóa (Embedded Document và Array)](https://www.mongodb.com/docs/upcoming/core/data-model-design/#std-label-data-modeling-embedding) vẫn là lựa chọn tối ưu nhất. Nói cách khác, thiết kế mô hình dữ liệu phù hợp có thể giảm thiểu tối đa nhu cầu dùng Multi-Document Transaction.

**Lưu ý**:

- Từ MongoDB 4.2 trở đi, Multi-Document Transaction hỗ trợ cả Replica Set và Sharded Cluster, trong đó node Primary sử dụng WiredTiger Storage Engine còn các node Secondary sử dụng WiredTiger hoặc In-Memory Storage Engine. Ở MongoDB 4.0, chỉ Replica Set sử dụng WiredTiger Storage Engine mới hỗ trợ Transaction.
- Trong MongoDB 4.2 trở về trước, bạn không thể tạo Collection bên trong một Transaction. Từ MongoDB 4.4 trở đi, bạn có thể tạo Collection và Index trong Transaction. Để biết chi tiết, xem [Create Collections and Indexes in a Transaction](https://www.mongodb.com/docs/upcoming/core/transactions/#std-label-transactions-create-collections-indexes).

## Nén dữ liệu trong MongoDB

Nhờ WiredTiger Storage Engine (Storage Engine mặc định từ MongoDB 3.2), MongoDB hỗ trợ nén toàn bộ Collection và Index. Việc nén giúp giảm thiểu tối đa dung lượng lưu trữ với cái giá là tiêu tốn thêm CPU.

Mặc định, WiredTiger sử dụng thuật toán nén [Snappy](https://github.com/google/snappy) (mã nguồn mở của Google, hướng tới tốc độ rất cao cùng tỷ lệ nén hợp lý từ 3–5 lần) để nén theo khối (block compression) cho tất cả Collection và nén tiền tố (prefix compression) cho tất cả Index.

Ngoài Snappy, đối với Collection còn có các thuật toán nén sau:

- [zlib](https://github.com/madler/zlib): Thuật toán nén mức cao, tỷ lệ nén 5–7 lần.
- [Zstandard](https://github.com/facebook/zstd) (viết tắt `zstd`): Thuật toán nén không mất dữ liệu tốc độ nhanh do Facebook mã nguồn mở, hướng tới các kịch bản nén thời gian thực mức zlib với tỷ lệ nén tốt hơn và mức sử dụng CPU thấp hơn, khả dụng từ MongoDB 4.2.

Journal của WiredTiger cũng được nén và mặc định cũng dùng thuật toán nén Snappy. Nếu bản ghi Journal nhỏ hơn hoặc bằng 128 byte, WiredTiger sẽ không nén bản ghi đó.

## Sự khác biệt giữa Amazon DocumentDB và MongoDB

Amazon DocumentDB (tương thích với MongoDB) là một dịch vụ cơ sở dữ liệu nhanh, đáng tin cậy và được quản lý hoàn toàn (fully managed). Amazon DocumentDB giúp dễ dàng thiết lập, vận hành và mở rộng cơ sở dữ liệu tương thích MongoDB trên đám mây.

### Toán tử `$vectorSearch`

Amazon DocumentDB không hỗ trợ `$vectorSearch` như một toán tử độc lập. Thay vào đó, `vectorSearch` được hỗ trợ bên trong toán tử `$search`. Để biết thêm thông tin, xem [Vector Search trên Amazon DocumentDB](https://docs.aws.amazon.com/zh_cn/documentdb/latest/developerguide/vector-search.html).

### `OpCountersCommand`

Hành vi của `OpCountersCommand` trong Amazon DocumentDB khác với `opcounters.command` của MongoDB như sau:

- `opcounters.command` của MongoDB tính tất cả các lệnh ngoại trừ insert, update và delete, trong khi `OpCountersCommand` của Amazon DocumentDB còn loại trừ cả lệnh `find`.
- Amazon DocumentDB tính cả các lệnh nội bộ (ví dụ `getCloudWatchMetricsV2`) vào `OpCountersCommand`.

### Database và Collection hệ thống (`admin` và `local`)

Amazon DocumentDB không hỗ trợ Database `admin` hoặc `local`, và cũng không hỗ trợ các Collection `system.*` hay `startup_log` của MongoDB.

### `cursor.maxTimeMS`

Trong Amazon DocumentDB, `cursor.maxTimeMS` đặt lại bộ đếm cho từng yêu cầu `getMore`. Do đó, nếu chỉ định `maxTimeMS` là 3000 ms, truy vấn ban đầu mất 2800 ms và mỗi yêu cầu `getMore` tiếp theo mất 300 ms thì con trỏ (cursor) sẽ không bị timeout. Con trỏ chỉ bị timeout khi một thao tác đơn lẻ (truy vấn ban đầu hoặc một yêu cầu `getMore` riêng lẻ) mất nhiều thời gian hơn giá trị `maxTimeMS` đã chỉ định. Ngoài ra, bộ quét kiểm tra thời gian thực thi của con trỏ chạy theo chu kỳ năm (5) phút.

### `explain()`

Amazon DocumentDB mô phỏng API MongoDB 4.0 trên một engine cơ sở dữ liệu chuyên dụng sử dụng hệ thống lưu trữ phân tán, chịu lỗi và tự phục hồi. Vì vậy, kế hoạch truy vấn (query plan) và đầu ra của `explain()` có thể khác nhau giữa Amazon DocumentDB và MongoDB. Người dùng muốn kiểm soát kế hoạch truy vấn có thể sử dụng toán tử `$hint` để ép buộc chọn Index mong muốn.

### Giới hạn tên trường

Amazon DocumentDB không hỗ trợ dấu chấm `.` trong tên trường của Document, ví dụ: `db.foo.insert({‘x.1’:1})`.

Amazon DocumentDB cũng không hỗ trợ tiền tố `$` trong tên trường.

Ví dụ, hãy thử chạy lệnh sau trong Amazon DocumentDB hoặc MongoDB:

```shell
rs0:PRIMARY< db.foo.insert({"a":{"$a":1}})
```

MongoDB sẽ trả về kết quả sau:

```shell
WriteResult({ "nInserted" : 1 })
```

Amazon DocumentDB sẽ trả về lỗi:

```shell
WriteResult({
  "nInserted" : 0,
  "writeError" : {
    "code" : 2,
    "errmsg" : "Document can't have $ prefix field names: $a"
  }
})
```

## Tài liệu tham khảo

- Tài liệu chính thức MongoDB (nguồn tham khảo chính, lấy tài liệu chính thức làm chuẩn): <https://www.mongodb.com/docs/manual/>
- *MongoDB: The Definitive Guide* (*MongoDB Quyền Uy Chỉ Nam*)
- Bài viết chuyên sâu | Nguyên lý Transaction của MongoDB - Cộng đồng MongoDB Trung Quốc: <https://mongoing.com/archives/82187>
- Transactions - Tài liệu chính thức MongoDB: <https://www.mongodb.com/docs/manual/core/transactions/>
- WiredTiger Storage Engine - Tài liệu chính thức MongoDB: <https://www.mongodb.com/docs/manual/core/wiredtiger/>
- WiredTiger Storage Engine Phần 1: Phân tích cấu trúc dữ liệu cơ bản: <https://mongoing.com/topic/archives-35143>
