---
title: Ping Được Thì TCP Có Chắc Chắn Kết Nối Được Không?
description: Giải thích sự khác biệt giữa tính thông suốt của Ping/ICMP và kết nối TCP, làm rõ tại sao Ping được không đồng nghĩa với cổng đích có thể truy cập, và tại sao HTTPS vẫn có thể bị chặn vì SNI.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: Ping,ICMP,TCP,ba bước bắt tay,thông cổng,tường lửa,TLS,SNI,HTTPS
lang: vi
sourceRef: zh-ref/cs-basics/network/can-ping-but-tcp-may-not-connect.md
---

Ping được thì TCP có chắc chắn kết nối được không? Xiao G xin đưa ra kết luận ngay từ đầu: **Chắc chắn là không**.

Lúc này có thể bạn sẽ thắc mắc: Rõ ràng Ping thông suốt rồi, cớ sao TCP lại tèo? Nói một cách chuẩn xác hơn, Ping được chỉ chứng minh được rằng đường truyền khứ hồi của gói tin ICMP Echo đang hoạt động bình thường dưới các chính sách mạng hiện tại, chứ hoàn toàn không đồng nghĩa với việc cổng TCP mục tiêu có thể kết nối tới được.

Thành thật mà nói, sau khi đã học xong một lượt về mạng máy tính và đọc khá nhiều tài liệu chuyên sâu, lần đầu tiên chạm trán câu hỏi này trong buổi phỏng vấn, tôi cũng có chút bối rối.

Đáp án thực ra rất giản dị: **Ping sử dụng giao thức ICMP, còn kết nối TCP sử dụng giao thức TCP. Hai bên tuy có thể cùng đi chung một tuyến đường vật lý, nhưng các thiết bị mạng trung gian sẽ xử lý hoàn toàn độc lập dựa trên loại giao thức, số hiệu cổng, trạng thái kết nối và chính sách bảo mật.**

ICMP hoạt động ở tầng mạng (Network Layer), trong khi TCP hoạt động ở tầng giao vận (Transport Layer), chúng vốn dĩ không hề nằm cùng một tầng trong mô hình giao thức:

