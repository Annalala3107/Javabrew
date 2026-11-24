---
title: "Tổng hợp các giao thức tầng ứng dụng phổ biến: HTTP, WebSocket, SMTP, FTP, SSH, DNS, v.v."
description: "Tổng hợp các khái niệm cốt lõi và kịch bản điển hình của các giao thức tầng ứng dụng phổ biến, tập trung so sánh mô hình giao tiếp và ranh giới khả năng giữa HTTP và WebSocket."
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: Giao thức tầng ứng dụng,HTTP,WebSocket,DNS,SMTP,FTP,đặc tính,kịch bản
lang: vi
sourceRef: zh-ref/cs-basics/network/application-layer-protocol.md
---

Có rất nhiều giao thức tầng ứng dụng, và các cái tên như HTTP, WebSocket, SMTP, POP3/IMAP, FTP, Telnet, SSH, RTP, DNS cũng thường xuyên xuất hiện cùng nhau.

Chúng ta không nhất thiết phải học chi tiết đến từng ngóc ngách hiện thực của tất cả các giao thức này, nhưng nếu chỉ ghi nhớ tên gọi một cách đơn thuần, bạn sẽ rất dễ bị nhầm lẫn giữa "mục đích sử dụng, giao thức truyền tải tầng dưới và kịch bản sử dụng điển hình".

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Các giao thức như HTTP, WebSocket, SMTP, FTP, SSH, DNS giải quyết những vấn đề gì?
2. Các giao thức này thường chạy trên nền TCP hay UDP, cổng mặc định và ngữ cảnh sử dụng phổ biến là gì?
3. Những giao thức nào dễ gây nhầm lẫn nhất, và nên phân biệt chúng như thế nào trong phỏng vấn cũng như trong thực tế kỹ thuật?

## HTTP: Giao thức truyền tải siêu văn bản

**Giao thức truyền tải siêu văn bản (HTTP, HyperText Transfer Protocol)** là một giao thức tầng ứng dụng dùng để truyền tải siêu văn bản và các nội dung đa phương tiện, với ngữ cảnh sử dụng phổ biến nhất là giao tiếp giữa trình duyệt Web và máy chủ Web (Web server).

