---
title: Tổng hợp các khái niệm cốt lõi của Docker
description: "Hệ thống hóa các khái niệm cốt lõi của Docker và sự khác biệt giữa Container với Virtual Machine, nắm vững mối quan hệ giữa Image, Container và Repository cũng như giá trị thực tiễn trong quá trình bàn giao và triển khai."
category: Công cụ phát triển
tag:
  - Docker
lang: vi
sourceRef: zh-ref/tools/docker/docker-intro.md
head:
  - - meta
    - name: keywords
      content: Docker,container,image,repository,engine,cô lập,so sánh máy ảo,triển khai
---

Bài viết này tập trung trình bày các khái niệm cốt lõi, mô hình vận hành và các kịch bản sử dụng phổ biến của Docker, không đi sâu vào quá trình cài đặt. Về hướng dẫn cài đặt, thực hành câu lệnh và khởi chạy dịch vụ ở local, bạn có thể xem bài viết tiếp theo [Docker thực chiến](./docker-in-action.md).

## Giới thiệu về Container

Docker là một nền tảng container phần mềm rất phổ biến. Để hiểu rõ Docker, trước hết cần nắm được Container thực chất giải quyết vấn đề gì.

### Container là gì?

#### Trước tiên hãy xem định nghĩa tương đối chính thức về Container

**Tóm tắt Container trong một câu: Container là việc đóng gói phần mềm thành một đơn vị tiêu chuẩn hóa để phục vụ phát triển, bàn giao và triển khai.**

- **Container Image là gói phần mềm độc lập, nhẹ và có thể thực thi trực tiếp**, bao gồm mọi thành phần cần thiết để phần mềm chạy được: mã nguồn, môi trường runtime, công cụ hệ thống, thư viện hệ thống và các thiết lập cấu hình.
- **Phần mềm được container hóa phù hợp cho cả ứng dụng trên nền Linux và Windows, có thể chạy đồng nhất trong mọi môi trường.**
- **Container mang lại tính độc lập cho phần mềm**, giúp nó không bị ảnh hưởng bởi sự khác biệt của môi trường bên ngoài (ví dụ: sự khác nhau giữa môi trường dev và staging), từ đó giảm thiểu xung đột giữa các nhóm khi vận hành các phần mềm khác nhau trên cùng một hạ tầng.

#### Tiếp theo hãy xem cách giải thích bình dân, dễ hiểu hơn về Container

Nếu phải mô tả Container một cách dễ hiểu, tôi thấy Container giống như một nơi dùng để chứa đồ vật, tương tự như chiếc cặp sách đựng đủ loại văn phòng phẩm, tủ quần áo đựng quần áo, hay kệ giày để các loại giày dép vậy. Thứ mà Container chúng ta đang nói tới lưu giữ thiên về ứng dụng hơn, chẳng hạn như website, chương trình hay thậm chí là cả một môi trường hệ thống.

![Tìm hiểu về Container](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/container-f3c06465.png)

### Minh họa máy vật lý, máy ảo (Virtual Machine) và Container

Phần so sánh chi tiết giữa Virtual Machine và Container sẽ được trình bày kỹ ở phía sau; tại đây chỉ dùng một số hình ảnh trên mạng để giúp bạn hình dung rõ hơn về ba khái niệm máy vật lý, Virtual Machine và Container (các hình ảnh dưới đây sưu tầm từ internet).

**Máy vật lý (Physical Machine):**

![Máy vật lý](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/.jpeg-5e717e56.jpg)

**Máy ảo (Virtual Machine):**

![Máy ảo](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/.jpeg-76fa0c60.jpg)

**Container:**

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211110104003678-30e480c8.png)

Qua ba bức ảnh trừu tượng trên, chúng ta có thể khái quát sơ bộ bằng phép so sánh tương đồng: **Container thực hiện ảo hóa ở tầng hệ điều hành chứ không phải phần cứng, và các Container dùng chung cùng một bộ tài nguyên hệ điều hành. Trong khi đó, công nghệ Virtual Machine ảo hóa ra một bộ phần cứng rồi chạy một hệ điều hành hoàn chỉnh bên trên nó. Vì vậy, mức độ cô lập của Container sẽ thấp hơn một chút.**

### Container và Virtual Machine

Mỗi khi nhắc đến Container, không thể không đặt lên bàn cân so sánh với Virtual Machine (VM). Theo quan điểm của tôi, giữa hai công nghệ này không phải cái nào thay thế cái nào, mà cả hai có thể cùng tồn tại hài hòa.

Nói một cách đơn giản: **Container và Virtual Machine có những lợi thế tương đồng về cô lập và phân bổ tài nguyên, nhưng chức năng có sự khác biệt vì Container ảo hóa hệ điều hành thay vì phần cứng, do đó Container dễ di chuyển giữa các môi trường hơn và đạt hiệu suất cao hơn.**

Công nghệ Virtual Machine truyền thống giả lập một bộ phần cứng rồi chạy cả một hệ điều hành hoàn chỉnh trên đó, sau đó mới chạy các Process (tiến trình) ứng dụng cần thiết bên trong hệ điều hành ấy. Ngược lại, Process ứng dụng trong Container chạy trực tiếp trên kernel của máy host; Container không có kernel riêng và cũng không thực hiện ảo hóa phần cứng. Nhờ vậy, Container nhẹ hơn rất nhiều so với máy ảo truyền thống.

