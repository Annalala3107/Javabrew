---
title: "Giải thích chi tiết RPC (Remote Procedure Call): Nguyên lý, Quy trình gọi, Giao thức Serialization và Lựa chọn Framework"
category: Hệ thống phân tán
description: "Giải thích nền tảng về RPC (Remote Procedure Call), bao gồm nguyên lý cốt lõi của RPC, quy trình gọi, Dynamic Proxy, giao thức Serialization, truyền tải mạng, Service Discovery và cách lựa chọn các framework phổ biến như Dubbo, gRPC, Thrift."
tag:
  - RPC
head:
  - - meta
    - name: keywords
      content: RPC,nguyên lý RPC,gọi thủ tục từ xa,Dynamic Proxy,Serialization,Service Discovery,Dubbo,gRPC,Thrift,giao tiếp microservice,câu hỏi phỏng vấn RPC
lang: vi
sourceRef: zh-ref/distributed-system/rpc/rpc-intro.md
---

Bài viết này sẽ giới thiệu ngắn gọn các khái niệm cơ bản liên quan đến RPC.

Đặt trong bối cảnh hệ thống phân tán, RPC giải quyết bài toán **các dịch vụ gọi lẫn nhau như thế nào**. Request từ bên ngoài đi vào hệ thống thường đi qua [API Gateway](../api-gateway.md) trước; sau khi vào tới các dịch vụ nội bộ, các dịch vụ sẽ tiếp tục phối hợp với nhau thông qua RPC, HTTP Client, Message Queue,... Nếu bạn muốn tìm hiểu chi tiết về quản trị dịch vụ (Service Governance) của một RPC framework trưởng thành như Dubbo, hãy đọc tiếp [Tổng hợp câu hỏi phỏng vấn Dubbo](./dubbo.md).

## RPC là gì?

![Tổng quan về RPC](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-overview-088d1554.png)

**RPC (Remote Procedure Call)** có nghĩa là gọi thủ tục từ xa. Chỉ cần nhìn vào tên gọi, chúng ta đã thấy RPC tập trung vào lời gọi từ xa chứ không phải lời gọi cục bộ.

**Tại sao cần RPC?** Bởi vì các phương thức do dịch vụ trên hai server khác nhau cung cấp không nằm trong cùng một không gian bộ nhớ, nên cần lập trình mạng để truyền các tham số phục vụ cho lời gọi phương thức, và kết quả trả về cũng phải được nhận qua mạng. Tuy nhiên, nếu tự viết code lập trình mạng thủ công để hiện thực hóa quy trình gọi này thì khối lượng công việc là rất lớn, vì chúng ta phải tự cân nhắc phương thức truyền tải tầng dưới (TCP hay UDP), cách thức tuần tự hóa (`Serialization`) và nhiều khía cạnh khác.

**RPC có thể giúp chúng ta làm gì?** Nói một cách đơn giản, thông qua RPC chúng ta có thể gọi phương thức của một dịch vụ trên máy tính từ xa dễ dàng hệt như gọi một phương thức cục bộ. Hơn nữa, chúng ta không cần phải hiểu sâu các chi tiết tầng dưới của lập trình mạng!

Ví dụ: hai dịch vụ khác nhau là Service A và Service B được triển khai trên hai máy khác nhau; nếu Service A muốn gọi một phương thức nào đó trong Service B thì có thể thực hiện thông qua RPC.

Nói tóm lại: **RPC ra đời là để giúp bạn gọi một phương thức từ xa đơn giản như gọi phương thức cục bộ.**

## Nguyên lý của RPC là gì?

Để giúp các bạn dễ hiểu nguyên lý của RPC, chúng ta có thể xem toàn bộ chức năng cốt lõi của RPC được cấu thành từ 5 phần dưới đây 👇:

1. **Client (Service Consumer — Bên tiêu thụ dịch vụ)**: Bên gọi phương thức từ xa.
1. **Client Stub**: Thực chất đây là một lớp Proxy (Proxy class). Việc lớp Proxy này làm rất đơn giản: đóng gói thông tin về phương thức, lớp, tham số phương thức mà bạn gọi để gửi sang phía Server.
1. **Truyền tải mạng (Network Transport)**: Truyền tải mạng giúp gửi thông tin lời gọi của bạn (chẳng hạn như các tham số) sang phía Server, rồi sau khi Server thực thi xong sẽ truyền kết quả trả về qua mạng cho bạn. Có nhiều cách triển khai tầng truyền tải mạng, ví dụ Socket cơ bản hoặc Netty (được khuyến nghị) với hiệu năng và khả năng đóng gói tốt hơn.
1. **Server Stub**: Thành phần Stub này không phải là lớp Proxy. Cá nhân mình thấy gọi là "stub" ở đây thực ra không sát nghĩa lắm, các bạn chỉ cần lưu ý điểm này là được. Server Stub thực chất chỉ thành phần sau khi nhận được request thực thi phương thức từ Client sẽ gọi phương thức tương ứng rồi trả kết quả về cho Client.
1. **Server (Service Provider — Bên cung cấp dịch vụ)**: Bên cung cấp phương thức từ xa.

Sơ đồ nguyên lý cụ thể như bên dưới, sau đây mình sẽ xâu chuỗi toàn bộ quy trình RPC để giải thích cho các bạn.

![Sơ đồ nguyên lý RPC](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-principle-b5556f7a.png)

1. Service Consumer (Client) gọi dịch vụ từ xa theo cách giống như lời gọi cục bộ;
1. Client Stub sau khi nhận được lời gọi sẽ chịu trách nhiệm đóng gói phương thức, tham số,... thành một message body có thể truyền qua mạng (Tuần tự hóa — `Serialization`): `RpcRequest`;
1. Client Stub tìm địa chỉ của dịch vụ từ xa và gửi message tới Service Provider;
1. Server Stub nhận message và giải tuần tự hóa (`Deserialization`) thành đối tượng Java: `RpcRequest`;
1. Server Stub dựa vào lớp, phương thức, tham số phương thức,... trong `RpcRequest` để gọi phương thức cục bộ;
1. Server Stub nhận kết quả thực thi của phương thức, đóng gói thành message body có thể truyền qua mạng `RpcResponse` (`Serialization`) và gửi về cho bên tiêu thụ;
1. Client Stub nhận message và giải tuần tự hóa (`Deserialization`) thành đối tượng Java: `RpcResponse`, từ đó nhận được kết quả cuối cùng. Xong!

Tin rằng sau khi đọc phần giải thích trên, các bạn đã nắm được nguyên lý của RPC.

Tuy dung lượng không dài, nhưng nó đã giải thích khá rõ ràng nguyên lý cốt lõi của một RPC framework! Ngoài ra, các chi tiết kỹ thuật nêu trên sẽ được mình giới thiệu trong các chương sau.

**Cuối cùng, về nguyên lý của RPC, mình hy vọng các bạn không chỉ dừng lại ở mức hiểu, mà còn có thể tự vẽ lại sơ đồ và trình bày mạch lạc cho người khác. Bởi vì trong phỏng vấn, mỗi khi interviewer hỏi đến các nội dung liên quan đến RPC thì câu hỏi này gần như chắc chắn sẽ gặp.**

## Có những RPC Framework phổ biến nào?

RPC framework được đề cập ở đây là những framework cho phép Client gọi trực tiếp phương thức của Server đơn giản như gọi phương thức cục bộ, ví dụ như Dubbo, Motan, gRPC được giới thiệu bên dưới. Nếu phải làm việc với giao thức HTTP, phân tích cú pháp (parse) và đóng gói HTTP request/response, thì những framework loại đó không hẳn được coi là "RPC framework" — chẳng hạn như Feign.

### Dubbo

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716111053081-f7eb2e02.png)

Apache Dubbo là một microservice framework cung cấp các giải pháp như giao tiếp RPC hiệu năng cao, quản trị lưu lượng (traffic governance) và khả năng quan sát (observability) cho các hệ thống microservice quy mô lớn, hỗ trợ nhiều ngôn ngữ SDK như Java, Golang,...

Dubbo cung cấp gần như đầy đủ mọi năng lực quản trị dịch vụ từ định nghĩa dịch vụ, khám phá dịch vụ, giao tiếp dịch vụ đến kiểm soát lưu lượng; đồng thời hỗ trợ giao thức Triple (giao thức truyền thông RPC thế hệ mới được định nghĩa trên nền tảng HTTP/2), cơ chế khám phá dịch vụ cấp ứng dụng (application-level service discovery), Dubbo Mesh (Dubbo3 đã bổ sung nhiều tính năng thân thiện với Cloud Native),...

