---
title: "Giải thích chi tiết Thuật toán Consistent Hashing: Vòng băm, Virtual Node, Lệch dữ liệu và Ứng dụng Distributed Cache"
category: Hệ thống phân tán
description: "Giải thích chi tiết thuật toán Consistent Hashing, trình bày vòng băm (Hash Ring), mở rộng/thu hẹp node, node ảo (Virtual Node), lệch dữ liệu (Data Skew) và nguyên lý cân bằng tải, cùng các ứng dụng điển hình trong Redis, Memcached, Distributed Cache và Sharding database."
tag:
  - Giao thức & Thuật toán phân tán
  - Thuật toán băm
head:
  - - meta
    - name: keywords
      content: Consistent Hashing,băm nhất quán,Hash Ring,vòng băm,Virtual Node,node ảo,Data Skew,lệch dữ liệu,Distributed Cache,Redis,Memcached,cân bằng tải,thuật toán phân tán
lang: vi
sourceRef: zh-ref/distributed-system/protocol/consistent-hashing.md
---

Trước khi bắt đầu, hãy xét hai kịch bản quen thuộc sau:

1. **Cân bằng tải (Load Balancing)**: Vì lượng truy cập quá lớn, website của chúng ta triển khai nhiều server cùng cung cấp một dịch vụ giống nhau, nhưng dữ liệu lưu trên mỗi server lại khác nhau. Để đảm bảo trả về đúng phản hồi, các request có cùng tham số (`key`) — ví dụ request từ cùng một IP hoặc cùng một người dùng — cần được điều hướng về đúng cùng một server để xử lý.
2. **Distributed Cache**: Vì lượng dữ liệu cache quá lớn, chúng ta triển khai nhiều server cache cùng cung cấp dịch vụ lưu trữ đệm. Dữ liệu cache cần được phân bổ đều nhất có thể trên các server cache này, và thông qua `key` ta có thể tìm ra đúng server cache tương ứng.

Bản chất của cả hai kịch bản đều là cần thiết lập một **quan hệ ánh xạ ổn định từ `key` tới server/node**.

Trong chuyên đề giao thức, Consistent Hashing giải quyết bài toán **phân phối dữ liệu hoặc request lên các node như thế nào**, không giải quyết việc các bản sao đạt đồng thuận ra sao. Về lan truyền trạng thái có thể xem [Giải thích chi tiết Giao thức Gossip](./gossip-protocol.md), còn về thứ tự ghi và commit theo đa số có thể xem [Giải thích chi tiết Thuật toán Raft](./raft-algorithm.md).

Để đạt được mục tiêu này, giải pháp đầu tiên bạn nghĩ đến là gì?

## Thuật toán băm thông thường (Standard Hashing)

Chắc hẳn mọi người sẽ nghĩ ngay tới bộ đôi kinh điển **"Hash + Chia lấy dư (Modulo)"**. Tính giá trị băm của `key` qua hàm băm, rồi chia lấy dư cho số lượng server để ánh xạ `key` tới một server cố định.

Công thức cũng rất đơn giản:

```java
node_number = hash(key) % N
```

- `hash(key)`: Sử dụng hàm băm (khuyến nghị dùng các hàm băm phi mật mã có hiệu năng tốt như SipHash, MurMurHash3, CRC32, DJB) để băm khóa duy nhất.
- `% N`: Chia lấy dư giá trị băm để ánh xạ vào khoảng từ `0` đến `N - 1`, trong đó `N` là số lượng node/server.

![Ánh xạ băm chia lấy dư](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/hashqumo-e3dbee77.png)

Tuy nhiên, thuật toán băm chia lấy dư truyền thống có một nhược điểm rất lớn: **không xử lý tốt kịch bản số lượng máy/node giảm động (ví dụ một máy bị sập) hoặc tăng thêm động (ví dụ thêm một máy mới).**

Hãy tưởng tượng ban đầu có 4 server (`N = 4`). Nếu một server bị sập, `N` biến thành `3`. Lúc này với cùng một `key`, kết quả của `hash(key) % 3` rất có khả năng khác hoàn toàn so với `hash(key) % 4`.

![Băm chia lấy dư sau khi gỡ Node2](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/hashqumo-remove-node2-01fc17fc.png)

Điều này đồng nghĩa gần như toàn bộ quan hệ ánh xạ dữ liệu bị đảo lộn. Trong bài toán Distributed Cache, nó gây ra **Cache Invalidation (hết hiệu lực cache) và Cache Penetration trên diện rộng**, dồn toàn bộ áp lực tức thời thẳng xuống Database phía sau và dẫn tới sập dây chuyền toàn hệ thống (Avalanche).