![](/media/jg/ext/oss.javaguide.cn/javaguide/2e2b95eebf60b6d03f6c1476f4d7c697-89a60e45.png)

**So sánh giữa Container và Virtual Machine**:

![](/media/jg/ext/oss.javaguide.cn/javaguide/4ef8691d67eb1eb53217099d0a691eb5-6271f3da.png)

- Container là một lớp trừu tượng ở tầng ứng dụng, dùng để đóng gói mã nguồn và các tài nguyên phụ thuộc lại với nhau. Nhiều Container có thể chạy trên cùng một máy, dùng chung kernel hệ điều hành, nhưng mỗi Container vận hành như các Process độc lập trong không gian người dùng (user space). So với Virtual Machine, **Container chiếm rất ít dung lượng** (kích thước Image thường chỉ vài chục MB) và **khởi động gần như tức thì**.

- Virtual Machine (VM) là một lớp trừu tượng ở tầng phần cứng vật lý, biến một server thành nhiều server. Hypervisor cho phép nhiều VM chạy trên cùng một máy vật lý. Mỗi VM chứa trọn vẹn một hệ điều hành, một hoặc nhiều ứng dụng cùng các file nhị phân và thư viện cần thiết, do đó **chiếm rất nhiều dung lượng**. Bên cạnh đó, quá trình **khởi động VM cũng khá chậm chạp**.

Qua trang chủ chính thức của Docker, chúng ta thấy Docker sở hữu rất nhiều ưu điểm, nhưng cũng không cần thiết phải phủ nhận hoàn toàn công nghệ máy ảo vì cả hai phục vụ các kịch bản sử dụng khác nhau. **Virtual Machine vượt trội trong việc cô lập triệt để toàn bộ môi trường vận hành** — ví dụ, các nhà cung cấp dịch vụ đám mây thường dùng công nghệ VM để cô lập từng người dùng (tenant) khác nhau. Còn **Docker thường dùng để cô lập các ứng dụng khác nhau**, chẳng hạn như tách biệt frontend, backend và cơ sở dữ liệu.

Theo cá nhân tôi, không có chuyện bên nào thay thế hoàn toàn bên nào, mà cả hai có thể phối hợp nhịp nhàng với nhau.

![](/media/jg/ext/oss.javaguide.cn/javaguide/056c87751b9dd7b56f4264240fe96d00-d9855aa3.png)

## Giới thiệu về Docker

### Docker là gì?

Bạn có thể hiểu Docker qua các góc độ dưới đây:

- **Docker là một nền tảng container phần mềm.**
- **Docker** được phát triển bằng ngôn ngữ Go, dựa trên các cơ chế mà nhân Linux cung cấp như `cgroups`, `namespaces` và UnionFS để đóng gói và cô lập Process, thuộc nhóm công nghệ ảo hóa ở tầng hệ điều hành.
- Docker có khả năng đóng gói ứng dụng cùng các thành phần phụ thuộc khi chạy vào trong Image, giảm thiểu các sự cố phát sinh do môi trường dev, test và triển khai không đồng nhất.
- Người dùng có thể dễ dàng tạo và sử dụng Container để đưa ứng dụng của mình vào chạy bên trong. Container còn hỗ trợ quản lý phiên bản, sao chép, chia sẻ, chỉnh sửa giống như quản lý mã nguồn thông thường.

**Triết lý của Docker**:

- **Container vận tải (Shipping Container)**: Giống như các thùng container trong vận tải đường biển, Docker Container chứa ứng dụng cùng toàn bộ các dependency của nó, đảm bảo ứng dụng vận hành theo đúng cùng một cách trên mọi môi trường.
- **Tiêu chuẩn hóa**: Chuẩn hóa phương thức vận chuyển, lưu trữ và các giao diện API.
- **Cô lập**: Mỗi Docker Container chạy trong môi trường cô lập riêng, tách biệt với máy host và các Container khác.

### Đặc điểm của Docker Container

- **Nhẹ**: Nhiều Docker Container chạy trên cùng một máy có thể dùng chung kernel hệ điều hành của máy đó; chúng khởi động rất nhanh và chỉ tiêu tốn rất ít tài nguyên tính toán lẫn bộ nhớ. Image được cấu trúc từ các lớp hệ thống tập tin (filesystem layers) và chia sẻ những tệp tin dùng chung, nhờ đó giảm tối đa dung lượng ổ đĩa và giúp tải Image nhanh hơn.
- **Tiêu chuẩn**: Docker Container dựa trên các chuẩn mở, có khả năng vận hành trên mọi bản phân phối Linux phổ biến, Microsoft Windows cũng như bất kỳ hạ tầng nào bao gồm VM, máy chủ vật lý (bare-metal) và cloud.
- **An toàn**: Khả năng cô lập mà Docker mang lại cho ứng dụng không chỉ giới hạn ở việc tách biệt lẫn nhau, mà còn độc lập với hạ tầng bên dưới. Docker cung cấp mức độ cô lập mạnh mẽ theo mặc định, vì vậy nếu một ứng dụng gặp sự cố thì chỉ ảnh hưởng trong phạm vi một Container đơn lẻ chứ không lan ra toàn bộ máy chủ.

### Tại sao nên dùng Docker?

