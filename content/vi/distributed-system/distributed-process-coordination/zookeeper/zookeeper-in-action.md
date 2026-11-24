---
title: "Hướng dẫn thực hành ZooKeeper: Triển khai Docker, Lệnh zkCli, Lệnh bốn chữ và Curator Client"
category: Hệ thống phân tán
description: "Hướng dẫn thực hành ZooKeeper, bao gồm cài đặt và triển khai bằng Docker, các lệnh zkCli thường dùng, lệnh bốn chữ (four-letter commands), thao tác CRUD với Java client Curator và ví dụ Distributed Lock dựa trên ZooKeeper."
tag:
  - ZooKeeper
head:
  - - meta
    - name: keywords
      content: ZooKeeper,Thực hành ZooKeeper,Cài đặt ZooKeeper,zkCli,Curator,Lệnh bốn chữ,Triển khai Docker,Distributed Lock,Hướng dẫn ZooKeeper
lang: vi
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/zookeeper-in-action.md
---

Bài viết này sẽ minh họa ngắn gọn cách sử dụng các lệnh phổ biến của ZooKeeper cũng như cách sử dụng cơ bản Java client Curator cho ZooKeeper. Những nội dung được giới thiệu đều là các thao tác cơ bản nhất, đủ đáp ứng nhu cầu công việc hằng ngày.

Bài viết này thiên về thực hành, không đi sâu giải thích vì sao ZooKeeper làm được việc điều phối. Bạn nên đọc trước [Hướng dẫn nhập môn ZooKeeper](./zookeeper-intro.md) để nắm về ZNode, Watcher, Session, sau đó đọc tiếp [Giải thích chuyên sâu ZooKeeper](./zookeeper-plus.md) hoặc [Giải thích chi tiết Giao thức ZAB](../../protocol/zab.md) để bổ sung kiến thức về giao thức và cơ chế cụm.

Nếu bài viết có chỗ nào cần cải thiện và hoàn thiện hơn, rất mong các bạn góp ý trong phần bình luận để cùng nhau tiến bộ!

## Cài đặt ZooKeeper

### Cài đặt ZooKeeper bằng Docker

**a. Tải ZooKeeper bằng Docker**

```shell
docker pull zookeeper:3.5.8
```

**b. Chạy ZooKeeper**

```shell
docker run -d --name zookeeper -p 2181:2181 zookeeper:3.5.8
```

### Kết nối tới dịch vụ ZooKeeper

**a. Truy cập vào trong container ZooKeeper**

Trước tiên dùng lệnh `docker ps` để xem `ContainerID` của ZooKeeper, sau đó dùng lệnh `docker exec -it ContainerID /bin/bash` để đi vào bên trong container.

**b. Vào thư mục `bin`, sau đó kết nối tới dịch vụ ZooKeeper thông qua lệnh `./zkCli.sh -server 127.0.0.1:2181`**

```bash
root@eaf70fc620cb:/apache-zookeeper-3.5.8-bin# cd bin
```

Nếu bạn thấy console in ra thành công các thông tin như hình dưới đây, nghĩa là bạn đã kết nối thành công tới dịch vụ ZooKeeper.

![Kết nối tới dịch vụ ZooKeeper](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/connect-zooKeeper-service-fa68db2a.png)

## Minh họa các lệnh ZooKeeper thường dùng

### Xem các lệnh thường dùng (Lệnh `help`)

Dùng lệnh `help` để xem danh sách các lệnh thường dùng của ZooKeeper.

### Tạo node (Lệnh `create`)

Tạo node `node1` dưới thư mục gốc bằng lệnh `create`, gắn với chuỗi ký tự `"node1"`:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 34] create /node1 “node1”
```

Tạo node con dưới `/node1` bằng lệnh `create`, gắn với nội dung là con số `123`:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 1] create /node1/node1.1 123
Created /node1/node1.1
```

### Cập nhật nội dung dữ liệu node (Lệnh `set`)

```shell
[zk: 127.0.0.1:2181(CONNECTED) 11] set /node1 "set node1"
```

### Lấy dữ liệu của node (Lệnh `get`)

Lệnh `get` có thể lấy nội dung dữ liệu và trạng thái của node chỉ định; có thể thấy thông qua lệnh `set`, chúng ta đã sửa nội dung dữ liệu của node thành `"set node1"`.

