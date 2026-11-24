---
title: "Giải thích chi tiết Trung tâm cấu hình phân tán: So sánh Apollo, Nacos, Spring Cloud Config và K8s ConfigMap"
description: "Giải thích chi tiết nguyên lý và lựa chọn trung tâm cấu hình phân tán, bao gồm khác biệt kiến trúc giữa Apollo, Nacos, Spring Cloud Config và Kubernetes ConfigMap, cơ chế đẩy cấu hình, phát hành canary, thiết kế độ sẵn sàng cao (High Availability) và các trọng điểm phỏng vấn thường gặp."
category: Hệ thống Phân tán
keywords:
  - Trung tâm cấu hình
head:
  - - meta
    - name: keywords
      content: Trung tâm cấu hình,Distributed Configuration Center,Apollo,Nacos,Spring Cloud Config,Kubernetes ConfigMap,Đẩy cấu hình,Long Polling,Canary Release,Câu hỏi phỏng vấn trung tâm cấu hình
lang: vi
sourceRef: zh-ref/distributed-system/distributed-configuration-center.md
---

## Vì sao cần dùng Trung tâm cấu hình (Configuration Center)?

Trong kiến trúc Microservices, ứng dụng được tách thành rất nhiều dịch vụ triển khai độc lập, và mỗi dịch vụ đều có cấu hình riêng (địa chỉ service, tham số database, công tắc tính năng, v.v.). Số lượng mục cấu hình sẽ tăng lên theo số lượng service, số lượng môi trường và số lượng cluster. Cách dùng file cấu hình truyền thống gặp những vấn đề sau:

- **Sửa xong phải khởi động lại**: Dù cấu hình nằm trong kho mã nguồn hay file bên ngoài, rất nhiều ứng dụng vẫn phải khởi động lại tiến trình thì cấu hình mới có hiệu lực.
- **Gắn chặt với chu kỳ phát hành code**: Nếu đặt cấu hình trong kho mã nguồn, thay đổi cấu hình thường phải đi kèm đợt release code, rất khó triển khai canary và rollback độc lập.
- **Độ bảo mật chưa đủ**: Ghi trực tiếp các cấu hình nhạy cảm (mật khẩu database, API Key) vào kho mã nguồn rất dễ bị lộ.
- **Thiếu kiểm soát phân quyền**: Không thể phân quyền chi tiết cho các thao tác xem, sửa, phát hành cấu hình.
- **Cấu hình phân tán khó quản lý**: Cấu hình của nhiều môi trường (dev/test/prod) và nhiều cluster nằm rải rác khắp nơi, khó bảo trì tập trung.

Ngoài ra, trung tâm cấu hình thường cung cấp thêm các năng lực nâng cao sau:

- **Quản lý phiên bản**: Ghi nhận người sửa, thời gian sửa, nội dung sửa của mỗi lần thay đổi cấu hình, hỗ trợ rollback chỉ với một thao tác.
- **Phát hành Canary (Canary Release)**: Đẩy cấu hình trước cho một phần instance để kiểm chứng, giảm thiểu rủi ro khi thay đổi (Apollo và Nacos 1.1.0+ hỗ trợ).

![Trung tâm cấu hình Apollo](/media/jg/ext/oss.javaguide.cn/github/javaguide/config-center/view-release-history-08163626.png)

Tất nhiên, không phải hệ thống nào cũng cần dựng trung tâm cấu hình. Với ứng dụng nguyên khối (Monolith), một môi trường duy nhất, ít cấu hình và tần suất thay đổi thấp, dùng `application-{profile}.yml`, biến môi trường hoặc Kubernetes ConfigMap + rolling restart thường đã đủ dùng. Trung tâm cấu hình sẽ kéo theo chi phí vận hành, vùng lỗi (failure domain) và luồng gỡ lỗi phát sinh thêm, nên các đội ngũ nhỏ hoặc kịch bản ít thay đổi cấu hình không nên phức tạp hóa quá mức.

