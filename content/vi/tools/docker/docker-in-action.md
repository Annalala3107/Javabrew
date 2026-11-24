---
title: Docker thực chiến
description: "Hiểu rõ cách quản lý Image và Container của Docker thông qua thực hành, giải quyết bài toán đồng nhất môi trường và hiệu suất bàn giao, nâng cao hiệu quả phối hợp giữa phát triển, kiểm thử và triển khai."
category: Công cụ phát triển
tag:
  - Docker
lang: vi
sourceRef: zh-ref/tools/docker/docker-in-action.md
head:
  - - meta
    - name: keywords
      content: Docker thực chiến,build image,quản lý container,đồng nhất môi trường,triển khai,hiệu năng
---

## Giới thiệu về Docker

Trước khi bắt đầu, hãy ôn lại ngắn gọn về Docker. Để xem phần giải thích khái niệm đầy đủ hơn, bạn có thể tham khảo bài viết trước: [Tổng hợp các khái niệm cốt lõi của Docker](./docker-intro.md).

### Docker là gì?

Bạn có thể hiểu Docker qua các góc độ dưới đây:

- Docker là một nền tảng container phần mềm phổ biến, được phát triển bằng ngôn ngữ Go.
- Docker giúp đóng gói ứng dụng cùng các thành phần phụ thuộc khi chạy vào trong Image, giảm thiểu vấn đề không đồng nhất giữa môi trường phát triển, kiểm thử và triển khai.
- Người dùng có thể dễ dàng tạo và sử dụng Container để đưa ứng dụng của mình vào chạy bên trong. Container cũng có thể quản lý phiên bản, sao chép, chia sẻ và chỉnh sửa giống như quản lý mã nguồn thông thường.
- Docker giúp **đóng gói và cô lập Process (tiến trình), thuộc nhóm công nghệ ảo hóa ở tầng hệ điều hành.** Do Process được cô lập độc lập với máy host và các Process cô lập khác nên nó được gọi là Container.

Trang chủ chính thức: <https://www.docker.com/>.

![Tìm hiểu về Container](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/container-f3c06465.png)

### Tại sao nên dùng Docker?

Docker cho phép lập trình viên đóng gói ứng dụng cùng các gói phụ thuộc vào một Container nhẹ, có khả năng di chuyển linh hoạt (portable), rồi phát hành lên bất kỳ máy Linux phổ biến nào, đồng thời cũng có thể thực hiện ảo hóa.

Container sử dụng hoàn toàn cơ chế sandbox, không có giao diện kết nối trực tiếp nào với nhau (tương tự như các ứng dụng trên iPhone); quan trọng hơn là chi phí hiệu năng của Container cực kỳ thấp.

Trong quy trình phát triển truyền thống, dự án của chúng ta thường cần sử dụng các dịch vụ phụ thuộc như MySQL, Redis, Kafka, v.v. Nếu tất cả các môi trường này đều cài đặt và cấu hình thủ công, thao tác trên các hệ điều hành khác nhau sẽ khác biệt rất lớn, dễ gặp phải tình trạng "máy tôi chạy được, máy bạn không chạy được".

Sự xuất hiện của Docker giải quyết triệt để vấn đề này: chúng ta có thể cài đặt các môi trường phần mềm như MySQL, Redis bên trong Container, tách biệt ứng dụng khỏi kiến trúc môi trường. Những ưu điểm của nó gồm:

1. Môi trường vận hành nhất quán, giúp di chuyển hệ thống dễ dàng hơn
2. Đóng gói và cô lập Process, các Container không ảnh hưởng lẫn nhau, tận dụng tài nguyên hệ thống hiệu quả hơn
3. Có thể nhân bản nhiều Container giống hệt nhau từ cùng một Image