```shell
[zk: zookeeper(CONNECTED) 12] get -s /node1
set node1
cZxid = 0x47
ctime = Sun Jan 20 10:22:59 CST 2019
mZxid = 0x4b
mtime = Sun Jan 20 10:41:10 CST 2019
pZxid = 0x4a
cversion = 1
dataVersion = 1
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 9
numChildren = 1

```

### Xem các node con dưới một thư mục (Lệnh `ls`)

Dùng lệnh `ls` để xem các node dưới thư mục gốc:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 37] ls /
[dubbo, ZooKeeper, node1]
```

Dùng lệnh `ls` để xem các node dưới thư mục `node1`:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 5] ls /node1
[node1.1]
```

Lệnh `ls` trong ZooKeeper tương tự như lệnh `ls` trong Linux: lệnh này sẽ liệt kê thông tin tất cả các node con nằm trực tiếp dưới đường dẫn tuyệt đối `path` (chỉ liệt kê 1 cấp, không đệ quy).

### Xem trạng thái node (Lệnh `stat`)

Dùng lệnh `stat` để xem trạng thái node:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 10] stat /node1
cZxid = 0x47
ctime = Sun Jan 20 10:22:59 CST 2019
mZxid = 0x47
mtime = Sun Jan 20 10:22:59 CST 2019
pZxid = 0x4a
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 11
numChildren = 1
```

Một số thông tin hiển thị ở trên như `cversion`, `aclVersion`, `numChildren`, v.v., tôi đã giới thiệu trong bài viết "[Tổng hợp khái niệm liên quan ZooKeeper (Nhập môn)](https://javaguide.cn/distributed-system/distributed-process-coordination/zookeeper/zookeeper-intro.html)".

### Xem thông tin và trạng thái node (Lệnh `ls2`)

Lệnh `ls2` giống như sự kết hợp giữa lệnh `ls` và lệnh `stat`. Thông tin mà lệnh `ls2` trả về gồm 2 phần:

1. Danh sách node con
2. Thông tin `stat` của node hiện tại.

```shell
[zk: 127.0.0.1:2181(CONNECTED) 7] ls2 /node1
[node1.1]
cZxid = 0x47
ctime = Sun Jan 20 10:22:59 CST 2019
mZxid = 0x47
mtime = Sun Jan 20 10:22:59 CST 2019
pZxid = 0x4a
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 11
numChildren = 1

```

### Xóa node (Lệnh `delete`)

Lệnh này rất đơn giản, nhưng có một điểm cần lưu ý là nếu bạn muốn xóa một node nào đó thì node đó bắt buộc phải không có node con.

```shell
[zk: 127.0.0.1:2181(CONNECTED) 3] delete /node1/node1.1
```

Ở phần sau tôi sẽ giới thiệu cách sử dụng Java client API cũng như cách dùng các ZooKeeper client mã nguồn mở là ZkClient và Curator.

## Sử dụng cơ bản Curator — Java Client cho ZooKeeper

Curator là một framework ZooKeeper Java client do Netflix mã nguồn mở. So với client mặc định đi kèm của ZooKeeper, Curator đóng gói hoàn thiện hơn nhiều và cho phép sử dụng các API một cách thuận tiện hơn.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/curator-310c2cc4.png)

Dưới đây chúng ta hãy cùng minh họa đơn giản cách sử dụng Curator nhé!

Phiên bản Curator 4.0+ hỗ trợ tốt cho ZooKeeper 3.5.x. Trước khi bắt đầu, hãy thêm các dependency dưới đây vào dự án của bạn:

```xml
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>4.2.0</version>
</dependency>
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>4.2.0</version>
</dependency>
```

### Kết nối với ZooKeeper Client

Tạo đối tượng `CuratorFramework` thông qua `CuratorFrameworkFactory`, rồi gọi phương thức `start()` của đối tượng `CuratorFramework` là được!

```java
private static final int BASE_SLEEP_TIME = 1000;
private static final int MAX_RETRIES = 3;

// Retry strategy. Retry 3 times, and will increase the sleep time between retries.
RetryPolicy retryPolicy = new ExponentialBackoffRetry(BASE_SLEEP_TIME, MAX_RETRIES);
CuratorFramework zkClient = CuratorFrameworkFactory.builder()
    // the server to connect to (can be a server list)
    .connectString("127.0.0.1:2181")
    .retryPolicy(retryPolicy)
    .build();