Nhìn từ góc độ hệ thống phân tán, trung tâm cấu hình là một Control Plane điển hình: nó quyết định "hiện tại nên dùng bản cấu hình nào", còn client chịu trách nhiệm kéo, cache, lắng nghe và làm mới (refresh). Phát hành cấu hình, canary, rollback và snapshot cục bộ phía client thực chất đều xoay quanh bài toán đánh đổi giữa quyết định tập trung và khả năng chịu lỗi phía client. Bạn có thể đọc kết hợp với [Giải thích chi tiết Điều phối phân tán](./protocol/centralized-and-decentralized.md) để hiểu sâu hơn.

Trung tâm cấu hình cũng thường xuất hiện cùng [RPC](./rpc/) và [API Gateway](./api-gateway.md): RPC framework cần lấy cấu hình quản trị như địa chỉ service, timeout, retry, giáng cấp; còn gateway cũng có thể dựa vào trung tâm cấu hình để cập nhật định tuyến động và quy tắc canary. Chúng giải quyết những bài toán khác nhau, nhưng trong hệ thống Microservices thực tế thường nằm nối tiếp trên cùng một luồng xử lý.

## Có những Trung tâm cấu hình phổ biến nào? Chọn thế nào?

| Phương án                                                           | Trạng thái | Đặc điểm                                                                 |
| ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| [Spring Cloud Config](https://cloud.spring.io/spring-cloud-config/) | Hoạt động  | Hỗ trợ bản địa từ hệ sinh thái Spring, lưu trữ dựa trên Git             |
| [Nacos](https://github.com/alibaba/nacos)                           | Hoạt động  | Mã nguồn mở của Alibaba, tích hợp 2 trong 1: Config Center + Service Discovery |
| [Apollo](https://github.com/apolloconfig/apollo)                    | Hoạt động  | Mã nguồn mở của Ctrip, mạnh về quản trị cấu hình, phân quyền và kiểm toán (Audit) |
| K8s ConfigMap                                                       | Hoạt động  | Giải pháp bản địa của Kubernetes                                         |
| Disconf / Qconf                                                     | Ngừng phát triển lâu | Không khuyến nghị dùng cho dự án mới                            |

**Gợi ý lựa chọn**:

- Chỉ cần trung tâm cấu hình → **Apollo** (năng lực quản trị chi tiết hơn) hoặc **Nacos** (chạy standalone nhẹ hơn)
- Cần cả trung tâm cấu hình + khám phá dịch vụ (Service Discovery) → **Nacos**
- Hệ sinh thái Spring Cloud và ưu tiên đơn giản → **Spring Cloud Config**
- Môi trường Kubernetes → **Mount K8s ConfigMap + lắng nghe thay đổi file ở tầng ứng dụng**. Khi ConfigMap được mount dưới dạng Volume, `kubelet` sẽ đồng bộ định kỳ, thời gian cấu hình thực sự hiển thị phụ thuộc vào chu kỳ đồng bộ của kubelet và cơ chế lan truyền cache cục bộ; cách truyền qua biến môi trường hoặc mount `subPath` sẽ không tự cập nhật. Để hot-reload có thể dùng `inotify` theo dõi file được mount, hoặc dùng Spring Cloud Kubernetes lắng nghe thay đổi ConfigMap qua K8s Watch API rồi kích hoạt refresh.

**Apollo vs Nacos vs Spring Cloud Config**

> **Lưu ý phiên bản**: Bảng so sánh dưới đây dựa trên Apollo 2.x, Nacos 2.x và Spring Cloud Config 4.x/5.x. Hệ Spring Boot 3 thường tương ứng với Spring Cloud Config 4.x, còn Spring Boot 4 tương ứng với nhánh phát hành Spring Cloud 2025.x mới hơn; nếu vẫn đang dùng Spring Boot 2 thì tương ứng với Spring Cloud Config 3.x.

| Tính năng                 | Apollo                                                            | Nacos                                                          | Spring Cloud Config                              |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| Giao diện cấu hình        | Có (phân quyền, kiểm toán, quy trình phát hành khá hoàn chỉnh)    | Có                                                             | Không (thường thao tác qua nền tảng Git)         |
| Cấu hình hiệu lực tức thì | Có (HTTP Long Polling, thường nhận biết ở mức giây)               | Có (thông báo thay đổi qua gRPC + client pull)                 | Bán thời gian thực (cần kích hoạt refresh hoặc Bus broadcast) |
| Quản lý phiên bản         | Hỗ trợ sẵn                                                        | Hỗ trợ sẵn                                                     | Phụ thuộc Git                                    |
| Quản lý phân quyền        | Có (đa tầng: ứng dụng / namespace / môi trường, v.v.)             | Có                                                             | Phụ thuộc nền tảng Git                           |
| Phát hành Canary          | Có (quy tắc chi tiết hơn)                                         | Có (từ 1.1.0+, tính năng tương đối cơ bản)                     | Không hỗ trợ                                     |
| Rollback cấu hình         | Có                                                                | Có                                                             | Phụ thuộc Git                                    |
| Thông báo cảnh báo        | Có                                                                | Có                                                             | Không hỗ trợ                                     |
| Đa ngôn ngữ               | Có (Open API / client đa ngôn ngữ)                                | Có (Open API / client đa ngôn ngữ)                            | Thiên về ứng dụng Spring                         |
| Đa môi trường             | Có (thường tách biệt vật lý)                                      | Có (thường tách biệt logic bằng Namespace)                     | Cần phối hợp nhiều kho Git                       |
| Thành phần phụ thuộc      | MySQL (Service Registry mặc định nhúng trong Config Service)      | MySQL ngoài (khuyến nghị production) / Derby nhúng + JRaft     | Git + tùy chọn Message Queue                     |

**So sánh chuyên sâu**:

1. **Apollo**: Mạnh hơn ở mô hình phân quyền, nhật ký kiểm toán phát hành (audit), diff trước khi phát hành và quy tắc canary — phù hợp với đội ngũ yêu cầu quản trị cấu hình chặt chẽ. Trong kịch bản tách biệt vật lý đa môi trường (FAT/UAT/PROD), mỗi môi trường phải triển khai riêng một bộ Config Service, Admin Service và database độc lập, mức độ phức tạp vận hành từ trung bình đến cao.
2. **Nacos**: Gộp trung tâm cấu hình và Service Registry làm một, triển khai đơn giản (chế độ standalone chỉ là một file JAR). Cụm production khuyến nghị dùng MySQL bên ngoài; Derby nhúng + JRaft phù hợp hơn cho môi trường test hoặc quy mô nhỏ. Mô hình `Namespace/Group/DataId` của Nacos rất dễ làm quen, nhưng việc cách ly môi trường thường thiên về cách ly logic.
3. **Spring Cloud Config**: Kiến trúc đơn giản nhất (dựa trên Git), nhưng tính thời gian thực kém và cần thêm thành phần phụ trợ để tự động làm mới cấu hình.

## Ranh giới giữa Trung tâm cấu hình, Service Registry và K8s ConfigMap

- **Trung tâm cấu hình ứng dụng (Apollo / Nacos / Spring Cloud Config)**: Chủ yếu giải quyết việc quản lý tập trung, kiểm toán, canary và làm mới động các cấu hình ứng dụng như tham số nghiệp vụ, công tắc tính năng, ngưỡng giới hạn, thông tin kết nối.
- **Service Registry (Eureka / Nacos / Consul)**: Chủ yếu giải quyết việc đăng ký instance dịch vụ, khám phá dịch vụ và đồng bộ trạng thái sức khỏe. Nacos cung cấp đồng thời cả năng lực Config Center và Service Registry, nhưng hai nhóm trách nhiệm vẫn tách biệt.
- **Kubernetes ConfigMap**: Chủ yếu giải quyết cấu hình runtime của container như tham số khởi động Pod, biến môi trường, file mount; bản thân nó không cung cấp sẵn quy trình phê duyệt phát hành, quy tắc canary hay cơ chế refresh đối tượng bên trong ứng dụng.
- **Cấu hình Service Mesh / Ingress**: Chủ yếu giải quyết các chính sách quản trị như định tuyến lưu lượng, ngắt mạch, retry, timeout, lưu lượng canary; đối tượng cấu hình thường là CRD hoặc tài nguyên của Control Plane.

## Những điểm thiết kế cốt lõi của Trung tâm cấu hình

Khi thiết kế hoặc lựa chọn trung tâm cấu hình, cần chú ý các năng lực sau:

### 1. Cơ chế đẩy cấu hình (Configuration Push)

| Mô hình          | Tính thời gian thực     | Áp lực phía Server                           | Độ phức tạp cài đặt | Kịch bản phù hợp         |
| ---------------- | ----------------------- | -------------------------------------------- | ------------------- | ------------------------ |
| **Push Mode**    | Cao (mức mili-giây)     | Cao (phải duy trì kết nối liên tục)          | Cao                 | Yêu cầu thời gian thực nghiêm ngặt |
| **Pull Mode**    | Thấp (giây ~ phút)      | Cao (nhiều polling vô ích)                   | Thấp                | Cấu hình rất ít thay đổi |
| **Long Polling** | Trung bình - cao (giây) | Trung bình (áp lực bộ nhớ khi kết nối lớn)   | Trung bình          | **Phương án chủ đạo**    |

> **Giải thích cơ chế đẩy**:
>
> - **Apollo**: Dùng HTTP Long Polling. Client gửi request lên; nếu có thay đổi, server trả về ngay; nếu chưa có thay đổi, server giữ request ở trạng thái treo (mặc định phía server khoảng 60s, read timeout phía client thường dài hơn), và trong khoảng thời gian đó hễ có thay đổi là phản hồi lập tức.
> - **Nacos 2.x**: Luồng Service Discovery nâng cấp lên gRPC bidirectional stream cho tính thời gian thực tốt hơn; còn luồng Config Center nói chính xác là mô hình hai pha "thông báo thay đổi + client kéo" — server báo cho client biết cấu hình đã thay đổi, sau đó client chủ động kéo nội dung cấu hình mới nhất theo nhu cầu.
>
> **Lưu ý**: Nói chặt chẽ, Long Polling vẫn là request kéo do client chủ động gửi lên, chỉ khác là server giữ kết nối treo để đạt gần như thời gian thực; bảng trên tách thành cột riêng theo thông lệ ngành nhằm làm nổi bật đặc tính vận hành. Dù Long Polling tiết kiệm CPU và băng thông mạng hơn Short Polling, khi quy mô client lên tới hàng trăm nghìn, server vẫn phải giữ lượng khổng lồ request đang treo. Lấy Apollo làm ví dụ: server dùng `DeferredResult` của Spring MVC để treo request, dựa trên tính năng bất đồng bộ Servlet 3.0 và Tomcat NIO Connector, nên vẫn đòi hỏi tài nguyên bộ nhớ và giới hạn số lượng kết nối.

### 2. Danh sách tính năng bắt buộc

- **Kiểm soát phân quyền**: Phân quyền theo cấp cho việc xem, sửa và phát hành cấu hình
- **Nhật ký kiểm toán (Audit Log)**: Ghi lại đầy đủ người thao tác, thời điểm và nội dung thay đổi cấu hình
- **Quản lý phiên bản**: Mỗi lần phát hành tạo một số phiên bản, hỗ trợ rollback về bất kỳ phiên bản lịch sử nào
- **Phát hành Canary**: Đẩy cấu hình trước tới một phần instance, kiểm chứng đạt mới phát hành toàn bộ
- **Cách ly đa môi trường**: Quản lý độc lập cấu hình cho môi trường dev, test và production
- **Triển khai độ sẵn sàng cao (High Availability)**: Bản thân trung tâm cấu hình cũng cần triển khai dạng cluster để tránh điểm lỗi đơn lẻ

### 3. Chịu lỗi phía Client và Thứ tự khởi động

Trung tâm cấu hình là hạ tầng cốt lõi; một khi mất khả năng phục vụ sẽ ảnh hưởng tới hàng loạt ứng dụng nghiệp vụ. Vì vậy client bắt buộc phải có khả năng chịu lỗi (Disaster Tolerance):

- **Cache đa tầng**: Ưu tiên đọc cấu hình trong bộ nhớ; khi trung tâm cấu hình không khả dụng thì đọc từ snapshot cục bộ; nếu snapshot cục bộ cũng chưa có thì dùng giá trị mặc định dự phòng trong code hoặc từ chối khởi động.
- **Khởi động giáng cấp**: Với các cấu hình không tối quan trọng, có thể khởi động bằng snapshot cục bộ trước rồi kết nối bất đồng bộ tới trung tâm cấu hình sau; còn với cấu hình trọng yếu như địa chỉ database hay khóa mã hóa, có thể chọn chế độ "thiếu cấu hình thì không cho khởi động".
- **Kết nối lại kèm Backoff**: Khi kết nối Long Polling hoặc kết nối dài bị ngắt, client cần kết nối lại theo chiến lược backoff (giãn thời gian chờ) để tránh tình trạng bão kết nối làm sập trung tâm cấu hình lúc vừa khôi phục.
- **Ranh giới làm mới (Refresh)**: Làm mới động không đồng nghĩa mọi đối tượng trong ứng dụng đều tự động đổi giá trị. Ví dụ trong Spring, các giá trị đã inject vào field thông thường, field `final` hoặc nằm trong logic lắp ráp có điều kiện có thể không tự refresh như kỳ vọng — cần kết hợp `@RefreshScope`, listener hoặc thiết kế lại vòng đời Bean.

## Lấy Apollo làm ví dụ về thiết kế Trung tâm cấu hình

### Giới thiệu Apollo

Theo mô tả chính thức của Apollo:

> [Apollo](https://github.com/apolloconfig/apollo) là trung tâm cấu hình phân tán do bộ phận framework của Ctrip nghiên cứu phát triển, có thể quản lý tập trung cấu hình cho nhiều môi trường và nhiều cluster khác nhau của ứng dụng, đẩy thay đổi cấu hình tới phía ứng dụng theo thời gian thực, đồng thời sở hữu hệ thống phân quyền và quản trị quy trình chuẩn mực, phù hợp với bài toán quản lý cấu hình Microservices.
>
> Phía server được phát triển trên Spring Boot và Spring Cloud, sau khi đóng gói có thể chạy trực tiếp mà không cần cài thêm container ứng dụng như Tomcat.
>
> Client Java không phụ thuộc bất kỳ framework nào, có thể chạy trên mọi môi trường Java runtime, đồng thời tích hợp rất tốt với môi trường Spring / Spring Boot.

Các đặc tính cốt lõi của Apollo:

- **Thay đổi cấu hình có hiệu lực tức thì (Hot Publishing)**: Dựa trên Long Polling, nhận được cấu hình mới nhất trong vòng 1 giây
- **Phát hành Canary**: Chỉ đẩy cấu hình tới một phần ứng dụng nhằm giảm rủi ro thay đổi
- **Triển khai đơn giản**: Một môi trường đơn lẻ chỉ phụ thuộc MySQL; Service Registry đi kèm của Apollo (mặc định là Eureka) chạy nhúng ngay trong tiến trình Config Service nên không cần triển khai riêng. Khi tách biệt vật lý đa môi trường, mỗi môi trường cần triển khai một bộ Config Service, Admin Service và database độc lập
- **Đa ngôn ngữ**: Cung cấp giao diện HTTP, không giới hạn ngôn ngữ lập trình

Để xem cách sử dụng Apollo, có thể tham khảo [Hướng dẫn sử dụng Apollo chính thức (tiếng Trung)](https://www.apolloconfig.com/#/zh/).

### Phân tích kiến trúc Apollo

Mô hình cơ bản của Apollo do tài liệu chính thức cung cấp (Nguồn ảnh: Tài liệu chính thức Apollo - Apollo Design):

![](/media/jg/ext/img-blog.csdnimg.cn/a75ccb863e4a401d947c87bb14af7dc3-de9ce86e.png)

1. Người dùng sửa/phát hành cấu hình trên trung tâm cấu hình Apollo
2. Trung tâm cấu hình Apollo thông báo cho ứng dụng biết cấu hình đã thay đổi
3. Ứng dụng truy vấn trung tâm cấu hình Apollo để lấy cấu hình mới nhất

Sơ đồ kiến trúc chính thức (Nguồn ảnh: Tài liệu chính thức Apollo - Apollo Design):

![](/media/jg/ext/img-blog.csdnimg.cn/79c7445f9dbc45adb45699d40ef50f44-cab2dfa6.png)

### Mô tả các thành phần

| Thành phần            | Vai trò                                                                                                  | Cổng mặc định           |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Portal**            | Giao diện quản trị Web, cung cấp tính năng quản lý cấu hình trực quan                                    | 8070                    |
| **Client**            | Client SDK, cung cấp khả năng lấy cấu hình và lắng nghe thay đổi                                         | -                       |
| **Meta Server**       | Điểm đầu mối khám phá dịch vụ, chạy cùng tiến trình với Config Service để Client/Portal lấy địa chỉ dịch vụ | 8080                 |
| **Config Service**    | Cung cấp API đọc cấu hình và thông báo Long Polling cho Client; đồng thời nhúng sẵn Service Registry     | 8080                    |
| **Admin Service**     | Cung cấp API quản lý cấu hình cho Portal                                                                 | 8090                    |
| **Eureka (Nhúng)**    | Instance Registry nhúng cùng tiến trình Config Service cho Config/Admin Service đăng ký & khám phá; không cần triển khai độc lập | Giống Config Service |
| **MySQL**             | Lưu trữ dữ liệu cấu hình và metadata                                                                     | 3306                    |

Từ Apollo 2.0+ đã hỗ trợ thay thế cài đặt đăng ký và khám phá dịch vụ qua SPI, chẳng hạn tích hợp Nacos, Consul, Polaris, v.v. Tuy nhiên, ở mô hình triển khai mặc định, Eureka là thành phần nhúng bên trong Config Service, không nên hiểu nhầm thành một cụm Eureka ngoài cần vận hành tách biệt.

### Luồng xử lý cốt lõi

**Phía Client (Lấy cấu hình)**:

1. Khi khởi động, Client gọi tới Meta Server để lấy danh sách địa chỉ Config Service
2. Client cache danh sách địa chỉ dịch vụ ở cục bộ (vẫn hoạt động được khi Eureka gặp sự cố)
3. Client gửi request Long Polling để lấy cấu hình
4. Khi Config Service phát hiện cấu hình thay đổi sẽ phản hồi ngay lập tức
5. Client cập nhật cache trong bộ nhớ, kích hoạt callback thay đổi và **lưu bền vững bất đồng bộ xuống hệ thống file cục bộ**. Thư mục cache mặc định trên Linux/Mac nằm tại `/opt/data/{appId}/config-cache/`, trên Windows mặc định tại `C:\opt\data\{appId}\config-cache\`, và cũng có thể tùy chỉnh qua thuộc tính hệ thống `apollo.cache-dir`

> **Cơ chế dự phòng thảm họa**: Ngay cả khi toàn bộ Config Service bị sập và ứng dụng phải khởi động lại, Client vẫn có thể đọc cấu hình đã cache từ ổ đĩa cục bộ để hoàn tất khởi động, đảm bảo tính sẵn sàng của ứng dụng không phụ thuộc cứng vào trung tâm cấu hình.

**Phía Portal (Phát hành cấu hình)**:

1. Người dùng sửa cấu hình trên Portal và nhấn Phát hành
2. Portal gọi API phát hành của Admin Service
3. Admin Service ghi cấu hình vào MySQL và tạo phiên bản phát hành
4. Config Service thông qua Long Polling thông báo cho Client biết cấu hình đã thay đổi
5. Client kéo lại cấu hình mới nhất

### Ví dụ sử dụng Client

Lấy cấu hình:

```java
Config config = ConfigService.getAppConfig();
String someKey = "someKeyFromDefaultNamespace";
String someDefaultValue = "someDefaultValueForTheKey";
String value = config.getProperty(someKey, someDefaultValue);
```

Lắng nghe thay đổi cấu hình:

```java
Config config = ConfigService.getAppConfig();
config.addChangeListener(new ConfigChangeListener() {
    @Override
    public void onChange(ConfigChangeEvent changeEvent) {
        // Xử lý thay đổi cấu hình
        for (String key : changeEvent.changedKeys()) {
            ConfigChange change = changeEvent.getChange(key);
            System.out.println(String.format(
                "Key: %s, Old: %s, New: %s",
                key, change.getOldValue(), change.getNewValue()));
        }
    }
});
```

Trong dự án Spring Boot, code production thường không gọi thẳng các API tầng thấp ở khắp nơi, mà thông qua tích hợp Apollo Spring để inject và refresh cấu hình — ví dụ dùng `@EnableApolloConfig` để bật Apollo, rồi dùng `@Value`, `@ConfigurationProperties` hoặc `@ApolloConfigChangeListener` để lắng nghe thay đổi. Cần chú ý rằng các Bean lắp ráp có điều kiện (như `@ConditionalOnProperty`) và các Bean phức tạp đã khởi tạo xong không hẳn sẽ tự động tái tạo khi cấu hình đổi, nên những thay đổi cấu hình quan trọng vẫn cần được kiểm chứng theo chiến lược refresh của nghiệp vụ.

## Mô hình cốt lõi của Nacos Configuration Center

Nacos cung cấp đồng thời cả trung tâm cấu hình và khám phá dịch vụ — đây cũng là một trong những điểm khác biệt chính giữa Nacos và Apollo. Dưới góc nhìn trung tâm cấu hình, Nacos thường dùng mô hình ba tầng để định danh một bản cấu hình:

- **Namespace**: Thường dùng để cách ly theo môi trường hoặc tenant, ví dụ `dev`, `test`, `prod`.
- **Group**: Thường dùng để gom nhóm theo miền nghiệp vụ hoặc ứng dụng, mặc định là `DEFAULT_GROUP`.
- **DataId**: Định danh file cấu hình hoặc mục cấu hình cụ thể, ví dụ `order-service.yaml`.

Việc lưu trữ cấu hình của Nacos cũng cần phân biệt theo mô hình triển khai:

- **Cụm Production**: Khuyến nghị dùng MySQL ngoài để lưu dữ liệu cấu hình; tính nhất quán dữ liệu chủ yếu do giải pháp High Availability của chính MySQL đảm bảo.
- **Lưu trữ nhúng (Embedded Storage)**: Nacos cũng hỗ trợ lưu trữ nhúng như Derby. Ở chế độ cluster, Nacos dùng JRaft để gom lưu trữ nhúng của các node thành một cụm logic — phù hợp cho môi trường test, quy mô nhỏ hoặc bối cảnh cực kỳ nhạy cảm với chi phí vận hành, nhưng độ phức tạp khi gỡ lỗi sự cố cao hơn.

Sau khi Nacos 2.x đưa vào kết nối dài gRPC, chi phí kết nối giữa client và server thấp hơn nhiều so với HTTP Long Polling ở bản 1.x. Khi cấu hình thay đổi, server sẽ thông báo cho client biết "có một cấu hình vừa thay đổi", rồi client kéo nội dung cấu hình mới nhất và gọi lại các listener. Cách này vừa tránh phải nhồi gói cấu hình lớn trực tiếp vào luồng thông báo, vừa thuận tiện cho client tạo snapshot cục bộ và chịu lỗi.

Client của Nacos cũng duy trì snapshot cục bộ. Khi trung tâm cấu hình không khả dụng, client có thể đọc file snapshot/failover cục bộ để tiếp tục khởi động hoặc vận hành; đường dẫn cache cụ thể có thể thay đổi tùy theo phiên bản client, namespace, địa chỉ server, Group và DataId, nên khi kiểm tra sự cố hãy đối chiếu theo log của phiên bản client đang dùng và thư mục `nacos/config` cục bộ.

## Tài liệu tham khảo

- [Tài liệu chính thức Nacos](https://nacos.io/docs/latest/what-is-nacos/)
- [Triển khai Nacos chế độ Cluster](https://nacos.io/docs/v2.5/manual/admin/deployment/deployment-cluster/)
- [Tài liệu chính thức Apollo (tiếng Trung)](https://www.apolloconfig.com/#/zh/README)
- [Kho mã nguồn GitHub của Apollo](https://github.com/apolloconfig/apollo)
- [Tài liệu chính thức Spring Cloud Config](https://cloud.spring.io/spring-cloud-config/)
- [Ma trận tương thích phiên bản Spring Cloud](https://spring.io/spring-cloud)
- [Tài liệu chính thức Kubernetes ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Phát hành Nacos 1.1.0, hỗ trợ cấu hình Canary (tiếng Trung)](https://nacos.io/zh-cn/blog/nacos%201.1.0.html)
- [Thực tiễn áp dụng Apollo tại Youzan (tiếng Trung)](https://mp.weixin.qq.com/s/Ge14UeY9Gm2Hrk--E47eJQ)
- [So sánh lựa chọn Trung tâm cấu hình Microservices (tiếng Trung)](https://www.itshangxp.com/spring-cloud/spring-cloud-config-center/)
