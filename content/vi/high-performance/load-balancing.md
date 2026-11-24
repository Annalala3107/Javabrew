---
title: "Giải thích chi tiết nguyên lý và thuật toán Cân bằng tải (Load Balancing)"
description: "Bài viết giải thích chuyên sâu nguyên lý cốt lõi của Cân bằng tải (Load Balancing), bao gồm sự khác biệt giữa Cân bằng tải Layer 4 và Layer 7, so sánh Server-side và Client-side Load Balancing, phân tích các thuật toán phổ biến như Round-Robin, Weighted Round-Robin, Random, Consistent Hashing cùng các giải pháp triển khai tiêu biểu như Nginx và LVS."
category: Hiệu năng cao (High Performance)
head:
  - - meta
    - name: keywords
      content: Cân bằng tải,Load Balancing,Cân bằng tải Layer 4,Cân bằng tải Layer 7,Nginx Load Balancing,LVS,Thuật toán cân bằng tải,Round Robin,Consistent Hashing,Client-Side Load Balancing
lang: vi
sourceRef: zh-ref/high-performance/load-balancing.md
---

## Cân bằng tải (Load Balancing) là gì?

**Cân bằng tải (Load Balancing)** là việc phân bổ các request của người dùng sang nhiều server khác nhau để xử lý, nhằm nâng cao năng lực xử lý đồng thời (concurrency) cũng như độ tin cậy tổng thể của hệ thống. Dịch vụ Cân bằng tải có thể được thực hiện bởi phần mềm hoặc phần cứng chuyên dụng; thông thường phần cứng cho hiệu năng cao hơn còn phần mềm có chi phí rẻ hơn nhiều (sẽ trình bày chi tiết ở phần sau).