- Docker Image cung cấp môi trường runtime hoàn chỉnh (ngoại trừ kernel), đảm bảo tính đồng nhất của môi trường chạy ứng dụng, chấm dứt tình trạng "code này trên máy tôi chạy bình thường mà!" — *Môi trường vận hành nhất quán*
- Có thể đạt thời gian khởi động tính bằng giây, thậm chí mili-giây, tiết kiệm đáng kể thời gian phát triển, kiểm thử và triển khai. — *Thời gian khởi động nhanh hơn*
- Tránh tình trạng dùng chung server khiến tài nguyên dễ bị ảnh hưởng bởi người dùng khác. — *Tính cô lập*
- Xử lý tốt các đợt tăng vọt đột ngột về lưu lượng truy cập server. — *Mở rộng linh hoạt, tăng quy mô nhanh chóng*
- Dễ dàng di chuyển một ứng dụng đang chạy trên nền tảng này sang nền tảng khác mà không phải lo lắng sự thay đổi môi trường làm ứng dụng không chạy được. — *Di chuyển thuận tiện*
- Sử dụng Docker giúp tùy chỉnh Image ứng dụng để triển khai tích hợp liên tục (CI), chuyển giao liên tục (CD) và triển khai tự động. — *Chuyển giao và triển khai liên tục*

---

## Các khái niệm cơ bản trong Docker

Trong Docker có ba khái niệm nền tảng vô cùng quan trọng: Image, Container và Repository.

Hiểu được ba khái niệm này đồng nghĩa với việc bạn đã nắm trọn vòng đời của Docker.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-build-run-e0832a5d.png)

### Image: Một hệ thống tập tin đặc biệt

**Hệ điều hành được chia thành không gian nhân (kernel space) và không gian người dùng (user space).** Đối với Linux, sau khi kernel khởi động, nó sẽ mount root filesystem để cung cấp hỗ trợ cho user space. Còn Docker Image tương đương với một root filesystem như vậy.

**Docker Image là một hệ thống tập tin đặc biệt: ngoài việc cung cấp các chương trình, thư viện, tài nguyên và tệp cấu hình cần thiết khi Container chạy, nó còn chứa một số tham số cấu hình chuẩn bị sẵn cho lúc thực thi (như anonymous volume, biến môi trường, user, v.v.).** Image không chứa bất kỳ dữ liệu động nào và nội dung của nó cũng không bị thay đổi sau khi build xong.

Khi thiết kế Docker, đội ngũ phát triển đã tận dụng triệt để công nghệ **Union FS** để xây dựng theo **kiến trúc lưu trữ phân lớp (layered storage)**. Thực chất, một Image được cấu thành từ nhiều lớp hệ thống tập tin hợp nhất lại với nhau.

**Khi build Image, các lớp (layer) được tạo ra từng tầng một, lớp trước là nền tảng cho lớp sau. Mỗi lớp sau khi build xong sẽ không thay đổi nữa; mọi thay đổi ở lớp sau chỉ diễn ra trên chính lớp đó.** Ví dụ, thao tác xóa một tệp ở lớp trước thực chất không phải xóa thật tệp đó khỏi lớp trước, mà chỉ đánh dấu tệp này đã bị xóa ở lớp hiện tại. Khi Container thực sự chạy, dù ta không còn nhìn thấy tệp đó, nhưng trên thực tế tệp vẫn nằm trong Image. Do đó, khi build Image cần hết sức cẩn thận: mỗi lớp chỉ nên chứa những gì cần thêm cho lớp đó, và mọi tệp dư thừa nên được dọn sạch trước khi kết thúc việc build lớp ấy.

Đặc tính lưu trữ phân lớp còn giúp việc tái sử dụng và tùy biến Image trở nên dễ dàng hơn nhiều. Bạn thậm chí có thể lấy một Image đã build sẵn trước đó làm lớp nền, rồi bổ sung thêm các lớp mới để tùy biến nội dung theo nhu cầu và tạo ra Image mới.

### Container: Thực thể của Image khi đang chạy

Mối quan hệ giữa Image và Container giống như mối quan hệ giữa Class và Instance trong Lập trình hướng đối tượng (OOP): Image là định nghĩa tĩnh, còn **Container là thực thể runtime của Image. Container có thể được tạo, khởi chạy, dừng, xóa, tạm dừng, v.v.**

**Bản chất của Container là một Process, nhưng khác với Process chạy trực tiếp trên máy host, Process của Container vận hành trong một namespace độc lập thuộc về riêng nó. Như đã đề cập, Image sử dụng cơ chế lưu trữ phân lớp, và Container cũng như vậy.**

**Vòng đời của lớp lưu trữ (storage layer) của Container gắn liền với Container đó: khi Container bị hủy, lớp lưu trữ của Container cũng biến mất theo. Vì thế, mọi dữ liệu được lưu trong lớp lưu trữ của Container sẽ mất hết khi Container bị xóa.**

Theo các nguyên tắc thực hành tốt nhất (best practices) của Docker, **Container không nên ghi dữ liệu nghiệp vụ vào bên trong lớp lưu trữ của chính nó**, mà cần giữ lớp lưu trữ của Container ở trạng thái phi trạng thái (stateless) tối đa có thể. **Những dữ liệu cần lưu trữ bền vững (persistent) nên sử dụng Volume hoặc bind mount tới thư mục trên máy host**; các thao tác đọc/ghi này sẽ đi xuyên qua lớp lưu trữ Container, ghi thẳng xuống máy host hoặc hệ thống lưu trữ mạng, cho hiệu năng và độ ổn định cao hơn. Vòng đời của Volume độc lập với Container — xóa Container sẽ không tự động xóa Volume.

