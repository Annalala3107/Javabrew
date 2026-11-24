---
title: "Tổng hợp câu hỏi phỏng vấn Dubbo: Nguyên lý kiến trúc, SPI, Load Balancing, Quản trị dịch vụ và Chịu lỗi cụm"
category: Hệ thống phân tán
description: "Tổng hợp các câu hỏi phỏng vấn Dubbo tần suất cao, bao gồm nguyên lý kiến trúc Dubbo, Service Export và Service Reference, cơ chế mở rộng SPI, cân bằng tải (Load Balancing), chịu lỗi cụm (Cluster Fault Tolerance), quản trị dịch vụ, Service Registry và các vấn đề thường gặp trong production."
tag:
  - RPC
  - Dubbo
head:
  - - meta
    - name: keywords
      content: Dubbo,câu hỏi phỏng vấn Dubbo,kiến trúc Dubbo,Dubbo SPI,cân bằng tải,chịu lỗi cụm,quản trị dịch vụ,Service Registry,RPC framework,framework dịch vụ phân tán
lang: vi
sourceRef: zh-ref/distributed-system/rpc/dubbo.md
---

::: tip

- Dubbo3 đã được phát hành, bài viết này được viết dựa trên Dubbo2. Dubbo3 phát triển tiếp từ nền tảng của Dubbo2; trong khi vẫn giữ nguyên các tính năng cốt lõi ban đầu, Dubbo3 đã nâng cấp toàn diện ở nhiều hướng như tính dễ sử dụng, thực tiễn Microservices quy mô siêu lớn, khả năng thích ứng với hạ tầng Cloud Native, thiết kế bảo mật,...
- Nhiều đường dẫn trong bài viết này đã bị hỏng, nguyên nhân chủ yếu là do tài liệu chính thức của Dubbo đã thay đổi cấu trúc URL.

:::

Bài viết này mặc định bạn đã hiểu quy trình gọi RPC cơ bản. Nếu bạn chưa nắm rõ các khái niệm như Dynamic Proxy, Serialization, truyền tải mạng hay Service Discovery, bạn nên đọc trước [Giải thích chi tiết RPC (Remote Procedure Call)](./rpc-intro.md). Dubbo có liên quan đến Service Registry, cân bằng tải (Load Balancing) và chịu lỗi cụm (Cluster Fault Tolerance), phần này bạn cũng có thể kết hợp đọc cùng [Chuyên đề ZooKeeper](../distributed-process-coordination/zookeeper/).

Bài viết này là bản tổng hợp về Dubbo do mình đúc kết dựa trên tài liệu chính thức cũng như kinh nghiệm sử dụng thực tế hằng ngày. Rất hoan nghênh các bạn đóng góp bổ sung!

## Kiến thức cơ bản về Dubbo

### Dubbo là gì?

![Trang chủ Dubbo](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/rpc/dubbo.org-overview-f4056db0.png)