Hình dưới đây được trích từ một bài viết trong chương "Xử lý đồng thời cao" của [*Cẩm nang phỏng vấn Java*](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247519384&idx=1&sn=bc7e71af75350b755f04ca4178395b1a&chksm=cea1c353f9d64a458f797696d4144b4d6e58639371a4612b8e4d106d83a66d2289e7b2cd7431&token=660789642&lang=zh_CN&scene=21#wechat_redirect). Có thể thấy từ hình vẽ, dịch vụ sản phẩm (Product Service) của hệ thống được triển khai thành nhiều bản sao trên các server khác nhau; để điều phối phân luồng request truy cập dịch vụ sản phẩm, chúng ta sử dụng Cân bằng tải.

![Nhiều Service Instance - Cân bằng tải](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/multi-service-load-balancing.drawio-ff318ce3.png)

Cân bằng tải là một giải pháp rất phổ biến và tương đối dễ triển khai để tăng khả năng xử lý đồng thời và độ tin cậy của hệ thống; dù là hệ thống nguyên khối (Monolith) hay kiến trúc Microservices thì hầu như đều sử dụng đến nó.

Tuy nhiên, Cân bằng tải chỉ giải quyết bài toán "phân tán request ra nhiều node", chứ không tự động xử lý được các điểm nghẽn nghiệp vụ như slow SQL, cạn kiệt Thread Pool, Cache Breakdown hay API hạ nguồn bị chậm. Nếu toàn bộ các node backend đều chậm, Cân bằng tải chỉ chia đều các request chậm đó ra chứ không thể làm hệ thống nhanh lên một cách thần kỳ.

## Cân bằng tải được chia thành những loại nào?

Cân bằng tải (Load Balancing) có thể chia đơn giản thành hai loại là **Cân bằng tải phía Server (Server-side Load Balancing)** và **Cân bằng tải phía Client (Client-side Load Balancing)**.

Cân bằng tải phía Server liên quan đến nhiều kiến thức hơn và cũng thường gặp hơn trong thực tế công việc, nên bài viết sẽ dành nhiều thời lượng hơn để giới thiệu phần này.

### Cân bằng tải phía Server (Server-side Load Balancing)

**Cân bằng tải phía Server** chủ yếu được đặt giữa **request từ bên ngoài hệ thống** và **tầng Gateway**, có thể triển khai bằng **phần mềm** hoặc **phần cứng**.

Dưới đây là sơ đồ đơn giản về Cân bằng tải phía Server dựa trên Nginx do tôi vẽ:

![Cân bằng tải phía Server dựa trên Nginx](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/server-load-balancing-00788c20.png)

**Cân bằng tải phần cứng** sử dụng các thiết bị phần cứng chuyên dụng (như **F5, A10, Array**) để thực hiện chức năng Cân bằng tải.

Ưu điểm của Cân bằng tải phần cứng là hiệu năng rất mạnh và cực kỳ ổn định, nhưng nhược điểm là quá đắt đỏ. Một thiết bị F5 bản cơ bản thấp nhất cũng phải hơn 200.000 NDT, phần lớn các công ty không thể gánh nổi chi phí này; nếu lưu lượng nghiệp vụ không quá khổng lồ thì thực sự không cần tốn tiền mua phần cứng làm Cân bằng tải, dùng phần mềm là quá đủ rồi!

Trong công việc hàng ngày, chúng ta thường ít khi tiếp xúc trực tiếp với Cân bằng tải phần cứng, mà gặp nhiều nhất vẫn là **Cân bằng tải phần mềm**. Cân bằng tải phần mềm dùng các phần mềm (như **LVS, Nginx, HAProxy**) để điều phối tải; hiệu năng tuy có kém hơn phần cứng một chút nhưng giá thành rẻ hơn rất nhiều! Một server Linux cấu hình cơ bản chỉ tốn vài nghìn NDT, còn máy tầm 20.000–30.000 NDT đã có hiệu năng rất tốt rồi.

Dựa theo mô hình OSI, Cân bằng tải phía Server còn có thể phân thành:

- Cân bằng tải Layer 2
- Cân bằng tải Layer 3
- Cân bằng tải Layer 4
- Cân bằng tải Layer 7

Phổ biến nhất là Cân bằng tải Layer 4 và Layer 7, nên bài viết này cũng tập trung trình bày hai loại này.

> Trang chủ của Nginx có giới thiệu rất chi tiết về Cân bằng tải Layer 4 và Layer 7, bạn nào quan tâm có thể tham khảo thêm:
>
> - [What Is Layer 4 Load Balancing?](https://www.nginx.com/resources/glossary/layer-4-load-balancing/)
> - [What Is Layer 7 Load Balancing?](https://www.nginx.com/resources/glossary/layer-7-load-balancing/)

![Mô hình OSI 7 tầng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-7-model-955bfdf5.png)

- **Cân bằng tải Layer 4 (Layer 4 Load Balancing)** hoạt động ở tầng thứ 4 của mô hình OSI, tức tầng Giao vận (Transport Layer), nơi các giao thức chính là TCP/UDP. Ở tầng này, thiết bị cân bằng tải có thể nhìn thấy địa chỉ IP và port nguồn/đích trong gói tin, rồi dựa vào thông tin đó cùng thuật toán cân bằng tải để chuyển tiếp gói tin tới Real Server ở backend. Nói cách khác, cốt lõi của Cân bằng tải Layer 4 là cân bằng ở mức IP + Port, không đụng chạm đến nội dung cụ thể của bản tin.
- **Cân bằng tải Layer 7 (Layer 7 Load Balancing)** hoạt động ở tầng thứ 7 của mô hình OSI, tức tầng Ứng dụng (Application Layer), nơi giao thức chính là HTTP. Cách định tuyến request mạng ở tầng này phức tạp hơn Layer 4: nó sẽ đọc phần dữ liệu nội dung của bản tin (ví dụ phần nội dung của bản tin HTTP), sau đó dựa vào nội dung đọc được (như URL, Cookie) để đưa ra quyết định cân bằng tải. Nói cách khác, cốt lõi của Cân bằng tải Layer 7 là cân bằng ở mức nội dung bản tin (URL, Cookie...), và thiết bị thực hiện Cân bằng tải Layer 7 thường được gọi là **Reverse Proxy Server (máy chủ proxy ngược)**.

Cân bằng tải Layer 7 tiêu tốn nhiều hiệu năng xử lý hơn Layer 4, nhưng bù lại linh hoạt hơn nhiều, có thể định tuyến request thông minh hơn và thực hiện các tối ưu theo nội dung như Cache, nén dữ liệu (compression) và mã hóa.

Nói ngắn gọn: **Cân bằng tải Layer 4 có hiệu năng rất mạnh, còn Cân bằng tải Layer 7 có tính năng mạnh hơn!** Tuy nhiên, đối với phần lớn kịch bản nghiệp vụ hiện nay, sự chênh lệch hiệu năng giữa Layer 4 và Layer 7 gần như không đáng kể.

Khi lựa chọn thực tế, có thể cân nhắc theo bảng sau:

| Tiêu chí so sánh | Cân bằng tải Layer 4                     | Cân bằng tải Layer 7                              |
| ---------------- | ---------------------------------------- | ------------------------------------------------- |
| Tầng hoạt động   | TCP/UDP                                  | HTTP/HTTPS                                        |
| Căn cứ chuyển tiếp | IP, Port                               | Tên miền, đường dẫn (Path), Header, Cookie        |
| Chi phí hiệu năng | Thấp hơn                                | Cao hơn                                           |
| Tính linh hoạt   | Kém hơn                                  | Mạnh hơn                                          |
| Kịch bản điển hình | Cổng lưu lượng lớn, Database Proxy, dịch vụ TCP | API Gateway, Reverse Proxy, Canary Release, định tuyến theo Path |

Nếu chỉ đơn thuần chuyển tiếp lưu lượng TCP thì Layer 4 đi thẳng và gọn hơn; còn nếu cần định tuyến theo URL, Header, Cookie hoặc cần nén dữ liệu, Cache, kết thúc TLS (TLS Termination) thì Layer 7 phù hợp hơn.

Đoạn trích dưới đây được lấy từ bài viết chính thức của Nginx [What Is Layer 4 Load Balancing?](https://www.nginx.com/resources/glossary/layer-4-load-balancing/):

> Layer 4 load balancing was a popular architectural approach to traffic handling when commodity hardware was not as powerful as it is now, and the interaction between clients and application servers was much less complex. It requires less computation than more sophisticated load balancing methods (such as Layer 7), but CPU and memory are now sufficiently fast and cheap that the performance advantage for Layer 4 load balancing has become negligible or irrelevant in most situations.
>
> Cân bằng tải Layer 4 từng là một phương pháp kiến trúc xử lý lưu lượng phổ biến vào thời điểm phần cứng thương mại chưa mạnh mẽ như ngày nay và tương tác giữa client với application server còn đơn giản. Nó đòi hỏi ít tính toán hơn so với các phương pháp cân bằng tải tinh vi hơn (như Layer 7), nhưng CPU và bộ nhớ hiện nay đã đủ nhanh và rẻ đến mức lợi thế về hiệu năng của cân bằng tải Layer 4 trong hầu hết các trường hợp đã trở nên không đáng kể hoặc không còn quan trọng nữa.

Trong thực tế công việc, chúng ta thường dùng **Nginx** để làm Cân bằng tải Layer 7, còn **LVS** (Linux Virtual Server — cân bằng tải Layer 4 tích hợp trong nhân Linux) để làm Cân bằng tải Layer 4.

Về các kiến thức thường gặp của Nginx, [*Cẩm nang phỏng vấn Java*](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) trong mục "Câu hỏi phỏng vấn kỹ thuật" đã tổng hợp sẵn, bạn nào quan tâm có thể xem thêm.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220328105759300-ce19b4b7.png)

Tuy vậy, phần lớn các công ty thực tế không cần dùng đến LVS — chỉ các tập đoàn lớn như Alibaba, Baidu, Tencent, eBay mới hay sử dụng, còn phổ biến nhất vẫn là Nginx.

### Cân bằng tải phía Client (Client-side Load Balancing)

**Cân bằng tải phía Client** chủ yếu được áp dụng giữa các service nội bộ bên trong hệ thống và có thể triển khai bằng các thư viện Cân bằng tải có sẵn.

Trong Cân bằng tải phía Client, phía Client tự duy trì một danh sách địa chỉ các server; trước khi gửi request, Client sẽ dựa theo thuật toán cân bằng tải tương ứng để chọn một server cụ thể xử lý request đó.

Bộ Cân bằng tải phía Client chạy trong cùng một tiến trình (tức cùng chương trình Java) với service gọi, nên không phát sinh thêm chi phí qua một chặng mạng trung gian. Tuy nhiên, việc triển khai Cân bằng tải phía Client bị phụ thuộc vào ngôn ngữ lập trình — ví dụ Spring Cloud Load Balancer chỉ dùng được cho ngôn ngữ Java.

Các framework Microservices phổ biến trong hệ sinh thái Java như Dubbo, Spring Cloud đều tích hợp sẵn Cân bằng tải phía Client dùng được ngay. Dubbo mặc định có sẵn tính năng Cân bằng tải, còn Spring Cloud cung cấp thông qua các component tùy chọn, phổ biến nhất là Spring Cloud Load Balancer (chính chủ, khuyến nghị dùng) và Ribbon (Netflix, đã bị ngừng phát triển / deprecated).

Dưới đây là sơ đồ đơn giản về Cân bằng tải phía Client dựa trên Spring Cloud Load Balancer (Ribbon cũng tương tự):

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/spring-cloud-lb-gateway-382ba3b4.png)

## Các thuật toán Cân bằng tải thường gặp là gì?

### Thuật toán Ngẫu nhiên (Random)

**Ngẫu nhiên (Random)** là thuật toán Cân bằng tải đơn giản và trực tiếp nhất.

Nếu không cấu hình trọng số (weight), xác suất được truy cập của mọi server đều như nhau. Nếu có cấu hình trọng số, server nào có trọng số càng cao thì xác suất được chọn càng lớn.

Thuật toán Random không trọng số phù hợp với cụm server có cấu hình tương đương nhau, mỗi server gánh tải như nhau. Weighted Random (ngẫu nhiên có trọng số) phù hợp với cụm server có cấu hình chênh lệch, giúp phân phối request hợp lý hơn nhờ trọng số.

Tuy nhiên, thuật toán Random có một nhược điểm khá rõ: một số máy có thể không được chọn trong một khoảng thời gian nhất định; xét cho cùng đây là thuật toán xác suất, kể cả khi trọng số bằng nhau vẫn có khả năng xảy ra tình huống này.

Thế nên thuật toán **Round-Robin** ra đời!

### Thuật toán Xoay vòng (Round-Robin)

Round-Robin là lần lượt xoay vòng qua từng server để xử lý request, và cũng có thể thiết lập trọng số.

Nếu không cấu hình trọng số, mỗi request sẽ được phân bổ tuần tự theo thời gian tới từng server khác nhau. Nếu có trọng số, server có trọng số càng cao sẽ được gọi càng nhiều lần.

Round-Robin không trọng số phù hợp với cụm server có hiệu năng tương đồng. Weighted Round-Robin phù hợp với cụm server có hiệu năng không đồng đều, giúp việc phân bổ request hợp lý hơn nhờ trọng số.

Trên nền tảng Weighted Round-Robin, còn có những phiên bản cải tiến sâu hơn như **Smooth Weighted Round-Robin** (xoay vòng có trọng số mượt).

Smooth Weighted Round-Robin được triển khai sớm nhất trong Nginx, có thể tham khảo commit này: <https://github.com/phusion/nginx/commit/27e94984486058d73157038f7950a0a36ecc6e35>. Nếu tìm hiểu kỹ chiến lược Cân bằng tải của Dubbo, bạn sẽ thấy Weighted Round-Robin của Dubbo đã tham khảo thuật toán này và tiếp tục tối ưu thêm.

![Thuật toán Cân bằng tải Weighted Round-Robin của Dubbo](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/dubbo-round-robin-load-balance-15f096cd.png)

### Thuật toán Hai lần ngẫu nhiên (Power of Two Random Choices)

Thuật toán này mở rộng từ thuật toán Random bằng cách chọn ngẫu nhiên thêm một lần nữa để lấy ra 2 server ứng viên, sau đó căn cứ vào tình trạng tải của hai server này để chọn ra server phù hợp nhất.

Ưu điểm của phương pháp hai lần ngẫu nhiên là có thể điều tiết tải của các node backend một cách linh động, giúp phân bổ cân bằng hơn. Nếu chỉ dùng một lần ngẫu nhiên, rất dễ xảy ra cảnh một số server bị quá tải trong khi server khác lại nhàn rỗi.

### Thuật toán Băm (Hashing)

Chuyển đổi thông tin tham số của request qua một hàm băm (Hash Function) thành giá trị hash, rồi dựa vào giá trị hash đó để quyết định request sẽ do server nào xử lý.

Khi số lượng server không đổi, các request có cùng tham số luôn được gửi đến cùng một server xử lý — ví dụ các request từ cùng một IP hoặc cùng một người dùng.

### Thuật toán Băm nhất quán (Consistent Hashing)

Tương tự Hashing thông thường, Consistent Hashing cũng giúp các request có cùng tham số luôn rơi vào cùng một server. Tuy nhiên, nó giải quyết được hạn chế lớn của Hashing truyền thống.

Với Hashing truyền thống, khi số lượng server thay đổi, giá trị hash sẽ ánh xạ lại sang các server khác hoàn toàn, đi ngược lại mục đích ban đầu của việc dùng Hashing. Tư tưởng cốt lõi của Consistent Hashing là ánh xạ cả dữ liệu lẫn node server lên một vòng tròn băm (Hash Ring), sau đó theo chiều kim đồng hồ xác định dữ liệu hoặc request thuộc về node nào. Khi thêm hoặc xóa server, chỉ ảnh hưởng đến vùng hash của node đó chứ không làm toàn bộ cụm phải phân phối lại khóa hash.

### Thuật toán Ít kết nối nhất (Least Connections)

Khi có request mới xuất hiện, thuật toán duyệt qua danh sách node server và chọn server đang có số lượng kết nối ít nhất để phản hồi request đó. Trường hợp nhiều node có số kết nối bằng nhau, có thể chọn ngẫu nhiên theo trọng số.

Least Connections dựa trên giả định lý tưởng rằng server càng nhiều kết nối thì tải càng cao. Tuy nhiên, thực tế số lượng kết nối không đại diện hoàn toàn cho tải thực sự của server: có kết nối tiêu tốn rất nhiều tài nguyên hệ thống, trong khi có kết nối gần như không tốn tài nguyên.

### Thuật toán Ít hoạt động nhất (Least Active)

Least Active tương tự Least Connections nhưng khoa học hơn. Least Active lấy số lượng kết nối đang hoạt động (active requests — có thể hiểu là số request đang được xử lý tại thời điểm hiện tại) làm tiêu chuẩn. Số active càng thấp chứng tỏ năng lực xử lý còn trống càng mạnh, từ đó giúp server khỏe xử lý được nhiều request hơn. Khi số active bằng nhau, có thể kết hợp chọn ngẫu nhiên có trọng số.

### Thuật toán Thời gian phản hồi nhanh nhất (Shortest Response Time)

Khác với Least Connections và Least Active, Shortest Response Time lấy thời gian phản hồi làm tiêu chí chọn server xử lý. Phía Client sẽ duy trì số liệu thời gian phản hồi của từng server, và mỗi lần gửi request sẽ chọn server có thời gian phản hồi ngắn nhất (trường hợp bằng nhau có thể chọn ngẫu nhiên có trọng số).

Thuật toán này giúp request được xử lý nhanh hơn, nhưng có thể gây ra tình trạng lưu lượng đổ dồn quá mức vào các server hiệu năng cao.

## Cân bằng tải Layer 7 có thể triển khai như thế nào?

Giới thiệu ngắn gọn hai giải pháp Cân bằng tải Layer 7 thường dùng trong dự án thực tế: Phân giải DNS và Reverse Proxy.

Ngoài hai giải pháp này, HTTP Redirect cũng có thể dùng để làm Cân bằng tải, nhưng xét về mức độ phổ biến và khuyến nghị sử dụng thì vẫn là Phân giải DNS và Reverse Proxy.

### Phân giải DNS (DNS Resolution)

Phân giải DNS là cách triển khai Cân bằng tải Layer 7 xuất hiện khá sớm và cực kỳ đơn giản.

Nguyên lý của nó là: cấu hình nhiều địa chỉ IP cho cùng một bản ghi tên miền trên máy chủ DNS, mỗi IP tương ứng với một server khác nhau. Khi người dùng truy vấn tên miền, máy chủ DNS dùng thuật toán xoay vòng (Round-Robin) trả về các IP lần lượt, qua đó đạt được Cân bằng tải dạng xoay vòng.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/6997605302452f07e8b28d257d349bf0-ed281abd.png)

Hầu hết các dịch vụ DNS hiện nay đều hỗ trợ cấu hình trọng số cho từng IP, giúp phân bổ request hợp lý hơn trên cụm server có cấu hình không đồng đều. Ví dụ như Alibaba Cloud DNS cũng hỗ trợ thiết lập trọng số này.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/aliyun-dns-weight-setting-5dd72ad3.png)