Theo ước tính, khi số node thay đổi từ `N` thành `N - 1`, trung bình có tới tỷ lệ `(N - 1) / N` dữ liệu cần phải di chuyển — tỷ lệ này **tiệm cận 100%**. Hiệu ứng "rút dây động rừng" này hoàn toàn không thể chấp nhận được trong môi trường Production.

Để giải quyết triệt để vấn đề này, thuật toán Consistent Hashing ra đời.

## Thuật toán Consistent Hashing

Thuật toán Consistent Hashing được MIT đề xuất vào năm 1997 (địa chỉ đọc PDF bài báo trực tuyến: <https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf>). Đây là một thuật toán băm đặc biệt giúp hạn chế tối đa sự thay đổi các ánh xạ hiện có giữa request và server xử lý khi thêm hoặc xóa một server. Consistent Hashing giải quyết bài toán co giãn động (Dynamic Scaling) của thuật toán băm truyền thống trong bảng băm phân tán ([Hash Table](https://baike.baidu.com/item/哈希表/5981869) — Distributed Hash Table, DHT).

Nguyên lý nền tảng của Consistent Hashing rất đơn giản, mấu chốt nằm ở việc đưa vào **Vòng băm (Hash Ring)**.

### Vòng băm (Hash Ring)

Thuật toán Consistent Hashing tổ chức không gian băm thành một cấu trúc vòng tròn, ánh xạ cả dữ liệu lẫn các node lên vòng tròn này, rồi dựa theo quy tắc chiều kim đồng hồ để xác định dữ liệu hoặc request được gán cho node nào. Thông thường, điểm bắt đầu của vòng băm là `0`, điểm kết thúc là `2^32 - 1`, và điểm đầu nối liền với điểm cuối nên miền giá trị số nguyên của vòng tròn là **[0, 2^32 - 1]**.

Thuật toán băm truyền thống chia lấy dư cho số lượng server, còn Consistent Hashing chia lấy dư cho phạm vi cố định của vòng băm, thường là `2^32`:

```java
node_number = hash(key) % 2^32
```

Server/node được ánh xạ lên vòng băm bằng cách nào? Cũng bằng băm chia lấy dư. Chẳng hạn thông thường ta băm địa chỉ IP hoặc Hostname của server rồi chia lấy dư:

```java
hash(server_ip) % 2^32
```

Như minh họa dưới đây:

![Vòng băm Hash Ring](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-ed543dba.png)

Ta ánh xạ cả dữ liệu và node lên vòng băm; mỗi node trên vòng phụ trách một khoảng cung. Với hình trên, phạm vi dữ liệu từng node phụ trách như sau:

- **Node1:** Phụ trách đoạn từ Node4 đến Node1 (chứa `value6`).
- **Node2:** Phụ trách đoạn từ Node1 đến Node2 (chứa `value1`, `value2`).
- **Node3:** Phụ trách đoạn từ Node2 đến Node3 (chứa `value3`).
- **Node4:** Phụ trách đoạn từ Node3 đến Node4 (chứa `value4`, `value5`).

### Gỡ bỏ / Thêm mới Node

Trong kịch bản thêm node hoặc gỡ node, việc sử dụng vòng băm giúp tránh phạm vi ảnh hưởng quá lớn và giảm thiểu lượng dữ liệu phải di chuyển.

Vẫn lấy sơ đồ vòng băm ở trên làm ví dụ: giả sử node `Node2` bị gỡ bỏ, khi đó `Node3` sẽ tiếp quản dữ liệu của `Node2` — ta chỉ cần di chuyển dữ liệu của `Node2` sang `Node3`, các node khác không hề bị ảnh hưởng.

![Gỡ bỏ node trên vòng băm](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-remove-node2-155b8c42.png)

Tương tự, nếu ta thêm một node mới `Node5` nằm giữa `Node1` và `Node2`, thì một phần dữ liệu vốn do `Node2` phụ trách (tức những dữ liệu có giá trị băm rơi vào khoảng giữa `Node1` và `Node5`, như `value1` trong hình) giờ sẽ do `Node5` phụ trách. Ta chỉ cần chuyển phần dữ liệu đó từ `Node2` sang `Node5`, một lần nữa chỉ ảnh hưởng đến node liền kề với phạm vi tác động rất nhỏ.

![Thêm node trên vòng băm](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-add-node5-92275514.png)

### Vấn đề lệch dữ liệu (Data Skew)

Trong trường hợp lý tưởng, các node phân bố đều trên vòng tròn. Tuy nhiên thực tế có thể không được như vậy, nhất là khi số lượng node ít. Các node có thể bị băm vào những vùng gần nhau, dẫn tới phần lớn dữ liệu đều rơi vào một node duy nhất.

![Lệch dữ liệu trên vòng băm](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-unbalance-bbbbaff3.png)

Với hình minh họa trên, dữ liệu mà từng node phụ trách như sau:

- **Node1:** Phụ trách đoạn từ Node4 đến Node1 (chứa `value6`).
- **Node2:** Phụ trách đoạn từ Node1 đến Node2 (chứa `value1`).
- **Node3:** Phụ trách đoạn từ Node2 đến Node3 (chứa `value2`, `value3`, `value4`, `value5`).
- **Node4:** Phụ trách đoạn từ Node3 đến Node4.

Ngoài vấn đề lệch dữ liệu (Data Skew), còn tồn tại một nguy cơ tiềm ẩn nữa: phân bổ lại dữ liệu không đồng đều khi thêm hoặc xóa node. Ví dụ nếu `Node3` bị gỡ bỏ, toàn bộ dữ liệu của `Node3` đều dồn sang `Node4`, kéo theo mọi request sau đó đều đổ vào `Node4`. Nếu năng lực xử lý của server `Node4` kém, nó có thể bị đánh sập ngay lập tức. Lý tưởng nhất là phải có nhiều node cùng san sẻ áp lực đó.

Làm sao giải quyết các vấn đề này? Câu trả lời là đưa vào **Node ảo (Virtual Node)**.

### Node ảo (Virtual Node)

Node ảo là việc tạo ra nhiều bản thể ảo (phân thân) trên vòng băm đại diện cho một node vật lý thực tế. Dữ liệu rơi vào phân thân nào thì thực chất sẽ đi về node vật lý thật tương ứng; bằng cách rải đều các node ảo khắp mọi vị trí trên vòng băm, dữ liệu sẽ được phân bố cân bằng.

Như hình dưới đây, 4 node gồm Node1, Node2, Node3, Node4 mỗi node tương ứng với 3 node ảo (hình vẽ chỉ mang tính minh họa, thực tế vị trí các node không phân bố đều tăm tắp như vậy).

![Node ảo trên vòng băm](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-virtual-node-6e0f65a3.png)

Với hình trên, dữ liệu cuối cùng mà từng node thực tế phụ trách là:

- **Node1**: `value4`
- **Node2**: `value1`, `value3`
- **Node3**: `value5`
- **Node4**: `value2`, `value6`

**Lợi ích từ việc đưa vào Node ảo là rất lớn:**

1. **Cân bằng dữ liệu:** Càng nhiều node ảo, mật độ "điểm server" trên vòng băm càng dày, dữ liệu tự nhiên phân bố càng đều, giải quyết tận gốc vấn đề lệch dữ liệu. Thông thường, mỗi node thực tế tương ứng với khoảng 100 đến 200 node ảo — ví dụ Nginx gán 160 node ảo cho mỗi đơn vị trọng số (weight). Trọng số ở đây dùng để phân biệt năng lực server: server có cấu hình mạnh hơn sẽ có trọng số cao hơn, dẫn đến có nhiều node ảo hơn và xác suất nhận request cao hơn.
2. **Tăng cường khả năng chịu lỗi:** Đây mới là điểm tinh tế nhất của node ảo. Khi một node vật lý bị sập, tương đương với việc nhiều node ảo của nó trên vòng băm đồng loạt ngoại tuyến. Toàn bộ dữ liệu và lưu lượng vốn do các node ảo này phụ trách sẽ được **phân tán một cách tự nhiên và đồng đều** cho **nhiều node vật lý khác nhau** trên vòng băm tiếp quản, chứ không dồn toàn bộ áp lực vào một node hàng xóm duy nhất. Điều này nâng cao vượt trội độ ổn định và khả năng chịu lỗi của hệ thống.

## Tài liệu tham khảo

- [Phân tích chuyên sâu thuật toán cân bằng tải của Nginx (tiếng Trung)](https://www.taohui.tech/2021/02/08/nginx/%E6%B7%B1%E5%85%A5%E5%89%96%E6%9E%90Nginx%E8%B4%9F%E8%BD%BD%E5%9D%87%E8%A1%A1%E7%AE%97%E6%B3%95/)
- [Chuỗi bài Đọc mã nguồn học Kiến trúc: Consistent Hashing (tiếng Trung)](https://zhaoyang.me/posts/consistent-hash-algorithm/)
- [Tổng kết nguyên lý thuật toán Consistent Hash (tiếng Trung)](https://mp.weixin.qq.com/s/WTz1KA9kOGrqFVTtALJzjQ)
