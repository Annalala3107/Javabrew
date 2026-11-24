---
title: "Hướng dẫn nhập môn ZooKeeper: Khái niệm cốt lõi, ZNode, Watcher, ACL và các kịch bản ứng dụng điển hình"
category: Hệ thống phân tán
description: "Hướng dẫn nhập môn ZooKeeper, giải thích các khái niệm cốt lõi của ZooKeeper, mô hình dữ liệu ZNode, các loại node, cơ chế lắng nghe sự kiện Watcher, kiểm soát quyền truy cập ACL cùng các kịch bản điển hình như Service Registry, Distributed Lock và Configuration Center."
tag:
  - ZooKeeper
head:
  - - meta
    - name: keywords
      content: ZooKeeper,Nhập môn ZooKeeper,ZNode,Watcher,ACL,Distributed Lock,Service Registry,Configuration Center,Điều phối phân tán,ZAB,Ephemeral Node,Persistent Node
lang: vi
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/zookeeper-intro.md
---

Chắc hẳn mọi người đều không quá xa lạ với ZooKeeper. Nhưng bạn có thực sự hiểu ZooKeeper dùng để làm gì không? Nếu người khác hoặc nhà tuyển dụng bảo bạn trình bày hiểu biết của mình về ZooKeeper, bạn có thể trả lời được đến mức độ nào?

Lấy chính bản thân tôi làm ví dụ nhé! Hồi đại học, khi dùng Dubbo để làm dự án phân tán, tôi đã dùng ZooKeeper làm Service Registry. Để đảm bảo hệ thống phân tán có thể truy cập đồng bộ vào một tài nguyên nào đó, tôi cũng từng dùng ZooKeeper làm Distributed Lock. Ngoài ra, khi học Kafka, tôi biết rất nhiều tính năng của Kafka phụ thuộc vào ZooKeeper.

Mấy hôm trước, khi tổng kết lại kinh nghiệm dự án, tôi bất chợt tự hỏi ZooKeeper rốt cuộc là thứ gì? Nghĩ một hồi lâu, trong đầu chỉ hiện lên vỏn vẹn vài câu đơn giản:

1. ZooKeeper có thể dùng làm Service Registry và Distributed Lock;
2. ZooKeeper là một thành viên trong hệ sinh thái Hadoop;
3. Khi xây dựng cụm ZooKeeper, số lượng server sử dụng tốt nhất nên là số lẻ.

Qua đó có thể thấy, hiểu biết của tôi về ZooKeeper mới chỉ dừng lại ở bề nổi.

Vì vậy, thông qua bài viết này, tôi hy vọng có thể giúp các bạn hiểu chi tiết hơn một chút về ZooKeeper. Nếu bạn chưa từng học ZooKeeper, bài viết này sẽ là viên gạch lót đường đưa bạn bước vào cánh cửa ZooKeeper. Còn nếu bạn đã từng tiếp xúc với ZooKeeper, bài viết sẽ giúp bạn ôn lại một số khái niệm nền tảng của nó.

Ngoài ra, bài viết này không chỉ đề cập đến các khái niệm của ZooKeeper; các bài viết sau sẽ giới thiệu cách sử dụng các câu lệnh phổ biến của ZooKeeper cũng như cách dùng Apache Curator làm ZooKeeper client.

_Nếu bài viết có chỗ nào cần cải thiện hoặc bổ sung, rất mong các bạn góp ý trong phần bình luận để cùng nhau tiến bộ!_

## Giới thiệu về ZooKeeper

### Nguồn gốc của ZooKeeper

Trước khi chính thức giới thiệu ZooKeeper, chúng ta hãy xem qua nguồn gốc của nó trước — cũng khá thú vị đấy.

Đoạn nội dung dưới đây được trích từ Chương 4, Mục 1 của cuốn *Từ Paxos đến ZooKeeper* (*From Paxos to ZooKeeper*), rất khuyến khích mọi người tìm đọc:

> ZooKeeper khởi nguồn từ một nhóm nghiên cứu thuộc Viện Nghiên cứu Yahoo (Yahoo! Research). Vào thời điểm đó, các nhà nghiên cứu nhận thấy nhiều hệ thống quy mô lớn bên trong Yahoo! đều phải phụ thuộc vào một hệ thống tương tự để điều phối phân tán, nhưng các hệ thống đó lại thường tồn tại vấn đề điểm lỗi đơn phân tán (Single Point of Failure). Vì thế, các kỹ sư của Yahoo! muốn phát triển một framework điều phối phân tán tổng quát không có điểm lỗi đơn, giúp lập trình viên tập trung sức lực vào việc xử lý logic nghiệp vụ.
>
> Về cái tên "ZooKeeper" của dự án này, thực ra cũng có một giai thoại thú vị. Trong giai đoạn đầu lập dự án, xét thấy nhiều dự án nội bộ trước đó đều đặt tên theo các loài động vật (ví dụ như dự án Pig nổi tiếng), các kỹ sư Yahoo! cũng muốn đặt cho dự án này một cái tên gắn với động vật. Nhà khoa học trưởng của Viện Nghiên cứu lúc bấy giờ là Raghu Ramakrishnan nói đùa rằng: "Cứ đà này thì chỗ chúng ta sắp biến thành sở thú mất thôi!" Nghe xong câu đó, mọi người liền nhất trí gọi luôn là Người quản lý sở thú (ZooKeeper) — bởi vì khi đặt các thành phần phân tán mang tên động vật lại với nhau, toàn bộ hệ thống phân tán của Yahoo! trông giống hệt một sở thú khổng lồ, mà ZooKeeper lại chính là công cụ dùng để điều phối môi trường phân tán — thế là cái tên ZooKeeper ra đời từ đó.

