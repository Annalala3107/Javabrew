---
title: "Giải thích chi tiết API Gateway: Tính năng cốt lõi, Nguyên lý hoạt động và Lựa chọn Spring Cloud Gateway / Kong / APISIX"
category: Hệ thống Phân tán
description: "Giải thích chi tiết kiến thức cốt lõi về API Gateway, bao gồm định tuyến request, xác thực phân quyền, giới hạn lưu lượng (Rate Limiting) và ngắt mạch (Circuit Breaking), cân bằng tải (Load Balancing), triển khai canary (Canary Release), kiến trúc gateway hai tầng, cùng so sánh lựa chọn giữa Spring Cloud Gateway, Kong, APISIX, ShenYu."
tag:
  - API Gateway
head:
  - - meta
    - name: keywords
      content: API Gateway,Microservices Gateway,Spring Cloud Gateway,Kong,APISIX,ShenYu,Zuul,Rate Limiting và Circuit Breaking,Cân bằng tải,Lựa chọn Gateway,Câu hỏi phỏng vấn Gateway
lang: vi
sourceRef: zh-ref/distributed-system/api-gateway.md
---

## Gateway là gì?

API Gateway (Cổng API) là **cổng vào thống nhất** nằm giữa client và các dịch vụ backend. Mọi request từ client đều đi qua gateway trước, sau đó mới được gateway định tuyến tới dịch vụ đích cụ thể.

Trong chuỗi bài viết về hệ thống phân tán này, gateway thuộc tầng "cổng tiếp nhận lưu lượng". [RPC](./rpc/) tập trung vào cách các dịch vụ gọi qua lại lẫn nhau ở bên trong, còn gateway giải quyết việc request từ bên ngoài đi vào hệ thống sẽ được định tuyến, xác thực, giới hạn lưu lượng, chia nhánh canary và chuyển đổi giao thức như thế nào. Nếu bạn chỉ muốn xem chi tiết về Route, Predicate, Filter và cơ chế giới hạn lưu lượng của Spring Cloud Gateway, có thể đọc tiếp [Tổng hợp câu hỏi phỏng vấn Spring Cloud Gateway](./spring-cloud-gateway-questions.md).

### Giá trị cốt lõi

Trong kiến trúc Microservices, một hệ thống được chia nhỏ thành nhiều service. Những tính năng như **xác thực bảo mật, kiểm soát lưu lượng, ghi log, giám sát** đều là nhu cầu chung của mọi service. Nếu không có gateway, chúng ta buộc phải tự cài đặt lại các tính năng này ở từng service, dẫn tới:

- **Trùng lặp mã nguồn**: Cùng một logic bị viết lặp lại dư thừa ở nhiều service
- **Quản lý phân tán**: Thiếu góc nhìn cấu hình và giám sát tập trung
- **Chi phí bảo trì cao**: Mỗi lần thay đổi tính năng dùng chung đều phải sửa ở toàn bộ các service

![Sơ đồ tổng quan API Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gateway-overview-ee8b371d.png)

### Trách nhiệm cốt lõi

Tuy tính năng của gateway rất đa dạng, nhưng cốt lõi có thể gói gọn thành hai nhiệm vụ chính:

| Trách nhiệm          | Mô tả                                                                   | Tính năng tiêu biểu                                                   |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Chuyển tiếp request** | Định tuyến request từ client tới đúng dịch vụ đích                   | Định tuyến động, cân bằng tải (Load Balancing), chuyển đổi giao thức  |
| **Lọc request**      | Chặn và xử lý trước/sau khi request đi tới dịch vụ backend              | Xác thực danh tính, kiểm tra quyền, giới hạn lưu lượng & ngắt mạch, ghi log |

Bảng trên là hai nhóm trách nhiệm cốt lõi ở góc độ trừu tượng; khi đi vào năng lực cụ thể sẽ mở rộng ra hơn chục tính năng gateway được liệt kê ở phần tiếp theo.

Gateway có thể cung cấp chuyển tiếp request, xác thực bảo mật (danh tính/phân quyền), kiểm soát lưu lượng, cân bằng tải, giáng cấp và ngắt mạch (Degradation & Circuit Breaking), ghi log, giám sát, kiểm tra tham số, chuyển đổi giao thức, v.v.

**Vị trí của gateway trong kiến trúc Microservices**: Mọi request từ client đều đi tới gateway trước; gateway đảm nhiệm thống nhất việc xác thực phân quyền, kiểm soát lưu lượng và điều phối định tuyến, còn các service backend tập trung xử lý logic nghiệp vụ.

### Triển khai độ sẵn sàng cao (High Availability)

