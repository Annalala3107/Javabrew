---
title: "Tổng hợp câu hỏi phỏng vấn Microservices mới nhất 2026: Tách dịch vụ, Giao tiếp, Tính nhất quán dữ liệu và Khả năng quan sát (Observability)"
description: "Tổng hợp câu hỏi phỏng vấn và lộ trình ôn tập Microservices mới nhất 2026, bao gồm các chủ điểm tần suất cao như lựa chọn giữa Monolith và Microservices, tách dịch vụ, RPC, Message Queue, Service Discovery, API Gateway, Configuration Center, tách Database, Distributed Transaction, khả năng chịu lỗi (Fault Tolerance), khả năng quan sát (Observability) và chiến lược chuyển đổi (Migration)."
category: Hệ thống phân tán (Distributed Systems)
tag:
  - Microservices
  - Hệ thống phân tán
  - Câu hỏi phỏng vấn
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn Microservices,Kiến trúc Microservices,Tách dịch vụ,Service Discovery,API Gateway,Giao tiếp giữa các service,Tách Database,Distributed Transaction,Saga,Outbox,Circuit Breaker,Rate Limiting,Observability,Chuyển đổi sang Microservices
lang: vi
sourceRef: zh-ref/distributed-system/microservices-interview-questions.md
---

Phỏng vấn Microservices rất hiếm khi dừng lại ở câu hỏi "Microservices là gì?". Người phỏng vấn thường bắt đầu từ một lần tách kiến trúc để hỏi xoáy sâu hơn: Vì sao các service được chia ranh giới như vậy? Khi lời gọi liên service bị lỗi thì xử lý thế nào? Sau khi nhiều service tự quản lý dữ liệu riêng thì truy vấn tổng hợp và đảm bảo tính nhất quán ra sao? Quá trình phát hành, mở rộng (scale) và khôi phục sau sự cố của service được vận hành như thế nào?

Bài viết này là cổng ôn tập cho các nội dung về Microservices trên JavaGuide, sắp xếp các bài viết hiện có theo các nhóm: tách kiến trúc, giao tiếp dịch vụ, tính nhất quán dữ liệu, độ ổn định & khả năng quan sát. Bài viết không lặp lại toàn bộ đáp án chi tiết, mà giúp bạn xác định phạm vi ôn tập và xâu chuỗi các kiến thức nằm rải rác ở các chuyên đề Hệ thống phân tán, High Availability, Message Queue và Bảo mật.