[Apache Dubbo](https://github.com/apache/dubbo) |ˈdʌbəʊ| là một Web và RPC framework mã nguồn mở hiệu năng cao, gọn nhẹ.

Theo giới thiệu từ [Tài liệu chính thức của Dubbo](https://dubbo.apache.org/zh/), Dubbo cung cấp sáu năng lực cốt lõi:

1. Lời gọi RPC hiệu năng cao hướng Proxy theo interface.
2. Khả năng chịu lỗi và cân bằng tải thông minh.
3. Tự động đăng ký và khám phá dịch vụ (Service Registration & Discovery).
4. Khả năng mở rộng (extensibility) cực cao.
5. Điều phối lưu lượng trong thời gian chạy (runtime traffic scheduling).
6. Quản trị và vận hành dịch vụ trực quan.

![Sáu năng lực cốt lõi do Dubbo cung cấp](/media/jg/ext/oss.javaguide.cn/asset/dubbo/dubbo-c5bde0f9.png)

Nói ngắn gọn là: **Dubbo không chỉ giúp chúng ta gọi các dịch vụ từ xa, mà còn cung cấp sẵn (out-of-the-box) một số tính năng khác như cân bằng tải thông minh.**

Dubbo hiện đã có gần 34.4k Star.

Trong cuộc bình chọn **Dự án mã nguồn mở Trung Quốc OSC năm 2020**, Dubbo xếp thứ 7 trong hạng mục framework phát triển và thành phần nền tảng. So với vài năm trước đó, độ nóng và thứ hạng có phần giảm xuống.

![](/media/jg/ext/oss.javaguide.cn/asset/dubbo/image-20210107153159545-6de63285.png)

Dubbo được Alibaba mở mã nguồn, sau đó gia nhập Apache. Chính nhờ sự xuất hiện của Dubbo mà ngày càng có nhiều công ty bắt đầu sử dụng và tiếp nhận kiến trúc phân tán.

### Tại sao phải dùng Dubbo?

Cùng với sự phát triển của Internet, quy mô website ngày càng lớn và số lượng người dùng ngày càng tăng. Kiến trúc ứng dụng đơn (Single Application) và kiến trúc ứng dụng theo chiều dọc (Vertical Application) không còn đáp ứng được nhu cầu, và lúc đó kiến trúc dịch vụ phân tán đã ra đời.

Trong kiến trúc dịch vụ phân tán, hệ thống được tách thành các dịch vụ khác nhau như dịch vụ SMS, dịch vụ bảo mật; mỗi dịch vụ độc lập cung cấp một dịch vụ cốt lõi nào đó của hệ thống.

Chúng ta có thể sử dụng các framework hỗ trợ gọi từ xa như Java RMI (Java Remote Method Invocation) hoặc Hessian để xuất bản (export) và tham chiếu (reference) các dịch vụ từ xa một cách đơn giản. Tuy nhiên! Khi số lượng dịch vụ ngày càng nhiều, mối quan hệ gọi nhau giữa các dịch vụ trở nên ngày càng phức tạp. Khi áp lực truy cập vào ứng dụng ngày càng lớn, nhu cầu về cân bằng tải (Load Balancing) và giám sát dịch vụ (Monitoring) cũng trở nên cấp thiết. Chúng ta có thể dùng phần cứng như F5 để cân bằng tải, nhưng cách này làm tăng chi phí và tồn tại rủi ro điểm lỗi đơn (Single Point of Failure).

Sự xuất hiện của Dubbo đã giải quyết các vấn đề trên. **Dubbo giúp chúng ta giải quyết những vấn đề gì?**

1. **Cân bằng tải (Load Balancing)**: Khi cùng một dịch vụ được triển khai trên nhiều máy khác nhau, nên gọi tới dịch vụ trên máy nào.
2. **Dựng chuỗi gọi dịch vụ (Service Call Chain)**: Theo sự phát triển của hệ thống, số lượng dịch vụ ngày càng nhiều, quan hệ phụ thuộc giữa các dịch vụ trở nên chằng chịt phức tạp, thậm chí không phân biệt nổi ứng dụng nào phải khởi động trước ứng dụng nào, đến kiến trúc sư cũng không thể mô tả đầy đủ quan hệ kiến trúc của các ứng dụng. Dubbo có thể giúp chúng ta giải quyết việc nắm bắt các dịch vụ gọi nhau như thế nào.
3. **Thống kê áp lực truy cập & thời gian phản hồi, điều phối tài nguyên và quản trị dịch vụ**: Quản lý dung lượng cụm (cluster capacity) theo thời gian thực dựa trên áp lực truy cập, nâng cao hiệu suất sử dụng cụm.
4. ...

![Tổng quan năng lực của Dubbo](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/rpc/dubbo-features-overview-6436964c.jpg)

Ngoài ra, Dubbo không chỉ ứng dụng được trong hệ thống phân tán truyền thống mà còn dùng được trong hệ thống Microservices đang rất phổ biến hiện nay. Tuy nhiên, vì Spring Cloud được ứng dụng rộng rãi hơn trong Microservices, nên thông thường khi nhắc đến Dubbo thì phần lớn chúng ta đang nói tới bối cảnh hệ thống phân tán.

**Vừa rồi chúng ta có nhắc đến khái niệm "phân tán" (distributed), dưới đây mình sẽ giới thiệu thêm phân tán là gì và tại sao cần phân tán.**

## Kiến thức cơ bản về Hệ thống phân tán

### Hệ thống phân tán là gì?

Hệ thống phân tán hay kiến trúc phân tán SOA chú trọng vào hướng dịch vụ (service-oriented). Nói một cách đơn giản, phân tán tức là chúng ta tách toàn bộ hệ thống thành các dịch vụ khác nhau rồi đặt các dịch vụ đó lên các server khác nhau nhằm giảm tải cho dịch vụ đơn khối (monolith), nâng cao lượng truy cập đồng thời và hiệu năng. Ví dụ, hệ thống thương mại điện tử có thể tách đơn giản thành hệ thống đơn hàng, hệ thống sản phẩm, hệ thống đăng nhập,... Mỗi dịch vụ sau khi tách có thể triển khai trên các máy khác nhau; nếu một dịch vụ nào đó có lưu lượng truy cập lớn, ta cũng có thể triển khai dịch vụ đó đồng thời trên nhiều máy.

![Sơ đồ giao dịch phân tán](/media/jg/ext/oss.javaguide.cn/java-guide-blog/.png-8032541f.png)

### Tại sao cần phân tán?

Xét từ góc độ phát triển phần mềm, code của ứng dụng đơn khối (Monolithic) đều tập trung ở một chỗ, còn code của hệ thống phân tán được tách theo nghiệp vụ. Nhờ đó, mỗi team có thể phụ trách phát triển một dịch vụ, giúp nâng cao hiệu suất phát triển. Hơn nữa, sau khi tách theo nghiệp vụ, mã nguồn cũng dễ bảo trì và mở rộng hơn.

Ngoài ra, mình cho rằng việc tách hệ thống thành phân tán không chỉ giúp hệ thống dễ mở rộng và bảo trì mà còn nâng cao hiệu năng của toàn bộ hệ thống. Bạn thử nghĩ xem: tách toàn bộ hệ thống thành các dịch vụ/hệ thống con khác nhau, rồi triển khai riêng từng dịch vụ/hệ thống con đó trên một server độc lập, chẳng phải đã cải thiện đáng kể hiệu năng hệ thống hay sao?

## Kiến trúc của Dubbo

### Những vai trò cốt lõi nào có trong kiến trúc Dubbo?

[Mục thiết kế framework trong tài liệu chính thức](https://dubbo.apache.org/zh/docs/v2.7/dev/design/) đã giới thiệu rất chi tiết rồi, ở đây mình chỉ nhắc lại một số điểm quan trọng.

![Các vai trò cốt lõi trong kiến trúc Dubbo](/media/jg/ext/oss.javaguide.cn/asset/dubbo/dubbo-relation-f627b8d6.jpg)

Giới thiệu ngắn gọn các node trên và mối quan hệ giữa chúng:

- **Container**: Container chạy dịch vụ, chịu trách nhiệm nạp và vận hành Service Provider. Bắt buộc.
- **Provider**: Bên cung cấp dịch vụ (Service Provider) thực hiện xuất bản (expose) dịch vụ và đăng ký dịch vụ mình cung cấp lên Registry. Bắt buộc.
- **Consumer**: Bên tiêu thụ dịch vụ (Service Consumer) thực hiện gọi dịch vụ từ xa và đăng ký theo dõi (subscribe) các dịch vụ mình cần từ Registry. Bắt buộc.
- **Registry**: Trung tâm đăng ký dùng cho Service Registration và Service Discovery. Registry sẽ trả danh sách địa chỉ của Service Provider về cho Consumer. Không bắt buộc.
- **Monitor**: Trung tâm giám sát dùng để thống kê số lần gọi và thời gian gọi của dịch vụ. Service Consumer và Provider sẽ định kỳ gửi dữ liệu thống kê tới Monitor. Không bắt buộc.

### Bạn có nắm khái niệm `Invoker` trong Dubbo không?

`Invoker` là một khái niệm rất quan trọng trong mô hình miền (domain model) của Dubbo. Nếu bạn từng đọc mã nguồn của Dubbo, bạn sẽ bắt gặp nó vô số lần — ví dụ trong phần mã nguồn Load Balancing mà mình sắp nói bên dưới có rất nhiều bóng dáng của `Invoker`.

Nói một cách đơn giản, `Invoker` chính là lớp trừu tượng của Dubbo đối với lời gọi từ xa.

![dubbo_rpc_invoke.jpg](/media/jg/ext/oss.javaguide.cn/java-guide-blog/dubbo_rpc_invoke-32e1e208.jpg)

Theo cách gọi chính thức của Dubbo, `Invoker` được chia thành:

- Service Provider `Invoker` (`Invoker` bên cung cấp dịch vụ)
- Service Consumer `Invoker` (`Invoker` bên tiêu thụ dịch vụ)

Giả sử chúng ta cần gọi một phương thức từ xa, ta sẽ cần Dynamic Proxy để che giấu các chi tiết của lời gọi từ xa đúng không? Những chi tiết được che giấu này phụ thuộc vào triển khai `Invoker` tương ứng, và chính `Invoker` là thành phần thực thi lời gọi dịch vụ từ xa thực sự.

### Bạn có nắm nguyên lý hoạt động của Dubbo không?

Hình dưới đây thể hiện thiết kế tổng thể của Dubbo, được chia thành 10 tầng từ dưới lên trên, mỗi tầng đều có quan hệ phụ thuộc một chiều.

> Các interface nền xanh lam nhạt bên trái là dành cho Service Consumer; các interface nền xanh lục nhạt bên phải là dành cho Service Provider; các interface nằm trên trục giữa là những thành phần cả hai bên đều dùng.

![dubbo-framework](/media/jg/ext/oss.javaguide.cn/source-code/dubbo/dubbo-framework-2d522035.jpg)

- **config (Tầng cấu hình)**: Các cấu hình liên quan tới Dubbo. Hỗ trợ cấu hình bằng code lẫn cấu hình dựa trên Spring, lấy `ServiceConfig`, `ReferenceConfig` làm trung tâm.
- **proxy (Tầng Service Proxy)**: Chìa khóa giúp việc gọi phương thức từ xa đơn giản như gọi phương thức cục bộ; quá trình gọi thực tế phụ thuộc vào lớp Proxy, lấy `ServiceProxy` làm trung tâm.
- **registry (Tầng Service Registry)**: Đóng gói việc đăng ký và khám phá địa chỉ dịch vụ.
- **cluster (Tầng định tuyến / cụm)**: Đóng gói định tuyến (routing) và cân bằng tải giữa nhiều Provider, đồng thời làm cầu nối với Registry, lấy `Invoker` làm trung tâm.
- **monitor (Tầng giám sát)**: Giám sát số lần gọi và thời gian gọi RPC, lấy `Statistics` làm trung tâm.
- **protocol (Tầng gọi từ xa)**: Đóng gói lời gọi RPC, lấy `Invocation`, `Result` làm trung tâm.
- **exchange (Tầng trao đổi thông tin)**: Đóng gói mô hình request-response, chuyển đổi đồng bộ sang bất đồng bộ, lấy `Request`, `Response` làm trung tâm.
- **transport (Tầng truyền tải mạng)**: Trừu tượng hóa Mina và Netty thành interface thống nhất, lấy `Message` làm trung tâm.
- **serialize (Tầng Serialization dữ liệu)**: Thực hiện tuần tự hóa dữ liệu cần truyền tải qua mạng.

### Bạn có hiểu cơ chế SPI của Dubbo không? Làm thế nào để mở rộng các triển khai mặc định trong Dubbo?

Cơ chế SPI (Service Provider Interface) được sử dụng rất nhiều trong các dự án mã nguồn mở; nó giúp chúng ta tìm kiếm động các lớp triển khai của một dịch vụ/tính năng (chẳng hạn như chiến lược Load Balancing).

Nguyên lý cụ thể của SPI như sau: chúng ta đặt tên lớp triển khai của interface vào trong file cấu hình; trong quá trình chương trình chạy, ta đọc file cấu hình đó và dùng `Reflection` để nạp lớp triển khai. Nhờ vậy, trong lúc runtime ta có thể thay thế động lớp triển khai của interface — tương đồng với tư tưởng tách phụ thuộc (decoupling) của IoC.

Bản thân Java đã cung cấp sẵn cơ chế SPI. Tuy nhiên, Dubbo không dùng trực tiếp mà nâng cấp (enhance) cơ chế SPI nguyên bản của Java để đáp ứng tốt hơn nhu cầu của mình.

**Vậy chúng ta mở rộng triển khai mặc định trong Dubbo bằng cách nào?**

Chẳng hạn khi muốn tự triển khai chiến lược cân bằng tải của riêng mình, ta tạo lớp triển khai tương ứng `XxxLoadBalance` implements interface `LoadBalance` hoặc kế thừa lớp `AbstractLoadBalance`.

```java
package com.xxx;

import org.apache.dubbo.rpc.cluster.LoadBalance;
import org.apache.dubbo.rpc.Invoker;
import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.RpcException;

public class XxxLoadBalance implements LoadBalance {
    public <T> Invoker<T> select(List<Invoker<T>> invokers, Invocation invocation) throws RpcException {
        // ...
    }
}
```

Sau đó ta chỉ cần ghi đường dẫn của lớp triển khai này vào file `META-INF/dubbo/org.apache.dubbo.rpc.cluster.LoadBalance` nằm trong thư mục `resources`.

```java
src
 |-main
    |-java
        |-com
            |-xxx
                |-XxxLoadBalance.java (triển khai interface LoadBalance)
    |-resources
        |-META-INF
            |-dubbo
                |-org.apache.dubbo.rpc.cluster.LoadBalance (file văn bản thuần, nội dung: xxx=com.xxx.XxxLoadBalance)
```

`org.apache.dubbo.rpc.cluster.LoadBalance`

```plain
xxx=com.xxx.XxxLoadBalance
```

Còn rất nhiều điểm mở rộng khác mà bạn có thể tìm thấy trong [tài liệu chính thức](https://cn.dubbo.apache.org/zh-cn/overview/home/).

### Bạn có biết kiến trúc Microkernel của Dubbo không?

Dubbo áp dụng mô hình Microkernel + Plugin — nói ngắn gọn là kiến trúc vi nhân (Microkernel Architecture). Microkernel chỉ chịu trách nhiệm lắp ráp các plugin.

**Kiến trúc Microkernel là gì?** Cuốn sách *Software Architecture Patterns* (*Các mẫu kiến trúc phần mềm*) mô tả như sau:

> Mẫu kiến trúc Microkernel (đôi khi còn gọi là mẫu kiến trúc Plug-in) là một mẫu thiết kế tự nhiên để xây dựng các ứng dụng dạng sản phẩm đóng gói (product-based applications). Ứng dụng dạng sản phẩm là ứng dụng đã được đóng gói sẵn theo các phiên bản khác nhau và có thể tải về dưới dạng plugin bên thứ ba. Ngoài ra, nhiều công ty cũng phát triển và phát hành các ứng dụng nghiệp vụ nội bộ giống như phần mềm thương mại có số phiên bản, mô tả tính năng và có thể nạp theo dạng plugin (đây cũng là đặc trưng của mẫu này). Hệ thống Microkernel cho phép người dùng bổ sung thêm các tính năng mở rộng dưới dạng plugin vào ứng dụng cốt lõi, qua đó mang lại khả năng mở rộng và tách biệt chức năng.

Kiến trúc Microkernel gồm hai loại thành phần: **hệ thống cốt lõi (core system)** và **các module plugin (plug-in modules)**.

![](/media/jg/ext/oss.javaguide.cn/source-code/dubbo/.png-f25cef81.png)

Hệ thống cốt lõi cung cấp những năng lực lõi cần thiết của hệ thống, còn các module plugin giúp mở rộng tính năng cho hệ thống. Do đó, hệ thống dựa trên kiến trúc Microkernel rất dễ mở rộng chức năng.

Nhiều IDE quen thuộc với chúng ta đều có thể xem là được thiết kế theo kiến trúc Microkernel. Đại đa số các IDE như IDEA, VSCode đều cung cấp plugin để làm phong phú thêm tính năng của mình.

Chính nhờ Dubbo dựa trên kiến trúc Microkernel nên chúng ta có thể tùy ý thay thế các thành phần chức năng của Dubbo. Ví dụ nếu bạn thấy module Serialization mặc định của Dubbo chưa đáp ứng yêu cầu của mình — không sao cả! Bạn chỉ cần tự triển khai một module Serialization mới là được!

Thông thường, Microkernel sẽ dùng Factory, IoC, OSGi,... để quản lý vòng đời plugin. Dubbo không muốn phụ thuộc vào IoC container như Spring, cũng không muốn tự viết một IoC container thu nhỏ (vì như vậy là over-engineering), nên đã chọn cách Factory đơn giản nhất để quản lý plugin: **cơ chế mở rộng SPI chuẩn của JDK** (`java.util.ServiceLoader`).

### Một số câu hỏi tự kiểm tra về kiến trúc Dubbo

#### Vai trò của Service Registry là gì?

Registry chịu trách nhiệm đăng ký và tra cứu địa chỉ dịch vụ, đóng vai trò như một dịch vụ danh bạ (directory service); Service Provider và Consumer chỉ tương tác với Registry khi khởi động.

#### Khi Service Provider bị sập (crash), Registry sẽ làm gì?

Registry sẽ lập tức đẩy (push) sự kiện thông báo tới Consumer.

#### Vai trò của Monitor là gì?

Monitor chịu trách nhiệm thống kê số lần gọi, thời gian gọi,... của từng dịch vụ.

#### Nếu cả Registry và Monitor đều bị sập, các dịch vụ có chết theo hết không?

Không. Cả hai cùng sập cũng không ảnh hưởng đến các Provider và Consumer đang chạy, vì Consumer đã cache danh sách Provider ở cục bộ (local). Cả Registry và Monitor đều là thành phần tùy chọn (optional); Service Consumer có thể kết nối trực tiếp tới Service Provider.

## Các chiến lược Load Balancing của Dubbo

### Load Balancing là gì?

Trước tiên hãy xem định nghĩa tương đối chính thống. Đoạn dưới đây được trích từ định nghĩa về cân bằng tải trên Wikipedia:

> Cân bằng tải (Load Balancing) cải thiện việc phân phối khối lượng công việc (workload) trên nhiều tài nguyên tính toán (ví dụ: máy tính, cụm máy tính, liên kết mạng, CPU hoặc ổ đĩa). Cân bằng tải nhằm mục đích tối ưu hóa việc sử dụng tài nguyên, tối đa hóa thông lượng (throughput), giảm thiểu thời gian phản hồi và tránh quá tải cho bất kỳ tài nguyên đơn lẻ nào. Việc sử dụng nhiều thành phần kết hợp cân bằng tải thay vì một thành phần duy nhất có thể tăng độ tin cậy và tính sẵn sàng thông qua tính dự phòng (redundancy). Cân bằng tải thường liên quan đến phần mềm hoặc phần cứng chuyên dụng.

**Đoạn trên có thể hơi khó hiểu, mình sẽ giải thích lại bằng ngôn ngữ bình dân hơn cho các bạn.**

Khi một dịch vụ nào đó trong hệ thống của chúng ta có lượng truy cập rất lớn, chúng ta triển khai dịch vụ này lên nhiều server; khi Client gửi request, nhiều server đều có thể xử lý request đó. Lúc này, việc chọn đúng server nào để xử lý request trở nên cực kỳ quan trọng. Giả sử bạn chỉ dồn vào một server xử lý toàn bộ request của dịch vụ đó, thì ý nghĩa của việc triển khai lên nhiều server sẽ không còn nữa. Cân bằng tải sinh ra để tránh tình trạng một server duy nhất phải gánh cùng một loại request dẫn đến sập hoặc treo server — chỉ cần nhìn chữ "cân bằng tải" là ta đã thấy rõ ý nghĩa của nó.

### Dubbo cung cấp những chiến lược Load Balancing nào?

Khi cân bằng tải trên cụm (Cluster Load Balancing), Dubbo cung cấp nhiều chiến lược cân bằng tải khác nhau, mặc định là gọi ngẫu nhiên (`random`). Chúng ta cũng có thể tự mở rộng chiến lược Load Balancing riêng (tham khảo cơ chế SPI của Dubbo).

Trong Dubbo, tất cả các lớp triển khai Load Balancing đều kế thừa từ `AbstractLoadBalance` — lớp này triển khai interface `LoadBalance` và đóng gói một số logic dùng chung.

```java
public abstract class AbstractLoadBalance implements LoadBalance {

    static int calculateWarmupWeight(int uptime, int warmup, int weight) {
    }

    @Override
    public <T> Invoker<T> select(List<Invoker<T>> invokers, URL url, Invocation invocation) {
    }

    protected abstract <T> Invoker<T> doSelect(List<Invoker<T>> invokers, URL url, Invocation invocation);


    int getWeight(Invoker<?> invoker, Invocation invocation) {

    }
}
```

Các lớp con triển khai `AbstractLoadBalance` gồm những lớp sau:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210326105257812-3419eb17.png)

Tài liệu chính thức giới thiệu phần Load Balancing rất chi tiết, khuyến khích các bạn xem qua tại: [https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#m-zhdocsv27devsourceloadbalance](https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#m-zhdocsv27devsourceloadbalance).

#### RandomLoadBalance

Chọn ngẫu nhiên theo trọng số (triển khai thuật toán Weighted Random). Đây là chiến lược cân bằng tải mặc định được Dubbo sử dụng.

Nguyên lý triển khai cụ thể của `RandomLoadBalance` rất đơn giản: giả sử có hai server S1 và S2 cùng cung cấp một dịch vụ, trong đó trọng số của S1 là 7 và trọng số của S2 là 3.

Khi phân bổ các trọng số này lên trục tọa độ, ta được: `S1 -> [0, 7)` và `S2 -> [7, 10)`. Ta sinh một số ngẫu nhiên trong khoảng `[0, 10)`, số ngẫu nhiên rơi vào khoảng nào thì chọn server tương ứng để xử lý request.

![RandomLoadBalance](/media/jg/ext/oss.javaguide.cn/java-guide-blog/RandomLoadBalance-2a137e63.png)

Mã nguồn của `RandomLoadBalance` rất đơn giản, chỉ cần dành vài phút là đọc hiểu ngay.

> Mã nguồn dưới đây được lấy từ phiên bản 2.7.9 mới nhất trên nhánh `master` của Dubbo.

```java
public class RandomLoadBalance extends AbstractLoadBalance {

    public static final String NAME = "random";

    @Override
    protected <T> Invoker<T> doSelect(List<Invoker<T>> invokers, URL url, Invocation invocation) {

        int length = invokers.size();
        boolean sameWeight = true;
        int[] weights = new int[length];
        int totalWeight = 0;
        // Vòng lặp for này chủ yếu dùng để tính tổng trọng số totalWeight của tất cả các Provider của dịch vụ,
        // ngoài ra còn kiểm tra xem trọng số của các Provider có giống nhau hết hay không
        for (int i = 0; i < length; i++) {
            int weight = getWeight(invokers.get(i), invocation);
            totalWeight += weight;
            weights[i] = totalWeight;
            if (sameWeight && totalWeight != weight * (i + 1)) {
                sameWeight = false;
            }
        }
        if (totalWeight > 0 && !sameWeight) {
            // Sinh ngẫu nhiên một số trong khoảng [0, totalWeight)
            int offset = ThreadLocalRandom.current().nextInt(totalWeight);
            // Kiểm tra xem rơi vào khoảng của Service Provider nào
            for (int i = 0; i < length; i++) {
                if (offset < weights[i]) {
                    return invokers.get(i);
                }
            }

        return invokers.get(ThreadLocalRandom.current().nextInt(length));
    }

}

```

#### LeastActiveLoadBalance

`LeastActiveLoadBalance` dịch sát nghĩa là **cân bằng tải theo số lượng active ít nhất (Least Active)**.

Cái tên này đặt hơi khó hình dung; nếu không đọc kỹ định nghĩa chính thức về "số active" (active count), bạn sẽ hoàn toàn không hiểu nó dùng để làm gì.

Để mình giải thích thế này: ở trạng thái ban đầu, số active của tất cả Service Provider đều bằng 0 (mỗi phương thức cụ thể trên từng Service Provider đều tương ứng với một biến active riêng, mình sẽ nhắc tới trong phần mã nguồn ngay sau đây). Mỗi khi nhận một request, số active của Service Provider tương ứng tăng thêm 1 (`+1`), và khi xử lý xong request đó thì số active giảm đi 1 (`-1`).

Do đó, **Dubbo mặc định rằng Provider nào có số active càng nhỏ thì tốc độ xử lý càng nhanh, hiệu năng càng tốt, nên sẽ ưu tiên điều phối request tới cho Service Provider có số active nhỏ hơn xử lý.**

**Nếu có nhiều Service Provider có số active bằng nhau thì sao?**

Rất đơn giản, lúc đó lại chạy quy trình chọn giống như `RandomLoadBalance`.

```java
public class LeastActiveLoadBalance extends AbstractLoadBalance {

    public static final String NAME = "leastactive";

    @Override
    protected <T> Invoker<T> doSelect(List<Invoker<T>> invokers, URL url, Invocation invocation) {
        int length = invokers.size();
        int leastActive = -1;
        int leastCount = 0;
        int[] leastIndexes = new int[length];
        int[] weights = new int[length];
        int totalWeight = 0;
        int firstWeight = 0;
        boolean sameWeight = true;
        // Vòng lặp for này duyệt danh sách invokers để tìm ra các Invoker có số active nhỏ nhất.
        // Nếu có nhiều Invoker có cùng số active nhỏ nhất, nó còn ghi lại chỉ số (index) của các Invoker này trong danh sách invokers, cộng dồn trọng số và so sánh xem trọng số của chúng có bằng nhau không.
        for (int i = 0; i < length; i++) {
            Invoker<T> invoker = invokers.get(i);
            // Lấy số active tương ứng với invoker
            int active = RpcStatus.getStatus(invoker.getUrl(), invocation.getMethodName()).getActive();
            int afterWarmup = getWeight(invoker, invocation);
            weights[i] = afterWarmup;
            if (leastActive == -1 || active < leastActive) {
                leastActive = active;
                leastCount = 1;
                leastIndexes[0] = i;
                totalWeight = afterWarmup;
                firstWeight = afterWarmup;
                sameWeight = true;
            } else if (active == leastActive) {
                leastIndexes[leastCount++] = i;
                totalWeight += afterWarmup;
                if (sameWeight && afterWarmup != firstWeight) {
                    sameWeight = false;
                }
            }
        }
       // Nếu chỉ có duy nhất một Invoker có số active nhỏ nhất thì trả về trực tiếp Invoker đó
        if (leastCount == 1) {
            return invokers.get(leastIndexes[0]);
        }
        // Nếu có nhiều Invoker có cùng số active nhỏ nhất nhưng trọng số giữa chúng khác nhau,
        // cách xử lý ở đây giống hệt như RandomLoadBalance
        if (!sameWeight && totalWeight > 0) {
            int offsetWeight = ThreadLocalRandom.current().nextInt(totalWeight);
            for (int i = 0; i < leastCount; i++) {
                int leastIndex = leastIndexes[i];
                offsetWeight -= weights[leastIndex];
                if (offsetWeight < 0) {
                    return invokers.get(leastIndex);
                }
            }
        }
        return invokers.get(leastIndexes[ThreadLocalRandom.current().nextInt(leastCount)]);
    }
}

```

Số active được lưu thông qua một `ConcurrentMap` trong `RpcStatus`. Dựa vào URL và tên phương thức được gọi của Service Provider, ta có thể lấy ra được số active tương ứng — điều này có nghĩa là số active của từng phương thức trên một Service Provider hoàn toàn độc lập với nhau.

```java
public class RpcStatus {

    private static final ConcurrentMap<String, ConcurrentMap<String, RpcStatus>> METHOD_STATISTICS =
            new ConcurrentHashMap<String, ConcurrentMap<String, RpcStatus>>();

   public static RpcStatus getStatus(URL url, String methodName) {
        String uri = url.toIdentityString();
        ConcurrentMap<String, RpcStatus> map = METHOD_STATISTICS.computeIfAbsent(uri, k -> new ConcurrentHashMap<>());
        return map.computeIfAbsent(methodName, k -> new RpcStatus());
    }
    public int getActive() {
        return active.get();
    }

}
```

#### ConsistentHashLoadBalance

Chắc hẳn các bạn cũng không xa lạ gì với `ConsistentHashLoadBalance`, chiến lược cân bằng tải này được dùng rất phổ biến trong tách database/tách bảng (sharding) và nhiều loại cụm (cluster) khác nhau.

`ConsistentHashLoadBalance` chính là **chiến lược cân bằng tải Consistent Hash (băm nhất quán)**. Trong `ConsistentHashLoadBalance` không có khái niệm trọng số; Service Provider nào sẽ xử lý request được quyết định bởi tham số của request, tức là các request có cùng tham số sẽ luôn được gửi tới cùng một Service Provider.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/consistent-hash-data-incline-c077116d.jpg)

Ngoài ra, để tránh tình trạng lệch dữ liệu — data skew (các node phân bố không đủ đều, khiến lượng lớn request đổ dồn vào cùng một node), Dubbo còn đưa vào khái niệm node ảo (virtual node). Thông qua các node ảo, các node được phân tán đều hơn, giúp cân bằng hiệu quả lượng request giữa từng node.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/consistent-hash-invoker-96b945c2.jpg)

Tài liệu chính thức có bài phân tích mã nguồn rất chi tiết: [https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#23-consistenthashloadbalance](https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#23-consistenthashloadbalance). Ngoài ra còn có một [PR#5440](https://github.com/apache/dubbo/pull/5440) liên quan để sửa một số bug tồn tại trong `ConsistentHashLoadBalance` ở phiên bản cũ. Nếu quan tâm, các bạn có thể dành thêm thời gian nghiên cứu kỹ hơn. Ở đây mình không phân tích sâu nữa, phần bài tập này xin nhường lại cho các bạn!

#### RoundRobinLoadBalance

Cân bằng tải xoay vòng có trọng số (Weighted Round-Robin).

Xoay vòng (Round-Robin) là phân phối request lần lượt cho từng Service Provider. Xoay vòng có trọng số (Weighted Round-Robin) dựa trên cơ chế xoay vòng để điều phối nhiều request hơn tới những Service Provider có trọng số lớn hơn. Ví dụ, giả sử có hai server S1 và S2 cùng cung cấp một dịch vụ, trong đó trọng số của S1 là 7 và trọng số của S2 là 3.

Nếu chúng ta có 10 request, thì 7 request sẽ do S1 xử lý và 3 request do S2 xử lý.

Ngược lại, nếu dùng `RandomLoadBalance`, rất có thể xảy ra trường hợp trong 10 request có tới 9 request bị đẩy sang S1 xử lý (vấn đề mang tính xác suất).

Mã nguồn triển khai `RoundRobinLoadBalance` trong Dubbo đã được chỉnh sửa và viết lại nhiều lần; từ phiên bản Dubbo-2.6.5, `RoundRobinLoadBalance` sử dụng thuật toán Smooth Weighted Round-Robin (xoay vòng có trọng số mượt).

## Giao thức Serialization trong Dubbo

### Dubbo hỗ trợ những phương thức Serialization nào?

![Các giao thức Serialization mà Dubbo hỗ trợ](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/watermark-type_ZmFuZ3poZW5naGVpdGk-shadow_10-tex-fad891d9.png)

Dubbo hỗ trợ nhiều phương thức tuần tự hóa (`Serialization`): JDK Serialization tích hợp sẵn, hessian2, JSON, Kryo, FST, Protostuff, ProtoBuf,...

Phương thức Serialization mặc định của Dubbo là **hessian2**.

### Hãy chia sẻ hiểu biết của bạn về các giao thức Serialization này?

Thông thường chúng ta sẽ không dùng trực tiếp cơ chế Serialization tích hợp sẵn của JDK, chủ yếu vì hai lý do:

1. **Không hỗ trợ gọi đa ngôn ngữ (cross-language)**: Nếu gọi tới dịch vụ được viết bằng ngôn ngữ lập trình khác thì sẽ không tương thích.
2. **Hiệu năng kém**: So với các framework Serialization khác thì hiệu năng thấp hơn, nguyên nhân chính là kích thước mảng byte sau khi tuần tự hóa khá lớn, làm tăng chi phí truyền tải qua mạng.

JSON Serialization do vấn đề về hiệu năng nên thông thường chúng ta cũng ít cân nhắc sử dụng.

Những phương thức như Protostuff, ProtoBuf, hessian2 đều là Serialization đa ngôn ngữ; nếu có nhu cầu giao tiếp đa ngôn ngữ thì có thể cân nhắc sử dụng.

Hai phương thức Kryo và FST được Dubbo đưa vào sau này và có hiệu năng rất tốt. Tuy nhiên, cả hai đều chỉ dành riêng cho ngôn ngữ Java. Một bài viết trên trang chủ Dubbo từng khuyến nghị sử dụng Kryo làm phương thức Serialization cho môi trường production.

Trong tài liệu chính thức của Dubbo cũng có [biểu đồ so sánh hiệu năng các giao thức Serialization](https://dubbo.apache.org/zh/docs/v2.7/user/serialization/#m-zhdocsv27userserialization) để tham khảo.

![So sánh hiệu năng các giao thức Serialization](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/dubbo-serialization-protocol-performance-compari-bb34673b.png)