### Repository: Nơi lưu trữ tập trung các tệp Image

Sau khi build xong Image, bạn có thể dễ dàng chạy nó trên máy host hiện tại. Tuy nhiên, **nếu cần sử dụng Image này trên các server khác, chúng ta cần một dịch vụ lưu trữ và phân phối Image tập trung — đó chính là vai trò của Docker Registry.**

Một Docker Registry có thể chứa nhiều Repository; mỗi Repository có thể chứa nhiều Tag; và mỗi Tag tương ứng với một Image. Nói cách khác, **Image Repository là nơi Docker dùng để tập trung lưu trữ các tệp Image, tương tự như kho chứa mã nguồn (code repository) mà chúng ta vẫn hay dùng trước đây.**

Thông thường, **một Repository sẽ chứa các phiên bản khác nhau của cùng một phần mềm**, còn **Tag thường được dùng để đánh dấu từng phiên bản của phần mềm đó**. Chúng ta có thể chỉ định cụ thể một Image theo định dạng `<tên-repository>:<tag>`. Nếu không truyền Tag, Docker sẽ mặc định dùng `latest`. Tuy nhiên, trong môi trường production không nên phụ thuộc vào `latest`, tốt nhất hãy chỉ định rõ ràng Tag phiên bản để thuận tiện cho việc rollback và xử lý sự cố.

**Ở đây xin bổ sung thêm khái niệm về dịch vụ Docker Registry công khai và Docker Registry riêng tư (private):**

**Dịch vụ Docker Registry công khai** là dịch vụ Registry mở cho người dùng sử dụng và quản lý Image. Thông thường, các dịch vụ công khai này cho phép người dùng tải lên và tải xuống các Image công khai miễn phí, đồng thời có thể cung cấp gói trả phí để quản lý các Image riêng tư.

Dịch vụ Registry công khai phổ biến nhất là **Docker Hub** chính thức — đây cũng là Registry mặc định và sở hữu kho Image chính thức chất lượng cao đồ sộ tại địa chỉ: [https://hub.docker.com/](https://hub.docker.com/ "https://hub.docker.com/"). Phía Docker mô tả về Docker Hub như sau:

> Docker Hub là một dịch vụ do Docker cung cấp, giúp bạn tìm kiếm và chia sẻ các container image cùng đội ngũ của mình.

Ví dụ khi chúng ta muốn tìm kiếm Image mình cần:

![Tìm kiếm Image trên Docker Hub](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/Screen-Shot-2019-11-04-at-8.21.39-PM-dcb4ce92.png)

Trong kết quả tìm kiếm của Docker Hub, có vài thông tin quan trọng giúp chúng ta lựa chọn Image phù hợp:

- **OFFICIAL Image**: Cho biết Image được cung cấp và duy trì bởi chính đội ngũ Docker, nhìn chung độ ổn định và tính bảo mật cao hơn.
- **Stars**: Tương tự như lượt thích, giống với Star trên GitHub.
- **Downloads**: Thể hiện số lượt Image được pull về, phần nào phản ánh mức độ phổ biến và tần suất sử dụng của Image.

Tất nhiên, ngoài cách tìm kiếm trực tiếp trên website Docker Hub, chúng ta cũng có thể dùng lệnh `docker search` để tìm kiếm Image trên Docker Hub với kết quả tương đương.

```bash
➜  ~ docker search mysql
NAME                              DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
mysql                             MySQL is a widely used, open-source relation…   8763                [OK]
mariadb                           MariaDB is a community-developed fork of MyS…   3073                [OK]
mysql/mysql-server                Optimized MySQL Server Docker images. Create…   650                                     [OK]
```

Việc truy cập **Docker Hub** tại Trung Quốc có thể khá chậm, vì vậy các dự án doanh nghiệp thường kết hợp registry nội bộ của công ty hoặc dịch vụ container registry của nhà cung cấp đám mây để cache và phân phối Image.

Ngoài việc sử dụng dịch vụ công khai, người dùng còn có thể **tự dựng Docker Registry riêng tư tại local**. Docker cung cấp sẵn Image `registry` chính thức để dùng trực tiếp làm dịch vụ Registry nội bộ. Image Docker Registry mã nguồn mở chỉ cung cấp phần cài đặt phía server cho Docker Registry API, đủ để hỗ trợ các câu lệnh Docker mà không gây trở ngại khi sử dụng. Tuy nhiên, nó không bao gồm giao diện đồ họa (Web UI) cũng như các tính năng nâng cao như bảo trì Image, quản lý người dùng hay kiểm soát truy cập.

### Mối quan hệ giữa Image, Container và Repository

Hình minh họa dưới đây thể hiện rất trực quan mối quan hệ giữa bốn thành phần Image, Container, Repository và Registry/Hub:

![Kiến trúc Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-regitstry-e6d73400.png)

- `Dockerfile` là một tệp văn bản chứa một loạt chỉ thị và tham số nhằm định nghĩa cách build một Docker Image. Khi chạy lệnh `docker build` và chỉ định một `Dockerfile`, Docker sẽ đọc các chỉ thị bên trong tệp đó, từng bước xây dựng nên một Image mới và lưu lại ở local.
- Lệnh `docker pull` cho phép tải một Image từ Registry/Hub chỉ định về máy local, mặc định dùng Docker Hub.
- Lệnh `docker run` tạo một Container mới từ Image ở local và khởi chạy nó. Nếu máy local chưa có Image đó, Docker sẽ tự động thử kéo Image từ Registry/Hub về trước.
- Lệnh `docker push` đẩy Docker Image ở máy local lên Registry/Hub đã chỉ định.

Bên trên có nhắc tới một số câu lệnh Docker cơ bản; phần bài viết thực hành tiếp theo sẽ giới thiệu chi tiết hơn.

### Build, Ship, and Run

Các khái niệm nền tảng của Docker cơ bản đã xong, giờ hãy nói về: Build, Ship, and Run.

Nếu tìm hiểu trên trang chủ Docker, bạn sẽ bắt gặp khẩu hiệu: **"Docker - Build, Ship, and Run Any App, Anywhere"**. Vậy Build, Ship, and Run thực chất là làm những việc gì?

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-build-ship-run-9106dea4.jpg)