Ngoài ra, cuốn sách mã nguồn mở [*Docker từ cơ bản đến thực hành*](https://yeasy.gitbook.io/docker_practice/introduction/why) cũng đã tổng kết rất rõ lý do nên sử dụng Docker.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/20210412220015698-12635235.png)

## Cài đặt Docker

### Windows

Trên Windows khuyến nghị cài đặt Docker Desktop. Truy cập trang chủ chính thức của Docker để tải bộ cài:

![Cài đặt Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-install-windows-1968cd1c.png)

Sau đó nhấn `Get Started`:

![Cài đặt Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-install-windows-download-f0f1d136.png)

Tại đây nhấn `Download for Windows` để tải về.

Hiện tại Docker Desktop for Windows khuyến nghị sử dụng backend WSL 2. Trước khi cài đặt, bạn nên xác nhận hệ thống đáp ứng yêu cầu phiên bản của Docker Desktop và đã bật WSL 2. Một số kịch bản cũng có thể sử dụng backend Hyper-V; cách bật như sau. Mở Control Panel, chọn Programs:

![Bật Hyper-V](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-8ec44f98.png)

Nhấn `Turn Windows features on or off` (Bật hoặc tắt các tính năng của Windows):

![Bật Hyper-V](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-enable-d7b1bdda.png)

Tích chọn `Hyper-V`, rồi nhấn OK:

![Bật Hyper-V](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-check-c4a1b8ce.png)

Sau khi hoàn tất thay đổi, bạn cần khởi động lại máy tính.

Sau khi bật `Hyper-V`, bạn có thể tiến hành cài đặt Docker Desktop. Mở trình cài đặt lên, đợi một lát rồi nhấn `Ok`:

![Cài đặt Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-install-a21f46a3.png)

Sau khi cài đặt xong, chúng ta vẫn cần khởi động lại máy tính. Sau khi khởi động lại, nếu xuất hiện thông báo như sau:

![Cài đặt Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-wsl2-0c43cbfd.png)

Nếu trong quá trình cài đặt có thông báo gợi ý dùng WSL 2, thông thường nên ưu tiên chọn backend WSL 2 — đây là cách phổ biến hơn để chạy Linux Container trên Windows; chỉ chuyển sang backend Hyper-V nếu môi trường của bạn bắt buộc phải dùng Hyper-V.

Vì thao tác đều trên giao diện đồ họa nên ở đây sẽ không đi sâu vào cách dùng chi tiết của Docker Desktop.

### macOS

Chỉ cần dùng Homebrew để cài đặt trực tiếp:

```shell
brew install --cask docker
```

### Linux

Dưới đây hãy xem cách cài đặt Docker trên Linux. Câu lệnh cài đặt giữa các bản phân phối (distro) có chút khác biệt; với môi trường production, khuyến nghị ưu tiên tham khảo tài liệu chính thức của Docker. Ở đây dùng script cài đặt chính thức để minh họa cách cài nhanh cho môi trường test hoặc dev.

Trong môi trường kiểm thử hoặc phát triển, để đơn giản hóa quy trình cài đặt, Docker cung cấp sẵn một script cài đặt tiện lợi: chỉ cần chạy script này, mọi bước chuẩn bị sẽ được tự động thực hiện và phiên bản ổn định của Docker sẽ được cài lên hệ thống.

```shell
curl -fsSL get.docker.com -o get-docker.sh
```

```shell
sh get-docker.sh --mirror Aliyun
```

Sau khi cài đặt xong, khởi chạy dịch vụ ngay:

```shell
systemctl start docker
```

Khuyến nghị thiết lập tự khởi động cùng hệ thống bằng lệnh:

```shell
systemctl enable docker
```

## Một số khái niệm trong Docker

Trước khi chính thức học sâu về Docker, chúng ta cần nắm được một vài khái niệm cốt lõi trong Docker:

### Image

Image là một khuôn mẫu chỉ đọc (read-only template). Image được dùng để tạo ra Docker Container, và một Image có thể tạo ra nhiều Container.

### Container

Container là thực thể đang chạy (running instance) được tạo ra từ Image. Docker dùng Container để chạy độc lập một hoặc một nhóm ứng dụng. Container có thể được khởi tạo, bắt đầu, dừng, xóa; mỗi Container là một nền tảng cô lập và đảm bảo an toàn với nhau. Có thể xem Container như một môi trường Linux thu gọn cùng ứng dụng đang chạy bên trong đó. Định nghĩa của Container gần như giống hệt Image — đều là góc nhìn hợp nhất của một chồng các lớp (layers) — điểm khác biệt duy nhất là lớp trên cùng của Container có thể đọc và ghi được.

### Repository

Repository là nơi lưu trữ tập trung các tệp Image. Repository và Registry server có sự khác nhau: trên một Registry server thường lưu giữ nhiều Repository, trong mỗi Repository lại chứa nhiều Image, và mỗi Image có các Tag khác nhau. Repository được chia làm hai dạng: public repository (công khai) và private repository (riêng tư). Public repository phổ biến nhất là Docker Hub, nơi lưu trữ lượng lớn Image có thể tải trực tiếp về dùng.

### Tổng kết

Nói một cách dân dã, một Image đại diện cho một phần mềm; chạy dựa trên một Image nào đó tức là sinh ra một instance của chương trình, và instance đó chính là Container; còn Repository là nơi lưu trữ tất cả Image trong Docker.

Trong đó Repository lại chia thành remote repository và local repository, tương tự như Maven: nếu lần nào cũng tải dependency từ xa thì hiệu suất sẽ giảm rất mạnh, do đó chiến lược của Maven là lần đầu truy cập dependency sẽ tải về local repository, từ lần thứ hai, thứ ba trở đi chỉ việc dùng trực tiếp dependency ở local repository. Vai trò của remote repository và local repository trong Docker cũng tương tự như vậy.

## Trải nghiệm Docker lần đầu

Dưới đây chúng ta sẽ thực hành làm quen bước đầu với Docker, lấy ví dụ tải một Image MySQL.

Giống như GitHub, Docker cũng cung cấp Docker Hub để tra cứu địa chỉ và hướng dẫn sử dụng của các loại Image. Trước tiên truy cập Docker Hub: [https://hub.docker.com/](https://hub.docker.com/)

![Docker Hub](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-com-58d64e61.png)

Nhập `mysql` vào ô tìm kiếm ở góc trên bên trái rồi nhấn Enter:

![Tìm kiếm MySQL trên Docker Hub](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-mysql-dcdc0f27.png)

Có thể thấy có rất nhiều Image liên quan đến MySQL; nếu góc trên bên phải có nhãn `OFFICIAL IMAGE`, điều đó nghĩa là Image chính thức, vì vậy ta nhấn vào Image MySQL đầu tiên:

![Image MySQL chính thức](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-mysql-official-image-abf23cb3.png)

Bên phải cung cấp câu lệnh tải Image MySQL là `docker pull mysql`, nhưng lệnh này sẽ kéo phiên bản ứng với tag mặc định. Trong dự án thực tế, nên chỉ định rõ tag phiên bản để tránh môi trường không kiểm soát được.

Nếu muốn tải Image ở một phiên bản cụ thể, hãy nhấn vào `View Available Tags` ở bên dưới:

![Xem các phiên bản khác của MySQL](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-mysql-view-available-tags-0f84d7e7.png)

Tại đây bạn có thể thấy tất cả các phiên bản Image, kèm lệnh tải ở bên phải. Ví dụ muốn tải Image MySQL phiên bản 8.4, có thể thực thi:

```shell
docker pull mysql:8.4
```

Trong một số môi trường mạng, việc pull Image từ Docker Hub có thể bị chậm hoặc lỗi. Tuy nhiên, không khuyến nghị sao chép trực tiếp các địa chỉ mirror tăng tốc của bên thứ ba trên mạng: phạm vi áp dụng, chiến lược đồng bộ và tính khả dụng của các dịch vụ này có thể thay đổi bất cứ lúc nào.

Lấy dịch vụ Alibaba Cloud Container Registry (ACR) làm ví dụ: từ ngày 2 tháng 7 năm 2024, dịch vụ tăng tốc mirror của ACR chỉ giới hạn cho người dùng Alibaba Cloud sử dụng trên các sản phẩm Alibaba Cloud có truy cập mạng công cộng, và chỉ hỗ trợ pull một phạm vi container image giới hạn. Tài liệu chính thức hiện tại cũng lưu ý rằng dịch vụ này đã ngừng đồng bộ các Image mới nhất, và máy chủ không thuộc Alibaba Cloud truy cập địa chỉ tăng tốc sẽ nhận lỗi HTTP 403. Chi tiết giới hạn vui lòng xem theo [Thông báo điều chỉnh tính năng tăng tốc mirror ACR của Alibaba Cloud](https://help.aliyun.com/zh/acr/product-overview/product-change-acr-mirror-accelerator-function-adjustment-announcement) và [Tài liệu tăng tốc Image chính thức](https://help.aliyun.com/zh/acr/user-guide/accelerate-the-pulls-of-docker-official-images).

Nếu đang dùng Alibaba Cloud ECS, bạn có thể cấu hình theo địa chỉ riêng được cung cấp trong bảng điều khiển Alibaba Cloud và tài liệu chính thức. Với môi trường không phải Alibaba Cloud, không nên sao chép cấu hình trên; trong môi trường production, nên giảm phụ thuộc cứng vào dịch vụ registry công khai bên ngoài, đồng bộ các Image cần thiết về private registry tự dựng hoặc do nhà cung cấp cloud quản lý, đồng thời cố định phiên bản hoặc digest của Image.

## Các câu lệnh thao tác với Image trong Docker

Vì Docker cần thao tác thường xuyên với Image, trước hết hãy tìm hiểu các câu lệnh quản lý Image trong Docker.

Nếu muốn xem hiện tại trong Docker đang có những Image nào, có thể dùng lệnh `docker images`:

```shell
[root@izrcf5u3j3q8xaz ~]# docker images
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
mysql         8.4       f07dfa83b528   11 days ago     448MB
tomcat        latest    feba8d001e3f   2 weeks ago     649MB
nginx         latest    ae2feff98a0c   2 weeks ago     133MB
hello-world   latest    bf756fb1ae65   12 months ago   13.3kB
```

Trong đó `REPOSITORY` là tên Image, `TAG` là nhãn phiên bản, `IMAGE ID` là ID của Image (duy nhất), `CREATED` là thời điểm tạo — lưu ý đây không phải thời điểm chúng ta tải Image về Docker mà là thời điểm tác giả tạo ra Image, còn `SIZE` là kích thước Image.

Lệnh này cũng hỗ trợ tra cứu theo tên Image chỉ định:

```shell
docker images mysql
```

Khi đó hệ thống sẽ liệt kê toàn bộ các Image MySQL có trong Docker:

```shell
[root@izrcf5u3j3q8xaz ~]# docker images mysql
REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
mysql        8.4       0ebb5600241d   11 days ago     589MB
mysql        8.0       f07dfa83b528   11 days ago     596MB
```

Lệnh này còn hỗ trợ thêm tham số `-q`: `docker images -q`, trong đó `-q` nghĩa là chỉ hiển thị ID của Image:

```shell
[root@izrcf5u3j3q8xaz ~]# docker images -q
0ebb5600241d
f07dfa83b528
feba8d001e3f
d404d78aa797
```

Để tải một Image về, ta sử dụng:

```shell
docker pull mysql:8.4
```

`docker pull` là câu lệnh cố định, phía sau viết tên Image và tag phiên bản cần tải; nếu không ghi tag phiên bản mà chạy thẳng `docker pull mysql`, Docker sẽ kéo phiên bản ứng với tag mặc định.

Thông thường trước khi tải Image, chúng ta cần tìm kiếm xem có những Image nào để tải đúng bản cần dùng bằng lệnh:

```shell
docker search mysql
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-search-mysql-terminal-ce013aee.png)

Tuy nhiên, `docker search` chỉ tìm kiếm được các repository Image chứ không thể liệt kê toàn bộ các tag của một Image. Muốn biết MySQL hỗ trợ những phiên bản nào, bạn nên vào trực tiếp trang Tags trên Docker Hub để xem.

```shell
docker pull mysql:8.4
```

Nếu tag không tồn tại, khi chạy `docker pull` sẽ trả về lỗi dạng `manifest unknown`:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-search-mysql-404-terminal-195b0b98.png)

Để xóa một Image, ta dùng lệnh:

```shell
docker image rm mysql:8.4
```

Nếu không chỉ định phiên bản, mặc định Docker cũng sẽ xóa phiên bản `latest`.

Ngoài ra còn có thể xóa bằng cách chỉ định Image ID:

```shell
docker image rm bf756fb1ae65
```

Tuy nhiên lúc này báo lỗi:

```shell
[root@izrcf5u3j3q8xaz ~]# docker image rm bf756fb1ae65
Error response from daemon: conflict: unable to delete bf756fb1ae65 (must be forced) - image is being used by stopped container d5b6c177c151
```

Nguyên nhân là do Image `hello-world` cần xóa đang được chạy nên không thể xóa trực tiếp; lúc này cần ép xóa (force):

```shell
docker image rm -f bf756fb1ae65
```

Câu lệnh này sẽ xóa toàn bộ Image cùng các Container đã chạy từ Image đó, hãy sử dụng cẩn thận.

Docker còn cung cấp phiên bản rút gọn để xóa Image: `docker rmi <image-name>:<tag>`.

Khi đó chúng ta có thể kết hợp `rmi` với `-q` để thực hiện thao tác hàng loạt. Ví dụ hiện tại muốn xóa toàn bộ Image MySQL, bình thường phải tra ra các Image ID của MySQL rồi chạy `docker rmi` từng cái một. Ta có thể làm gọn như sau:

```shell
docker rmi -f $(docker images mysql -q)
```

Trước tiên `docker images mysql -q` tìm ra tất cả Image ID của MySQL (`-q` chỉ truy vấn ID), rồi truyền các ID này làm tham số cho lệnh `docker rmi -f`, như vậy toàn bộ Image MySQL đều được xóa sạch.

## Các câu lệnh thao tác với Container trong Docker

Sau khi nắm được các câu lệnh về Image, chúng ta cần tìm hiểu các câu lệnh về Container vì Container được tạo ra dựa trên Image.

Để chạy một Container từ Image, ta sử dụng:

```shell
docker run tomcat:8.0-jre8
```

Tất nhiên điều kiện tiên quyết để chạy là bạn phải có sẵn Image này, nên hãy tải Image về trước:

```shell
docker pull tomcat:8.0-jre8
```

Sau khi tải xong là có thể chạy, rồi kiểm tra các Container đang chạy bằng lệnh `docker ps`:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-ps-terminal-fc7f39ff.png)

Trong đó `CONTAINER_ID` là ID của Container, `IMAGE` là tên Image, `COMMAND` là câu lệnh thực thi bên trong Container, `CREATED` là thời điểm tạo Container, `STATUS` là trạng thái của Container, `PORTS` là các cổng mà dịch vụ trong Container đang lắng nghe, và `NAMES` là tên của Container.

Tomcat khởi chạy theo cách trên chưa thể truy cập trực tiếp từ bên ngoài vì Container có tính cô lập. Nếu muốn truy cập thẳng vào Tomcat bên trong Container thông qua cổng 8080, ta cần ánh xạ cổng giữa máy host và bên trong Container:

```shell
docker run -p 8080:8080 tomcat:8.0-jre8
```

Giải thích tác dụng của hai cổng này (`8080:8080`): số `8080` đầu tiên là cổng trên máy host, số `8080` thứ hai là cổng bên trong Container; khi bên ngoài truy cập vào cổng 8080, lưu lượng sẽ được ánh xạ vào cổng 8080 bên trong Container.

Lúc này bên ngoài đã có thể truy cập Tomcat:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-run-tomact-8080-f0b9703c.png)

Nếu ánh xạ cổng như sau:

```shell
docker run -p 8088:8080 tomcat:8.0-jre8
```

thì bên ngoài cần truy cập cổng 8088 mới vào được Tomcat. Cần lưu ý rằng mỗi lần chạy, các Container đều độc lập với nhau, nên việc chạy đồng thời nhiều Container Tomcat sẽ không gây xung đột cổng.

Container còn có thể chạy ở chế độ nền (background) để không chiếm giữ terminal:

```shell
docker run -d -p 8080:8080 tomcat:8.0-jre8
```

Khi khởi chạy Container, Docker sẽ gán mặc định cho nó một cái tên, nhưng thực tế chúng ta hoàn toàn có thể đặt tên tùy ý bằng lệnh:

```shell
docker run -d -p 8080:8080 --name tomcat01 tomcat:8.0-jre8
```

Lúc này tên Container sẽ là `tomcat01`; tên Container phải là duy nhất.

Hãy mở rộng thêm một số tham số của `docker ps`, ví dụ `-a`:

```shell
docker ps -a
```

Tham số này sẽ liệt kê toàn bộ Container đang chạy lẫn không chạy.

Tham số `-q` chỉ truy vấn ID của các Container đang chạy: `docker ps -q`.

```shell
[root@izrcf5u3j3q8xaz ~]# docker ps -q
f3aac8ee94a3
074bf575249b
1d557472a708
4421848ba294
```

Nếu kết hợp lại thì sẽ truy vấn ID của tất cả Container đang chạy và đã dừng: `docker ps -qa`.

```shell
[root@izrcf5u3j3q8xaz ~]# docker ps -aq
f3aac8ee94a3
7f7b0e80c841
074bf575249b
a1e830bddc4c
1d557472a708
4421848ba294
b0440c0a219a
c2f5d78c5d1a
5831d1bab2a6
d5b6c177c151
```

Tiếp theo là các lệnh dừng và khởi động lại Container; vì rất đơn giản nên không giải thích dài dòng nữa.

```shell
docker start c2f5d78c5d1a
```

Lệnh này giúp khởi chạy lại Container đã dừng, có thể truyền vào ID hoặc tên của Container.

```shell
docker restart c2f5d78c5d1a
```

Lệnh này dùng để khởi động lại Container được chỉ định.

```shell
docker stop c2f5d78c5d1a
```

Lệnh này dùng để dừng Container được chỉ định.

```shell
docker kill c2f5d78c5d1a
```

Lệnh này dùng để dừng cưỡng bức (kill) ngay lập tức Container được chỉ định.

Tất cả các lệnh trên đều có thể sử dụng kết hợp theo cả hai cách là ID Container hoặc tên Container.

---

Sau khi Container bị dừng, tuy nó không còn chạy nữa nhưng vẫn tiếp tục tồn tại. Nếu muốn xóa nó, hãy dùng lệnh:

```shell
docker rm d5b6c177c151
```

Lưu ý rằng không cần phải gõ toàn bộ ID của Container, chỉ cần đủ ký tự đầu để định danh duy nhất là được.

Nếu muốn xóa một Container đang chạy, cần thêm tham số `-f` để ép xóa:

```shell
docker rm -f d5b6c177c151
```

Nếu muốn xóa tất cả Container, có thể dùng câu lệnh kết hợp:

```shell
docker rm -f $(docker ps -qa)
```

Trước tiên lấy ra toàn bộ ID Container thông qua `docker ps -qa`, sau đó truyền vào `docker rm -f` để xóa hết.

---

Khi Container chạy ở chế độ nền, chúng ta không nhìn thấy trực tiếp trạng thái hoạt động của nó. Nếu cần xem log chạy của Container, sử dụng lệnh:

```shell
docker logs 289cc00dc5ed
```

Cách này chỉ in log tại thời điểm gọi chứ không cập nhật theo thời gian thực (real-time); nếu muốn xem liên tục theo thời gian thực, cần dùng thêm tham số `-f`:

```shell
docker logs -f 289cc00dc5ed
```

Thông qua tham số `-t`, ta còn có thể hiển thị thêm dấu thời gian (timestamp) của log, thường được dùng chung với tham số `-f`:

```shell
docker logs -ft 289cc00dc5ed
```

---

Để xem bên trong Container đang có những Process nào chạy, ta sử dụng lệnh:

```shell
docker top 289cc00dc5ed
```

Nếu muốn tương tác trực tiếp với Container, dùng lệnh:

```shell
docker exec -it 289cc00dc5ed bash
```

Lúc này terminal sẽ đi vào bên trong Container, mọi câu lệnh thực thi đều có hiệu lực trong Container. Bên trong Container thường chỉ chạy được các lệnh cơ bản như `ls`, `cd`, v.v.; muốn thoát khỏi terminal của Container để quay về CentOS thì chỉ cần gõ `exit`.

Giờ chúng ta đã vào được terminal của Container để thao tác, vậy làm sao để triển khai một dự án vào trong Container Tomcat?

```shell
docker cp ./test.html 289cc00dc5ed:/usr/local/tomcat/webapps
```

Thông qua lệnh `docker cp`, ta có thể sao chép tệp từ CentOS vào trong Container: `./test.html` là đường dẫn tài nguyên trên CentOS, `289cc00dc5ed` là ID Container, `/usr/local/tomcat/webapps` là đường dẫn bên trong Container; khi đó tệp `test.html` sẽ được copy vào đường dẫn này.

```shell
[root@izrcf5u3j3q8xaz ~]# docker exec -it 289cc00dc5ed bash
root@289cc00dc5ed:/usr/local/tomcat# cd webapps
root@289cc00dc5ed:/usr/local/tomcat/webapps# ls
test.html
root@289cc00dc5ed:/usr/local/tomcat/webapps#
```

Nếu muốn sao chép tệp từ bên trong Container ra ngoài CentOS thì chỉ cần viết ngược lại:

```shell
docker cp 289cc00dc5ed:/usr/local/tomcat/webapps/test.html ./
```

Do đó bây giờ muốn triển khai dự án, chỉ cần tải dự án lên CentOS, sau đó copy dự án từ CentOS vào trong Container rồi chạy Container là xong.

---

Dù việc khởi chạy môi trường phần mềm bằng Docker rất đơn giản, nhưng đồng thời cũng gặp một vấn đề là ta không biết được các thông số chi tiết bên trong Container, chẳng hạn như cổng đang lắng nghe, địa chỉ IP được gắn, v.v. Rất may Docker đã tính sẵn cho chúng ta, chỉ cần dùng lệnh:

```shell
docker inspect 923c969b0d91
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-inspect-terminal-b4506c14.png)

## Docker Volume (Ổ dữ liệu)

Sau khi tìm hiểu các câu lệnh về Container, hãy cùng học về Volume trong Docker. Nó cho phép chia sẻ tệp tin giữa máy host và Container, với lợi ích là mọi chỉnh sửa trên tệp ở máy host sẽ tác động trực tiếp vào Container mà không cần copy lại tệp từ máy host vào Container nữa.

Bây giờ nếu muốn tạo một Volume kết nối giữa thư mục `/opt/apps` trên máy host và thư mục `webapps` bên trong Container, ta viết lệnh như sau:

```shell
docker run -d -p 8080:8080 --name tomcat01 -v /opt/apps:/usr/local/tomcat/webapps tomcat:8.0-jre8
```

Tuy nhiên khi truy cập Tomcat lúc này, bạn sẽ thấy không truy cập được:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-data-volume-webapp-8080-c4115ee3.png)

Điều này chứng tỏ Volume của chúng ta đã thiết lập thành công! Docker đồng bộ thư mục `webapps` trong Container với thư mục `/opt/apps`, và do lúc này `/opt/apps` đang trống nên thư mục `webapps` cũng trở thành thư mục rỗng, dẫn tới không truy cập được.

Lúc này ta chỉ cần thêm tệp vào thư mục `/opt/apps`, thư mục `webapps` cũng sẽ tự động có cùng các tệp đó để chia sẻ dữ liệu. Hãy kiểm tra thử:

```shell
[root@centos-7 opt]# cd apps/
[root@centos-7 apps]# vim test.html
[root@centos-7 apps]# ls
test.html
[root@centos-7 apps]# cat test.html
<h1>This is a test html!</h1>
```

Đã tạo tệp `test.html` trong `/opt/apps`, vậy trong thư mục `webapps` của Container đã có tệp này chưa? Hãy truy cập vào terminal của Container:

```shell
[root@centos-7 apps]# docker exec -it tomcat01 bash
root@115155c08687:/usr/local/tomcat# cd webapps/
root@115155c08687:/usr/local/tomcat/webapps# ls
test.html
```

Bên trong Container quả thực đã có tệp đó. Tiếp theo, chúng ta viết một ứng dụng Web đơn giản:

```java
public class HelloServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.getWriter().println("Hello World!");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doGet(req,resp);
    }
}
```

Đây là một Servlet rất đơn giản; chúng ta đóng gói và tải nó lên `/opt/apps`, thì bên trong Container chắc chắn cũng sẽ tự đồng bộ tệp đó và có thể truy cập ngay:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-data-volume-webapp-8080-hello-world-d8da63bb.png)