Nếu thời gian khá gấp, bạn có thể xem trước bản ôn tập cấp tốc [Tổng hợp câu hỏi phỏng vấn thường gặp về Microservices](https://interview.javaguide.cn/distributed-system/microservices-interview-questions.html), đánh dấu những câu chưa nắm rõ rồi quay lại các bài viết chuyên đề tương ứng trong bài này để bổ sung chi tiết.

## Khi ôn tập nên nắm chắc những vấn đề nào trước?

| Phân hệ | Nội dung cần trình bày rõ ràng | Hướng hỏi xoáy thường gặp |
| --- | --- | --- |
| Kiến trúc & Tách dịch vụ | Vì sao phải tách, tách theo tiêu chí nào, tách tới độ mịn nào | Monolith, Cluster, hệ thống phân tán, Bounded Context, ranh giới service, Distributed Monolith |
| Giao tiếp & Hạ tầng | Các service gọi và phát hiện lẫn nhau như thế nào, request bên ngoài đi vào hệ thống ra sao | REST, RPC, Message Queue, Registration & Discovery, API Gateway, Configuration Center |
| Dữ liệu & Tính nhất quán | Sau khi mỗi service tự quản lý dữ liệu, xử lý truy vấn liên service và Transaction nghiệp vụ thế nào | Database per Service, truy vấn tổng hợp (API Composition), Saga, Transactional Message, Outbox, Idempotency |
| Độ ổn định & Bàn giao | Kiểm soát sự cố cục bộ ra sao, phát hành và mở rộng/thu hẹp service an toàn thế nào | Timeout, Retry, Circuit Breaking, Rate Limiting, Isolation, Probe, Graceful Shutdown, tương thích ngược |
| Observability & Bảo mật | Sau khi xảy ra sự cố thì truy vết chuỗi lời gọi thế nào, danh tính và quyền hạn truyền qua các service ra sao | Log, Metrics, Tracing, Alerting, xác thực tại Gateway, phân quyền tại service |

Khi trả lời các câu hỏi về Microservices, tên công cụ/thành phần chỉ là một phần của phương án. Bạn còn phải trình bày được cơ sở tách dịch vụ, quyền sở hữu dữ liệu, cách xử lý khi xảy ra lỗi, cũng như việc đội ngũ kỹ thuật có đủ năng lực phát triển, triển khai và vận hành độc lập các service này hay không.

## Nền tảng Microservices và Tách dịch vụ

Microservices là một phong cách kiến trúc tổ chức các service xoay quanh năng lực nghiệp vụ. Một hệ thống có nhiều tiến trình không đồng nghĩa với việc ranh giới service đã hợp lý; nếu nhiều service luôn phải sửa cùng nhau, phát hành cùng nhau và còn dùng chung trực tiếp các bảng Database, kết quả cuối cùng thường là một Distributed Monolith (khối đơn phân tán) với chi phí vận hành cao hơn hẳn.

![Từ Monolith sang thương mại điện tử phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/monolith-to-distributed-ecommerce-7d010683.webp)

Nội dung liên quan:

- [Nhập môn Hệ thống phân tán](./distributed-system-intro.md)
- [Tổng hợp câu hỏi phỏng vấn Hệ thống phân tán](./distributed-system-interview-questions.md)

Câu hỏi phỏng vấn thường gặp:

- Kiến trúc Monolith, Cluster, hệ thống phân tán và Microservices khác nhau như thế nào?
- Microservices mang lại những lợi ích gì? Độ phức tạp về lời gọi mạng, tính nhất quán dữ liệu và chi phí vận hành sẽ tăng thêm bao nhiêu?
- Những đội ngũ và giai đoạn nghiệp vụ nào không phù hợp để áp dụng ngay Microservices?
- Nên tách service theo năng lực nghiệp vụ, ranh giới miền (Domain Boundary) hay theo bảng Database?
- Bounded Context (ngữ cảnh giới hạn) và ranh giới service có mối quan hệ gì?
- Tách service quá nhỏ (quá mịn) sẽ phát sinh những vấn đề nào?
- Distributed Monolith là gì? Làm sao nhận biết hệ thống đã rơi vào trạng thái này?

Việc tách service cần cân nhắc đồng thời tốc độ thay đổi nghiệp vụ, quyền sở hữu dữ liệu và trách nhiệm của từng team. Tách mỗi bảng Database thành một service thường khiến một thao tác nghiệp vụ phải đi qua hàng loạt lời gọi mạng; còn chỉ tách theo cơ cấu tổ chức thì khi cơ cấu team thay đổi rất dễ để lại các ranh giới service gượng gạo.

## Giao tiếp dịch vụ và Hạ tầng

Sau khi tách service, các lời gọi nội bộ trong cùng tiến trình trước đây sẽ biến thành giao tiếp qua mạng. Lời gọi đồng bộ phải xử lý Timeout và kết quả bất định; thông điệp bất đồng bộ phải xử lý gửi lặp, thứ tự và tính nhất quán cuối cùng (Eventual Consistency); còn Service Discovery, API Gateway và Configuration Center đảm nhận việc định địa chỉ, đón lưu lượng đầu vào và thay đổi cấu hình khi số lượng service tăng lên.

![Luồng gọi RPC và các năng lực cốt lõi](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-overview-088d1554.png)

![Trách nhiệm và vị trí triển khai của API Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gateway-overview-ee8b371d.png)

Nội dung liên quan:

- [Tổng hợp kiến thức nền tảng RPC](./rpc/rpc-intro.md)
- [HTTP và RPC khác nhau ở điểm nào?](../cs-basics/network/http-vs-rpc.md)
- [Tổng hợp câu hỏi phỏng vấn Message Queue](../high-performance/message-queue/message-queue-interview-questions.md)
- [Tổng hợp kiến thức nền tảng API Gateway](./api-gateway.md)
- [Tổng hợp câu hỏi thường gặp về Spring Cloud Gateway](./spring-cloud-gateway-questions.md)
- [Tổng hợp câu hỏi phỏng vấn Distributed Configuration Center](./distributed-configuration-center.md)

Câu hỏi phỏng vấn thường gặp:

- Giữa các Microservices nên chọn REST, RPC hay Message Queue?
- Chuỗi lời gọi đồng bộ quá dài sẽ khuếch đại độ trễ và lỗi như thế nào?
- Vì sao một RPC framework cần Registration & Discovery, Load Balancing, Serialization và cơ chế Timeout?
- Client-side Service Discovery và Server-side Service Discovery khác nhau ở điểm nào?
- API Gateway nên đảm nhận những công việc nào trong số Routing, Authentication, Rate Limiting và chuyển đổi giao thức?
- Gateway với Nginx, Load Balancer và BFF lần lượt giải quyết bài toán gì?
- Vì sao Configuration Center không thể chỉ là một thư mục chứa file cấu hình từ xa?
- Thay đổi cấu hình được phát hành từng phần (Canary) như thế nào? Khi Client lấy cấu hình thất bại thì khởi động và vận hành ra sao?

Giao tiếp đồng bộ và bất đồng bộ có thể tồn tại song song. Truy vấn của người dùng thường cần phản hồi đồng bộ, còn thông báo sau khi tạo đơn hàng, cộng điểm thưởng và đồng bộ dữ liệu có thể dùng Message Queue. Việc lựa chọn phải xuất phát từ yêu cầu độ trễ nghiệp vụ, cách xử lý thất bại và mức độ nhất quán, không nên chỉ chọn theo framework mà team quen dùng.

## Tách dữ liệu và Tính nhất quán

Để các service phát triển độc lập, quyền sở hữu dữ liệu thường cũng phải rõ ràng. Nhiều service cùng trực tiếp đọc ghi một bảng tuy tiết kiệm được một lần gọi API, nhưng chỉ cần một bên thay đổi cấu trúc bảng hay ngữ nghĩa dữ liệu là có thể ảnh hưởng tới các service khác, khiến các service rất khó phát hành thực sự độc lập.

![Giao dịch phân tán hình thành giữa Order Service và Inventory Service](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-with-two-services-24ad066a.png)

Nội dung liên quan:

- [Tổng hợp giải pháp Distributed Transaction](./distributed-transaction.md)
- [Tổng hợp câu hỏi phỏng vấn Message Queue](../high-performance/message-queue/message-queue-interview-questions.md)
- [Tổng hợp giải pháp Tính lũy đẳng (Idempotency) cho API](../high-availability/idempotency.md)

Câu hỏi phỏng vấn thường gặp:

- Vì sao nhấn mạnh mỗi Microservice phải tự sở hữu phần dữ liệu mà nó chịu trách nhiệm?
- Nhiều service dùng chung bảng Database sẽ gây ra những sự ràng buộc chặt (Coupling) nào?
- Truy vấn liên service nên dùng API Composition (tổng hợp qua API), Read Model, công cụ tìm kiếm (Search Engine) hay đồng bộ dữ liệu?
- Nghiệp vụ liên service lựa chọn giữa nhất quán mạnh (Strong Consistency) và nhất quán cuối cùng (Eventual Consistency) như thế nào?
- 2PC, TCC, Saga, Transactional Message và Local Message Table lần lượt phù hợp với kịch bản nào?
- Transactional Outbox xử lý trường hợp "ghi Database thành công nhưng gửi message thất bại" như thế nào?
- Khi thao tác bù trừ (Compensation) bị lỗi hoặc thực thi lặp lại, làm sao đảm bảo trạng thái nghiệp vụ vẫn đúng?
- Vì sao phía Consumer vẫn cần đảm bảo Tính lũy đẳng (Idempotency)?

Phương án Distributed Transaction cần được bàn gắn liền với hành động nghiệp vụ thực tế. Tồn kho giữ chỗ có thể hoàn tác, tin nhắn SMS đã gửi đi không thể thu hồi, còn cổng thanh toán bên ngoài cũng chưa chắc hỗ trợ tham gia Transaction cục bộ. Bù trừ (Compensation) không đồng nghĩa với việc khôi phục lại đúng giá trị cũ về mặt kỹ thuật, mà phải chuyển sang trạng thái tiếp theo hợp lệ theo quy tắc nghiệp vụ.

## Độ ổn định, Phát hành và Mở rộng/Thu hẹp

Microservices phân tán một request sang nhiều node, nên tần suất xảy ra sự cố cục bộ sẽ tăng lên theo số khâu gọi nhau. Timeout giới hạn thời gian chờ, Retry xử lý lỗi nhất thời, Circuit Breaking ngăn việc tiếp tục gọi vào hạ nguồn đang bất thường, Rate Limiting và cô lập (Isolation) bảo vệ tài nguyên hữu hạn; các cơ chế này cần được thiết lập đồng bộ trên cùng một chuỗi lời gọi.

![Máy trạng thái của Circuit Breaker](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-fuse-state-machine-48c9741c.png)

Nội dung liên quan:

- [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Availability](../high-availability/high-availability-system-interview-questions.md)
- [Giải thích chi tiết Timeout và Retry](../high-availability/timeout-and-retry.md)
- [Giải thích chi tiết Rate Limiting cho dịch vụ](../high-availability/limit-request.md)
- [Giải thích chi tiết Degradation và Circuit Breaking](../high-availability/fallback-and-circuit-breaker.md)
- [Giải thích chi tiết Thiết kế dự phòng (Redundancy)](../high-availability/redundancy.md)

Câu hỏi phỏng vấn thường gặp:

- Timeout, Retry, Circuit Breaking, Rate Limiting, Degradation và Isolation lần lượt giải quyết bài toán gì?
- Thời gian Timeout nên thiết lập như thế nào dựa trên Deadline của thượng nguồn và phân bố độ trễ của hạ nguồn?
- Vì sao nhiều tầng service cùng Retry có thể gây ra bão Retry (Retry Storm)?
- Liveness, Readiness và Startup Probe lần lượt nên kiểm tra những gì?
- Service thực hiện tắt ứng dụng êm ái (Graceful Shutdown) như thế nào để tránh các request đang xử lý bị cắt ngang?
- API và định dạng message duy trì tương thích ngược (Backward Compatibility) bằng cách nào?
- Khi phát hành từng phần (Canary Release) gặp bất thường, lưu lượng và dữ liệu Rollback như thế nào?
- Trước khi tăng số lượng Consumer hoặc instance service, vì sao phải kiểm tra số Partition, Connection Pool và năng lực chịu tải của hạ nguồn trước?

Kiểm tra sức khỏe (Health Check) không được nhồi tất cả các phụ thuộc vào cùng một Probe. Khi Database chậm lại trong thời gian ngắn, nếu toàn bộ instance cùng lúc khởi động lại vì Liveness Probe thất bại, sự cố phụ thuộc ban đầu sẽ bị khuếch đại nghiêm trọng hơn. Probe, rút lưu lượng (Traffic Draining), rút kết nối (Connection Draining) và thứ tự dừng ứng dụng cần được thiết kế cùng nhau.

## Khả năng quan sát (Observability) và Bảo mật

Trong ứng dụng Monolith, một request thường chỉ đi qua một tiến trình; còn lời gọi Microservices có thể xuyên qua Gateway, nhiều service nghiệp vụ, Cache, Database và Message Queue. Log, Metrics và Distributed Tracing bắt buộc phải gắn với một mã định danh request thống nhất để liên kết với nhau, nếu không bạn chỉ nhìn thấy từng service tự báo lỗi rời rạc mà không thể khôi phục được toàn bộ quá trình.

Nội dung liên quan:

- [Hệ thống kiến thức High Availability](../high-availability/)
- [Chuyên đề Xác thực, Phân quyền và An toàn dữ liệu](../system-design/security/)
- [Tổng hợp kiến thức nền tảng API Gateway](./api-gateway.md)

Câu hỏi phỏng vấn thường gặp:

- Log, Metrics và Distributed Tracing lần lượt phù hợp để xác định loại vấn đề nào?
- Microservices nên giám sát những chỉ số nào về lượng request, tỷ lệ lỗi, độ trễ, tài nguyên và nghiệp vụ?
- `TraceId` được truyền tiếp xuyên qua HTTP, RPC và Message Queue như thế nào?
- Xác thực (Authentication) nên đặt ở Gateway hay ở service nghiệp vụ?
- Sau khi Gateway đã hoàn tất kiểm tra danh tính, vì sao service nghiệp vụ vẫn phải kiểm soát quyền ở cấp tài nguyên (Resource-level Authorization)?
- Giữa các service truyền tải danh tính bằng cách nào, và làm sao ngăn API nội bộ bị truy cập trực tiếp bằng cách đi vòng qua Gateway?

Gateway phù hợp để thực hiện xác thực Token tập trung và kiểm soát truy cập mức thô (coarse-grained), nhưng quyền sở hữu đơn hàng, phạm vi Tenant và quyền truy cập dữ liệu vẫn phải do service nắm giữ dữ liệu nghiệp vụ kiểm tra. Chỉ ẩn nút ở Frontend hoặc chỉ kiểm tra Role tại Gateway không thể chặn được lỗi vượt quyền theo đối tượng (IDOR) và lời gọi trực tiếp giữa các service.

## Chuyển đổi sang Microservices và Cách trả lời thiết kế giải pháp

Quá trình chuyển từ Monolith sang Microservices thường bắt đầu từ những module thay đổi thường xuyên, có áp lực tải rõ rệt hoặc có ranh giới team tương đối tách bạch. Trong giai đoạn chuyển đổi, hệ thống cũ và mới sẽ cùng tồn tại; đồng bộ dữ liệu, chuyển đổi lưu lượng, tương thích API và phương án Rollback là những thứ cần thiết kế trước hơn cả câu chuyện "tách ra bao nhiêu service".

Câu hỏi phỏng vấn thường gặp:

- Làm sao nhận diện các module nghiệp vụ phù hợp nhất để ưu tiên tách ra trước?
- Trong giai đoạn service cũ và mới cùng tồn tại, lưu lượng và dữ liệu nên chuyển đổi (migrate) như thế nào?
- Làm sao tránh việc viết lại toàn bộ một lần khiến tiến độ bàn giao và rủi ro vượt khỏi tầm kiểm soát?
- Khi thiết kế một phương án Microservices, bạn nên trình bày những nội dung nào?

Để trả lời trọn vẹn một bài toán thiết kế Microservices, bạn có thể trình bày theo trình tự: mục tiêu nghiệp vụ, ranh giới service, API & messaging, quyền sở hữu dữ liệu, tính nhất quán, độ ổn định, Observability, bảo mật, và phát hành/chuyển đổi. Khi đề bài chưa nêu rõ lưu lượng, quy mô team và yêu cầu tính nhất quán, hãy xác nhận các ràng buộc này với người phỏng vấn trước rồi mới quyết định có tách dịch vụ hay không và sử dụng những thành phần nào.

## Sắp xếp ôn tập theo thời gian chuẩn bị

| Thời gian còn lại | Lộ trình gợi ý | Mục tiêu ôn tập |
| --- | --- | --- |
| 1–2 ngày | Xem qua một lượt [Tổng hợp câu hỏi phỏng vấn thường gặp về Microservices](https://interview.javaguide.cn/distributed-system/microservices-interview-questions.html), ưu tiên bổ sung phần tách dịch vụ, giao tiếp, tính nhất quán dữ liệu và chịu lỗi | Trình bày rõ lợi ích, cái giá của Microservices và một chuỗi lời gọi hoàn chỉnh |
| 3–7 ngày | Bổ sung RPC, Gateway, Configuration Center, Distributed Transaction, Message Queue và Timeout/Circuit Breaking, đồng thời vẽ ra các service và biến động dữ liệu của một request đặt hàng hoặc thanh toán | Trả lời được luồng xử lý lỗi, sự đánh đổi phương án và các câu hỏi xoáy về hạ tầng phổ biến |
| Trên 1 tuần | Kết hợp dự án thực tế để tổng hợp lại một lần tách dịch vụ hoặc thiết kế kiến trúc, bổ sung tương thích API, Canary Release, giám sát/cảnh báo, năng lực chịu tải và phương án Rollback | Trình bày mạch lạc từ ràng buộc nghiệp vụ tới service, dữ liệu, bàn giao và vận hành |
