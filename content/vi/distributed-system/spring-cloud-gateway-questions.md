---
title: "Tổng hợp câu hỏi phỏng vấn Spring Cloud Gateway: Routing, Predicate, Filter, Rate Limiting, Circuit Breaking và Nguyên lý hoạt động"
category: Hệ thống Phân tán
description: "Tổng hợp các câu hỏi phỏng vấn Spring Cloud Gateway thường gặp, bao gồm khái niệm cốt lõi, khớp route, Predicate, GatewayFilter, GlobalFilter, giới hạn lưu lượng (Rate Limiting) và ngắt mạch (Circuit Breaking), cân bằng tải, xử lý CORS và các vấn đề phổ biến trên production."
tag:
  - API Gateway
  - Spring Cloud
head:
  - - meta
    - name: keywords
      content: Spring Cloud Gateway,Câu hỏi phỏng vấn Spring Cloud Gateway,API Gateway,Predicate,GatewayFilter,GlobalFilter,Rate Limiting Gateway,Circuit Breaking Gateway,Microservices Gateway
lang: vi
sourceRef: zh-ref/distributed-system/spring-cloud-gateway-questions.md
---

> Bài viết này được tái cấu trúc và hoàn thiện từ bài viết [6.000 chữ | 16 hình ảnh | Hiểu sâu nguyên lý Spring Cloud Gateway - Ngộ Không Bàn Kiến Trúc (tiếng Trung)](https://mp.weixin.qq.com/s/XjFYsP1IUqNzWqXZdJn-Aw).

Bài viết này chỉ tập trung phân tích các điểm phỏng vấn tần suất cao của Spring Cloud Gateway. Nếu bạn chưa rõ vì sao cần API Gateway, mối quan hệ giữa gateway và RPC, hay cách lựa chọn giữa Zuul / Gateway / Kong / APISIX, nên đọc trước [Giải thích chi tiết API Gateway](./api-gateway.md).

## Spring Cloud Gateway là gì?

Spring Cloud Gateway là gateway thuộc hệ sinh thái Spring Cloud, ra đời với mục tiêu chính là thay thế **Zuul 1.x**. Zuul 1.x dựa trên kiến trúc Servlet I/O có chặn (blocking I/O) nên hiệu năng bị giới hạn trong kịch bản đồng thời cao. Còn Zuul 2.x dù đã áp dụng kiến trúc Netty không chặn nhưng phía Spring Cloud chính thức chưa từng tích hợp chính thức Zuul 2.x; bản thân Spring Cloud Gateway cũng khởi đầu sớm hơn Zuul 2.x.

Để nâng cao hiệu năng cho gateway, Spring Cloud Gateway được xây dựng trên Spring WebFlux. Spring WebFlux sử dụng thư viện Reactor để cài đặt mô hình Reactive Programming, với tầng dưới dựa trên Netty thực hiện I/O đồng bộ không chặn.

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/springcloud-gateway--demo-dd42f8cc.png)

Spring Cloud Gateway không chỉ cung cấp cơ chế định tuyến thống nhất, mà thông qua chuỗi Filter còn cung cấp các tính năng cơ bản của gateway như bảo mật, giám sát/chỉ số (metrics), giới hạn lưu lượng (Rate Limiting).

Spring Cloud Gateway và Zuul 2.x không khác biệt quá lớn khi cả hai đều xử lý request thông qua Filter. Tuy nhiên hiện nay Spring Cloud Gateway được khuyến nghị sử dụng hơn hẳn Zuul vì được hệ sinh thái Spring Cloud hỗ trợ thân thiện và đồng bộ hơn.

- Địa chỉ GitHub: <https://github.com/spring-cloud/spring-cloud-gateway>
- Trang chủ: <https://spring.io/projects/spring-cloud-gateway>

## Quy trình hoạt động của Spring Cloud Gateway như thế nào?

Quy trình hoạt động của Spring Cloud Gateway được minh họa như hình dưới đây:

![Quy trình hoạt động của Spring Cloud Gateway](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-workflow-ebcb7ec4.png)

Đây là hình trích từ blog chính thức của Spring, đường dẫn gốc: <https://spring.io/blog/2022/08/26/creating-a-custom-spring-cloud-gateway-filter>.

Phân tích chi tiết từng bước:

1. **Đánh giá định tuyến**: Sau khi request từ client tới gateway, trước tiên nó đi qua `Gateway Handler Mapping`; tại đây hệ thống kiểm tra Predicate để xem khớp với quy tắc định tuyến nào — quy tắc đó ánh xạ tới một dịch vụ cụ thể ở backend.
2. **Lọc request**: Tiếp theo request đi vào `Gateway Web Handler`; bên trong có rất nhiều bộ lọc tạo thành chuỗi bộ lọc (Filter Chain). Các bộ lọc này có thể chặn và chỉnh sửa request, chẳng hạn thêm request header, kiểm tra tham số, giống như quá trình lọc sạch nước thải, rồi mới chuyển tiếp request tới dịch vụ backend thực tế. Về mặt logic, các bộ lọc này gọi là Pre-Filter ("Pre" nghĩa là "trước khi...").
3. **Xử lý dịch vụ**: Dịch vụ backend xử lý request.
4. **Lọc response**: Sau khi backend xử lý xong, kết quả trả về lại đi qua các bộ lọc của Gateway để xử lý lần nữa. Về mặt logic, nhóm này gọi là Post-Filter ("Post" nghĩa là "sau khi...").
5. **Trả về response**: Response sau khi qua bộ lọc được gửi trả lại cho client.