- **Build (Xây dựng Image)**: Image giống như chiếc thùng container chứa mã nguồn, tệp tin cùng môi trường chạy và nhiều tài nguyên khác.
- **Ship (Vận chuyển Image)**: Luân chuyển Image giữa các máy chủ và kho lưu trữ — ở đây Repository đóng vai trò như một bến cảng khổng lồ.
- **Run (Chạy Image)**: Image khi được khởi chạy chính là một Container, và Container là nơi chương trình thực sự vận hành.

Quá trình chạy Docker chính là kéo Image từ kho lưu trữ về máy local, sau đó chỉ với một câu lệnh là khởi chạy Image đó thành Container. Vì vậy, người ta cũng hay ví Docker như người thợ bến cảng hay công nhân bốc xếp, hoàn toàn khớp với nghĩa gốc của từ Docker (thợ khuân vác ở cảng).

## Các câu lệnh Docker phổ biến

### Câu lệnh cơ bản

```bash
docker version # Kiểm tra phiên bản Docker
docker images # Xem tất cả Image đã tải về, tương đương với lệnh: docker image ls
docker container ls # Xem danh sách các Container
docker ps # Xem các Container đang chạy
docker image prune # Dọn dẹp các tệp Image không còn được sử dụng; thêm -a/--all sẽ xóa tất cả Image chưa được Container nào dùng tới
```

### Tải Image (Pull)

Registry mặc định mà lệnh `docker pull` sử dụng là Docker Hub. Khi bạn chạy `docker pull` mà không chỉ định địa chỉ Registry nào, Docker sẽ kéo Image từ Docker Hub về.

```bash
docker search mysql # Tìm kiếm các Image liên quan đến MySQL
docker pull mysql:8.4 # Tải Image MySQL
docker image ls # Xem tất cả Image đã tải về
```

### Xây dựng Image (Build)

Khi chạy lệnh `docker build` và chỉ định một `Dockerfile`, Docker sẽ đọc các chỉ thị bên trong tệp đó, từng bước xây dựng Image mới và lưu ở local.

```bash
# image-name là tên Image, 1.0.0 là phiên bản hoặc tag của Image
docker build -t image-name:1.0.0 .
```

Cần lưu ý: tên tệp của `Dockerfile` không bắt buộc phải là `Dockerfile`, và cũng không nhất thiết phải đặt ở thư mục gốc của build context. Dùng tùy chọn `-f` hoặc `--file` cho phép bạn chỉ định bất kỳ tệp nào ở bất kỳ vị trí nào làm `Dockerfile`. Tất nhiên, theo thói quen chung, mọi người vẫn hay dùng tên mặc định `Dockerfile` và đặt nó ngay trong thư mục build context của Image.

### Xóa Image

Ví dụ chúng ta muốn xóa Image MySQL đã tải về.

Trước khi xóa Image bằng `docker rmi [image]` (tương đương `docker image rm [image]`), trước tiên phải đảm bảo Image này không đang được Container nào tham chiếu tới. Bạn có thể xóa theo tên tag hoặc ID của Image, và cũng có thể kiểm tra xem có Container nào đang dùng nó hay không bằng lệnh `docker ps` đã học ở trên.

```shell
➜  ~ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                               NAMES
c4cd691d9f80        mysql:5.7           "docker-entrypoint.s…"   7 weeks ago         Up 12 days          0.0.0.0:3306->3306/tcp, 33060/tcp   mysql
```

Có thể thấy `mysql:5.7` đang được Container có ID `c4cd691d9f80` tham chiếu tới, vì vậy cần tạm dừng Container này trước bằng `docker stop c4cd691d9f80` hoặc `docker stop mysql`.

Sau đó kiểm tra ID của Image MySQL:

```shell
➜  ~ docker images
REPOSITORY              TAG                 IMAGE ID            CREATED             SIZE
mysql                   5.7                 f6509bac4980        3 months ago        373MB
```

Khi đó chỉ cần xóa theo `IMAGE ID` hoặc `REPOSITORY:TAG`:

```shell
docker rmi f6509bac4980 # Hoặc docker rmi mysql:5.7
```

### Đẩy Image (Push)

Lệnh `docker push` dùng để tải một Docker Image từ máy local lên Registry/Hub được chỉ định.