zkClient.start();
```

Giải thích một số tham số cơ bản:

- `baseSleepTimeMs`: Thời gian chờ ban đầu giữa các lần thử lại (retry)
- `maxRetries`: Số lần thử lại tối đa
- `connectString`: Danh sách server cần kết nối
- `retryPolicy`: Chính sách thử lại (Retry Policy)

### Thao tác Thêm, Xóa, Sửa, Đọc (CRUD) node dữ liệu

#### Tạo node

Trong bài [Giải thích các khái niệm thường gặp của ZooKeeper](./zookeeper-intro.md), chúng ta đã giới thiệu việc chia znode thành 4 loại lớn:

- **Persistent Node (Node bền vững - `PERSISTENT`)**: Một khi đã tạo sẽ tồn tại mãi ngay cả khi cụm ZooKeeper gặp sự cố, cho tới khi chủ động xóa nó.
- **Ephemeral Node (Node tạm thời - `EPHEMERAL`)**: Vòng đời của Ephemeral Node gắn liền với **Session của client**; **Session mất thì node cũng mất theo**. Hơn nữa, **Ephemeral Node chỉ có thể làm node lá**, không thể tạo node con.
- **Persistent Sequential Node (Node bền vững tuần tự - `PERSISTENT_SEQUENTIAL`)**: Ngoài các đặc tính của Persistent Node (`PERSISTENT`), tên của các node con còn có tính tuần tự. Ví dụ `/node1/app0000000001`, `/node1/app0000000002`.
- **Ephemeral Sequential Node (Node tạm thời tuần tự - `EPHEMERAL_SEQUENTIAL`)**: Ngoài các đặc tính của Ephemeral Node (`EPHEMERAL`), tên của các node con còn có tính tuần tự.

Khi sử dụng ZooKeeper, bạn sẽ thấy trong lớp `CreateMode` thực tế có tới 7 loại znode, nhưng được dùng nhiều nhất vẫn là 4 loại nêu trên.

**a. Tạo Persistent Node (node bền vững)**

Bạn có thể tạo node bền vững theo hai cách bên dưới:

```java
// Lưu ý: Đoạn code dưới đây sẽ báo lỗi, nguyên nhân cụ thể được giải thích ở bên dưới
zkClient.create().forPath("/node1/00001");
zkClient.create().withMode(CreateMode.PERSISTENT).forPath("/node1/00002");
```

Tuy nhiên, khi chạy đoạn code trên bạn sẽ gặp lỗi, nguyên nhân là do node cha `node1` vẫn chưa được tạo.

Bạn có thể tạo node cha `node1` trước rồi mới chạy đoạn code trên thì sẽ không còn báo lỗi nữa:

```java
zkClient.create().forPath("/node1");
```

Cách làm được khuyến nghị hơn là thông qua dòng code dưới đây: **`creatingParentsIfNeeded()` đảm bảo tự động tạo node cha nếu node cha chưa tồn tại, điều này cực kỳ hữu ích.**

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.PERSISTENT).forPath("/node1/00001");
```

**b. Tạo Ephemeral Node (node tạm thời)**

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.EPHEMERAL).forPath("/node1/00001");
```

**c. Tạo node và chỉ định nội dung dữ liệu**

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.EPHEMERAL).forPath("/node1/00001","java".getBytes());
zkClient.getData().forPath("/node1/00001");// Lấy nội dung dữ liệu của node, kết quả trả về là mảng byte
```

**d. Kiểm tra xem node đã được tạo thành công hay chưa**

```java
zkClient.checkExists().forPath("/node1/00001");// Nếu khác null nghĩa là node đã được tạo thành công
```

#### Xóa node

**a. Xóa một node con**

```java
zkClient.delete().forPath("/node1/00001");
```

**b. Xóa một node cùng toàn bộ các node con bên dưới nó**

```java
zkClient.delete().deletingChildrenIfNeeded().forPath("/node1");
```

#### Lấy / Cập nhật nội dung dữ liệu node

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.EPHEMERAL).forPath("/node1/00001","java".getBytes());
zkClient.getData().forPath("/node1/00001");// Lấy nội dung dữ liệu của node
zkClient.setData().forPath("/node1/00001","c++".getBytes());// Cập nhật nội dung dữ liệu của node
```

#### Lấy danh sách đường dẫn tất cả node con của một node

```java
List<String> childrenPaths = zkClient.getChildren().forPath("/node1");
```
