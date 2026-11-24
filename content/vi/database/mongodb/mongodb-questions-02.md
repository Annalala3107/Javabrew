---
title: "Tổng hợp câu hỏi phỏng vấn MongoDB thường gặp (Phần 2)"
description: "Phần 2 tổng hợp câu hỏi phỏng vấn MongoDB thường gặp, giải thích chuyên sâu nguyên lý, kịch bản sử dụng và kỹ thuật tối ưu truy vấn cho các loại Index trong MongoDB (Single Field, Compound, Multikey, Text, Geospatial, TTL)."
category: Cơ sở dữ liệu
tag:
  - NoSQL
  - MongoDB
head:
  - - meta
    - name: keywords
      content: MongoDB Index,Compound Index,Multikey Index,Text Index,Geospatial Index,TTL Index,Tối ưu truy vấn MongoDB,Thiết kế Index
lang: vi
sourceRef: zh-ref/database/mongodb/mongodb-questions-02.md
---

## Index trong MongoDB

### Index trong MongoDB có tác dụng gì?

Tương tự cơ sở dữ liệu quan hệ, MongoDB cũng có Index (chỉ mục). Mục đích chính của Index là tăng hiệu quả truy vấn. Nếu không có Index, MongoDB buộc phải thực hiện **Collection Scan (quét toàn bộ Collection)**, tức quét từng Document trong Collection để chọn ra những Document khớp với câu truy vấn. Nếu có Index phù hợp cho truy vấn, MongoDB có thể dùng Index đó để giới hạn số lượng Document cần kiểm tra. Đồng thời, MongoDB có thể sử dụng thứ tự sắp xếp sẵn trong Index để trả về kết quả đã sắp xếp.

Mặc dù Index giúp rút ngắn đáng kể thời gian truy vấn, việc sử dụng và duy trì Index đều có chi phí. Khi thực hiện thao tác ghi, ngoài việc cập nhật Document, hệ thống còn phải cập nhật Index, điều này chắc chắn ảnh hưởng đến hiệu năng ghi. Vì vậy, khi có nhiều thao tác ghi nhưng ít thao tác đọc, hoặc không quá đặt nặng hiệu năng đọc, thì không khuyến nghị tạo Index.

### MongoDB hỗ trợ những loại Index nào?

**MongoDB hỗ trợ nhiều loại Index gồm Single Field Index, Compound Index, Multikey Index, Hashed Index, Text Index, Geospatial Index,... mỗi loại có kịch bản sử dụng riêng.**

- **Single Field Index (Index đơn trường)**: Index được tạo trên một trường duy nhất; thứ tự sắp xếp khi tạo Index không quan trọng vì MongoDB có thể duyệt từ đầu hoặc từ cuối.
- **Compound Index (Index kết hợp)**: Index được tạo trên nhiều trường, còn gọi là chỉ mục tổ hợp hoặc chỉ mục liên hợp.
- **Multikey Index (Index đa khóa)**: Một trường trong MongoDB có thể là một mảng (Array); khi tạo Index trên trường như vậy sẽ tạo ra Multikey Index. MongoDB sẽ tạo mục Index cho từng phần tử của mảng. Nhờ đó bạn có thể lấy giá trị bên trong mảng làm điều kiện truy vấn và lúc này truy vấn vẫn sử dụng được Index.
- **Hashed Index (Index băm)**: Đánh Index theo giá trị băm (Hash) của dữ liệu, dùng trong các Hashed Sharded Cluster.
- **Text Index (Index văn bản)**: Hỗ trợ truy vấn tìm kiếm văn bản trên nội dung chuỗi. Text Index có thể bao gồm bất kỳ trường nào có giá trị là chuỗi hoặc mảng các phần tử chuỗi. Một Collection chỉ có thể có một Text Search Index, nhưng Index này có thể bao phủ nhiều trường. Mặc dù MongoDB hỗ trợ Full-Text Index nhưng hiệu năng khá thấp, tạm thời không khuyến nghị sử dụng nhiều.
- **Geospatial Index (Index không gian địa lý)**: Index dựa trên kinh độ và vĩ độ, phù hợp cho truy vấn vị trí 2D và 3D.
- **Unique Index (Index duy nhất)**: Đảm bảo trường được đánh Index không lưu trữ giá trị trùng lặp. Nếu Collection đã tồn tại Document vi phạm ràng buộc duy nhất của Index, việc tạo Unique Index ở chế độ nền (background) sẽ thất bại.
- **TTL Index**: TTL Index cung cấp cơ chế hết hạn (expiration), cho phép thiết lập thời gian sống cho từng Document; khi Document đạt tới thời gian hết hạn đã định sẵn, nó sẽ bị xóa bỏ.
- ……