### Tổng quan về ZooKeeper

ZooKeeper là một **dịch vụ điều phối phân tán (Distributed Coordination Service)** mã nguồn mở. Mục tiêu thiết kế của nó là đóng gói các dịch vụ nhất quán phân tán phức tạp và dễ phát sinh lỗi thành một tập các nguyên thủy (primitive) hiệu quả, đáng tin cậy, rồi cung cấp cho người dùng thông qua một loạt giao diện đơn giản, dễ sử dụng.

> **Nguyên thủy (Primitive):** Thuật ngữ trong hệ điều hành hoặc mạng máy tính. Đây là một tiến trình gồm nhiều chỉ thị dùng để hoàn thành một chức năng nhất định, có tính không thể chia cắt — nghĩa là việc thực thi nguyên thủy phải liên tục và không được phép bị ngắt quãng giữa chừng.

ZooKeeper cung cấp cho chúng ta giải pháp nhất quán dữ liệu phân tán có tính sẵn sàng cao (High Availability), hiệu năng cao và ổn định, thường được dùng để hiện thực các chức năng như Publish/Subscribe dữ liệu, cân bằng tải (Load Balancing), dịch vụ đặt tên (Naming Service), điều phối/thông báo phân tán, quản lý cụm (Cluster Management), bầu chọn Master (Master Election), Distributed Lock và hàng đợi phân tán (Distributed Queue), v.v. Việc hiện thực các chức năng này chủ yếu dựa vào hai năng lực mà ZooKeeper cung cấp là **Lưu trữ dữ liệu + Lắng nghe sự kiện** (sẽ trình bày chi tiết ở phần sau).

ZooKeeper lưu trữ dữ liệu trong bộ nhớ (RAM) nên hiệu năng khá tốt. Nó đạt hiệu năng đặc biệt cao trong các ứng dụng có lượng "đọc" nhiều hơn "ghi", bởi vì thao tác "ghi" sẽ kéo theo việc đồng bộ trạng thái giữa tất cả các server ("đọc" nhiều hơn "ghi" là kịch bản điển hình của dịch vụ điều phối).

Ngoài ra, rất nhiều dự án mã nguồn mở hàng đầu đều sử dụng ZooKeeper, chẳng hạn như:

- **Kafka**: ZooKeeper chủ yếu đảm nhận việc đăng ký Broker và Topic cho Kafka cũng như cân bằng tải giữa nhiều Partition. Tuy nhiên, từ phiên bản Kafka 2.8 trở đi, chế độ KRaft dựa trên giao thức Raft đã được giới thiệu, không còn phụ thuộc vào ZooKeeper nữa, giúp đơn giản hóa đáng kể kiến trúc của Kafka.
- **HBase**: ZooKeeper giúp HBase đảm bảo toàn cụm chỉ có duy nhất một Master hoạt động, đồng thời lưu trữ và cung cấp thông tin trạng thái của các `regionserver` (xem chúng có đang online hay không), v.v.
- **Hadoop**: ZooKeeper cung cấp khả năng hỗ trợ High Availability cho NameNode.

### Đặc điểm của ZooKeeper

- **Tính nhất quán tuần tự (Sequential Consistency):** Các request giao dịch (transaction request) xuất phát từ cùng một client cuối cùng sẽ được áp dụng vào ZooKeeper một cách nghiêm ngặt theo đúng thứ tự đã gửi.
- **Tính nguyên tử (Atomicity):** Kết quả xử lý của mọi request giao dịch trên tất cả các máy trong toàn cụm đều giống hệt nhau — nghĩa là hoặc tất cả các máy trong cụm đều áp dụng thành công giao dịch đó, hoặc không máy nào áp dụng cả.
- **Hình ảnh hệ thống đơn nhất (Single System Image):** Bất kể client kết nối tới ZooKeeper server nào, mô hình dữ liệu phía server mà client nhìn thấy đều hoàn toàn giống nhau.
- **Độ tin cậy (Reliability):** Một khi yêu cầu thay đổi dữ liệu được áp dụng, kết quả thay đổi sẽ được lưu bền vững cho đến khi bị ghi đè bởi lần thay đổi tiếp theo.
- **Tính nhất quán tuần tự (Sequential Consistency):** Tất cả các client đều nhìn thấy cùng một thứ tự thay đổi dữ liệu, được cập nhật theo thứ tự FIFO toàn cục mà các thao tác được commit. Tuy nhiên, điều này không đảm bảo các thay đổi sẽ được lan truyền ngay lập tức tới tất cả các node.
- **Triển khai cụm (Cluster Deployment):** Khoảng 3~5 máy (tốt nhất là số lẻ) có thể hợp thành một cụm. Mỗi máy đều lưu toàn bộ dữ liệu của ZooKeeper trong bộ nhớ, các máy giao tiếp lẫn nhau để đồng bộ dữ liệu và client có thể kết nối tới bất kỳ máy nào.
- **Tính sẵn sàng cao (High Availability):** Nếu một máy gặp sự cố ngừng hoạt động, dữ liệu được đảm bảo không bị mất. Miễn là số máy hỏng trong cụm không vượt quá một nửa, cụm vẫn đảm bảo khả dụng. Ví dụ cụm 3 máy cho phép hỏng 1 máy, cụm 5 máy cho phép hỏng 2 máy.