Cách làm này thường được gọi là **bind mount** (gắn kết thư mục), vì thư mục trên máy host do chính chúng ta tự chỉ định. Docker còn cung cấp một hình thức dữ liệu phổ biến khác là **named volume** (Volume đặt tên).

```shell
docker run -d -p 8080:8080 --name tomcat01 -v aa:/usr/local/tomcat/webapps tomcat:8.0-jre8
```

Lúc này `aa` không phải thư mục trên máy host, mà là tên của Volume. Docker sẽ tự động tạo một Volume tên là `aa`, đồng thời sao chép toàn bộ nội dung có sẵn trong thư mục `webapps` của Container vào Volume này. Mặc định, các Volume do Docker quản lý nằm trong thư mục `/var/lib/docker/volumes`:

```shell
[root@centos-7 volumes]# pwd
/var/lib/docker/volumes
[root@centos-7 volumes]# cd aa/
[root@centos-7 aa]# ls
_data
[root@centos-7 aa]# cd _data/
[root@centos-7 _data]# ls
docs  examples  host-manager  manager  ROOT
```

Lúc này chỉ cần sửa nội dung trong thư mục này là có thể ảnh hưởng tới Container. Tuy nhiên, trong dự án thực tế không khuyến nghị chỉnh sửa trực tiếp các tệp dưới `/var/lib/docker/volumes`, hãy ưu tiên quản lý dữ liệu thông qua Container, ứng dụng hoặc thư mục bind mount tường minh.

