---
title: TCP Keepalive và HTTP Keep-Alive Có Gì Khác Nhau?
description: So sánh chi tiết TCP Keepalive và HTTP Keep-Alive qua tầng giao thức, vai trò cốt lõi, hành vi mặc định, cơ chế thu hồi và kịch bản thực tế, làm rõ sự tiến hóa của cơ chế Keep-Alive qua HTTP/1.0, HTTP/1.1, HTTP/2 và HTTP/3.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: TCP Keepalive,HTTP Keep-Alive,Keep-Alive,kết nối dài,kết nối ngắn,persistent connection,TCP bảo hoạt,HTTP/1.0,HTTP/1.1,HTTP/2,HTTP/3,QUIC,UDP,SO_KEEPALIVE
lang: vi
sourceRef: zh-ref/cs-basics/network/tcp-keepalive-vs-http-keepalive.md
---

Xin chào, tôi là Xiao G. Việc so sánh giữa TCP Keepalive và HTTP Keep-Alive là câu hỏi rất hay xuất hiện trong các buổi phỏng vấn kỹ thuật. Bài viết này sẽ cùng bạn phân tích cặn kẽ chủ đề này.

Nói một cách ngắn gọn, hai khái niệm này tuy có phần đuôi tên giống nhau nhưng bản chất là hai cơ chế hoàn toàn khác biệt, nằm ở hai tầng giao thức tách biệt trong mô hình mạng:

- **HTTP Keep-Alive** là cơ chế thuộc tầng ứng dụng (Application Layer), giải quyết bài toán: một kết nối TCP có thể được tái sử dụng để phục vụ nhiều request HTTP hay không, tránh việc mỗi request lại phải bắt tay thiết lập kết nối từ đầu.
- **TCP Keepalive** là cơ chế thuộc tầng giao vận (Transport Layer), giải quyết bài toán: khi một kết nối TCP không có dữ liệu trao đổi trong thời gian dài, làm sao để biết đầu bên kia còn sống hay không, và có nên thu hồi tài nguyên mà kết nối đó đang chiếm dụng hay không.

