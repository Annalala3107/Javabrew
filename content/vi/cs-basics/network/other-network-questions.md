---
title: Tổng hợp câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 1)
description: Tổng hợp các câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 1), bao gồm các mô hình phân tầng mạng, các phiên bản HTTP, HTTPS, DNS, WebSocket, SSE và lệnh PING.
category: Kiến thức cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: câu hỏi phỏng vấn mạng máy tính, mô hình 4 tầng TCP/IP, phỏng vấn HTTP, HTTPS vs HTTP, HTTP/1.1 vs HTTP/2, HTTP/3 QUIC, bắt tay 3 bước TCP, phân biệt UDP, phân giải DNS, WebSocket vs SSE, GET vs POST, giao thức tầng ứng dụng, phân tầng mạng, head-of-line blocking, lệnh PING, giao thức ARP
lang: vi
sourceRef: zh-ref/cs-basics/network/other-network-questions.md
---

<!-- markdownlint-disable MD033 -->

Mạng máy tính là một chủ đề trọng tâm có tần suất xuất hiện cực kỳ cao trong các buổi phỏng vấn backend và tuyển dụng sinh viên tốt nghiệp. Đặc biệt, các câu hỏi xoay quanh **mô hình phân tầng mạng TCP/IP, HTTP, HTTPS, DNS, WebSocket, bắt tay 3 bước của TCP** gần như xuyên suốt các kịch bản thực tế khi phát triển phần mềm như "từ lúc nhập URL đến khi trang web hiển thị", "tại sao API bị chậm", hay "vì sao kết nối bị thất bại".

Bài viết "Tổng hợp câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 1)" này sẽ bắt đầu từ các mô hình phân tầng mạng, sau đó hệ thống hóa các kiến thức cốt lõi liên quan đến tầng ứng dụng và HTTP. Nội dung rất phù hợp để ôn tập bài bản kiến thức cơ sở mạng máy tính, đồng thời cũng là danh sách tra cứu nhanh trước khi tham gia phỏng vấn Java backend, backend developer và kiến thức nền tảng máy tính.

## Kiến thức cơ sở mạng máy tính

### Mô hình phân tầng mạng

#### Mô hình OSI 7 tầng là gì? Vai trò của từng tầng là gì?

**Mô hình OSI 7 tầng** là mô hình phân tầng mạng do Tổ chức Tiêu chuẩn hóa Quốc tế (ISO) đề xuất. Cấu trúc tổng thể cũng như chức năng do từng tầng cung cấp được thể hiện trong hình dưới đây:

![Phân chia chức năng các tầng trong mô hình OSI 7 tầng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-7-model-955bfdf5.png)

Mỗi tầng chỉ tập trung vào một nhiệm vụ duy nhất và cần sử dụng các chức năng do tầng ngay bên dưới cung cấp. Ví dụ, tầng giao vận (Transport Layer) cần sử dụng chức năng định tuyến và đánh địa chỉ do tầng mạng (Network Layer) cung cấp, nhờ đó tầng giao vận mới biết cần truyền dữ liệu đi đến đâu.

**Kiến trúc 7 tầng của mô hình OSI có khái niệm rõ ràng, lý thuyết rất hoàn chỉnh, nhưng nó lại tương đối phức tạp và thiếu tính thực tiễn, đồng thời một số chức năng bị lặp lại ở nhiều tầng khác nhau.**

Sơ đồ trên có thể hơi trừu tượng, hãy cùng xem một hình ảnh minh họa sinh động hơn. Bức ảnh dưới đây được tìm thấy trên một trang web nước ngoài, rất trực quan và dễ hiểu!

![Mô hình OSI 7 tầng hình ảnh minh họa trực quan](/media/jg/ext/oss.javaguide.cn/github/javaguide/osi2-8a5da370.png)

#### ⭐️ Mô hình 4 tầng TCP/IP là gì? Vai trò của từng tầng là gì?

**Mô hình 4 tầng TCP/IP** là mô hình được áp dụng rộng rãi nhất hiện nay trên thực tế. Chúng ta có thể coi mô hình TCP/IP là phiên bản tinh gọn của mô hình OSI 7 tầng, bao gồm 4 tầng sau:

1. Tầng ứng dụng (Application Layer)
2. Tầng giao vận (Transport Layer)
3. Tầng mạng (Network Layer / Internet Layer)
4. Tầng giao tiếp mạng (Network Interface Layer / Link Layer)

Cần lưu ý rằng chúng ta không thể ánh xạ hoàn toàn chính xác tuyệt đối giữa mô hình 4 tầng TCP/IP và mô hình 7 tầng OSI, nhưng có thể đối chiếu một cách tương đối như hình minh họa dưới đây:

![Mối quan hệ tương ứng giữa mô hình 4 tầng TCP/IP và mô hình OSI](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

Để xem phần giới thiệu chi tiết về vai trò của từng tầng, vui lòng tham khảo bài viết [Giải thích chi tiết về mô hình phân tầng mạng OSI và TCP/IP (Cơ bản)](https://javaguide.cn/cs-basics/network/osi-and-tcp-ip-model.html).

#### Tại sao mạng máy tính cần phân tầng?

Nói về việc phân tầng, trước hết hãy liên hệ với cách chúng ta thường dùng các framework để phát triển một ứng dụng backend. Chúng ta thường tuân theo nguyên tắc mỗi tầng làm một nhiệm vụ riêng biệt để chia hệ thống thành 3 tầng (các hệ thống phức tạp có thể chia nhiều tầng hơn):

1. Repository (Thao tác với cơ sở dữ liệu)
2. Service (Xử lý logic nghiệp vụ)
3. Controller (Tương tác dữ liệu giữa frontend và backend)

**Các hệ thống phức tạp bắt buộc phải phân tầng, vì mỗi tầng cần tập trung vào một nhóm nhiệm vụ riêng biệt. Lý do phân tầng mạng cũng hoàn toàn tương tự: mỗi tầng chỉ tập trung xử lý một loại công việc nhất định.**

Bây giờ, hãy quay lại câu hỏi: "Tại sao mạng máy tính lại cần phân tầng?". Có 3 nguyên nhân cốt lõi sau:

1. **Các tầng hoàn toàn độc lập với nhau**: Mỗi tầng hoạt động độc lập và không cần bận tâm tầng khác được triển khai bên trong như thế nào; tầng hiện tại chỉ cần biết cách gọi các tính năng đã được tầng dưới cung cấp sẵn (có thể hiểu đơn giản như việc gọi qua interface). **Điều này hoàn toàn tương đồng với nguyên lý phân tầng hệ thống khi lập trình.**
2. **Nâng cao tính linh hoạt và khả năng thay thế**: Mỗi tầng đều có thể sử dụng công nghệ phù hợp nhất để hiện thực hóa, bạn chỉ cần đảm bảo các chức năng cung cấp và quy tắc giao diện (interface) công khai không bị thay đổi. Hơn nữa, bất kỳ tầng nào cũng có thể được sửa đổi hoặc thay thế theo nhu cầu mà không làm ảnh hưởng đến cấu trúc của toàn bộ mạng lưới. **Điều này tương ứng trực tiếp với nguyên tắc "High Cohesion, Low Coupling" (độ kết dính cao, độ ghép nối thấp) mà chúng ta luôn theo đuổi khi phát triển phần mềm.**
3. **Chia nhỏ bài toán lớn**: Phân tầng giúp phân rã các vấn đề mạng phức tạp thành nhiều bài toán con nhỏ hơn, có ranh giới rõ ràng và đơn giản hơn để xử lý và giải quyết. Nhờ đó, việc thiết kế, hiện thực hóa và chuẩn hóa các hệ thống mạng máy tính phức tạp trở nên dễ dàng hơn nhiều. **Điều này tương tự như trong lập trình thực tế, chúng ta luôn chia nhỏ các chức năng hệ thống và bẻ nhỏ các bài toán phức tạp thành các bài toán con dễ hiểu hơn, có ranh giới (mục tiêu và interface) được định nghĩa rõ ràng.**

Trong thế giới khoa học máy tính có một câu nói kinh điển rất nổi tiếng:

> "Mọi vấn đề trong khoa học máy tính đều có thể được giải quyết bằng cách thêm một tầng trung gian gián tiếp; toàn bộ hệ thống máy tính từ trên xuống dưới đều được thiết kế theo cấu trúc phân tầng chặt chẽ."

### Các giao thức mạng thường gặp

#### ⭐️ Tầng ứng dụng có những giao thức phổ biến nào?

![Các giao thức phổ biến ở tầng ứng dụng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/application-layer-protocol-3c7d8468.png)

- **HTTP (Hypertext Transfer Protocol - Giao thức truyền tải siêu văn bản)**: Là giao thức tầng ứng dụng dùng để truyền tải siêu văn bản và nội dung đa phương tiện, chủ yếu được thiết kế cho việc giao tiếp giữa web client và máy chủ. HTTP/1.x và HTTP/2 thường chạy trên nền TCP, trong khi HTTP/3 chạy trên nền giao thức QUIC dựa trên UDP.
- **SMTP (Simple Mail Transfer Protocol - Giao thức truyền tải thư đơn giản)**: Hoạt động trên giao thức TCP, là giao thức dùng để gửi thư điện tử (email). Lưu ý ⚠️: Giao thức SMTP chỉ chịu trách nhiệm gửi thư chứ không nhận thư. Để nhận thư từ mail server về máy, cần sử dụng giao thức POP3 hoặc IMAP.
- **POP3 / IMAP (Giao thức nhận thư điện tử)**: Hoạt động trên giao thức TCP, cả hai đều đảm nhiệm vai trò nhận thư điện tử. IMAP là giao thức mới hơn POP3, vượt trội hơn cả về tính năng lẫn hiệu năng. IMAP hỗ trợ các tính năng nâng cao như tìm kiếm thư, gắn thẻ, phân loại, lưu trữ, và có thể đồng bộ trạng thái thư giữa nhiều thiết bị. Hầu hết các ứng dụng và máy chủ email hiện đại đều hỗ trợ IMAP.
- **FTP (File Transfer Protocol - Giao thức truyền tập tin)**: Hoạt động trên giao thức TCP, dùng để truyền tập tin giữa các máy tính với nhau, giúp che giấu sự khác biệt về hệ điều hành và cơ chế lưu trữ tập tin. Lưu ý ⚠️: FTP là một giao thức không an toàn vì không mã hóa dữ liệu trong quá trình truyền. Khuyến nghị nên sử dụng các giao thức an toàn hơn như SFTP khi truyền tải dữ liệu nhạy cảm.
- **Telnet (Giao thức đăng nhập từ xa)**: Hoạt động trên giao thức TCP, dùng để đăng nhập vào các máy chủ khác thông qua một terminal. Một trong những nhược điểm lớn nhất của Telnet là toàn bộ dữ liệu (bao gồm username và password) đều được gửi dưới dạng văn bản thuần (cleartext), tiềm ẩn rủi ro bảo mật nghiêm trọng. Đó là lý do tại sao ngày nay người ta hầu như không còn dùng Telnet nữa mà chuyển sang sử dụng giao thức truyền tải mạng cực kỳ bảo mật là SSH.
- **SSH (Secure Shell Protocol - Giao thức vỏ bảo mật)**: Hoạt động trên giao thức TCP, hiện thực hóa các tác vụ truy cập và truyền tập tin an toàn thông qua cơ chế mã hóa và xác thực.
- **RTP (Real-time Transport Protocol - Giao thức truyền tải thời gian thực)**: Thường hoạt động trên giao thức UDP, nhưng cũng hỗ trợ TCP. Giao thức này cung cấp chức năng truyền dữ liệu thời gian thực end-to-end, nhưng không bao gồm việc dự trữ tài nguyên mạng và không đảm bảo chất lượng truyền tải thời gian thực (QoS); các tính năng này sẽ do các công nghệ như WebRTC hiện thực.
- **DNS (Domain Name System - Hệ thống phân giải tên miền)**: Thường hoạt động trên giao thức UDP (cổng 53), dùng để giải quyết bài toán ánh xạ giữa tên miền và địa chỉ IP. Khi dữ liệu phản hồi vượt quá giới hạn chuẩn hoặc khi thực hiện truyền vùng dữ liệu (zone transfer), DNS sẽ tự động chuyển sang sử dụng TCP.

Để tìm hiểu chi tiết về các giao thức này, vui lòng đọc bài viết [Tổng hợp các giao thức tầng ứng dụng phổ biến (Tầng ứng dụng)](./application-layer-protocol.md).

#### Tầng giao vận (Transport Layer) có những giao thức phổ biến nào?

![Các giao thức phổ biến ở tầng giao vận](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/transport-layer-protocol-77ea5f52.png)

- **TCP (Transmission Control Protocol - Giao thức điều khiển truyền vận)**: Cung cấp dịch vụ truyền dữ liệu **hướng kết nối (connection-oriented)** và **đáng tin cậy (reliable)**.
- **UDP (User Datagram Protocol - Giao thức dữ liệu người dùng)**: Cung cấp dịch vụ truyền dữ liệu **phi kết nối (connectionless)** và **nỗ lực tối đa (best-effort)** (không đảm bảo độ tin cậy của việc truyền dữ liệu), đặc điểm đơn giản và hiệu quả cao.

#### Tầng mạng (Network Layer) có những giao thức phổ biến nào?

![Các giao thức phổ biến ở tầng mạng](/media/jg/local/cs-basics/network/images/network-model/nerwork-layer-protocol-753345.png)

- **IP (Internet Protocol - Giao thức Internet)**: Một trong những giao thức quan trọng nhất của bộ giao thức TCP/IP, thuộc tầng mạng. Vai trò chủ yếu là định nghĩa định dạng gói tin, thực hiện định tuyến và đánh địa chỉ để các gói tin có thể truyền qua các mạng khác nhau và đến đúng đích. Hiện tại giao thức IP có hai phiên bản chính: IPv4 trước đây và IPv6 mới hơn. Cả hai đều đang được sử dụng song song, nhưng IPv6 được tạo ra nhằm thay thế hoàn toàn cho IPv4.
- **ARP (Address Resolution Protocol - Giao thức phân giải địa chỉ)**: Giao thức ARP giải quyết bài toán chuyển đổi giữa địa chỉ tầng mạng (IP) và địa chỉ tầng liên kết dữ liệu (MAC). Khi một IP datagram được truyền đi trên đường truyền vật lý, nó luôn cần biết chặng tiếp theo (next hop vật lý) phải đi về đâu. Nhưng địa chỉ IP chỉ là địa chỉ logic, còn địa chỉ MAC mới là địa chỉ vật lý; ARP giải quyết việc chuyển đổi từ địa chỉ IP sang địa chỉ MAC.
- **ICMP (Internet Control Message Protocol - Giao thức điều khiển bản tin Internet)**: Một giao thức dùng để truyền thông tin trạng thái mạng và các thông báo lỗi, thường được dùng để chẩn đoán mạng và khắc phục sự cố. Ví dụ công cụ Ping sử dụng giao thức ICMP để kiểm tra tính thông suốt của kết nối mạng.
- **NAT (Network Address Translation - Giao thức biên dịch địa chỉ mạng)**: Kịch bản ứng dụng của NAT đúng như tên gọi của nó — biên dịch địa chỉ mạng, áp dụng trong quá trình chuyển đổi địa chỉ từ mạng nội bộ (mạng riêng) sang mạng bên ngoài (mạng công cộng). Cụ thể, trong một mạng con cục bộ (LAN), các máy chủ sử dụng chung dải địa chỉ IP nội bộ của LAN đó, nhưng ra ngoài mạng diện rộng (WAN), cần có một địa chỉ IP duy nhất đại diện cho mạng LAN đó trên toàn bộ Internet.
- **OSPF (Open Shortest Path First - Chọn đường ngắn nhất mở)**: Một giao thức cổng nội bộ (Interior Gateway Protocol - IGP), cũng là giao thức định tuyến động được sử dụng rất rộng rãi, dựa trên thuật toán trạng thái liên kết (link-state), có tính đến băng thông, độ trễ và các yếu tố khác của liên kết để chọn ra đường đi tối ưu nhất.
- **RIP (Routing Information Protocol - Giao thức thông tin định tuyến)**: Một giao thức cổng nội bộ (IGP), cũng là giao thức định tuyến động, dựa trên thuật toán vectơ khoảng cách (distance-vector), sử dụng số bước nhảy (hop count) cố định làm thước đo và chọn đường có số bước nhảy ít nhất làm đường đi tối ưu nhất.
- **BGP (Border Gateway Protocol - Giao thức cổng biên giới)**: Một giao thức định tuyến dùng để trao đổi thông tin khả năng tiếp cận tầng mạng (Network Layer Reachability Information - NLRI) giữa các miền định tuyến tự trị (Autonomous System - AS), có tính linh hoạt và khả năng mở rộng rất cao.

## HTTP

### ⭐️ Điều gì thực sự xảy ra từ khi nhập URL đến khi trang web hiển thị? (Rất quan trọng)

> Câu hỏi phỏng vấn tương tự: Khi mở một trang web, toàn bộ quá trình sẽ sử dụng những giao thức nào?

Hãy cùng xem sơ đồ sau (trích từ cuốn sách *Đồ giải HTTP*):

<img src="/media/jg/ext/oss.javaguide.cn/github/javaguide/url-c7005987.jpg" alt="Toàn bộ quy trình từ khi nhập URL đến khi trang web hiển thị" style="zoom:50%" />

Hình trên có một lỗi nhỏ cần lưu ý: đó là OSPF chứ không phải OPSF. OSPF (Open Shortest Path First) là giao thức định tuyến chọn đường ngắn nhất đầu tiên, do Nhóm đặc trách kỹ thuật Internet (IETF) phát triển.

Nhìn chung, quá trình này bao gồm các bước sau:

1. Người dùng nhập URL của trang web mong muốn vào trình duyệt.
2. Trình duyệt thông qua giao thức DNS để lấy địa chỉ IP tương ứng với tên miền.
3. Dựa vào địa chỉ IP và số cổng, trình duyệt gửi yêu cầu thiết lập kết nối TCP đến máy chủ đích.
4. Trên kết nối TCP đã được thiết lập, trình duyệt gửi một thông điệp yêu cầu HTTP (HTTP request) đến máy chủ để lấy nội dung trang web.
5. Sau khi nhận được HTTP request, máy chủ xử lý yêu cầu và trả về thông điệp phản hồi HTTP (HTTP response) cho trình duyệt.
6. Khi nhận được HTTP response, trình duyệt phân tích mã HTML trong response body, render cấu trúc và style của trang web, đồng thời dựa vào URL của các tài nguyên khác bên trong HTML (như hình ảnh, CSS, JS...), tiếp tục gửi các yêu cầu HTTP tiếp theo để tải các tài nguyên này về cho đến khi trang web được hiển thị hoàn chỉnh.
7. Khi trình duyệt không cần giao tiếp với máy chủ nữa, nó có thể chủ động đóng kết nối TCP hoặc chờ yêu cầu đóng kết nối từ máy chủ.

Để tìm hiểu chi tiết, mời bạn tham khảo bài viết này: [Toàn bộ quá trình truy cập một trang web (Xâu chuỗi kiến thức)](https://javaguide.cn/cs-basics/network/the-whole-process-of-accessing-web-pages.html) (rất khuyến khích đọc).

### ⭐️ Các mã trạng thái HTTP (Status Code) là gì?

Mã trạng thái HTTP dùng để mô tả kết quả xử lý của một yêu cầu HTTP, ví dụ đầu số `2xx` đại diện cho yêu cầu đã được xử lý thành công.

![Các mã trạng thái HTTP thường gặp](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-status-code-4a9382f4.png)

Để xem bảng tổng hợp chi tiết hơn về các mã trạng thái HTTP, bạn có thể đọc bài viết: [Tổng hợp các mã trạng thái HTTP phổ biến (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/http-status-codes.html).

### Các trường phổ biến trong HTTP Header là gì?

| Tên trường Request Header | Giải thích | Ví dụ |
| :--- | :--- | :--- |
| Accept | Các loại nội dung phản hồi (Content-Types) mà client có thể chấp nhận. | Accept: text/plain |
| Accept-Charset | Bộ mã ký tự mà client có thể chấp nhận. | Accept-Charset: utf-8 |
| Accept-Datetime | Phiên bản tài nguyên theo mốc thời gian mà client có thể chấp nhận. | Accept-Datetime: Thu, 31 May 2007 20:35:00 GMT |
| Accept-Encoding | Danh sách các thuật toán nén / mã hóa truyền tải có thể chấp nhận. Tham khảo nén HTTP. | Accept-Encoding: gzip, deflate |
| Accept-Language | Danh sách ngôn ngữ tự nhiên được chấp nhận cho nội dung phản hồi. | Accept-Language: en-US |
| Authorization | Thông tin chứng thực sử dụng để xác thực danh tính cho giao thức HTTP. | Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ== |
| Cache-Control | Các chỉ thị mà mọi cơ chế caching trong chuỗi request/response đều bắt buộc phải tuân thủ. | Cache-Control: no-cache |
| Connection | Loại kết nối mà trình duyệt mong muốn ưu tiên sử dụng. | Connection: keep-alive |
| Content-Length | Độ dài của request body được biểu diễn bằng mảng octet (byte 8-bit). | Content-Length: 348 |
| Content-MD5 | Giá trị băm MD5 nhị phân của nội dung body, được mã hóa dưới dạng Base64. | Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ== |
| Content-Type | Kiểu định dạng MIME của request body (dùng trong các request POST và PUT). | Content-Type: application/x-www-form-urlencoded |
| Cookie | Một HTTP Cookie trước đó do máy chủ gửi về thông qua header Set-Cookie. | Cookie: $Version=1; Skin=new; |
| Date | Ngày và giờ gửi thông điệp (theo định dạng "HTTP-date" được định nghĩa trong RFC 7231). | Date: Tue, 15 Nov 1994 08:12:31 GMT |
| Expect | Thể hiện rằng client yêu cầu máy chủ phải thực hiện một hành vi cụ thể nào đó. | Expect: 100-continue |
| From | Địa chỉ email của người dùng khởi tạo request này. | From: `user@example.com` |
| Host | Tên miền của máy chủ (dùng cho virtual hosting) và số cổng TCP máy chủ đang lắng nghe. Có thể bỏ qua nếu là cổng tiêu chuẩn của dịch vụ. | Host: en.wikipedia.org |
| If-Match | Chỉ thực hiện thao tác tương ứng khi thực thể do client cung cấp khớp với thực thể tương ứng trên máy chủ. Chủ yếu dùng trong các phương thức như PUT để đảm bảo chỉ cập nhật khi tài nguyên chưa bị sửa đổi kể từ lần tải trước. | If-Match: "737060cd8c284d8af7ad3082f209582d" |
| If-Modified-Since | Cho phép máy chủ trả về mã `304 Not Modified` nếu tài nguyên được yêu cầu chưa từng bị chỉnh sửa kể từ mốc thời gian chỉ định. | If-Modified-Since: Sat, 29 Oct 1994 19:43:31 GMT |
| If-None-Match | Cho phép máy chủ trả về mã `304 Not Modified` nếu ETag của tài nguyên được yêu cầu không thay đổi. | If-None-Match: "737060cd8c284d8af7ad3082f209582d" |
| If-Range | Nếu thực thể chưa bị thay đổi, hãy gửi về phần còn thiếu; nếu đã bị thay đổi, hãy gửi lại toàn bộ thực thể mới. | If-Range: "737060cd8c284d8af7ad3082f209582d" |
| If-Unmodified-Since | Chỉ gửi phản hồi nếu thực thể chưa từng bị thay đổi kể từ một mốc thời gian cụ thể. | If-Unmodified-Since: Sat, 29 Oct 1994 19:43:31 GMT |
| Max-Forwards | Giới hạn số lần thông điệp có thể được chuyển tiếp qua các proxy và gateway. | Max-Forwards: 10 |
| Origin | Khởi tạo một request chia sẻ tài nguyên nguồn gốc chéo (CORS). | `Origin: http://www.example-social-network.com` |
| Pragma | Phụ thuộc vào từng triển khai cụ thể, các trường này có thể tạo ra nhiều hiệu ứng tại bất kỳ thời điểm nào trong chuỗi request/response. | Pragma: no-cache |
| Proxy-Authorization | Thông tin xác thực dùng để xác thực quyền với proxy. | Proxy-Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ== |
| Range | Chỉ yêu cầu một phần byte của thực thể. Offset tính từ 0. Xem thêm Byte Serving. | Range: bytes=500-999 |
| Referer | Cho biết trang web trước đó mà người dùng đã truy cập, nơi chứa liên kết dẫn trình duyệt tới trang hiện tại. | `Referer: http://en.wikipedia.org/wiki/Main_Page` |
| TE | Các kiểu mã hóa truyền tải mà trình duyệt dự kiến chấp nhận: có thể dùng các giá trị trong header Transfer-Encoding của response. | TE: trailers, deflate |
| Upgrade | Yêu cầu máy chủ nâng cấp sang một giao thức khác. | Upgrade: HTTP/2.0, SHTTP/1.3, IRC/6.9, RTA/x11 |
| User-Agent | Chuỗi định danh thông tin phần mềm trình duyệt / user agent của client. | User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0 |
| Via | Thông báo cho máy chủ biết request này đã đi qua những proxy trung gian nào. | Via: 1.0 fred, 1.1 example.com (Apache/1.1) |
| Warning | Cảnh báo tổng quát cho biết có thể có vấn đề trong nội dung thực thể (body). | Warning: 199 Miscellaneous warning |

### ⭐️ HTTP và HTTPS khác nhau như thế nào? (Quan trọng)

![So sánh giữa HTTP và HTTPS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-vs-https-99f29ca0.png)

- **Số cổng (Port)**: Cổng mặc định của HTTP là 80; cổng mặc định của HTTPS là 443.
- **Tiền tố URL**: Tiền tố URL của HTTP là `http://`; tiền tố URL của HTTPS là `https://`.
- **Tính bảo mật và phương thức truyền tải**: HTTP thuần không có TLS mặc định không cung cấp tính bảo mật, tính toàn vẹn và xác thực danh tính đối tác. HTTPS sử dụng TLS để bảo vệ HTTP; HTTP/1.1 và HTTP/2 thường dùng TLS over TCP, còn HTTP/3 dùng QUIC tích hợp sẵn TLS 1.3. Quá trình bắt tay TLS chịu trách nhiệm xác thực danh tính và thiết lập khóa lưu lượng, sau đó dữ liệu payload được bảo vệ bằng thuật toán đối xứng AEAD. Chứng chỉ số chủ yếu dùng để xác thực danh tính, không thể nói chung chung một cách mơ hồ rằng "chứng chỉ dùng để mã hóa khóa đối xứng".
- **SEO (Search Engine Optimization)**: Các công cụ tìm kiếm thường ưu tiên các trang web sử dụng giao thức HTTPS vì HTTPS mang lại mức độ an toàn cao hơn và bảo vệ quyền riêng tư người dùng tốt hơn. Các website dùng HTTPS có thể được xếp hạng ưu tiên trong kết quả tìm kiếm, tạo ra tác động tích cực đến SEO.

Để xem bảng tổng hợp so sánh chi tiết hơn giữa HTTP và HTTPS, bạn có thể tham khảo bài viết: [HTTP vs HTTPS (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/http-vs-https.html).

### Trong quá trình bắt tay HTTPS, RSA và ECDHE khác nhau ở điểm nào? (Tầng ứng dụng)

Điểm khác biệt cốt lõi giữa RSA và ECDHE nằm ở chỗ: **tài liệu khóa phiên (session key material) là "được truyền trực tiếp qua mạng" hay "được hai bên tự thương lượng tính toán ra"**.

Trong quá trình bắt tay RSA tĩnh của TLS 1.2, client sinh ra `PreMasterSecret`, mã hóa bằng khóa công khai RSA lấy từ chứng chỉ của máy chủ rồi gửi sang server, server dùng khóa bí mật RSA để giải mã. Điểm yếu là nếu kẻ tấn công ghi lại toàn bộ lưu lượng bắt tay trong quá khứ, sau này khóa riêng của server bị lộ, kẻ tấn công hoàn toàn có thể giải mã ngược lại khóa phiên lịch sử, do đó RSA tĩnh không có **Forward Secrecy** (tính bảo mật chuyển tiếp).

ECDHE không truyền trực tiếp bí mật dùng chung qua mạng. Client và server mỗi bên tự sinh một cặp khóa tạm thời (ephemeral key pair), trao đổi khóa công khai tạm thời cho nhau, rồi cả hai bên tự tính toán cục bộ ra cùng một bí mật dùng chung. Khóa riêng trong chứng chỉ máy chủ chỉ được dùng để ký số xác thực, nhằm chứng minh các tham số tạm thời không bị kẻ trung gian đánh tráo, chứ không dùng để giải mã khóa phiên.

Tóm gọn lại trong một câu: **Với RSA, client mã hóa bí mật rồi gửi đi; với ECDHE, hai bên dùng khóa tạm thời để tự thương lượng tính toán ra bí mật. ECDHE hỗ trợ Forward Secrecy, và vì thế đã trở thành xu hướng chuẩn mực chủ đạo của HTTPS hiện đại.**

Chi tiết: [Trong quá trình bắt tay HTTPS, RSA và ECDHE khác nhau ở điểm nào? (Tầng ứng dụng)](./https-rsa-vs-ecdhe.md).

### ⭐️ Đã có HTTP, tại sao vẫn cần đến RPC?

HTTP và RPC không phải là mối quan hệ thay thế lẫn nhau, cũng không phải là cái nào "cao cấp" hơn cái nào.

Cả HTTP và RPC đều có thể dùng để gọi dịch vụ. Sự khác biệt thực sự nằm ở việc: bạn muốn xem việc gọi từ xa như một lần **"truy cập tài nguyên" (resource access)** hay như một lần **"gọi hàm/phương thức" (method invocation)**.

Nếu là giao diện ra bên ngoài (Web, App, tích hợp hệ thống bên thứ ba), HTTP thường phù hợp hơn. Nó phổ quát, dễ debug, chi phí tích hợp thấp, bất kỳ ai cũng có thể dùng Postman hay `curl` để kiểm thử dễ dàng.  
Nếu là việc gọi lẫn nhau giữa các dịch vụ nội bộ công ty—đặc biệt khi có rất nhiều dịch vụ, chuỗi gọi dài, tần suất gọi dày đặc, đồng thời phải xử lý các bài toán phức tạp như service discovery, timeout, retry, load balancing, distributed tracing—thì RPC sẽ thuận tiện và chuyên nghiệp hơn rất nhiều. Nó không đơn thuần chỉ nhằm mục đích cho nhanh hơn, mà là giải quyết đồng bộ hàng loạt vấn đề phức tạp trong việc giao tiếp giữa các dịch vụ nội bộ.

Vì vậy, đừng chỉ học vẹt câu khẩu hiệu: "HTTP dùng cho đối ngoại, RPC dùng cho đối nội".

Câu nói này có thể giúp người mới tiếp cận, nhưng khi làm dự án thực tế, bạn phải cân nhắc đối tượng gọi, hạ tầng sẵn có của đội ngũ, chi phí điều tra lỗi (troubleshooting), yêu cầu hiệu năng và chi phí bảo trì lâu dài.

Nếu quy mô hệ thống không quá lớn và HTTP đang chạy rất ổn định, đừng cố gượng ép đưa RPC vào chỉ để hệ thống trông "chuẩn microservices hơn".

Khi các cuộc gọi nội bộ ngày càng phức tạp, số lượng HTTP SDK, gateway, monitoring, retry tự viết ngày càng nhiều lên, đó mới là lúc bạn nên nghiêm túc cân nhắc chuyển sang RPC.

Tóm lại một câu: **HTTP không hề yếu, và RPC cũng chẳng phải thần thánh. Chọn cái nào, chủ yếu phụ thuộc vào việc cái nào giúp giải quyết bài toán hiện tại của bạn với chi phí thấp hơn.**

Chi tiết: [⭐️ Đã có HTTP, tại sao vẫn cần đến RPC?](./http-vs-rpc.md).

### HTTP/1.0 và HTTP/1.1 khác nhau như thế nào?

![So sánh giữa HTTP/1.0 và HTTP/1.1](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http1.0-vs-http1.1-4e93892e.png)

- **Phương thức kết nối**: HTTP/1.0 mặc định dùng kết nối ngắn (short-lived connection), còn HTTP/1.1 hỗ trợ kết nối bền vững (persistent connection hay `keep-alive`). Kết nối dài hay ngắn trong HTTP thực chất tương ứng với kết nối dài hay ngắn ở tầng TCP.
- **Mã phản hồi trạng thái**: HTTP/1.1 bổ sung thêm rất nhiều mã trạng thái mới, riêng mã lỗi đã thêm 24 loại. Ví dụ: `100 (Continue)` — cho phép client kiểm tra xem server có sẵn sàng nhận hay không trước khi gửi payload lớn, `206 (Partial Content)` — mã xác nhận cho yêu cầu phạm vi (range request), `409 (Conflict)` — yêu cầu xung đột với trạng thái hiện tại của tài nguyên, `410 (Gone)` — tài nguyên đích không còn tồn tại vĩnh viễn và không có địa chỉ chuyển tiếp.
- **Cơ chế bộ nhớ đệm (Caching)**: Trong HTTP/1.0 chủ yếu sử dụng `If-Modified-Since` và `Expires` trong Header để làm căn cứ đánh giá cache. HTTP/1.1 đưa vào nhiều chiến lược kiểm soát cache phong phú hơn như `Entity tag` (ETag), `If-Unmodified-Since`, `If-Match`, `If-None-Match`, giúp việc kiểm soát bộ nhớ đệm linh hoạt và chuẩn xác hơn.
- **Tối ưu băng thông**: Trong HTTP/1.0 có hiện tượng lãng phí băng thông, ví dụ client chỉ cần một phần của đối tượng nhưng server lại phải gửi toàn bộ đối tượng, và không hỗ trợ tính năng tiếp tục tải lại khi bị gián đoạn (resume download). HTTP/1.1 bổ sung trường `Range` trong request header, cho phép chỉ yêu cầu một phần tài nguyên cụ thể (trả về mã 206 Partial Content), giúp tận dụng tối đa băng thông và kết nối.
- **Hỗ trợ trường Host Header**: HTTP/1.1 bổ sung trường header `Host`, cho phép lưu trữ nhiều tên miền trên cùng một địa chỉ IP, qua đó hỗ trợ tính năng máy chủ ảo (Virtual Hosting). Trong khi đó HTTP/1.0 không có trường `Host` nên không thể hiện thực hóa Virtual Hosting.

Để xem bài so sánh chi tiết hơn, bạn có thể đọc: [HTTP/1.0 vs HTTP/1.1 (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/http1.0-vs-http1.1.html).

### ⭐️ HTTP/1.1 và HTTP/2.0 khác nhau như thế nào?

![So sánh giữa HTTP/1.1 và HTTP/2.0](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http1.1-vs-http2.0-c5f37e83.png)

- **Đa luồng hóa (Multiplexing)**: HTTP/2.0 có thể truyền đồng thời nhiều request và response trên cùng một kết nối TCP duy nhất (có thể coi là phiên bản nâng cấp mạnh mẽ của persistent connection trong HTTP/1.1) mà không hề can thiệp lẫn nhau. HTTP/1.1 sử dụng cơ chế tuần tự, mỗi request/response cần một kết nối riêng biệt hoặc xếp hàng, và trình duyệt thường giới hạn chỉ mở 6-8 kết nối TCP cho mỗi domain. Nhờ cơ chế Multiplexing, HTTP/2.0 xử lý nhiều yêu cầu hiệu quả hơn hẳn, giảm độ trễ mạng và nâng cao đáng kể thông lượng.
- **Khung nhị phân (Binary Frames)**: HTTP/2.0 sử dụng các khung nhị phân để truyền dữ liệu, trong khi HTTP/1.1 dùng định dạng văn bản thuần (text). Các frame nhị phân nhỏ gọn và hiệu quả hơn nhiều, giảm lượng dữ liệu truyền tải và tiết kiệm băng thông.
- **Tắc nghẽn đầu hàng (Head-of-Line Blocking)**: HTTP/2 đưa vào kỹ thuật Multiplexing cho phép nhiều request và response đan xen song song trên một kết nối TCP duy nhất, giải quyết triệt để vấn đề **Head-of-Line Blocking ở tầng ứng dụng của HTTP/1.1**. Tuy nhiên, HTTP/2 vẫn chịu ảnh hưởng của **Head-of-Line Blocking ở tầng TCP**.
- **Nén phần đầu (Header Compression)**: HTTP/1.1 chỉ hỗ trợ nén `Body` chứ không hỗ trợ nén `Header`. HTTP/2.0 hỗ trợ nén cả `Header` thông qua thuật toán HPACK được thiết kế riêng cho HTTP header, giúp giảm thiểu đáng kể chi phí truyền tải mạng.
- **Đẩy từ máy chủ (Server Push)**: HTTP/2.0 hỗ trợ tính năng Server Push, cho phép máy chủ chủ động đẩy các tài nguyên liên quan về cho client khi client mới chỉ yêu cầu một tài nguyên đơn lẻ, nhờ đó giảm số lượt request và độ trễ chờ đợi của client. Trong khi đó với HTTP/1.1, client phải tự gửi từng request riêng biệt để lấy từng tài nguyên về.

Sơ đồ minh họa hiệu quả Multiplexing của HTTP/2.0 (Nguồn ảnh: [HTTP/2 For Web Developers](https://blog.cloudflare.com/http-2-for-web-developers/)):

![HTTP/2 ghép kênh nhiều yêu cầu và phản hồi trên một kết nối TCP duy nhất](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http2.0-multiplexing-5b8a007d.png)

Có thể thấy cơ chế Multiplexing của HTTP/2 cho phép nhiều request và response chia sẻ chung một kết nối TCP, tránh được tình trạng phải mở nhiều kết nối song song như HTTP/1.1 khi xử lý các request đồng thời, loại bỏ chi phí thiết lập và duy trì nhiều kết nối lặp đi lặp lại. Ở HTTP/1.1, dù hỗ trợ kết nối bền vững, trình duyệt vẫn buộc phải mở nhiều kết nối song song cho cùng một domain để giảm bớt hiện tượng nghẽn đầu hàng.

### HTTP/2.0 và HTTP/3.0 khác nhau như thế nào?

![So sánh giữa HTTP/2.0 và HTTP/3.0](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http2.0-vs-http3.0-6ad26f15.png)

- **Giao thức truyền tải (Transport Protocol)**: HTTP/2 dựa trên nền TCP, còn HTTP/3 ánh xạ ngữ nghĩa của HTTP lên giao thức QUIC. QUIC được xây dựng trên nền UDP, hiện thực hóa việc phân phát đáng tin cậy, điều khiển tắc nghẽn (congestion control), điều khiển luồng (flow control) và bảo mật TLS 1.3 ngay ở tầng giao vận.
- **Thiết lập kết nối**: Kết nối HTTPS của HTTP/2 đòi hỏi phải thiết lập kết nối TCP trước rồi mới hoàn tất quá trình bắt tay TLS; HTTP/3 kết hợp cả việc thương lượng tham số truyền tải và bắt tay TLS 1.3 vào ngay trong quá trình thiết lập kết nối QUIC. Một kết nối QUIC mới thông thường chỉ mất 1-RTT; 0-RTT chỉ áp dụng cho kịch bản khôi phục phiên (connection resumption) khi client đã có trạng thái từ kết nối trước đó, và dữ liệu sớm (early data) tiềm ẩn rủi ro tấn công phát lại (replay attack). Khi so sánh độ trễ, cần phải dùng chung một tiêu chí đo lường thống nhất như "thời điểm có thể gửi request đầu tiên" hoặc "thời điểm nhận được byte đầu tiên".
- **Nén phần đầu (Header Compression)**: HTTP/2.0 dùng thuật toán HPACK để nén header, trong khi HTTP/3.0 sử dụng thuật toán QPACK hiệu quả hơn, được thiết kế để xử lý việc truyền nhận các luồng không theo thứ tự mà không bị nghẽn.
- **Tắc nghẽn đầu hàng (Head-of-Line Blocking)**: Trong HTTP/2, nhiều luồng dùng chung một kết nối TCP; khi xảy ra mất gói tin TCP, tất cả các luồng trên kết nối đó đều bị tắc nghẽn. QUIC cung cấp khả năng phân phát dữ liệu tuần tự và đáng tin cậy độc lập giữa các stream; khi một stream bị mất gói, chỉ stream đó phải dừng lại chờ gói tin mất được truyền lại, hoàn toàn không ngăn cản các stream khác tiếp tục truyền nhận bình thường.
- **Chuyển vùng kết nối (Connection Migration)**: QUIC sử dụng Connection ID độc lập với bộ tứ (IP nguồn, port nguồn, IP đích, port đích) để định danh kết nối. Connection ID không cố định 64 bit: QUIC v1 có thể dùng Connection ID từ độ dài 0 đến 20 byte, và các endpoint có thể cấp phát cũng như thu hồi nhiều Connection ID. Khi địa chỉ mạng bị thay đổi (ví dụ chuyển từ Wi-Fi sang 4G/5G), endpoint có thể xác thực đường truyền mới và duy trì kết nối logic ban đầu mà không bị đứt đoạn.
- **Khôi phục lỗi**: HTTP/3.0 có cơ chế phục hồi lỗi vượt trội hơn, khi mạng gặp sự cố mất gói hay trễ cao, nó có thể phục hồi và truyền lại nhanh hơn nhiều. Trong khi đó HTTP/2.0 phải hoàn toàn phụ thuộc vào cơ chế phục hồi lỗi của TCP.
- **Bảo mật**: HTTP/2 thường dùng TLS để bảo vệ header và payload HTTP, nhưng các trường header ngoài của IP, TCP và TLS record layer vẫn hiển thị dạng rõ. QUIC sử dụng các khóa dẫn xuất từ TLS để bảo vệ payload của gói tin, đồng thời áp dụng bảo vệ phần đầu (header protection) cho số thứ tự gói (packet number) và một phần cờ trạng thái; tuy nhiên header IP/UDP và một số trường header của QUIC vẫn nhìn thấy được, các gói tin như Version Negotiation cũng không có cùng mức bảo vệ mật mã học. Vì vậy không thể nói một cách tuyệt đối rằng QUIC mã hóa toàn bộ tất cả các header của gói tin.

So sánh chồng giao thức giữa HTTP/1.0, HTTP/2.0 và HTTP/3.0:

![So sánh chồng giao thức giữa HTTP/1, HTTP/2 và HTTP/3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-3-implementation-ab73b085.png)

Hình dưới đây là bảng so sánh chi tiết hơn về cấu trúc giữa HTTP/2.0 và HTTP/3.0:

![Sơ đồ so sánh chi tiết giữa HTTP/2.0 và HTTP/3.0](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http2-and-http3-stacks-comparison-164f4e33.png)

Từ hình ảnh trên có thể thấy:

- **HTTP/2.0**: Sử dụng TCP làm giao thức truyền tải, dùng HPACK để nén header, dựa vào TLS để mã hóa.
- **HTTP/3.0**: Sử dụng giao thức QUIC dựa trên UDP, dùng QPACK để nén header hiệu quả hơn, tích hợp trực tiếp TLS bên trong QUIC. Giao thức QUIC sở hữu các đặc tính như chuyển vùng kết nối, kiểm soát và tránh tắc nghẽn, điều khiển luồng dữ liệu.

Để xem quá trình tiến hóa chi tiết từ HTTP/1.0 -> HTTP/3.0, khuyến khích bạn đọc bài viết [Tối ưu hóa kỹ thuật từ HTTP1 đến HTTP3](https://dbwu.tech/posts/http_evolution/).

### Head-of-Line Blocking giữa HTTP/1.1 và HTTP/2.0 khác nhau như thế nào?

Nguyên nhân chính gây ra tắc nghẽn đầu hàng (Head-of-Line Blocking) trong HTTP/1.1 là do không thể ghép kênh (Multiplexing):

- Trong một kết nối TCP duy nhất, việc yêu cầu và phản hồi tài nguyên phải được xử lý tuần tự theo thứ tự. Nếu một tài nguyên lớn (chẳng hạn một tập tin dung lượng lớn) đang được truyền tải, các tài nguyên nhỏ tiếp theo (như tập tin CSS nhỏ) bắt buộc phải đợi tài nguyên phía trước truyền tải xong hoàn toàn mới được gửi đi.
- Khi trình duyệt cần tải nhiều tài nguyên cùng lúc (nhiều file CSS, JS...), nó thường phải mở nhiều kết nối TCP song song (thường giới hạn tối đa 6 kết nối). Nhưng mỗi kết nối vẫn bị giới hạn bởi cơ chế request-response tuần tự, do đó vẫn xảy ra hiện tượng **Head-of-Line Blocking ở tầng ứng dụng**.

Mặc dù HTTP/2.0 đã đưa vào kỹ thuật ghép kênh (Multiplexing), cho phép nhiều request và response truyền đan xen song song trên một kết nối TCP duy nhất—giải quyết được **Head-of-Line Blocking ở tầng ứng dụng của HTTP/1.1**—nhưng HTTP/2.0 vẫn chịu ảnh hưởng của **Head-of-Line Blocking ở tầng TCP**:

- HTTP/2.0 thông qua cơ chế khung (frame) để chia nhỏ từng tài nguyên thành các mảnh nhỏ và gán cho mỗi tài nguyên một Stream ID duy nhất, nhờ vậy dữ liệu của nhiều tài nguyên có thể truyền đan xen nhau trên cùng một kết nối TCP.
- Tuy nhiên, TCP với tư cách là giao thức tầng giao vận bắt buộc dữ liệu phải được chuyển giao tuần tự và đầy đủ theo đúng thứ tự byte stream. Nếu một gói tin TCP bị mất trong quá trình truyền tải, cho dù các gói tin tiếp theo đã tới đích an toàn, chúng vẫn phải nằm chờ gói tin bị mất được truyền lại thành công thì mới có thể tiếp tục xử lý. Tính tuần tự nghiêm ngặt này ở tầng giao vận dẫn đến **Head-of-Line Blocking ở tầng TCP**.
- Ví dụ cụ thể: nếu một gói tin TCP của HTTP/2 mang dữ liệu của nhiều tài nguyên khác nhau (như JS và CSS) mà gói tin đó bị thất lạc, toàn bộ dữ liệu tài nguyên trong các gói tin đến sau đều phải chờ gói tin bị mất được truyền lại xong, khiến tất cả các luồng (streams) đều bị đình trệ theo.

Bảng so sánh tổng kết:

| Khía cạnh | Head-of-Line Blocking trong HTTP/1.1 | Head-of-Line Blocking trong HTTP/2.0 |
| :--- | :--- | :--- |
| **Tầng mạng** | Tầng ứng dụng (giới hạn của bản thân giao thức HTTP) | Tầng giao vận (giới hạn của giao thức TCP) |
| **Nguyên nhân gốc rễ** | Không thể ghép kênh, request và response bắt buộc phải truyền tuần tự | TCP yêu cầu gói tin phải chuyển giao đúng thứ tự, mất gói làm đình trệ toàn bộ kết nối |
| **Phạm vi ảnh hưởng** | Một request/response HTTP đơn lẻ làm chậm các request/response tiếp theo | Một gói TCP bị mất sẽ ảnh hưởng đến tất cả các stream HTTP/2.0 (do dùng chung một kết nối TCP bên dưới) |
| **Cách giảm thiểu** | Mở nhiều kết nối TCP song song | Giảm tỷ lệ mất gói mạng hoặc sử dụng giao thức QUIC dựa trên UDP |
| **Kịch bản ảnh hưởng** | Luôn luôn xảy ra, đặc biệt khi file lớn làm nghẽn file nhỏ | Dễ xảy ra hơn trong môi trường mạng có tỷ lệ mất gói cao |

### ⭐️ HTTP là giao thức phi trạng thái (stateless), làm thế nào để lưu trạng thái người dùng?

Bản thân giao thức HTTP là **phi trạng thái (stateless)**. Điều này đồng nghĩa với việc theo mặc định, máy chủ không thể phân biệt được hai request liên tiếp có phải đến từ cùng một người dùng hay không, hoặc hành động trước đó của cùng một người dùng là gì. Điều này giống như một người phục vụ bàn "mắc bệnh mau quên", mỗi lần bạn nói chuyện, người đó đều không biết bạn là ai và trước đó bạn đã gọi món gì.

Tuy nhiên, trong các ứng dụng Web thực tế như mua sắm trực tuyến, đăng nhập tài khoản..., chúng ta rõ ràng cần phải ghi nhớ trạng thái của người dùng (ví dụ sản phẩm trong giỏ hàng, thông tin đăng nhập của user). Để giải quyết vấn đề này, chủ yếu có các cơ chế phổ biến sau:

**Phương án 1: Session phối hợp cùng Cookie (Phương thức kinh điển chủ đạo):**

![Quy trình lưu trạng thái đăng nhập người dùng bằng Session phối hợp với Cookie](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/session-cookie-authentication-process-bd689be9.png)

Đây có thể coi là phương pháp kinh điển và phổ biến nhất từ trước đến nay. Quy trình cơ bản như sau:

1. Người dùng gửi username, password, mã xác thực lên server để đăng nhập vào hệ thống.
2. Sau khi xác thực thành công, máy chủ sẽ tạo một đối tượng Session dành riêng cho người dùng này (có thể hiểu là một vùng nhớ trên server lưu trữ dữ liệu trạng thái của người dùng đó như giỏ hàng, thông tin đăng nhập...) và gán cho Session này một mã định danh duy nhất là `SessionID`.
3. Máy chủ thông qua chỉ thị `Set-Cookie` trong HTTP response header để gửi `SessionID` này về cho trình duyệt của người dùng.
4. Trình duyệt sau khi nhận được `SessionID` sẽ lưu nó dưới dạng Cookie ở phía local. Khi người dùng tiếp tục thao tác, mỗi lần gửi request đến máy chủ đó, trình duyệt sẽ tự động đính kèm Cookie chứa `SessionID` này.
5. Khi máy chủ nhận được request, nó lấy `SessionID` từ Cookie ra, đối chiếu tìm lại đối tượng Session đã lưu trước đó, nhờ vậy biết được đây là người dùng nào và trạng thái trước đó của họ ra sao.

Những điểm cần lưu ý khi sử dụng Session:

- **Hỗ trợ Cookie phía client**: Các tính năng phụ thuộc vào Session bắt buộc phải đảm bảo trình duyệt người dùng có bật hỗ trợ Cookie.
- **Quản lý thời gian hết hạn của Session**: Thiết lập thời gian hết hạn (expiration) hợp lý để cân bằng giữa bảo mật và trải nghiệm người dùng.
- **Bảo mật cho Session ID**: Thiết lập cờ `HttpOnly` cho Cookie chứa `SessionID` để ngăn các script phía client (như JavaScript) đọc trộm, chống tấn công XSS; thiết lập cờ `Secure` để đảm bảo `SessionID` chỉ được truyền qua kết nối HTTPS, tăng cường an toàn.

Bản thân dữ liệu Session được lưu trữ ở phía máy chủ. Các hình thức lưu trữ phổ biến gồm có:

- **Bộ nhớ máy chủ (Server Memory)**: Triển khai đơn giản, tốc độ truy cập cực nhanh, nhưng khi máy chủ khởi động lại dữ liệu sẽ bị mất, và không thuận tiện cho việc cân bằng tải giữa nhiều server (load balancing). Cách này chỉ phù hợp với các ứng dụng đơn giản, lượng truy cập thấp.
- **Cơ sở dữ liệu quan hệ (như MySQL, PostgreSQL)**: Dữ liệu được lưu trữ bền vững (persistence), nhưng hiệu năng đọc ghi tương đối thấp, thông thường không dùng cách này để lưu session.
- **Bộ nhớ đệm phân tán (như Redis)**: Hiệu năng cực cao, hỗ trợ triển khai phân tán dạng cluster, là giải pháp chủ đạo tiêu chuẩn trong các ứng dụng quy mô lớn hiện nay.

**Phương án 2: Khi Cookie bị vô hiệu hóa: Ghi lại URL (URL Rewriting)**

Nếu trình duyệt của người dùng tắt Cookie, hoặc trong một số trường hợp không tiện dùng Cookie, có một giải pháp dự phòng là URL Rewriting. Cách này sẽ đính kèm trực tiếp `SessionID` vào cuối URL dưới dạng tham số query, ví dụ: `http://www.example.com/page?sessionid=xxxxxx`. Phía máy chủ sẽ phân tích tham số `sessionid` trong URL để lấy `SessionID`, từ đó tìm ra dữ liệu Session tương ứng.

Phương pháp này trong thực tế rất hiếm khi được sử dụng vì tồn tại các nhược điểm sau:

- URL bị kéo dài và mất thẩm mỹ;
- `SessionID` bị lộ trực tiếp trên thanh địa chỉ URL, độ bảo mật rất thấp (dễ dàng bị sao chép, chia sẻ nhầm hoặc bị ghi lại trong access log của máy chủ);
- Không thân thiện với công cụ tìm kiếm (SEO).

**Phương án 3: Xác thực dựa trên Token (như JWT - JSON Web Tokens)**

Đây là phương thức xác thực phi trạng thái (stateless) ngày càng phổ biến, đặc biệt phù hợp với kiến trúc phân tách Frontend - Backend và hệ thống Microservices.

![Sơ đồ quy trình xác thực danh tính bằng JWT](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-authentication-process-c0784a69.png)

Lấy JWT làm ví dụ (các giải pháp Token thông thường cũng tương tự), quy trình rút gọn như sau:

1. Người dùng gửi username, password và mã xác thực lên máy chủ để đăng nhập.
2. Nếu thông tin chính xác, máy chủ trả về một chuỗi Token đã được ký số mật mã (cryptographic signature), tức là JWT.
3. Client nhận được Token và tự lưu trữ nó ở phía client (ví dụ lưu trong `localStorage` của trình duyệt).
4. Về sau, mỗi lần người dùng gửi request lên backend, client đều đính kèm chuỗi JWT này trong HTTP Header (thường là trường `Authorization`).
5. Máy chủ kiểm tra chữ ký của JWT và trực tiếp giải mã lấy ra thông tin người dùng từ payload mà không cần phải truy vấn kiểm tra trong session store ở server.

Để tìm hiểu chi tiết về JWT, bạn có thể tham khảo hai bài viết sau:

- [Giải thích chi tiết các khái niệm cơ bản về JWT](https://javaguide.cn/system-design/security/jwt-intro.html)
- [Phân tích ưu nhược điểm của xác thực danh tính bằng JWT](https://javaguide.cn/system-design/security/advantages-and-disadvantages-of-jwt.html)

Tổng kết lại, mặc dù bản thân giao thức HTTP là phi trạng thái, nhưng thông qua Cookie + Session, URL Rewriting hoặc Token, chúng ta hoàn toàn có thể theo dõi và quản lý trạng thái người dùng trong ứng dụng Web một cách hiệu quả. Trong đó, **Cookie + Session là phương thức truyền thống và được sử dụng rộng rãi nhất, còn xác thực dựa trên Token ngày càng được ưa chuộng mạnh mẽ trong các ứng dụng Web hiện đại.**

### Sự khác biệt giữa URI và URL là gì?

- **URI (Uniform Resource Identifier)**: Là định danh tài nguyên thống nhất, có nhiệm vụ định danh duy nhất một tài nguyên.
- **URL (Uniform Resource Locator)**: Là bộ định vị tài nguyên thống nhất, cung cấp đường dẫn cụ thể để truy cập tới tài nguyên đó. URL là một dạng cụ thể của URI; tức là URL vừa dùng để định danh tài nguyên, vừa chỉ rõ cách thức làm sao để định vị (locate) được tài nguyên đó.

Một ví dụ so sánh dễ hiểu: URI giống như số Căn cước công dân (CCCD) dùng để định danh duy nhất một con người, còn URL giống như địa chỉ nhà cụ thể để tìm đến người đó. URL là một dạng URI cụ thể, nó không chỉ định danh duy nhất tài nguyên mà còn cung cấp thông tin dẫn đường để tìm đến tài nguyên đó.

### Sự khác biệt giữa Cookie và Session là gì?

Nói một cách chuẩn xác, câu hỏi này thuộc phạm trù xác thực và phân quyền (Authentication & Authorization). Bạn có thể tìm thấy câu trả lời đầy đủ và chi tiết trong bài viết [Giải thích chi tiết khái niệm cơ bản về xác thực và phân quyền](https://javaguide.cn/system-design/security/basis-of-authority-certification.html).

### ⭐️ Sự khác biệt giữa GET và POST

Câu hỏi này từng được thảo luận rất sôi nổi trên diễn đàn Zhihu: <https://www.zhihu.com/question/28586791>.

GET và POST là hai phương thức request được sử dụng phổ biến nhất trong giao thức HTTP, chúng có đặc điểm và cách dùng khác nhau tùy theo từng kịch bản và mục đích. Nhìn chung, có thể phân biệt hai phương thức này qua các khía cạnh sau (trọng tâm là nắm vững sự khác biệt về mặt ngữ nghĩa):

- **Ngữ nghĩa (Sự khác biệt cốt lõi)**: GET thường được dùng để lấy hoặc truy vấn tài nguyên, trong khi POST thường được dùng để tạo mới hoặc chỉnh sửa tài nguyên.
- **Tính lũy biến (Idempotence)**: Yêu cầu GET có tính lũy biến (idempotent), nghĩa là việc thực hiện lặp lại nhiều lần cùng một yêu cầu sẽ không làm thay đổi trạng thái của tài nguyên trên máy chủ; trong khi yêu cầu POST không có tính lũy biến (non-idempotent), mỗi lần thực thi có thể tạo ra các kết quả khác nhau hoặc làm thay đổi trạng thái của tài nguyên.
- **Định dạng dữ liệu**: Các tham số của yêu cầu GET thường được đặt trên URL tạo thành chuỗi truy vấn (querystring), trong khi tham số của yêu cầu POST thường được đặt trong thân yêu cầu (request body), hỗ trợ nhiều định dạng mã hóa như `application/x-www-form-urlencoded`, `multipart/form-data`, `application/json`... Độ dài URL của yêu cầu GET bị giới hạn bởi trình duyệt và máy chủ, trong khi kích thước body của yêu cầu POST về mặt giao thức không có giới hạn cụ thể. Dù trên thực tế yêu cầu GET vẫn có thể dùng body để truyền dữ liệu, nhưng điều này hoàn toàn không được khuyến khích vì có thể gây ra các vấn đề về tính tương thích hoặc sai lệch ngữ nghĩa trên các hệ thống trung gian.
- **Khả năng lưu bộ nhớ đệm (Cache)**: Vì yêu cầu GET có tính lũy biến, nó có thể được trình duyệt hoặc các node trung gian (như proxy, gateway, CDN) lưu vào cache để nâng cao hiệu năng và tốc độ phản hồi. Trong khi đó yêu cầu POST không thích hợp để cache vì nó gây ra hiệu ứng phụ (side effects) và mỗi lần thực thi thường đòi hỏi phản hồi thực tế từ hệ thống.
- **Tính an toàn và bảo mật**: Cả yêu cầu GET và POST nếu chạy trên giao thức HTTP thuần đều không an toàn, bởi bản thân HTTP truyền dữ liệu dưới dạng văn bản rõ (cleartext); bắt buộc phải dùng giao thức HTTPS để mã hóa dữ liệu truyền tải. Ngoài ra, yêu cầu GET dễ làm rò rỉ dữ liệu nhạy cảm hơn POST vì các tham số của GET thường phơi bày lộ liễu trên URL, lưu trong lịch sử duyệt web và log truy cập của máy chủ.

Nhắc lại một lần nữa: hãy tập trung nắm vững sự khác biệt về mặt **ngữ nghĩa**. Trong quá trình phát triển thực tế, chính ngữ nghĩa là yếu tố quyết định khi nào nên dùng GET và khi nào nên dùng POST. Dù vậy, cũng có một số dự án quy định tất cả các request đều dùng POST; điều này không cố định mà là quy ước thống nhất nội bộ của từng nhóm dự án.

## WebSocket

### WebSocket là gì?

WebSocket là một giao thức truyền thông song công toàn phần (full-duplex) hoạt động trên nền kết nối TCP, cho phép client và server có thể gửi và nhận dữ liệu đồng thời cùng lúc.

Giao thức WebSocket ra đời vào năm 2008 và chính thức trở thành tiêu chuẩn quốc tế RFC vào năm 2011. Hầu hết các trình duyệt hiện đại ngày nay đều hỗ trợ giao thức này. Hơn thế nữa, WebSocket không chỉ giới hạn trong các ứng dụng nền trình duyệt; rất nhiều ngôn ngữ lập trình, framework và web server đều cung cấp hỗ trợ đầy đủ cho WebSocket.

Về bản chất, WebSocket là giao thức thuộc tầng ứng dụng, ra đời nhằm bù đắp những thiếu sót của HTTP trong khả năng giao tiếp thời gian thực bền vững. Client và server chỉ cần thực hiện một lần bắt tay duy nhất là có thể trực tiếp thiết lập một kết nối liên tục, lâu dài và thực hiện truyền tải dữ liệu hai chiều nhanh chóng.

![WebSocket thiết lập kết nối bền vững hiện thực hóa giao tiếp hai chiều](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

Dưới đây là một số kịch bản ứng dụng phổ biến của WebSocket:

- Bình luận trực tiếp chạy trên video (Danmaku)
- Đẩy tin nhắn thời gian thực (xem chi tiết bài viết [Giải thích chi tiết về đẩy tin nhắn thời gian thực trên Web](https://javaguide.cn/system-design/web-real-time-message-push.html))
- Game trực tuyến đối kháng thời gian thực
- Chỉnh sửa tài liệu cộng tác nhiều người dùng cùng lúc
- Ứng dụng trò chuyện, chat trực tuyến
- ……

### ⭐️ WebSocket và HTTP khác nhau như thế nào?

Cả WebSocket và HTTP đều là các giao thức tầng ứng dụng hoạt động trên nền tảng TCP, đều dùng để truyền tải dữ liệu trên mạng.

Dưới đây là những điểm khác biệt chính giữa hai giao thức:

- WebSocket là giao thức giao tiếp **hai chiều thời gian thực (bidirectional)**, trong khi HTTP là giao thức giao tiếp **một chiều (unidirectional)** theo mô hình request-response. Hơn nữa, giao tiếp trong HTTP chỉ có thể do client chủ động khởi tạo; server không thể tự ý chủ động gửi dữ liệu cho client.
- WebSocket sử dụng tiền tố giao thức là `ws://` hoặc `wss://` (phiên bản được mã hóa bằng SSL/TLS, tương tự như mối quan hệ giữa HTTP và HTTPS), còn HTTP sử dụng tiền tố `http://` hoặc `https://`.
- WebSocket hỗ trợ cơ chế mở rộng, người dùng có thể mở rộng giao thức để triển khai một số giao thức con (subprotocol) tùy chỉnh, ví dụ hỗ trợ nén, mã hóa...
- Định dạng dữ liệu truyền tải của WebSocket rất tinh gọn, phần header gói tin dùng cho việc điều khiển giao thức tương đối nhỏ, chi phí mạng cực thấp. Trong khi đó, mỗi lần giao tiếp qua HTTP đều phải đính kèm toàn bộ header đầy đủ, tạo ra chi phí mạng lớn hơn nhiều (dù HTTP/2.0 đã cải thiện bằng khung nhị phân và nén header).

### Quá trình hoạt động của WebSocket diễn ra như thế nào?

Quá trình làm việc của WebSocket có thể chia thành các bước cơ bản sau:

1. Client gửi một HTTP request thông thường lên máy chủ, trong header chứa các trường `Upgrade: websocket` và `Sec-WebSocket-Key`..., thể hiện mong muốn nâng cấp giao thức lên WebSocket.
2. Sau khi nhận được request này, máy chủ sẽ tiến hành thao tác nâng cấp giao thức. Nếu hỗ trợ WebSocket, máy chủ sẽ phản hồi lại mã trạng thái HTTP `101 Switching Protocols`, trong response header chứa các trường `Connection: Upgrade` và `Sec-WebSocket-Accept: xxx`..., biểu thị đã nâng cấp thành công lên giao thức WebSocket.
3. Một kết nối WebSocket bền vững được thiết lập giữa client và máy chủ, cho phép truyền dữ liệu hai chiều. Dữ liệu được truyền tải dưới dạng các khung (`frames`), mỗi thông điệp WebSocket có thể được chia nhỏ thành nhiều khung dữ liệu (đơn vị truyền tải nhỏ nhất). Phía gửi sẽ cắt thông điệp thành nhiều frame để gửi đi, phía nhận sẽ nhận các frame này và ghép chúng lại thành thông điệp hoàn chỉnh ban đầu.
4. Client hoặc máy chủ có thể chủ động gửi đi một Close Frame (khung đóng kết nối) khi muốn ngắt kết nối. Bên còn lại khi nhận được cũng sẽ gửi phản hồi một Close Frame tương ứng, sau đó hai bên chính thức đóng kết nối TCP bên dưới.

Ngoài ra, sau khi kết nối WebSocket đã được thiết lập, hệ thống sẽ sử dụng cơ chế nhịp tim (heartbeat ping/pong) để duy trì tính ổn định và kiểm tra trạng thái hoạt động của kết nối qua các proxy hoặc gateway trung gian.

### ⭐️ Phân biệt WebSocket với Short Polling và Long Polling

Cả ba phương thức này đều ra đời nhằm giải quyết cùng một bài toán: "**Làm thế nào để client kịp thời nhận được dữ liệu mới nhất từ máy chủ để cập nhật dữ liệu thời gian thực**". Tuy nhiên, cách thức triển khai, hiệu năng và tính kịp thời của chúng có sự chênh lệch rất lớn.

**1. Short Polling (Bỏ phiếu ngắn)**

- **Nguyên lý**: Client cứ sau một khoảng thời gian cố định (ví dụ mỗi 5 giây) lại gửi một HTTP request lên máy chủ để hỏi xem có dữ liệu mới hay không. Máy chủ khi nhận được request sẽ lập tức phản hồi ngay.
- **Ưu điểm**: Triển khai đơn giản, tính tương thích tuyệt đối, chỉ cần sử dụng các request HTTP thông thường là làm được.
- **Nhược điểm**:
  - **Tính thời gian thực trung bình**: Dữ liệu mới có thể xuất hiện giữa hai lần thăm dò, người dùng buộc phải đợi đến lần request tiếp theo mới biết.
  - **Lãng phí tài nguyên rất lớn**: Liên tục thiết lập và đóng kết nối TCP; đa số các request nhận về đều là "không có dữ liệu mới", gây áp lực tải vô ích khổng lồ lên máy chủ và đường truyền mạng.

**2. Long Polling (Bỏ phiếu dài)**

- **Nguyên lý**: Client gửi request lên máy chủ. Nếu máy chủ chưa có dữ liệu mới, nó sẽ treo và giữ kết nối mở đó, chờ cho đến khi có dữ liệu mới hoặc hết thời gian timeout mới gửi phản hồi về. Client ngay sau khi nhận được phản hồi sẽ lập tức gửi tiếp một request mới, tạo ra hiệu ứng "thời gian thực giả lập".
- **Ưu điểm**:
  - **Tính thời gian thực tốt hơn**: Ngay khi có dữ liệu mới, máy chủ có thể đẩy về ngay mà không cần đợi bộ hẹn giờ định kỳ.
  - **Giảm phản hồi rỗng**: Giảm bớt số lượng phản hồi rỗng vô ích so với short polling, nâng cao hiệu quả.
- **Nhược điểm**:
  - **Chiếm dụng tài nguyên máy chủ cao**: Máy chủ phải duy trì mở một lượng lớn kết nối trong thời gian dài, tiêu tốn thread và connection pool của máy chủ.
  - **Chi phí thiết lập kết nối vẫn lớn**: Sau mỗi lần phản hồi vẫn phải mở lại một kết nối mới, và vẫn bị trói buộc trong cơ chế request-response một chiều của HTTP.

**3. WebSocket**

- **Nguyên lý**: Client và server sau một lần bắt tay HTTP Upgrade duy nhất sẽ thiết lập một kết nối TCP bền vững lâu dài. Sau đó, hai bên có thể chủ động gửi nhận dữ liệu bất cứ lúc nào, hiện thực hóa truyền thông song công toàn phần (full-duplex) với độ trễ cực thấp.
- **Ưu điểm**:
  - **Tính thời gian thực cực mạnh**: Dữ liệu có thể được gửi nhận hai chiều tức thì với độ trễ tối thiểu.
  - **Hiệu suất tài nguyên cao**: Kết nối được duy trì liên tục, không cần thiết lập/đóng lặp đi lặp lại, tiết kiệm tối đa CPU và băng thông.
  - **Tính năng mạnh mẽ**: Hỗ trợ server chủ động đẩy dữ liệu và client chủ động gửi dữ liệu hoàn toàn đối xứng.
- **Nhược điểm**:
  - **Giới hạn môi trường**: Đòi hỏi cả client và máy chủ đều phải hỗ trợ giao thức WebSocket. Yêu cầu cơ chế quản lý kết nối phức tạp (như heartbeat duy trì kết nối, tự động kết nối lại khi mất mạng...).
  - **Triển khai phức tạp**: Việc triển khai, mở rộng quy mô và cân bằng tải phức tạp hơn so với polling HTTP thông thường.

![So sánh phương thức giao tiếp giữa WebSocket với Short Polling và Long Polling](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

### ⭐️ SSE và WebSocket khác nhau như thế nào?

SSE (Server-Sent Events) và WebSocket đều là các công nghệ dùng để hiện thực hóa việc máy chủ đẩy tin nhắn thời gian thực về cho trình duyệt, giúp nội dung trang web tự động cập nhật mà không cần người dùng phải bấm F5 tải lại trang. Mặc dù mục tiêu tương đồng, nhưng phương thức hoạt động và kịch bản áp dụng của chúng có một số khác biệt then chốt:

1. **Phương thức giao tiếp:**
   - **SSE:** **Giao tiếp một chiều (Unidirectional)**. Chỉ có máy chủ mới có thể truyền dữ liệu về cho client (trình duyệt). Client không thể thông qua cùng một kết nối đó để gửi ngược dữ liệu lên máy chủ (nếu muốn gửi dữ liệu, client phải khởi tạo một request HTTP riêng biệt khác).
   - **WebSocket:** **Giao tiếp hai chiều (Song công toàn phần - Full-Duplex)**. Cả client và máy chủ đều có thể chủ động gửi tin nhắn cho nhau bất kỳ lúc nào trên cùng một kết nối, mang lại khả năng tương tác thời gian thực thực sự.
2. **Giao thức nền tảng:**
   - **SSE:** Dựa trên **giao thức chuẩn HTTP/HTTPS**. Về bản chất, nó là một HTTP request dạng kết nối dài (persistent connection), máy chủ giữ cho kết nối luôn mở và liên tục truyền tải luồng sự kiện (`text/event-stream`). Không đòi hỏi máy chủ đặc thù hay giao thức riêng biệt nào, tương thích hoàn toàn với hạ tầng HTTP sẵn có (reverse proxy, load balancer, CDN).
   - **WebSocket:** Sử dụng **giao thức độc lập `ws://` hoặc `wss://`**. Nó đòi hỏi phải thông qua một yêu cầu HTTP "Upgrade" chuyên biệt để thiết lập kết nối, và máy chủ bắt buộc phải hỗ trợ tường minh giao thức WebSocket để quản lý kết nối và các khung thông điệp (message frames).
3. **Độ phức tạp và chi phí triển khai:**
   - **SSE:** **Triển khai tương đối đơn giản**, chủ yếu xử lý logic luồng ở phía máy chủ. Phía trình duyệt đã có sẵn API tiêu chuẩn `EventSource` rất dễ sử dụng. Chi phí phát triển và bảo trì thấp.
   - **WebSocket:** **Phức tạp hơn đáng kể**. Cần máy chủ chuyên trách xử lý kết nối và giao thức WebSocket, phía client cũng phải dùng WebSocket API riêng. Nếu cần xử lý thêm các bài toán về tương thích, heartbeat, tự động kết nối lại (reconnect), chi phí phát triển sẽ cao hơn nhiều.
4. **Tự động kết nối lại (Reconnection):**
   - **SSE:** **Được trình duyệt hỗ trợ nguyên bản (native)**. Đối tượng `EventSource` của trình duyệt tự động cung cấp cơ chế ngắt mạng và tự động kết nối lại mà lập trình viên không cần viết thêm code.
   - **WebSocket:** **Phải tự triển khai thủ công**. Lập trình viên phải tự viết mã logic để bắt sự kiện đứt kết nối và thực hiện kết nối lại theo chiến lược riêng.
5. **Định dạng dữ liệu:**
   - **SSE:** **Được thiết kế chủ yếu để truyền tải văn bản** (mã hóa UTF-8). Nếu cần truyền dữ liệu nhị phân, phải mã hóa sang văn bản (như Base64) trước khi truyền.
   - **WebSocket:** **Hỗ trợ nguyên bản cả dữ liệu văn bản lẫn dữ liệu nhị phân** (như ArrayBuffer, Blob) mà không cần mã hóa thêm.

Nhờ mang lại trải nghiệm người dùng tuyệt vời cùng ưu điểm đơn giản, hiệu quả cao và tương thích chuẩn HTTP, **Server-Sent Events (SSE) hiện là giải pháp kỹ thuật tiêu chuẩn phổ biến nhất được các API Mô hình Ngôn ngữ Lớn (LLM) hàng đầu (như OpenAI, DeepSeek...) lựa chọn để triển khai luồng phản hồi streaming**.

Lấy DeepSeek làm ví dụ, khi chúng ta gửi một câu hỏi và mở bảng điều khiển DevTools của trình duyệt lên để kiểm tra:

![Response header của DeepSeek](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/deepseek-sse-575a911b.png)

![Phản hồi SSE của DeepSeek sử dụng text/event-stream truyền sự kiện liên tục](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/deepseek-sse-eventstream-f35c5785.png)

Có thể thấy rõ response header chứa `Content-Type: text/event-stream`, chứng minh hệ thống đang sử dụng chính xác công nghệ SSE, và dữ liệu phản hồi được chia thành từng khối nhỏ truyền về liên tục theo thời gian thực.

## PING

### Lệnh PING có tác dụng gì?

Lệnh PING là một công cụ chẩn đoán mạng phổ biến, thường được dùng để kiểm tra tính thông suốt của kết nối giữa các máy chủ trong mạng và đo lường độ trễ mạng (latency).

Dưới đây là một ví dụ đơn giản khi chúng ta PING thử đến máy chủ Baidu:

```bash
# Gửi 4 gói tin yêu cầu PING đến www.baidu.com
❯ ping -c 4 www.baidu.com

PING www.a.shifen.com (14.119.104.189): 56 data bytes
64 bytes from 14.119.104.189: icmp_seq=0 ttl=54 time=27.867 ms
64 bytes from 14.119.104.189: icmp_seq=1 ttl=54 time=28.732 ms
64 bytes from 14.119.104.189: icmp_seq=2 ttl=54 time=27.571 ms
64 bytes from 14.119.104.189: icmp_seq=3 ttl=54 time=27.581 ms

--- www.a.shifen.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 27.571/27.938/28.732/0.474 ms
```

Kết quả hiển thị của lệnh PING thông thường bao gồm các phần thông tin sau:

1. **Thông tin ICMP Echo Request (gói tin yêu cầu)**: Số thứ tự tuần tự (`icmp_seq`), giá trị TTL (Time to Live).
2. **Tên miền hoặc địa chỉ IP của máy chủ đích**: Nằm ở dòng đầu tiên của kết quả.
3. **Thời gian khứ hồi (RTT - Round-Trip Time)**: Tổng thời gian tính từ khi gửi gói ICMP Echo Request đến khi nhận được gói phản hồi ICMP Echo Reply, dùng để đo lường độ trễ của kết nối mạng.
4. **Kết quả thống kê (Statistics)**: Bao gồm số lượng gói tin ICMP đã gửi, số lượng gói phản hồi nhận được, tỷ lệ mất gói (packet loss), cùng các giá trị RTT nhỏ nhất (min), trung bình (avg), lớn nhất (max) và độ lệch chuẩn (stddev).

Nếu không nhận được phản hồi chính xác từ máy chủ đích, điều đó chứng tỏ khả năng kết nối giữa hai máy chủ đang gặp sự cố (cần lưu ý một số máy chủ hoặc quản trị viên mạng có thể chủ động chặn phản hồi các gói tin ICMP, trường hợp này cũng dẫn đến việc không nhận được phản hồi). Nếu thời gian khứ hồi (RTT) quá cao, điều đó cho thấy độ trễ mạng đang ở mức rất cao.

### Nguyên lý hoạt động của lệnh PING là gì?

PING hoạt động ở tầng mạng, dựa trên nền tảng của **ICMP (Internet Control Message Protocol - Giao thức điều khiển bản tin Internet)**. Nguyên lý cơ bản của nó là gửi và nhận các gói tin ICMP qua lại trên mạng.

Gói tin ICMP chứa trường `Type` dùng để định danh loại thông điệp. Có rất nhiều loại gói tin ICMP khác nhau, nhưng nhìn chung có thể chia thành hai nhóm chính:

- **Loại thông điệp truy vấn (Query Messages)**: Gửi yêu cầu đến máy chủ đích và mong đợi nhận lại phản hồi.
- **Loại thông điệp báo lỗi (Error Messages)**: Gửi thông báo lỗi về cho máy chủ nguồn để thông báo về các sự cố bất thường xảy ra trên đường truyền mạng.

Gói tin ICMP Echo Request (Type = 8) và ICMP Echo Reply (Type = 0) mà lệnh PING sử dụng đều thuộc nhóm thông điệp truy vấn.

- Lệnh PING sẽ gửi một gói ICMP Echo Request đến máy chủ đích.
- Nếu kết nối giữa hai máy hoạt động bình thường, máy chủ đích sẽ gửi trả lại một gói tin tương ứng là ICMP Echo Reply.

### ⭐️ Ping thông thì TCP có chắc chắn kết nối được không?

Kết luận ngắn gọn: **Không chắc chắn**.

Ping sử dụng giao thức ICMP (thuộc tầng mạng), còn kết nối TCP hoạt động trên giao thức TCP (thuộc tầng giao vận). Hai giao thức này có thể đi qua cùng một tuyến đường vật lý trên mạng, nhưng các thiết bị mạng trung gian (như router, firewall, switch) sẽ xử lý riêng biệt dựa trên loại giao thức, số cổng, trạng thái kết nối và chính sách bảo mật. Việc bạn Ping thông chỉ chứng tỏ đường truyền khứ hồi của gói tin ICMP Echo hoạt động tốt, chứ không đồng nghĩa với việc cổng TCP trên máy chủ đích chắc chắn có thể kết nối tới được.

![Sự khác biệt đường đi giữa ICMP và TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-ping-but-tcp-may-not-connect-icmp-and-tcp-pa-5e8a0530.png)

Các nguyên nhân phổ biến dẫn đến tình trạng này:

- **Chính sách tường lửa khác nhau**: Nhiều thiết bị mạng mở ICMP (để tiện cho việc quản trị viên kiểm tra và giám sát mạng), nhưng lại khóa chặt các cổng TCP, chỉ mở một vài cổng cụ thể như `22`, `80`, `443`, toàn bộ các cổng khác đều bị chặn hoàn toàn.
- **Dịch vụ chưa khởi động hoặc cổng chưa được lắng nghe**: Máy chủ đích vẫn phản hồi gói tin ICMP bình thường, nhưng dịch vụ Nginx chưa bật, MySQL chưa lắng nghe trên cổng đó, dẫn đến Ping thông nhưng không thể kết nối TCP.
- **Có thiết bị NAT / Load Balancer / Thiết bị bảo mật ở giữa**: Địa chỉ IP public có thể chỉ là một thiết bị trung gian chứ không phải máy chủ thực tế. Gói tin ICMP có thể được phản hồi ngay bởi thiết bị trung gian đó, hoàn toàn không đại diện cho việc dịch vụ phía sau đang sẵn sàng hoạt động.
- **HTTPS có thể bị nghẽn ở bước SNI trong bắt tay TLS**: Quá trình bắt tay 3 bước TCP có thể đã thành công mỹ mãn, nhưng trường SNI (Server Name Indication) trong gói `ClientHello` bị các thiết bị kiểm duyệt trung gian phát hiện và chặn đứng, khiến kết nối bị reset hoặc treo cứng.

Điều ngược lại cũng hoàn toàn đúng: **Ping không thông, không có nghĩa là TCP chắc chắn bị chặn**. Một số máy chủ hoặc nhóm bảo mật trên đám mây (Cloud Security Group) chủ động vô hiệu hóa hoàn toàn ICMP để đảm bảo bí mật, nhưng các cổng dịch vụ nghiệp vụ TCP vẫn hoạt động hoàn toàn bình thường.

Lời khuyên khi điều tra sự cố: Hãy kiểm tra DNS trước (nếu dùng tên miền), sau đó dùng `ping` để kiểm tra kết nối ICMP, tiếp tục dùng `nc` (netcat) để kiểm tra cổng kết nối, và cuối cùng dùng `curl` hoặc `openssl s_client` để kiểm tra quá trình bắt tay HTTPS / TLS. Tuyệt đối không vội vàng đưa ra kết luận phiến diện chỉ dựa vào một câu lệnh duy nhất.

![Các tầng điều tra sự cố kết nối HTTPS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-ping-but-tcp-may-not-connect-https-connectio-3fcb5151.png)

Chi tiết: [Ping thông thì TCP có chắc chắn kết nối được không?](./can-ping-but-tcp-may-not-connect.md).

## DNS

### Vai trò của DNS là gì?

Hệ thống phân giải tên miền DNS (Domain Name System) là giao thức quan trọng đầu tiên được kích hoạt ngay khi người dùng sử dụng trình duyệt để truy cập một trang web. Mục tiêu cốt lõi của DNS là **giải quyết bài toán ánh xạ giữa tên miền thân thiện với con người và địa chỉ IP của máy tính**.

![Tổng quan hệ thống DNS phân giải tên miền thành địa chỉ IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/dns-overview-4619e349.png)

Trên một máy tính cá nhân, có thể tồn tại DNS cache của trình duyệt, DNS cache của hệ điều hành, và DNS cache của bộ định tuyến (router). Nếu tất cả các tầng cache trên đều không tìm thấy thông tin, lúc này hệ thống phân giải DNS trên mạng sẽ chính thức vào cuộc.

Hệ thống DNS hiện nay được thiết kế theo cấu trúc cơ sở dữ liệu phân tán có thứ bậc. **DNS là một giao thức tầng ứng dụng, nó có thể hoạt động trên cả giao thức UDP lẫn TCP tại cổng 53**.

### Có những loại máy chủ DNS nào? Có bao nhiêu máy chủ gốc (Root Server)?

DNS có thể được mô tả theo hai góc nhìn. Phân cấp thẩm quyền (Authoritative Hierarchy) bao gồm máy chủ gốc (Root Server), máy chủ tên miền cấp cao nhất (TLD Server) và máy chủ thẩm quyền của từng khu vực cụ thể (Authoritative Server). Ở phía truy vấn (Query Side) bao gồm các thành phần như Stub Resolver, Recursive Resolver (bộ phân giải đệ quy) và Forwarder. Một phần mềm hoặc một máy chủ vật lý có thể đảm nhiệm nhiều vai trò cùng lúc, do đó các phân loại này đại diện cho các vai trò chức năng chứ không phải các loại máy chủ loại trừ lẫn nhau.

- **Máy chủ DNS gốc (Root DNS Server)**: Cung cấp thông tin chuyển hướng (referral) tới máy chủ TLD cho bên truy vấn.
- **Máy chủ DNS cấp cao nhất (TLD Server)**: Trả về thông tin chuyển hướng tới máy chủ thẩm quyền quản lý tên miền đích.
- **Máy chủ DNS thẩm quyền (Authoritative DNS Server)**: Lưu trữ dữ liệu hồ sơ chính thức của một hoặc nhiều vùng tên miền (zones), đưa ra câu trả lời có tính thẩm quyền cao nhất cho các truy vấn trong vùng quản lý đó.
- **Bộ phân giải đệ quy (Recursive Resolver)**: Tiếp nhận truy vấn từ phía client, kiểm tra cache nội bộ trước, khi cần thiết sẽ chủ động lần lượt truy vấn qua máy chủ Gốc, TLD và Thẩm quyền thay cho client. Nó thuộc về vai trò phía truy vấn, không phải là một tầng trong hệ thống phân cấp thẩm quyền của DNS.

Về mặt logic, hệ thống máy chủ gốc có 13 định danh máy chủ gốc được đặt tên từ `a.root-servers.net` đến `m.root-servers.net`, do 12 tổ chức vận hành độc lập quản lý. Đằng sau mỗi định danh logic này, công nghệ Anycast được ứng dụng để triển khai hàng trăm phiên bản máy chủ vật lý phân bổ trên toàn cầu. Số lượng và vị trí các máy chủ vật lý này liên tục biến động theo thời gian thực; bạn có thể tra cứu số liệu cập nhật mới nhất tại [Root-Servers.org](https://root-servers.org/). Tuyệt đối không được hiểu nhầm rằng 13 định danh logic có nghĩa là cả thế giới chỉ có đúng 13 chiếc máy chủ vật lý.

### ⭐️ Quá trình phân giải DNS diễn ra như thế nào?

Toàn bộ quy trình phân giải DNS gồm khá nhiều bước chi tiết, tôi đã viết riêng một bài viết phân tích cặn kẽ về chủ đề này: [Giải thích chi tiết về hệ thống tên miền DNS (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/dns.html).

### Bạn có hiểu về tấn công DNS Hijacking không? Làm thế nào để đối phó?

Tấn công chiếm quyền điều khiển DNS (DNS Hijacking) là một hình thức tấn công mạng bằng cách sửa đổi kết quả phân giải của máy chủ DNS, khiến tên miền người dùng truy cập bị trỏ tới một địa chỉ IP sai lệch, từ đó làm cho người dùng không thể truy cập vào website chính thống, hoặc bị chuyển hướng lừa đảo sang các website độc hại giả mạo. DNS Hijacking đôi khi còn được gọi với các tên như chuyển hướng DNS (DNS redirection), giả mạo DNS (DNS spoofing) hoặc đầu độc bộ nhớ đệm DNS (DNS cache poisoning).

## Tài liệu tham khảo

- *Đồ giải HTTP (Illustrated HTTP)*
- *Mạng máy tính: Tiếp cận từ trên xuống (Computer Networking: A Top-Down Approach - Phiên bản thứ 7)*
- Phân tích chi tiết về giao thức HTTP/2.0 và HTTPS: <https://juejin.cn/post/7034668672262242318>
- Tổng hợp đầy đủ các trường HTTP Request Header: <https://www.flysnow.org/tools/table/http-request-headers/>
- HTTP1, HTTP2, HTTP3: <https://juejin.cn/post/6855470356657307662>
- Đánh giá về HTTP/3 như thế nào? - Câu trả lời trên Zhihu: <https://www.zhihu.com/question/302412059/answer/533223530>