### Proxy ngược (Reverse Proxy)

Client gửi request tới máy chủ Reverse Proxy, Reverse Proxy sẽ chọn server đích, lấy dữ liệu rồi trả lại cho Client. Bên ngoài chỉ lộ địa chỉ của Reverse Proxy, còn địa chỉ IP thật của backend server được che giấu. Reverse Proxy đóng vai trò "đại diện" cho server đích một cách hoàn toàn minh bạch đối với Client.

Nginx là Reverse Proxy Server phổ biến nhất hiện nay; nó phân bổ đều các request từ Client tới toàn bộ server trong cụm theo các quy tắc nhất định (chiến lược Cân bằng tải).

Cân bằng tải bằng Reverse Proxy cũng thuộc Cân bằng tải Layer 7.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/nginx-load-balance-b7de5ca7.png)

### Kiểm tra sức khỏe (Health Check) và Rút lưu lượng (Traffic Draining)

Khi Cân bằng tải vận hành thực tế trên production, Health Check còn quan trọng hơn cả bản thân thuật toán. Thuật toán quyết định "khi bình thường chia tải thế nào", còn Health Check quyết định "node bất thường có được tiếp tục nhận lưu lượng nữa hay không".

Các cách Health Check phổ biến:

- **TCP Check**: Chỉ cần kết nối được tới port là coi như node khả dụng; phù hợp cho Cân bằng tải Layer 4, nhưng không đánh giá được nghiệp vụ bên trong có thực sự hoạt động ổn hay không.
- **HTTP Check**: Định kỳ gọi tới các endpoint như `/health`, `/actuator/health`, dựa vào mã trạng thái (status code) và nội dung phản hồi để phán đoán node có khả dụng hay không.
- **Business Readiness Probe**: Kiểm tra trạng thái các thành phần then chốt như Database, Cache, service phụ thuộc; phù hợp cho luồng cốt lõi, nhưng logic thăm dò không được quá nặng nề.