Việc đưa gateway vào hệ thống sẽ phát sinh thêm một bước chuyển tiếp mạng (mức suy hao hiệu năng trong mạng nội bộ thường không đáng kể), nhưng đồng thời cũng tạo ra thêm một điểm rủi ro đơn lẻ (Single Point of Failure). Vì vậy, bản thân dịch vụ gateway bắt buộc phải đảm bảo độ sẵn sàng cao:

Như minh họa dưới đây, lớp ngoài của dịch vụ gateway được đặt sau Nginx (hoặc thiết bị/phần mềm cân bằng tải khác) để phân phối tải nhằm đạt độ sẵn sàng cao. Khi triển khai Nginx cũng cần tính đến cơ chế High Availability để tránh biến Nginx thành điểm lỗi đơn lẻ.

![Cân bằng tải phía server dựa trên Nginx](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/server-load-balancing-00788c20.png)

## Gateway có thể cung cấp những tính năng nào?

Phần lớn các gateway đều có thể cung cấp các tính năng sau (một số tính năng cần kết hợp thêm framework hoặc middleware khác):

- **Chuyển tiếp request**: Chuyển tiếp request tới Microservice đích.
- **Cân bằng tải (Load Balancing)**: Cân bằng tải động cho request dựa trên tình trạng tải của từng instance Microservice hoặc chiến lược cân bằng tải đã cấu hình.
- **Xác thực bảo mật**: Xác thực danh tính request của người dùng, chỉ cho phép client đáng tin cậy truy cập API và hỗ trợ phân quyền theo mô hình như RBAC.
- **Kiểm tra tham số**: Hỗ trợ ánh xạ tham số và logic kiểm tra hợp lệ (Validation).
- **Ghi log**: Lưu lại log hành vi của toàn bộ request để phục vụ tra cứu và kiểm toán sau này.
- **Giám sát và cảnh báo**: Giám sát từ chỉ số nghiệp vụ, chỉ số máy chủ đến chỉ số JVM, đồng thời đi kèm cơ chế cảnh báo.
- **Kiểm soát lưu lượng (Traffic Control)**: Kiểm soát lưu lượng request đi vào, tức giới hạn số lượng request trong một khoảng thời gian nhất định.
- **Ngắt mạch và giáng cấp (Circuit Breaking & Degradation)**: Theo dõi thống kê request theo thời gian thực; khi chạm ngưỡng lỗi đã cấu hình thì tự động ngắt mạch và trả về giá trị mặc định.
- **Cache phản hồi (Response Caching)**: Khi request của người dùng lấy các dữ liệu tĩnh hoặc ít thay đổi, nhiều request trong một khoảng thời gian sẽ nhận về kết quả giống hệt nhau. Trong trường hợp đó có thể cache phản hồi ngay tại tầng gateway để trả dữ liệu trực tiếp cho client mà không cần gọi xuống service nghiệp vụ, giảm tải cho backend.
- **Tổng hợp phản hồi (Response Aggregation)**: Trong một số kịch bản, dữ liệu trả về cho người dùng cần ghép từ nhiều service nghiệp vụ. Gateway tổng quát có thể làm phép gộp đơn giản, nhưng các kịch bản tổng hợp phức tạp nên đặt ở tầng BFF (Backend For Frontend) hoặc GraphQL để tránh nhồi nhét logic điều phối nghiệp vụ xuống tầng hạ tầng.
- **Triển khai Canary (Canary Release)**: Điều hướng động một phần lưu lượng sang các phiên bản service khác nhau (hình thức Canary Release cơ bản nhất).
- **Xử lý ngoại lệ**: Với các phản hồi lỗi từ service nghiệp vụ trả về, có thể chuyển đổi lại ở tầng gateway trước khi gửi tới người dùng, giúp ẩn đi chi tiết ngoại lệ nội bộ và trả về thông báo lỗi thân thiện hơn.
- **Tài liệu API**: Nếu có kế hoạch mở API cho lập trình viên bên ngoài tổ chức, bắt buộc phải tính đến việc cung cấp tài liệu API như Swagger hoặc OpenAPI.
- **Chuyển đổi giao thức**: Tích hợp các Microservice backend xây dựng trên nhiều phong cách và công nghệ khác nhau như REST, AMQP, Dubbo thông qua chuyển đổi giao thức để cung cấp giao diện thống nhất cho các client đặc thù như Web/Mobile hoặc nền tảng mở.
- **Quản lý chứng chỉ**: Triển khai chứng chỉ SSL tại API Gateway và quản lý tập trung tại một điểm vào duy nhất, giảm đáng kể độ phức tạp khi gia hạn hoặc thay thế chứng chỉ.

Cần lưu ý rằng gateway không phải nơi phù hợp để gánh mọi loại logic. Các kiểm tra quy tắc nghiệp vụ chặt chẽ, ánh xạ trường dữ liệu phức tạp, transaction kéo dài, logic nghiệp vụ trên kết nối dài (long-lived connection) hay phân quyền nghiệp vụ chi tiết thường nên trả về cho service nghiệp vụ, tầng BFF hoặc GraphQL xử lý. Gateway phù hợp hơn với các năng lực dùng chung ở tầng giao thức và xuyên suốt nhiều service, tránh phình to thành một "monolithic gateway" khó bảo trì.

