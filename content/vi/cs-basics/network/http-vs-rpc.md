---
title: Đã có giao thức HTTP, tại sao vẫn cần RPC? So sánh sự khác biệt giữa HTTP và RPC
category: Kiến thức máy tính cơ bản
description: So sánh sâu sắc bản chất khác biệt giữa HTTP và RPC, phân tích bài toán lựa chọn công nghệ giao tiếp trong vi dịch vụ. Bao quát hiệu năng tuần tự hóa, tái sử dụng kết nối, gRPC, RESTful, quản trị dịch vụ và các kiến thức cốt lõi.
head:
  - - meta
    - name: keywords
      content: HTTP,RPC,khác biệt HTTP vs RPC,giao tiếp microservices,giao thức RPC,giao tiếp TCP,giao thức tuần tự hóa,RESTful,gRPC,Dubbo,Protobuf,gọi dịch vụ,gọi hàm từ xa,giao thức HTTP,chọn giải pháp microservices
lang: vi
sourceRef: zh-ref/cs-basics/network/http-vs-rpc.md
---

Xin chào, mình là Xiao G. Vào học kỳ hai năm hai đại học, khi xem các khóa học miễn phí của Heima, lần đầu tiên mình tiếp xúc với RPC và lúc đó thực sự khá hoang mang.

Chẳng phải các API HTTP đã gọi được rồi sao?

Frontend gọi backend bằng HTTP, server gọi server cũng có thể dùng HTTP. Viết một endpoint `/user/getById`, truyền vào user ID, trả về thông tin người dùng, như thế chẳng phải cũng hoàn thành được một lượt gọi từ xa (remote call) rồi à?

Thế thì tại sao lại phải đẻ thêm một khái niệm RPC để tăng thêm chi phí học tập làm gì? Chẳng phải là vẽ chuyện sao!

Điều càng khiến người ta bối rối hơn là rất nhiều bài viết thích đặt HTTP và RPC lên bàn cân so sánh, như thể chúng là hai giao thức nằm cùng một tầng. Đọc xong xuôi, có thể bạn chỉ đọng lại được vài câu: **HTTP hướng tài nguyên, RPC hướng phương thức; HTTP hướng ngoại, RPC hướng nội; RPC hiệu năng cao hơn.**

Những câu này không hoàn toàn sai, nhưng quá đỗi sơ sài.

Khi bước vào dự án thực tế, bạn vẫn sẽ gặp phải những băn khoăn: **Dùng HTTP có được không? Dùng RPC liệu có phải thiết kế quá mức (over-engineering)? gRPC rõ ràng dựa trên HTTP/2, tại sao lại bảo nó là RPC?**

Bài viết này sẽ xoay quanh những vấn đề đó để làm sáng tỏ tất cả.

## RPC không phải là một giao thức cụ thể nào cả

Đây là một hiểu lầm rất phổ biến, trước khi bắt đầu nội dung tiếp theo, nhất định phải làm rõ điểm này trước.

**HTTP là một giao thức. Còn RPC không phải là một giao thức cụ thể, nó giống một mô hình gọi hàm (invocation model) hơn.**

RPC viết tắt của Remote Procedure Call, dịch ra là "gọi thủ tục từ xa". Vấn đề mà nó muốn giải quyết vô cùng mộc mạc: **giúp bạn khi gọi một dịch vụ từ xa cảm thấy tiện lợi hệt như đang gọi một hàm cục bộ (local method).**

![RPC ẩn đi chi tiết gọi từ xa thông qua local proxy](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-overview-088d1554.png)

Ví dụ trong mã nguồn cục bộ gọi user service:

```java
User user = userService.getUser(1001);
```

Nếu `userService` nằm ngay trong process hiện tại, đây chỉ là một lời gọi hàm thông thường.

Nhưng nếu user service lại được deploy trên một máy chủ khác, câu chuyện sẽ trở nên phức tạp. Bạn phải gửi network request, phải truyền tên hàm và tham số, phải tuần tự hóa (`serialize`) dữ liệu, phải xử lý timeout, thất bại, retry, rồi nhận kết quả trả về và giải tuần tự hóa (`deserialize`).

Điều mà một RPC framework muốn làm là đóng gói tất cả những phiền toái đó lại. Mã nguồn phía caller trông vẫn gọn gàng như cũ:

```java
User user = userService.getUser(1001);
```

Nhưng bên dưới lớp vỏ bọc đó, việc giao tiếp mạng, tuần tự hóa, định tuyến dịch vụ và nhận kết quả trả về đều đã được âm thầm hoàn tất.

Vì vậy, cách diễn đạt chuẩn xác hơn không phải là "HTTP và RPC ai mạnh hơn", mà là:

**HTTP là một giao thức tầng ứng dụng, còn RPC là một mô hình gọi từ xa.**

![HTTP: Tổng quan về Giao thức truyền tải siêu văn bản](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

Đi vào triển khai thực tế, RPC có rất nhiều loại framework khác nhau. Dubbo là một RPC framework, Thrift là một RPC framework, gRPC cũng là một RPC framework. Tài liệu chính thức của gRPC cũng nói rất trực diện: ứng dụng client có thể gọi trực tiếp phương thức của ứng dụng server trên một máy khác như thể gọi một đối tượng cục bộ; server định nghĩa các phương thức có thể gọi từ xa cùng với tham số và kiểu dữ liệu trả về.

![Dubbo3 sử dụng giao thức Triple hỗ trợ đồng thời HTTP/1, HTTP/2 và HTTP/3](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716111545343-d4b8a0b2.png)

Điều này giải thích cho một điểm rất hay làm người ta lú lẫn: **gRPC là RPC, nhưng nó lại chạy trên nền tảng HTTP/2.**

Nó không hề đối lập với HTTP, mà chỉ là cung cấp khả năng gọi RPC dựa trên tầng truyền tải HTTP/2.

Trên GitHub của gRPC có riêng một bài viết [gRPC over HTTP2 — Giao thức gRPC dựa trên HTTP2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md) giải thích cặn kẽ:

![Tài liệu giao thức gRPC over HTTP2 trên GitHub](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/grpc-over-http2-github-d0037df6.png)

## Chỉ có TCP thôi là chưa đủ

Để hiểu được sự khác biệt giữa HTTP và RPC, tốt nhất là nhìn xuống sâu hơn một tầng mạng.

Nhiều bạn biết rằng HTTP chạy trên TCP, và RPC cũng thường chạy trên TCP, nên sẽ nảy ra suy nghĩ: Thế tôi dùng trực tiếp TCP luôn chẳng phải xong rồi sao?

Về mặt lý thuyết thì được, nhưng thực tế triển khai thì cực kỳ nhiêu khê.

TCP chịu trách nhiệm truyền dữ liệu tin cậy, thứ nó truyền là một luồng byte liên tục (byte stream). Nó hoàn toàn không quan tâm message nghiệp vụ của bạn bắt đầu từ đâu và kết thúc ở chỗ nào.

Chẳng hạn client gửi liên tiếp hai request:

```text
getUser:1001
getOrder:8888
```

Phía server nhận được có thể không phải là hai đoạn message vuông vắn tách bạch, mà là một chuỗi byte dính liền. Bạn phải tự mình phân tích: message thứ nhất kết thúc ở đâu, message thứ hai bắt đầu từ đâu. Bạn còn phải xử lý các vấn đề như nửa gói (packet fragmentation), dính gói (sticky packet), mã hóa (encoding), timeout, mã lỗi, request ID...

![Ranh giới thông điệp giữa TCP và UDP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-udp-message-boundary-ff2c1ad3.png)

Đó là lý do tại sao các giao thức tầng ứng dụng bắt buộc phải định nghĩa định dạng thông điệp (message format).

HTTP định nghĩa một bộ định dạng dùng chung tiêu chuẩn: Request Line, Header, Body, Status Code... Định nghĩa của MDN về HTTP cũng rất rõ ràng: nó là một giao thức tầng ứng dụng, ban đầu dùng để giao tiếp giữa trình duyệt và máy chủ Web, nhưng cũng có thể dùng cho giao tiếp giữa máy với máy (machine-to-machine) và truy cập API.

Một RPC framework cũng sẽ tự định nghĩa định dạng message của riêng mình. Chỉ có điều nó thường không thiết kế xoay quanh URL hay tài nguyên, mà thiết kế xoay quanh Service, Method, Parameter và Return Value.

Nói trắng ra, cả HTTP lẫn RPC đều đang cùng giải quyết một bài toán duy nhất:

**Hai process cách nhau qua đường truyền mạng, làm thế nào để diễn đạt rõ ràng một lượt gọi nghiệp vụ.**

Chỉ là cách tiếp cận mô hình hóa (modeling) của chúng không giống nhau.

## HTTP giống như truy cập tài nguyên, còn RPC giống như gọi phương thức

Cách viết phổ biến của HTTP / REST là như thế này:

```http
GET /users/1001
POST /orders
PUT /orders/888/status
DELETE /comments/9527
```

Mô hình tư duy của nó là **tài nguyên (resource)**.

`/users/1001` là một tài nguyên người dùng, `GET` biểu thị đọc nó; `POST /orders` biểu thị tạo đơn hàng; `PUT /orders/888/status` biểu thị cập nhật trạng thái đơn hàng.

Cách thức này cực kỳ phù hợp để mở API ra bên ngoài (external API).

Bởi vì nó mang tính phổ quát, dễ hiểu, dễ debug. Trình duyệt truy cập được, Postman gọi được, curl kiểm tra được, và API gateway cũng rất dễ xử lý. Khi bạn cung cấp API cho bên thứ ba, yêu cầu đối tác tích hợp theo tài liệu HTTP thì rào cản kỹ thuật sẽ tương đối thấp.

Còn cách viết của RPC lại thiên về thế này:

```java
userService.getUser(1001);
orderService.createOrder(request);
inventoryService.deductStock(skuId, count);
```

Mô hình tư duy của nó là **lời gọi phương thức (method invocation)**.

Phía caller quan tâm nhiều hơn đến việc: Tôi muốn gọi service nào? Method nào? Truyền vào đối số gì? Nhận về đối tượng nào?

![Sơ đồ nguyên lý RPC](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-principle-b5556f7a.png)

Điều này gần gũi hơn rất nhiều với thói quen viết mã hàng ngày của các kỹ sư backend Java. Đặc biệt là khi các microservice gọi nội bộ lẫn nhau, bản thân các service vốn dĩ luôn phối hợp xoay quanh các phương thức nghiệp vụ, chẳng hạn như tạo đơn hàng, trừ kho, kiểm tra số dư, xác thực quyền hạn. RPC thể hiện mối quan hệ lời gọi này một cách trực diện nhất.

Vì thế, sự khác biệt lớn nhất giữa HTTP và RPC không nằm ở việc bên nào gọi thông được còn bên nào không gọi thông được.

Cả hai đều gọi thông suốt.

Khác biệt cốt lõi là: **Bạn mô hình hóa tương tác từ xa thành một lần truy cập tài nguyên, hay thành một lần gọi hàm.**

## Tại sao nội bộ doanh nghiệp lại chuộng RPC hơn?

HTTP đương nhiên hoàn toàn làm tốt việc gọi dịch vụ nội bộ.

Nhiều công ty sử dụng HTTP 100% cho các dịch vụ nội bộ và hệ thống vẫn vận hành rất êm ả. Nhất là khi quy mô dịch vụ chưa lớn, chuỗi gọi (call chain) chưa phức tạp, HTTP mang lại sự đơn giản tối đa.

Tuy nhiên, khi số lượng dịch vụ bắt đầu tăng vọt, các ưu thế của RPC sẽ dần dần bộc lộ rõ rệt.

**Thay đổi rõ ràng thứ nhất: Phía caller không muốn bận tâm máy chủ đối phương nằm ở xó xỉnh nào.**

Khi viết code nghiệp vụ, lý tưởng nhất là bạn chỉ cần quan tâm "tôi muốn gọi user service", chứ không cần phải để ý user service đang có bao nhiêu máy chủ, địa chỉ IP là gì, con nào vừa bị hạ (offline), con nào có trọng số (weight) cao hơn.

Điều này đòi hỏi phải có cơ chế phát hiện dịch vụ (Service Discovery).

Mô tả trong tài liệu chính thức của Dubbo về Service Discovery là ví dụ điển hình: Provider đăng ký địa chỉ lên Registry Center, Consumer đọc và đăng ký theo dõi (subscribe) danh sách địa chỉ từ Registry Center; khi địa chỉ có biến động, Registry Center sẽ thông báo cho Consumer. Dubbo hỗ trợ các registry phổ biến như Nacos, Consul, ZooKeeper...

![Các vai trò cốt lõi trong kiến trúc Dubbo](/media/jg/ext/oss.javaguide.cn/asset/dubbo/dubbo-relation-f627b8d6.jpg)

Những khả năng này tất nhiên cũng có thể xây dựng bằng HTTP. Bạn có thể tự mình ghép nối một hệ sinh thái gồm Registry Center, Gateway, Load Balancer và SDK riêng.

Nhưng các RPC framework thường tích hợp sẵn những tính năng này ngay bên trong hệ thống gọi dịch vụ của chúng.

Phía caller chỉ cần viết code với interface của service, bên dưới sẽ tự động thực hiện Service Discovery, Load Balancing, quản lý kết nối và kiểm soát timeout. Code nghiệp vụ không phải đi ghép nối URL ở khắp mọi nơi.

**Thay đổi thứ hai: Giao ước giao diện (Interface Contract) trở nên quan trọng hơn bao giờ hết.**

HTTP + JSON rất linh hoạt, nhưng linh hoạt cũng đồng nghĩa với việc dễ trở nên lỏng lẻo.

Tên trường bị đổi, kiểu dữ liệu bị sửa, enum có thêm một giá trị mới, phía caller có thể chỉ đến khi chạy ở runtime mới nổ lỗi bung bét. Nếu tài liệu API không được cập nhật kịp thời, quá trình phối hợp kiểm thử (joint debugging) sẽ là một cơn ác mộng.

Các RPC framework thường dùng ràng buộc hợp đồng (contract) mạnh hơn để quản lý hai bên. Lấy gRPC làm ví dụ, nó thường dùng Protocol Buffers làm ngôn ngữ định nghĩa giao diện (IDL) và định dạng trao đổi thông điệp. Tài liệu chính thức của Protocol Buffers cũng giải thích rằng đây là một cơ chế tuần tự hóa dữ liệu có cấu trúc độc lập với ngôn ngữ, độc lập với nền tảng, có khả năng mở rộng, cho phép định nghĩa cấu trúc qua file `.proto` và tự động sinh code cho nhiều ngôn ngữ khác nhau.

Lợi ích của việc này là mọi thay đổi giao diện đều dễ dàng bị phát hiện và cảnh báo ngay từ khâu sinh mã (code generation) và biên dịch (compile).

Tất nhiên, hợp đồng mạnh không có nghĩa là không bao giờ xảy ra sự cố.

Việc tương thích trường dữ liệu ra sao, xử lý các phiên bản client cũ thế nào, trường mới có được tùy tiện xóa không, enum có thể sửa không... tất cả vẫn đòi hỏi phải được thiết kế kỹ lưỡng. Chỉ là so với việc "miệng truyền miệng thống nhất các trường JSON", IDL mang tính cưỡng chế và cứng cáp hơn nhiều.

**Thay đổi thứ ba: Các lời gọi nội bộ tần suất cao sẽ cực kỳ để ý đến hiệu suất xử lý của máy móc.**

Điểm mạnh của HTTP + JSON là tính dễ đọc cao, con người nhìn vào rất trực quan. Nhưng khi máy tính xử lý, đây không phải là phương thức tiết kiệm nhất. Tên trường lặp lại, định dạng văn bản thô, chi phí phân tích cú pháp (parsing) đều tạo ra gánh nặng tài nguyên đáng kể.

Các RPC framework thường chuộng tuần tự hóa nhị phân (binary serialization), ví dụ như Protobuf, Thrift. Dung lượng gói tin nhỏ hơn rất nhiều, và tốc độ parse nhị phân cũng tối ưu hơn hẳn cho máy móc.

Nhưng ở đây không thể kết luận một cách phiến diện.

Câu nói "RPC chắc chắn nhanh hơn HTTP" là không chặt chẽ. HTTP/2, tái sử dụng kết nối (connection reuse), nén dữ liệu, thư viện parse JSON khác nhau, môi trường mạng khác nhau đều sẽ tác động đến kết quả benchmark. Bản thân gRPC cũng chạy trên HTTP/2, lợi thế của nó không thể quy chụp đơn giản bằng mỗi câu "nó không phải HTTP".

Cách diễn đạt thỏa đáng và vững chắc hơn là:

**Trong kịch bản các dịch vụ gọi nhau với tần suất cao, RPC framework thường tối ưu hóa các khâu như serialization, connection reuse, timeout, retry, load balancing và tracing để phục vụ sát sườn nhất cho nhu cầu gọi dịch vụ nội bộ.**

Đó mới chính là nguyên nhân khiến RPC xuất hiện phổ biến trong nội bộ các doanh nghiệp.

## Giá trị của RPC không chỉ là "gọi nhanh hơn một chút"

Nhiều người khi nói về RPC rất thích xoáy sâu vào hiệu năng.

Hiệu năng dĩ nhiên quan trọng, nhưng theo mình, giá trị lớn hơn của RPC nằm ở khả năng **quản trị dịch vụ (service governance)**.

Một lời gọi nội bộ khi thực sự đưa lên production không chỉ đơn giản là gửi request rồi nhận response. Bạn sẽ rất nhanh chóng va phải hàng loạt câu hỏi hóc búa:

- Lời gọi này nên đặt timeout là bao nhiêu? Thất bại rồi có nên retry không? Retry liệu có dẫn đến việc trừ tiền hai lần không?
- Downstream service bị sập thì upstream có cần giáng cấp (degradation) không?
- Giao diện nào gần đây có tỷ lệ lỗi tăng đột biến?
- Một request của người dùng đã đi qua bao nhiêu dịch vụ?

Nếu tất cả những câu hỏi này đều phó mặc cho code nghiệp vụ tự bơi, hệ thống sẽ nhanh chóng rơi vào hỗn loạn.

RPC framework thường gắn liền với các năng lực quản trị, chẳng hạn như kiểm soát timeout, cân bằng tải, phát hiện dịch vụ, ngắt mạch giáng cấp (circuit breaker & degradation), truy vết phân tán (tracing), thống kê tần suất gọi... Bản giới thiệu chính thức của gRPC cũng đề cập rằng nó hỗ trợ các năng lực dạng pluggable như load balancing, tracing, health check và authentication.

HTTP cũng làm được những điều này.

Nhiều công ty sử dụng API Gateway, Service Mesh, HTTP Client SDK, Interceptor và các component tracing để bù đắp. Làm tốt thì hệ thống vẫn chạy rất ổn.

Do đó, đừng hiểu RPC theo kiểu "thứ gì đó cao cấp hơn HTTP". Nó thực chất là việc gom tất cả các bài toán phổ biến trong việc gọi dịch vụ nội bộ lại và giải quyết theo con đường "lời gọi phương thức từ xa".

## Vậy HTTP không thích hợp cho việc gọi nội bộ ư?

Hoàn toàn không phải vậy đâu nhé. Nếu quy mô dịch vụ chưa lớn, nhân sự trong đội ngũ chưa đông, việc dùng HTTP ngược lại còn giúp bạn đỡ đau đầu hơn rất nhiều.

Ví dụ như một hệ thống quản trị admin nội bộ, tách ra vài service nhỏ, tần suất gọi không cao. Bạn dùng Spring Boot viết vài API RESTful, kết hợp với tài liệu OpenAPI, mã lỗi chuẩn hóa, gateway xác thực quyền hạn và log tracing, thế là đã hoàn toàn đáp ứng tốt nhu cầu.

Cố đấm ăn xôi đưa RPC vào có khi còn rước thêm gánh nặng không đáng có, chẳng đem lại giá trị gì.

Bạn sẽ phải dựng thêm Registry Center, phải bảo trì các file IDL, phải xử lý quy trình sinh mã tự động, phải đào tạo lại anh em trong team, rồi lại đau đầu tìm cách debug cục bộ và cấu hình gateway chuyển tiếp. Khi dịch vụ chỉ có vài cái, chuỗi gọi chẳng mấy phức tạp, chi phí bỏ ra như vậy chưa chắc đã xứng đáng.

HTTP cực kỳ phù hợp cho các tình huống sau:

- Mở API ra bên ngoài, chẳng hạn như Web, Mobile App, đối tác thứ ba tích hợp;
- Team coi trọng tính phổ quát và sự tiện lợi khi debug;
- Tần suất gọi dịch vụ không quá cao;
- Chưa có hạ tầng RPC bài bản;
- Đã có sẵn hệ thống HTTP Gateway, SDK, Rate Limiting, Authentication và Monitoring hoàn chỉnh.

Ở đây có một nguyên tắc đánh giá rất đơn giản muốn chia sẻ cùng mọi người:

**Nếu hệ thống của bạn dùng HTTP đã và đang chạy ổn định, cũng không gặp phải điểm nghẽn đau đầu nào về quản trị lời gọi, thì không việc gì phải đổi sang RPC chỉ để "trông có vẻ ra chất microservices hơn".**

Lựa chọn công nghệ không phải là trò chơi dán nhãn thời thượng.

Giải quyết được bài toán một cách bền bỉ và ổn định mới là điều cốt lõi.

## Tại sao gRPC lại rất dễ làm người ta bị "lú"?

gRPC thường xuyên khiến người mới bối rối là vì nó đứng chân trên cả hai khái niệm cùng một lúc.

**Một mặt, nó là một RPC framework.**

Bạn định nghĩa Service và Method, sinh mã client và server, rồi gọi dịch vụ từ xa hệt như gọi một hàm cục bộ.

**Mặt khác, nó lại truyền tải trên nền tảng HTTP/2.**

![Tài liệu giao thức gRPC over HTTP2 trên GitHub](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/grpc-over-http2-github-d0037df6.png)

Vì vậy bạn không thể hiểu một cách thô thiển rằng nó là "kẻ đối đầu của HTTP".

Chính xác hơn: **gRPC dùng HTTP/2 làm tầng truyền tải, mặc định dùng Protobuf làm IDL và định dạng tuần tự hóa thông điệp, sau đó dùng mô hình RPC để tổ chức các lời gọi.**

Cần lưu ý ở đây, Protobuf là sự kết hợp mặc định phổ biến nhất của gRPC, nhưng bản thân nó không đại diện cho toàn bộ định nghĩa về gRPC. Tầng giao thức của gRPC cho phép dùng `application/grpc+proto`, `application/grpc+json` hoặc kiểu mã hóa tùy biến.

Còn một điểm rất hay bị bỏ quên: trong một response gRPC bình thường, tầng HTTP thường trả về `:status: 200`, còn kết quả thực thi nghiệp vụ thực sự lại nằm ở trường `grpc-status` và `grpc-message` bên trong HTTP/2 Trailers.

Điều này tạo ra một sự khác biệt rất lớn khi điều tra sự cố trong thực tế.

Khi soi một API HTTP, chúng ta có thói quen nhìn HTTP status code trước. `200` cơ bản là request thành công, `404` là tài nguyên không tồn tại, `500` là server ném exception.

Nhưng khi soi gRPC, không thể chỉ nhìn chăm chăm vào HTTP status code. HTTP trả về 200 không hề đồng nghĩa với việc lượt gọi nghiệp vụ RPC này thành công, bạn bắt buộc phải kiểm tra tiếp `grpc-status`.

Điều này cũng kéo theo một vấn đề kỹ thuật hạ tầng: Gateway, Load Balancer, Proxy, Service Mesh có hỗ trợ chuẩn xác HTTP/2 Trailers hay không sẽ ảnh hưởng trực tiếp đến các lời gọi gRPC. Nếu có mắt xích nào trong chuỗi xử lý Trailers bị lỗi, vấn đề phát sinh sẽ vô cùng ẩn khuất và khó dò.

Do đó, gRPC không đơn giản chỉ là công thức "HTTP/2 + Protobuf".

Về tầng HTTP, nó chạy trên HTTP/2.

Về mã hóa, nó mặc định phối hợp với Protobuf, nhưng giao thức cho phép dùng định dạng khác.

Về trải nghiệm gọi, nó cho phép bạn gọi dịch vụ từ xa như gọi local method.

Về trả về trạng thái, nó lại mượn HTTP/2 Trailers để chở kết quả gọi RPC.

Chính sự lồng ghép của tất cả những yếu tố này mới là lý do khiến người ta dễ bị xoay như chong chóng.

## Khi chọn giải pháp thực tế, đừng hỏi cái nào "xịn sò" hơn

Tôi khuyên bạn nên chọn dựa trên mối quan hệ lời gọi:

- Nếu là các lời gọi từ trình duyệt, ứng dụng di động, hệ thống của bên thứ ba, hãy ưu tiên HTTP. Lý do rất đơn giản: tính phổ thông, chi phí tích hợp thấp, công cụ debug phong phú. Giao diện mở ra ngoài sợ nhất là đối tác không kết nối nổi. HTTP ở khía cạnh này nắm giữ lợi thế áp đảo hoàn toàn.
- Nếu là các microservice nội bộ trong công ty gọi nhau với tần suất cao, có thể cân nhắc RPC. Nhất là khi số lượng service nhiều, số lượng endpoint lớn, chuỗi gọi phức tạp, đòi hỏi cao về timeout, retry, service discovery, tracing, load balancing, thì một RPC framework sẽ giúp bạn giảm bớt vô số thao tác thừa thãi lặp đi lặp lại.
- Nếu đội ngũ đã có sẵn hạ tầng HTTP trưởng thành, cũng chẳng cần thiết phải gượng ép lên RPC. Ví dụ Gateway đồng bộ, Service Discovery, SDK, Tracing, Rate Limiting, Circuit Breaker đều đã hoàn thiện, mọi người cũng quen dùng HTTP, vậy thì tiếp tục dùng HTTP là hoàn toàn ổn thỏa.

Nếu muốn dùng gRPC, hãy nghĩ thấu đáo một vài câu hỏi trước khi bắt tay làm:

- Trình duyệt không thể dùng trực tiếp gRPC chuẩn như các backend service, thông thường bắt buộc phải qua gRPC-Web hoặc một tầng proxy;
- Gateway và Load Balancer trong hệ thống có hỗ trợ tốt không? Việc debug cục bộ có thuận tiện không?
- Team có sẵn sàng chấp nhận quy trình làm việc với `.proto` và code generation tự động không?
- Khi điều tra lỗi trên production, các message nhị phân có làm tăng thêm gánh nặng đọc hiểu hay không?

gRPC rất mạnh, nhưng không hề miễn phí về mặt chi phí vận hành.

Điểm này cần phải xác định rành mạch ngay từ đầu.

## Một vài hiểu lầm phổ biến

### Giữa HTTP và RPC, bên nào hiệu năng tốt hơn?

Không thể vơ đũa cả nắm.

Nếu mang HTTP/1.1 + JSON đi đọ với gRPC chạy trên nền HTTP/2 + Protobuf trong kịch bản gọi nội bộ tần suất cao, thì rõ ràng gRPC thường tiết kiệm tài nguyên hơn nhiều.

Nhưng đổi sang một kịch bản triển khai khác, kết quả có thể sẽ hoàn toàn khác biệt.

Kích thước message, phương thức serialization, cơ chế tái sử dụng kết nối, thuật toán nén, cách framework implement và môi trường mạng... tất cả đều tác động đến kết quả. Muốn so sánh thực sự, bạn nên mang chính API, khối lượng dữ liệu và môi trường deploy của mình ra chạy stress-test, chứ đừng chỉ vẹt lại mỗi câu "RPC nhanh hơn".

### Có phải RPC bắt buộc chỉ chạy qua TCP?

Không phải.

RPC là một mô hình gọi, không phải là một giao thức truyền tải. Nó có thể chạy trên TCP thuần, cũng có thể chạy trên HTTP/2. gRPC chính là một ví dụ điển hình nhất.

### REST và RPC có bài trừ lẫn nhau không?

Không hề bài trừ tuyệt đối.

REST thiên về mô hình hóa tài nguyên, còn RPC thiên về mô hình hóa lời gọi hàm. Trong các dự án thực tế việc dùng kết hợp là rất bình thường: API bên ngoài dùng REST, service nội bộ dùng RPC. Đây là chuyện diễn ra hàng ngày ở các hệ thống lớn.

### Đã có HTTP/2 rồi thì có còn cần đến RPC nữa không?

HTTP/2 ở tầng HTTP đã mang lại Frame, Stream, Multiplexing (đa ghép kênh), Header Compression... giúp tối ưu hóa đáng kể hiệu suất sử dụng đồng thời trên cùng một kết nối TCP.

Nhưng nó không tự động giúp bạn định nghĩa service interface, không tự động sinh mã client, cũng không tự động giải quyết các bài toán về service discovery, timeout retry, quản trị lời gọi và version contract.

Còn một khác biệt rất lớn dễ bị bỏ quên: Mô hình gọi (invocation pattern).

Các API HTTP thông thường đa phần là dạng hỏi-đáp một-một (request-response). gRPC ngoài kiểu gọi Unary phổ biến nhất, còn hỗ trợ gốc (native) cho Server streaming, Client streaming và Bidirectional streaming (luồng hai chiều). Tài liệu chính thức của gRPC liệt kê rành rọt 4 mô hình gọi này: Unary, Server streaming, Client streaming, Bidirectional streaming.

Với các kịch bản như theo dõi log (log subscription), cập nhật tiến độ tác vụ kéo dài, upload hàng loạt, đồng bộ dữ liệu thời gian thực... dùng streaming sẽ tự nhiên hơn rất nhiều. Bạn tất nhiên cũng có thể dùng SSE, WebSocket hoặc tự đóng gói trên HTTP/2, nhưng làm như thế nghĩa là bạn lại đang phải tự tay viết lại phần tính năng mà các RPC framework vốn đã hoàn thiện sẵn từ lâu.

Vì vậy HTTP/2 rất quan trọng, nhưng nó không thể đại diện cho toàn bộ một hệ sinh thái RPC framework.

### gRPC có phải bằng HTTP/2 + Protobuf không?

Không phải.

Câu nói này chỉ có tác dụng giúp người mới nhanh chóng hình dung khái niệm bước đầu, chứ không thể dùng làm định nghĩa chặt chẽ.

Nói một cách chuẩn xác hơn: gRPC dùng HTTP/2 làm tầng truyền tải cho các lời gọi RPC, mặc định dùng Protobuf để mô tả interface và message, nhưng bản thân giao thức cho phép dùng JSON hoặc encoding tùy biến; đồng thời nó còn quy định một bộ quy chuẩn hoàn chỉnh về đường dẫn request, Content-Type, Length-Prefixed-Message, `grpc-status` trong Trailers...

Do đó gRPC không đơn thuần là đổi sang một định dạng serialization khác, nó là cả một bộ giao thức gọi RPC và quy ước kỹ thuật hoàn chỉnh.

## Lời kết

HTTP và RPC không phải là mối quan hệ thay thế lẫn nhau, cũng chẳng phải chuyện ai cao cấp hơn ai.

HTTP gọi được dịch vụ, RPC cũng gọi được dịch vụ. Khác biệt thực sự nằm ở chỗ: bạn muốn xem việc gọi từ xa là một lần "truy cập tài nguyên" hay là một lần "gọi phương thức".

Nếu là giao diện mở ra ngoài — như Web, App di động, hệ thống đối tác tích hợp — HTTP thường là lựa chọn tối ưu hơn. Nó phổ biến, dễ debug, chi phí kết nối thấp, người ta chỉ cần mở Postman hay gõ lệnh curl là test được ngay.
Nếu là các dịch vụ nội bộ công ty gọi nhau — đặc biệt khi nhiều service, chuỗi gọi dài, tần suất dày đặc, lại cần giải quyết các bài toán về service discovery, timeout, retry, load balancing, tracing — thì RPC sẽ thuận tay hơn rất nhiều. Nó không đơn thuần chỉ nhằm mục đích chạy nhanh, mà là gom hàng tá sự vụ đau đầu trong giao tiếp nội bộ lại để giải quyết cùng một thể.

Vì thế, đừng tiếp tục học vẹt câu khẩu hiệu "HTTP hướng ngoại, RPC hướng nội" nữa.

Câu nói đó có thể giúp bạn nhập môn nhanh, nhưng khi bắt tay vào làm dự án thật, bạn phải cân nhắc đối tượng gọi của mình là ai, hạ tầng của team đến đâu, chi phí điều tra lỗi ra sao, yêu cầu hiệu năng thế nào và chi phí bảo trì lâu dài sau này.

Hệ thống quy mô nhỏ, dùng HTTP vẫn đang chạy mượt mà ổn định, thì đừng cố gượng ép lên RPC chỉ để "trông có vẻ đậm chất microservices".

Còn khi các lời gọi nội bộ ngày càng rối rắm, bạn thấy mình cứ phải cặm cụi đắp thêm đống HTTP SDK, gateway, monitoring, retry... thì đó là lúc bạn nên nghiêm túc cân nhắc chuyển sang RPC.

Tóm lại một câu: **HTTP không hề yếu ớt đến thế, và RPC cũng chẳng thần thánh đến vậy. Chọn bên nào, chủ yếu phụ thuộc vào việc nó có giải quyết được bài toán hiện tại của bạn với chi phí thấp nhất hay không.**