```bash
# Đẩy Image lên kho lưu trữ Image riêng tư Harbor
# harbor.example.com là địa chỉ Registry riêng tư, ubuntu là tên Image, 18.04 là tag phiên bản
docker push harbor.example.com/ubuntu:18.04
```

Trước khi push Image, hãy đảm bảo Image cần đẩy đã được build sẵn ở local. Ngoài ra, nhất định phải đăng nhập vào Registry tương ứng trước.

## Quản lý dữ liệu trong Docker

Có hai cách chính để quản lý dữ liệu trong Container:

1. Data Volumes (Volume)
2. Bind mounts (Gắn kết thư mục từ máy host)

![Quản lý dữ liệu Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-data-management-e50221db.png)

Volume là vùng lưu trữ dữ liệu do Docker quản lý, có các đặc điểm sau:

- Có thể chia sẻ và tái sử dụng giữa nhiều Container.
- Ngay cả khi Container bị xóa, dữ liệu trong Volume cũng không bị tự động xóa theo, đảm bảo tính bền vững (persistence) của dữ liệu.
- Các thay đổi đối với Volume sẽ có hiệu lực ngay lập tức.
- Việc cập nhật dữ liệu trong Volume không làm ảnh hưởng tới Image.

```bash
# Tạo một Volume mới
docker volume create my-vol
# Xem tất cả các Volume hiện có
docker volume ls
# Xem thông tin chi tiết của một Volume
docker volume inspect my-vol
# Xóa Volume được chỉ định
docker volume rm my-vol
```

Khi chạy lệnh `docker run`, bạn có thể dùng cờ `--mount` để gắn một hoặc nhiều Volume vào Container.

Bạn cũng có thể dùng cờ `--mount` để gắn một tệp hoặc thư mục trên máy host vào bên trong Container, giúp Container truy cập trực tiếp vào hệ thống tập tin của máy host. Quyền mặc định khi Docker gắn thư mục máy host là đọc-ghi (read-write), người dùng cũng có thể thêm `readonly` để chỉ định chế độ chỉ đọc.

## Docker Compose

### Docker Compose là gì? Có tác dụng gì?

Docker Compose là công cụ chính thức do Docker cung cấp để định nghĩa và vận hành các ứng dụng đa Container (multi-container). Thông qua Compose, lập trình viên có thể sử dụng một tệp YAML duy nhất để mô tả nhiều dịch vụ (service), mạng (network), cổng (port) và volume mà ứng dụng phụ thuộc vào, rồi chỉ cần một câu lệnh để khởi chạy hoặc dừng toàn bộ nhóm dịch vụ đó.

Docker Compose là dự án mã nguồn mở tại địa chỉ: <https://github.com/docker/compose>.

Các chức năng cốt lõi của Docker Compose:

- **Quản lý đa Container**: Cho phép người dùng định nghĩa và quản lý nhiều Container trong cùng một tệp YAML.
- **Điều phối dịch vụ (Service Orchestration)**: Cấu hình kết nối mạng và mối quan hệ phụ thuộc giữa các Container.
- **Khởi chạy và dừng chỉ với một lệnh**: Thông qua các lệnh như `docker compose up` và `docker compose down`, bạn có thể dễ dàng bật và tắt toàn bộ ứng dụng.

Docker Compose đơn giản hóa quy trình phát triển, kiểm thử và triển khai các ứng dụng nhiều Container, nâng cao năng suất cho đội ngũ phát triển đồng thời giảm độ phức tạp khi triển khai và chi phí vận hành.

### Cấu trúc cơ bản của tệp Docker Compose