Sơ đồ dưới đây trích từ bài viết [Thiết kế và triển khai dịch vụ API Gateway quy mô chục tỷ request Shepherd - Đội ngũ kỹ thuật Meituan - 2021 (tiếng Trung)](https://mp.weixin.qq.com/s/iITqdIiHi3XGKq6u6FRVdg).

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/up-35e102c633bbe8e0dea1e075ea3fee5dcfb-e881b19b.png)

## Có những hệ thống Gateway phổ biến nào?

### Netflix Zuul

Zuul là dịch vụ gateway do Netflix phát triển, cung cấp định tuyến động, giám sát, khả năng phục hồi (resiliency) và bảo mật. Hệ thống xây dựng trên nền tảng công nghệ Java và phối hợp mượt với các thành phần như Eureka, Ribbon, Hystrix.

Kiến trúc cốt lõi của Zuul như sau:

![Kiến trúc cốt lõi của Zuul](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/zuul-core-architecture-888530a3.webp)

Zuul chủ yếu lọc request thông qua các Filter (tương tự cơ chế AOP) để triển khai đầy đủ các tính năng cần thiết của một gateway.

![Vòng đời request của Zuul](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/zuul-request-lifecycle-74745293.webp)

Chúng ta có thể tự viết Filter tùy biến để xử lý request, đồng thời hệ sinh thái Zuul cũng có sẵn rất nhiều Filter có thể dùng ngay. Ví dụ để giới hạn lưu lượng (Rate Limiting), có thể dùng phần mở rộng cộng đồng [spring-cloud-zuul-ratelimit](https://github.com/marcosbarbero/spring-cloud-zuul-ratelimit) (đây chỉ là ví dụ minh họa). Cần phân biệt rõ: Hystrix chủ yếu đảm nhiệm ngắt mạch (Circuit Breaking), timeout, giáng cấp (Fallback) và cô lập bằng Thread Pool / Semaphore, không phải thành phần chuyên dùng để giới hạn QPS theo đúng nghĩa.

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
</dependency>
<dependency>
    <groupId>com.marcosbarbero.cloud</groupId>
    <artifactId>spring-cloud-zuul-ratelimit</artifactId>
    <version>2.2.0.RELEASE</version>
</dependency>
```

[Zuul 1.x](https://netflixtechblog.com/announcing-zuul-edge-service-in-the-cloud-ab3af5be08ee) dựa trên I/O đồng bộ nên hiệu năng khá hạn chế. [Zuul 2.x](https://netflixtechblog.com/open-sourcing-zuul-2-82ea476cb2b3) triển khai I/O bất đồng bộ trên nền Netty, giúp hiệu năng được cải thiện vượt bậc.

![Kiến trúc Zuul 2](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/zuul2-core-architecture-adf8b865.png)

> **Lưu ý quan trọng**: Các module trong Spring Cloud Netflix như Zuul 1.x, Ribbon, Hystrix đã bước vào chế độ bảo trì (maintenance mode), và các bản phát hành chính thống của Spring Cloud từ lâu đã chuyển sang Spring Cloud Gateway. Dù Netflix đã mã nguồn mở Zuul 2.x, nhưng Zuul 2.x chưa từng được tích hợp vào các bản phát hành chính thống của Spring Cloud. Với các dự án mới dùng hệ sinh thái Spring Cloud, không khuyến nghị chọn Zuul 1.x nữa; các dự án hiện hữu nên tận dụng các đợt tái cấu trúc để chuyển dần sang Spring Cloud Gateway hoặc một gateway hiện đại khác.

- Địa chỉ GitHub: <https://github.com/Netflix/zuul>
- Wiki chính thức: <https://github.com/Netflix/zuul/wiki>

### Spring Cloud Gateway

Spring Cloud Gateway là gateway thuộc hệ sinh thái Spring Cloud, ra đời nhằm thay thế gateway đời cũ **Zuul** (chính xác là Zuul 1.x). Điểm đáng chú ý là Spring Cloud Gateway khởi đầu sớm hơn Zuul 2.x, và cả hai đi theo hai hướng tiến hóa công nghệ độc lập.

#### Vì sao Spring Cloud Gateway có hiệu năng tốt hơn?

| Phiên bản                | Mô hình I/O                           | Mô hình Thread          | Thông lượng (Throughput) | Độ trễ (Latency) |
| ------------------------ | ------------------------------------- | ----------------------- | ------------------------ | ---------------- |
| **Zuul 1.x**             | Đồng bộ có chặn (Servlet)             | Mỗi request một Thread  | Thấp                     | Cao              |
| **Zuul 2.x**             | Bất đồng bộ không chặn (Netty)        | Event Loop              | Cao                      | Thấp             |
| **Spring Cloud Gateway** | Bất đồng bộ không chặn (Netty)        | Event Loop              | Cao                      | Thấp             |

Spring Cloud Gateway được xây dựng trên **Spring WebFlux** thay vì Spring Web MVC truyền thống. Spring WebFlux sử dụng thư viện **Reactor** để triển khai mô hình lập trình phản ứng (Reactive Programming), với tầng dưới dựa trên **Netty** cho I/O bất đồng bộ không chặn.

**Ưu điểm của Reactive Programming**:

- **I/O không chặn (Non-blocking I/O)**: Không cần cấp phát một Thread riêng cho mỗi request; chỉ cần một số lượng nhỏ Thread vẫn xử lý được lượng kết nối đồng thời lớn
- **Cơ chế Backpressure**: Backpressure của Reactor chủ yếu phát huy tác dụng trên chuỗi xử lý reactive bên trong tiến trình gateway, giúp tránh việc các request đang xử lý (in-flight) làm sập chính gateway. Bảo vệ quá tải đầu-cuối (end-to-end) vẫn cần dựa vào giới hạn lưu lượng, Bulkhead, timeout và Circuit Breaker tường minh, chẳng hạn các Filter như `RequestRateLimiter`, `CircuitBreaker`
- **Tối ưu hiệu suất tài nguyên**: Giảm mạnh chi phí chuyển đổi ngữ cảnh giữa các Thread (Thread context switching)

#### Các khái niệm cốt lõi

Các thành phần cốt lõi của Spring Cloud Gateway gồm 3 phần:

1. **Route (Định tuyến)**: Khối cấu trúc cơ bản của gateway, gồm ID, URI đích, tập hợp các Predicate và tập hợp các Filter
2. **Predicate (Điều kiện khớp)**: Xây dựng dựa trên functional interface `Predicate` của Java 8 để khớp request HTTP (như đường dẫn, phương thức, header, v.v.). Ví dụ `Path=/api/users/**`, `Method=GET`, `Header=X-Request-Id, \d+`; nhiều Predicate được kết hợp với nhau theo phép AND logic
3. **Filter (Bộ lọc)**: Các instance của `GatewayFilter`, dùng để chỉnh sửa request và response trước hoặc sau khi request được gửi tới dịch vụ hạ nguồn (downstream)

Cả Spring Cloud Gateway và Zuul 2.x đều xử lý request thông qua Filter, nhưng Spring Cloud Gateway tích hợp chặt chẽ hơn với hệ sinh thái Spring (như Eureka, Consul, Config). Hiện tại, với các dự án mới dùng nền tảng Java, Spring Cloud Gateway thường là lựa chọn phổ biến hơn. Cần lưu ý rằng trong tài liệu Spring Cloud Gateway 4.x/5.x đã cung cấp đồng thời hai dạng Server và Proxy Exchange, cùng các nhánh tương thích riêng cho WebFlux và Web MVC. Những đội ngũ quen thuộc với Servlet stack và chưa muốn đưa độ phức tạp của Reactive Programming vào hệ thống cũng có thể cân nhắc Spring Cloud Gateway Server MVC.

Về ranh giới năng lực cũng cần nói rõ: Spring Cloud Gateway tích hợp sẵn Filter `RequestRateLimiter`, với cài đặt Redis phổ biến dựa trên thuật toán Token Bucket, nhưng để dùng giới hạn lưu lượng bằng Redis vẫn cần thêm dependency reactive Redis tương ứng; khả năng ngắt mạch (Circuit Breaking) được cung cấp thông qua Spring Cloud CircuitBreaker thích ứng với Resilience4j, cần bổ sung dependency như `spring-cloud-starter-circuitbreaker-reactor-resilience4j`. Cấu hình Route cũng không chỉ dừng ở "cấu hình trong bộ nhớ": mặc định có thể viết trong YAML, hoặc gắn với nguồn cấu hình ngoài thông qua `RouteDefinitionRepository`, kho lưu trữ Route trên Redis hoặc cài đặt tùy chỉnh kết hợp cơ chế làm mới (refresh) để áp dụng động.

- Địa chỉ GitHub: <https://github.com/spring-cloud/spring-cloud-gateway>
- Trang chủ: <https://spring.io/projects/spring-cloud-gateway>

### OpenResty

Theo giới thiệu chính thức:

> OpenResty là một nền tảng web hiệu năng cao dựa trên Nginx và Lua, tích hợp sẵn bên trong nhiều thư viện Lua chất lượng cao, module bên thứ ba và phần lớn các dependency cần thiết. Nền tảng này giúp xây dựng thuận tiện các ứng dụng web động, dịch vụ web và gateway động có khả năng chịu tải đồng thời cực cao và khả năng mở rộng linh hoạt.

![Mối quan hệ giữa OpenResty, Nginx và Lua](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gatewaynginx-lua-openresty-31f10ba6.png)

OpenResty dựa trên Nginx chủ yếu vì khả năng xử lý đồng thời (concurrency) xuất sắc của Nginx. Tuy nhiên, do Nginx được viết bằng ngôn ngữ C nên rào cản tùy biến mở rộng rất cao: muốn thêm logic hay tính năng tùy chỉnh vào Nginx thì phải viết module bằng C và biên dịch lại Nginx.

Để giải quyết vấn đề này, OpenResty tích hợp và duy trì các module như `ngx_http_lua_module`, `ngx_stream_lua_module`, đưa Lua/LuaJIT vào bên trong Nginx. Nhờ vậy chúng ta có thể nhúng script Lua ngay trong Nginx và mở rộng tính năng gateway bằng ngôn ngữ Lua đơn giản — chẳng hạn như viết quy tắc định tuyến tùy biến, bộ lọc, chiến lược cache, v.v.

> Lua là một ngôn ngữ script động rất nhanh với tốc độ thực thi tiệm cận ngôn ngữ C. LuaJIT là trình biên dịch Just-In-Time (JIT) cho Lua, giúp nâng cao rõ rệt hiệu suất thực thi mã Lua. LuaJIT biên dịch trước và cache các hàm Lua cùng thư viện tiện ích hay dùng, nhờ đó ở các lần gọi sau có thể dùng trực tiếp bytecode đã cache, tăng tốc độ chạy lên rất nhiều.

Để tìm hiểu nhập môn OpenResty và thực chiến bảo mật gateway, bạn có thể tham khảo bài viết: [Nhập môn OpenResty và thực chiến bảo mật Gateway mà mọi kỹ sư backend nên biết (tiếng Trung)](https://mp.weixin.qq.com/s/3HglZs06W95vF3tSa3KrXw).

- Địa chỉ GitHub: <https://github.com/openresty/openresty>
- Trang chủ: <https://openresty.org/>

### Kong

Kong là một hệ thống gateway hiệu năng cao, chuẩn cloud-native, dễ mở rộng và giàu hệ sinh thái, được xây dựng dựa trên [OpenResty](https://github.com/openresty/) (Nginx + Lua), gồm 3 thành phần chính:

- Kong Server: Máy chủ dựa trên Nginx dùng để tiếp nhận các API request.
- PostgreSQL: Dùng để lưu trữ dữ liệu vận hành (chế độ cơ sở dữ liệu truyền thống). Các phiên bản đầu của Kong từng hỗ trợ thêm Cassandra, nhưng từ Kong Gateway 3.4 đã gỡ bỏ hỗ trợ Cassandra DB nên các triển khai mới không nên chọn Cassandra nữa.
- Kong Manager: Công cụ quản trị UI chính thức, cung cấp giao diện trực quan để quản lý API, giám sát và cấu hình (có bản mã nguồn mở OSS và bản doanh nghiệp Enterprise). Cũng có thể quản trị qua RESTful Admin API.

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/kong-way-23c45e6f.webp)

Chế độ truyền thống của Kong phụ thuộc vào cơ sở dữ liệu ngoài để lưu cấu hình, kiến trúc tương đối phức tạp và phải đảm bảo thêm tính sẵn sàng cao cho tầng database. Tuy nhiên, từ phiên bản **Kong 1.1** trở đi, Kong đã hỗ trợ **chế độ DB-less (không cần database)**:

- **Chế độ truyền thống**: Dùng PostgreSQL lưu cấu hình, phù hợp với nhu cầu quản lý dữ liệu API bền vững thông qua Admin API
- **Chế độ DB-less**: Quản lý bằng file cấu hình khai báo (declarative config), không cần triển khai database, kiến trúc gọn nhẹ hơn nhiều
- **Chế độ Hybrid**: Control Plane dùng database để quản lý cấu hình, còn Data Plane không kết nối trực tiếp tới database; phù hợp để phân phối cấu hình đa cluster và liên vùng
- **Chế độ Kubernetes Ingress**: Quản lý cấu hình thông qua ConfigMap hoặc CRD (Kubernetes Custom Resource Definitions), không cần database, là cách dùng phổ biến nhất trong môi trường Kubernetes

> **Lưu ý**: Phần thảo luận về độ sẵn sàng cao của Kong ở các mục sau chủ yếu đề cập đến chế độ database truyền thống. Khi chạy theo chế độ Ingress Controller trên Kubernetes, DB-less hoặc Hybrid, kiến trúc và trọng tâm vận hành sẽ có sự khác biệt rõ rệt.

Kong cung cấp cơ chế plugin để mở rộng tính năng; các plugin được thực thi trong vòng đời xử lý request-response của API. Ví dụ bật plugin Zipkin cho một service:

```shell
$ curl -X POST http://kong:8001/services/{service}/plugins \
    --data "name=zipkin"  \
    --data "config.http_endpoint=http://your.zipkin.collector:9411/api/v2/spans" \
    --data "config.sample_ratio=0.001"
```

Bản thân Kong là một ứng dụng Lua được đóng gói thêm một lớp trên nền tảng OpenResty. Xét đến cùng, nó tận dụng việc nhúng Lua vào Nginx để trao khả năng lập trình cho Nginx, nhờ đó thông qua các plugin có thể làm được vô số tác vụ ở tầng Nginx như giới hạn lưu lượng, chính sách truy cập bảo mật, định tuyến, cân bằng tải, v.v. Viết một plugin Kong thực chất là tuân theo quy chuẩn viết plugin của Kong để viết một script Lua tùy biến, nạp vào Kong rồi gắn sử dụng.

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/kong-gateway-overview-d0df05c1.png)

Ngoài Lua, Kong còn hỗ trợ phát triển plugin bằng các ngôn ngữ như Go, JavaScript, Python nhờ vào bộ PDK (Plugin Development Kit) tương ứng.

Để xem hướng dẫn chi tiết về plugin của Kong, bạn có thể tham khảo tài liệu chính thức: <https://docs.konghq.com/gateway/latest/kong-plugins/>, viết rất đầy đủ.

- Địa chỉ GitHub: <https://github.com/Kong/kong>
- Trang chủ: <https://konghq.com/kong>

### APISIX

APISIX là một hệ thống gateway hiệu năng cao, chuẩn cloud-native và dễ mở rộng, dựa trên OpenResty và etcd.

> etcd là một hệ thống lưu trữ Key-Value phân tán mã nguồn mở có độ sẵn sàng cao viết bằng ngôn ngữ Go, sử dụng giao thức đồng thuận Raft.

So với các API Gateway truyền thống, APISIX nổi bật với khả năng định tuyến động và nạp nóng (hot-reload) plugin, đặc biệt phù hợp cho việc quản lý API trong hệ thống Microservices. Bên cạnh đó, APISIX kết nối rất thuận tiện với các công cụ thuộc hệ sinh thái DevOps như SkyWalking (truy vết phân tán), Zipkin (truy vết phân tán), Prometheus (hệ thống giám sát).

![Sơ đồ kiến trúc APISIX](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/apisix-architecture-a09329cb.png)

Là dự án thay thế cho Nginx và Kong, APISIX đã trở thành dự án cấp cao nhất (Top-Level Project) của Apache vào ngày 15/07/2020. Hiện nay nhiều doanh nghiệp lớn tại Trung Quốc (như Kingsoft, Youzan, iQIYI, Tencent, Beike) đang sử dụng APISIX để xử lý lưu lượng nghiệp vụ cốt lõi.

APISIX tạo ra sức cạnh tranh rất mạnh trước Kong ở tính động của định tuyến, cập nhật cấu hình nóng qua etcd, hệ sinh thái plugin và bảng điều khiển. Tuy nhiên, việc so sánh hiệu năng giữa các API Gateway phụ thuộc rất lớn vào phiên bản, topo triển khai, số lượng route, độ dài chuỗi plugin, kích thước body request, bật/tắt TLS và cách tái sử dụng kết nối; bạn nên tự benchmark theo kịch bản thực tế của mình thay vì bê nguyên số liệu tiếp thị của bất kỳ bên nào.

APISIX cũng hỗ trợ phát triển plugin tùy biến. Ngoài việc viết plugin bằng ngôn ngữ Lua, lập trình viên có thể tránh đường cong học tập của Lua thông qua hai cách sau:

- Dùng **Plugin Runner** để hỗ trợ nhiều ngôn ngữ lập trình phổ biến hơn (như Java, Python, Go, v.v.). Nhờ cách này, kỹ sư backend có thể giao tiếp qua RPC cục bộ và viết plugin APISIX bằng ngôn ngữ quen thuộc. Ưu điểm là giảm chi phí phát triển và tăng hiệu suất làm việc, nhưng sẽ đánh đổi một chút suy hao hiệu năng.
- Dùng **Wasm (WebAssembly)** để phát triển plugin. Wasm được nhúng sẵn vào APISIX, cho phép người dùng biên dịch code sang bytecode Wasm để chạy bên trong APISIX.

> Wasm là định dạng lệnh nhị phân cho máy ảo dựa trên stack — một dạng ngôn ngữ cấp thấp được thiết kế tiệm cận mã máy đã biên dịch và đạt hiệu năng gần ngang mức native. Ban đầu Wasm được xây dựng cho trình duyệt, nhưng khi công nghệ trưởng thành đã xuất hiện ngày càng nhiều trường hợp ứng dụng phía server.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/up-a240d3b113cde647f5850f4c7cc55d4ff5c-a3815934.png)

- Địa chỉ GitHub: <https://github.com/apache/apisix>
- Trang chủ: <https://apisix.apache.org/zh/>

### ShenYu

ShenYu là một gateway reactive hiệu năng cao, dễ mở rộng dựa trên WebFlux và là dự án mã nguồn mở cấp cao nhất của Apache.

![Kiến trúc ShenYu](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/shenyu-architecture-0d715a80.png)

ShenYu mở rộng tính năng thông qua các plugin — plugin chính là linh hồn của ShenYu, có thể mở rộng và tháo lắp nóng (hot-pluggable), mỗi plugin thực hiện một chức năng khác nhau. ShenYu tích hợp sẵn nhiều plugin như giới hạn lưu lượng, ngắt mạch, chuyển tiếp, rewrite, redirect và giám sát định tuyến.

- Địa chỉ GitHub: <https://github.com/apache/shenyu>
- Trang chủ: <https://shenyu.apache.org/>

### Bảng so sánh tổng quan các Gateway

| Đặc điểm             | Zuul 1.x                                         | Zuul 2.x                 | Spring Cloud Gateway                                           | Kong                              | APISIX                 | ShenYu                        |
| -------------------- | ------------------------------------------------ | ------------------------ | -------------------------------------------------------------- | --------------------------------- | ---------------------- | ----------------------------- |
| **Mô hình I/O**      | Đồng bộ có chặn                                  | Bất đồng bộ không chặn   | Bất đồng bộ không chặn                                         | Bất đồng bộ không chặn            | Bất đồng bộ không chặn | Bất đồng bộ không chặn        |
| **Công nghệ lõi**    | Servlet                                          | Netty                    | WebFlux/Server MVC + Netty/Servlet container                   | OpenResty (Nginx + Lua)           | OpenResty + etcd       | WebFlux + Netty               |
| **Hiệu năng**        | Thấp                                             | Cao                      | Cao                                                            | Rất cao                           | Rất cao                | Cao                           |
| **Cấu hình động**    | Mặc định cần restart; mở rộng được               | Hỗ trợ, cần tự xây       | Hỗ trợ                                                         | Hỗ trợ                            | Hỗ trợ (cập nhật nóng) | Hỗ trợ                        |
| **Lưu trữ cấu hình** | Cấu hình cục bộ / bộ nhớ                         | Tùy chỉnh                | Mặc định YAML/bộ nhớ; nối được Redis hoặc repo route tùy chỉnh | PostgreSQL / YAML / K8s CRD       | etcd (phân tán)        | Bộ nhớ / DB / Registry        |
| **Rate Limit & Circuit Break** | Rate limit qua mở rộng; ngắt mạch qua Hystrix | Cần tích hợp        | Tích hợp sẵn `RequestRateLimiter`; ngắt mạch qua CircuitBreaker | Plugin                           | Plugin                 | Plugin                        |
| **Hệ sinh thái**     | Netflix (chế độ bảo trì)                         | Netflix                  | Spring Cloud                                                   | Kong / hệ sinh thái plugin        | Apache                 | Apache                        |
| **Độ phức tạp vận hành** | Thấp                                         | Trung bình               | Thấp đến trung bình                                            | Trung bình (DB-less) / Cao (DB Mode) | Trung bình          | Trung bình                    |
| **Đường cong học tập** | Thoải                                          | Thoải                    | Thoải đến trung bình                                           | Dốc (Lua)                         | Dốc (Lua)              | Thoải (Java)                  |
| **Kịch bản phù hợp** | Bảo trì hệ thống cũ                              | Hệ thống Netflix sẵn có  | Hệ sinh thái Spring Cloud                                      | Cloud-native, đa ngôn ngữ         | Cloud-native, hiệu năng cao | Hệ sinh thái Java        |

Mục "Hiệu năng" trong bảng trên chỉ mang tính phân cấp kinh nghiệm, không thể thay thế cho kiểm thử hiệu năng thực tế (Benchmark). Hiệu năng thực tế còn chịu ảnh hưởng bởi số lượng route, độ dài chuỗi plugin, kích thước request body, bật/tắt TLS, tỷ lệ tái sử dụng kết nối, tỷ lệ lấy mẫu log, độ trễ dịch vụ hạ nguồn và nhiều yếu tố khác. Trước khi chốt lựa chọn, nên dùng các công cụ như `wrk2`, `vegeta`, `k6` để đo lại dưới đúng chân dung lưu lượng của hệ thống, tập trung theo dõi độ trễ P99/P999, tỷ lệ lỗi, mức chiếm dụng CPU/bộ nhớ thay vì chỉ nhìn vào mỗi con số QPS.

## Lựa chọn như thế nào?

Việc chọn API Gateway cần cân nhắc tổng thể giữa bộ công nghệ (Tech Stack), yêu cầu hiệu năng, năng lực đội ngũ và chi phí vận hành.

### Kiến trúc Gateway hai tầng (Dual-Layer Gateway)

Trong các hệ thống Microservices quy mô vừa và lớn, cách làm phổ biến là tách gateway thành hai tầng:

- **Traffic Gateway (Gateway lưu lượng)**: Thường triển khai ở tầng biên (edge), có thể chọn Kong, APISIX, Nginx/OpenResty, Envoy Gateway, v.v., đảm nhiệm các năng lực thiên về hạ tầng như kết thúc SSL (SSL termination), WAF, giới hạn lưu lượng toàn cục, danh sách trắng/đen IP, chống DDoS, chuyển đổi giao thức.
- **Business Gateway (Gateway nghiệp vụ)**: Thường triển khai trong mạng nội bộ, có thể chọn Spring Cloud Gateway, ShenYu hoặc gateway tự phát triển, đảm nhiệm các năng lực sát nghiệp vụ hơn như định tuyến Microservice, xác thực phân quyền chi tiết, kiểm tra tham số, định tuyến canary, quan sát (observability) phía nghiệp vụ.

Nếu quy mô hệ thống còn nhỏ, miền nghiệp vụ đơn nhất và nhân lực đội ngũ có hạn, gateway một tầng thường gọn nhẹ và dễ vận hành hơn; khi trách nhiệm quản trị lưu lượng bên ngoài và định tuyến nghiệp vụ bên trong bắt đầu xung đột lẫn nhau thì tách thành hai tầng sẽ vững chắc hơn. Nếu đội ngũ đã áp dụng toàn diện Service Mesh, cũng có thể cân nhắc dùng trực tiếp Envoy/Istio Ingress làm cổng lưu lượng hướng Bắc-Nam (north-south) để tránh xếp chồng quá nhiều lớp proxy.

| Kịch bản                       | Phương án khuyến nghị                                                       | Lý do                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Hệ sinh thái Spring Cloud**  | Spring Cloud Gateway                                                        | Tích hợp liền mạch với Spring Boot/Spring Cloud, cấu hình đơn giản                                     |
| **Hiệu năng cao / Cloud-Native** | APISIX                                                                    | Cập nhật nóng dựa trên etcd, hiệu năng xuất sắc, kiến trúc cloud-native                                |
| **Hệ sinh thái đa ngôn ngữ**   | Kong                                                                        | Plugin phong phú, hỗ trợ phát triển plugin đa ngôn ngữ, cộng đồng chín muồi                            |
| **Hệ thống Netflix sẵn có**    | Giữ nguyên hiện trạng và lên kế hoạch chuyển đổi                            | Zuul 1.x, Ribbon, Hystrix đã vào chế độ bảo trì, dự án mới không nên tiếp tục mở rộng trên nền tảng này |
| **Kiến trúc hai tầng**         | Kong/APISIX/Envoy (Traffic Gateway) + Spring Cloud Gateway (Business Gateway) | Traffic Gateway lo SSL, WAF, giới hạn lưu lượng toàn cục; Business Gateway lo phân quyền service, kiểm tra tham số, định tuyến canary |

## Tài liệu tham khảo

- Tài liệu chính thức Spring Cloud Gateway: <https://docs.spring.io/spring-cloud-gateway/reference/>
- Thông báo chế độ bảo trì của Spring Cloud Netflix: <https://cloud.spring.io/spring-cloud-netflix/multi/multi__modules_in_maintenance_mode.html>
- Kong Gateway 3.4 Breaking Changes: <https://docs.konghq.com/gateway/latest/breaking-changes/34x/>
- ASF công bố Apache APISIX trở thành Top-Level Project: <https://news.apache.org/foundation/entry/the-apache-software-foundation-announces66>
- RFC 9113 HTTP/2: <https://www.ietf.org/rfc/rfc9113.html>
- Hướng dẫn phát triển plugin Kong [Dễ hiểu] (tiếng Trung): <https://cloud.tencent.com/developer/article/2104299>
- Thực chiến API Gateway Kong (tiếng Trung): <https://xie.infoq.cn/article/10e4dab2de0bdb6f2c3c93da6>
- Giới thiệu nguyên lý và ứng dụng Spring Cloud Gateway (tiếng Trung): <https://blog.fintopia.tech/60e27b0e2078082a378ec5ed/>
- Vì sao Microservices cần đến API Gateway? (tiếng Trung): <https://apisix.apache.org/zh/blog/2023/03/08/why-do-microservices-need-an-api-gateway/>