### Kịch bản ứng dụng của ZooKeeper

Trong phần tổng quan về ZooKeeper, chúng ta đã nhắc tới việc nó thường dùng để hiện thực Publish/Subscribe dữ liệu, cân bằng tải, Naming Service, điều phối/thông báo phân tán, quản lý cụm, bầu chọn Master, Distributed Lock và Distributed Queue.

Dưới đây chọn ra 3 kịch bản ứng dụng điển hình để phân tích riêng:

1. **Naming Service (Dịch vụ đặt tên)**: Có thể tạo ID duy nhất toàn cục thông qua Sequential Node (node tuần tự) của ZooKeeper.
2. **Data Publish/Subscribe (Phát hành/Đăng ký dữ liệu)**: Thông qua **cơ chế Watcher**, ta có thể dễ dàng hiện thực mô hình Publish/Subscribe dữ liệu. Khi bạn đẩy dữ liệu lên một node đang được lắng nghe trên ZooKeeper, các máy khác có thể lắng nghe sự thay đổi của node đó để cập nhật cấu hình động (Dynamic Configuration Update).
3. **Distributed Lock (Khóa phân tán)**: Giành được Distributed Lock bằng cách tạo một node duy nhất; khi bên giữ khóa thực thi xong đoạn code liên quan hoặc gặp sự cố ngừng hoạt động thì giải phóng khóa. Việc hiện thực Distributed Lock cũng cần dùng tới **cơ chế Watcher**. Tôi đã trình bày chi tiết cách hiện thực Distributed Lock trên ZooKeeper trong bài [Giải thích chi tiết Distributed Lock](https://javaguide.cn/distributed-system/distributed-lock.html).

Thực tế, việc hiện thực các chức năng này đều nhờ vào khả năng lưu trữ dữ liệu của ZooKeeper, nhưng cần lưu ý rằng ZooKeeper không phù hợp để lưu trữ lượng dữ liệu lớn.

## Các khái niệm quan trọng trong ZooKeeper

_Nhấn mạnh: Lấy sổ tay ra nhé, nội dung bên dưới cực kỳ quan trọng đấy!_

### Data Model (Mô hình dữ liệu)

Mô hình dữ liệu của ZooKeeper sử dụng cấu trúc cây đa nhánh phân cấp (hierarchical multi-way tree). Mỗi node đều có thể lưu trữ dữ liệu — có thể là số, chuỗi ký tự hoặc chuỗi nhị phân. Đồng thời, mỗi node có thể có N node con, với node gốc trên cùng được biểu thị bằng dấu `/`. Mỗi node dữ liệu trong ZooKeeper được gọi là **znode**, đây là đơn vị dữ liệu nhỏ nhất trong ZooKeeper. Ngoài ra, mỗi znode đều có một đường dẫn định danh duy nhất.

Xin nhấn mạnh một câu: **ZooKeeper chủ yếu dùng cho dịch vụ điều phối chứ không phải để lưu trữ dữ liệu nghiệp vụ, vì vậy đừng đặt dữ liệu quá lớn vào znode; giới hạn kích thước dữ liệu tối đa cho mỗi node mà ZooKeeper đặt ra là 1 MB.**

Từ hình dưới đây bạn có thể thấy trực quan hơn: cách định danh đường dẫn node của ZooKeeper rất giống đường dẫn hệ thống tệp tin Unix, đều được biểu diễn bằng một chuỗi phân tách bởi dấu gạch chéo `/`. Lập trình viên có thể ghi dữ liệu vào node này hoặc tạo các node con bên dưới nó. Các thao tác này chúng ta sẽ giới thiệu ở phần sau.

![Mô hình dữ liệu ZooKeeper](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/znode-structure-f11c2c56.png)

### znode (Node dữ liệu)

Sau khi tìm hiểu mô hình dữ liệu dạng cây của ZooKeeper, ta biết mỗi node dữ liệu trong ZooKeeper được gọi là **znode**, là đơn vị dữ liệu nhỏ nhất trong ZooKeeper. Dữ liệu bạn cần lưu sẽ được đặt tại đây, và đây là khái niệm bạn sẽ phải tiếp xúc thường xuyên khi làm việc với ZooKeeper.

Thông thường chúng ta chia znode thành 4 loại lớn:

- **Persistent Node (Node bền vững - `PERSISTENT`)**: Một khi đã tạo sẽ tồn tại mãi ngay cả khi cụm ZooKeeper gặp sự cố, cho tới khi chủ động xóa nó.
- **Ephemeral Node (Node tạm thời - `EPHEMERAL`)**: Vòng đời của Ephemeral Node gắn liền với **Session của client**; **Session mất thì node cũng mất theo**. Hơn nữa, **Ephemeral Node chỉ có thể làm node lá (leaf node)**, không thể tạo node con bên dưới.
- **Persistent Sequential Node (Node bền vững tuần tự - `PERSISTENT_SEQUENTIAL`)**: Ngoài các đặc tính của Persistent Node (`PERSISTENT`), tên của các node con còn có tính tuần tự. Ví dụ `/node1/app0000000001`, `/node1/app0000000002`.
- **Ephemeral Sequential Node (Node tạm thời tuần tự - `EPHEMERAL_SEQUENTIAL`)**: Ngoài các đặc tính của Ephemeral Node (`EPHEMERAL`), tên của các node con còn có tính tuần tự.

Mỗi znode gồm 2 phần:

- **stat**: Thông tin trạng thái
- **data**: Nội dung dữ liệu cụ thể lưu trong node

Như bên dưới, tôi dùng lệnh `get` để lấy nội dung của node `dubbo` dưới thư mục gốc (lệnh `get` sẽ được giới thiệu ở phần sau).

```shell
[zk: 127.0.0.1:2181(CONNECTED) 6] get /dubbo
# Nội dung dữ liệu gắn với node dữ liệu này đang rỗng
null
# Bên dưới là một số thông tin trạng thái của node này, chính là kết quả định dạng của đối tượng Stat
cZxid = 0x2
ctime = Tue Nov 27 11:05:34 CST 2018
mZxid = 0x2
mtime = Tue Nov 27 11:05:34 CST 2018
pZxid = 0x3
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 0
numChildren = 1
```

Lớp `Stat` chứa toàn bộ các trường thông tin trạng thái của một node dữ liệu, bao gồm Transaction ID (`cZxid`), thời gian tạo node (`ctime`), số lượng node con (`numChildren`), v.v.

Hãy cùng xem từng trường thông tin trạng thái của znode đại diện cho điều gì nhé! (Nội dung bên dưới trích từ cuốn *Từ Paxos đến ZooKeeper: Nguyên lý và Thực hành Nhất quán Phân tán*, vì Guide thực ra cũng không nhớ hết từng cái, phải biết tra cứu tài liệu tham khảo mà!):

| Thông tin trạng thái znode | Giải thích                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| cZxid                      | create ZXID, tức Transaction ID tại thời điểm node dữ liệu này được tạo                                                                  |
| ctime                      | create time, tức thời gian tạo của node này                                                                                              |
| mZxid                      | modified ZXID, tức Transaction ID ở lần cập nhật gần nhất của node này                                                                   |
| mtime                      | modified time, tức thời gian cập nhật gần nhất của node này                                                                              |
| pZxid                      | Transaction ID ở lần chỉnh sửa gần nhất danh sách node con của node này; chỉ khi danh sách node con thay đổi mới cập nhật pZxid, sửa nội dung node con không cập nhật |
| cversion                   | Số phiên bản node con; giá trị tăng thêm 1 mỗi khi tập node con của node hiện tại thay đổi                                               |
| dataVersion                | Số phiên bản nội dung dữ liệu node; bằng 0 khi tạo node, mỗi lần cập nhật nội dung node (dù nội dung có đổi hay không) giá trị tăng thêm 1 |
| aclVersion                 | Số phiên bản ACL của node, biểu thị số lần thay đổi thông tin ACL của node đó                                                            |
| ephemeralOwner             | `sessionId` của Session đã tạo Ephemeral Node này; nếu node hiện tại là Persistent Node thì `ephemeralOwner=0`                            |
| dataLength                 | Độ dài nội dung dữ liệu của node                                                                                                         |
| numChildren                | Số lượng node con trực tiếp của node hiện tại                                                                                           |

### Phiên bản (Version)

Ở trên chúng ta đã nhắc tới việc với mỗi znode, ZooKeeper đều duy trì một cấu trúc dữ liệu gọi là **Stat**, trong `Stat` ghi lại ba phiên bản liên quan của znode đó:

- **dataVersion**: Số phiên bản dữ liệu của znode hiện tại
- **cversion**: Số phiên bản node con của znode hiện tại
- **aclVersion**: Số phiên bản ACL của znode hiện tại

### ACL (Kiểm soát quyền truy cập)

ZooKeeper áp dụng chiến lược ACL (Access Control Lists) để kiểm soát quyền truy cập, tương tự như phân quyền trên hệ thống tệp tin UNIX.

Đối với thao tác trên znode, ZooKeeper cung cấp 5 quyền sau:

- **CREATE**: Có thể tạo node con
- **READ**: Có thể đọc dữ liệu node và liệt kê các node con của nó
- **WRITE**: Có thể thiết lập/cập nhật dữ liệu node
- **DELETE**: Có thể xóa node con
- **ADMIN**: Có thể thiết lập quyền ACL cho node

Trong đó cần đặc biệt lưu ý rằng cả hai quyền **CREATE** và **DELETE** đều là quyền kiểm soát áp dụng lên **node con**.

Đối với xác thực danh tính, ZooKeeper cung cấp các phương thức sau:

- **world**: Phương thức mặc định, mọi người dùng đều có thể truy cập không điều kiện.
- **auth**: Không dùng bất kỳ ID nào, đại diện cho mọi người dùng đã xác thực.
- **digest**: Phương thức xác thực tên người dùng:mật khẩu — _username:password_.
- **ip**: Giới hạn quyền truy cập theo địa chỉ IP chỉ định.

### Watcher (Trình lắng nghe sự kiện)

Watcher (trình lắng nghe sự kiện) là một tính năng rất quan trọng trong ZooKeeper. ZooKeeper cho phép người dùng đăng ký các Watcher lên những node chỉ định; khi một số sự kiện nhất định được kích hoạt, phía ZooKeeper server sẽ gửi thông báo sự kiện tới các client quan tâm. Cơ chế này là đặc tính cốt lõi giúp ZooKeeper thực hiện dịch vụ điều phối phân tán.

![Cơ chế Watcher của ZooKeeper](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/zookeeper-watcher-e6a12ced.png)

_Nhấn mạnh: Một tính năng cực kỳ hữu ích, hãy lấy sổ tay ghi chép lại cẩn thận nhé, sau này dùng tới ZooKeeper hầu như không thể tách rời cơ chế Watcher (trình lắng nghe sự kiện)._

### Phiên làm việc (Session)

Session có thể xem là một kết nối TCP dài hạn (TCP persistent connection) giữa ZooKeeper server và client. Thông qua kết nối này, client có thể duy trì phiên hợp lệ với server bằng cơ chế kiểm tra nhịp tim (Heartbeat), cũng có thể gửi request tới ZooKeeper server và nhận phản hồi, đồng thời nhận các thông báo sự kiện Watcher từ server qua kết nối đó.

Session có một thuộc tính tên là `sessionTimeout`, đại diện cho thời gian hết hạn của phiên. Khi kết nối bị ngắt do server quá tải, sự cố mạng hoặc client chủ động ngắt kết nối, chỉ cần client kết nối lại được tới bất kỳ server nào trong cụm trong khoảng thời gian quy định bởi `sessionTimeout`, phiên đã tạo trước đó vẫn còn hiệu lực.

Ngoài ra, trước khi tạo Session cho client, phía server trước tiên sẽ cấp phát cho mỗi client một `sessionID`. Vì `sessionID` là định danh quan trọng của ZooKeeper Session và rất nhiều cơ chế vận hành liên quan đến Session đều dựa trên `sessionID` này, nên dù server nào cấp phát `sessionID` cho client cũng bắt buộc phải đảm bảo tính duy nhất toàn cục.

## Cụm ZooKeeper (Cluster)

Để đảm bảo High Availability, tốt nhất nên triển khai ZooKeeper dưới dạng cụm (Cluster). Như vậy chỉ cần phần lớn các máy trong cụm còn khả dụng (chịu đựng được một số lỗi máy nhất định), bản thân ZooKeeper vẫn có thể phục vụ bình thường. Thông thường chỉ cần 3 server là có thể tạo thành một cụm ZooKeeper. Sơ đồ kiến trúc chính thức do ZooKeeper cung cấp mô tả một cụm ZooKeeper cung cấp dịch vụ ra bên ngoài như một khối thống nhất.

![Kiến trúc cụm ZooKeeper](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/zookeeper-cluster-8e75087e.png)

Mỗi Server trong hình trên đại diện cho một máy chủ cài đặt dịch vụ ZooKeeper. Các server cấu thành dịch vụ ZooKeeper đều duy trì trạng thái máy chủ hiện tại trong bộ nhớ và giữa các server luôn duy trì giao tiếp với nhau. Cụm sử dụng giao thức ZAB (ZooKeeper Atomic Broadcast) để duy trì tính nhất quán dữ liệu.

**Mô hình cụm điển hình nhất: mô hình Master/Slave (Chính/Phụ).** Trong mô hình này, thông thường Master server đóng vai trò máy chủ chính cung cấp dịch vụ ghi, còn các Slave server sao chép bất đồng bộ để lấy dữ liệu mới nhất từ Master server nhằm cung cấp dịch vụ đọc.

### Các vai trò trong cụm ZooKeeper

Tuy nhiên, trong ZooKeeper không sử dụng khái niệm Master/Slave truyền thống mà đưa vào ba vai trò là Leader, Follower và Observer, như minh họa trong hình dưới đây.

![Các vai trò trong cụm ZooKeeper](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/zookeeper-cluser-roles-966ab3dc.png)

Tất cả các máy trong cụm ZooKeeper thông qua một **quy trình bầu chọn Leader (Leader Election)** để chọn ra một máy gọi là "**Leader**". Leader vừa có thể cung cấp dịch vụ ghi vừa có thể cung cấp dịch vụ đọc cho client. Ngoài Leader ra, cả **Follower** và **Observer** đều chỉ có thể trực tiếp cung cấp dịch vụ đọc. Điểm khác biệt duy nhất giữa Follower và Observer là các máy Observer không tham gia vào quá trình bầu chọn Leader và cũng không tham gia vào chiến lược "ghi thành công quá nửa" (majority write quorum) đối với thao tác ghi; do đó máy Observer có thể nâng cao hiệu năng đọc của cụm mà không làm ảnh hưởng tới hiệu năng ghi.

| Vai trò  | Mô tả                                                                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leader   | Cung cấp cả dịch vụ đọc và ghi cho client, chịu trách nhiệm khởi xướng bỏ phiếu và biểu quyết, cập nhật trạng thái hệ thống.                                                                                   |
| Follower | Cung cấp dịch vụ đọc cho client; nếu là yêu cầu ghi thì chuyển tiếp (forward) cho Leader. Tham gia bỏ phiếu trong quá trình bầu chọn.                                                                          |
| Observer | Cung cấp dịch vụ đọc cho client; nếu là yêu cầu ghi thì chuyển tiếp cho Leader. Không tham gia bỏ phiếu bầu chọn và cũng không tham gia chiến lược "ghi thành công quá nửa". Giúp tăng hiệu năng đọc mà không ảnh hưởng tới hiệu năng ghi. Vai trò này được bổ sung từ dòng ZooKeeper 3.3. |

### Quy trình bầu chọn Leader trong cụm ZooKeeper

Khi Leader server gặp các sự cố bất thường như đứt kết nối mạng, sập nguồn thoát đột ngột hay khởi động lại, cụm sẽ bước vào quy trình bầu chọn Leader để chọn ra Leader server mới.

Quy trình này đại khái diễn ra như sau:

1. **Leader election (Giai đoạn bầu chọn)**: Ban đầu mọi node đều ở trong giai đoạn bầu chọn; chỉ cần một node nhận được số phiếu lớn hơn một nửa tổng số node, nó có thể trở thành Leader dự kiến (prospective Leader).
2. **Discovery (Giai đoạn khám phá)**: Ở giai đoạn này, các Follower giao tiếp với Leader dự kiến để đồng bộ các đề xuất giao dịch (transaction proposal) gần nhất mà các Follower đã nhận được.
3. **Synchronization (Giai đoạn đồng bộ)**: Giai đoạn đồng bộ chủ yếu sử dụng lịch sử đề xuất mới nhất mà Leader thu được ở giai đoạn trước để đồng bộ toàn bộ các bản sao (replica) trong cụm. Chỉ sau khi đồng bộ hoàn tất, Leader dự kiến mới trở thành Leader thực sự.
4. **Broadcast (Giai đoạn phát tán)**: Khi bước vào giai đoạn này, cụm ZooKeeper mới chính thức cung cấp dịch vụ giao dịch ra bên ngoài và Leader có thể thực hiện phát tán thông điệp (Message Broadcast). Đồng thời nếu có node mới tham gia, cụm cũng cần đồng bộ dữ liệu cho node mới đó.

Trạng thái của các server trong cụm ZooKeeper gồm những loại sau:

- **LOOKING**: Đang tìm kiếm Leader.
- **LEADING**: Trạng thái Leader, ứng với node đang làm Leader.
- **FOLLOWING**: Trạng thái Follower, ứng với node đang làm Follower.
- **OBSERVING**: Trạng thái Observer, ứng với node đang làm Observer; node này không tham gia bầu chọn Leader.

### Vì sao cụm ZooKeeper tốt nhất nên có số lượng máy chủ lẻ?

Trong cụm ZooKeeper, sau khi một số server bị sập, toàn bộ ZooKeeper vẫn khả dụng chỉ khi số lượng ZooKeeper server còn lại lớn hơn số lượng server đã sập. Giả sử cụm của chúng ta có `n` ZooKeeper server, tức là số server còn sống phải lớn hơn `n/2`. Nói thẳng kết luận trước: khả năng chịu lỗi của `2n` và `2n - 1` là hoàn toàn giống nhau, đều là `n - 1`. Mọi người có thể tự suy nghĩ kỹ một chút, đây thực ra là một bài toán rất đơn giản.

Ví dụ: nếu chúng ta có 3 máy, số ZooKeeper server tối đa cho phép sập là 1 máy; nếu có 4 máy thì cũng chỉ cho phép sập tối đa 1 máy.
Nếu chúng ta có 5 máy, số ZooKeeper server tối đa cho phép sập là 2 máy; nếu có 6 máy thì cũng vẫn chỉ cho phép sập tối đa 2 máy.

Tóm lại, cần gì phải tốn thêm một máy ZooKeeper dư thừa đó nữa?

### Cơ chế quá bán trong bầu chọn của ZooKeeper ngăn chặn Split-Brain như thế nào?

**Split-Brain (chia rẽ cụm / đa chủ) là gì?**

Với một cụm, thông thường nhiều máy sẽ được triển khai ở các phòng máy (Data Center) khác nhau để tăng tính sẵn sàng. Khi cố gắng đảm bảo tính sẵn sàng, có thể xảy ra tình trạng đứt đường truyền mạng giữa các phòng máy khiến mạng giữa các phòng máy không thông nhau, làm cụm bị chia cắt thành nhiều cụm nhỏ. Khi đó các cụm con tự bầu chủ riêng dẫn đến tình trạng "Split-Brain".

Ví dụ minh họa: giả sử hiện có một cụm gồm 6 server đặt tại 2 phòng máy, mỗi phòng máy 3 server. Trong điều kiện bình thường chỉ có 1 Leader, nhưng khi mạng giữa 2 phòng máy bị ngắt, 3 server ở mỗi phòng máy đều cho rằng 3 server ở phòng máy kia đã offline, rồi tự bầu ra Leader riêng của mình và tiếp nhận phục vụ ra bên ngoài. Nếu không có cơ chế quá bán (Quorum), khi mạng khôi phục lại sẽ phát hiện có tới 2 Leader — giống như 1 bộ não (Leader) bị tách thành 2 bộ não, đó chính là hiện tượng Split-Brain. Trong thời gian xảy ra Split-Brain, cả 2 bộ não đều có thể đã phục vụ request, kéo theo các vấn đề mất nhất quán dữ liệu.

**Cơ chế quá bán ngăn chặn hiện tượng Split-Brain như thế nào?**

Cơ chế quá bán của ZooKeeper khiến việc sinh ra 2 Leader là bất khả thi, bởi số lượng node nhỏ hơn hoặc bằng một nửa không bao giờ có thể bầu ra Leader. Điều đó đảm bảo dù các máy trong cụm được phân bổ qua các phòng máy như thế nào cũng không thể xảy ra Split-Brain.

## Giao thức ZAB và Thuật toán Paxos

Có thể nói thuật toán Paxos chính là linh hồn của ZooKeeper. Tuy nhiên, ZooKeeper không áp dụng hoàn toàn thuật toán Paxos, mà sử dụng giao thức ZAB làm thuật toán cốt lõi để đảm bảo tính nhất quán dữ liệu. Ngoài ra, tài liệu chính thức của ZooKeeper cũng chỉ rõ rằng giao thức ZAB không giống như thuật toán Paxos — vốn là một thuật toán đồng thuận phân tán tổng quát — mà nó là một thuật toán phát tán thông điệp nguyên tử có khả năng khôi phục sau sự cố (crash-recoverable atomic message broadcast) được thiết kế chuyên biệt cho ZooKeeper.

### Giới thiệu giao thức ZAB

Giao thức ZAB (ZooKeeper Atomic Broadcast — Phát tán nguyên tử ZooKeeper) là giao thức phát tán nguyên tử hỗ trợ khôi phục sau sự cố được thiết kế chuyên biệt cho dịch vụ điều phối phân tán ZooKeeper. Trong ZooKeeper, tính nhất quán dữ liệu phân tán chủ yếu dựa vào giao thức ZAB; trên nền tảng giao thức đó, ZooKeeper hiện thực một kiến trúc hệ thống theo mô hình chính-phụ (Primary-Backup) để giữ tính nhất quán dữ liệu giữa các bản sao (replica) trong cụm.

### Hai chế độ cơ bản của giao thức ZAB: Crash Recovery và Message Broadcast

Giao thức ZAB bao gồm hai chế độ cơ bản:

- **Crash Recovery (Khôi phục sau sự cố)**: Khi toàn bộ hệ thống đang trong quá trình khởi động, hoặc khi Leader server gặp các tình huống bất thường như gián đoạn mạng, sập nguồn thoát đột ngột và khởi động lại, giao thức ZAB sẽ bước vào chế độ khôi phục và tiến hành bầu chọn Leader server mới. Khi đã bầu ra Leader server mới, đồng thời quá nửa số máy trong cụm đã hoàn thành đồng bộ trạng thái với Leader server đó, giao thức ZAB sẽ thoát khỏi chế độ khôi phục. Trong đó, **cái gọi là đồng bộ trạng thái chính là đồng bộ dữ liệu, nhằm đảm bảo có quá nửa số máy trong cụm duy trì được trạng thái dữ liệu nhất quán với Leader server**.
- **Message Broadcast (Phát tán thông điệp)**: **Khi đã có quá nửa Follower server hoàn thành đồng bộ trạng thái với Leader server, toàn bộ hệ thống có thể bước vào chế độ phát tán thông điệp.** Khi một server mới tuân thủ giao thức ZAB khởi động và gia nhập cụm tại thời điểm đã có một Leader server đang phụ trách phát tán thông điệp, server mới gia nhập sẽ tự động bước vào chế độ khôi phục dữ liệu: tìm đến máy chủ đang làm Leader, thực hiện đồng bộ dữ liệu với nó, rồi sau đó cùng tham gia vào quy trình phát tán thông điệp.

### Bài viết gợi ý về giao thức ZAB & thuật toán Paxos

Kiến thức cần giảng giải và nắm vững về **giao thức ZAB & thuật toán Paxos** còn rất nhiều; chi tiết bạn có thể đọc thêm các bài viết dưới đây:

- [Giải thích chi tiết Thuật toán Paxos](https://javaguide.cn/distributed-system/protocol/paxos-algorithm.html)
- [Giải thích chi tiết Giao thức ZAB](https://javaguide.cn/distributed-system/protocol/zab.html)
- [Giải thích chi tiết Thuật toán Raft](https://javaguide.cn/distributed-system/protocol/raft-algorithm.html)

## ZooKeeper vs. ETCD

[ETCD](https://etcd.io/) là một hệ thống lưu trữ key-value phân tán có tính nhất quán mạnh (Strong Consistency), cung cấp cách thức tin cậy để lưu trữ dữ liệu mà hệ thống phân tán hoặc cụm máy cần truy cập. Bên trong ETCD sử dụng [thuật toán Raft](https://javaguide.cn/distributed-system/protocol/raft-algorithm.html) làm thuật toán đồng thuận và được viết bằng ngôn ngữ Go.

Tương tự như ZooKeeper, ETCD cũng có thể dùng cho các kịch bản như Publish/Subscribe dữ liệu, cân bằng tải, Naming Service, điều phối/thông báo phân tán, Distributed Lock, v.v. Vậy nên chọn cái nào giữa hai công cụ này?

Bài viết [Phân tích sơ bộ cách xây dựng kiến trúc High Availability dựa trên ZooKeeper](https://mp.weixin.qq.com/s/pBI3rjv5NdS1124Z7HQ-JA) của Dewu Tech đã đưa ra bảng so sánh sau (được tôi tối ưu lại thêm) để bạn tham khảo:

|                        | ZooKeeper                                                                                                 | ETCD                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Ngôn ngữ**           | Java                                                                                                      | Go                                                                                    |
| **Giao thức**          | TCP                                                                                                       | gRPC                                                                                  |
| **Gọi API**            | Bắt buộc phải sử dụng client riêng của nó để gọi                                                          | Có thể truyền qua HTTP, tức là có thể gọi trực tiếp bằng lệnh như `curl`              |
| **Thuật toán đồng thuận** | Giao thức ZAB                                                                                          | Thuật toán Raft                                                                       |
| **Cơ chế Watcher**     | Khá hạn chế, dạng kích hoạt một lần (one-time trigger)                                                    | Một lần Watch có thể lắng nghe liên tục toàn bộ sự kiện                               |
| **Mô hình dữ liệu**    | Mô hình phân cấp dạng thư mục                                                                             | Tham khảo mô hình dữ liệu của ZK nhưng là mô hình key-value phẳng (flat KV)           |
| **Lưu trữ**            | Lưu trữ KV dùng `ConcurrentHashMap`, lưu trong bộ nhớ; thường không khuyến nghị lưu nhiều dữ liệu         | Lưu trữ KV dùng storage engine `bbolt`, có thể xử lý tới vài GB dữ liệu               |
| **MVCC**               | Không hỗ trợ                                                                                              | Có hỗ trợ, quản lý phiên bản thông qua hai cây B+ Tree                                |
| **Global Session**     | Tồn tại khuyết điểm                                                                                       | Triển khai linh hoạt hơn, tránh được các vấn đề bảo mật                               |
| **Kiểm soát quyền**    | ACL                                                                                                       | RBAC                                                                                  |
| **Năng lực giao dịch** | Cung cấp năng lực transaction đơn giản                                                                    | Chỉ cung cấp khả năng kiểm tra theo số phiên bản                                      |
| **Triển khai & Vận hành** | Phức tạp                                                                                               | Đơn giản                                                                              |

ZooKeeper tồn tại những hạn chế nhất định về hiệu năng lưu trữ, Global Session và cơ chế Watcher. Ngày càng nhiều dự án mã nguồn mở thay thế ZooKeeper bằng các hiện thực Raft hoặc các dịch vụ điều phối phân tán khác, ví dụ: [Kafka Needs No Keeper - Removing ZooKeeper Dependency (confluent.io)](https://www.confluent.io/blog/removing-zookeeper-dependency-in-kafka/), [Moving Toward a ZooKeeper-Less Apache Pulsar (streamnative.io)](https://streamnative.io/blog/moving-toward-zookeeper-less-apache-pulsar).

Nhìn chung, ETCD vượt trội hơn một chút: cung cấp khả năng đọc ghi ổn định hơn dưới tải cao và đã cải thiện tối ưu nhiều vấn đề mà ZooKeeper bộc lộ. Hơn nữa, ETCD về cơ bản có thể bao phủ toàn bộ các kịch bản ứng dụng của ZooKeeper để thay thế cho nó.

## Tổng kết

1. Bản thân ZooKeeper là một chương trình phân tán (chỉ cần hơn một nửa số node còn sống thì ZooKeeper vẫn phục vụ bình thường).
2. Để đảm bảo High Availability, tốt nhất nên triển khai ZooKeeper theo dạng cụm, như vậy miễn là phần lớn các máy trong cụm còn khả dụng (chịu được một số lỗi máy) thì bản thân ZooKeeper vẫn khả dụng.
3. ZooKeeper lưu dữ liệu trong bộ nhớ, nhờ đó đảm bảo thông lượng cao (High Throughput) và độ trễ thấp (Low Latency) — nhưng bộ nhớ cũng giới hạn dung lượng lưu trữ không thể quá lớn, và giới hạn này cũng là một lý do khiến lượng dữ liệu lưu trong mỗi znode nên giữ ở mức nhỏ.
4. ZooKeeper có hiệu năng cao, đặc biệt rõ rệt trong các ứng dụng có lượng "đọc" nhiều hơn "ghi", bởi thao tác "ghi" sẽ dẫn đến đồng bộ trạng thái giữa toàn bộ các server ("đọc" nhiều hơn "ghi" là kịch bản điển hình của dịch vụ điều phối).
5. ZooKeeper có khái niệm Ephemeral Node (node tạm thời). Khi Session của client đã tạo Ephemeral Node còn duy trì hoạt động, node tạm thời đó vẫn tồn tại; còn khi Session kết thúc, node tạm thời sẽ bị xóa. Persistent Node là loại znode mà một khi đã được tạo sẽ tồn tại mãi trên ZooKeeper trừ khi chủ động thực hiện thao tác xóa znode đó.
6. Ở tầng dưới, ZooKeeper thực chất chỉ cung cấp hai chức năng: ① Quản lý (lưu trữ, đọc) dữ liệu do chương trình người dùng gửi lên; ② Cung cấp dịch vụ lắng nghe sự kiện node dữ liệu cho chương trình người dùng.

## Tài liệu tham khảo

- *Từ Paxos đến ZooKeeper: Nguyên lý và Thực hành Nhất quán Phân tán* (*From Paxos to ZooKeeper*)
- Bàn về những hạn chế của ZooKeeper: <https://wingsxdu.com/posts/database/zookeeper-limitations/>