### Thứ tự các trường trong Compound Index có ảnh hưởng không?

Thứ tự các trường trong Compound Index cực kỳ quan trọng. Ví dụ Compound Index trong hình dưới đây gồm `{userid:1, score:-1}`, thì Compound Index này trước tiên sắp xếp tăng dần theo `userid`, sau đó trong phạm vi từng giá trị `userid`, tiếp tục sắp xếp giảm dần theo `score`.

![Compound Index](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongodb-composite-index-0ead2e46.png)

Trong Compound Index, cách thức sắp xếp sẽ quyết định Index đó có được áp dụng cho truy vấn hay không.

Cách sắp xếp có sử dụng Compound Index:

```sql
db.s2.find().sort({"userid": 1, "score": -1})
db.s2.find().sort({"userid": -1, "score": 1})
```

Cách sắp xếp không sử dụng Compound Index:

```sql
db.s2.find().sort({"userid": 1, "score": 1})
db.s2.find().sort({"userid": -1, "score": -1})
db.s2.find().sort({"score": 1, "userid": -1})
db.s2.find().sort({"score": 1, "userid": 1})
db.s2.find().sort({"score": -1, "userid": -1})
db.s2.find().sort({"score": -1, "userid": 1})
```

Chúng ta có thể phân tích thông qua `explain`:

```sql
db.s2.find().sort({"score": -1, "userid": 1}).explain()
```

### Compound Index có tuân theo nguyên tắc tiền tố trái nhất (Leftmost Prefix) không?

**Compound Index của MongoDB tuân theo nguyên tắc tiền tố trái nhất (Leftmost Prefix)**: Một Index gồm nhiều khóa đồng thời mang lại tất cả các Index tạo bởi mọi tiền tố của các khóa đó, nhưng không bao gồm các tập con khác ngoài tiền tố trái nhất. Ví dụ, nếu có một Index dạng `{a: 1, b: 1, c: 1, ..., z: 1}`, thì thực tế cũng tương đương với việc đã có một loạt Index như `{a: 1}`, `{a: 1, b: 1}`, `{a: 1, b: 1, c: 1}`,..., nhưng sẽ không có Index không phải tiền tố trái nhất như `{b: 1}`.

### TTL Index là gì?

TTL Index cung cấp một cơ chế hết hạn, cho phép thiết lập thời gian hết hạn `expireAfterSeconds` cho từng Document; khi Document đạt đến thời gian hết hạn định sẵn, nó sẽ bị xóa. Ngoài thuộc tính `expireAfterSeconds`, TTL Index giống hệt Index thông thường.

Việc dữ liệu tự hết hạn rất hữu ích cho một số loại thông tin như dữ liệu sự kiện do máy sinh ra, log và thông tin phiên (session) — những dữ liệu chỉ cần lưu trong cơ sở dữ liệu trong một khoảng thời gian giới hạn.

**Nguyên lý vận hành của TTL Index**:

- MongoDB sẽ mở một luồng nền (background thread) để đọc giá trị của TTL Index nhằm phán đoán Document đã hết hạn hay chưa, nhưng không đảm bảo dữ liệu hết hạn sẽ bị xóa ngay lập tức. Nguyên nhân là luồng nền cứ mỗi 60 giây mới kích hoạt tác vụ xóa một lần; hơn nữa nếu lượng dữ liệu cần xóa lớn, có thể xảy ra tình trạng tác vụ xóa lần trước chưa xong thì tác vụ lần sau đã chạy, dẫn đến hiện tượng dữ liệu hết hạn tồn tại quá thời gian lưu giữ trên 60 giây.
- Đối với Replica Set, tiến trình nền của TTL Index chỉ chạy trên node Primary và luôn ở trạng thái nhàn rỗi trên các node Secondary; việc xóa dữ liệu trên Secondary được đồng bộ thông qua oplog sinh ra sau khi Primary thực hiện xóa.

**Giới hạn của TTL Index**:

- TTL Index là Index đơn trường. Compound Index không hỗ trợ TTL.
- Trường `_id` không hỗ trợ TTL Index.
- Không thể tạo TTL Index trên Capped Collection (Collection có giới hạn dung lượng), vì MongoDB không thể xóa Document khỏi Capped Collection.
- Nếu một trường đã tồn tại Index không phải TTL, thì không thể tạo thêm TTL Index trên trường đó nữa.

### Covered Index Query (Truy vấn bao phủ bằng Index) là gì?

Theo giới thiệu của tài liệu chính thức, Covered Query là truy vấn thỏa mãn các điều kiện sau:

- Tất cả các trường trong điều kiện truy vấn đều là một phần của Index.
- Tất cả các trường trả về trong kết quả đều nằm trong cùng một Index đó.
- Không có trường nào trong truy vấn bằng `null`.

Do mọi trường xuất hiện trong truy vấn đều là một phần của Index, MongoDB không cần tìm kiếm trong toàn bộ Document dữ liệu để đối chiếu điều kiện truy vấn và trả về kết quả từ cùng một Index. Vì Index nằm trong bộ nhớ (RAM), việc lấy dữ liệu từ Index nhanh hơn rất nhiều so với đọc dữ liệu bằng cách quét Document.

Ví dụ: giả sử chúng ta có Collection `users` như sau:

```json
{
   "_id": ObjectId("53402597d852426020000002"),
   "contact": "987654321",
   "dob": "01-01-1991",
   "gender": "M",
   "name": "Tom Benzamin",
   "user_name": "tombenzamin"
}
```

Chúng ta tạo Compound Index trên Collection `users` với hai trường `gender` và `user_name`:

```sql
db.users.ensureIndex({gender:1,user_name:1})
```

Lúc này, Index đó sẽ bao phủ truy vấn sau:

```sql
db.users.find({gender:"M"},{user_name:1,_id:0})
```

Để Index đã chỉ định có thể bao phủ truy vấn, bắt buộc phải chỉ định tường minh `_id: 0` nhằm loại trừ trường `_id` khỏi kết quả, bởi vì Index này không bao gồm trường `_id`.

## Tính sẵn sàng cao (High Availability) trong MongoDB

### Replica Set (Cụm bản sao)

#### Replica Set là gì?

Replica Set (cụm bản sao) của MongoDB là một nhóm các tiến trình `mongod` cùng duy trì một tập dữ liệu giống nhau.

Client kết nối tới toàn bộ cụm Replica Set của MongoDB; node Primary phụ trách thao tác ghi của cả cụm, các node Secondary có thể thực hiện thao tác đọc, nhưng mặc định node Primary vẫn đảm nhiệm thao tác đọc cho cả cụm. Khi node Primary gặp sự cố, một node Primary mới sẽ tự động được bầu chọn từ các node Secondary để đảm bảo cụm tiếp tục hoạt động bình thường, hoàn toàn trong suốt đối với client.