---

Cuối cùng, xin giới thiệu thêm một vài câu lệnh liên quan tới Container và Image:

```shell
docker commit -m "mô tả" -a "tác giả image" tomcat01 my_tomcat:1.0
```

Lệnh này có khả năng đóng gói một Container thành một Image; kiểm tra danh sách Image lúc này:

```shell
[root@centos-7 _data]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
my_tomcat           1.0                 79ab047fade5        2 seconds ago       463MB
tomcat              8                   a041be4a5ba5        2 weeks ago         533MB
mysql               8.4                 db2b37ec6181        2 months ago        589MB
```

Nếu muốn sao lưu (xuất) Image ra thành tệp, có thể sử dụng lệnh:

```shell
docker save my_tomcat:1.0 -o my-tomcat-1.0.tar
```

```shell
[root@centos-7 ~]# docker save my_tomcat:1.0 -o my-tomcat-1.0.tar
[root@centos-7 ~]# ls
anaconda-ks.cfg  initial-setup-ks.cfg  公共  视频  文档  音乐
get-docker.sh    my-tomcat-1.0.tar     模板  图片  下载  桌面
```

Nếu đã có tệp Image định dạng `.tar`, làm sao để nạp lại nó vào Docker? Thực thi lệnh:

```shell
docker load -i my-tomcat-1.0.tar
```