Trên môi trường production, nên cấu hình cơ chế làm nóng (warm-up) và rút lưu lượng (draining) cho node backend. Khi một node mới vừa khởi động, JIT, Connection Pool và Cache đều chưa nóng; nếu đổ thẳng toàn bộ lưu lượng vào rất dễ gây giật lag (latency spike). Khi hạ node (scale in / bảo trì), cũng cần ngừng cấp request mới trước, rồi chờ các request đang chạy dở xử lý xong xuôi mới tắt hẳn.

## Cân bằng tải phía Client thường được triển khai như thế nào?

Như đã nói ở trên, Cân bằng tải phía Client có thể triển khai bằng các component Cân bằng tải có sẵn.

**Netflix Ribbon** và **Spring Cloud Load Balancer** là hai component Cân bằng tải phổ biến nhất trong hệ sinh thái Java hiện nay.

Ribbon là component kỳ cựu do Netflix phát triển, tính năng khá toàn diện và hỗ trợ nhiều chiến lược Cân bằng tải. Spring Cloud Load Balancer là giải pháp chính thức do Spring phát triển để thay thế Ribbon, tính năng gọn nhẹ hơn và số lượng chiến lược hỗ trợ cũng ít hơn.

7 chiến lược Cân bằng tải mà Ribbon hỗ trợ:

- `RandomRule`: Chiến lược ngẫu nhiên.
- `RoundRobinRule` (mặc định): Chiến lược xoay vòng.
- `WeightedResponseTimeRule`: Chiến lược trọng số (quyết định trọng số dựa trên thời gian phản hồi).
- `BestAvailableRule`: Chiến lược ít kết nối nhất.
- `RetryRule`: Chiến lược thử lại (lấy service theo kiểu xoay vòng; nếu Service Instance lấy được là `null` hoặc đã hỏng thì liên tục thử lại trong khoảng thời gian quy định; quá thời gian mà vẫn không lấy được thì trả về `null`).
- `AvailabilityFilteringRule`: Chiến lược lọc theo tính khả dụng (lọc bỏ các instance không khỏe mạnh trước, sau đó chọn instance có số kết nối nhỏ hơn).
- `ZoneAvoidanceRule`: Chiến lược nhạy cảm theo vùng / Zone (chọn Service Instance dựa trên hiệu năng của Zone chứa service và tính khả dụng của service).

2 chiến lược Cân bằng tải mặc định mà Spring Cloud Load Balancer hỗ trợ:

- `RandomLoadBalancer`: Chiến lược ngẫu nhiên.
- `RoundRobinLoadBalancer` (mặc định): Chiến lược xoay vòng.