![Dubbo3](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716111545343-d4b8a0b2.png)

Dubbo được Alibaba mở mã nguồn, sau đó gia nhập Apache. Chính nhờ sự xuất hiện của Dubbo mà ngày càng có nhiều công ty bắt đầu sử dụng và tiếp nhận kiến trúc phân tán.

Dubbo có thể coi là một dự án mã nguồn mở xuất sắc của Trung Quốc, và mã nguồn của nó cũng rất đáng để học hỏi và đọc hiểu!

- GitHub: [https://github.com/apache/incubator-dubbo](https://github.com/apache/incubator-dubbo "https://github.com/apache/incubator-dubbo")
- Trang chủ chính thức: <https://dubbo.apache.org/zh/>

### Motan

Motan là một RPC framework được Sina Weibo mở mã nguồn, nghe nói đang gánh hàng trăm tỷ lượt gọi tại Sina Weibo. Tuy nhiên, mình rất ít thấy các công ty khác sử dụng và tài liệu trên mạng cũng tương đối ít.

Nhiều người thích đem Motan so sánh với Dubbo vì cả hai đều do các công ty công nghệ lớn mở mã nguồn. Sau khi tra cứu nhiều tài liệu và xem qua mã nguồn của nó, mình nhận thấy: **Motan giống như một phiên bản Dubbo rút gọn; có lẽ đã học hỏi tư tưởng từ Dubbo nên thiết kế của Motan tinh giản hơn và chức năng cũng thuần túy hơn.**

Tuy nhiên, mình không khuyến khích bạn dùng Motan trong các dự án thực tế. Nếu công ty bạn triển khai thực tế thì vẫn nên chọn Dubbo, vì mức độ sôi nổi của cộng đồng cũng như hệ sinh thái của Dubbo tốt hơn nhiều.

- Nhìn thiết kế RPC framework từ Motan: [http://kriszhang.com/motan-rpc-impl/](http://kriszhang.com/motan-rpc-impl/ "http://kriszhang.com/motan-rpc-impl/")
- Tài liệu tiếng Trung của Motan: [https://github.com/weibocom/motan/wiki/zh_overview](https://github.com/weibocom/motan/wiki/zh_overview "https://github.com/weibocom/motan/wiki/zh_overview")

### gRPC

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/2843b10d-0c2f-4b7e-9c3e-ea4466792a8b-2a0bca88.png)

gRPC là một RPC framework mã nguồn mở, hiệu năng cao và đa dụng do Google phát triển. Nó được thiết kế ban đầu hướng đến phát triển ứng dụng di động và dựa trên chuẩn giao thức HTTP/2 (hỗ trợ các tính năng như truyền phát hai chiều — bidirectional streaming, nén header giúp tiết kiệm băng thông hơn), sử dụng giao thức Serialization là ProtoBuf và hỗ trợ rất nhiều ngôn ngữ lập trình.

**ProtoBuf là gì?** [ProtoBuf (Protocol Buffer)](https://github.com/protocolbuffers/protobuf) là một định dạng dữ liệu linh hoạt, hiệu quả, có thể dùng cho giao thức truyền thông, lưu trữ dữ liệu và nhiều lĩnh vực khác; hỗ trợ hầu hết mọi ngôn ngữ lập trình phổ biến và độc lập với nền tảng. Tuy nhiên, việc định nghĩa interface và kiểu dữ liệu thông qua ProtoBuf khá rườm rà — đây là một nhược điểm nhỏ.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716104304033-c11fc628.png)

Phải công nhận rằng thiết kế tầng giao tiếp của gRPC rất xuất sắc; những cải tiến ở tầng giao tiếp của [Dubbo-go 3.0](https://dubbogo.github.io/) chủ yếu học hỏi từ gRPC.

Tuy nhiên, thiết kế của gRPC khiến nó gần như không có sẵn khả năng quản trị dịch vụ (Service Governance). Nếu muốn giải quyết vấn đề này, bạn cần phụ thuộc vào các thành phần khác, chẳng hạn như PolarisMesh của Tencent.

- GitHub: [https://github.com/grpc/grpc](https://github.com/grpc/grpc "https://github.com/grpc/grpc")
- Trang chủ chính thức: [https://grpc.io/](https://grpc.io/ "https://grpc.io/")

### Thrift

Apache Thrift là một framework giao tiếp RPC đa ngôn ngữ do Facebook mở mã nguồn và hiện đã được trao tặng cho Apache Software Foundation quản lý. Nhờ đặc tính đa ngôn ngữ và hiệu năng vượt trội, Thrift được nhiều công ty internet ứng dụng; thậm chí những công ty có năng lực kỹ thuật còn tự xây dựng cả một bộ distributed service framework dựa trên Thrift, bổ sung thêm các tính năng như Service Registration và Service Discovery.

`Thrift` hỗ trợ nhiều **ngôn ngữ lập trình** khác nhau, bao gồm `C++`, `Java`, `Python`, `PHP`, `Ruby`,... (hỗ trợ nhiều ngôn ngữ hơn so với gRPC).

- Trang chủ chính thức: [https://thrift.apache.org/](https://thrift.apache.org/ "https://thrift.apache.org/")
- Giới thiệu ngắn gọn về Thrift: [https://www.jianshu.com/p/8f25d057a5a9](https://www.jianshu.com/p/8f25d057a5a9 "https://www.jianshu.com/p/8f25d057a5a9")

### Tổng kết

Tuy gRPC và Thrift hỗ trợ gọi RPC đa ngôn ngữ, nhưng chúng chỉ cung cấp những tính năng RPC framework cơ bản nhất, thiếu đi hệ thống các thành phần hướng dịch vụ (service-oriented components) và tính năng quản trị dịch vụ đi kèm.

Dù xét về mức độ hoàn thiện tính năng, hệ sinh thái hay sự sôi nổi của cộng đồng, Dubbo đều vượt trội nhất. Hơn nữa, tại Trung Quốc Dubbo có rất nhiều ca triển khai thành công như Dangdang, DiDi,... là một RPC framework ổn định, trưởng thành và đã được kiểm chứng qua môi trường production. Quan trọng nhất là bạn có thể tìm thấy rất nhiều tài liệu tham khảo về Dubbo, nên chi phí học tập tương đối thấp.

Hình dưới đây minh họa hệ sinh thái của Dubbo.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/eee98ff2-8e06-4628-a42b-d30ffcd2831e-bece6606.png)

Dubbo cũng là một thành phần nằm trong Spring Cloud Alibaba.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/0d195dae-72bc-4956-8451-3eaf6dd11cbd-fd20ff67.png)

Tuy nhiên, Dubbo và Motan chủ yếu hướng tới ngôn ngữ Java. Dù hiện tại Dubbo và Motan cũng hỗ trợ tương thích với một số ngôn ngữ khác nhưng không thực sự được khuyến khích dùng cho kịch bản đa ngôn ngữ. Nếu bạn cần gọi dịch vụ xuyên suốt nhiều ngôn ngữ khác nhau, hãy cân nhắc sử dụng gRPC.

Tóm lại, nếu bạn đang dùng tech stack Java Backend và phân vân chưa biết chọn RPC framework nào, mình khuyên bạn nên cân nhắc Dubbo.

## Làm thế nào để thiết kế và tự xây dựng một RPC Framework?

**"Tự viết RPC Framework"** là một cuốn sổ tay nội bộ trong cộng đồng [Knowledge Planet](https://javaguide.cn/about-the-author/zhishixingqiu-two-years.html) của mình, gồm 12 bài viết hướng dẫn cách xây dựng từ con số 0 một RPC framework đơn giản dựa trên Netty + Kryo + ZooKeeper.

Tuy nhỏ gọn nhưng đầy đủ mọi thành phần cốt lõi, mã nguồn được chú thích chi tiết, cấu trúc rõ ràng và tích hợp Checkstyle để chuẩn hóa cấu trúc code — rất phù hợp để đọc và học tập.

**Tổng quan nội dung:**

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220308100605485-54b6c8de.png)

## Đã có giao thức HTTP, tại sao vẫn cần RPC?

Để xem câu trả lời chi tiết cho câu hỏi này, vui lòng đọc bài viết: [Đã có giao thức HTTP, tại sao vẫn cần RPC?](../../cs-basics/network/http-vs-rpc.md).
