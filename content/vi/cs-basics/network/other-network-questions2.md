---
title: Tổng hợp câu hỏi phỏng vấn Mạng máy tính thường gặp (Phần 2)
description: Tổng hợp các câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 2), bao gồm TCP/UDP, quản lý kết nối, truyền tải tin cậy, HTTP/3, IP, IPv6, NAT và ARP.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn mạng máy tính, TCP vs UDP, Bắt tay 3 bước TCP, HTTP/3 QUIC, IPv4 vs IPv6, Độ tin cậy TCP, Địa chỉ IP, Giao thức NAT, Giao thức ARP, Phỏng vấn tầng vận chuyển, Câu hỏi tầng mạng tần suất cao, Giao thức dựa trên TCP, Giao thức dựa trên UDP, Head-of-line blocking, Bắt tay 4 bước đóng kết nối
lang: vi
sourceRef: zh-ref/cs-basics/network/other-network-questions2.md
---

Trong các câu hỏi phỏng vấn mạng máy tính, phần thực sự dễ bị người phỏng vấn đào sâu vào chi tiết thường tập trung ở các kiến thức tầng vận chuyển và tầng mạng như **TCP, UDP, IP, ARP, NAT, IPv4/IPv6**. Ví dụ: Tại sao TCP lại tin cậy? Tại sao cần bắt tay 3 bước và bắt tay 4 bước giải phóng kết nối? Tại sao HTTP/3 lại đổi sang dùng giao thức QUIC xây dựng trên nền UDP? Những câu hỏi này không chỉ kiểm tra lý thuyết đơn thuần mà còn đánh giá mức độ hiểu biết sâu sắc của bạn về toàn bộ quá trình truyền thông mạng.

Bài viết "Tổng hợp câu hỏi phỏng vấn Mạng máy tính thường gặp (Phần 2)" này sẽ tập trung hệ thống hóa các nội dung có tần suất xuất hiện cao trong phỏng vấn backend như TCP và UDP, quản lý kết nối TCP, truyền tải tin cậy, địa chỉ IP, ARP, NAT, giúp bạn xâu chuỗi liền mạch các trọng điểm cốt lõi của tầng vận chuyển và tầng mạng.

## TCP và UDP

### ⭐️ Sự khác biệt giữa TCP và UDP (Quan trọng)

1. **Có hướng kết nối hay không**:
   - TCP là giao thức hướng kết nối (connection-oriented). Trước khi truyền dữ liệu, bắt buộc phải thông qua "bắt tay 3 bước" (three-way handshake) để thiết lập kết nối; sau khi truyền xong dữ liệu, cần thông qua "bắt tay 4 bước" để giải phóng kết nối. Điều này đảm bảo cả hai bên đều đã sẵn sàng truyền thông.
   - UDP là giao thức không kết nối (connectionless). Trước khi gửi dữ liệu không cần thiết lập bất kỳ kết nối nào, trực tiếp đẩy các gói dữ liệu (datagram) ra mạng.
2. **Có truyền tải tin cậy hay không**:
   - TCP cung cấp dịch vụ truyền dữ liệu tin cậy. Thông qua một chuỗi các cơ chế như số thứ tự (Sequence Number), xác nhận phản hồi (ACK), truyền lại khi quá hạn (timeout retransmission), kiểm soát luồng (flow control), kiểm soát tắc nghẽn (congestion control), TCP đảm bảo dữ liệu đến đích chính xác, không mất mát, không trùng lặp và đúng thứ tự.
   - UDP cung cấp dịch vụ truyền dữ liệu không tin cậy. Nó nỗ lực phân phối tối đa (best-effort delivery), không bảo đảm dữ liệu chắc chắn sẽ đến đích, không bảo đảm thứ tự đến, và càng không tự động truyền lại. Sau khi nhận được gói tin, bên nhận cũng không chủ động gửi xác nhận.
3. **Có trạng thái hay không**:
   - TCP là giao thức có trạng thái (stateful). Để đảm bảo độ tin cậy, TCP cần duy trì thông tin trạng thái kết nối ở cả hai đầu mút, ví dụ như số thứ tự, kích thước cửa sổ, dữ liệu nào đã gửi đi, dữ liệu nào đã nhận được xác nhận, v.v.
   - UDP là giao thức phi trạng thái (stateless). Nó không duy trì trạng thái kết nối; sau khi bên gửi phát dữ liệu đi thì không còn bận tâm xem dữ liệu có đến hay đến bằng cách nào, do đó chi phí phụ trợ rất thấp.
4. **Hiệu suất truyền tải**:
   - TCP vì phải thiết lập kết nối, gửi xác nhận, xử lý truyền lại, v.v., nên chi phí phụ trợ lớn hơn, hiệu suất truyền tải tương đối thấp hơn.
   - UDP có cấu trúc đơn giản, không có cơ chế điều khiển phức tạp, chi phí phụ trợ nhỏ, hiệu suất truyền tải cao hơn và tốc độ nhanh hơn.
5. **Hình thức truyền tải**:
   - TCP hướng dòng byte (Byte Stream). Nó coi dữ liệu mà tầng ứng dụng bàn giao là một chuỗi các dòng byte không có cấu trúc cố định, có thể chia nhỏ hoặc gộp các khối dữ liệu lại.
   - UDP hướng thông điệp / dữ liệu báo (Message Oriented). Tầng ứng dụng giao cho UDP khối dữ liệu lớn bao nhiêu thì UDP gửi nguyên vẹn bấy nhiêu, không chia nhỏ cũng không gộp lại, bảo toàn ranh giới thông điệp của ứng dụng.
6. **Chi phí tiêu đề (Header Overhead)**:
   - Tiêu đề của TCP cần ít nhất 20 byte, nếu có thêm các trường tùy chọn thì tối đa có thể lên tới 60 byte.
   - Tiêu đề của UDP vô cùng đơn giản, cố định chỉ có 8 byte.
7. **Có hỗ trợ dịch vụ quảng bá hoặc đa truyền (Multicast) hay không**:
   - TCP chỉ hỗ trợ truyền thông đơn công điểm-điểm (Point-to-Point / Unicast).
   - UDP hỗ trợ truyền thông 1-1 (Unicast), 1-nhiều (Multicast) và 1-tất cả (Broadcast).
8. ……

Để so sánh trực quan hơn, bạn có thể theo dõi bảng sau:

| Đặc tính | TCP | UDP |
| --- | --- | --- |
| **Tính kết nối** | Hướng kết nối | Không kết nối |
| **Độ tin cậy** | Tin cậy | Không tin cậy (nỗ lực tối đa) |
| **Duy trì trạng thái** | Có trạng thái (Stateful) | Phi trạng thái (Stateless) |
| **Hiệu suất truyền tải** | Thấp hơn | Cao hơn |
| **Hình thức truyền tải** | Hướng dòng byte (Byte Stream) | Hướng thông điệp / Datagram |
| **Chi phí tiêu đề** | 20 - 60 byte | 8 byte |
| **Mô hình truyền thông** | Điểm-điểm (Unicast) | Unicast, Multicast, Broadcast |
| **Ứng dụng phổ biến** | HTTP/HTTPS, FTP, SMTP, SSH | DNS, DHCP, SNMP, TFTP, VoIP, Livestream video |

### ⭐️ Khi nào nên chọn TCP, khi nào nên chọn UDP?

Việc lựa chọn TCP hay UDP chủ yếu phụ thuộc vào việc ứng dụng của bạn **yêu cầu mức độ tin cậy của dữ liệu cao đến đâu, và yêu cầu về tính thời gian thực cùng hiệu suất cao đến mức nào**.

Khi **tính chính xác và toàn vẹn của dữ liệu là tối quan trọng, tuyệt đối không được phép sai sót**, thông thường sẽ chọn TCP. Bởi vì TCP cung cấp trọn bộ cơ chế (bắt tay 3 bước, xác nhận phản hồi, truyền lại, kiểm soát luồng, v.v.) để đảm bảo dữ liệu được phân phối tin cậy và đúng thứ tự. Các tình huống điển hình:

- **Duyệt Web (HTTP/HTTPS):** Nội dung trang web, hình ảnh, mã script phải được tải trọn vẹn mới hiển thị chính xác.
- **Truyền tệp tin (FTP, SCP):** Nội dung tệp tin không cho phép mất mát hoặc đảo lộn bất kỳ byte nào.
- **Gửi nhận thư điện tử (SMTP, POP3, IMAP):** Nội dung email cần được chuyển giao trọn vẹn, không sai sót.
- **Đăng nhập từ xa (SSH, Telnet):** Lệnh và kết quả trả về từ console cần truyền tải chính xác.
- ……

Khi **tính thời gian thực, tốc độ và hiệu suất được ưu tiên hàng đầu, và ứng dụng có thể chịu đựng được việc mất mát hoặc đảo lộn một lượng nhỏ dữ liệu**, thông thường sẽ chọn UDP. UDP có chi phí nhỏ, truyền tải nhanh, không có quy trình thiết lập kết nối và bảo đảm tin cậy phức tạp. Các tình huống điển hình:

- **Truyền thông âm thanh/hình ảnh thời gian thực (VoIP, Video họp trực tuyến, Livestream):** Việc thỉnh thoảng rơi mất một hai gói tin (có thể khiến hình ảnh hoặc âm thanh khựng nhẹ trong tích tắc) thường dễ chấp nhận hơn nhiều so với việc phải chờ đợi truyền lại (cơ chế của TCP) gây ra độ trễ kéo dài. Tầng ứng dụng có thể tự trang bị cơ chế bù đắp riêng.
- **Game trực tuyến (Online Gaming):** Cần truyền nhanh vị trí, trạng thái của người chơi, đòi hỏi tính thời gian thực cực cao; dữ liệu cũ rất nhanh mất giá trị, mất một lượng nhỏ dữ liệu thường không ảnh hưởng lớn.
- **DHCP (Dynamic Host Configuration Protocol):** Khi client yêu cầu cấp phát IP thì bản thân nó chưa hề có địa chỉ IP, không thỏa mãn điều kiện tiên quyết để thiết lập kết nối TCP; hơn nữa DHCP có nhu cầu broadcast, mô hình tương tác đơn giản và tự có cơ chế tin cậy ở tầng ứng dụng.
- **Báo cáo dữ liệu IoT:** Trong một số trường hợp, cảm biến định kỳ gửi dữ liệu đo đạc, rơi rớt vài điểm dữ liệu cá biệt không ảnh hưởng tới phân tích xu hướng tổng thể.
- ……

### HTTP chạy trên nền TCP hay UDP?

~~**Giao thức HTTP dựa trên giao thức TCP**, do đó trước khi gửi yêu cầu HTTP trước tiên phải thiết lập kết nối TCP, tức trải qua quá trình bắt tay 3 bước.~~