Thông thường, một Replica Set bao gồm 1 node Primary (node chính), nhiều node Secondary (node phụ) và 0 hoặc 1 node Arbiter (node trọng tài).

- **Node Primary**: Đầu vào cho toàn bộ thao tác ghi của cụm, tiếp nhận mọi thao tác ghi và ghi lại toàn bộ thay đổi của các Collection vào nhật ký thao tác, tức `oplog`. Sau khi node Primary sập, hệ thống sẽ tự động bầu ra node Primary mới.
- **Node Secondary**: Đồng bộ dữ liệu từ node Primary và tham gia bầu chọn node mới sau khi Primary sập. Tuy nhiên, có thể cấu hình mức độ ưu tiên (priority) của Secondary bằng `0` để ngăn nó trở thành Primary trong cuộc bầu chọn.
- **Node Arbiter**: Dùng để tiết kiệm tài nguyên hoặc phòng chống thảm họa đa trung tâm dữ liệu (multi-DC); chỉ tham gia bỏ phiếu khi bầu chọn Primary chứ không lưu dữ liệu, giúp đảm bảo có node đạt đủ đa số phiếu thuận.

Hình dưới đây là một Replica Set ba thành viên điển hình:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/replica-set-read-write-operations-primary-343f1504.png)

Giữa node Primary và các node Secondary đồng bộ dữ liệu thông qua **oplog (operations log — nhật ký thao tác)**. `oplog` là một **Capped Collection (Collection giới hạn dung lượng)** đặc biệt nằm trong Database `local`, dùng để lưu nhật ký tăng trưởng sinh ra từ các thao tác ghi, tương tự Binlog trong MySQL.

> Capped Collection tương tự hàng đợi vòng có kích thước cố định: dữ liệu được nối tuần tự vào cuối Collection, khi không gian Collection đạt giới hạn, nó sẽ ghi đè lên các Document cũ nhất trong Collection. Dữ liệu của Capped Collection được ghi tuần tự vào một vùng dung lượng cố định trên đĩa nên tốc độ I/O rất nhanh; nếu không tạo Index thì hiệu năng còn tốt hơn nữa.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/replica-set-primary-with-two-secondaries-ae5b0705.png)

Khi một thao tác ghi hoàn tất trên node Primary, hệ thống sẽ ghi một bản ghi tương ứng vào Collection `oplog`, còn các node Secondary sẽ liên tục kéo (pull) các bản ghi mới thông qua oplog này và phát lại (replay) tại local để đạt mục đích đồng bộ dữ liệu.

Một Replica Set có tối đa một node Primary. Nếu node Primary hiện tại không khả dụng, một cuộc bầu chọn sẽ quyết định node Primary mới. Quy tắc bầu chọn node của MongoDB đảm bảo sau khi Primary sập, node mới được chọn chắc chắn là node có dữ liệu đầy đủ nhất trong cụm.

#### Tại sao phải dùng Replica Set?

- **Đạt được Failover**: Cung cấp tính năng khôi phục sự cố tự động; khi node Primary gặp sự cố, hệ thống tự động bầu chọn một node Primary mới từ các Secondary để đảm bảo cụm hoạt động bình thường một cách trong suốt với client.
- **Thực hiện tách đọc/ghi (Read/Write Splitting)**: Chúng ta có thể cấu hình cho phép đọc dữ liệu trên node Secondary còn Primary phụ trách ghi dữ liệu, nhờ đó tách đọc/ghi và giảm tải áp lực đọc ghi quá lớn trên Primary. Trước MongoDB 4.0, nếu tải trên Primary không lớn thì không khuyến nghị tách đọc/ghi vì thao tác ghi sẽ chặn thao tác đọc, trừ khi nghiệp vụ không quá nhạy cảm với thời gian phản hồi và chấp nhận độ trễ nhất định khi đọc dữ liệu lịch sử.

### Sharded Cluster (Cụm phân mảnh)