```shell
root@centos-7 ~]# docker load -i my-tomcat-1.0.tar
b28ef0b6fef8: Loading layer [==================================================>]  105.5MB/105.5MB
0b703c74a09c: Loading layer [==================================================>]  23.99MB/23.99MB
......
Loaded image: my_tomcat:1.0
[root@centos-7 ~]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
my_tomcat           1.0                 79ab047fade5        7 minutes ago       463MB
```

## Các câu lệnh kiểm tra và gỡ lỗi thường dùng

Sau khi đã làm quen với Docker, những lệnh thực sự hay dùng hằng ngày chính là các lệnh kiểm tra và xử lý sự cố. Bạn nên nắm chắc các lệnh sau:

```shell
# Xem tham số khởi chạy, mạng, thư mục mount và biến môi trường của Container
docker inspect tomcat01

# Xem các dòng log gần nhất của Container
docker logs --tail=100 tomcat01

# Theo dõi log của Container liên tục
docker logs -f tomcat01

# Xem mức độ chiếm dụng tài nguyên của Container
docker stats

# Xem dung lượng đĩa mà Docker đang chiếm dụng
docker system df
```

Khi dọn dẹp tài nguyên cần hết sức cẩn thận, đặc biệt là các lệnh có cờ `-f`. `docker system prune` sẽ xóa các Container, mạng, Image và build cache không còn được sử dụng; nếu thêm `--volumes`, các Volume chưa sử dụng cũng bị dọn sạch, khiến dữ liệu database hoặc dữ liệu test ở local có thể bị xóa mất.