🐛 Đính chính (tham khảo [issue#1915](https://github.com/Snailclimb/JavaGuide/issues/1915)):

Trước HTTP/3.0, HTTP dựa trên giao thức TCP; còn HTTP/3.0 loại bỏ TCP và chuyển sang sử dụng **giao thức QUIC xây dựng trên nền UDP**:

- **HTTP/1.x và HTTP/2.0**: Cả hai phiên bản này đều xây dựng rõ ràng trên nền TCP. TCP cung cấp khả năng truyền tải tin cậy, hướng kết nối, đảm bảo dữ liệu đến đúng thứ tự và không lỗi, điều này rất quan trọng cho việc hiển thị chính xác trang web. Trước khi gửi yêu cầu HTTP cần thông qua bắt tay 3 bước của TCP để thiết lập kết nối.
- **HTTP/3.0**: Đây là một thay đổi mang tính cách mạng. HTTP/3 từ bỏ TCP, chuyển sang dùng giao thức QUIC, và bản thân QUIC được xây dựng trên nền tảng UDP.

![So sánh ngăn xếp giao thức HTTP/1, HTTP/2 và HTTP/3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-3-implementation-ab73b085.png)

**Tại sao HTTP/3 lại thực hiện sự thay đổi này? Chủ yếu vì hai nguyên nhân lớn:**

1. Giải quyết triệt để vấn đề tắc nghẽn đầu hàng (Head-of-Line Blocking - HOL blocking).
2. Giảm thiểu độ trễ khi thiết lập kết nối.

Hãy cùng phân tích chi tiết hai điểm tối ưu này:

Trong HTTP/2, mặc dù có thể truyền đồng thời nhiều luồng yêu cầu/phản hồi trên cùng một kết nối TCP (đa ghép kênh - multiplexing), nhưng đặc tính của TCP (bảo đảm thứ tự nghiêm ngặt, tin cậy) đồng nghĩa với việc nếu một gói TCP của một luồng nào đó bị thất lạc hoặc trễ, toàn bộ kết nối TCP sẽ bị nghẽn lại để chờ gói tin đó được truyền lại. Điều này dẫn tới tất cả các luồng HTTP/2 trên kết nối TCP đó đều bị đình trệ theo, ngay cả khi các gói dữ liệu của những luồng khác đã tới nơi đầy đủ. **QUIC (chạy trên UDP) đã giải quyết trọn vẹn vấn đề này**. Bản thân QUIC tự triển khai cơ chế đa ghép kênh và kiểm soát luồng bên trong. Các luồng yêu cầu/phản hồi HTTP khác nhau ở tầng QUIC là hoàn toàn độc lập với nhau. Nếu gói tin của một luồng bị mất, nó chỉ làm tắc nghẽn luồng đó, hoàn toàn không ảnh hưởng tới các luồng khác trên cùng kết nối QUIC, nâng cao đáng kể hiệu suất truyền tải đồng thời.

Bên cạnh giải quyết HOL blocking, HTTP/3.0 còn giảm độ trễ trong quá trình bắt tay. Trong HTTP/2.0, nếu muốn thiết lập kết nối HTTPS an toàn, cần trải qua bắt tay 3 bước TCP cộng thêm quá trình bắt tay TLS:

RTT chỉ thời gian khứ hồi để gói tin đi từ một đầu mút tới đầu đối diện rồi quay về, không phải thời gian truyền một chiều. Đo lường độ trễ bắt tay TCP cần xác định rõ điểm mút đo đạc: Client nhận được SYN-ACK sau khoảng 1 RTT kể từ khi phát SYN, sau đó có thể gửi ACK cuối cùng kèm yêu cầu ứng dụng; máy chủ cần thêm một khoảng thời gian truyền một chiều để nhận ACK và yêu cầu đó. Khi so sánh HTTP/2 và HTTP/3, cần thống nhất dùng cùng một chỉ số như "khi nào client có thể gửi yêu cầu đầu tiên" hoặc "khi nào client nhận byte đầu tiên (TTFB)".

Kết nối HTTPS của HTTP/2 cần thiết lập kết nối TCP trước rồi mới hoàn tất bắt tay TLS. HTTP/3 tích hợp việc thương lượng tham số truyền tải và bắt tay TLS 1.3 trực tiếp vào quá trình thiết lập kết nối QUIC. Kết nối QUIC mới thông thường sử dụng 1-RTT; chế độ 0-RTT chỉ áp dụng cho trường hợp khôi phục phiên khi client đã nắm giữ trạng thái kết nối trước đó, có thể mang theo dữ liệu sớm (early data) ngay trong gói tin đầu tiên, tuy nhiên tiềm ẩn rủi ro tấn công phát lại (replay attack) và chỉ thích hợp cho các yêu cầu có tính an toàn khi lặp lại (idempotent).

Tài liệu tham khảo chứng minh:

- <https://zh.wikipedia.org/zh/HTTP/3>
- <https://datatracker.ietf.org/doc/rfc9114/>

### Tại sao TCP hướng dòng byte, còn UDP hướng thông điệp?

![Ranh giới thông điệp của TCP và UDP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-udp-message-boundary-ff2c1ad3.png)

TCP hướng dòng byte. Dữ liệu do tầng ứng dụng ghi vào sẽ đi vào bộ đệm của kernel, TCP chỉ bảo đảm các byte này đến đầu đối diện một cách tin cậy và đúng thứ tự, không bảo đảm một lần gọi `send()` sẽ tương ứng đúng với một lần gọi `recv()`, cũng không lưu giữ ranh giới thông điệp của tầng ứng dụng. Do đó phía nhận có thể đọc được nhiều thông điệp trong một lần đọc, hoặc chỉ đọc được nửa thông điệp — đây chính là hiện tượng dính gói (packet sticking/coalescing) và xé gói (packet splitting/fragmentation) thường được nhắc tới.

![Tại sao lại xuất hiện dính gói / xé gói trong TCP?](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-sticky-split-causes-3dc840f6.png)

UDP hướng thông điệp. Mỗi lần dữ liệu mà tầng ứng dụng giao cho UDP sẽ được gửi đi như một datagram UDP độc lập; bên nhận cũng đọc theo từng datagram, do đó tự nhiên bảo toàn được ranh giới thông điệp. Tuy nhiên UDP không đảm bảo phân phối tin cậy và không đảm bảo thứ tự.

Để giải quyết hiện tượng dính gói/xé gói của TCP, bản chất là giao thức tầng ứng dụng phải tự mình định nghĩa ranh giới thông điệp. Các giải pháp phổ biến gồm: độ dài cố định, ký tự phân cách, tiêu đề tiền tố độ dài. Trong thực tế kỹ thuật, tiêu đề tiền tố độ dài được sử dụng phổ biến nhất vì thân thiện với giao thức nhị phân và thông điệp có độ dài biến thiên, tuy nhiên cần xử lý thứ tự byte (endianness), giới hạn độ dài tối đa, bộ đệm nửa gói và việc đóng kết nối bất thường.

![Tầng ứng dụng định nghĩa ranh giới thông điệp như thế nào?](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-message-boundary-solutio-86186610.png)

Xem bài viết chi tiết: [Tại sao TCP hướng dòng byte, còn UDP hướng thông điệp?](./tcp-byte-stream-udp-datagram.md)

### Bạn biết những giao thức nào chạy trên nền TCP/UDP?

TCP (Transmission Control Protocol) và UDP (User Datagram Protocol) là hai giao thức cốt lõi của tầng vận chuyển Internet, cung cấp dịch vụ truyền thông nền tảng cho nhiều giao thức tầng ứng dụng khác nhau:

**Các giao thức chạy trên nền TCP (chú trọng truyền tải tin cậy, có thứ tự):**

| Tên tiếng Việt (viết tắt) | Tên tiếng Anh đầy đủ | Mục đích chính | Giải thích và đặc tính |
| --- | --- | --- | --- |
| Giao thức truyền siêu văn bản (HTTP) | HyperText Transfer Protocol | Truyền tải trang web, siêu văn bản, đa phương tiện | **HTTP/1.x và HTTP/2 chạy trên TCP**. Phiên bản ban đầu không mã hóa, là nền tảng của truyền thông Web. |
| Giao thức truyền siêu văn bản an toàn (HTTPS) | HyperText Transfer Protocol Secure | Truyền tải web được mã hóa an toàn | Dùng TLS bảo vệ HTTP. HTTP/1.1 và HTTP/2 thường dùng TLS over TCP, HTTP/3 dùng QUIC tích hợp TLS 1.3. |
| Giao thức truyền tệp tin (FTP) | File Transfer Protocol | Truyền tải tệp tin | FTP truyền thống **truyền dạng văn bản thuần (plaintext)**, không an toàn. Khuyến nghị dùng bản an toàn như **SFTP (SSH File Transfer Protocol)** hoặc **FTPS (FTP over SSL/TLS)**. |
| Giao thức truyền thư đơn giản (SMTP) | Simple Mail Transfer Protocol | **Gửi** thư điện tử | Chịu trách nhiệm gửi email từ client lên server hoặc chuyển tiếp giữa các mail server. Có thể nâng cấp mã hóa qua **STARTTLS**. |
| Giao thức bưu điện phiên bản 3 (POP3) | Post Office Protocol version 3 | **Nhận** thư điện tử | Thường tải email từ server **về thiết bị cục bộ rồi xóa bản sao trên server** (có thể cấu hình giữ lại). **POP3S** là phiên bản mã hóa SSL/TLS của nó. |
| Giao thức truy cập thông điệp Internet (IMAP) | Internet Message Access Protocol | **Nhận và quản lý** thư điện tử | Email được lưu trên server, hỗ trợ đồng bộ trạng thái trên nhiều thiết bị, quản lý thư mục, tìm kiếm online. **IMAPS** là bản mã hóa SSL/TLS. Lựa chọn hàng đầu cho email hiện đại. |
| Giao thức đầu cuối từ xa (Telnet) | Teletype Network | Đăng nhập terminal từ xa | **Truyền văn bản thuần** toàn bộ dữ liệu (kể cả mật khẩu), tính bảo mật cực kém, hầu như đã bị thay thế hoàn toàn bởi SSH. |
| Giao thức vỏ bảo mật (SSH) | Secure Shell | Quản trị từ xa an toàn, truyền dữ liệu mã hóa | Cung cấp đăng nhập từ xa được mã hóa, thực thi dòng lệnh và truyền file an toàn (SFTP). Thay thế an toàn cho Telnet. |

**Các giao thức chạy trên nền UDP (chú trọng truyền tải nhanh, chi phí thấp):**

| Tên tiếng Việt (viết tắt) | Tên tiếng Anh đầy đủ | Mục đích chính | Giải thích và đặc tính |
| --- | --- | --- | --- |
| Giao thức truyền siêu văn bản phiên bản 3 (HTTP/3) | HyperText Transfer Protocol version 3 | Truyền tải web thế hệ mới | Dựa trên giao thức **QUIC** (QUIC xây dựng trên UDP), nhằm giảm độ trễ, triệt tiêu TCP HOL blocking; hỗ trợ dữ liệu sớm 0-RTT khi khôi phục phiên. |
| Giao thức cấu hình host động (DHCP) | Dynamic Host Configuration Protocol | Cấp phát động địa chỉ IP và cấu hình mạng | Client tự động nhận địa chỉ IP, subnet mask, gateway, DNS server từ DHCP server. |
| Hệ thống phân giải tên miền (DNS) | Domain Name System | Phân giải tên miền thành địa chỉ IP | **Thông thường sử dụng UDP** để truy vấn nhanh. Khi gói phản hồi vượt quá kích thước hoặc khi truyền vùng (AXFR) sẽ **chuyển sang TCP** để bảo đảm toàn vẹn dữ liệu. |
| Giao thức truyền tải thời gian thực (RTP) | Real-time Transport Protocol | Truyền luồng dữ liệu âm thanh/hình ảnh thời gian thực | Phổ biến trong VoIP, họp video, livestream. Ưu tiên độ trễ thấp, chấp nhận mất một lượng nhỏ gói tin. Thường phối hợp cùng RTCP. |
| Giao thức điều khiển RTP (RTCP) | RTP Control Protocol | Giám sát chất lượng luồng RTP và truyền tin điều khiển | Hoạt động cùng RTP, cung cấp thống kê về tỷ lệ mất gói, độ trễ, độ biến thiên trễ (jitter), hỗ trợ kiểm soát luồng và tắc nghẽn. |
| Giao thức truyền tệp đơn giản (TFTP) | Trivial File Transfer Protocol | Truyền tệp tin đơn giản hóa | Chức năng đơn giản, thường dùng cho khởi động máy trạm không ổ đĩa trong LAN, nâng cấp firmware thiết bị mạng. |
| Giao thức quản lý mạng đơn giản (SNMP) | Simple Network Management Protocol | Giám sát và quản lý thiết bị mạng | Cho phép quản trị viên mạng truy vấn và sửa đổi thông tin trạng thái thiết bị mạng. |
| Giao thức thời gian mạng (NTP) | Network Time Protocol | Đồng bộ đồng hồ máy tính | Dùng để đồng bộ thời gian giữa các máy tính trong mạng, đảm bảo tính nhất quán về thời gian. |

**Tổng kết lại:**

- **TCP** phù hợp hơn cho các ứng dụng đòi hỏi cao về **tính tin cậy, toàn vẹn và đúng thứ tự** của dữ liệu, như duyệt web (HTTP/HTTPS), truyền file (FTP/SFTP), gửi nhận email (SMTP/POP3/IMAP).
- **UDP** phù hợp hơn cho các ứng dụng yêu cầu **tính thời gian thực cao, có thể chấp nhận mất mát một lượng nhỏ dữ liệu**, như phân giải tên miền (DNS), âm thanh/hình ảnh thời gian thực (RTP), game online, giám sát quản lý mạng (SNMP), v.v.

### ⭐️ Sự khác biệt giữa TCP Keepalive và HTTP Keep-Alive

| Chiều so sánh | HTTP Keep-Alive | TCP Keepalive |
| --- | --- | --- |
| **Tầng trực thuộc** | Tầng ứng dụng (Giao thức HTTP) | Tầng vận chuyển (Giao thức TCP) |
| **Vấn đề giải quyết** | Tái sử dụng kết nối TCP, giảm chi phí thiết lập lại kết nối, bắt tay, khởi động chậm | Thăm dò các kết nối TCP nhàn rỗi lâu ngày, giải phóng tài nguyên khi đầu đối diện mất liên lạc |
| **Hành vi mặc định** | HTTP/1.0 mặc định kết nối ngắn; HTTP/1.1 mặc định kết nối dài | Mặc định tắt, ứng dụng cần bật tường minh qua `SO_KEEPALIVE` |
| **Độ chi tiết kiểm soát** | Do HTTP client, Web server hoặc proxy kiểm soát theo chính sách kết nối | Do kernel hệ điều hành kiểm soát, trên một số nền tảng có thể tùy chỉnh theo từng socket |
| **Tham số thường gặp** | `Connection`, `Keep-Alive: timeout/max`, cấu hình timeout của server | `tcp_keepalive_time/intvl/probes` hoặc các tham số tương ứng của OS |
| **Kích hoạt đóng** | Đạt ngưỡng timeout nhàn rỗi, vượt giới hạn số lượt request, hoặc một bên chủ động đóng | Gửi gói thăm dò sau thời gian nhàn rỗi; đóng sau nhiều lần không phản hồi hoặc nhận RST |
| **Khi đối phương online** | Server vẫn có thể chủ động thu hồi kết nối nhàn rỗi theo cấu hình | Chỉ cần kernel đối phương còn phản hồi ACK, kết nối vẫn tiếp tục được duy trì |
| **Có thay thế heartbeat?** | Không thể đánh giá nghiệp vụ có khỏe mạnh không, chỉ quản lý tái sử dụng kết nối HTTP | Không thể đánh giá thread pool ứng dụng, event loop hay phụ thuộc nghiệp vụ có bình thường không |
| **Ảnh hưởng của tầng trung gian**| Proxy, gateway có thể quản lý độc lập hai đoạn kết nối HTTP/TCP trước và sau | NAT/LB/Reverse Proxy có thể khiến bạn chỉ thăm dò được một đoạn kết nối TCP cục bộ |
| **Quan hệ với HTTP/2/3** | HTTP/2 cấm header cấp kết nối; HTTP/3/QUIC không sử dụng cơ chế này | Chỉ tác động lên TCP; kết nối HTTP/3/QUIC thực sự không chịu ảnh hưởng trực tiếp |

**Trong các phiên bản HTTP khác nhau, hành vi mặc định của Keep-Alive là khác nhau**:

![Hành vi mặc định của Keep-Alive trong các phiên bản HTTP khác nhau](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/different-http-versions-have-different-default-k-f743d0f1.png)

Nếu nhìn từ góc độ "ai quyết định việc đóng kết nối", thái độ của hai cơ chế hoàn toàn trái ngược:

HTTP Keep-Alive là "chủ động thu hồi" — máy chủ khi đến giới hạn thời gian chờ hoặc số lượt request có thể đóng kết nối theo cấu hình của riêng mình mà không cần thăm dò xem đối phương có còn online hay không. Đây là phương thức thu hồi tài nguyên mang tính chủ động.

TCP Keepalive là "bị động thu hồi" — nó bắt buộc phải gửi gói tin thăm dò để hỏi "Bạn còn đó không?". Miễn là đối phương online và phản hồi được ACK, máy chủ buộc phải tiếp tục duy trì kết nối và làm mới bộ định thời. Chỉ khi xác nhận đối phương thực sự đã mất tích thì mới giải phóng tài nguyên. Đây là chiến lược thu hồi ôn hòa.

![Nguyên lý hoạt động của TCP Keepalive](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-wo-7f50afab.png)

![Cơ chế thăm dò của TCP Keepalive](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-keepalive-vs-http-keepalive-tcp-keepalive-de-306c79b5.png)

Trong các dự án thực tế, cả hai thường cùng lúc hoạt động và phụ trách các vai trò riêng: HTTP Keep-Alive quản lý việc "một kết nối dùng tối đa bao lâu, phục vụ bao nhiêu request", còn TCP Keepalive quản lý việc "nếu lâu ngày không có dữ liệu, hãy kiểm tra xem đối phương có biến mất không". Hai cơ chế không xung đột và không thể thay thế cho nhau.

Xem bài viết chi tiết: [Sự khác biệt giữa TCP Keepalive và HTTP Keep-Alive là gì?](./tcp-keepalive-vs-http-keepalive.md)

### ⭐️ Bắt tay 3 bước và Bắt tay 4 bước của TCP (Cực kỳ quan trọng)

**Các câu hỏi phỏng vấn liên quan**:

- Tại sao cần bắt tay 3 bước?
- Lần bắt tay thứ 2 đã gửi về ACK, tại sao vẫn phải gửi kèm SYN?
- Tại sao cần bắt tay 4 bước để đóng kết nối?
- Tại sao không thể gộp ACK và FIN do server gửi thành một lần để biến thành bắt tay 3 bước?
- Nếu trong lần bắt tay thứ 2 của quá trình đóng kết nối, ACK của server không tới được client thì sao?
- Tại sao trong lần bắt tay thứ 4, client cần chờ thời gian 2*MSL (thời gian sống tối đa của đoạn gói tin) ở trạng thái `TIME_WAIT` rồi mới chuyển sang trạng thái `CLOSED`?

**Đáp án tham khảo**: [Bắt tay 3 bước và Bắt tay 4 bước của TCP (Tầng vận chuyển)](https://javaguide.cn/cs-basics/network/tcp-connection-and-disconnection.html).

### TCP TIME_WAIT rốt cuộc đang chờ cái gì? Tại sao phải chờ?

**Các câu hỏi phỏng vấn liên quan**:

1. `TIME_WAIT` rốt cuộc đang chờ cái gì?
2. `TIME_WAIT` tích tụ số lượng lớn có thực sự gây ra sự cố không?
3. Có thể tùy tiện bật `tcp_tw_reuse` không?
4. Phân biệt `TIME_WAIT` và `CLOSE_WAIT` như thế nào?

**Đáp án tham khảo**: [Giải mã TCP TIME_WAIT: Tại sao phải chờ, có gây sự cố không, có thể tái sử dụng không?](./tcp-time-wait.md).

### ⭐️ TCP đảm bảo độ tin cậy của quá trình truyền tải như thế nào? (Quan trọng)

[Bảo đảm độ tin cậy truyền tải của TCP (Tầng vận chuyển)](https://javaguide.cn/cs-basics/network/tcp-reliability-guarantee.html)

### TCP và UDP có thể dùng chung một cổng không?

Kết luận: **Có thể**. Không gian tên định danh cổng của TCP và UDP được phân chia theo giao thức tầng vận chuyển; cùng một số hiệu cổng dưới các giao thức khác nhau không hề xung đột.

Khi kernel nhận được gói tin IP, trước tiên nó sẽ kiểm tra trường định danh giao thức tầng IP (mã giao thức TCP là `6`, UDP là `17`), căn cứ vào số hiệu giao thức để chuyển gói tin tới ngăn xếp giao thức TCP hoặc UDP tương ứng, sau đó mới phân phối theo địa chỉ và cổng trong từng ngăn xếp riêng biệt. Do đó `TCP/8080` và `UDP/8080` có thể cùng tồn tại, kernel hoàn toàn không coi chúng là cùng một kênh truyền thông.

![Quy trình phân phối giao thức của kernel](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-kernel-protoco-09d025cf.png)

Điều thực sự gây xung đột là việc liên kết (bind) trùng lặp dưới **cùng một giao thức**, ví dụ hai dịch vụ TCP thông thường không thể cùng lắng nghe trên cùng một IP cục bộ và số cổng; khi đó mới cần tới các tùy chọn socket như `SO_REUSEADDR`, `SO_REUSEPORT`.

Ví dụ kinh điển: DNS sử dụng đồng thời `UDP/53` (truy vấn thường nhật) và `TCP/53` (phản hồi vượt kích thước, truyền vùng); HTTP/3 triển khai phổ biến trên `UDP/443` (QUIC), có thể cùng tồn tại song song với HTTPS truyền thống trên `TCP/443`.

![Trường hợp thực tế DNS và HTTP/3 đồng thời sử dụng cổng TCP và UDP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-practical-appl-ab70afb0.png)

Xem bài viết chi tiết: [TCP và UDP có thể sử dụng cùng một cổng không?](./can-tcp-and-udp-use-the-same-port.md)

### ⭐️ Một máy chủ có phải chỉ duy trì được tối đa 65,535 kết nối TCP không?

Kết luận: **Không phải**. `65535` là số hiệu cổng lớn nhất (16 bit), không phải giới hạn số lượng kết nối.

Kết nối TCP được phân biệt bằng bộ tứ (4-tuple): `(IP nguồn, Cổng nguồn, IP đích, Cổng đích)`. Chỉ cần một phần tử trong bộ tứ khác biệt, kernel sẽ nhận diện là các kết nối khác nhau. Khi máy chủ lắng nghe trên cùng một cổng, chỉ cần IP của client hoặc cổng của client khác nhau, số lượng kết nối hoàn toàn có thể tiếp tục tăng lên.

![Kết nối TCP phân biệt bằng bộ tứ và các giới hạn thực sự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/maximum-number-of-tcp-connections-per-host-tcp-f-4d337232.png)

Các yếu tố thực sự giới hạn số lượng kết nối:

- **Phía Server**: Chủ yếu bị giới hạn bởi số lượng file descriptor (bộ mô tả tệp), bộ nhớ RAM, CPU, card mạng và năng lực xử lý của ứng dụng, chứ không phải số lượng cổng.
- **Phía Client**: Khi kết nối tới cùng một mục tiêu, IP nguồn và cặp IP:Port đích đều cố định, chỉ còn cổng nguồn tạm thời là biến thiên, nên rất dễ chạm trần giới hạn cổng tạm thời (Linux mặc định khoảng 28.000 cổng). Việc tích tụ socket ở trạng thái `TIME_WAIT` sẽ làm trầm trọng thêm vấn đề này.
- **NAT Gateway**: Khi lượng lớn máy mạng nội bộ chia sẻ chung một IP công cộng để truy cập cùng một đích bên ngoài, các cổng nguồn công cộng phía NAT cũng sẽ trở thành nút thắt cổ chai.

Cái bẫy thường gặp nhất trong môi trường sản xuất không phải là thiếu cổng, mà là **cấu hình connection pool không hợp lý dẫn đến việc các kết nối ngắn liên tục được tạo ra và hủy bỏ điên cuồng**, làm cạn kiệt cổng tạm thời. Khi điều tra sự cố, hãy ưu tiên kiểm tra xem connection pool và keep-alive có phát huy tác dụng hay không, đừng vội vàng can thiệp vào các tham số kernel.

Xem bài viết chi tiết: [Một máy chủ có phải chỉ duy trì được tối đa 65.535 kết nối TCP không?](./maximum-number-of-tcp-connections-per-host.md)

## IP

### Giao thức IP có tác dụng gì?

**IP (Internet Protocol - Giao thức liên mạng)** là một trong những giao thức quan trọng nhất trong bộ TCP/IP, thuộc tầng mạng. Tác dụng chính của nó là định nghĩa định dạng gói tin, thực hiện định tuyến và đánh địa chỉ cho các gói dữ liệu để chúng có thể truyền qua các mạng khác nhau và đến đúng đích.

Hiện nay giao thức IP chủ yếu chia làm hai loại: IPv4 truyền thống và IPv6 mới hơn. Cả hai hiện đều đang được sử dụng, nhưng IPv6 đã được đề xuất để thay thế hoàn toàn cho IPv4.

### Địa chỉ IP là gì? Việc đánh địa chỉ IP hoạt động như thế nào?

Địa chỉ IP thường được gán cho một giao diện mạng (network interface), dùng để định danh điểm mút truyền thông trong một phạm vi và ngữ cảnh định tuyến cụ thể. Một giao diện có thể có nhiều địa chỉ, địa chỉ cũng có thể thay đổi động; địa chỉ private có thể tái sử dụng ở các mạng khác nhau, và địa chỉ Anycast còn có thể gán cho nhiều giao diện. Ví dụ IPv4 là `192.168.1.1`, ví dụ IPv6 là `2001:0db8:85a3:0000:0000:8a2e:0370:7334`.

Khi thiết bị mạng gửi gói tin IP, trong gói tin chứa **Địa chỉ IP nguồn** và **Địa chỉ IP đích**. Chúng định danh địa chỉ giao diện nguồn và địa chỉ đích sử dụng cho phiên truyền thông cụ thể này, chứ không phải là danh tính vĩnh viễn không đổi của bản thân thiết bị vật lý.

Thiết bị mạng dựa vào địa chỉ IP đích để phán đoán điểm đến của gói tin và chuyển tiếp gói tin tới mạng hoặc mạng con đích chính xác, từ đó hiện thực hóa việc truyền thông giữa các thiết bị.

Phương thức đánh địa chỉ dựa trên IP này là nền tảng của truyền thông Internet. Việc địa chỉ có duy nhất hay có thể định tuyến toàn cầu hay không phụ thuộc vào loại địa chỉ và phạm vi hoạt động của nó; không thể mô tả chung chung rằng IP là chứng minh thư toàn cầu duy nhất của mỗi thiết bị.

![Địa chỉ IP giúp gói tin tới được điểm đích của nó](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/internet_protocol_ip_address_diagram-ec6271a2.png)

### Lọc địa chỉ IP là gì?

**Lọc địa chỉ IP (IP Address Filtering)** hiểu đơn giản là giới hạn hoặc ngăn chặn quyền truy cập từ một địa chỉ IP hoặc dải địa chỉ IP cụ thể. Ví dụ dịch vụ hình ảnh của bạn đột nhiên bị một địa chỉ IP nào đó tấn công, chúng ta có thể cấm địa chỉ IP này truy cập dịch vụ hình ảnh.

Lọc địa chỉ IP là một biện pháp an ninh mạng cơ bản. Trong ứng dụng thực tế, nó thường được kết hợp với các biện pháp an ninh mạng khác như xác thực, phân quyền, mã hóa. Việc chỉ dựa vào lọc IP đơn thuần không thể đảm bảo an toàn tuyệt đối cho mạng.

### ⭐️ Sự khác biệt giữa IPv4 và IPv6?

**IPv4 (Internet Protocol version 4)** là phiên bản địa chỉ IP đang được sử dụng rộng rãi hiện nay, định dạng của nó là 4 nhóm số thập phân ngăn cách bởi dấu chấm, ví dụ: `123.89.46.72`. IPv4 sử dụng địa chỉ 32 bit, điều này có nghĩa là tổng cộng có khoảng 4,2 tỷ (2^32) địa chỉ IP khả dụng.

![Định dạng địa chỉ IPv4 sử dụng dấu chấm thập phân biểu diễn địa chỉ 32 bit](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/Figure-1-IPv4Addressformatwithdotteddecimalnotat-233c4843.png)

Số lượng này hiển nhiên không đủ dùng cho toàn cầu! Để giải quyết triệt để vấn đề cạn kiệt địa chỉ IP, biện pháp căn bản nhất là sử dụng phiên bản giao thức IP mới có không gian địa chỉ lớn hơn: **IPv6 (Internet Protocol version 6)**. Địa chỉ IPv6 sử dụng định dạng phức tạp hơn, bao gồm các nhóm số và chữ cái hệ thập lục phân ngăn cách bởi dấu hai chấm đơn hoặc kép, ví dụ: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`. IPv6 sử dụng địa chỉ 128 bit, đồng nghĩa với việc có tới 2^128 địa chỉ IP khả dụng (con số gồm 39 chữ số bắt đầu bằng số 3, một con số khổng lồ).

![Định dạng địa chỉ IPv6 sử dụng ký hiệu thập lục phân ngăn cách bởi dấu hai chấm biểu diễn địa chỉ 128 bit](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/Figure-2-IPv6Addressformatwithhexadecimalnotatio-78d646ff.png)

Bên cạnh không gian địa chỉ khổng lồ, ưu thế của IPv6 còn bao gồm:

- **Tự động cấu hình địa chỉ phi trạng thái (Stateless Address Autoconfiguration - SLAAC)**: Host có thể dựa vào tiền tố mà router quảng bá cùng định danh giao diện để tự tạo địa chỉ IPv6 mà không cần phụ thuộc vào DHCPv6. Trước khi dùng địa chỉ, thông thường sẽ thực hiện Phát hiện địa chỉ trùng lặp (Duplicate Address Detection - DAD), nhưng DAD chỉ kiểm tra trùng lặp trong liên kết cục bộ chứ không bảo đảm tuyệt đối tính duy nhất toàn cầu.
- **Biên dịch địa chỉ mạng NAT trở thành tùy chọn**: Tài nguyên IPv6 dồi dào cho phép cấp địa chỉ độc lập, định tuyến toàn cầu cho mọi thiết bị.
- **Cải tiến cấu trúc tiêu đề (header)**: Tiêu đề cơ bản của IPv6 được tinh giản giúp tối ưu một phần xử lý trên đường truyền chuyển tiếp thông thường, tuy nhiên hiệu năng thực tế vẫn phụ thuộc vào phần cứng, các tiêu đề mở rộng và chính sách mạng.
- **Tiêu đề mở rộng tùy chọn (Extension Headers)**: Cho phép chèn các tiêu đề mở rộng khác nhau vào sau tiêu đề cơ bản để hiện thực hóa các tính năng chuyên biệt.
- **ICMPv6 (Internet Control Message Protocol for IPv6)**: ICMPv6 mang lại nhiều cải tiến so với ICMP của IPv4 như Khám phá nút lân cận (Neighbor Discovery), Khám phá MTU đường truyền (Path MTU Discovery), giúp nâng cao độ tin cậy và hiệu năng mạng.
- ……

### Làm thế nào để lấy địa chỉ IP thật của client?

Có nhiều phương pháp để lấy IP thực của client, chủ yếu chia thành phương pháp tầng ứng dụng, phương pháp tầng vận chuyển và phương pháp tầng mạng.

**Phương pháp tầng ứng dụng**:

`X-Forwarded-For` là HTTP request header được dùng rộng rãi trong hệ sinh thái proxy HTTP dù chưa được chuẩn hóa chính thức; cơ chế tương ứng được chuẩn hóa bởi IETF là header `Forwarded`. Chúng đều thuộc về HTTP, không thể áp dụng trực tiếp cho các giao thức khác như SMTP. Các dịch vụ nghiệp vụ phía sau cũng không được tin tưởng vô điều kiện giá trị `X-Forwarded-For` do client truyền lên: các reverse proxy đáng tin cậy cần ghi đè hoặc chuẩn hóa giá trị truyền từ ngoài vào, và server chỉ nên bóc tách phần do các proxy nội bộ đã biết nối thêm vào.

**Phương pháp tầng vận chuyển**:

Tận dụng trường TCP Options để mang thông tin IP nguồn thực sự. Phương pháp này áp dụng được cho bất kỳ giao thức nào chạy trên TCP mà không bị giới hạn bởi tầng ứng dụng. Tuy nhiên đây không phải là chuẩn TCP mặc định nên đòi hỏi cả hai bên truyền thông phải được can thiệp điều chỉnh: Bên gửi phải có khả năng chèn IP thật vào TCP Options, bên nhận phải có khả năng đọc địa chỉ IP từ TCP Options ra.

Ngoài ra cũng có thể thông qua giao thức Proxy Protocol để truyền thông tin IP và Port của client. Phương pháp này có thể tận dụng Nginx, HAProxy hoặc các reverse proxy khác hỗ trợ giao thức này để lấy IP thực hoặc bóc tách IP thực tại server nghiệp vụ.

**Phương pháp tầng mạng**:

Mô hình Tunneling + DSR (Direct Server Return). Phương pháp này áp dụng được cho mọi giao thức, tuy nhiên việc triển khai khá phức tạp và tồn tại những ràng buộc nhất định, trong thực tế thường ít khi được sử dụng trừ các kiến trúc thông lượng đặc thù.

### Tác dụng của NAT là gì?

**NAT (Network Address Translation - Biên dịch địa chỉ mạng)** chủ yếu dùng để chuyển đổi địa chỉ IP giữa các mạng khác nhau. Nó cho phép ánh xạ địa chỉ IP private (như địa chỉ dùng trong mạng LAN) thành địa chỉ IP public (địa chỉ dùng trên Internet) hoặc ánh xạ ngược lại, từ đó giúp nhiều thiết bị trong mạng LAN có thể cùng truy cập Internet thông qua một địa chỉ IP public duy nhất.

NAT không chỉ giúp giảm bớt tình trạng khan hiếm địa chỉ IPv4 mà còn giúp che giấu địa chỉ và cấu trúc liên kết mạng nội bộ. Hành vi lọc của nhiều thiết bị NAT khiến lưu lượng từ bên ngoài không có sẵn bản ghi ánh xạ sẽ khó tiếp cận trực tiếp các host bên trong. Tuy nhiên, yếu tố quyết định gói tin nào được đi qua là chính sách lọc chứ không phải bản thân việc chuyển đổi địa chỉ. NAT không thể thay thế cho tường lửa có trạng thái, kiểm soát truy cập và các biện pháp bảo mật máy chủ.

![NAT thực hiện chuyển đổi địa chỉ IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-address-translation-f95898ff.jpg)

Đọc thêm: [Giải mã chi tiết giao thức NAT (Tầng mạng)](https://javaguide.cn/cs-basics/network/nat.html).

## ARP

### Địa chỉ MAC là gì?

Tên đầy đủ của địa chỉ MAC là **Địa chỉ điều khiển truy cập môi trường (Media Access Control Address)**, dùng để định danh giao diện tầng liên kết và truyền các khung dữ liệu (frame) trong mạng cục bộ. Nó thuộc về một giao diện mạng (card mạng) chứ không phải là chứng minh thư vĩnh viễn của toàn bộ thiết bị; một thiết bị có thể có nhiều giao diện mạng, mỗi giao diện có thể sử dụng một địa chỉ MAC khác nhau.

![Mặt sau của router thường ghi rõ địa chỉ MAC](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/router-back-will-indicate-mac-address-8fe99cd5.jpg)

Địa chỉ MAC còn thường được gọi là địa chỉ LAN, địa chỉ vật lý hoặc địa chỉ Ethernet. Khác với địa chỉ IP dùng cho định tuyến tầng mạng, địa chỉ MAC chủ yếu được sử dụng trong phạm vi liên kết hoặc miền quảng bá cục bộ hiện tại.

> Cần biết thêm rằng không chỉ tài nguyên mạng mới có địa chỉ IP, các thiết bị mạng cũng có địa chỉ IP, ví dụ như router. Nhưng về mặt cấu trúc, vai trò của router và thiết bị mạng là cấu thành nên một mạng (thường là mạng nội bộ), nên địa chỉ IP chúng dùng thường là IP nội bộ; các thiết bị nội bộ khi truyền thông ra ngoài mạng sẽ cần dùng tới giao thức NAT.

Địa chỉ MAC phổ biến trên Ethernet là định dạng EUI-48 gồm 6 byte (48 bit). Tổ chức IEEE cấp các khối địa chỉ với các kích thước khác nhau (MA-L, MA-M, MA-S) để các nhà sản xuất tiếp tục cấp phát địa chỉ quản lý toàn cầu; ngoài ra còn có địa chỉ quản lý cục bộ không cần IEEE cấp phát. Hệ điều hành hiện nay cũng có thể sửa đổi hoặc ngẫu nhiên hóa địa chỉ MAC nhằm bảo vệ quyền riêng tư, do đó địa chỉ MAC không đảm bảo vĩnh viễn không đổi.

Cuối cùng, hãy ghi nhớ địa chỉ MAC có một địa chỉ đặc biệt: `FF-FF-FF-FF-FF-FF` (địa chỉ toàn bit 1), đại diện cho địa chỉ quảng bá (broadcast address).

### ⭐️ Giao thức ARP giải quyết vấn đề gì?

Giao thức ARP, tên đầy đủ là **Giao thức phân giải địa chỉ (Address Resolution Protocol)**, giải quyết bài toán chuyển đổi giữa địa chỉ tầng mạng (IP) và địa chỉ tầng liên kết dữ liệu (MAC). Bởi vì một gói tin IP trong quá trình truyền tải vật lý luôn cần biết trạm tiếp theo (chặng vật lý tiếp theo) phải đi tới đâu; nhưng IP là địa chỉ logic, còn MAC mới là địa chỉ vật lý, và giao thức ARP đã giải quyết bài toán ánh xạ từ địa chỉ IP sang địa chỉ MAC.

### Nguyên lý hoạt động của giao thức ARP?

[Giải mã chi tiết giao thức ARP (Tầng mạng)](https://javaguide.cn/cs-basics/network/arp.html)

## Lời khuyên ôn tập

Rất khuyến khích các bạn đọc cuốn sách "Đồ giải HTTP" (*Illustrated HTTP*), cuốn sách này số trang không nhiều nhưng nội dung vô cùng phong phú, có ích lớn cho việc nắm bắt kiến thức mạng một cách hệ thống cũng như phục vụ phỏng vấn. Khi học môn này vào năm hai đại học, chúng tôi dùng giáo trình "Mạng máy tính (Tái bản lần 7)" của giáo sư Tạ Hy Nhân; cuốn giáo trình này rất dày và thiên nhiều về lý thuyết. Cuốn "Mạng máy tính: Tiếp cận từ trên xuống" (*Computer Networking: A Top-Down Approach*) cũng là một tài liệu tham khảo xuất sắc.

## Tham khảo

- *Đồ giải HTTP (Illustrated HTTP)*
- *Mạng máy tính: Tiếp cận từ trên xuống (Tái bản lần 7)*
- Giao thức Internet (IP) là gì?: <https://www.cloudflare.com/zh-cn/learning/network-layer/internet-protocol/>
- Các phương pháp truyền tải IP nguồn thực sự - Geek Time: <https://time.geekbang.org/column/article/497864>
- What Is NAT and What Are the Benefits of NAT Firewalls?: <https://community.fs.com/blog/what-is-nat-and-what-are-the-benefits-of-nat-firewalls.html>