#### Sharded Cluster là gì?

Sharded Cluster là phiên bản phân tán của MongoDB. So với Replica Set, dữ liệu trong Sharded Cluster được phân bố cân bằng trên các Shard khác nhau; điều này không chỉ nâng cao đáng kể giới hạn dung lượng dữ liệu của toàn cụm mà còn phân tán áp lực đọc/ghi ra các Shard khác nhau, giải quyết bài toán nút thắt hiệu năng của Replica Set.

Sharded Cluster của MongoDB gồm ba thành phần sau (hình dưới lấy từ [tài liệu chính thức giới thiệu về Sharded Cluster](https://www.mongodb.com/docs/manual/sharding/)):

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/sharded-cluster-production-architecture-b694ee08.png)

- **Config Servers**: Máy chủ cấu hình, bản chất là một Replica Set của MongoDB, chịu trách nhiệm lưu trữ các loại metadata và cấu hình của cụm như địa chỉ các Shard, Chunks,...
- **Mongos**: Dịch vụ định tuyến (Router), không lưu trữ dữ liệu cụ thể; lấy cấu hình cụm từ Config Server để chuyển tiếp yêu cầu tới đúng Shard cụ thể, sau đó tổng hợp kết quả từ các Shard trả về cho client.
- **Shard**: Mỗi Shard chứa một tập con của toàn bộ dữ liệu. Từ phiên bản MongoDB 3.6 trở đi, mỗi Shard bắt buộc phải được triển khai theo kiến trúc Replica Set.

#### Tại sao phải dùng Sharded Cluster?

Khi lượng dữ liệu và thông lượng (Throughput) của hệ thống tăng lên, có hai hướng giải quyết phổ biến: mở rộng dọc (Vertical Scaling) và mở rộng ngang (Horizontal Scaling).

Mở rộng dọc được thực hiện bằng cách tăng năng lực của một máy chủ đơn lẻ như dung lượng đĩa, dung lượng RAM, số lượng CPU,...; còn mở rộng ngang thực hiện bằng cách lưu trữ dữ liệu trên nhiều máy chủ, bổ sung thêm máy chủ khi cần để tăng dung lượng.

Tương tự Redis Cluster, MongoDB cũng có thể thực hiện **mở rộng ngang (Horizontal Scaling)** thông qua Sharding. Cách mở rộng ngang này linh hoạt hơn, đáp ứng nhu cầu lưu trữ lượng dữ liệu lớn hơn và hỗ trợ thông lượng cao hơn. Hơn nữa, tổng chi phí cần thiết cho mở rộng ngang thấp hơn vì chỉ cần các máy chủ đơn lẻ cấu hình tương đối vừa phải, đánh đổi lại là tăng độ phức tạp trong hạ tầng triển khai và bảo trì.

Nói cách khác, khi gặp các vấn đề sau, bạn có thể dùng Sharded Cluster để giải quyết:

- Dung lượng lưu trữ bị giới hạn bởi một máy đơn, tức tài nguyên đĩa gặp nút thắt cổ chai.
- Năng lực đọc/ghi bị giới hạn bởi một máy đơn — có thể do CPU, bộ nhớ hoặc card mạng gặp nút thắt cổ chai khiến năng lực đọc/ghi không thể mở rộng thêm.

#### Shard Key là gì?

**Shard Key (Khóa phân mảnh)** là tiền đề để phân vùng dữ liệu, qua đó phân phối dữ liệu sang các máy chủ khác nhau và giảm tải cho từng máy chủ. Nói cách khác, Shard Key quyết định cách các Document trong một Collection được phân bố giữa nhiều Shard trong cụm.

Shard Key chính là một trường bên trong Document, nhưng không phải trường bình thường mà có những yêu cầu nhất định:

- Nó bắt buộc phải xuất hiện trong tất cả các Document.
- Nó bắt buộc phải là một Index của Collection — có thể là Index đơn trường hoặc Index tiền tố của Compound Index; không được là Multikey Index, Text Index hay Geospatial Index.
- Ở các phiên bản trước MongoDB 4.2, giá trị trường Shard Key của Document là bất biến. Từ MongoDB 4.2 trở đi, trừ khi trường Shard Key là trường `_id` bất biến, bạn có thể cập nhật giá trị Shard Key của Document. Từ MongoDB 5.0 trở đi, hệ thống hỗ trợ phân mảnh lại trực tiếp (live resharding), cho phép thay đổi hoàn toàn Shard Key.
- Kích thước của nó không được vượt quá 512 byte.

#### Chọn Shard Key như thế nào?

Việc chọn Shard Key phù hợp ảnh hưởng rất lớn đến hiệu quả Sharding, chủ yếu dựa trên bốn yếu tố sau (trích từ [Lưu ý sử dụng Sharded Cluster - Tài liệu Tencent Cloud](https://cloud.tencent.com/document/product/240/44611)):

- **Lực lượng tập giá trị (Cardinality)**: Lực lượng giá trị của Shard Key nên càng lớn càng tốt. Nếu dùng Shard Key có Cardinality nhỏ, vì số giá trị khả dĩ có hạn nên tổng số Chunk bị giới hạn; khi dữ liệu tăng lên, kích thước Chunk ngày càng phình to, khiến việc di chuyển Chunk khi mở rộng ngang trở nên rất khó khăn. Ví dụ: chọn tuổi làm Shard Key thì phạm vi tối đa chỉ khoảng 100 giá trị; khi lượng dữ liệu tăng nhiều và cùng một giá trị tập trung quá đông, Chunk sẽ tăng vượt quá giới hạn `chunkSize`, gây ra Jumbo Chunk không thể di chuyển (migrate), dẫn đến phân bố dữ liệu không đều và tạo nút thắt hiệu năng.
- **Phân bố giá trị (Distribution)**: Phân bố giá trị nên càng đồng đều càng tốt. Shard Key phân bố không đều sẽ khiến một số Chunk có lượng dữ liệu cực lớn, cũng gây ra vấn đề phân bố dữ liệu lệch và nút thắt hiệu năng như trên.
- **Truy vấn có kèm Shard Key**: Khi truy vấn nên đính kèm Shard Key. Khi dùng Shard Key trong điều kiện truy vấn, `mongos` có thể định vị trực tiếp tới Shard cụ thể; nếu không, `mongos` phải phát tán truy vấn đến tất cả các Shard rồi chờ phản hồi trả về.
- **Tránh tăng đơn điệu hoặc giảm đơn điệu**: Với Shard Key tăng đơn điệu, việc di chuyển tệp dữ liệu tuy ít nhưng thao tác ghi sẽ tập trung vào một phía, làm cho lượng dữ liệu ở Shard/Chunk cuối cùng liên tục phình to và liên tục phải di chuyển; khóa giảm đơn điệu cũng tương tự.

Tóm lại, khi chọn Shard Key cần cân nhắc 4 điều kiện trên và cố gắng thỏa mãn càng nhiều điều kiện càng tốt để giảm tác động của `MoveChunks` lên hiệu năng, qua đó đạt trải nghiệm hiệu năng tối ưu.

#### Có những chiến lược Sharding nào?

MongoDB hỗ trợ hai thuật toán Sharding nhằm đáp ứng các nhu cầu truy vấn khác nhau (trích từ [Giới thiệu Sharded Cluster MongoDB - Tài liệu Alibaba Cloud](https://help.aliyun.com/document_detail/64561.html?spm=a2c4g.11186623.0.0.3121565eQhUGGB#h2--shard-key-3)):

**1. Sharding dựa trên khoảng (Ranged Sharding)**:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/example-of-scope-based-sharding-60f88e26.png)

MongoDB chia dữ liệu thành các Chunk khác nhau theo khoảng giá trị của Shard Key, mỗi Chunk chứa dữ liệu trong một phạm vi nhất định. Khi Shard Key có Cardinality lớn, tần suất trùng lặp thấp và giá trị không biến đổi đơn điệu, Ranged Sharding đạt hiệu quả cao hơn.

- Ưu điểm: `mongos` có thể nhanh chóng định vị dữ liệu mà yêu cầu cần tìm và chuyển tiếp yêu cầu tới đúng node Shard tương ứng.
- Nhược điểm: Có thể khiến dữ liệu phân bố không đều trên các node Shard, dễ gây điểm nóng (hotspot) đọc/ghi và không có khả năng phân tán ghi.
- Kịch bản phù hợp: Giá trị của Shard Key không tăng đơn điệu hoặc giảm đơn điệu, có Cardinality lớn và tần suất trùng lặp thấp, đồng thời nghiệp vụ có nhu cầu truy vấn theo khoảng (Range Query).

**2. Sharding dựa trên giá trị Hash (Hashed Sharding)**:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/example-of-hash-based-sharding-eb1d6215.png)

MongoDB tính giá trị băm (Hash) của một trường đơn lẻ làm giá trị Index, rồi chia dữ liệu thành các Chunk khác nhau theo khoảng giá trị Hash.

- Ưu điểm: Có thể phân bố dữ liệu đồng đều hơn trên các node Shard và có khả năng phân tán ghi.
- Nhược điểm: Không phù hợp cho truy vấn theo khoảng; khi thực hiện Range Query, hệ thống cần phát tán yêu cầu đọc tới tất cả các node Shard.
- Kịch bản phù hợp: Giá trị Shard Key tăng hoặc giảm đơn điệu, có Cardinality lớn và tần suất trùng lặp thấp, cần phân phối dữ liệu ghi ngẫu nhiên, hoặc việc đọc dữ liệu mang tính ngẫu nhiên cao.

Ngoài hai chiến lược trên, bạn còn có thể cấu hình **Compound Shard Key (Shard Key kết hợp)**, ví dụ kết hợp một khóa có Cardinality thấp với một khóa tăng đơn điệu.

#### Dữ liệu Sharding được lưu trữ như thế nào?

**Chunk (khối)** là một khái niệm cốt lõi của Sharded Cluster trong MongoDB; bản chất nó là một đơn vị dữ liệu logic gồm một nhóm các Document. Mỗi Chunk chứa dữ liệu thuộc một khoảng giá trị nhất định của Shard Key — đôi một rời nhau và hợp của chúng tạo thành toàn bộ dữ liệu, đúng với khái niệm **phân hoạch (partition)** trong toán rời rạc.

Sharded Cluster không lưu từng bản ghi nằm trên Shard nào, mà lưu thông tin mỗi Chunk nằm trên Shard nào cũng như Chunk đó chứa khoảng dữ liệu nào.

Mặc định, kích thước tối đa của một Chunk là 64 MB (có thể điều chỉnh trong khoảng 1–1024 MB; nếu không có nhu cầu đặc biệt, khuyến nghị giữ giá trị mặc định). Khi chèn, cập nhật hoặc xóa dữ liệu, nếu `mongos` nhận thấy kích thước hoặc số lượng Document trong Chunk đích vượt quá ngưỡng tối đa, nó sẽ kích hoạt **tách Chunk (Chunk Splitting)**.

![Tách Chunk](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/chunk-splitting-shard-a-e2635dc0.png)

Sự tăng trưởng của dữ liệu sẽ khiến Chunk bị tách ngày càng nhiều. Lúc này, số lượng Chunk trên các Shard có thể bị mất cân bằng. Thành phần **Balancer (bộ cân bằng)** trong MongoDB sẽ thực hiện cân bằng tự động, cố gắng duy trì số lượng Chunk trên các Shard ở mức đồng đều — quá trình này gọi là **Rebalance (tái cân bằng)**. Mặc định, tính năng Rebalance cho Database và Collection được bật sẵn.

Như minh họa ở hình dưới, cùng với việc chèn dữ liệu dẫn đến tách Chunk, hai Shard A và B có 3 Chunk trong khi Shard C chỉ có 1 Chunk; khi đó hệ thống sẽ di chuyển một Chunk từ Shard B sang Shard C để cân bằng dữ liệu cho cụm.

![Di chuyển Chunk](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongo-reblance-three-shards-68d13f07.png)

> Balancer là một tiến trình nền của MongoDB chạy trên node Primary của Config Server (kể từ phiên bản MongoDB 3.4). Nó giám sát số lượng Chunk trên mỗi Shard và thực hiện di chuyển khi sự chênh lệch số lượng Chunk trên một Shard đạt ngưỡng quy định.

Chunk chỉ có thể tách ra chứ không gộp lại, ngay cả khi tăng giá trị `chunkSize`.

Thao tác Rebalance tiêu tốn khá nhiều tài nguyên hệ thống; chúng ta có thể giảm ảnh hưởng của nó lên việc vận hành bình thường của MongoDB bằng cách chạy vào khung giờ thấp điểm, phân tách trước (pre-splitting) hoặc thiết lập khung thời gian chạy Rebalance (balancing window).

#### Nguyên lý di chuyển Chunk (Chunk Migration) là gì?

Để tìm hiểu chi tiết nguyên lý di chuyển Chunk, khuyến nghị đọc bài viết [Hiểu rõ MongoDB Chunk Migration trong một bài viết](https://mongoing.com/archives/77479) của cộng đồng MongoDB Trung Quốc.

## Tài liệu học tập đề xuất

- [Sổ tay tiếng Trung MongoDB | Bản dịch tiếng Trung tài liệu chính thức](https://docs.mongoing.com/) (Khuyên dùng): Dựa trên phiên bản 4.2, liên tục cập nhật đồng bộ với bản chính thức mới nhất.
- [Giáo trình MongoDB cho người mới bắt đầu — Học MongoDB trong 7 ngày](https://mongoing.com/archives/docs/mongodb%e5%88%9d%e5%ad%a6%e8%80%85%e6%95%99%e7%a8%8b/mongodb%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba%e6%95%b0%e6%8d%ae%e5%ba%93%e5%92%8c%e9%9b%86%e5%90%88): Nhập môn nhanh.
- [Thực chiến tích hợp Spring Boot với MongoDB - 2022](https://www.cnblogs.com/dxflqm/p/16643981.html): Một bài viết nhập môn MongoDB rất hay, chủ yếu xoay quanh việc sử dụng Java Client của MongoDB để thực hiện các thao tác CRUD cơ bản.

## Tài liệu tham khảo

- Tài liệu chính thức MongoDB (nguồn tham khảo chính, lấy tài liệu chính thức làm chuẩn): <https://www.mongodb.com/docs/manual/>
- *MongoDB: The Definitive Guide* (*MongoDB Quyền Uy Chỉ Nam*)
- Indexes - Tài liệu chính thức MongoDB: <https://www.mongodb.com/docs/manual/indexes/>
- MongoDB - Kiến thức về Index - Lập trình viên Tường Tử - 2022: <https://fatedeity.cn/posts/database/mongodb-index-knowledge.html>
- MongoDB - Index: <https://www.cnblogs.com/Neeo/articles/14325130.html>
- Sharding - Tài liệu chính thức MongoDB: <https://www.mongodb.com/docs/manual/sharding/>
- Giới thiệu Sharded Cluster MongoDB - Tài liệu Alibaba Cloud: <https://help.aliyun.com/document_detail/64561.html>
- Lưu ý sử dụng Sharded Cluster - Tài liệu Tencent Cloud: <https://cloud.tencent.com/document/product/240/44611>