Tóm lại: Request từ client trước hết đối chiếu quy tắc để tìm ra Route phù hợp và ánh xạ tới dịch vụ cụ thể. Sau đó request đi qua Filter rồi chuyển tiếp tới dịch vụ đích; khi dịch vụ xử lý xong, phản hồi lại đi qua Filter lần nữa trước khi trả về cho client.

## Predicate trong Spring Cloud Gateway là gì?

Từ "Predicate" (vị từ / điều kiện khẳng định) nghe hơi trừu tượng, nhưng có thể hiểu đơn giản là một phép kiểm tra điều kiện trên request: kết quả đúng (true) thì khớp Route hiện tại, sai (false) thì tiếp tục dò sang các Route khác.

Trong Gateway, nếu request do client gửi lên thỏa mãn điều kiện của Predicate thì sẽ ánh xạ tới router chỉ định để chuyển tiếp sang đúng dịch vụ xử lý.

Ví dụ cấu hình Predicate như hình dưới: cấu hình gồm hai quy tắc định tuyến, trong đó có khai báo `predicates`; khi URL request chứa `api/thirdparty` thì sẽ khớp vào Route đầu tiên là `route_thirdparty`.

![Ví dụ cấu hình Predicate](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-predicate-example-efe81894.png)

Các quy tắc Route Predicate phổ biến được minh họa như hình sau:

![Các quy tắc Route Predicate trong Spring Cloud Gateway](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-predicate-rules-bfea778e.webp)

## Mối quan hệ giữa Route và Predicate trong Spring Cloud Gateway là gì?

Mối quan hệ tương ứng giữa Route và Predicate như hình dưới đây:

![Mối quan hệ tương ứng giữa Route và Predicate](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-predicate-route-f0e47f1d.png)

- **Một-nhiều (One-to-Many)**: Một quy tắc Route có thể chứa nhiều Predicate. Như hình trên, `Route1` cấu hình tới ba Predicate.
- **Thỏa mãn đồng thời (AND logic)**: Nếu một quy tắc Route có nhiều Predicate, request bắt buộc phải thỏa mãn tất cả cùng lúc mới được tính là khớp. Như `Route2` ở hình trên cấu hình hai Predicate, request của client phải thỏa mãn cả hai mới khớp được `Route2`.
- **Khớp đầu tiên thắng (First Match)**: Nếu một request có thể khớp với nhiều Route, hệ thống sẽ ánh xạ vào Route khớp đầu tiên. Như hình trên, request thỏa mãn Predicate của cả `Route3` và `Route4`, nhưng vì cấu hình của `Route3` đứng trước trong file cấu hình nên chỉ khớp `Route3`.

## Spring Cloud Gateway triển khai định tuyến động (Dynamic Routing) như thế nào?

Khi dùng Spring Cloud Gateway, các giải pháp trong tài liệu chính thức thường dựa trên file cấu hình tĩnh hoặc cấu hình bằng code.

Vì Spring Cloud Gateway đóng vai trò cổng vào của hệ thống Microservices nên cần hạn chế tối đa việc khởi động lại; việc đổi cấu hình mà phải restart dịch vụ không thể đáp ứng nhu cầu làm mới động và thay đổi theo thời gian thực trên production. Do đó ta cần cấu hình động cho gateway ngay trong lúc chạy (runtime).

Có nhiều cách triển khai định tuyến động, trong đó một cách được khuyến nghị là dựa vào Service Registry như Nacos. Spring Cloud Gateway có thể lấy metadata của dịch vụ từ Registry (ví dụ tên dịch vụ, đường dẫn, v.v.), rồi tự động sinh quy tắc định tuyến từ các thông tin đó. Nhờ vậy, khi thêm, xóa hoặc cập nhật instance dịch vụ, gateway tự động nhận biết và điều chỉnh quy tắc định tuyến tương ứng mà không cần sửa cấu hình Route thủ công.

Thực tế ta không cần tự cài đặt thủ công toàn bộ các bước phức tạp này — chỉ cần kết hợp Nacos Server và Spring Cloud Alibaba Nacos Config là đã có thể cập nhật cấu hình động; tài liệu chính thức: <https://github.com/alibaba/spring-cloud-alibaba/wiki/Nacos-config>.

## Spring Cloud Gateway có những loại Filter nào?

Nếu phân loại theo pha request và response, Filter được chia làm hai loại:

- **Loại Pre**: Chặn và chỉnh sửa request trước khi chuyển tiếp tới Microservice — ví dụ kiểm tra tham số, kiểm tra phân quyền, giám sát lưu lượng, ghi log và chuyển đổi giao thức.
- **Loại Post**: Sau khi Microservice xử lý xong request và trả response về gateway, gateway tiếp tục xử lý response — ví dụ sửa nội dung response hoặc response header, ghi log, giám sát lưu lượng.

Một cách phân loại khác là dựa theo phạm vi tác động của Filter:

- **GatewayFilter**: Bộ lọc cục bộ, áp dụng trên một Route đơn lẻ hoặc một nhóm Route. Các mục tô đỏ biểu thị những bộ lọc hay dùng.
- **GlobalFilter**: Bộ lọc toàn cục, áp dụng trên tất cả các Route.

### Bộ lọc cục bộ (GatewayFilter)

Các bộ lọc cục bộ phổ biến như hình dưới:

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-gatewayfilters-8260032d.png)

Cách dùng cụ thể ra sao? Dưới đây là một ví dụ: nếu khớp URL thành công thì loại bỏ `"api"` khỏi đường dẫn URL.

```yaml
filters: # Bộ lọc
  - RewritePath=/api/(?<segment>.*),/$\{segment} # Thay thế "api" trong đường dẫn chuyển tiếp thành chuỗi rỗng
```

Tất nhiên chúng ta cũng có thể tự viết Filter tùy biến; phần này bài viết không đi sâu.

### Bộ lọc toàn cục (GlobalFilter)

Các bộ lọc toàn cục phổ biến như hình dưới:

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-globalfilters-4f00588f.png)

Cách dùng phổ biến nhất của GlobalFilter là thực hiện cân bằng tải (Load Balancing), cấu hình như sau:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: route_member # Quy tắc định tuyến Microservice thành viên / bên thứ ba
          uri: lb://passjava-member # Cân bằng tải, chuyển tiếp request tới dịch vụ passjava-member đã đăng ký trên Registry
          predicates: # Predicate
            - Path=/api/member/** # Nếu đường dẫn request từ frontend chứa api/member thì áp dụng quy tắc định tuyến này
          filters: # Bộ lọc
            - RewritePath=/api/(?<segment>.*),/$\{segment} # Thay thế api trong đường dẫn chuyển tiếp thành chuỗi rỗng
```

Ở đây có từ khóa `lb`, sử dụng GlobalFilter `LoadBalancerClientFilter`. Khi khớp tới Route này, request sẽ được chuyển tiếp tới dịch vụ `passjava-member` kèm cân bằng tải — tức hệ thống sẽ phân giải `passjava-member` thành host và port thực tế của Microservice trước, rồi mới chuyển tiếp request tới instance thực tế đó.

## Spring Cloud Gateway có hỗ trợ giới hạn lưu lượng (Rate Limiting) không?

Spring Cloud Gateway tích hợp sẵn bộ lọc giới hạn lưu lượng với interface tương ứng là `RateLimiter`. Interface `RateLimiter` chỉ có một lớp cài đặt duy nhất là `RedisRateLimiter` (cài đặt Rate Limiting dựa trên Redis + Lua), nhưng tính năng cung cấp khá đơn giản và chưa thực sự thuận tiện khi dùng.

Từ phiên bản Sentinel 1.6.0 trở đi, Sentinel đã bổ sung module thích ứng cho Spring Cloud Gateway, cho phép giới hạn lưu lượng theo hai chiều tài nguyên: chiều Route và chiều API tùy biến. Nói cách khác, Spring Cloud Gateway có thể kết hợp với Sentinel để kiểm soát lưu lượng ở gateway mạnh mẽ hơn nhiều.

## Làm thế nào để tùy biến xử lý ngoại lệ toàn cục trong Spring Cloud Gateway?

Trong dự án Spring Boot thông thường, để bắt ngoại lệ toàn cục ta chỉ cần cấu hình `@RestControllerAdvice` và `@ExceptionHandler` là đủ. Tuy nhiên, cách này không áp dụng được trong Spring Cloud Gateway.

Spring Cloud Gateway cung cấp nhiều cách xử lý ngoại lệ toàn cục, trong đó một cách khá phổ biến là cài đặt `ErrorWebExceptionHandler` và ghi đè (`Override`) phương thức `handle` của nó.

```java
@Order(-1)
@Component
@RequiredArgsConstructor
public class GlobalErrorWebExceptionHandler implements ErrorWebExceptionHandler {
    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
    // ...
    }
}
```

## Tài liệu tham khảo

- Tài liệu chính thức Spring Cloud Gateway: <https://cloud.spring.io/spring-cloud-gateway/reference/html/>
- Creating a custom Spring Cloud Gateway Filter: <https://spring.io/blog/2022/08/26/creating-a-custom-spring-cloud-gateway-filter>
- Xử lý ngoại lệ toàn cục (tiếng Trung): <https://zhuanlan.zhihu.com/p/347028665>