![Vị trí của HTTP và TCP trong mô hình 4 tầng TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

Một bên quản lý việc "kết nối có được tái sử dụng hay không", một bên quản lý việc "kết nối còn sống hay đã chết". Tầng giao thức khác nhau, mục đích khác nhau, chỉ là trùng tên gọi mà thôi.

Dưới đây chúng ta sẽ phân tích từng cơ chế.

## HTTP Keep-Alive là gì?

Trước hết hãy nhìn vào bài toán mà nó giải quyết. Hành vi mặc định trong HTTP/1.0 là: mỗi kết nối TCP chỉ phục vụ duy nhất một cặp request và response. Sau khi Server gửi xong response, nó lập tức phát đi yêu cầu đóng kết nối, Client đóng theo, và kết nối TCP bị ngắt ở cả hai chiều.

![Tổng quan về giao thức truyền siêu văn bản HTTP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

Khi bạn mở một trang web, trình duyệt có thể phải tải về hàng chục tài nguyên gồm HTML, CSS, JS, hình ảnh... Nếu mỗi tài nguyên đều phải mở kết nối TCP riêng rồi lại hủy ngay lập tức, chi phí cho các lần ba bước bắt tay và bốn bước bắt tay đóng sẽ cực kỳ lớn, hiệu suất sử dụng kết nối TCP vô cùng thấp.

Vấn đề đặt ra rất hiển nhiên: **Tại sao một kết nối TCP không thể phục vụ nhiều request HTTP liên tiếp?**

Vì vậy, HTTP đã đưa vào header `Connection`. Lấy HTTP/1.0 làm ví dụ, Client có thể đính kèm trong request header:

```
Connection: Keep-Alive
```

Nếu Server đồng ý và xác nhận trường này trong response header, điều đó biểu thị cả hai bên thống nhất sử dụng kết nối TCP hiện tại như một **kết nối dài / kết nối bền bỉ (Persistent Connection)** — sau khi chu kỳ request/response kết thúc thì chưa đóng vội, các request HTTP tiếp theo có thể tái sử dụng ngay kết nối này cho đến khi kết nối bị nhàn rỗi quá lâu, chạm giới hạn số lượng request, hoặc một trong hai bên chủ động đóng kết nối.

**Trong các phiên bản HTTP khác nhau, hành vi mặc định của Keep-Alive là khác nhau:**

![Hành vi mặc định của Keep-Alive khác nhau qua từng phiên bản HTTP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/different-http-versions-have-different-default-k-f743d0f1.png)

- **HTTP/1.0**: Mặc định là kết nối ngắn (Short Connection). Muốn dùng kết nối dài, request header phải khai báo tường minh `Connection: Keep-Alive`, và Server cũng phải phản hồi trường này trong response header thì mới có hiệu lực.
- **HTTP/1.1**: Mặc định là kết nối dài (Persistent Connection), không cần khai báo bổ sung. Nếu muốn đóng kết nối ngay sau request, cần chỉ định rõ: `Connection: close`. Đây là lý do vì sao HTTP/1.1 giảm thiểu đáng kể chi phí bắt tay và đóng kết nối TCP so với HTTP/1.0.
- **HTTP/2**: HTTP/2 không còn duy trì cách tiếp cận xử lý tuần tự nhiều request trên một kết nối như HTTP/1.x, mà đưa vào cơ chế đa luồng kênh hóa (Multiplexing). Nghĩa là trên một kết nối TCP duy nhất có thể đồng thời truyền nhiều Stream song song, các request và response có thể đan xen nhau mà không bị chặn, giải quyết triệt để vấn đề Head-of-Line (HoL) blocking ở tầng ứng dụng của HTTP/1.1. Tuy nhiên, HTTP/2 vẫn chạy trên một kết nối TCP đơn lẻ, hễ tầng TCP bên dưới bị rớt gói thì các dữ liệu phía sau vẫn phải chờ truyền lại, do đó nó vẫn chịu ảnh hưởng của TCP HoL blocking. Cơ chế điều khiển kết nối kiểu HTTP/1.x không còn ý nghĩa trong HTTP/2. Chính xác hơn, các header đặc thù của kết nối như `Connection`, `Keep-Alive`, `Transfer-Encoding` bị cấm hoàn toàn trong HTTP/2, và các thông điệp chứa các header này sẽ bị coi là không hợp lệ.
- **HTTP/3**: HTTP/3 được xây dựng dựa trên giao thức QUIC chạy trên nền UDP, không còn phụ thuộc vào kết nối TCP và cũng không dùng cơ chế `Connection: Keep-Alive` của HTTP/1.x. Bản thân QUIC tự quản lý kết nối, tự thăm dò sống còn và đa luồng kênh hóa, đồng thời giải quyết triệt để vấn đề HoL blocking ở tầng giao vận.

Tóm tắt một câu: HTTP/1.0 cần khai báo Keep-Alive thủ công, HTTP/1.1 mặc định tái sử dụng kết nối, HTTP/2 nâng cấp lên thành "đa luồng kênh hóa trên một kết nối TCP", còn HTTP/3 chuyển hẳn sang quản lý kết nối dựa trên QUIC.

## HTTP kết nối dài đóng và thu hồi tài nguyên như thế nào?

Kết nối dài giúp nâng cao hiệu quả sử dụng TCP, nhưng cũng kéo theo một vấn đề mới: Client mở một trang web, kết nối TCP đã dựng xong, nhưng sau đó người dùng cứ để mặc tab trình duyệt ở đó mà không làm gì nữa. Kết nối này bị nhàn rỗi (idle), Server không thể chờ đợi vô hạn, nhưng cũng không thể trông chờ hoàn toàn vào sự tự giác đóng kết nối của Client.

Nếu các kết nối nhàn rỗi này tích tụ quá nhiều, tài nguyên TCB (TCP Control Block) của Server sẽ bị chiếm dụng lãng phí.

Giải pháp của HTTP là mang theo hai tham số trong header `Keep-Alive`:

```
Keep-Alive: timeout=5, max=10
```

- **timeout=5**: Nếu kết nối không có dữ liệu (idle) quá 5 giây, Server có quyền đóng kết nối.
- **max=10**: Kết nối này phục vụ tối đa 10 request HTTP, chạm ngưỡng này Server sẽ cưỡng chế đóng kết nối.

Có một điểm rất dễ bỏ sót: **Hễ chạm tới ngưỡng timeout hoặc max, Server có quyền đóng kết nối bất kể lúc đó Client có đang online hay không.** Nếu đúng thời điểm đó Client lại tận dụng kết nối cũ này để gửi request mới thì có thể gặp lỗi kết nối đã đóng, buộc phải retry.

Nói cách khác, việc thu hồi kết nối nhàn rỗi của HTTP Keep-Alive thường do cấu hình phía Server nắm quyền chủ động. Client dĩ nhiên có thể chủ động ngắt kết nối, nhưng Server sẽ không đời nào chờ đợi Client ra quyết định mãi.

Trong các Web Server thực tế, các tham số này do Server định đoạt. Chẳng hạn trên Nginx, `keepalive_timeout` có giá trị mặc định là 75 giây, còn `keepalive_requests` mặc định là 1000 (các bản trước Nginx 1.19.10 mặc định là 100).

## TCP Keepalive là gì?

Bài toán mà TCP Keepalive giải quyết hoàn toàn khác biệt: Nó không quan tâm trên kết nối có đang chạy request HTTP nào hay không, thứ nó quan tâm duy nhất là — **đối phương ở đầu bên kia rốt cuộc còn sống hay không**.

Hãy hình dung kịch bản sau: Client và Server thiết lập một kết nối TCP, nhưng Client bất ngờ bị mất điện, bị rút dây mạng hoặc máy bị sập nguồn đột ngột. Lúc này Server hoàn toàn không thể biết đầu bên kia đã biến mất, bởi vì TCP không giống như đường dây điện thoại thoại thông thường, nó không có "tiếng tút bận". Kết nối này trở thành một kết nối "bán mở" (Half-Open) dạng zombie, chiếm dụng bộ nhớ TCB của Server một cách vô ích.

TCP Keepalive sinh ra để phát hiện tình huống này. Quy trình hoạt động của nó như sau:

![Nguyên lý hoạt động của TCP Keepalive](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-wo-7f50afab.png)

1. Trên một kết nối TCP, nếu suốt một khoảng thời gian không có bất kỳ dữ liệu nào lưu thông (mặc định là **7200 giây, tức 2 giờ**), Kernel sẽ tự động gửi sang đối phương một **gói tin thăm dò (Probe)**.
2. Nếu đối phương vẫn hoạt động bình thường, họ sẽ phản hồi lại gói ACK; đồng hồ đếm thời gian được reset lại từ đầu, tiếp tục chờ 2 giờ nữa.
3. Nếu đối phương không phản hồi, cứ sau mỗi **75 giây** Kernel lại gửi lại gói thăm dò, thử lại tối đa **9 lần**.
4. Sau 9 lần thử mà vẫn bặt vô âm tín, Kernel phán quyết kết nối đã chết, phát đi gói RST để hủy kết nối và giải phóng tài nguyên.

Ba tham số này trên Linux tương ứng với các cấu hình kernel sau:

| Tham số | Ý nghĩa | Giá trị mặc định trên Linux |
| --- | --- | --- |
| `tcp_keepalive_time` | Thời gian nhàn rỗi trước khi bắt đầu gửi gói thăm dò | 7200 giây (2 giờ) |
| `tcp_keepalive_intvl` | Khoảng thời gian giữa hai lần gửi gói thăm dò | 75 giây |
| `tcp_keepalive_probes` | Số lần gửi gói thăm dò tối đa | 9 lần |

Hệ điều hành macOS thuộc nhánh BSD, không có tiền tố `net.ipv4.*`, mà tương ứng với: `net.inet.tcp.*`.

![Xem tham số TCP Keepalive trên Mac](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-parameters-bc09fa23.jpg)

Tính theo giá trị mặc định của Linux, từ lúc kết nối bắt đầu nhàn rỗi cho đến khi chính thức bị tuyên bố đã chết, tổng thời gian phải chờ là **7200 + 75 × 9 = 7875 giây**, xấp xỉ 2 giờ 11 phút.

Có thể xem và điều chỉnh qua lệnh `sysctl`:

```bash
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_intvl
sysctl net.ipv4.tcp_keepalive_probes
```

Một cạm bẫy thực tế rất hay gặp: **TCP Keepalive mặc định bị tắt.** Ứng dụng khi tạo socket bắt buộc phải bật tường minh thông qua tùy chọn `SO_KEEPALIVE`, nếu không Kernel sẽ không bao giờ phát gói thăm dò. Điều này được quy định rõ trong RFC 1122: Keepalive là tính năng tùy chọn và bắt buộc phải tắt theo mặc định.

Sau khi nắm được nguyên lý, tính chất của TCP Keepalive sẽ hiện ra rất rõ — đây là một **cơ chế thu hồi tài nguyên mang tính "ôn hòa"**. Nó chỉ có thể thu hồi tài nguyên sau khi đã xác minh chắc chắn đối phương không còn online. Chừng nào đối phương vẫn online và còn gửi về được ACK, kết nối bắt buộc phải tiếp tục duy trì, timer reset lại và tiếp tục chờ 2 tiếng tiếp theo. Khi đối phương vẫn online, Server không có cách nào dùng TCP Keepalive để ngắt kết nối đó.

Điều này hoàn toàn trái ngược với phong cách "hết giờ là đóng, bất kể bạn có ở đó hay không" của HTTP Keep-Alive.

## Các tình huống có thể xảy ra khi TCP Keepalive thăm dò?

Sau khi Kernel phát đi gói thăm dò, tùy theo trạng thái thực tế của đầu bên kia, sẽ xuất hiện các kết quả khác nhau:

![Cơ chế thăm dò của TCP Keepalive](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-de-306c79b5.png)

**1. Đối phương vẫn online và hoạt động bình thường**

Đối phương nhận được gói thăm dò, TCP stack phản hồi gói ACK. Bên gửi nhận ACK, reset bộ đếm thời gian nhàn rỗi về lại `tcp_keepalive_time` và tiếp tục chờ đợi. Kết nối không bị đóng.

**2. Đối phương từng bị sập nhưng đã khởi động lại**

Máy đối phương tuy đang online, nhưng do vừa reboot nên trong Kernel đã mất sạch context của kết nối cũ này. Khi nhận được gói thăm dò, TCP stack của đối phương sẽ trả về một gói RST (vì nó hoàn toàn không nhận diện được kết nối này). Bên gửi nhận RST sẽ lập tức đóng kết nối ngay.

**3. Đối phương bị sập và chưa hồi phục, hoặc mạng không thể tiếp cận**

Gói thăm dò gửi đi không nhận được bất kỳ phản hồi nào. Bên gửi cứ sau mỗi `tcp_keepalive_intvl` giây lại thử lại, sau `tcp_keepalive_probes` lần liên tiếp không có hồi âm sẽ phán quyết kết nối đã chết; Kernel đóng kết nối và giải phóng tài nguyên.

Tình huống thứ 3 này cũng bao hàm cả các vấn đề do thiết bị mạng trung gian gây ra. Ví dụ các Gateway NAT thường có cơ chế timeout phiên (session timeout): nếu một kết nối quá lâu không có dữ liệu, bảng ánh xạ NAT sẽ bị xóa. Các gói thăm dò sau đó không thể đến được đối phương, tạo ra kết quả giống hệt như máy đối phương bị sập — đều không có phản hồi và cuối cùng kết thúc bằng việc timeout đóng kết nối.

## TCP Keepalive có những hạn chế gì?

Thuật ngữ TCP Keepalive ở đây chỉ cơ chế thăm dò ở tầng TCP, không phải cơ chế tái sử dụng kết nối Keep-Alive của HTTP. Nó có thể phát hiện kết nối chết, nhưng trong môi trường production, chỉ trông cậy vào nó là hoàn toàn không đủ, bởi các lý do sau:

**Chu kỳ thăm dò mặc định quá chậm.** Trên Linux, phải sau 7200 giây nhàn rỗi mới bắt đầu thăm dò; Windows mặc định cũng là 2 giờ. Con số này quá dài đối với phần lớn các dịch vụ trực tuyến. Các tham số `net.ipv4.tcp_keepalive_*` trên Linux là giá trị mặc định cấp hệ thống; nếu ứng dụng cần tùy chỉnh theo từng kết nối, trên các nền tảng hỗ trợ có thể gán `TCP_KEEPIDLE`, `TCP_KEEPINTVL`, `TCP_KEEPCNT` cho từng socket riêng lẻ. Tuy nhiên các tùy chọn này không mang tính tương thích đa nền tảng tuyệt đối.

**Chỉ phát hiện được trạng thái kết nối, không phát hiện được sức khỏe ứng dụng.** Gói thăm dò TCP Keepalive do Kernel tự phát, TCP stack bên kia nhận được là tự trả lời ACK ngay mà không hề có sự tham gia của tầng ứng dụng. Do đó nó chỉ chứng minh được Kernel máy đối phương còn nhận được gói tin, chứ hoàn toàn không phản ánh được liệu thread pool của ứng dụng có bị nghẽn, event loop có bị treo, connection pool database có bị cạn kiệt hay các dịch vụ phụ thuộc có bị lỗi hay không. Đây là điểm mù lớn nhất của nó.

**Dễ bị hiểu nhầm đối tượng khi đi qua các tầng trung gian.** Nếu giữa Client và Server có Gateway NAT, Load Balancer tầng 4 hoặc Reverse Proxy, cần xác định xem kết nối TCP có bị ngắt tại tầng trung gian hay không. Nếu tầng trung gian chỉ làm NAT/connection tracking, khoảng thời gian Keepalive cần phải ngắn hơn idle timeout của thiết bị trung gian để tránh bảng định tuyến bị xóa; nếu tầng trung gian chấm dứt kết nối TCP (terminate connection), thứ mà Backend thăm dò được chỉ là đoạn kết nối từ Backend tới thiết bị trung gian, chứ không phản ánh được Client thật sự có còn sống hay không.

**Hiện thực và giá trị mặc định không đồng nhất giữa các hệ điều hành.** Linux mặc định chờ 7200s, chu kỳ 75s, thử 9 lần; Windows mặc định chờ 2 giờ nhưng chu kỳ 1s, số lần thử cố định là 10 lần từ bản Vista trở đi; macOS dùng hệ thống sysctl kiểu BSD `net.inet.tcp.*`. Dựa vào TCP Keepalive để làm cơ chế health check đa nền tảng sẽ rất khó đảm bảo sự đồng nhất.

**Không áp dụng trực tiếp cho HTTP/3 / QUIC.** Với các kết nối HTTP/3 thuần túy chạy trên UDP, TCP Keepalive hoàn toàn không tham gia. (Nếu client bị chặn UDP và fallback về HTTP/1.1 hoặc HTTP/2 thì kết nối TCP fallback đó mới chịu sự quản lý của TCP Keepalive). HTTP/3 quản lý sống còn thông qua idle timeout của QUIC và có thể gửi các khung PING để kiểm tra liveness; khi đóng kết nối có thể dùng frame GOAWAY để đóng một cách êm thuận (graceful shutdown).

Vì vậy trong thực tế kỹ thuật, TCP Keepalive thường chỉ đóng vai trò chốt chặn an toàn cuối cùng để dọn dẹp các kết nối zombie chắc chắn đã chết. Nếu cần cơ chế kiểm tra sức khỏe nhanh chóng, chi tiết và nắm bắt được trạng thái ứng dụng, bắt buộc phải tự cài đặt cơ chế nhịp tim (heartbeat) ở tầng ứng dụng, ví dụ Ping/Pong trong WebSocket, keepalive ping trong gRPC hoặc các giao thức heartbeat nghiệp vụ tự định nghĩa.

Nhịp tim tầng ứng dụng cũng không nên đặt quá dày đặc. Tần suất quá cao sẽ làm tăng lượng gói tin, gây áp lực lên bộ đếm thời gian của Server và dễ phán đoán nhầm khi mạng di động chập chờn; tần suất quá thưa lại phát hiện sự cố chậm trễ. Việc cấu hình cần cân đối giữa quy mô kết nối, timeout của NAT/LB và khoảng thời gian phát hiện lỗi mà nghiệp vụ chấp nhận được.

## Bảng tổng kết so sánh TCP Keepalive và HTTP Keep-Alive

| Tiêu chí so sánh | HTTP Keep-Alive | TCP Keepalive |
| --- | --- | --- |
| **Tầng giao thức** | Tầng ứng dụng (Giao thức HTTP) | Tầng giao vận (Giao thức TCP) |
| **Bài toán giải quyết** | Tái sử dụng kết nối TCP, giảm chi phí bắt tay, đóng kết nối, Slow Start | Thăm dò kết nối TCP nhàn rỗi lâu ngày, giải phóng kết nối khi đối phương mất liên lạc |
| **Hành vi mặc định** | HTTP/1.0 mặc định kết nối ngắn; HTTP/1.1 mặc định kết nối dài | Mặc định tắt, ứng dụng phải chủ động bật qua `SO_KEEPALIVE` |
| **Mức độ kiểm soát** | Do HTTP client, Web server hoặc Proxy điều khiển theo cấu hình kết nối | Do Kernel hệ điều hành điều khiển, có thể chỉnh theo từng socket trên một số OS |
| **Tham số phổ biến** | `Connection`, `Keep-Alive: timeout/max`, cấu hình timeout của Server | `tcp_keepalive_time/intvl/probes` hoặc tham số tương đương của hệ điều hành |
| **Điều kiện kích hoạt đóng** | Hết thời gian chờ nhàn rỗi, chạm giới hạn số request, hoặc một bên chủ động đóng | Gửi gói thăm dò nhiều lần không có hồi âm hoặc nhận được gói RST |
| **Khi đối phương vẫn online** | Server vẫn có thể chủ động đóng kết nối nhàn rỗi theo cấu hình | Chừng nào Kernel đối phương còn trả lời ACK, kết nối vẫn tiếp tục duy trì |
| **Có thay thế được Heartbeat?** | Không đánh giá được sức khỏe nghiệp vụ, chỉ quản lý tái sử dụng kết nối HTTP | Không đánh giá được thread pool, event loop hay tài nguyên nghiệp vụ của ứng dụng |
| **Ảnh hưởng của tầng trung gian** | Proxy, Gateway có thể quản lý độc lập hai đoạn kết nối HTTP/TCP trước và sau | NAT/LB/Reverse Proxy có thể khiến bạn chỉ thăm dò được một chặng TCP cục bộ |
| **Quan hệ với HTTP/2 và HTTP/3** | HTTP/2 cấm các header cấp kết nối; HTTP/3/QUIC không dùng cơ chế này | Chỉ tác động lên TCP; kết nối HTTP/3/QUIC thực sự không chịu ảnh hưởng trực tiếp |

Nếu nhìn từ góc độ "ai quyết định việc đóng kết nối", hai cơ chế thể hiện hai triết lý hoàn toàn trái ngược:

HTTP Keep-Alive mang tính "chủ động thu hồi" — Server hễ chạm mốc timeout hoặc chạm trần số lượng request là có thể tự động đóng kết nối theo cấu hình của mình mà không cần hỏi đối phương có đang online hay không.

TCP Keepalive mang tính "bị động thu hồi" — nó bắt buộc phải phát gói tin đi hỏi "bạn có còn ở đó không?". Chừng nào đối phương còn online và còn trả lời ACK, Server buộc phải duy trì kết nối và làm mới bộ đếm thời gian. Chỉ khi xác nhận chắc chắn đối phương đã biến mất thì mới được giải phóng tài nguyên.

Trong các dự án thực tế, cả hai cơ chế thường cùng hoạt động song song và độc lập với nhau. HTTP Keep-Alive lo việc "một kết nối được dùng tối đa bao lâu, phục vụ bao nhiêu request", còn TCP Keepalive lo việc "nếu quá lâu không có dữ liệu, hãy kiểm tra xem đối phương có bị sập nguồn biến mất hay không". Cả hai không làm phiền nhau và cũng không thể thay thế cho nhau.