![ICMP và TCP nằm ở các tầng khác nhau trong mô hình TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

## Ping được chỉ chứng minh ICMP có phản hồi

![Sự khác biệt về tuyến đường giữa ICMP và TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-ping-but-tcp-may-not-connect-icmp-and-tcp-pa-5e8a0530.png)

Lệnh Ping được xây dựng trên nền tảng giao thức ICMP (Internet Control Message Protocol - Giao thức điều khiển thông điệp Internet), thực hiện việc thăm dò mạng thông qua việc gửi và nhận các bản tin ICMP.

Bản tin ICMP được chia làm hai loại chính: **Thông điệp truy vấn** (Query Message - như Echo Request / Echo Reply mà lệnh Ping hay dùng, có type tương ứng là 8 và 0) và **Thông điệp báo lỗi** (Error Message - thông báo các sự cố mạng, ví dụ Destination Unreachable).

Lệnh `ping` mặc định trên hầu hết các hệ điều hành sử dụng cơ chế Echo để thăm dò: trên IPv4 là ICMP Echo Request / Echo Reply, trên IPv6 là ICMPv6 Echo Request / Echo Reply. Nó hoàn toàn không quan tâm đến số hiệu cổng, cũng chẳng bận tâm trên máy chủ đích có dịch vụ nào đang chạy hay không. Nếu sử dụng các công cụ như `tcping`, `hping` hay công cụ kiểm tra của các nhà cung cấp Cloud thì cần phải xem xét loại thăm dò cụ thể mà công cụ đó triển khai.

Việc bạn Ping thông tới một máy chủ nói chung chỉ chứng minh được rằng: Gói tin thăm dò ICMP đã nhận được phản hồi; tuyến đường truyền gửi đi và nhận về của gói ICMP này đang thông suốt. Nếu đứng trước IP đích là một cụm NAT, Load Balancer, Firewall hoặc định tuyến Anycast, phản hồi ICMP nhận được có thể đến từ một thiết bị trung gian hoặc một node biên nào đó, chứ không thể chứng minh cổng dịch vụ của backend phía sau có thể truy cập được.

Nó chỉ chứng minh được tới mức độ đó mà thôi.

Để một kết nối TCP thành công đòi hỏi nhiều điều kiện hơn thế rất nhiều. Ví dụ khi truy cập `example.com:443`, Client trước tiên phải gửi `SYN`, Server phải đáp lại bằng `SYN-ACK`, sau đó Client gửi tiếp `ACK`. Đi hết ba bước bắt tay này thì kết nối TCP mới chính thức được thiết lập; sau đó quá trình bắt tay TLS, giao dịch HTTP hay xác thực nghiệp vụ vẫn hoàn toàn có thể thất bại.

Bất kỳ bước nào ở giữa bị tường lửa chặn lại, bị Security Group ngăn cản, hoặc đơn giản là máy chủ không có dịch vụ nào lắng nghe trên cổng đó, kết nối TCP đều sẽ thất bại toàn tập.

Do đó, lệnh `ping` có thể dùng để kiểm tra sơ bộ bước đầu, nhưng tuyệt đối đừng lấy nó làm bằng chứng khẳng định TCP không có vấn đề gì.

## ICMP được mở, không có nghĩa là TCP cũng được mở

Rất nhiều thiết bị mạng cho phép lưu lượng ICMP đi qua vì nó cực kỳ tiện lợi cho công tác vận hành hệ thống. Máy chủ có online hay không, độ trễ cao hay thấp, có bị rơi gói hay không, chỉ cần gõ lệnh `ping` một cái là nắm được tình hình sơ bộ.

Thế nhưng các quy tắc mở cổng TCP thường được siết chặt hơn rất nhiều. Một máy chủ production có thể chỉ mở cổng `22`, `80`, `443`, còn cổng database, cổng nội bộ hay cổng debug đều bị chặn hoàn toàn.

Thế nên chúng ta rất hay gặp tình huống này:

```bash
ping 10.0.0.10
# Thông suốt (nhận phản hồi)

nc -vz 10.0.0.10 8080
# Connection timed out hoặc Connection refused
```

Hai kết quả này hoàn toàn không mâu thuẫn, bởi vì ICMP và việc truy cập cổng TCP được quản lý bởi hai bộ quy tắc tường lửa hoàn toàn độc lập với nhau.

Ở đây cũng cần phân biệt rõ hai loại lỗi kết nối thường gặp:

1. `Connection timed out` thường cho thấy gói `SYN` gửi đi không hề nhận được phản hồi, khả năng cao do tường lửa âm thầm drop gói tin, hoặc có sự cố về định tuyến / đường quay về;
2. `Connection refused` thường cho thấy máy đích đã chủ động trả lời bằng một gói `RST`, nguyên nhân phổ biến là do cổng đó chưa có tiến trình nào lắng nghe hoặc chính sách tường lửa chủ động từ chối.

| Hiện tượng | Ý nghĩa khái quát |
| --- | --- |
| `Connection refused` | Thường nhận được gói `RST`, cổng chưa được lắng nghe hoặc bị chủ động từ chối |
| `Connection timed out` | Gói `SYN` không nhận được phản hồi, có thể bị drop, lỗi định tuyến hoặc đường về |
| `No route to host` | Lỗi định tuyến cục bộ, mạng lân cận hoặc nhận được ICMP unreachable |
| Bắt tay TLS thất bại | TCP có thể đã thông, cần kiểm tra tiếp SNI, chứng chỉ, phiên bản TLS hoặc proxy |
| HTTP `4xx` / `5xx` | TCP/TLS đã đi tới tầng ứng dụng, vấn đề nằm ở tầng ứng dụng hoặc gateway |

Còn một trường hợp hiển nhiên hơn: Máy chủ vật lý vẫn chạy tốt nhưng dịch vụ bên trong đã sập. Host vẫn phản hồi ICMP mượt mà, nhưng Nginx chưa khởi động hoặc MySQL không bind vào địa chỉ IP mà bạn đang kết nối. Khi đó Ping đương nhiên thông, còn TCP đương nhiên thất bại.

## Khi có Gateway ở giữa, càng không thể chỉ nhìn vào Ping

Đằng sau một địa chỉ IP công cộng (Public IP) thường không phải là một máy chủ vật lý đơn lẻ, mà là một cụm Firewall, NAT Gateway, Load Balancer hoặc thiết bị bảo mật.

Phản hồi ICMP mà bạn nhận được có thể do chính thiết bị giữ Virtual IP (VIP) hoặc node biên trả về, hoặc cũng có thể được chuyển tiếp vào một backend cụ thể, tùy thuộc vào cơ chế của NAT, Load Balancer hay Firewall. Bạn không thể đánh đồng phản hồi ICMP với việc ứng dụng backend đang sẵn sàng phục vụ.

Yêu cầu TCP lại phức tạp hơn nhiều. Khi truy cập `Public_IP:443`, lưu lượng còn phải tiếp tục được chuyển tiếp vào máy chủ backend bên trong. Nếu cấu hình ánh xạ cổng (port forwarding) bị sai, dịch vụ backend bị chết, health check thất bại, hoặc Security Group chưa mở port, thì kết nối TCP sẽ tắc nghẽn ngay.

Đứng từ bên ngoài nhìn vào, hiện tượng chỉ tóm gọn trong một câu: IP thì Ping thông suốt, nhưng cổng thì tuyệt đối không thể kết nối.

Vì thế khi điều tra sự cố thực tế, đừng chỉ dừng lại ở lệnh `ping`. Nếu đích đến là một tên miền (domain), hãy kiểm tra kết quả phân giải DNS trước, đặc biệt là các bản ghi A / AAAA, định tuyến CDN và sự khác biệt giữa IPv4 / IPv6:

```bash
dig example.com A +short
dig example.com AAAA +short
```

Ứng dụng của bạn và lệnh `ping` chưa chắc đã chọn cùng một họ địa chỉ mạng (address family), lệnh `curl` thậm chí có thể áp dụng thuật toán Happy Eyeballs để đua tốc độ giữa IPv6 và IPv4. Khi cần cô lập biến số, hãy dùng `curl -4`, `curl -6` hoặc `curl --resolve`.

Sau đó hãy kiểm tra độ thông suốt của cổng bằng lệnh:

```bash
nc -vz example.com 443
```

Nếu cổng đã thông suốt, hãy kiểm tra tiếp lên tầng ứng dụng:

```bash
curl -v https://example.com
```

Trong kịch bản HTTPS, có thể trực tiếp quan sát quá trình bắt tay TLS:

```bash
openssl s_client -connect example.com:443 -servername example.com -brief
```

Khi có nhiều tên miền cùng chạy chung một địa chỉ IP, khuyến nghị luôn đính kèm tham số `-servername`, nếu không máy chủ có thể trả về chứng chỉ mặc định dẫn đến việc phán đoán nhầm.

Nếu vẫn chưa rõ nguyên nhân, hãy bắt gói tin (packet capture) để phân lập tầng giao thức:

```bash
tcpdump -nn host <ip> and port <port>
tcpdump -nn icmp
```

Nếu chỉ thấy gói `SYN` liên tục truyền lại, chứng tỏ tầng TCP vẫn chưa thông; nếu TCP ba bước bắt tay đã xong nhưng bị nghẽn ở khâu TLS, hãy xem xét tiếp `ClientHello`, SNI, chứng chỉ số, proxy và chính sách an ninh mạng.

## HTTPS cũng có thể bị chặn ngay ở bước SNI

Có một chi tiết rất dễ khiến người ta phán đoán sai: Cùng là cổng `443`, cùng là giao thức HTTPS, nhưng chưa chắc lưu lượng đã được thông qua.

Nội dung payload của HTTPS sẽ được mã hóa an toàn, nhưng ngay giai đoạn mở đầu của bắt tay TLS trong gói `ClientHello`, thông thường sẽ mang theo trường SNI (Server Name Indication - phần mở rộng của TLS). Tác dụng của SNI là báo cho máy chủ biết "tôi muốn truy cập vào tên miền nào", nhờ đó trên một địa chỉ IP duy nhất mới có thể triển khai đồng thời nhiều trang web HTTPS khác nhau.

Vấn đề nằm ở chỗ: SNI truyền thống thường được truyền đi dưới dạng văn bản thuần (plaintext) không mã hóa.

![Quy trình bắt tay TLS 1.2 ECDHE](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-tls-1-2-ecdhe-rsa-handshake-proc-fa4d9609.png)

Từ sơ đồ trên ta thấy, quá trình bắt tay TLS trải qua nhiều giai đoạn: ClientHello (mang theo SNI dạng plaintext, danh sách cipher suite hỗ trợ) → ServerHello (chọn cipher suite) → Chứng chỉ → Trao đổi khóa → Hai bên tính toán shared secret → Hoàn tất bắt tay. Thiết bị trung gian không cần phải giải mã toàn bộ nội dung HTTPS, nó chỉ cần liếc mắt đọc trường SNI trong gói `ClientHello` là biết ngay bạn đang truy cập tên miền nào, từ đó áp dụng chính sách chặn lọc theo tên miền đối với kết nối đó.

Hệ sinh thái TLS sau này đã đưa ra cơ chế ECH (Encrypted ClientHello) để mã hóa thêm các thông tin trong `ClientHello`, bao gồm cả SNI thực sự. Tuy nhiên ECH có hiệu lực hay không còn phụ thuộc vào Client, Server, bản ghi DNS loại `HTTPS` / SVCB và hạ tầng mạng, nên không thể mặc định coi mọi kết nối HTTPS đều đã giấu được SNI.

Khi vi phạm chính sách kiểm soát, thiết bị trung gian có thể âm thầm drop gói tin, bơm gói `RST` giả mạo, ngắt TLS, trả về trang cảnh báo chặn truy cập, hoặc khiến kết nối bị treo cứng ngay ở giai đoạn bắt tay TLS.

Hiện tượng này khi bắt gói tin sẽ rất khó hiểu: Ba bước bắt tay TCP có thể đã thành công mỹ mãn, kết nối trông như đã dựng xong, nhưng vừa phát gói `ClientHello` đi là lập tức bặt vô âm tín, hoặc bị reset kết nối ngay tức khắc.

Vì vậy, "TCP đã thông" và "HTTPS có thể truy cập bình thường" là hai khái niệm hoàn toàn khác nhau. Cái trước chỉ cần ba bước bắt tay thành công, còn cái sau đòi hỏi phải vượt qua cả bắt tay TLS, xác thực SNI, chuỗi chứng chỉ, cấu hình proxy và các chính sách kiểm soát an ninh mạng.

## Tổng kết

Lệnh `ping` kiểm tra tính thông suốt của giao thức ICMP; còn kết nối TCP thì phải xem cổng đích có ai lắng nghe không, ba bước bắt tay có hoàn tất được không, các thiết bị trung gian có cho phép lưu lượng đi qua không; HTTPS thậm chí còn có thể bị kẹt lại ở khâu bắt tay TLS, đặc biệt là ở bước quét trường SNI.

Chiều ngược lại cũng hoàn toàn tương tự: Ping không thông, không có nghĩa là TCP chắc chắn không thông. Rất nhiều máy chủ hoặc Security Group trên Cloud cố tình chặn hoàn toàn gói ICMP, nhưng các cổng dịch vụ nghiệp vụ TCP vẫn hoạt động bình thường. Vì thế khi điều tra mạng, tuyệt đối không được dùng một lệnh duy nhất để vội vàng kết luận, mà phải kiểm tra tuần tự theo từng tầng giao thức.

Xiao G thường kiểm tra theo trình tự chuẩn sau: Nếu là tên miền, trước tiên xem DNS; tiếp theo dùng `ping` để kiểm tra ICMP; sau đó dùng `nc` để test cổng TCP; cuối cùng dùng `curl` hoặc `openssl s_client` để kiểm tra HTTPS/TLS. Đừng để một lệnh `ping` đơn giản làm bạn định hình sai lệch bản chất của vấn đề.

![Các tầng kiểm tra kết nối HTTPS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-ping-but-tcp-may-not-connect-https-connectio-3fcb5151.png)