```java
public class CustomLoadBalancerConfiguration {

    @Bean
    ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new RandomLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),
                name);
    }
}
```

Tuy nhiên, các chiến lược Cân bằng tải mà Spring Cloud Load Balancer hỗ trợ thực chất không chỉ dừng lại ở hai loại trên: các lớp triển khai của `ServiceInstanceListSupplier` cũng có thể giúp nó hỗ trợ các chiến lược tương tự như Ribbon. Tính năng này được hoàn thiện dần về sau — nếu không đọc tài liệu chính thức thì rất khó biết được, thế mới thấy việc đọc official docs quan trọng đến mức nào!

Sau đây là hai ví dụ từ tài liệu chính thức:

- `ZonePreferenceServiceInstanceListSupplier`: Triển khai Cân bằng tải ưu tiên theo Zone (vùng).
- `HintBasedServiceInstanceListSupplier`: Triển khai Cân bằng tải dựa trên Hint.

```java
public class CustomLoadBalancerConfiguration {
    // Sử dụng phương pháp Cân bằng tải ưu tiên theo Zone (vùng)
    @Bean
    public ServiceInstanceListSupplier discoveryClientServiceInstanceListSupplier(
            ConfigurableApplicationContext context) {
        return ServiceInstanceListSupplier.builder()
                    .withDiscoveryClient()
                    .withZonePreference()
                    .withCaching()
                    .build(context);
    }
}
```