Tệp Docker Compose là trung tâm của công cụ Docker Compose, dùng để định nghĩa và cấu hình ứng dụng Docker đa Container. Tệp này thường được đặt tên là `compose.yaml` hoặc `docker-compose.yml` và viết theo định dạng YAML (YAML Ain't Markup Language).

Cấu trúc cơ bản của tệp Docker Compose như sau:

- **`services` (Dịch vụ):** Định nghĩa từng Container (service) trong ứng dụng. Mỗi service có thể sử dụng Image, biến môi trường và các phụ thuộc khác nhau.
  - **`image`:** Khởi chạy Container từ Image chỉ định; có thể là tên repository kèm tag hoặc Image ID.
  - **`command`:** Tùy chọn, ghi đè câu lệnh mặc định thực thi sau khi Container khởi động. Dùng để chạy một lệnh hoặc script cụ thể lúc bật service, thường dùng để khởi động ứng dụng hoặc chạy script khởi tạo.
  - **`ports`:** Tùy chọn, ánh xạ cổng giữa Container và máy host.
  - **`depends_on`:** Cấu hình thứ tự phụ thuộc khi khởi động giữa các service. Ví dụ khi service backend phụ thuộc vào service database, có thể cho database khởi động trước rồi mới đến backend.
  - **`environment`:** Tùy chọn, thiết lập các biến môi trường cần thiết để service hoạt động.
  - **`restart`:** Tùy chọn, kiểm soát chính sách khởi động lại (restart policy) của Container; khi Container thoát, nó sẽ tự động khởi động lại theo chính sách đã chỉ định.
  - **`volumes`:** Tùy chọn, định nghĩa các volume mà service sử dụng để lưu trữ dữ liệu bền vững hoặc chia sẻ dữ liệu giữa các Container.
  - **`build`:** Chỉ định đường dẫn build context chứa `Dockerfile` để build Image, hoặc sử dụng đối tượng cấu hình build chi tiết.
- **`networks` (Mạng):** Định nghĩa các kết nối mạng giữa các Container.
- **`volumes` (Ổ dữ liệu):** Định nghĩa các Volume dùng cho việc lưu trữ bền vững và chia sẻ dữ liệu. Thường dùng để lưu dữ liệu database, tệp cấu hình, log, v.v.

```yaml
services:
  service-name-1:
    image: nginx:stable
    command: ["nginx", "-g", "daemon off;"]
    environment:
      TZ: Asia/Shanghai
    volumes:
      - web_data:/usr/share/nginx/html
    networks:
      - app_net
    ports:
      - "8080:80"
    restart: unless-stopped
    depends_on:
      - service-name-2
  service-name-2:
    image: redis:7
    networks:
      - app_net

volumes:
  web_data:

networks:
  app_net:
```

### Các câu lệnh Docker Compose thường dùng

#### Khởi chạy

`docker compose up` sẽ tạo và khởi chạy các Container dựa trên các service được định nghĩa trong tệp Compose, đồng thời kết nối chúng vào mạng do Compose tạo ra. Nếu tệp không khai báo mạng tùy chỉnh, Compose sẽ tự động tạo một mạng mặc định.

```bash
# Tìm tệp compose.yaml hoặc docker-compose.yml trong thư mục hiện tại và khởi chạy ứng dụng theo các service đã định nghĩa
docker compose up
# Khởi chạy ở chế độ nền (background)
docker compose up -d
# Bắt buộc tạo lại toàn bộ Container ngay cả khi chúng đã tồn tại
docker compose up --force-recreate
# Build lại Image trước khi khởi chạy
docker compose up --build
# Chỉ định tên service cần khởi chạy thay vì chạy tất cả service
# Có thể chỉ định cùng lúc nhiều service, phân tách bằng dấu cách
docker compose up service-name
```

Ngoài ra, nếu tệp Compose không mang tên `compose.yaml` hay `docker-compose.yml`, bạn có thể chỉ định thông qua tham số `-f`:

```bash
docker compose -f compose.prod.yaml up
```

#### Dừng và gỡ bỏ

`docker compose down` dùng để dừng và gỡ bỏ các Container cùng mạng đã được khởi tạo qua `docker compose up`.

```bash
# Tìm tệp Compose trong thư mục hiện tại
# Dừng và gỡ bỏ các Container cùng mạng đã khởi chạy theo định nghĩa trong tệp
docker compose down
# Dừng Container nhưng không xóa
docker compose stop
# Dừng một service cụ thể
docker compose stop service-name
```

Tương tự, nếu tệp Compose không có tên là `compose.yaml` hoặc `docker-compose.yml`, bạn có thể chỉ định qua tham số `-f`:

```bash
docker compose -f compose.prod.yaml down
```

#### Kiểm tra trạng thái

`docker compose ps` dùng để xem thông tin trạng thái của toàn bộ Container được khởi chạy thông qua `docker compose up`.

```bash
# Xem thông tin trạng thái của tất cả Container
docker compose ps
# Chỉ hiển thị tên các service
docker compose ps --services
# Xem Container của một service cụ thể
docker compose ps service-name
```

#### Các lệnh khác

| Câu lệnh                 | Mô tả                                                  |
| ------------------------ | ------------------------------------------------------ |
| `docker compose version` | Xem phiên bản                                          |
| `docker compose images`  | Liệt kê các Image đang được Container sử dụng          |
| `docker compose kill`    | Buộc dừng ngay các Container của service               |
| `docker compose exec`    | Thực thi câu lệnh bên trong Container                  |
| `docker compose logs`    | Xem log                                                |
| `docker compose pause`   | Tạm dừng service                                       |
| `docker compose unpause` | Tiếp tục chạy lại service đã tạm dừng                  |
| `docker compose push`    | Đẩy Image của service lên Registry                     |
| `docker compose start`   | Khởi chạy các service đang ở trạng thái dừng           |
| `docker compose stop`    | Dừng các service đang chạy                             |
| `docker compose rm`      | Xóa các Container của service đã dừng                  |
| `docker compose top`     | Xem các Process đang chạy                              |

## Nguyên lý hoạt động bên dưới của Docker

Trước hết, Docker là phần mềm dựa trên công nghệ ảo hóa nhẹ. Vậy công nghệ ảo hóa là gì?

Nói một cách đơn giản, công nghệ ảo hóa có thể được định nghĩa như sau:

> Công nghệ ảo hóa là một kỹ thuật quản lý tài nguyên, giúp trừu tượng hóa và chuyển đổi các [tài nguyên vật lý](https://zh.wikipedia.org/wiki/%E8%A8%88%E7%AE%97%E6%A9%9F%E7%A7%91%E5%AD%B8) khác nhau của máy tính ([CPU](https://zh.wikipedia.org/wiki/CPU), [bộ nhớ](https://zh.wikipedia.org/wiki/%E5%86%85%E5%AD%98), [dung lượng đĩa](https://zh.wikipedia.org/wiki/%E7%A3%81%E7%9B%98%E7%A9%BA%E9%97%B4), [bộ điều hợp mạng](https://zh.wikipedia.org/wiki/%E7%B6%B2%E8%B7%AF%E9%81%A9%E9%85%8D%E5%99%A8), v.v.) để phân chia và kết hợp thành một hoặc nhiều môi trường cấu hình máy tính. Nhờ vậy, nó phá vỡ rào cản không thể chia cắt của cấu trúc vật lý, cho phép người dùng tận dụng tài nguyên phần cứng hiệu quả hơn so với cấu hình gốc ban đầu. Các phần tài nguyên ảo hóa mới này không bị ràng buộc bởi cách bố trí, vị trí địa lý hay cấu hình vật lý của tài nguyên hiện có. Tài nguyên ảo hóa nhìn chung thường đề cập đến năng lực tính toán và lưu trữ dữ liệu.

Công nghệ Docker ban đầu phát triển dựa trên công nghệ container ảo LXC (Linux Containers).

> LXC, viết tắt của Linux Containers, là một công nghệ ảo hóa ở tầng hệ điều hành (Operating system-level virtualization), đóng vai trò giao diện trong user space cho tính năng container của nhân Linux. Nó đóng gói phần mềm ứng dụng thành một software container chứa mã nguồn ứng dụng cùng với phần lõi hệ điều hành và thư viện cần thiết. Thông qua các namespace thống nhất và API dùng chung để phân bổ tài nguyên phần cứng khả dụng cho các software container khác nhau, LXC tạo ra môi trường chạy sandbox độc lập cho ứng dụng, giúp người dùng Linux dễ dàng tạo và quản lý các container hệ thống hoặc container ứng dụng.

Kỹ thuật LXC chủ yếu dựa vào tính năng `cgroup` và `namespace` do nhân Linux cung cấp để tạo ra một môi trường vận hành hệ điều hành độc lập cho phần mềm.

**Giới thiệu về `cgroup` và `namespace`:**

- **`namespace` là cơ chế mà nhân Linux dùng để cô lập các tài nguyên của kernel.** Nhờ namespace, một số Process chỉ có thể nhìn thấy phần tài nguyên liên quan tới mình, còn nhóm Process khác cũng chỉ nhìn thấy tài nguyên của riêng chúng — hai nhóm Process này hoàn toàn không nhận biết được sự tồn tại của nhau. Cách hiện thực cụ thể là gán các tài nguyên liên quan của một hoặc nhiều Process vào cùng một namespace. Linux namespaces đóng gói và cô lập các tài nguyên hệ thống toàn cục (global system resources), giúp các Process ở những namespace khác nhau sở hữu tập tài nguyên hệ thống toàn cục độc lập; việc thay đổi tài nguyên hệ thống trong một namespace chỉ tác động tới các Process trong namespace hiện tại và không gây ảnh hưởng gì tới các Process ở namespace khác.

  (Nội dung giới thiệu về `namespace` ở trên tham khảo từ <https://www.cnblogs.com/sparkdev/p/9365405.html>; bạn có thể xem bài viết đó để tìm hiểu thêm về namespace.)

- **`cgroup` (viết tắt của Control Groups) là một cơ chế do nhân Linux cung cấp nhằm giới hạn, ghi nhận và cô lập lượng tài nguyên vật lý (như CPU, bộ nhớ, I/O, v.v.) mà một nhóm Process (process groups) sử dụng.**

  (Nội dung giới thiệu về `cgroup` ở trên tham khảo từ <https://www.ibm.com/developerworks/cn/linux/1506_cgroup/index.html>; bạn có thể xem bài viết đó để tìm hiểu thêm về `cgroup`.)

**So sánh giữa `cgroup` và `namespace`:**

Cả hai đều thực hiện gom nhóm các Process, nhưng vai trò của chúng có sự khác biệt về bản chất: `namespace` dùng để cô lập tài nguyên giữa các nhóm Process với nhau, còn `cgroup` dùng để giám sát và giới hạn tài nguyên một cách thống nhất cho một nhóm Process.

## Tổng kết

Bài viết này chủ yếu trình bày chi tiết một số khái niệm và câu lệnh phổ biến trong Docker. Để thực hành từng bước từ con số 0 cho tới khi làm chủ được công việc, bạn có thể xem bài viết [Docker từ cơ bản đến thực chiến](https://javaguide.cn/tools/docker/docker-in-action.html) — nội dung cực kỳ chi tiết!

Ngoài ra, xin giới thiệu thêm cho các bạn một cuốn sách mã nguồn mở có chất lượng rất cao: [*Docker từ cơ bản đến thực hành*](https://yeasy.gitbook.io/docker_practice/introduction/why). Nội dung của cuốn sách này luôn rất mới vì đây là sách mã nguồn mở nên có thể được cải tiến và cập nhật thường xuyên.

![Trang chủ website cuốn sách Docker từ cơ bản đến thực hành](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-getting-started-practice-website-homepage-f309a0bb.png)

## Tài liệu tham khảo

- [Docker Compose: Hướng dẫn toàn diện từ cơ bản đến thực chiến](https://juejin.cn/post/7306756690727747610)
- [Linux Namespace và Cgroup](https://segmentfault.com/a/1190000009732550)
- [LXC vs Docker: Why Docker is Better](https://www.upguard.com/articles/docker-vs-lxc "LXC vs Docker: Why Docker is Better")
- [Giới thiệu về CGroup, ví dụ ứng dụng và mô tả nguyên lý](https://www.ibm.com/developerworks/cn/linux/1506_cgroup/index.html)