![Tổng quan HTTP: Giao thức truyền tải siêu văn bản](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

Khi chúng ta truy cập một trang web trên trình duyệt, trình duyệt sẽ gửi một HTTP request tới server, sau khi server xử lý xong sẽ trả về một HTTP response. Các tài nguyên trong trang như HTML, CSS, JavaScript, hình ảnh, video phần lớn đều được tải thông qua HTTP.

HTTP sử dụng mô hình Client-Server: client gửi HTTP Request (yêu cầu), server trả về HTTP Response (phản hồi), toàn bộ quá trình được minh họa trong hình dưới đây.

![Giao thức HTTP](/media/jg/ext/oss.javaguide.cn/github/javaguide/450px-HTTP-Header-7b3440ab.png)

Cần lưu ý rằng, HTTP là giao thức tầng ứng dụng, bản thân nó không trực tiếp chịu trách nhiệm về việc truyền tải tin cậy. Các phiên bản HTTP khác nhau có sự phụ thuộc vào tầng truyền tải bên dưới không hoàn toàn giống nhau:

- **HTTP/1.1**: Dựa trên TCP.
- **HTTP/2**: Thường cũng dựa trên TCP, nhưng đưa vào khả năng đa ghép kênh (multiplexing), nén header (header compression), v.v.
- **HTTP/3**: Dựa trên QUIC, mà QUIC lại chạy trên nền UDP, chủ yếu dùng để giảm thiểu chi phí thiết lập kết nối và hạn chế hiện tượng nghẽn đầu hàng (Head-of-Line blocking - HoL) của TCP.

Trong HTTP/1.1, tính năng Keep-Alive (kết nối duy trì / kết nối dài) được bật mặc định. Nhờ đó, cùng một kết nối TCP có thể được tái sử dụng cho nhiều HTTP request, tránh việc mỗi request lại phải thiết lập lại kết nối TCP từ đầu, qua đó giảm bớt chi phí từ quá trình bắt tay 3 bước (three-way handshake).

Xét từ góc độ tái sử dụng kết nối, Keep-Alive của HTTP/1.1 giải quyết bài toán "dùng chung một kết nối TCP cho nhiều request", nhưng việc xử lý các request trên cùng kết nối đó vẫn có thể bị ảnh hưởng bởi hiện tượng nghẽn đầu hàng (HoL blocking).

HTTP/2 đưa vào cơ chế đa ghép kênh (multiplexing) trên một kết nối TCP duy nhất, có thể truyền song song nhiều request và response, làm giảm hiện tượng nghẽn đầu hàng ở tầng HTTP. Tuy nhiên, do tầng dưới vẫn là TCP, một khi có một gói TCP bị mất (packet loss), toàn bộ dữ liệu trên kết nối đó vẫn sẽ bị ảnh hưởng.

HTTP/3 dựa trên QUIC, mà QUIC hiện thực cơ chế đa ghép kênh và truyền tải tin cậy trực tiếp trên nền UDP. Các luồng (stream) độc lập hoàn toàn với nhau, giúp khắc phục triệt để hiện tượng nghẽn đầu hàng ở tầng TCP.

Ngoài ra, HTTP là một **giao thức không lưu trạng thái (stateless protocol)**. Server không tự nhiên ghi nhớ được "request trước đó do ai gửi, đang ở trạng thái nào". Do đó, trong phát triển Web thực tế, người ta thường phải dựa vào các cơ chế như Cookie, Session, Token (bao gồm cả JWT) để duy trì trạng thái đăng nhập và phiên làm việc của người dùng.

## WebSocket: Giao thức giao tiếp song công toàn phần (Full-Duplex)

**WebSocket** là một giao thức giao tiếp song công toàn phần (full-duplex) dựa trên kết nối TCP, cho phép client và server có thể đồng thời gửi và nhận dữ liệu trên cùng một kết nối.

![Tổng quan WebSocket: Giao thức giao tiếp song công toàn phần](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/websocket-overview-464543a7.png)

Đặc điểm điển hình của nó là: **sau khi kết nối được thiết lập, server cũng có thể chủ động đẩy (push) tin nhắn về cho client**. Điều này bù đắp hoàn hảo cho sự thiếu hụt của mô hình request-response truyền thống của HTTP trong các kịch bản giao tiếp thời gian thực.

Giao thức WebSocket ra đời năm 2008 và trở thành tiêu chuẩn quốc tế vào năm 2011; hầu hết các trình duyệt phổ biến hiện nay đều đã hỗ trợ. WebSocket không chỉ dùng cho trình duyệt, rất nhiều ngôn ngữ lập trình, framework và server cũng đều cung cấp hỗ trợ tương ứng.

Về bản chất, WebSocket vẫn là một giao thức tầng ứng dụng. Ban đầu nó thường gửi một HTTP request để tiến hành nâng cấp giao thức (protocol upgrade), sau khi nâng cấp thành công, một kết nối bền vững sẽ được thiết lập giữa client và server, và các lần truyền dữ liệu hai chiều tiếp theo có thể diễn ra.

![Sơ đồ minh họa WebSocket](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

Các kịch bản ứng dụng phổ biến của WebSocket bao gồm:

- Bình luận trực tiếp chạy trên video (danmaku/đạn mạc)
- Đẩy tin nhắn thời gian thực (chi tiết xem bài [Chi tiết về kỹ thuật đẩy tin nhắn thời gian thực trên Web](https://javaguide.cn/system-design/web-real-time-message-push.html))
- Game đối kháng thời gian thực
- Chỉnh sửa tài liệu cộng tác nhiều người (collaborative editing)
- Chăm sóc khách hàng trực tuyến / Chat mạng xã hội
- Cập nhật dữ liệu thời gian thực như giá chứng khoán, tỷ số thể thao

Quy trình hoạt động của WebSocket có thể chia đơn giản thành các bước sau:

1. Client gửi một HTTP request tới server, trong header chứa các trường như `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Key`, biểu thị mong muốn nâng cấp kết nối hiện tại lên WebSocket.
2. Server sau khi nhận được request, nếu hỗ trợ WebSocket, sẽ trả về mã trạng thái HTTP `101 Switching Protocols`, trong header phản hồi chứa các trường như `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Accept`, biểu thị nâng cấp giao thức thành công.
3. Sau khi nâng cấp giao thức, giữa client và server đã thiết lập xong một kết nối WebSocket, hai bên có thể tiến hành giao tiếp hai chiều.
4. Dữ liệu WebSocket được truyền tải dưới dạng các khung (Frame). Một thông điệp hoàn chỉnh có thể bị chia thành nhiều frame để gửi đi, và phía nhận sẽ ghép nối lại thành thông điệp hoàn chỉnh ban đầu.
5. Cả client lẫn server đều có thể chủ động gửi frame đóng kết nối (close frame), phía còn lại sau khi nhận được cũng sẽ phản hồi lại close frame, rồi hai bên cùng đóng kết nối TCP.

Ngoài ra, kết nối WebSocket thường được kết hợp với **cơ chế nhịp tim (heartbeat)**. Ví dụ: định kỳ gửi các khung Ping/Pong, hoặc gửi các gói tin heartbeat ở tầng nghiệp vụ để kiểm tra xem kết nối có còn hoạt động hay không, tránh tình trạng kết nối bị "chết giả" (half-open).

## SMTP: Giao thức truyền tải thư tín đơn giản

**Giao thức truyền tải thư tín đơn giản (SMTP, Simple Mail Transfer Protocol)** là một giao thức tầng ứng dụng dựa trên TCP, chủ yếu dùng để **gửi và chuyển tiếp thư điện tử (email)**.

![Tổng quan SMTP: Giao thức truyền tải thư tín đơn giản](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/smtp-overview-7ea98c2a.png)

Ở đây cần lưu ý một điểm rất dễ nhầm lẫn:

**SMTP chịu trách nhiệm gửi thư và chuyển tiếp thư giữa các mail server; POP3/IMAP chịu trách nhiệm cho người dùng nhận thư từ máy chủ hộp thư.**

Nói cách khác, quá trình thư gửi từ mail server của bạn đến mail server của đối phương thông thường vẫn sử dụng SMTP; trong khi người dùng sử dụng ứng dụng client để đọc thư trong hộp thư thì thường dùng POP3 hoặc IMAP.

![Giao thức SMTP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/what-is-smtp-e50cec39.png)

Các cổng phổ biến liên quan đến SMTP gồm 25, 465, 587, mục đích sử dụng của ba cổng này không hoàn toàn giống nhau:

| Cổng | Mục đích phổ biến | Mô tả |
| ---- | ----------------- | ----- |
| 25 | Chuyển tiếp thư giữa các mail server | Chủ yếu dùng để chuyển phát giữa các MTA với nhau; nhiều nhà cung cấp cloud hoặc ISP sẽ chặn cổng 25 chiều đi để ngăn chặn spam |
| 587 | Client gửi (submit) thư lên server | Cổng chuẩn cho Message Submission, thường kết hợp với STARTTLS và xác thực người dùng |
| 465 | Gửi thư qua kênh TLS ngầm định (implicit TLS) | Thiết lập kênh mã hóa TLS ngay khi client kết nối; nhiều nhà cung cấp dịch vụ email vẫn hỗ trợ cổng này |

### Quá trình gửi thư điện tử

Ví dụ email của tôi là `<dabai@cszhinan.com>`, tôi muốn gửi một email tới `<xiaoma@qq.com>`, toàn bộ quá trình có thể hiểu đơn giản như sau:

1. Tôi soạn thư xong thông qua phần mềm email client hoặc giao diện webmail.
2. Email client sử dụng giao thức SMTP để gửi thư lên mail server tương ứng của `cszhinan.com`.
3. Mail server phía người gửi căn cứ vào tên miền của người nhận `qq.com` để truy vấn địa chỉ mail server tương ứng.
4. Mail server phía người gửi tiếp tục thông qua SMTP để chuyển tiếp thư đến mail server của QQ Mail.
5. Mail server của QQ Mail tiếp nhận thư và lưu trữ lại.
6. Người dùng `<xiaoma@qq.com>` sử dụng giao thức POP3 hoặc IMAP để đọc thư từ mail server của QQ Mail.

### Làm thế nào để xác định một hộp thư có thực sự tồn tại hay không?

Trong một số tình huống, chúng ta có thể cần kiểm tra xem một địa chỉ email có thực sự tồn tại hay không. Cách làm phổ biến là thăm dò dựa trên SMTP:

1. Truy vấn bản ghi MX của tên miền hộp thư để tìm mail server đích.
2. Thử kết nối tới mail server đích đó.
3. Sử dụng các lệnh SMTP để mô phỏng quy trình gửi thư.
4. Dựa vào kết quả server trả về để phán đoán xem địa chỉ email đó có khả năng tồn tại hay không.

Tuy nhiên, cách làm này không phải lúc nào cũng đáng tin cậy.

Rất nhiều nhà cung cấp dịch vụ email để chống thư rác, tấn công dò mật khẩu (credential stuffing) và rò rỉ quyền riêng tư, họ sẽ chặn việc thăm dò sự tồn tại của hộp thư, hoặc trả về kết quả mập mờ đồng loạt. Do đó, việc thăm dò qua SMTP chỉ có thể dùng làm tài liệu tham khảo chứ không thể khẳng định 100% hộp thư chắc chắn tồn tại hay không tồn tại.

Một số công cụ kiểm tra tính hợp lệ của email trực tuyến được khuyến nghị:

1. <https://verify-email.org/>
2. <http://tool.chacuo.net/mailverify>
3. <https://www.emailcamel.com/>

## POP3 / IMAP: Giao thức nhận thư

**POP3 và IMAP đều là các giao thức dùng để nhận thư**, và cả hai đều là các giao thức tầng ứng dụng dựa trên TCP.

![Tổng quan POP3/IMAP: Giao thức nhận thư](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/pop3-imap-overview-5174d5ab.png)

Cần đặc biệt lưu ý: **SMTP chủ yếu chịu trách nhiệm gửi và chuyển tiếp thư, còn POP3/IMAP chủ yếu chịu trách nhiệm cho người dùng đọc thư từ mail server.**

Thiết kế của POP3 tương đối đơn giản, mô hình phổ biến là tải email từ server về máy cục bộ. Nó phù hợp với việc nhận thư trên một thiết bị duy nhất, nhưng khả năng đồng bộ trên nhiều thiết bị lại rất kém.

IMAP là giao thức nhận thư hiện đại hơn và được sử dụng rộng rãi hơn. Nó hỗ trợ quản lý thư ngay tại phía server, có khả năng đồng bộ trạng thái thư như: đã đọc, chưa đọc, đã xóa, gắn sao, lưu trữ, phân loại thư mục, v.v. Vì vậy, nếu bạn đồng thời kiểm tra cùng một hộp thư trên điện thoại, máy tính và giao diện web, trải nghiệm với IMAP sẽ vượt trội hơn nhiều.

So sánh ngắn gọn:

| Giao thức | Mục đích chính | Đặc điểm |
| --------- | -------------- | -------- |
| POP3 | Nhận thư | Thiên về tải về máy cục bộ, khả năng đồng bộ đa thiết bị kém |
| IMAP | Nhận và quản lý thư | Hỗ trợ đồng bộ đa thiết bị, tìm kiếm, đánh dấu, lưu trữ thư mục |
| SMTP | Gửi và chuyển tiếp thư | Chịu trách nhiệm về chuỗi phân phát và chuyển tiếp email |

## FTP: Giao thức truyền tệp

**FTP (File Transfer Protocol, Giao thức truyền tệp)** là một giao thức tầng ứng dụng dựa trên TCP, dùng để truyền tải tệp giữa client và server.

![Tổng quan FTP: Giao thức truyền tệp](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ftp-overview-6012bf6e.png)

FTP áp dụng mô hình Client-Server. Một điểm rất đặc thù của nó là: FTP thường thiết lập hai kết nối TCP riêng biệt.

> Khác với rất nhiều giao thức tầng ứng dụng, FTP sử dụng hai kết nối giữa client và server:
>
> 1. **Kết nối điều khiển (Control Connection)**: Dùng để truyền các câu lệnh và phản hồi, ví dụ đăng nhập, chuyển thư mục, xóa tệp, v.v.
> 2. **Kết nối dữ liệu (Data Connection)**: Dùng để truyền tải nội dung tệp thực tế hoặc danh sách thư mục.

Thiết kế tách rời giữa luồng lệnh và luồng dữ liệu này giúp cho các câu lệnh điều khiển và dữ liệu tệp cồng kềnh không bị ảnh hưởng lẫn nhau.

![Quá trình hoạt động của FTP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ftp-d1445b2d.png)

FTP có hai chế độ kết nối dữ liệu: chế độ chủ động (Active Mode / PORT) và chế độ bị động (Passive Mode / PASV):

- **Chế độ chủ động (Active Mode)**: Client thông qua kết nối điều khiển báo cho server biết cổng mà mình đang lắng nghe, sau đó server sẽ chủ động kết nối tới cổng này của client để thiết lập kết nối dữ liệu. Do server phải chủ động kết nối tới client, nếu client nằm sau thiết bị NAT hoặc tường lửa (firewall), kết nối rất dễ bị thất bại.
- **Chế độ bị động (Passive Mode)**: Client yêu cầu server mở một cổng dữ liệu, sau đó client chủ động kết nối tới cổng dữ liệu đó của server. Vì chiều kết nối vẫn là từ client đến server nên nó dễ dàng đi xuyên qua NAT và tường lửa hơn, do đó trong môi trường thực tế chế độ bị động được sử dụng phổ biến hơn.

Lưu ý: Bản thân FTP không an toàn. Mặc định nó không mã hóa nội dung truyền tải, username, password và dữ liệu tệp đều có thể bị nghe lén hoặc giả mạo.

Vì vậy, khi truyền tải các tệp tin nhạy cảm, không nên sử dụng FTP thông thường mà có thể lựa chọn:

- **SFTP**: Giao thức truyền tệp an toàn dựa trên SSH.
- **FTPS**: Bổ sung thêm mã hóa TLS/SSL trên nền tảng của FTP.

Trong đó, SFTP và FTPS có tên viết tắt khá giống nhau nhưng không phải là cùng một giao thức. SFTP dựa trên SSH, còn FTPS là FTP over TLS.

## Telnet: Giao thức đăng nhập từ xa

**Telnet** là một giao thức đăng nhập từ xa dựa trên TCP, cổng mặc định là 23. Nó cho phép người dùng thông qua một terminal để đăng nhập từ xa vào server và thực thi các câu lệnh trên máy chủ từ xa.

Vấn đề lớn nhất của Telnet là: **truyền dữ liệu dạng văn bản thuần (plaintext)**.

![Tổng quan Telnet: Giao thức đăng nhập từ xa](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/telnet-overview-be34f822.png)

Username, password, nội dung câu lệnh và kết quả trả về đều không được mã hóa. Nếu kẻ tấn công có thể bắt gói tin trên đường truyền mạng thì có thể trực tiếp đọc được các thông tin nhạy cảm này.

![Lỗ hổng nghe lén của Telnet](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/Telnet_is_vulnerable_to_eavesdropping-2-40e71d55.png)

Do đó, ngày nay Telnet hầu như không còn được dùng cho việc quản trị máy chủ từ xa trong thực tế nữa. Trong môi trường sản xuất (production), người ta thường dùng SSH để thay thế cho Telnet.

## SSH: Giao thức truyền tải mạng an toàn

**SSH (Secure Shell)** là một giao thức mạng an toàn dựa trên TCP, cổng mặc định là 22. Thông qua cơ chế mã hóa và xác thực, nó mang lại sự đảm bảo an toàn cho việc đăng nhập từ xa, thực thi câu lệnh và truyền tải tệp tin.

![Tổng quan SSH: Giao thức truyền tải mạng an toàn](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ssh-overview-77dd12b2.png)

Ứng dụng kinh điển nhất của SSH là đăng nhập vào server từ xa:

```bash
ssh user@server_ip
```

Bên cạnh đăng nhập từ xa, SSH còn hỗ trợ:

- Thực thi câu lệnh từ xa
- Chuyển tiếp cổng (Port Forwarding / Tunneling)
- Proxy qua tunnel
- Chuyển tiếp X11 (X11 Forwarding)
- Truyền tệp an toàn dựa trên SFTP hoặc SCP

SSH sử dụng mô hình Client-Server. SSH Server lắng nghe yêu cầu kết nối từ client, còn SSH Client sẽ khởi tạo kết nối. Hai bên sẽ thương lượng thuật toán mã hóa trước, và thông qua quá trình trao đổi khóa (Key Exchange) để sinh ra khóa mã hóa đối xứng dùng cho các giao tiếp tiếp theo. Nội dung trao đổi sau đó đều được mã hóa toàn bộ.

![Mô hình SSH Client-Server](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/ssh-client-server-f6cd4a79.png)

Cần lưu ý rằng, tính an toàn của SSH không chỉ đến từ việc truyền tải mã hóa, mà còn đến từ cơ chế xác thực danh tính. Các phương thức xác thực phổ biến bao gồm:

- Xác thực bằng mật khẩu (Password Authentication)
- Xác thực bằng khóa công khai (Public Key Authentication)
- Xác thực đa yếu tố (Multi-Factor Authentication - MFA)

Trong môi trường thực tế, người ta luôn khuyến nghị sử dụng xác thực bằng khóa công khai (Public Key) và vô hiệu hóa phương thức đăng nhập bằng mật khẩu yếu.

## RTP: Giao thức truyền tải thời gian thực

**RTP (Real-time Transport Protocol, Giao thức truyền tải thời gian thực)** là một giao thức dùng để truyền tải các dữ liệu thời gian thực như âm thanh, video. Nó thường chạy trên nền UDP. Trong mô hình phân tầng TCP/IP, tầng nằm ngay trên UDP chính là tầng ứng dụng, do đó RTP được xếp vào tầng ứng dụng theo quy tắc phân tầng. Tuy nhiên, nhiệm vụ mà nó đảm nhận (số thứ tự, timestamp, đồng bộ, phản hồi chất lượng) lại gần với chức năng của tầng truyền vận hơn, và RFC 3550 cũng nói rằng nó "thường được tích hợp vào quá trình xử lý của ứng dụng thay vì được hiện thực như một tầng độc lập".

![Tổng quan RTP: Giao thức truyền tải thời gian thực](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/rtp-overview-87c6004f.png)

RTP chủ yếu được sử dụng trong các tình huống thời gian thực như gọi thoại, họp trực tuyến, phát sóng trực tiếp (livestream). Bản thân nó không đảm bảo việc truyền tải tin cậy, cũng không đảm bảo dữ liệu đến đúng giờ, mà thông qua các thông tin như số thứ tự (sequence number), dấu thời gian (timestamp) để hỗ trợ phía nhận thực hiện sắp xếp lại thứ tự, đồng bộ và kiểm soát phát lại. Mặc dù cũng tồn tại phương thức đóng gói RTP over TCP (ví dụ RFC 4571), nhưng chủ yếu dùng cho các trường hợp đặc biệt như đi xuyên tường lửa hoặc tương thích với chồng giao thức cụ thể; trong các tình huống âm thanh/video thời gian thực thực tế, RTP vẫn lấy UDP làm chủ đạo.

RTP thường được sử dụng phối hợp với RTCP:

- **RTP**: Chịu trách nhiệm truyền tải dữ liệu âm thanh/video thời gian thực.
- **RTCP (RTP Control Protocol)**: Chịu trách nhiệm truyền tải thông tin điều khiển và dữ liệu thống kê, ví dụ như tỷ lệ mất gói, độ trễ, độ trôi (jitter), v.v.

Trong WebRTC, RTP/RTCP là nền tảng quan trọng cho việc truyền tải âm thanh/video thời gian thực. WebRTC còn kết hợp mã hóa SRTP, điều khiển tắc nghẽn, bộ đệm jitter (jitter buffer), NACK, FEC và các cơ chế khác để nâng cao chất lượng và độ an toàn của giao tiếp thời gian thực.

Cần lưu ý rằng, bản thân RTP không chịu trách nhiệm việc dành trước tài nguyên, cũng không đảm bảo chất lượng truyền tải thời gian thực. Nó cung cấp các năng lực nền tảng cho việc truyền tải đa phương tiện thời gian thực, còn việc kiểm soát chất lượng cụ thể cần phải dựa vào các cơ chế tầng trên phối hợp hoàn thành.

## DNS: Hệ thống phân giải tên miền

**DNS (Domain Name System, Hệ thống phân giải tên miền)** dùng để giải quyết bài toán ánh xạ giữa tên miền và địa chỉ IP.

![Tổng quan DNS: Hệ thống phân giải tên miền](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/dns-overview-4619e349.png)

Khi chúng ta truy cập một website, thông thường chúng ta nhập vào tên miền, ví dụ:

```text
www.javaguide.cn
```

Nhưng việc giao tiếp mạng trên thực tế lại cần đến địa chỉ IP. Vai trò của DNS là phân giải tên miền thành địa chỉ IP tương ứng.

DNS thông thường sử dụng UDP với cổng mặc định là 53. Sở dĩ ưu tiên sử dụng UDP là vì phần lớn các câu truy vấn và phản hồi DNS đều có kích thước nhỏ, không cần đến quá trình bắt tay 3 bước của TCP, giúp tốc độ phản hồi nhanh hơn.

Trong các đặc tả kỹ thuật DNS thời kỳ đầu, kích thước thông điệp UDP DNS bị giới hạn ở mức 512 byte (chưa bao gồm header IP và UDP). Nếu dữ liệu phản hồi quá lớn, server sẽ thiết lập cờ cắt ngắn (Truncated - TC), và client sẽ thử lại bằng TCP.

Về sau, EDNS0 đã mở rộng giới hạn kích thước gói tin DNS over UDP, giúp DNS có thể mang theo các phản hồi lớn hơn, ví dụ như dữ liệu liên quan đến DNSSEC. Tuy nhiên, nếu phản hồi vượt quá kích thước UDP đã thương lượng, hoặc khi diễn ra việc truyền vùng dữ liệu (Zone Transfer - đồng bộ toàn bộ dữ liệu vùng giữa các DNS server, việc phân giải tên miền thông thường hầu như không kích hoạt thao tác này), nó vẫn sẽ sử dụng TCP.

Trong mạng hiện đại còn xuất hiện các giải pháp DNS an toàn hơn, ví dụ:

- **DoH (DNS over HTTPS)**
- **DoT (DNS over TLS)**

Mục đích của chúng là giảm thiểu các vấn đề về quyền riêng tư và an toàn do việc truy vấn DNS dưới dạng văn bản thuần gây ra.

## Tổng kết các cổng giao thức tầng ứng dụng thường gặp

| Giao thức | Cổng mặc định | Giao thức tầng truyền vận | Mục đích sử dụng chính |
| --------- | ------------: | ------------------------- | ---------------------- |
| HTTP | 80 | TCP | Truy cập trang Web |
| HTTPS | 443 | TCP / QUIC | Truy cập Web được mã hóa |
| WebSocket | 80 / 443 | TCP | Giao tiếp hai chiều thời gian thực |
| SMTP | 25 / 465 / 587 | TCP | Gửi và chuyển tiếp thư điện tử |
| POP3 | 110 / 995 | TCP | Nhận thư điện tử |
| IMAP | 143 / 993 | TCP | Nhận và đồng bộ thư điện tử |
| FTP | 20 / 21 | TCP | Truyền tệp |
| SSH | 22 | TCP | Đăng nhập từ xa an toàn và truyền tệp |
| Telnet | 23 | TCP | Đăng nhập từ xa dạng văn bản thuần |
| DNS | 53 | UDP / TCP | Phân giải tên miền |
| RTP | Cổng động (số chẵn), RTCP dùng số lẻ liền kề | UDP làm chủ đạo | Truyền âm thanh/video thời gian thực |

Ở đây HTTPS được ghi là TCP / QUIC vì HTTPS truyền thống dựa trên TLS over TCP, còn trong ngữ cảnh HTTP/3 sẽ chạy trên nền QUIC.

## Tóm tắt

Bài viết này chỉ tổng hợp nhanh các giao thức tầng ứng dụng phổ biến mà không đi sâu vào cấu trúc gói tin chi tiết hay cơ chế hiện thực cụ thể.

Khi ôn tập, bạn có thể chú trọng ghi nhớ một số điểm dễ gây nhầm lẫn sau:

- HTTP là giao thức tầng ứng dụng, HTTP/1.1 và HTTP/2 thường dựa trên TCP, còn HTTP/3 dựa trên QUIC.
- HTTP/1.1 tái sử dụng kết nối TCP thông qua Keep-Alive, HTTP/2 thực hiện đa ghép kênh (multiplexing) trên một kết nối TCP, HTTP/3 dựa trên QUIC để khắc phục hiện tượng nghẽn đầu hàng (HoL) của TCP.
- WebSocket nâng cấp từ kết nối HTTP ban đầu để thiết lập kết nối, sau đó hỗ trợ giao tiếp hai chiều.
- SMTP chịu trách nhiệm gửi thư và chuyển tiếp giữa các server, POP3/IMAP chịu trách nhiệm cho người dùng nhận thư về.
- Các cổng phổ biến của SMTP bao gồm 25, 587, 465, tương ứng với các tình huống chuyển tiếp giữa các server, client gửi thư và gửi thư qua TLS ngầm định.
- FTP có chế độ chủ động (Active) và bị động (Passive), trong môi trường thực tế chế độ bị động phổ biến hơn.
- FTP, SFTP, FTPS không phải là cùng một thứ: FTP truyền dữ liệu dạng văn bản thuần, SFTP dựa trên SSH, còn FTPS dựa trên TLS.
- Telnet truyền văn bản thuần, không phù hợp cho việc quản trị từ xa trong môi trường sản xuất, thực tế thường dùng SSH hơn.
- DNS thông thường chạy trên nền UDP, nhưng khi phản hồi quá lớn, bị cắt ngắn hoặc truyền vùng dữ liệu (Zone Transfer) thì cũng sẽ sử dụng TCP.
- RTP chạy trên nền UDP, theo quy tắc phân tầng được xếp vào tầng ứng dụng nhưng nhiệm vụ lại gần gũi hơn với tầng truyền vận; RTP dùng cổng chẵn, còn RTCP đi kèm dùng cổng lẻ liền kề.

## Tài liệu tham khảo

- 《Computer Networking: A Top-Down Approach》(Tái bản lần thứ 7)
- Giới thiệu về giao thức RTP: <https://mthli.xyz/rtp-introduction/>
- RFC 6455: The WebSocket Protocol
- RFC 9110: HTTP Semantics
- RFC 8446: TLS 1.3
- RFC 9000: QUIC
- RFC 3550: RTP: A Transport Protocol for Real-Time Applications
- RFC 4571: Framing Real-time Transport Protocol (RTP) and RTP Control Protocol (RTCP) Packets over Connection-Oriented Transport
- RFC 6891: Extension Mechanisms for DNS (EDNS(0))