Để xem giới thiệu chi tiết và cập nhật hơn về Spring Cloud Load Balancer, bạn nên đọc tài liệu chính thức: <https://docs.spring.io/spring-cloud-commons/docs/current/reference/html/#spring-cloud-loadbalancer> — mọi thông tin hãy lấy tài liệu chính thức làm chuẩn.

Chiến lược Round-Robin cơ bản đáp ứng được nhu cầu của đại đa số dự án, nên trong dự án thực tế nếu không có yêu cầu đặc biệt thì thường dùng luôn Round-Robin mặc định. Ngoài ra, cả Ribbon lẫn Spring Cloud Load Balancer đều hỗ trợ tùy chỉnh chiến lược Cân bằng tải (Custom Strategy).

Theo khuyến nghị cá nhân, nếu không bắt buộc phải dùng một tính năng hoặc chiến lược đặc thù nào chỉ có ở Ribbon, hãy ưu tiên chọn Spring Cloud Load Balancer do chính Spring cung cấp.

Cuối cùng, hãy nói thêm vì sao hiện nay không khuyến khích dùng Ribbon nữa.

Phiên bản Spring Cloud 2020.0.0 đã loại bỏ toàn bộ các component của Netflix ngoại trừ Eureka. Spring Cloud Hoxton.M2 là phiên bản đầu tiên hỗ trợ Spring Cloud Load Balancer để thay thế cho Netflix Ribbon.

Khi mới học Microservices trước đây, chắc hẳn chúng ta đều từng tiếp xúc với các thư viện mã nguồn mở nổi tiếng của Netflix như Feign, Ribbon, Zuul, Hystrix, Eureka — những mảnh ghép thiết yếu để dựng hệ thống Microservices, và đến nay vẫn còn rất nhiều công ty đang sử dụng chúng. Không hề quá lời khi nói Netflix đã dẫn dắt sự phát triển của Microservices trên hệ sinh thái Java.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/SpringCloudNetflix-edb76676.png)

**Vậy tại sao Spring Cloud lại vội vã loại bỏ các component của Netflix như vậy?** Chủ yếu là vì vào năm 2018, Netflix thông báo các component mã nguồn mở cốt lõi của họ như Hystrix, Ribbon, Zuul, Eureka... bước vào chế độ bảo trì (maintenance mode), ngừng phát triển tính năng mới và chỉ sửa lỗi (bug fix). Do đó, phía Spring buộc phải tính phương án thay thế và loại bỏ dần các component của Netflix.

**Spring Cloud Alibaba** cũng là một lựa chọn rất đáng cân nhắc, đặc biệt đối với các công ty và lập trình viên tại Trung Quốc.

## Khuyến nghị triển khai trên Production

- **Xem chỉ số trước rồi mới chỉnh thuật toán**: Tập trung theo dõi QPS, RT, P99, tỷ lệ lỗi, số lượng kết nối và CPU/bộ nhớ của từng node, thay vì chỉ nhìn xem số lượng request có chia đều hay không.
- **Cách ly kịp thời node bị chậm**: Khi một node bị chậm, các chiến lược như Shortest Response Time hay Least Active có thể hỗ trợ phần nào, nhưng xử lý tận gốc vẫn phải dựa vào Health Check, Circuit Breaker và rút lưu lượng (draining).
- **Tránh phụ thuộc vào Sticky Session**: Nếu bắt buộc phải ghim phiên (session pinning) qua Cookie hoặc IP Hash, cần đánh giá ảnh hưởng tới người dùng khi scale in/out hoặc khi node gặp sự cố. Tốt hơn hết vẫn nên đưa Session vào kho lưu trữ dùng chung như Redis.
- **Canary Release phải có khả năng Rollback nhanh**: Cân bằng tải Layer 7 thường được dùng để chia luồng Canary theo Header, Cookie hoặc User ID; các rule Canary bắt buộc phải tắt nhanh được ngay lập tức.
- **Điều phối lưu lượng liên vùng về nơi gần nhất**: Các hệ thống phủ sóng toàn quốc hoặc toàn cầu thường cần kết hợp DNS/GSLB để điều hướng người dùng tới Data Center hoặc Availability Zone gần hơn.

## Tham khảo

- Chia sẻ kỹ thuật | Triển khai Cân bằng tải phần mềm Layer 4 của eBay: <https://mp.weixin.qq.com/s/bZMxLTECOK3mjdgiLbHj-g>
- HTTP Load Balancing (Tài liệu chính thức Nginx): <https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/>
- Cân bằng tải từ nông đến sâu - vivo Internet Tech: <https://www.cnblogs.com/vivotech/p/14859041.html>
